"use client";

import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import { Button } from "@/components/ui/button";

export interface DemoBeat {
  step: number;
  totalSteps: number;
  title: string;
  description: string;
  targetId: string;
}

export function JudgeDemoOverlay({
  beat,
  onStop
}: {
  beat: DemoBeat | null;
  onStop: () => void;
}) {
  if (!beat) {
    return null;
  }

  const target = typeof window !== "undefined" ? document.getElementById(beat.targetId) : null;
  const rect = target?.getBoundingClientRect();

  if (!rect) {
    return null;
  }

  const spotlightStyle: CSSProperties = {
    position: "fixed",
    top: rect.top - 8,
    left: rect.left - 8,
    width: rect.width + 16,
    height: rect.height + 16,
    borderRadius: 18,
    boxShadow: "0 0 0 9999px rgba(4,8,14,0.66)",
    pointerEvents: "none",
    zIndex: 50
  };

  const cardTop = Math.min(window.innerHeight - 190, Math.max(16, rect.top - 140));
  const cardLeft = Math.min(window.innerWidth - 420, Math.max(16, rect.left));

  return (
    <>
      <motion.div
        style={spotlightStyle}
        initial={{ opacity: 0.2, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
      />
      <motion.div
        style={{
          ...spotlightStyle,
          boxShadow: "none",
          border: "2px solid rgba(88, 166, 255, 0.8)"
        }}
        initial={{ opacity: 0.6, scale: 1 }}
        animate={{ opacity: [0.8, 0.25, 0.8], scale: [1, 1.015, 1] }}
        transition={{ repeat: Infinity, duration: 1.6 }}
      />

      <motion.aside
        className="glass fixed w-[380px] rounded-2xl border border-info/40 p-4 shadow-glow"
        style={{ top: cardTop, left: cardLeft, zIndex: 55 }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-[11px] uppercase tracking-[0.18em] text-info">Judge Demo</p>
        <p className="mt-1 text-sm font-semibold">
          Step {beat.step}/{beat.totalSteps}: {beat.title}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted">{beat.description}</p>
        <div className="mt-3 flex justify-end">
          <Button variant="secondary" onClick={onStop}>
            Stop Demo
          </Button>
        </div>
      </motion.aside>
    </>
  );
}
