import type { Agent, Task } from "@/lib/simulation/types";

export interface NegotiationScoreBreakdown {
  score: number;
  eta: number;
  confidence: number;
  loadFactor: number;
  trustFactor: number;
  batteryFactor: number;
}

export function scoreAgentForTask(agent: Agent, task: Task, regionalLatencyPenalty: number): NegotiationScoreBreakdown {
  const capabilityMatch = agent.capabilities.includes(task.type) ? 1 : 0.35;
  const zoneDistancePenalty = agent.region === task.zone ? 0 : 0.24;
  const eta = Math.max(1, Math.round((agent.metrics.latency + regionalLatencyPenalty) * (1 + zoneDistancePenalty) / 12));

  const batteryFactor = agent.metrics.battery / 100;
  const trustFactor = agent.metrics.trust / 100;
  const loadFactor = Math.max(0.1, 1 - agent.metrics.currentLoad / Math.max(1, agent.metrics.capacity));
  const healthFactor = agent.metrics.health / 100;

  const confidence = capabilityMatch * 0.34 + trustFactor * 0.2 + batteryFactor * 0.2 + healthFactor * 0.12 + loadFactor * 0.14;
  const urgencyWeight = task.urgency / 5;
  const score = confidence * 70 + loadFactor * 10 + trustFactor * 8 + batteryFactor * 8 + urgencyWeight * 4 - eta;

  return {
    score: Number(score.toFixed(2)),
    eta,
    confidence: Number(confidence.toFixed(3)),
    loadFactor: Number(loadFactor.toFixed(3)),
    trustFactor: Number(trustFactor.toFixed(3)),
    batteryFactor: Number(batteryFactor.toFixed(3))
  };
}
