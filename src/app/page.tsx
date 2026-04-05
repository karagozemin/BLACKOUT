import Link from "next/link";

const proofPillars = [
  {
    title: "No Central Orchestrator",
    detail: "Agents discover peers and converge locally. There is no single dispatcher hidden in the loop."
  },
  {
    title: "Failover Under Active Faults",
    detail: "When executors drop offline, backup candidates continue work through local reassignment."
  },
  {
    title: "Adversarial Rejection",
    detail: "Fake completion claims are isolated by verifier agents before settlement can proceed."
  },
  {
    title: "Proof-Before-Payment",
    detail: "Settlement receipts unlock only after witness evidence + verifier quorum are satisfied."
  }
];

const demoMoments = [
  "Peer mesh discovery",
  "Local negotiation and ownership convergence",
  "Node failure and autonomous failover",
  "Malicious completion attempt",
  "Verifier rejection and settlement block",
  "Mission Summary replay with trust evolution"
];

export default function LandingPage() {
  return (
    <main className="min-h-screen px-6 py-8 md:px-12 md:py-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="glass rounded-3xl border border-info/20 p-8 shadow-glow md:p-10">
          <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.16em]">
            <span className="rounded-full border border-info/40 bg-info/15 px-3 py-1 text-info">BLACKOUT EXCHANGE</span>
            <span className="rounded-full border border-white/15 px-3 py-1 text-muted">Deterministic Demo Ready</span>
            <span className="rounded-full border border-success/30 bg-success/10 px-3 py-1 text-success">Judge-Friendly Story Mode</span>
          </div>

          <h1 className="mt-5 max-w-5xl text-4xl font-semibold leading-tight md:text-6xl">
            Leaderless coordination under stress.
            <span className="block text-info">Tasks settle only when coordination is proven.</span>
          </h1>

          <p className="mt-4 max-w-4xl text-sm text-muted md:text-base">
            BLACKOUT EXCHANGE simulates a degraded emergency mesh where heterogeneous agents discover peers, negotiate task
            ownership locally, self-heal after failures, and reject malicious completions before any value transfer.
          </p>
          <p className="mt-2 max-w-4xl text-[12px] text-muted">
            Runtime is deterministic simulation for reliable demos. Architecture boundaries are production-ready for real protocol adapters.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/mission-control" className="rounded-xl bg-info px-5 py-2.5 text-sm font-semibold text-black transition hover:brightness-110">
              Enter Mission Control
            </Link>
            <Link href="/mission-summary" className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-white/10">
              View Mission Summary
            </Link>
            <span className="rounded-xl border border-white/15 px-3 py-2 text-xs text-muted">Seeded run • Repeatable narrative • E2E guarded</span>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {proofPillars.map((pillar) => (
            <article key={pillar.title} className="glass rounded-2xl border border-white/10 p-4">
              <p className="text-sm font-semibold text-foreground">{pillar.title}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted">{pillar.detail}</p>
            </article>
          ))}
        </section>

        <section className="glass rounded-2xl border border-white/10 p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">60-Second Judge Flow</h2>
              <p className="text-xs text-muted">Start Judge Demo and follow spotlighted checkpoints in deterministic order.</p>
            </div>
            <Link href="/mission-control" className="rounded-lg border border-info/40 bg-info/10 px-4 py-2 text-xs font-semibold text-info">
              Start Judge Demo
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
            {demoMoments.map((moment, index) => (
              <div key={moment} className="rounded-xl border border-white/10 bg-panelSoft/60 px-3 py-2 text-xs">
                <span className="mr-2 text-info">{index + 1}.</span>
                <span className="text-foreground/90">{moment}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
