import type { Task, TaskType, SimulationModule } from "@/lib/simulation/types";

const taskTypes: TaskType[] = [
  "inspect-blackout-zone",
  "route-medical-package",
  "restore-sensor-relay",
  "escort-fragile-payload",
  "verify-outage-segment",
  "secure-unsafe-area"
];

const zones = ["north-grid", "east-warehouse", "metro-core", "south-corridor", "west-hills"];

function createTask(id: string, tick: number, type: TaskType, zone: string): Task {
  return {
    id,
    type,
    urgency: 5,
    zone,
    requiredCapabilities: [type],
    estimatedEffort: 4,
    createdAtTick: tick,
    status: "queued",
    assignedAgentIds: [],
    verificationStatus: "pending",
    settlementStatus: "blocked",
    riskLevel: 4
  };
}

export const taskGenerationModule: SimulationModule = {
  name: "task-generation",
  run(state, context) {
    if (context.tick < 2 || context.tick % 9 !== 0) {
      return state;
    }

    const nextState = {
      ...state,
      tasks: { ...state.tasks }
    };

    const id = `task-${String(Object.keys(nextState.tasks).length + 1).padStart(3, "0")}`;
    const type = taskTypes[Math.floor(context.rng() * taskTypes.length)] ?? taskTypes[0];
    const zone = zones[Math.floor(context.rng() * zones.length)] ?? zones[0];

    nextState.tasks[id] = createTask(id, context.tick, type, zone);

    context.addEvent({
      level: "warning",
      category: "task",
      taskId: id,
      title: "Urgent task injected",
      description: `${id} (${type}) appeared in ${zone} due to blackout escalation.`
    });

    return nextState;
  }
};
