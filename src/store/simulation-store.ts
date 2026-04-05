"use client";

import { create } from "zustand";
import { createInitialState, runTick } from "@/lib/simulation/engine/tick-engine";
import type { Agent, ChaosAction, SimulationEvent, SimulationState } from "@/lib/simulation/types";

interface SimulationStore {
  state: SimulationState;
  queuedChaos: ChaosAction[];
  setRunning: (running: boolean) => void;
  step: () => void;
  queueChaos: (action: ChaosAction) => void;
  reset: () => void;
}

const initialSeed = 42;

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  state: createInitialState(initialSeed),
  queuedChaos: [],
  setRunning: (running: boolean) =>
    set((previous: SimulationStore) => ({
      state: {
        ...previous.state,
        running
      }
    })),
  step: () => {
    const { state, queuedChaos } = get();
    const next = runTick(state, queuedChaos);

    set({
      state: next,
      queuedChaos: []
    });
  },
  queueChaos: (action: ChaosAction) => {
    if (action.type === "reset") {
      set({
        state: createInitialState(initialSeed),
        queuedChaos: []
      });
      return;
    }

    set((previous: SimulationStore) => {
      const manualEvent: SimulationEvent = {
        id: `evt-manual-${previous.state.tick}-${previous.queuedChaos.length + 1}`,
        tick: previous.state.tick,
        level: action.type === "spawn-fake-completion" ? "danger" : "warning",
        category: "chaos",
        title: "Chaos action queued",
        description: humanReadableChaos(action)
      };

      return {
      queuedChaos: [...previous.queuedChaos, action],
      state: {
        ...previous.state,
        events: [...previous.state.events, manualEvent].slice(-220)
      }
    };
    });
  },
  reset: () =>
    set({
      state: createInitialState(initialSeed),
      queuedChaos: []
    })
}));

function humanReadableChaos(action: ChaosAction) {
  if (action.type === "kill-agent") {
    return `Manual fault: agent ${String(action.payload?.agentId ?? "unknown")} will be forced offline on next tick.`;
  }
  if (action.type === "degrade-network") {
    return `Manual network degradation in ${String(action.payload?.zone ?? "unknown zone")} with latency penalty ${String(action.payload?.penalty ?? "auto")}.`;
  }
  if (action.type === "spawn-fake-completion") {
    return `Adversarial injection: ${String(action.payload?.agentId ?? "unknown agent")} will submit a suspicious completion claim.`;
  }
  if (action.type === "add-urgent-task") {
    return "Urgent blackout task queued for decentralized negotiation.";
  }

  return "Simulation reset requested.";
}

export function getControllableAgents(agents: Record<string, Agent>) {
  return Object.values(agents)
    .filter((agent) => agent.status !== "offline")
    .slice(0, 8);
}
