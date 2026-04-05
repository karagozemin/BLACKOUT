import type { Agent, AgentRole, NetworkCondition, Task, TaskType } from "@/lib/simulation/types";
import { randomBetween, randomFrom } from "@/lib/simulation/utils/rng";

const roleBlueprint: AgentRole[] = [
  "scout",
  "router",
  "dispatch",
  "executor",
  "battery-manager",
  "safety",
  "verifier-a",
  "verifier-b",
  "reputation",
  "settlement",
  "reserve",
  "relay"
];

const taskTypes: TaskType[] = [
  "inspect-blackout-zone",
  "route-medical-package",
  "restore-sensor-relay",
  "escort-fragile-payload",
  "verify-outage-segment",
  "secure-unsafe-area"
];

const regions = ["north-grid", "east-warehouse", "metro-core", "south-corridor", "west-hills"];

export function createSeedAgents(rng: () => number, count = 14): Record<string, Agent> {
  const agents: Record<string, Agent> = {};

  for (let index = 0; index < count; index += 1) {
    const role = roleBlueprint[index % roleBlueprint.length] ?? "executor";
    const id = `agent-${String(index + 1).padStart(2, "0")}`;
    const region = randomFrom(rng, regions);
    const capabilities = taskTypes.filter(() => rng() > 0.4);

    agents[id] = {
      id,
      role,
      region,
      status: "online",
      metrics: {
        health: Math.round(randomBetween(rng, 75, 100)),
        trust: Math.round(randomBetween(rng, 58, 94)),
        battery: Math.round(randomBetween(rng, 45, 100)),
        latency: Math.round(randomBetween(rng, 20, 120)),
        capacity: Math.round(randomBetween(rng, 2, 5)),
        currentLoad: 0
      },
      capabilities: capabilities.length > 0 ? capabilities : [randomFrom(rng, taskTypes)],
      peers: [],
      assignedTaskIds: [],
      failureState: {
        liarMode: false,
        isolated: false
      },
      messageHistory: [],
      failoverCount: 0
    };
  }

  const ids = Object.keys(agents);
  ids.forEach((id) => {
    const peerCount = 3 + Math.floor(rng() * 4);
    const peerSet = new Set<string>();
    while (peerSet.size < peerCount) {
      const candidate = randomFrom(rng, ids);
      if (candidate !== id) {
        peerSet.add(candidate);
      }
    }
    agents[id].peers = [...peerSet];
  });

  return agents;
}

export function createSeedTasks(rng: () => number): Record<string, Task> {
  const tasks: Record<string, Task> = {};
  const count = 4;

  for (let index = 0; index < count; index += 1) {
    const type = randomFrom(rng, taskTypes);
    const id = `task-${String(index + 1).padStart(3, "0")}`;

    tasks[id] = {
      id,
      type,
      urgency: (Math.floor(randomBetween(rng, 2, 5.99)) as 2 | 3 | 4 | 5),
      zone: randomFrom(rng, regions),
      requiredCapabilities: [type],
      estimatedEffort: Math.round(randomBetween(rng, 4, 9)),
      createdAtTick: 0,
      status: "queued",
      assignedAgentIds: [],
      verificationStatus: "pending",
      settlementStatus: "blocked",
      riskLevel: (Math.floor(randomBetween(rng, 1, 5.99)) as 1 | 2 | 3 | 4 | 5),
      negotiationRound: 0,
      coordinationPath: []
    };
  }

  return tasks;
}

export function createSeedNetwork(): NetworkCondition {
  return {
    baselineLatency: 50,
    droppedMessageRate: 0.06,
    degradedRegions: {}
  };
}
