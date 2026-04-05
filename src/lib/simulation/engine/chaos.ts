import type { Agent, ChaosAction, SimulationState, Task, TaskType } from "@/lib/simulation/types";

const taskTypeByIndex: TaskType[] = [
  "inspect-blackout-zone",
  "route-medical-package",
  "restore-sensor-relay",
  "escort-fragile-payload",
  "verify-outage-segment",
  "secure-unsafe-area"
];

const zones = ["north-grid", "east-warehouse", "metro-core", "south-corridor", "west-hills"];

function markOffline(agent: Agent, tick: number, duration: number): Agent {
  return {
    ...agent,
    status: "offline",
    failureState: {
      ...agent.failureState,
      offlineUntilTick: tick + duration
    }
  };
}

function urgentTask(state: SimulationState, tick: number, rng: () => number): Task {
  const type = taskTypeByIndex[Math.floor(rng() * taskTypeByIndex.length)] ?? taskTypeByIndex[0];
  const zone = zones[Math.floor(rng() * zones.length)] ?? zones[0];
  const id = `task-${String(Object.keys(state.tasks).length + 1).padStart(3, "0")}`;

  return {
    id,
    type,
    urgency: 5,
    zone,
    requiredCapabilities: [type],
    estimatedEffort: 3,
    createdAtTick: tick,
    assignedAgentIds: [],
    status: "queued",
    verificationStatus: "pending",
    settlementStatus: "blocked",
    riskLevel: 5
  };
}

export function applyChaosAction(state: SimulationState, action: ChaosAction, tick: number, rng: () => number): SimulationState {
  if (action.type === "reset") {
    return state;
  }

  const nextState = {
    ...state,
    agents: { ...state.agents },
    tasks: { ...state.tasks },
    network: {
      ...state.network,
      degradedRegions: { ...state.network.degradedRegions }
    }
  };

  if (action.type === "kill-agent") {
    const targetId = String(action.payload?.agentId ?? "");
    const target = nextState.agents[targetId];
    if (target) {
      nextState.agents[targetId] = markOffline(target, tick, 8);
    }
    return nextState;
  }

  if (action.type === "degrade-network") {
    const zone = String(action.payload?.zone ?? zones[Math.floor(rng() * zones.length)]);
    const penalty = Number(action.payload?.penalty ?? Math.round(40 + rng() * 60));
    nextState.network.degradedRegions[zone] = penalty;
    nextState.network.baselineLatency += Math.round(penalty * 0.2);
    return nextState;
  }

  if (action.type === "spawn-fake-completion") {
    const agentId = String(action.payload?.agentId ?? "");
    const taskId = String(action.payload?.taskId ?? "");
    const agent = nextState.agents[agentId];
    const task = nextState.tasks[taskId];

    if (agent) {
      nextState.agents[agent.id] = {
        ...agent,
        failureState: {
          ...agent.failureState,
          liarMode: true
        },
        status: agent.status === "offline" ? "degraded" : agent.status
      };
    }

    if (task) {
      nextState.tasks[task.id] = {
        ...task,
        assignedAgentIds: agent ? [agent.id] : task.assignedAgentIds,
        status: "executing",
        startedAtTick: tick - task.estimatedEffort - 1
      };
    }

    return nextState;
  }

  if (action.type === "add-urgent-task") {
    const newTask = urgentTask(nextState, tick, rng);
    nextState.tasks[newTask.id] = newTask;
  }

  return nextState;
}
