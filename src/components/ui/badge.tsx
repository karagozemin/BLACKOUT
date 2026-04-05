import { cn } from "@/lib/utils";

const toneStyles = {
  info: "bg-info/20 text-info border-info/30",
  success: "bg-success/20 text-success border-success/30",
  warning: "bg-warning/20 text-warning border-warning/30",
  danger: "bg-danger/20 text-danger border-danger/30",
  muted: "bg-white/10 text-muted border-white/15"
} as const;

export function Badge({
  children,
  tone = "muted"
}: {
  children: React.ReactNode;
  tone?: keyof typeof toneStyles;
}) {
  return (
    <span className={cn("rounded-lg border px-2 py-1 text-[11px] font-medium uppercase tracking-wide", toneStyles[tone])}>
      {children}
    </span>
  );
}
