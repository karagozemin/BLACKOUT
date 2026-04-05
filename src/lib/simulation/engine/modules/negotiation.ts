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
          if (agent.status === "offline" || agent.status === "isolated") {
            return false;
          }
          if (agent.metrics.currentLoad >= agent.metrics.capacity) {
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
        return;
      }

      const winner = proposals[0];
      const backup = proposals[1];
      const executor = nextState.agents[winner.proposerAgentId];

      if (!executor) {
        return;
      }

      nextState.tasks[task.id] = {
        ...task,
        status: "assigned",
        assignedAgentIds: backup ? [winner.proposerAgentId, backup.proposerAgentId] : [winner.proposerAgentId]
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
        description: `${task.id} converged on ${winner.proposerAgentId} (score ${winner.score}, ETA ${winner.eta}m) with ${backup ? `${backup.proposerAgentId} as fallback.` : "no fallback candidate."}`
      });
    });

    return nextState;
  }
};
