"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useSimulationStore } from "@/store/simulation-store";

export function SettlementPanel() {
  const { state } = useSimulationStore();
  const recentDecisions = [...state.verificationDecisions].slice(-6).reverse();
  const recentReceipts = [...state.settlementReceipts].slice(-2).reverse();
  const blockedTasks = Object.values(state.tasks).filter((task) => task.settlementStatus === "blocked" && task.status !== "queued");

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-info">Verification + Settlement Gate</h3>
        <Badge tone="warning">proof before payment</Badge>
      </div>
      <p className="mb-2 text-[11px] text-muted">Payments remain blocked until verifier quorum confirms sufficient coordination proof.</p>

      <div className="space-y-2">
        <div className="rounded-xl border border-white/10 bg-panelSoft/70 p-3">
          <p className="text-xs font-semibold">Verifier Decisions</p>
          {recentDecisions.length < 1 ? (
            <p className="mt-1 text-[11px] text-muted">Awaiting first verification round.</p>
          ) : (
            recentDecisions.map((decision) => (
              <p key={`${decision.taskId}-${decision.verifierAgentId}-${decision.tick}`} className="mt-1 text-[11px] text-muted">
                {decision.verifierAgentId} {decision.verdict === "approve" ? "approved" : "rejected"} {decision.taskId} · {decision.reason}
              </p>
            ))
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-panelSoft/70 p-3">
          <p className="text-xs font-semibold">Settlement Gate Status</p>
          {blockedTasks.length < 1 ? (
            <p className="mt-1 text-[11px] text-success">No blocked tasks currently; eligible proofs are settling.</p>
          ) : (
            blockedTasks.slice(0, 3).map((task) => (
              <p key={task.id} className="mt-1 text-[11px] text-warning">
                {task.id} blocked · {task.rejectionReason ?? "awaiting stronger proof/verifier quorum"}
              </p>
            ))
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-panelSoft/70 p-3">
          <p className="text-xs font-semibold">Settlement Receipts</p>
          {recentReceipts.length < 1 ? (
            <p className="mt-1 text-[11px] text-muted">No payouts yet. Settlement unlocks only after verifier quorum.</p>
          ) : (
            recentReceipts.map((receipt) => (
              <div key={receipt.id} className="mt-2 rounded-lg border border-white/10 bg-black/20 p-2">
                <p className="text-[11px] font-semibold text-success">{receipt.taskId} settled</p>
                <p className="truncate text-[11px] text-muted">receipt {receipt.id}</p>
                <p className="truncate text-[11px] text-muted">proof {receipt.evidenceHash}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}
