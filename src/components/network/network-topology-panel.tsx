"use client";

import { useMemo } from "react";
import {
  Background,
  Controls,
  MiniMap,
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
          width: 140,
          borderRadius: 12,
          padding: 6,
          border: `1px solid ${statusColor[agent.status] ?? "#4AA6FF"}`,
          background: "rgba(16, 24, 40, 0.9)",
          color: "#E5ECFF",
          boxShadow: "0 0 18px rgba(59,130,246,0.15)"
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
              stroke: "rgba(77, 126, 238, 0.45)",
              strokeWidth: 1.2
            }
          });
        }
      });
    });

    return { nodes: builtNodes, edges: builtEdges };
  }, [state.agents]);

  return (
    <Card className={compact ? "h-[420px] overflow-hidden p-2" : "h-[640px] overflow-hidden p-2"}>
      <div className="mb-2 px-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-info">Peer-to-Peer Network Topology</h3>
        <p className="text-xs text-muted">Live mesh view: discovery, neighbor links, and agent health under blackout conditions.</p>
        <p className="text-[11px] text-muted">No central orchestrator node exists; assignments emerge from local peer neighborhoods.</p>
      </div>
      <div className={compact ? "h-[360px] rounded-xl border border-white/10 bg-panel/40" : "h-[580px] rounded-xl border border-white/10 bg-panel/40"}>
        <ReactFlow nodes={nodes} edges={edges} fitView>
          <MiniMap zoomable pannable style={{ backgroundColor: "#0e1626" }} />
          <Controls />
          <Background color="#203457" gap={24} />
        </ReactFlow>
      </div>
    </Card>
  );
}
