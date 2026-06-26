"use client";

import { useState, useEffect, useRef } from "react";
import { fetchSuggestions, getPixelSpriteUrl, type PokemonSuggestion } from "@/lib/apiclient";

interface PokemonSearchInputProps {
  value: PokemonSuggestion | null;
  onChange: (result: PokemonSuggestion | null) => void;
  maxNationalDex?: number | null;
  placeholder?: string;
}

const dropdownStyle = {
  background: "oklch(0.12 0.02 240 / 0.97)",
  border: "1px solid oklch(0.95 0 0 / 0.1)",
  boxShadow: "0 8px 32px oklch(0 0 0 / 0.5)",
  backdropFilter: "blur(12px)",
} as const;

export default function PokemonSearchInput({
  value,
  onChange,
  maxNationalDex,
  placeholder = "Pokémon suchen…",
}: PokemonSearchInputProps) {
  const [name, setName] = useState(value ? (value.nameDE ?? value.nameEN ?? "") : "");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PokemonSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value) setName("");
  }, [value]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const results = await fetchSuggestions(query.trim());
      const filtered =
        maxNationalDex != null ? results.filter((r) => r.id <= maxNationalDex) : results;
      setSuggestions(filtered);
      setActiveIndex(-1);
      setShowSuggestions(filtered.length > 0);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, maxNationalDex]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectSuggestion(suggestion: PokemonSuggestion) {
    onChange(suggestion);
    setName(suggestion.nameDE ?? suggestion.nameEN ?? "");
    setQuery("");
    setShowSuggestions(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="search"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setQuery(e.target.value);
          onChange(null);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) setShowSuggestions(true);
        }}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-all duration-200 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 [&::-webkit-search-cancel-button]:hidden"
      />

      {showSuggestions && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-xl"
          style={dropdownStyle}
        >
          {suggestions.map((s, i) => (
            <li
              key={s.id}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={(e) => {
                e.preventDefault();
                selectSuggestion(s);
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className="flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors"
              style={{
                background: i === activeIndex ? "oklch(0.95 0 0 / 0.06)" : "transparent",
              }}
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getPixelSpriteUrl(s.id)}
                  alt=""
                  width={36}
                  height={36}
                  style={{ imageRendering: "pixelated" }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-sm font-semibold text-foreground">
                  {s.nameDE ?? s.nameEN}
                </span>
                {s.nameDE && s.nameEN && s.nameDE !== s.nameEN && (
                  <span className="ml-2 text-xs text-muted-foreground">{s.nameEN}</span>
                )}
              </div>
              <span className="flex-shrink-0 text-xs text-muted-foreground/50">
                #{String(s.id).padStart(3, "0")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
