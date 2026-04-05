import { createCoordinationProof } from "@/lib/simulation/verification/proof";
import type { SimulationModule } from "@/lib/simulation/types";

export const executionModule: SimulationModule = {
  name: "execution",
  run(state, context) {
    const nextState = {
      ...state,
      tasks: { ...state.tasks },
      proofs: { ...state.proofs },
      agents: { ...state.agents }
    };

    Object.values(nextState.tasks)
      .filter((task) => task.status === "assigned" || task.status === "executing")
      .forEach((task) => {
        const executorId = task.assignedAgentIds[0];
        if (!executorId) {
          return;
        }

        const executor = nextState.agents[executorId];
        if (!executor || executor.status === "offline" || executor.failureState.isolated) {
          return;
        }

        if (task.status === "assigned") {
          nextState.tasks[task.id] = {
            ...task,
            status: "executing",
            startedAtTick: context.tick
          };

          context.addEvent({
            level: "info",
            category: "task",
            taskId: task.id,
            agentId: executor.id,
            title: "Execution initiated",
            description: `${executor.id} started ${task.id} in zone ${task.zone} after local agreement.`
          });

          return;
        }

        const elapsed = context.tick - (task.startedAtTick ?? context.tick);
        const done = elapsed >= task.estimatedEffort;
        if (!done) {
          return;
        }

        const proof = createCoordinationProof(nextState, task, executor, context.tick, context.rng);

        nextState.tasks[task.id] = {
          ...task,
          status: "verifying",
          completedClaimAtTick: context.tick
        };

        nextState.proofs[task.id] = proof;

        context.addMessage({
          from: executor.id,
          to: "broadcast",
          kind: "completion-claim",
          taskId: task.id,
          payload: {
            evidenceHash: proof.evidenceHash,
            confidence: proof.coordinationConfidence,
            witnessCount: proof.witnessEvidence.length
          }
        });

        context.addEvent({
          level: proof.status === "sufficient" ? "info" : "warning",
          category: "verification",
          taskId: task.id,
          agentId: executor.id,
          title: "Completion claimed",
          description:
            proof.status === "sufficient"
              ? `${task.id} submitted with witness quorum (${proof.witnessEvidence.length}/${proof.witnessThreshold}). Awaiting verifier review.`
              : `${task.id} claimed with weak evidence (${proof.witnessEvidence.length}/${proof.witnessThreshold}). Verifiers will likely block settlement.`
        });
      });

    return nextState;
  }
};
