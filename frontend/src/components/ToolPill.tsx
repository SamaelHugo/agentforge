import { ACCENT, toolMeta } from "@/lib/tools";
import { cn } from "@/lib/utils";

export function ToolPill({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const meta = toolMeta(name);
  const accent = ACCENT[meta.accent];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[2px] border border-line bg-white px-2 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-ink-muted",
        className,
      )}
    >
      <Icon size={11} className={accent.text} />
      {meta.label}
    </span>
  );
}
