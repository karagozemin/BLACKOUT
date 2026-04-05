import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen p-8 md:p-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="glass rounded-2xl border border-white/10 p-8 shadow-glow">
          <p className="text-xs uppercase tracking-[0.2em] text-info">BLACKOUT EXCHANGE</p>
          <h1 className="mt-3 text-4xl font-semibold md:text-6xl">Leaderless coordination under stress.</h1>
          <p className="mt-4 max-w-3xl text-muted">
            No orchestrator. No blind settlement. A resilient mesh of heterogeneous agents negotiating tasks and proving
            coordination before payment.
          </p>
          <p className="mt-2 max-w-3xl text-[12px] text-muted">
            Demo runtime is deterministic simulation; module boundaries and proof-gating architecture are integration-ready.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/mission-control"
              className="rounded-xl bg-info px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110"
            >
              Enter Mission Control
            </Link>
            <span className="rounded-xl border border-white/15 px-3 py-2 text-xs text-muted">
              Deterministic demo mode enabled
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
