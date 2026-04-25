# ARCHITECTURE

This document explains the technical architecture, runtime flow, and production boundary of BLACKOUT EXCHANGE.

## 1) System objective

BLACKOUT EXCHANGE models a degraded emergency environment where agents:

- coordinate without a central command authority,
- negotiate ownership with local information,
- continue execution through failover after node loss,
- isolate fake completion claims in verifier stages,
- and open settlement only after sufficient proof.

## 2) High-level architecture

The system is organized in three layers:

1. **UI Layer** (`src/app`, `src/components`)
2. **Simulation Domain Layer** (`src/lib/simulation`)
3. **Runtime State Layer** (`src/store/simulation-store.ts`)

## 3) Routes and primary screens

- `/` → landing and value proposition
- `/mission-control` → live operations dashboard
- `/mission-summary` → replay, trust evolution, final metrics

## 4) Simulation core

### 4.1 Tick engine

`tick-engine.ts` drives deterministic progression. At each tick, modules run in sequence.

Typical order:

1. `peer-discovery.ts`
2. `negotiation.ts`
3. `execution.ts`
4. `failover.ts`
5. `verification-settlement.ts`

### 4.2 Modular boundaries

Each module mutates only its own domain concern. There is no single global decision module.

Benefits:

- better testability
- clearer domain ownership
- easier protocol-adapter integration

### 4.3 Chaos engine

`chaos.ts` injects controlled faults:

- `kill-agent`
- `degrade-network`
- `spawn-fake-completion`
- `add-urgent-task`

Purpose: stress resilience and verification logic under failure conditions.

## 5) Domain model

Core types live in `src/lib/simulation/types/index.ts`.

Key entities:

- `Agent`, `AgentMetrics`
- `Task` (`queued → negotiating → assigned → executing → verifying → settled/failed`)
- `CoordinationProof`
- `VerificationDecision`
- `SettlementReceipt`
- `SimulationState`

These contracts provide a stable interface between UI and engine layers.

## 6) Proof-before-settlement chain

### 6.1 Proof generation

`verification/proof.ts`:

- gathers witness evidence
- computes confidence
- emits anomaly flags

### 6.2 Verifier decisions

`verification/verifier.ts`:

- produces approve/reject decisions
- records reason and confidence

### 6.3 Settlement gate

`settlement/settlement.ts` opens settlement only when:

1. witness quorum is reached,
2. proof confidence is above threshold,
3. verifier quorum approves,
4. no blocking rejection exists.

## 7) Runtime state and replay

`simulation-store.ts`:

- holds live simulation state,
- advances ticks,
- queues chaos actions,
- stores snapshots for replay.

Mission Summary consumes this history for timeline playback.

## 8) UI component distribution

### Mission Control panel set

- `network-topology-panel.tsx`
- `task-queue-panel.tsx`
- `event-stream-panel.tsx`
- `mission-status-panel.tsx`
- `chaos-controls.tsx`
- `proof-panel.tsx`
- `settlement-panel.tsx`
- `agent-roster-panel.tsx`

### Judge Demo

- `judge-demo-overlay.tsx` + `mission-control.tsx`
- 8-step guided narrative
- manual `Prev/Next` step navigation

## 9) Quality strategy

- **Lint:** static quality checks
- **Build:** type-safe production compilation
- **E2E:** `e2e/judge-demo.spec.ts` for critical guided flow
- **CI:** `.github/workflows/ci.yml`

Goal: catch demo regressions before merge/submission.

## 10) Swarm integration layer (MQTT + FoxMQ + Vertex AI)

### 10.1 Transport adapters

- `src/lib/integrations/mqtt-transport.ts` handles broker connection and JSON publish with QoS 1.
- `MQTT_BROKER_URL` targets a standard MQTT broker topic space (`blackout/swarm/*`).
- `FOXMQ_BROKER_URL` uses the same MQTT protocol for FoxMQ-compatible consensus-backed messaging topics.

### 10.2 Swarm sync orchestration

- `src/lib/integrations/swarm-sync.ts` publishes tick snapshots, recent events, and coordination digest.
- `src/app/api/swarm/sync/route.ts` exposes a Node.js API endpoint to push mission-control ticks into transport adapters.
- `src/components/dashboard/swarm-integration-panel.tsx` allows interactive sync and displays publish status + warnings.

### 10.3 Vertex AI advisor

- `src/lib/integrations/vertex-advisor.ts` requests one-line coordination guidance from Vertex AI.
- If Vertex config is unavailable, deterministic fallback advice is returned to keep demo flow reproducible.

## 11) Simulation boundary and production transition

### Included today

- deterministic in-memory runtime
- proof/verifier/settlement decision chain
- replay-ready historical snapshots and metrics
- MQTT broker publishing for swarm tick/event payloads
- FoxMQ-compatible MQTT profile for decentralized broker integration
- Vertex AI recommendation hook with graceful fallback

### Not integrated yet

- real on-chain settlement
- production-grade signature verification
- persistent data storage

### Transition path

1. define `verification/settlement` adapter interfaces
2. map contract operations (`submitProof`, `verify`, `release`)
3. persist MQTT/FoxMQ message receipts for post-mission audit
4. move replay from in-memory snapshots to audit log storage
5. replace fallback advisor with strict Vertex policy prompts + evaluation set

## 12) Why this architecture is strong

- It demonstrates decentralized coordination in a clear way.
- It tests fault and adversarial behavior in one scenario.
- It enforces proof-before-payment as a hard gate.
- It keeps a clean path from deterministic demo to production adapters.
