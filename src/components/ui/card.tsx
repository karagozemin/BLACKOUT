import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section className={cn("panel-elevated rounded-2xl border border-white/10 p-4 shadow-glow", className)}>
      {children}
    </section>
  );
}
