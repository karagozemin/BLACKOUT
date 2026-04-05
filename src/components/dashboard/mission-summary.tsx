"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { NetworkTopologyPanel } from "@/components/network/network-topology-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TrustEvolutionChart } from "@/components/dashboard/trust-evolution-chart";
import { useSimulationStore } from "@/store/simulation-store";

export function MissionSummary() {
  const { state, history } = useSimulationStore();
  const [replayTick, setReplayTick] = useState<number>(state.tick);
  const hasRunData = state.tick > 0 || history.length > 1;

  const replaySnapshot = useMemo(
    () => history.find((snapshot) => snapshot.tick === replayTick) ?? history[history.length - 1],
    [history, replayTick]
  );

  const replayState = replaySnapshot?.state ?? state;
  const verificationRejects = state.verificationDecisions.filter((decision) => decision.verdict === "reject");
  const failoverEvents = state.events.filter((event) => event.title === "Failover triggered");
  const liarIsolationEvents = state.events.filter((event) => event.title === "Malicious node isolated");

  return (
    <main className="grid-noise min-h-screen p-4 md:p-6">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-4">
        <header className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 p-4 shadow-glow">
          <div className="flex items-start gap-3">
            <Image
              src="/blackout-logo.png"
              alt="BLACKOUT EXCHANGE logo"
              width={56}
              height={56}
              className="mt-0.5 rounded-lg border border-info/25 bg-black/25 p-1.5"
            />
            <div>
            <p className="text-xs uppercase tracking-[0.2em] text-info">BLACKOUT EXCHANGE · Mission Summary</p>
            <h1 className="text-2xl font-semibold">Final Mission Snapshot & Replay</h1>
            <p className="text-sm text-muted">Replay deterministic ticks to explain coordination, failover, and proof gating to judges.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="muted">seed {state.seed}</Badge>
            <Badge tone="info">ticks {state.tick}</Badge>
            <Link href="/mission-control">
              <Button variant="secondary">Back to Mission Control</Button>
            </Link>
          </div>
        </header>

        {!hasRunData && (
          <Card>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-warning">No Mission Run Yet</h3>
            <p className="mt-2 text-xs text-muted">
              Mission Summary reads live simulation history. Start or run Judge Demo in Mission Control first, then come back here.
            </p>
            <div className="mt-3">
              <Link href="/mission-control">
                <Button variant="primary">Go Start Mission Control</Button>
              </Link>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="space-y-4 xl:col-span-8">
            <Card>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-info">Replay Timeline</h3>
                <Badge tone="warning">tick {replaySnapshot?.tick ?? state.tick}</Badge>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(0, state.tick)}
                value={Math.max(0, replayTick)}
                onChange={(event) => setReplayTick(Number(event.target.value))}
                className="w-full accent-[#4AA6FF]"
              />
              <p className="mt-2 text-xs text-muted">Review local consensus, failover, and settlement gate evolution tick-by-tick.</p>
            </Card>

            <NetworkTopologyPanel stateOverride={replayState} compact />
            <TrustEvolutionChart history={history} />
          </div>

          <div className="space-y-4 xl:col-span-4">
            <Card>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-info">Outcome Metrics</h3>
              <div className="mt-3 space-y-2 text-xs">
                {[
                  ["Tasks completed", state.metrics.tasksCompleted],
                  ["Failovers handled", state.metrics.failoversHandled],
                  ["False completions rejected", state.metrics.falseCompletionsRejected],
                  ["Malicious nodes isolated", state.metrics.maliciousAgentsIsolated],
                  ["Avg coordination latency", state.metrics.averageCoordinationLatency],
                  ["Dropped messages", state.metrics.droppedMessages],
                  ["Settlement receipts", state.metrics.settlementSuccessCount]
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex items-center justify-between rounded-lg border border-white/10 bg-panelSoft/70 px-3 py-2">
                    <span className="text-muted">{label}</span>
                    <span className="font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-info">Adversarial Rejections</h3>
              <p className="mt-1 text-xs text-muted">Verifier decisions that blocked fake or weak completion claims.</p>
              <div className="mt-2 space-y-2">
                {verificationRejects.slice(-6).reverse().map((decision) => (
                  <div key={`${decision.taskId}-${decision.verifierAgentId}-${decision.tick}`} className="rounded-lg border border-danger/25 bg-danger/10 p-2">
                    <p className="text-[11px] font-semibold text-danger">{decision.taskId} rejected</p>
                    <p className="text-[11px] text-muted">{decision.verifierAgentId}: {decision.reason}</p>
                  </div>
                ))}
                {verificationRejects.length < 1 && <p className="text-xs text-muted">No rejections recorded in this run.</p>}
              </div>
            </Card>

            <Card>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-info">Resilience Timeline</h3>
              <div className="mt-2 space-y-2">
                <p className="text-xs text-muted">Failovers: {failoverEvents.length}</p>
                <p className="text-xs text-muted">Malicious isolations: {liarIsolationEvents.length}</p>
                {state.settlementReceipts.slice(-3).reverse().map((receipt) => (
                  <div key={receipt.id} className="rounded-lg border border-success/25 bg-success/10 p-2">
                    <p className="text-[11px] font-semibold text-success">{receipt.taskId} settled</p>
                    <p className="truncate text-[11px] text-muted">proof {receipt.evidenceHash}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
