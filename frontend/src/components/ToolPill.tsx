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
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        accent.bg,
        accent.border,
        accent.text,
        className,
      )}
    >
      <Icon size={12} />
      {meta.label}
    </span>
  );
}
