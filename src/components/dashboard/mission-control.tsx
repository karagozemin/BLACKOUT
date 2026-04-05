"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AgentRosterPanel } from "@/components/dashboard/agent-roster-panel";
import { ChaosControls } from "@/components/dashboard/chaos-controls";
import { EventStreamPanel } from "@/components/dashboard/event-stream-panel";
import { JudgeDemoOverlay, type DemoBeat } from "@/components/dashboard/judge-demo-overlay";
import { MissionStatusPanel } from "@/components/dashboard/mission-status-panel";
import { RealityBoundaryPanel } from "@/components/dashboard/reality-boundary-panel";
import { TaskQueuePanel } from "@/components/dashboard/task-queue-panel";
import { NetworkTopologyPanel } from "@/components/network/network-topology-panel";
import { ProofPanel } from "@/components/proof/proof-panel";
import { SettlementPanel } from "@/components/settlement/settlement-panel";
import { useSimulationStore } from "@/store/simulation-store";
import type { ChaosAction } from "@/lib/simulation/types";

const judgeFlow = [
  {
    title: "Peer discovery",
    targetId: "panel-network",
    durationMs: 9000,
    description: "Agents maintain a mesh via local links; no central orchestrator node exists."
  },
  {
    title: "Local negotiation",
    targetId: "panel-tasks",
    durationMs: 9000,
    description: "An urgent task enters the queue and nearby agents bid based on local metrics.",
    action: { type: "add-urgent-task" as const }
  },
  {
    title: "Node failure",
    targetId: "panel-chaos",
    durationMs: 9000,
    description: "A live executor is forced offline to simulate blackout degradation."
  },
  {
    title: "Failover recovery",
    targetId: "panel-events",
    durationMs: 9000,
    description: "Backup candidates resume execution through local reassignment and task continuity."
  },
  {
    title: "Malicious fake completion",
    targetId: "panel-proof",
    durationMs: 9000,
    description: "A malicious claimant injects fake completion evidence into the verification path."
  },
  {
    title: "Verifier rejection",
    targetId: "panel-settlement",
    durationMs: 9000,
    description: "Verifier agents reject anomalous proof artifacts and block settlement."
  },
  {
    title: "Proof before settlement",
    targetId: "panel-settlement",
    durationMs: 9000,
    description: "Only tasks with witness quorum + verifier approval unlock receipts."
  },
  {
    title: "Mission summary",
    targetId: "judge-summary-cta",
    durationMs: 10000,
    description: "Open Mission Summary to replay the run, trust shifts, rejections, and final receipts."
  }
];

