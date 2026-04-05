import { cn } from "@/lib/utils";

const variantStyles = {
  primary: "bg-info text-black hover:brightness-110",
  secondary: "bg-white/10 text-foreground hover:bg-white/20",
  danger: "bg-danger/80 text-white hover:bg-danger"
} as const;

export function Button({
  children,
  className,
  variant = "secondary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variantStyles;
}) {
  return (
    <button
      className={cn(
        "rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
