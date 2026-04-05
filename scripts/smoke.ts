import { runSimulationTicks } from "../src/lib/simulation/runner";

const outcome = runSimulationTicks(30, {
  4: [{ type: "add-urgent-task" }],
  6: [{ type: "degrade-network", payload: { zone: "metro-core", penalty: 80 } }],
  9: [{ type: "kill-agent", payload: { agentId: "agent-04" } }],
  12: [{ type: "spawn-fake-completion", payload: { agentId: "agent-03", taskId: "task-001" } }]
});

const summary = {
  tick: outcome.tick,
  settled: Object.values(outcome.tasks).filter((task) => task.status === "settled").length,
  failed: Object.values(outcome.tasks).filter((task) => task.status === "failed").length,
  receipts: outcome.settlementReceipts.length,
  rejectedFake: outcome.metrics.falseCompletionsRejected,
  events: outcome.events.length
};

if (summary.tick !== 30) {
  throw new Error("Smoke failure: expected 30 ticks");
}

if (summary.events < 10) {
  throw new Error("Smoke failure: not enough simulation events");
}

console.log("BLACKOUT smoke summary", summary);
