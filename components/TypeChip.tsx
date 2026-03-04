import TypeIcon from "@/components/TypeIcon";
import { TYPE_COLORS, TYPE_LABELS, getContrastColor } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  type: string;
  size?: "sm" | "md";
  className?: string;
}

export default function TypeChip({ type, size = "md", className }: Props) {
  const key = type.toLowerCase();
  const bg = TYPE_COLORS[key] ?? "#888";
  const fg = getContrastColor(bg);
  const label = TYPE_LABELS[key] ?? type;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-bold tracking-wide whitespace-nowrap",
        "transition-transform duration-150 hover:scale-105",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        className,
      )}
      style={{
        background: bg,
        color: fg,
        boxShadow: "0 2px 8px oklch(0 0 0 / 0.25), inset 0 1px 0 oklch(1 0 0 / 0.2)",
      }}
    >
      <TypeIcon type={key} size={size === "sm" ? 13 : 16} color={fg} />
      {label}
    </span>
  );
}
