"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useSimulationStore } from "@/store/simulation-store";

const statusTone: Record<string, "info" | "success" | "warning" | "danger" | "muted"> = {
  queued: "muted",
  negotiating: "info",
  assigned: "info",
  executing: "warning",
  verifying: "warning",
  settled: "success",
  failed: "danger"
};

export function TaskQueuePanel() {
  const { state } = useSimulationStore();
  const tasks = Object.values(state.tasks).sort((left, right) => right.urgency - left.urgency || left.createdAtTick - right.createdAtTick);

  return (
    <Card className="h-[360px] overflow-hidden">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-info">Live Task Queue</h3>
        <Badge tone="muted">{tasks.length} total</Badge>
      </div>

      <div className="space-y-2 overflow-y-auto pr-1">
        {tasks.map((task) => (
          <article key={task.id} className="rounded-xl border border-white/10 bg-panelSoft/70 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold">{task.id}</p>
              <Badge tone={statusTone[task.status] ?? "muted"}>{task.status}</Badge>
            </div>
            <p className="mt-1 text-xs text-muted">{task.type.replaceAll("-", " ")} · zone {task.zone}</p>
            <p className="mt-2 text-[11px] text-muted">
              urgency {task.urgency}/5 · risk {task.riskLevel}/5 · assignees {task.assignedAgentIds.join(", ") || "none"}
            </p>
          </article>
        ))}
      </div>
    </Card>
  );
}
