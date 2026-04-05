import { createInitialState, runTick } from "@/lib/simulation/engine/tick-engine";
import type { ChaosAction } from "@/lib/simulation/types";

export function runSimulationTicks(totalTicks: number, actionsByTick: Record<number, ChaosAction[]> = {}) {
  let state = createInitialState(42);

  for (let tick = 1; tick <= totalTicks; tick += 1) {
    const actions = actionsByTick[tick] ?? [];
    state = runTick(state, actions);
  }

  return state;
}
