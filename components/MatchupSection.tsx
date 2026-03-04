"use client";

import { useState } from "react";
import TypeChip from "@/components/TypeChip";

interface Props {
  multiplier: string;
  types: string[];
  collapsible?: boolean;
}

interface Meta {
  label: string;
  shortLabel: string;
  color: string;
  bgOpacity: number;
  borderOpacity: number;
}

const META: Record<string, Meta> = {
  "0":    { label: "0×",  shortLabel: "Immun",          color: "#60a5fa", bgOpacity: 0.06, borderOpacity: 0.18 },
  "0.25": { label: "¼×",  shortLabel: "Sehr resistent", color: "#34d399", bgOpacity: 0.06, borderOpacity: 0.20 },
  "0.5":  { label: "½×",  shortLabel: "Resistent",      color: "#6ee7b7", bgOpacity: 0.05, borderOpacity: 0.16 },
  "1":    { label: "1×",  shortLabel: "Neutral",         color: "#94a3b8", bgOpacity: 0.03, borderOpacity: 0.10 },
  "2":    { label: "2×",  shortLabel: "Schwäche",        color: "#fb923c", bgOpacity: 0.07, borderOpacity: 0.25 },
  "4":    { label: "4×",  shortLabel: "Große Schwäche",  color: "#f87171", bgOpacity: 0.09, borderOpacity: 0.30 },
};

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

export default function MatchupSection({ multiplier, types, collapsible = false }: Props) {
  const [expanded, setExpanded] = useState(!collapsible);

  if (types.length === 0) return null;

  const meta = META[multiplier] ?? { label: `${multiplier}×`, shortLabel: "", color: "#888", bgOpacity: 0.04, borderOpacity: 0.12 };
  const rgb = hexToRgb(meta.color);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: `rgba(${rgb},${meta.bgOpacity})`,
        border: `1px solid rgba(${rgb},${meta.borderOpacity})`,
      }}
    >
      {/* Header row */}
      <div
        className={`flex items-center gap-3 px-3.5 py-2.5 ${collapsible ? "cursor-pointer select-none" : ""}`}
        onClick={collapsible ? () => setExpanded((v) => !v) : undefined}
        role={collapsible ? "button" : undefined}
        aria-expanded={collapsible ? expanded : undefined}
      >
        {/* Badge */}
        <div
          className="w-9 h-7 rounded-lg flex items-center justify-center font-black text-sm tabular-nums flex-shrink-0"
          style={{
            background: `rgba(${rgb},0.18)`,
            color: meta.color,
            border: `1px solid rgba(${rgb},0.22)`,
          }}
        >
          {meta.label}
        </div>

        <span className="flex-1 text-[13px] font-semibold" style={{ color: meta.color }}>
          {meta.shortLabel}
        </span>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: `rgba(${rgb},0.14)`, color: meta.color }}
          >
            {types.length}
          </span>
          {collapsible && (
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke={meta.color} strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6"
              className="transition-transform duration-200"
              style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          )}
        </div>
      </div>

      {/* Chips */}
      {expanded && (
        <div
          className="px-3.5 pb-3 pt-0.5 flex flex-wrap gap-1.5"
          style={{ borderTop: `1px solid rgba(${rgb},0.10)` }}
        >
          {types.map((t) => (
            <TypeChip key={t} type={t} size="sm" />
          ))}
        </div>
      )}
    </div>
  );
}
