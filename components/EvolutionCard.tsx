"use client";

import Image from "next/image";
import type { EvoNode, EvolutionResponse } from "@/lib/types";
import { getArtworkUrl } from "@/lib/apiclient";

interface Props {
  data: EvolutionResponse;
  currentId: number;
  onSelect: (nameEN: string) => void;
}

function EvolutionArrow({ method }: { method: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-1 min-w-[56px]">
      {method && (
        <span
          className="text-[10px] font-medium text-center leading-tight"
          style={{ color: "oklch(0.65 0.12 260)" }}
        >
          {method}
        </span>
      )}
      <svg
        width="22"
        height="14"
        viewBox="0 0 22 14"
        fill="none"
        style={{ flexShrink: 0 }}
      >
        <path
          d="M1 7h18M15 2l5 5-5 5"
          stroke="oklch(0.55 0.15 260 / 0.6)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function PokemonTile({
  node,
  isCurrent,
  onSelect,
}: {
  node: EvoNode;
  isCurrent: boolean;
  onSelect: (nameEN: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(node.nameEN)}
      title={node.name}
      className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl transition-all duration-200 cursor-pointer active:scale-95"
      style={{
        background: isCurrent
          ? "oklch(0.55 0.22 15 / 0.12)"
          : "oklch(0.13 0.025 260 / 0.5)",
        border: isCurrent
          ? "1.5px solid oklch(0.55 0.22 15 / 0.45)"
          : "1px solid oklch(0.3 0.04 260 / 0.4)",
        boxShadow: isCurrent
          ? "0 0 18px oklch(0.55 0.22 15 / 0.15)"
          : "none",
        minWidth: "76px",
      }}
    >
      <div className="relative w-16 h-16">
        <Image
          src={getArtworkUrl(node.id)}
          alt={node.name}
          fill
          className="object-contain drop-shadow-sm"
          sizes="64px"
          unoptimized
        />
      </div>
      <span
        className="text-[11px] font-semibold text-center leading-tight"
        style={{
          color: isCurrent ? "oklch(0.9 0.12 15)" : "var(--foreground)",
          maxWidth: "72px",
        }}
      >
        {node.name}
      </span>
      {isCurrent && (
        <span
          className="text-[9px] font-bold uppercase tracking-widest"
          style={{ color: "oklch(0.65 0.18 15)" }}
        >
          Aktuell
        </span>
      )}
    </button>
  );
}

function ChainRow({
  node,
  currentId,
  onSelect,
}: {
  node: EvoNode;
  currentId: number;
  onSelect: (nameEN: string) => void;
}) {
  return (
    <div className="flex items-center">
      <PokemonTile node={node} isCurrent={node.id === currentId} onSelect={onSelect} />
      {node.evolvesTo.length > 0 && (
        <div className="flex flex-col gap-3">
          {node.evolvesTo.map((evo, i) => (
            <div key={i} className="flex items-center">
              <EvolutionArrow method={evo.method} />
              <ChainRow node={evo.node} currentId={currentId} onSelect={onSelect} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EvolutionCard({ data, currentId, onSelect }: Props) {
  const isAlone =
    data.chain.evolvesTo.length === 0;

  return (
    <div
      className="rounded-2xl p-5 animate-fade-in-up"
      style={{
        background: "oklch(0.11 0.025 260 / 0.6)",
        border: "1px solid oklch(0.25 0.04 260 / 0.5)",
      }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-widest mb-4"
        style={{ color: "oklch(0.55 0.12 260)" }}
      >
        Entwicklungskette
      </p>

      {isAlone ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <PokemonTile node={data.chain} isCurrent={true} onSelect={onSelect} />
          <p className="text-xs text-muted-foreground">
            Dieses Pokémon entwickelt sich nicht.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto pb-1">
          <div className="inline-flex">
            <ChainRow node={data.chain} currentId={currentId} onSelect={onSelect} />
          </div>
        </div>
      )}
    </div>
  );
}
