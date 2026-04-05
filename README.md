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

## Simulation Boundary vs Production-Ready

### Simulated in this demo runtime

- P2P transport layer (message passing is local in-memory simulation)
- Witness evidence payload generation and pseudo hashes
- Verifier signatures and settlement receipt issuance
- Chaos actions (kill/degrade/fake completion) as deterministic fault injection

### Production-ready architecture pieces

- Modular engine boundaries (`peer-discovery`, `negotiation`, `failover`, `execution`, `verification-settlement`)
- Strong typed domain contracts (`Agent`, `Task`, `CoordinationProof`, `VerificationDecision`, `SettlementReceipt`)
- Proof-before-settlement gate logic and malicious isolation path
- Deterministic simulation harness for reproducible protocol adapter testing

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

## UI Smoke Test (Playwright)

First-time setup:

```bash
npm install
npx playwright install chromium
```

Run deterministic UI smoke checks:

```bash
npm run test:e2e
```

The suite validates:

- Mission Control renders correctly
- `Start Judge Demo` launches and advances guided steps
- Mission Summary receives in-session state after navigation
- Direct Summary visit shows explicit "No Mission Run Yet" guidance

## Mission Summary + Replay

- Visit `/mission-summary` after running Mission Control.
- Use the replay slider to scrub ticks and inspect topology/history snapshots.
- Trust evolution chart shows confidence drift under chaos and failover pressure.
- Summary explicitly highlights fake completion rejections and settlement receipts.

## Judge demo script (60 seconds)

1. Open Mission Control.
2. Show mesh topology and emphasize no central node.
3. Add urgent task and watch local consensus event log.
4. Kill active agent and show failover event.
5. Trigger fake completion and show verifier rejection + blocked settlement.
6. Show successful settlement receipts only after proof quorum.

## Judge Demo Mode (60–90s guided)

- In `/mission-control`, click `Start Judge Demo`.
- The app runs a deterministic 8-step guided spotlight:
	1. peer discovery
	2. local negotiation
	3. node failure
	4. failover recovery
	5. malicious fake completion
	6. verifier rejection
	7. proof-before-settlement
	8. mission summary handoff
- Spotlights and step cards direct judges to the right panel at the right time.

## What is simulated vs real

Simulated:

- Peer message transport
- Negotiation rounds
- Proof evidence generation
- Verifier signatures
- Settlement receipts

Not yet integrated:

- Real protocol networking stack
- Persistent storage and cryptographic signature verification
- On-chain settlement or external payment rails

Ready for real protocol integration later:

- Engine modules and typed contracts are adapter-friendly (`types/index.ts` + module boundaries).
