"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function RealityBoundaryPanel() {
  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-info">Runtime Boundary</h3>
        <Badge tone="warning">transparent scope</Badge>
      </div>

      <div className="space-y-2 text-xs">
        <div className="rounded-xl border border-info/30 bg-info/10 p-3">
          <p className="font-semibold text-info">Simulated Runtime (Demo)</p>
          <p className="mt-1 text-muted">
            Peer transport, verifier signatures, evidence payloads, and settlement receipts are deterministic local simulation artifacts.
          </p>
        </div>

        <div className="rounded-xl border border-success/30 bg-success/10 p-3">
          <p className="font-semibold text-success">Production-Ready Architecture (Real Integration Path)</p>
          <p className="mt-1 text-muted">
            Module boundaries, typed event contracts, proof/verification gate, and failover flow are implementation-ready for protocol adapters.
          </p>
        </div>
      </div>
    </Card>
  );
}
