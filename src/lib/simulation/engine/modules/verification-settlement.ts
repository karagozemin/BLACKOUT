import { createSettlementReceipt, canSettle } from "@/lib/simulation/settlement/settlement";
import { runVerification } from "@/lib/simulation/verification/verifier";
import type { SimulationModule } from "@/lib/simulation/types";

export const verificationSettlementModule: SimulationModule = {
  name: "verification-settlement",
  run(state, context) {
    const nextState = {
      ...state,
      tasks: { ...state.tasks },
      agents: { ...state.agents },
      verificationDecisions: [...state.verificationDecisions],
      settlementReceipts: [...state.settlementReceipts],
      metrics: { ...state.metrics }
    };

    Object.values(nextState.tasks)
      .filter((task) => task.status === "verifying")
      .forEach((task) => {
        const proof = nextState.proofs[task.id];
        if (!proof) {
          return;
        }

        const alreadyDecided = nextState.verificationDecisions.some((decision) => decision.taskId === task.id && decision.tick >= context.tick - 1);
        if (alreadyDecided) {
          return;
        }

        const verification = runVerification(nextState, proof, context.tick, context.rng);

        nextState.verificationDecisions.push(...verification.decisions);

        verification.decisions.forEach((decision) => {
          context.addEvent({
            level: decision.verdict === "approve" ? "success" : "danger",
            category: "verification",
            taskId: task.id,
            agentId: decision.verifierAgentId,
            title: `Verifier ${decision.verdict}`,
            description: `${decision.verifierAgentId} ${decision.verdict === "approve" ? "approved" : "rejected"} ${task.id}: ${decision.reason}`
          });
        });

        if (!verification.approved) {
          const claimant = nextState.agents[proof.claimantAgentId];
          if (claimant?.failureState.liarMode && !claimant.failureState.isolated) {
            nextState.agents[claimant.id] = {
              ...claimant,
              status: "isolated",
              failureState: {
                ...claimant.failureState,
                isolated: true
              },
              metrics: {
                ...claimant.metrics,
                trust: Math.max(0, claimant.metrics.trust - 28)
              }
            };
            nextState.metrics.maliciousAgentsIsolated += 1;

            context.addEvent({
              level: "danger",
              category: "agent",
              agentId: claimant.id,
              taskId: task.id,
              title: "Malicious node isolated",
              description: `${claimant.id} was isolated after submitting unverifiable completion evidence for ${task.id}.`
            });
          }

          nextState.tasks[task.id] = {
            ...task,
            verificationStatus: "rejected",
            settlementStatus: "blocked",
            status: "failed",
            rejectionReason: verification.decisions.find((decision) => decision.verdict === "reject")?.reason
          };

          if (proof.anomalyFlags.includes("claimant_flagged_malicious")) {
            nextState.metrics.falseCompletionsRejected += 1;
          }

          context.addEvent({
            level: "danger",
            category: "settlement",
            taskId: task.id,
            title: "Settlement blocked",
            description: `${task.id} failed proof gating. Payment frozen until a valid coordination proof exists.`
          });
          return;
        }

        const gate = canSettle(verification.decisions, proof.coordinationConfidence);
        if (!gate.allowed) {
          nextState.tasks[task.id] = {
            ...task,
            verificationStatus: "approved",
            settlementStatus: "blocked"
          };

          context.addEvent({
            level: "warning",
            category: "settlement",
            taskId: task.id,
            title: "Settlement awaiting stronger proof",
            description: `${task.id} has verifier approval but still lacks confidence/quorum thresholds for payout.`
          });

          return;
        }

        const receipt = createSettlementReceipt(
          nextState,
          task.id,
          [proof.claimantAgentId, ...proof.witnessEvidence.map((item) => item.witnessAgentId)],
          proof.evidenceHash,
          verification.decisions
        );

        nextState.settlementReceipts.push(receipt);
        nextState.tasks[task.id] = {
          ...task,
          verificationStatus: "approved",
          settlementStatus: "settled",
          status: "settled",
          rejectionReason: undefined
        };
        nextState.metrics.tasksCompleted += 1;
        nextState.metrics.settlementSuccessCount += 1;

        const coordinationLatency = Math.max(1, context.tick - task.createdAtTick);
        nextState.metrics.averageCoordinationLatency = Number(
          ((nextState.metrics.averageCoordinationLatency + coordinationLatency) / 2).toFixed(2)
        );

        context.addEvent({
          level: "success",
          category: "settlement",
          taskId: task.id,
          title: "Settlement finalized",
          description: `${task.id} settled with receipt ${receipt.id}. Proof hash ${receipt.evidenceHash} confirmed by verifier quorum.`
        });
      });

    return nextState;
  }
};
