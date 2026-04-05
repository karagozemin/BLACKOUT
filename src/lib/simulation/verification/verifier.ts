import type { CoordinationProof, SimulationState, VerificationDecision } from "@/lib/simulation/types";

function decisionReason(proof: CoordinationProof, liarMode: boolean) {
  if (liarMode) {
    return "Claimant flagged as malicious: witness telemetry conflict detected.";
  }

  if (proof.anomalyFlags.includes("insufficient_witness_quorum")) {
    return "Insufficient witness quorum for coordination proof.";
  }

  if (proof.anomalyFlags.includes("low_coordination_confidence")) {
    return "Coordination confidence below settlement threshold.";
  }

  if (proof.witnessEvidence.length < proof.witnessThreshold) {
    return "Insufficient witness quorum for coordination proof.";
  }

  if (proof.coordinationConfidence < 0.58) {
    return "Coordination confidence below settlement threshold.";
  }

  return "Proof satisfies quorum and confidence constraints.";
}

export function runVerification(state: SimulationState, proof: CoordinationProof, tick: number, rng: () => number) {
  const verifierAgents = Object.values(state.agents).filter(
    (agent) => (agent.role === "verifier-a" || agent.role === "verifier-b") && agent.status !== "offline"
  );

  const claimant = state.agents[proof.claimantAgentId];
  const liarMode = claimant?.failureState.liarMode ?? false;

  const decisions: VerificationDecision[] = verifierAgents.map((verifier) => {
    const confidenceBase = proof.coordinationConfidence + verifier.metrics.trust / 200 + rng() * 0.08;
    const approve = !liarMode && proof.status === "sufficient" && confidenceBase > 0.6;

    return {
      taskId: proof.taskId,
      verifierAgentId: verifier.id,
      verdict: approve ? "approve" : "reject",
      reason: decisionReason(proof, liarMode),
      confidence: Number(Math.min(0.99, confidenceBase).toFixed(3)),
      tick
    };
  });

  const approvals = decisions.filter((decision) => decision.verdict === "approve").length;
  const rejects = decisions.length - approvals;

  return {
    decisions,
    approved: approvals >= 2 && rejects === 0,
    approvals,
    rejects
  };
}