export function MissionControl() {
  const { state, step, setRunning, reset, queueChaos } = useSimulationStore();
  const [speed, setSpeed] = useState(1);
  const [demoRunning, setDemoRunning] = useState(false);
  const [activeDemoStep, setActiveDemoStep] = useState<number | null>(null);
  const timersRef = useRef<number[]>([]);

  const activeBeat: DemoBeat | null =
    activeDemoStep === null
      ? null
      : {
          step: activeDemoStep + 1,
          totalSteps: judgeFlow.length,
          title: judgeFlow[activeDemoStep]?.title ?? "",
          description: judgeFlow[activeDemoStep]?.description ?? "",
          targetId: judgeFlow[activeDemoStep]?.targetId ?? ""
        };

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

  function clearDemoTimers() {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }

  function executeBeatAction(index: number) {
    const beat = judgeFlow[index];
    if (!beat) {
      return;
    }

    if (beat.action) {
      queueChaos(beat.action);
    }

    if (beat.title === "Node failure") {
      const liveState = useSimulationStore.getState().state;
      const executingTask = Object.values(liveState.tasks).find((task) => task.status === "executing");
      const failingAgent = executingTask?.assignedAgentIds[0] ?? "agent-04";
      queueChaos({ type: "kill-agent", payload: { agentId: failingAgent } });
    }

    if (beat.title === "Malicious fake completion") {
      const liveState = useSimulationStore.getState().state;
      const targetTask =
        Object.values(liveState.tasks).find((task) => task.status === "executing" || task.status === "assigned") ??
        liveState.tasks["task-001"];
      const liar = Object.values(liveState.agents).find((agent) => agent.role === "executor")?.id ?? "agent-03";

      if (targetTask) {
        const action: ChaosAction = {
          type: "spawn-fake-completion",
          payload: {
            agentId: liar,
            taskId: targetTask.id
          }
        };
        queueChaos(action);
      }
    }
  }

  function runDemoStep(index: number) {
    if (index >= judgeFlow.length) {
      setActiveDemoStep(null);
      setDemoRunning(false);
      return;
    }

    setActiveDemoStep(index);
    executeBeatAction(index);

    const timer = window.setTimeout(() => {
      runDemoStep(index + 1);
    }, judgeFlow[index]?.durationMs ?? 9000);

    timersRef.current.push(timer);
  }

  function startJudgeDemo() {
    clearDemoTimers();
    reset();
    setSpeed(2);
    setRunning(true);
    setDemoRunning(true);
    runDemoStep(0);
  }

  function stopJudgeDemo() {
    clearDemoTimers();
    setDemoRunning(false);
    setActiveDemoStep(null);
  }

  useEffect(() => {
    return () => clearDemoTimers();
  }, []);

  return (
    <main className="grid-noise min-h-screen p-4 md:p-6">
      <JudgeDemoOverlay beat={activeBeat} onStop={stopJudgeDemo} />
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
        <header className="panel-elevated relative overflow-hidden rounded-2xl border border-info/25 p-4 shadow-glow">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(74,166,255,0.16),transparent_35%)]" />
          <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-info">BLACKOUT EXCHANGE · Mission Control</p>
            <h1 className="text-2xl font-semibold">Leaderless Emergency Agent Economy</h1>
            <p className="text-sm text-muted">{headline} · Deterministic seed {state.seed} · Tick {state.tick}</p>
            <p className="mt-1 text-[11px] text-muted">Simulation runtime is local/deterministic. Architecture boundaries are protocol-adapter ready.</p>
            <p className="mt-1 text-[11px] text-muted">Judge Demo runs a repeatable 8-step story in ~72 seconds.</p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-muted">Speed</label>
            <select
              className="rounded-md border border-white/20 bg-panel px-2 py-1 text-xs shadow-[inset_0_1px_0_rgba(146,182,255,0.16)]"
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
            <button
              onClick={demoRunning ? stopJudgeDemo : startJudgeDemo}
              className={demoRunning ? "rounded-lg bg-danger px-3 py-2 text-xs font-semibold text-white" : "rounded-lg bg-success px-3 py-2 text-xs font-semibold text-black"}
            >
              {demoRunning ? "Stop Judge Demo" : "Start Judge Demo"}
            </button>
            <Link href="/mission-summary" className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-foreground hover:bg-white/20">
              Mission Summary
            </Link>
          </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="space-y-4 xl:col-span-8">
            <div id="panel-network" className="rounded-2xl">
              <NetworkTopologyPanel />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div id="panel-tasks" className="rounded-2xl">
                <TaskQueuePanel />
              </div>
              <div id="panel-events" className="rounded-2xl">
                <EventStreamPanel />
              </div>
            </div>
          </div>

          <div className="space-y-4 xl:col-span-4">
            <div id="panel-status" className="rounded-2xl">
              <MissionStatusPanel />
            </div>
            <RealityBoundaryPanel />
            <div id="panel-chaos" className="rounded-2xl">
              <ChaosControls />
            </div>
            <div id="panel-proof" className="rounded-2xl">
              <ProofPanel />
            </div>
            <div id="panel-settlement" className="rounded-2xl">
              <SettlementPanel />
            </div>
          </div>
        </div>

        <AgentRosterPanel />

        <div className="flex justify-end">
          <Link id="judge-summary-cta" href="/mission-summary" className="rounded-xl border border-info/40 bg-info/15 px-4 py-2 text-xs font-semibold text-info">
            Open Mission Summary Replay
          </Link>
        </div>
      </div>
    </main>
  );
}
