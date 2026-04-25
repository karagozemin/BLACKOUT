import { createInitialState, runTick } from "../src/lib/simulation/engine/tick-engine";
import type { ChaosAction } from "../src/lib/simulation/types";
import { syncSnapshotToSwarm } from "../src/lib/integrations/swarm-sync";

function toSnapshot(state: ReturnType<typeof createInitialState>) {
  const tasks = Object.values(state.tasks);
  return {
    tick: state.tick,
    activeTasks: tasks.filter((task) => task.status !== "settled" && task.status !== "failed").length,
    settledTasks: tasks.filter((task) => task.status === "settled").length,
    running: state.running,
    metrics: {
      droppedMessages: state.metrics.droppedMessages,
      falseCompletionsRejected: state.metrics.falseCompletionsRejected,
      failoversHandled: state.metrics.failoversHandled
    },
    events: state.events.slice(-8).map((event) => ({
      id: event.id,
      level: event.level,
      category: event.category,
      title: event.title,
      description: event.description
    })),
    messages: state.messages.slice(-10).map((message) => ({
      id: message.id,
      from: message.from,
      to: String(message.to),
      kind: message.kind,
      taskId: message.taskId
    }))
  };
}

async function main() {
  let state = createInitialState(42);

  const actionsByTick: Record<number, ChaosAction[]> = {
    3: [{ type: "add-urgent-task" }],
    5: [{ type: "degrade-network", payload: { zone: "metro-core", penalty: 70 } }],
    7: [{ type: "kill-agent", payload: { agentId: "agent-04" } }],
    9: [{ type: "spawn-fake-completion", payload: { agentId: "agent-03", taskId: "task-001" } }]
  };

  const syncReports = [];

  for (let tick = 1; tick <= 12; tick += 1) {
    state = runTick(state, actionsByTick[tick] ?? []);

    if (tick % 3 === 0 || tick === 12) {
      const report = await syncSnapshotToSwarm(toSnapshot(state));
      syncReports.push({ tick, report });
    }
  }

  const summary = {
    tick: state.tick,
    settledTasks: Object.values(state.tasks).filter((task) => task.status === "settled").length,
    rejectedFake: state.metrics.falseCompletionsRejected,
    syncAttempts: syncReports.length,
    mqttSuccesses: syncReports.filter((item) => item.report.mqttPublished).length,
    foxmqSuccesses: syncReports.filter((item) => item.report.foxmqPublished).length,
    vertexSources: syncReports.map((item) => item.report.vertexAdviceSource)
  };

  if (summary.tick !== 12) {
    throw new Error("Networked smoke failure: expected 12 ticks");
  }

  console.log("BLACKOUT networked smoke summary", summary);
  console.log("Last sync report", syncReports.at(-1));
}

void main();
