"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useSimulationStore } from "@/store/simulation-store";

export function ProofPanel() {
  const { state } = useSimulationStore();
  const proofs = Object.values(state.proofs).slice(-2).reverse();

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-info">Proof of Coordination</h3>
        <Badge tone="info">core innovation</Badge>
      </div>
      <p className="mb-2 text-[11px] text-muted">Completion claims must include multi-witness evidence and acceptable confidence before verifier review.</p>

      {proofs.length < 1 ? (
        <p className="text-xs text-muted">No completion claims yet. Proof artifacts appear once execution is claimed.</p>
      ) : (
        <div className="space-y-2">
          {proofs.map((proof) => (
            <article key={proof.taskId} className="rounded-xl border border-white/10 bg-panelSoft/70 p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold">{proof.taskId}</p>
                <Badge tone={proof.status === "sufficient" ? "success" : "warning"}>{proof.status}</Badge>
              </div>
              <p className="mt-1 text-[11px] text-muted">claimant: {proof.claimantAgentId}</p>
              <p className="mt-1 text-xs text-foreground/90">
                Witnesses {proof.witnessEvidence.length}/{proof.witnessThreshold} · coverage {proof.witnessCoverage} · confidence {proof.coordinationConfidence}
              </p>
              {proof.anomalyFlags.length > 0 && (
                <p className="mt-1 text-[11px] text-danger">anomalies: {proof.anomalyFlags.join(", ")}</p>
              )}
              <p className="mt-1 truncate text-[11px] text-muted">hash {proof.evidenceHash}</p>
            </article>
          ))}
        </div>
      )}
    </Card>
  );
}
