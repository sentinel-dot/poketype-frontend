"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { fetchSuggestions, type PokemonSuggestion } from "@/lib/apiclient";

interface Props {
  onSearch: (name: string, gen: number) => void;
  loading: boolean;
}

const GENS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function SearchBar({ onSearch, loading }: Props) {
  const [name, setName] = useState("");
  const [query, setQuery] = useState(""); // only set on user input, drives autocomplete
  const [gen, setGen] = useState(9);
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<PokemonSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showGenDropdown, setShowGenDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch suggestions with debounce — driven by query, not name
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const results = await fetchSuggestions(query.trim());
      setSuggestions(results);
      setActiveIndex(-1);
      setShowSuggestions(results.length > 0);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setShowGenDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) {
      setShowSuggestions(false);
      onSearch(trimmed, gen);
    }
  }

  function selectSuggestion(suggestion: PokemonSuggestion) {
    const selectedName = suggestion.nameEN ?? suggestion.nameDE ?? "";
    setName(selectedName);
    setQuery(""); // reset query → effect clears suggestions, no new fetch
    setShowSuggestions(false);
    setSuggestions([]);
    onSearch(selectedName, gen);
    inputRef.current?.blur();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  }

  const canSubmit = !loading && name.trim().length > 0;

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit} role="search">
        <div
          className="flex gap-2 rounded-2xl p-1.5 transition-all duration-300"
          style={{
            background: focused ? "oklch(0.95 0 0 / 0.06)" : "oklch(0.95 0 0 / 0.04)",
            border: focused
              ? "1px solid oklch(0.55 0.22 15 / 0.4)"
              : "1px solid oklch(0.95 0 0 / 0.08)",
            boxShadow: focused
              ? "0 0 0 3px oklch(0.55 0.22 15 / 0.08), 0 8px 32px oklch(0 0 0 / 0.3)"
              : "0 4px 16px oklch(0 0 0 / 0.2)",
          }}
        >
          {/* Search icon */}
          <div className="flex items-center pl-2 text-muted-foreground flex-shrink-0">
            <svg
              width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>

          <input
            ref={inputRef}
            type="search"
            className="flex-1 min-w-0 bg-transparent text-foreground py-2.5 pr-2
                       placeholder:text-muted-foreground/50 focus:outline-none
                       disabled:opacity-40 text-base font-medium
                       [&::-webkit-search-cancel-button]:hidden"
            placeholder="Pokémon-Name eingeben…"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setQuery(e.target.value);
            }}
            onFocus={() => {
              setFocused(true);
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            onBlur={() => setFocused(false)}
            onKeyDown={handleKeyDown}
            aria-label="Pokémon-Name"
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            disabled={loading}
          />

          {/* Clear button */}
          {name && (
            <button
              type="button"
              onClick={() => {
                setName("");
                setQuery("");
                setSuggestions([]);
                setShowSuggestions(false);
                inputRef.current?.focus();
              }}
              className="flex-shrink-0 self-center flex items-center justify-center w-5 h-5 rounded-full cursor-pointer"
              style={{ color: "oklch(0.6 0 0)" }}
              aria-label="Eingabe löschen"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Divider */}
          <div className="flex-shrink-0 flex items-center">
            <div className="h-7 w-px mx-1 bg-border" />
          </div>

          {/* Gen dropdown trigger */}
          <button
            type="button"
            onClick={() => setShowGenDropdown(v => !v)}
            disabled={loading}
            className="flex-shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-lg
                       text-sm font-semibold transition-colors disabled:opacity-40 cursor-pointer"
            style={{ color: "oklch(0.75 0 0)" }}
            aria-label="Generation wählen"
          >
            <span>Gen {gen}</span>
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              className="transition-transform duration-200"
              style={{ transform: showGenDropdown ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex-shrink-0 rounded-xl px-4 py-2 text-sm font-bold text-primary-foreground
                       transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 cursor-pointer"
            style={{
              background: canSubmit
                ? "linear-gradient(135deg, var(--primary), oklch(0.44 0.22 15))"
                : "oklch(0.95 0 0 / 0.08)",
              boxShadow: canSubmit ? "0 4px 14px var(--primary-glow)" : "none",
              color: canSubmit ? "white" : "oklch(0.95 0 0 / 0.3)",
            }}
            aria-label="Suchen"
          >
            {loading ? (
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            )}
          </button>
        </div>

        <p className="text-xs text-muted-foreground/50 mt-2 px-1">
          Deutsch oder Englisch · z.B.{" "}
          <span className="text-muted-foreground">Glurak</span>,{" "}
          <span className="text-muted-foreground">Charizard</span>,{" "}
          <span className="text-muted-foreground">Mewtwo</span>
        </p>
      </form>

      {/* Gen dropdown */}
      {showGenDropdown && (
        <div
          className="absolute right-0 mt-1 rounded-xl overflow-hidden z-50 py-1"
          style={{
            background: "oklch(0.12 0.02 240 / 0.97)",
            border: "1px solid oklch(0.95 0 0 / 0.1)",
            boxShadow: "0 8px 32px oklch(0 0 0 / 0.5)",
            backdropFilter: "blur(12px)",
            minWidth: "100px",
          }}
        >
          {GENS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => {
                setGen(g);
                setShowGenDropdown(false);
              }}
              className="w-full flex items-center justify-between gap-4 px-4 py-2 text-sm
                         font-semibold cursor-pointer transition-colors"
              style={{
                background: g === gen ? "oklch(0.95 0 0 / 0.06)" : "transparent",
                color: g === gen ? "oklch(0.95 0 0)" : "oklch(0.65 0 0)",
              }}
            >
              <span>Gen {g}</span>
              {g === gen && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Autocomplete dropdown */}
      {showSuggestions && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 mt-1 rounded-xl overflow-hidden z-50"
          style={{
            background: "oklch(0.12 0.02 240 / 0.97)",
            border: "1px solid oklch(0.95 0 0 / 0.1)",
            boxShadow: "0 8px 32px oklch(0 0 0 / 0.5)",
            backdropFilter: "blur(12px)",
          }}
        >
          {suggestions.map((s, i) => (
            <li
              key={s.id}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={(e) => {
                e.preventDefault(); // prevent blur before click
                selectSuggestion(s);
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className="flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors"
              style={{
                background: i === activeIndex
                  ? "oklch(0.95 0 0 / 0.06)"
                  : "transparent",
              }}
            >
              {/* Sprite */}
              <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center">
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${s.id}.png`}
                  alt=""
                  width={36}
                  height={36}
                  style={{ imageRendering: "pixelated" }}
                />
              </div>

              {/* Names */}
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-foreground">
                  {s.nameDE ?? s.nameEN}
                </span>
                {s.nameDE && s.nameEN && s.nameDE !== s.nameEN && (
                  <span className="text-xs text-muted-foreground ml-2">
                    {s.nameEN}
                  </span>
                )}
              </div>

              {/* Pokedex number */}
              <span className="text-xs text-muted-foreground/50 flex-shrink-0">
                #{String(s.id).padStart(3, "0")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
