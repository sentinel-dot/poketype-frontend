"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { fetchSuggestions } from "@/lib/apiclient";

interface SearchResult {
  id: number;
  nameDE: string | null;
  nameEN: string | null;
}

interface PokemonSearchInputProps {
  value: SearchResult | null;
  onChange: (result: SearchResult | null) => void;
  maxNationalDex?: number | null;
  placeholder?: string;
}

export default function PokemonSearchInput({
  value,
  onChange,
  maxNationalDex,
  placeholder = "Pokémon suchen…",
}: PokemonSearchInputProps) {
  const [query, setQuery] = useState(value ? (value.nameDE ?? value.nameEN ?? "") : "");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external value reset
  useEffect(() => {
    if (!value) setQuery("");
  }, [value]);

  const search = useCallback(
    async (q: string) => {
      if (q.trim().length < 3) {
        setResults([]);
        setOpen(false);
        return;
      }
      try {
        const data = await fetchSuggestions(q, maxNationalDex);
        setResults(data);
        setOpen(data.length > 0);
        setActiveIdx(-1);
      } catch {
        // silently ignore search errors
      }
    },
    [maxNationalDex]
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    onChange(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 300);
  }

  function selectResult(result: SearchResult) {
    onChange(result);
    setQuery(result.nameDE ?? result.nameEN ?? "");
    setOpen(false);
    setResults([]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      selectResult(results[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-all duration-200 focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
      />
      {open && results.length > 0 && (
        <ul
          className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-xl"
          style={{
            background: "oklch(0.12 0.025 260 / 0.97)",
            border: "1px solid oklch(0.95 0 0 / 0.1)",
            boxShadow: "0 8px 32px oklch(0 0 0 / 0.5)",
            backdropFilter: "blur(12px)",
          }}
        >
          {results.map((r, i) => (
            <li key={r.id}>
              <button
                type="button"
                onMouseDown={() => selectResult(r)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors"
                style={{
                  background: i === activeIdx ? "oklch(0.95 0 0 / 0.07)" : "transparent",
                  color: i === activeIdx ? "var(--foreground)" : "oklch(0.65 0 0)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${r.id}.png`}
                  alt=""
                  className="h-7 w-7 object-contain flex-shrink-0"
                />
                <span className="flex-1 font-medium">
                  {r.nameDE ?? r.nameEN}
                  {r.nameEN && r.nameEN !== r.nameDE && (
                    <span className="ml-1 text-xs text-muted-foreground/50">({r.nameEN})</span>
                  )}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground/40">#{r.id}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
