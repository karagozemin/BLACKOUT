"use client";

import { create } from "zustand";
import { createInitialState, runTick } from "@/lib/simulation/engine/tick-engine";
import type { Agent, ChaosAction, SimulationEvent, SimulationState } from "@/lib/simulation/types";

export interface SimulationSnapshot {
  tick: number;
  averageTrust: number;
  onlineAgents: number;
  settledTasks: number;
  failedTasks: number;
  state: SimulationState;
}

interface SimulationStore {
  state: SimulationState;
  history: SimulationSnapshot[];
  queuedChaos: ChaosAction[];
  setRunning: (running: boolean) => void;
  step: () => void;
  queueChaos: (action: ChaosAction) => void;
  reset: () => void;
}

const initialSeed = 42;
const maxHistory = 260;

function toSnapshot(state: SimulationState): SimulationSnapshot {
  const agents = Object.values(state.agents);
  const averageTrust =
    agents.length > 0
      ? Number((agents.reduce((sum, agent) => sum + agent.metrics.trust, 0) / agents.length).toFixed(2))
      : 0;
  const tasks = Object.values(state.tasks);

  return {
    tick: state.tick,
    averageTrust,
    onlineAgents: agents.filter((agent) => agent.status !== "offline").length,
    settledTasks: tasks.filter((task) => task.status === "settled").length,
    failedTasks: tasks.filter((task) => task.status === "failed").length,
    state
  };
}

const initialState = createInitialState(initialSeed);

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  state: initialState,
  history: [toSnapshot(initialState)],
  queuedChaos: [],
  setRunning: (running: boolean) =>
    set((previous: SimulationStore) => ({
      state: {
        ...previous.state,
        running
      }
    })),
  step: () => {
    const { state, queuedChaos, history } = get();
    const next = runTick(state, queuedChaos);
    const nextHistory = [...history, toSnapshot(next)].slice(-maxHistory);

    set({
      state: next,
      history: nextHistory,
      queuedChaos: []
    });
  },
  queueChaos: (action: ChaosAction) => {
    if (action.type === "reset") {
      const fresh = createInitialState(initialSeed);
      set({
        state: fresh,
        history: [toSnapshot(fresh)],
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
    {
      const fresh = createInitialState(initialSeed);
      set({
        state: fresh,
        history: [toSnapshot(fresh)],
        queuedChaos: []
      });
    }
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
