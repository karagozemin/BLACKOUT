import { scoreAgentForTask } from "@/lib/simulation/engine/scoring";
import type { NegotiationProposal, SimulationModule } from "@/lib/simulation/types";

export const negotiationModule: SimulationModule = {
  name: "negotiation",
  run(state, context) {
    const nextState = {
      ...state,
      tasks: { ...state.tasks },
      agents: { ...state.agents }
    };

    const queuedTasks = Object.values(nextState.tasks).filter((task) => task.status === "queued" || task.status === "negotiating");

    queuedTasks.forEach((task) => {
      const proposals: NegotiationProposal[] = Object.values(nextState.agents)
        .filter((agent) => {
          if (agent.status === "offline" || agent.status === "isolated" || agent.failureState.isolated) {
            return false;
          }
          if (agent.metrics.currentLoad >= agent.metrics.capacity) {
            return false;
          }
          const localReachability = agent.region === task.zone || agent.peers.some((peerId) => nextState.agents[peerId]?.region === task.zone);
          if (!localReachability && context.rng() > 0.25) {
            return false;
          }
          return task.requiredCapabilities.some((capability) => agent.capabilities.includes(capability));
        })
        .map((agent) => {
          const regionPenalty = nextState.network.degradedRegions[agent.region] ?? 0;
          const breakdown = scoreAgentForTask(agent, task, regionPenalty);

          return {
            taskId: task.id,
            proposerAgentId: agent.id,
            score: breakdown.score,
            eta: breakdown.eta,
            confidence: breakdown.confidence,
            loadFactor: breakdown.loadFactor,
            trustFactor: breakdown.trustFactor,
            batteryFactor: breakdown.batteryFactor
          };
        })
        .sort((left, right) => right.score - left.score);

      if (proposals.length < 1) {
        nextState.tasks[task.id] = {
          ...task,
          status: "queued",
          negotiationRound: Math.max(task.negotiationRound, 1)
        };

        context.addEvent({
          level: "warning",
          category: "negotiation",
          title: "No local proposals",
          taskId: task.id,
          description: `${task.id} did not find a capable neighborhood quorum this tick.`
        });
        return;
      }

      const topCandidates = proposals.slice(0, 3);
      topCandidates.forEach((proposal) => {
        context.addMessage({
          from: proposal.proposerAgentId,
          to: "broadcast",
          kind: "proposal",
          taskId: task.id,
          payload: {
            score: proposal.score,
            eta: proposal.eta,
            confidence: proposal.confidence
          }
        });
      });

      if (task.status === "queued") {
        nextState.tasks[task.id] = {
          ...task,
          status: "negotiating",
          negotiationRound: 1,
          coordinationPath: topCandidates.map((proposal) => proposal.proposerAgentId)
        };

        context.addEvent({
          level: "info",
          category: "negotiation",
          title: "Local bidding opened",
          taskId: task.id,
          description: `${task.id} entered round-1 bidding with ${topCandidates.length} nearby candidates.`
        });
        return;
      }

      const winner = proposals[0];
      const backup = proposals[1];
      const executor = nextState.agents[winner.proposerAgentId];
      const scoreGap = winner && backup ? Number((winner.score - backup.score).toFixed(2)) : 999;

      if (!executor) {
        return;
      }

      if (backup && scoreGap < 2.5 && task.negotiationRound < 2) {
        nextState.tasks[task.id] = {
          ...task,
          status: "negotiating",
          negotiationRound: task.negotiationRound + 1,
          coordinationPath: [winner.proposerAgentId, backup.proposerAgentId]
        };

        context.addMessage({
          from: backup.proposerAgentId,
          to: winner.proposerAgentId,
          kind: "counter-proposal",
          taskId: task.id,
          payload: {
            scoreGap,
            challenger: backup.proposerAgentId,
            leader: winner.proposerAgentId
          }
        });

        context.addEvent({
          level: "warning",
          category: "negotiation",
          title: "Counter-proposal issued",
          taskId: task.id,
          description: `${task.id} remains contested (${winner.proposerAgentId} vs ${backup.proposerAgentId}, gap ${scoreGap}). Escalating to round-${task.negotiationRound + 1}.`
        });
        return;
      }

      nextState.tasks[task.id] = {
        ...task,
        status: "assigned",
        assignedAgentIds: backup ? [winner.proposerAgentId, backup.proposerAgentId] : [winner.proposerAgentId],
        negotiationRound: 0,
        coordinationPath: backup ? [winner.proposerAgentId, backup.proposerAgentId] : [winner.proposerAgentId]
      };

      nextState.agents[executor.id] = {
        ...executor,
        status: "busy",
        metrics: {
          ...executor.metrics,
          currentLoad: executor.metrics.currentLoad + 1
        },
        assignedTaskIds: [...executor.assignedTaskIds, task.id]
      };

      context.addMessage({
        from: winner.proposerAgentId,
        to: "broadcast",
        kind: "acceptance",
        taskId: task.id,
        payload: {
          score: winner.score,
          eta: winner.eta,
          backup: backup?.proposerAgentId
        }
      });

      context.addEvent({
        level: "info",
        category: "negotiation",
        title: "Local consensus reached",
        taskId: task.id,
        agentId: winner.proposerAgentId,
        description: `${task.id} converged on ${winner.proposerAgentId} (score ${winner.score}, ETA ${winner.eta}m, gap ${scoreGap}) with ${backup ? `${backup.proposerAgentId} as fallback.` : "no fallback candidate."}`
      });
    });

    return nextState;
  }
};
