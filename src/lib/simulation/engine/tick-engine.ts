import { createSeedAgents, createSeedNetwork, createSeedTasks } from "@/lib/simulation/data/seed-data";
import { SimulationEventBus } from "@/lib/simulation/engine/event-bus";
import { applyChaosAction } from "@/lib/simulation/engine/chaos";
import { executionModule } from "@/lib/simulation/engine/modules/execution";
import { failoverModule } from "@/lib/simulation/engine/modules/failover";
import { negotiationModule } from "@/lib/simulation/engine/modules/negotiation";
import { peerDiscoveryModule } from "@/lib/simulation/engine/modules/peer-discovery";
import { taskGenerationModule } from "@/lib/simulation/engine/modules/task-generation";
import { verificationSettlementModule } from "@/lib/simulation/engine/modules/verification-settlement";
import type { ChaosAction, Message, SimulationEvent, SimulationModule, SimulationState } from "@/lib/simulation/types";
import { mulberry32 } from "@/lib/simulation/utils/rng";

const modules: SimulationModule[] = [
  peerDiscoveryModule,
  taskGenerationModule,
  negotiationModule,
  failoverModule,
  executionModule,
  verificationSettlementModule
];

export function createInitialState(seed = 42): SimulationState {
  const rng = mulberry32(seed);

  return {
    seed,
    tick: 0,
    deterministicMode: true,
    running: true,
    agents: createSeedAgents(rng, 16),
    tasks: createSeedTasks(rng),
    proofs: {},
    verificationDecisions: [],
    settlementReceipts: [],
    messages: [],
    events: [
      {
        id: "evt-0000",
        tick: 0,
        level: "info",
        category: "network",
        title: "Mesh initialized",
        description: "Agents bootstrapped in leaderless mode with deterministic seed 42."
      }
    ],
    network: createSeedNetwork(),
    metrics: {
      tasksCompleted: 0,
      failoversHandled: 0,
      falseCompletionsRejected: 0,
      averageCoordinationLatency: 0,
      settlementSuccessCount: 0
    }
  };
}

function withIds<T extends SimulationEvent | Message>(
  items: Omit<T, "id" | "tick">[],
  tick: number,
  prefix: "evt" | "msg",
  offset: number
): T[] {
  return items.map((item, index) => ({
    ...item,
    id: `${prefix}-${String(tick).padStart(4, "0")}-${String(offset + index + 1).padStart(3, "0")}`,
    tick
  })) as T[];
}

export function runTick(state: SimulationState, chaosActions: ChaosAction[] = []): SimulationState {
  const tick = state.tick + 1;
  const rng = mulberry32(state.seed + tick * 17);

  let workingState: SimulationState = {
    ...state,
    tick,
    agents: { ...state.agents },
    tasks: { ...state.tasks },
    proofs: { ...state.proofs },
    verificationDecisions: [...state.verificationDecisions],
    settlementReceipts: [...state.settlementReceipts],
    events: [...state.events],
    messages: [...state.messages],
    network: {
      ...state.network,
      degradedRegions: { ...state.network.degradedRegions }
    },
    metrics: { ...state.metrics }
  };

  chaosActions.forEach((action) => {
    workingState = applyChaosAction(workingState, action, tick, rng);
  });

  const eventBus = new SimulationEventBus();
  const transientEvents: Omit<SimulationEvent, "id" | "tick">[] = [];
  const transientMessages: Omit<Message, "id" | "tick">[] = [];

  const context = {
    rng,
    tick,
    addEvent: (event: Omit<SimulationEvent, "id" | "tick">) => {
      transientEvents.push(event);
    },
    addMessage: (message: Omit<Message, "id" | "tick">) => {
      transientMessages.push(message);
    }
  };

  modules.forEach((module) => {
    workingState = module.run(workingState, context);
  });

  withIds<SimulationEvent>(transientEvents, tick, "evt", workingState.events.length).forEach((event) => {
    eventBus.publishEvent(event);
  });

  withIds<Message>(transientMessages, tick, "msg", workingState.messages.length).forEach((message) => {
    eventBus.publishMessage(message);
  });

  workingState.events = [...workingState.events, ...eventBus.flushEvents()].slice(-220);
  workingState.messages = [...workingState.messages, ...eventBus.flushMessages()].slice(-320);

  return workingState;
}
