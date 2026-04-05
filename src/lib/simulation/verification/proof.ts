import type { Agent, CoordinationProof, ProofEvidence, SimulationState, Task } from "@/lib/simulation/types";
import { pseudoHash } from "@/lib/simulation/utils/hash";

function buildEvidence(
  witnesses: Agent[],
  taskId: string,
  tick: number,
  rng: () => number,
  liarPenalty: number
): ProofEvidence[] {
  return witnesses.map((witness) => {
    const confidenceRaw = Math.max(0.12, witness.metrics.trust / 100 - liarPenalty + rng() * 0.15);

    return {
      witnessAgentId: witness.id,
      kind: rng() > 0.6 ? "zone-confirmation" : rng() > 0.5 ? "relay-log" : "telemetry",
      confidence: Number(Math.min(0.98, confidenceRaw).toFixed(3)),
      contentHash: pseudoHash(`${witness.id}-${taskId}-${tick}-${Math.round(confidenceRaw * 1000)}`),
      observedAtTick: tick
    };
  });
}

export function createCoordinationProof(
  state: SimulationState,
  task: Task,
  claimant: Agent,
  tick: number,
  rng: () => number
): CoordinationProof {
  const witnessThreshold = 2;
  const liarPenalty = claimant.failureState.liarMode ? 0.3 : 0;

  const witnessPool = Object.values(state.agents).filter((agent) => {
    if (agent.id === claimant.id) {
      return false;
    }
    if (agent.status === "offline" || agent.failureState.isolated) {
      return false;
    }
    return agent.region === task.zone || agent.peers.includes(claimant.id);
  });

  const witnessCount = Math.min(witnessPool.length, 2 + Math.floor(rng() * 3));
  const selectedWitnesses = witnessPool.slice(0, witnessCount);
  const witnessEvidence = buildEvidence(selectedWitnesses, task.id, tick, rng, liarPenalty);

  const evidenceScore = witnessEvidence.reduce((accumulator, item) => accumulator + item.confidence, 0);
  const normalizedScore = witnessEvidence.length > 0 ? evidenceScore / witnessEvidence.length : 0;
  const thresholdFactor = Math.min(1, witnessEvidence.length / witnessThreshold);
  const coordinationConfidence = Number((normalizedScore * thresholdFactor).toFixed(3));

  const status = witnessEvidence.length >= witnessThreshold && coordinationConfidence >= 0.58 ? "sufficient" : "insufficient";
  const evidenceHash = pseudoHash(
    `${task.id}:${claimant.id}:${witnessEvidence.map((item) => item.contentHash).join("|")}:${coordinationConfidence}`
  );

  return {
    taskId: task.id,
    claimantAgentId: claimant.id,
    witnessEvidence,
    witnessThreshold,
    coordinationConfidence,
    evidenceHash,
    status
  };
}
