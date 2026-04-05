"use client";

import { useEffect, useMemo, useState } from "react";
import { AgentRosterPanel } from "@/components/dashboard/agent-roster-panel";
import { ChaosControls } from "@/components/dashboard/chaos-controls";
import { EventStreamPanel } from "@/components/dashboard/event-stream-panel";
import { MissionStatusPanel } from "@/components/dashboard/mission-status-panel";
import { RealityBoundaryPanel } from "@/components/dashboard/reality-boundary-panel";
import { TaskQueuePanel } from "@/components/dashboard/task-queue-panel";
import { NetworkTopologyPanel } from "@/components/network/network-topology-panel";
import { ProofPanel } from "@/components/proof/proof-panel";
import { SettlementPanel } from "@/components/settlement/settlement-panel";
import { useSimulationStore } from "@/store/simulation-store";

export function MissionControl() {
  const { state, step, setRunning } = useSimulationStore();
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    if (!state.running) {
      return;
    }

    const interval = window.setInterval(() => {
      step();
    }, Math.max(250, 1100 / speed));

    return () => window.clearInterval(interval);
  }, [state.running, step, speed]);

  const headline = useMemo(() => {
    const online = Object.values(state.agents).filter((agent) => agent.status !== "offline").length;
    return `${online}/${Object.keys(state.agents).length} agents reachable`; 
  }, [state.agents]);

  return (
    <main className="grid-noise min-h-screen p-4 md:p-6">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
        <header className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 p-4 shadow-glow">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-info">BLACKOUT EXCHANGE · Mission Control</p>
            <h1 className="text-2xl font-semibold">Leaderless Emergency Agent Economy</h1>
            <p className="text-sm text-muted">{headline} · Deterministic seed {state.seed} · Tick {state.tick}</p>
            <p className="mt-1 text-[11px] text-muted">Simulation runtime is local/deterministic. Architecture boundaries are protocol-adapter ready.</p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-muted">Speed</label>
            <select
              className="rounded-md border border-white/20 bg-panel px-2 py-1 text-xs"
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
            >
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={4}>4x</option>
            </select>
            <button
              onClick={() => setRunning(!state.running)}
              className="rounded-lg bg-info px-3 py-2 text-xs font-semibold text-black"
            >
              {state.running ? "Pause" : "Resume"}
            </button>
            <a href="/mission-summary" className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-foreground hover:bg-white/20">
              Mission Summary
            </a>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="space-y-4 xl:col-span-8">
            <NetworkTopologyPanel />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <TaskQueuePanel />
              <EventStreamPanel />
            </div>
          </div>

          <div className="space-y-4 xl:col-span-4">
            <MissionStatusPanel />
            <RealityBoundaryPanel />
            <ChaosControls />
            <ProofPanel />
            <SettlementPanel />
          </div>
        </div>

        <AgentRosterPanel />
      </div>
    </main>
  );
}
