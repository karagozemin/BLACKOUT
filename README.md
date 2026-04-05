# BLACKOUT EXCHANGE

Leaderless Emergency Agent Economy.

## What this project demonstrates

- No central orchestrator node in coordination logic
- Peer-to-peer discovery and local task negotiation
- Fault tolerance through autonomous failover
- Adversarial resistance against fake completion claims
- Proof-of-coordination gating before settlement

## Tech stack

- Next.js 15 App Router + TypeScript
- Tailwind CSS + Framer Motion
- Zustand for client simulation state
- React Flow for topology mesh view

## Architecture

`src/lib/simulation` is split into independent modules:

- `engine/modules/peer-discovery.ts`
- `engine/modules/negotiation.ts`
- `engine/modules/failover.ts`
- `engine/modules/execution.ts`
- `engine/modules/verification-settlement.ts`

No module is a global decision authority; each module mutates only its domain slice and communicates via typed events/messages.

### Differentiation layer

- `verification/proof.ts`: builds witness-backed coordination proof
- `verification/verifier.ts`: verifier A/B approvals/rejections
- `settlement/settlement.ts`: settlement gate + receipt model

Settlement only occurs when:

1. witness quorum exists,
2. proof confidence threshold is met,
3. verifier quorum approves,
4. no rejection blocks payout.

## Agent roles

Scout, Router, Dispatch, Executor, Battery Manager, Safety, Verifier A/B, Reputation, Settlement, Reserve, Relay.

## Running locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000` and enter Mission Control.

## Deterministic demo mode

Seeded deterministic simulation is default (`seed=42`), so demo behavior is repeatable.

Run smoke harness:

```bash
npm run sim:smoke
```

## Judge demo script (60 seconds)

1. Open Mission Control.
2. Show mesh topology and emphasize no central node.
3. Add urgent task and watch local consensus event log.
4. Kill active agent and show failover event.
5. Trigger fake completion and show verifier rejection + blocked settlement.
6. Show successful settlement receipts only after proof quorum.

## What is simulated vs real

Simulated:

- Peer message transport
- Negotiation rounds
- Proof evidence generation
- Verifier signatures
- Settlement receipts

Ready for real protocol integration later:

- Engine modules and typed contracts are adapter-friendly (`types/index.ts` + module boundaries).
