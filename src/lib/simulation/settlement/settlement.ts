import type { SettlementReceipt, SimulationState, VerificationDecision } from "@/lib/simulation/types";
import { pseudoHash } from "@/lib/simulation/utils/hash";

export function canSettle(decisions: VerificationDecision[], proofConfidence: number) {
  const approvals = decisions.filter((decision) => decision.verdict === "approve").length;
  const rejects = decisions.filter((decision) => decision.verdict === "reject").length;

  return {
    allowed: approvals >= 2 && rejects === 0 && proofConfidence >= 0.58,
    approvals,
    rejects
  };
}

export function createSettlementReceipt(
  state: SimulationState,
  taskId: string,
  participants: string[],
  evidenceHash: string,
  decisions: VerificationDecision[]
): SettlementReceipt {
  const baseReward = 200;
  const uniqueParticipants = [...new Set(participants)];
  const each = Math.max(20, Math.round(baseReward / Math.max(1, uniqueParticipants.length)));

  const rewardAllocation = uniqueParticipants.reduce<Record<string, number>>((allocation, id) => {
    allocation[id] = each;
    return allocation;
  }, {});

  return {
    id: pseudoHash(`${taskId}-${state.tick}-${evidenceHash}`),
    taskId,
    participants: uniqueParticipants,
    evidenceHash,
    verifierSignatures: decisions.map((decision) => ({
      verifierAgentId: decision.verifierAgentId,
      verdict: decision.verdict,
      tick: decision.tick
    })),
    rewardAllocation,
    proofStatus: "verified",
    createdAtTick: state.tick
  };
}
