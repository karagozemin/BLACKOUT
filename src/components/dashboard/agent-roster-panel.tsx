"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useSimulationStore } from "@/store/simulation-store";

function tone(status: string) {
  if (status === "offline" || status === "isolated") return "danger";
  if (status === "busy") return "warning";
  if (status === "degraded") return "info";
  return "success";
}

export function AgentRosterPanel() {
  const { state } = useSimulationStore();
  const agents = Object.values(state.agents);

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-info">Agent Roster</h3>
        <Badge tone="muted">{agents.length} heterogeneous nodes</Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-xs">
          <thead className="text-muted">
            <tr>
              <th className="px-2 py-2">Agent</th>
              <th className="px-2 py-2">Role</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2">Region</th>
              <th className="px-2 py-2">Health</th>
              <th className="px-2 py-2">Trust</th>
              <th className="px-2 py-2">Battery</th>
              <th className="px-2 py-2">Latency</th>
              <th className="px-2 py-2">Load</th>
              <th className="px-2 py-2">Assigned Tasks</th>
              <th className="px-2 py-2">Failovers</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <tr key={agent.id} className="border-t border-white/10">
                <td className="px-2 py-2 font-semibold">{agent.id}</td>
                <td className="px-2 py-2 text-muted">{agent.role}</td>
                <td className="px-2 py-2">
                  <Badge tone={tone(agent.status)}>{agent.status}</Badge>
                </td>
                <td className="px-2 py-2 text-muted">{agent.region}</td>
                <td className="px-2 py-2">{agent.metrics.health}</td>
                <td className="px-2 py-2">{agent.metrics.trust}</td>
                <td className="px-2 py-2">{agent.metrics.battery}</td>
                <td className="px-2 py-2">{agent.metrics.latency} ms</td>
                <td className="px-2 py-2">
                  {agent.metrics.currentLoad}/{agent.metrics.capacity}
                </td>
                <td className="px-2 py-2 text-muted">{agent.assignedTaskIds.join(", ") || "-"}</td>
                <td className="px-2 py-2">{agent.failoverCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
