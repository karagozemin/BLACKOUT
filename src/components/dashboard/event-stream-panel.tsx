"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useSimulationStore } from "@/store/simulation-store";

const toneByLevel = {
  info: "info",
  success: "success",
  warning: "warning",
  danger: "danger"
} as const;

export function EventStreamPanel() {
  const { state } = useSimulationStore();
  const events = [...state.events].slice(-14).reverse();

  const levelAccent = {
    info: "border-l-info",
    success: "border-l-success",
    warning: "border-l-warning",
    danger: "border-l-danger"
  } as const;

  return (
    <Card className="h-[360px] overflow-hidden">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-info">Coordination Log</h3>
        <Badge tone="muted">judge readable</Badge>
      </div>
      <p className="mb-2 text-[11px] text-muted">Single source of truth for local consensus, failover, verifier actions, and settlement gating.</p>
      <div className="mb-2 neon-divider" />

      <div className="space-y-2 overflow-y-auto pr-1">
        {events.map((event) => (
          <motion.article
            key={event.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border border-white/10 border-l-2 ${levelAccent[event.level]} bg-gradient-to-br from-panelSoft/85 to-panel/80 p-3 shadow-[inset_0_1px_0_rgba(152,186,255,0.12)]`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold">{event.title}</p>
              <Badge tone={toneByLevel[event.level]}>{event.category}</Badge>
            </div>
            <p className="mt-1 font-mono text-[11px] text-muted">tick {event.tick}</p>
            <p className="mt-2 text-xs leading-relaxed text-foreground/90">{event.description}</p>
          </motion.article>
        ))}
      </div>
    </Card>
  );
}
