"use client";

import { Card } from "@/components/ui/card";
import { useSimulationStore } from "@/store/simulation-store";

export function MissionStatusPanel() {
  const { state } = useSimulationStore();
  const total = Object.keys(state.tasks).length;
  const settled = Object.values(state.tasks).filter((task) => task.status === "settled").length;
  const failed = Object.values(state.tasks).filter((task) => task.status === "failed").length;

  const rows = [
    ["Tasks settled", settled],
    ["Tasks failed", failed],
    ["Total tasks", total],
    ["Failovers handled", state.metrics.failoversHandled],
    ["Rejected fake claims", state.metrics.falseCompletionsRejected],
    ["Malicious nodes isolated", state.metrics.maliciousAgentsIsolated],
    ["Dropped messages", state.metrics.droppedMessages],
    ["Settlement receipts", state.metrics.settlementSuccessCount]
  ];

  return (
    <Card>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-info">Mission Status</h3>
      <p className="mt-1 text-xs text-muted">Local coordination, resilience, and security posture at current tick.</p>
      <div className="mt-3 space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between rounded-lg border border-white/10 bg-panelSoft/70 px-3 py-2 text-xs">
            <span className="text-muted">{label}</span>
            <span className="font-semibold">{value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
