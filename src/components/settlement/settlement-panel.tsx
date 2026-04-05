"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useSimulationStore } from "@/store/simulation-store";

export function SettlementPanel() {
  const { state } = useSimulationStore();
  const recentDecisions = [...state.verificationDecisions].slice(-6).reverse();
  const recentReceipts = [...state.settlementReceipts].slice(-2).reverse();

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-info">Verification + Settlement Gate</h3>
        <Badge tone="warning">proof before payment</Badge>
      </div>

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
