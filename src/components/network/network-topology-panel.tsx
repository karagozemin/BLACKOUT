"use client";

import { useMemo } from "react";
import {
  Background,
  Controls,
  ReactFlow,
  type Edge,
  type Node
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Card } from "@/components/ui/card";
import type { SimulationState } from "@/lib/simulation/types";
import { useSimulationStore } from "@/store/simulation-store";

interface AgentNodeData extends Record<string, unknown> {
  label: string;
  role: string;
  status: string;
  trust: number;
}

const statusColor: Record<string, string> = {
  online: "#18C787",
  busy: "#F9A826",
  degraded: "#4AA6FF",
  offline: "#F75C5C",
  isolated: "#F75C5C"
};

const legend = [
  { label: "Online", color: statusColor.online },
  { label: "Busy", color: statusColor.busy },
  { label: "Degraded", color: statusColor.degraded },
  { label: "Offline/Isolated", color: statusColor.offline }
];

export function NetworkTopologyPanel({ stateOverride, compact = false }: { stateOverride?: SimulationState; compact?: boolean }) {
  const { state: liveState } = useSimulationStore();
  const state = stateOverride ?? liveState;

  const { nodes, edges } = useMemo(() => {
    const agents = Object.values(state.agents);

    const builtNodes: Node<AgentNodeData>[] = agents.map((agent, index) => {
      const radius = 250;
      const angle = (Math.PI * 2 * index) / Math.max(1, agents.length);
      const x = 320 + Math.cos(angle) * radius;
      const y = 280 + Math.sin(angle) * radius;

      return {
        id: agent.id,
        position: { x, y },
        data: {
          label: agent.id,
          role: agent.role,
          status: agent.status,
          trust: agent.metrics.trust
        },
        style: {
          width: 144,
          borderRadius: 12,
          padding: 8,
          border: `1px solid ${statusColor[agent.status] ?? "#4AA6FF"}`,
          background: "linear-gradient(145deg, rgba(15, 27, 46, 0.96), rgba(10, 18, 33, 0.96))",
          color: "#E5ECFF",
          boxShadow: "inset 0 1px 0 rgba(160,190,255,0.18), 0 0 22px rgba(59,130,246,0.18)",
          fontSize: 11,
          letterSpacing: "0.02em"
        }
      };
    });

    const builtEdges: Edge[] = [];
    agents.forEach((agent) => {
      agent.peers.forEach((peerId) => {
        const edgeId = `${agent.id}-${peerId}`;
        if (!builtEdges.some((edge) => edge.id === edgeId || edge.id === `${peerId}-${agent.id}`)) {
          builtEdges.push({
            id: edgeId,
            source: agent.id,
            target: peerId,
            style: {
              stroke: "rgba(77, 126, 238, 0.42)",
              strokeWidth: 1.1
            },
            animated: contextEdgeAnimated(agent.id, peerId, state)
          });
        }
      });
    });

    return { nodes: builtNodes, edges: builtEdges };
  }, [state]);

  return (
    <Card className={compact ? "h-[420px] overflow-hidden p-2" : "h-[640px] overflow-hidden p-2"}>
      <div className="mb-2 px-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-info">Peer-to-Peer Network Topology</h3>
          <div className="flex flex-wrap gap-1.5">
            {legend.map((item) => (
              <span key={item.label} className="rounded-md border border-white/15 bg-black/25 px-2 py-1 text-[10px] text-muted">
                <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                {item.label}
              </span>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted">Live mesh view: discovery, neighbor links, and agent health under blackout conditions.</p>
        <p className="text-[11px] text-muted">No central orchestrator node exists; assignments emerge from local peer neighborhoods.</p>
        <p className="text-[11px] text-muted">Top-right: zoom controls.</p>
        <div className="mt-2 neon-divider" />
      </div>
      <div className={compact ? "h-[360px] rounded-xl border border-white/10 bg-panel/40" : "h-[580px] rounded-xl border border-white/10 bg-panel/40"}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          className="blackout-flow"
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
        >
          <Controls
            position="top-right"
            showInteractive={false}
            style={{
              background: "rgba(8,16,30,0.95)",
              border: "1px solid rgba(157,189,255,0.55)",
              borderRadius: 10,
              boxShadow: "0 10px 24px rgba(2,8,20,0.55), inset 0 0 0 1px rgba(187,213,255,0.12)"
            }}
          />
          <Background color="rgba(71, 116, 214, 0.36)" gap={24} />
        </ReactFlow>
      </div>
    </Card>
  );
}

function contextEdgeAnimated(sourceId: string, targetId: string, state: SimulationState) {
  const source = state.agents[sourceId];
  const target = state.agents[targetId];
  if (!source || !target) {
    return false;
  }

  const activeSource = source.status === "busy" || source.status === "degraded";
  const activeTarget = target.status === "busy" || target.status === "degraded";
  return activeSource || activeTarget;
}
