"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createRoom, saveCredentials } from "@/lib/soullinkApi";
import { POOL_LABELS, type PokemonPool } from "@/lib/soullinkTypes";
import { ApiError } from "@/lib/apiclient";

const POOLS = Object.entries(POOL_LABELS) as [PokemonPool, string][];

const inputCls =
  "w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-all duration-200 focus:border-primary/40 focus:ring-2 focus:ring-primary/10";

export default function CreateRoomPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pool, setPool] = useState<PokemonPool>("all");
  const [gameName, setGameName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinLink, setJoinLink] = useState<string | null>(null);
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await createRoom({
        name: name.trim(),
        pokemonPool: pool,
        gameName: gameName.trim() || undefined,
        displayName: displayName.trim(),
      });
      saveCredentials(res.roomCode, res.participantToken, res.seatId);
      const link = `${window.location.origin}/soullink/${res.roomCode}/join`;
      setJoinLink(link);
      setCreatedRoomCode(res.roomCode);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError("Room-Code konnte nicht generiert werden. Bitte versuche es erneut.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Unbekannter Fehler. Bitte versuche es erneut.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!joinLink) return;
    await navigator.clipboard.writeText(joinLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Zurück zur Startseite
        </Link>

        <div
          className="rounded-2xl p-6 sm:p-8"
          style={{
            background: "oklch(0.11 0.03 260 / 0.9)",
            border: "1px solid oklch(0.95 0 0 / 0.08)",
            boxShadow: "0 32px 64px oklch(0 0 0 / 0.4), inset 0 1px 0 oklch(0.95 0 0 / 0.06)",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Header */}
          <div className="mb-7">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, var(--primary), oklch(0.44 0.22 15))",
                  boxShadow: "0 4px 14px var(--primary-glow)",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h1 className="text-xl font-black tracking-tight text-foreground">
                SoulLink Room erstellen
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Erstelle einen Room und teile den Link mit deinen Mitspielern.
            </p>
          </div>

          {!createdRoomCode ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider" htmlFor="room-name">
                  Room-Name <span className="text-primary">*</span>
                </label>
                <input
                  id="room-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={200}
                  required
                  placeholder="z. B. Nuzlocke mit Freunden"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider" htmlFor="pool">
                  Pokémon-Pool <span className="text-primary">*</span>
                </label>
                <select
                  id="pool"
                  value={pool}
                  onChange={(e) => setPool(e.target.value as PokemonPool)}
                  className={inputCls}
                >
                  {POOLS.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider" htmlFor="game-name">
                  Spiel <span className="text-muted-foreground/50 normal-case font-normal">(optional)</span>
                </label>
                <input
                  id="game-name"
                  type="text"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  maxLength={100}
                  placeholder="z. B. Emerald"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider" htmlFor="display-name">
                  Dein Name <span className="text-primary">*</span>
                </label>
                <input
                  id="display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={100}
                  required
                  placeholder="z. B. Ash"
                  className={inputCls}
                />
              </div>

              {error && (
                <div
                  className="rounded-xl px-4 py-3 flex items-start gap-3"
                  style={{ background: "oklch(0.55 0.22 15 / 0.08)", border: "1px solid oklch(0.55 0.22 15 / 0.25)" }}
                  role="alert"
                >
                  <svg className="flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                  </svg>
                  <p className="text-sm text-foreground/80">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition-all duration-200 disabled:opacity-50 active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, var(--primary), oklch(0.44 0.22 15))",
                  boxShadow: loading ? "none" : "0 4px 20px var(--primary-glow)",
                }}
              >
                {loading ? "Erstelle Room…" : "Room erstellen"}
              </button>
            </form>
          ) : (
            /* Success state */
            <div className="flex flex-col gap-4">
              <div
                className="rounded-xl px-4 py-3 flex items-center gap-3"
                style={{ background: "oklch(0.55 0.18 150 / 0.08)", border: "1px solid oklch(0.55 0.18 150 / 0.25)" }}
              >
                <svg className="flex-shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="oklch(0.65 0.18 150)" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <p className="text-sm font-semibold" style={{ color: "oklch(0.72 0.15 150)" }}>
                  Room erfolgreich erstellt!
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Einladungs-Link</p>
                <div
                  className="flex items-center gap-2 rounded-xl px-3.5 py-2.5"
                  style={{ background: "oklch(0.13 0.04 260)", border: "1px solid oklch(0.95 0 0 / 0.1)" }}
                >
                  <span className="flex-1 truncate text-xs text-muted-foreground font-mono">{joinLink}</span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="shrink-0 flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all duration-200"
                    style={{
                      background: copied ? "oklch(0.55 0.18 150 / 0.12)" : "oklch(0.55 0.22 15 / 0.12)",
                      border: `1px solid ${copied ? "oklch(0.55 0.18 150 / 0.3)" : "oklch(0.55 0.22 15 / 0.3)"}`,
                      color: copied ? "oklch(0.65 0.18 150)" : "oklch(0.75 0.18 15)",
                    }}
                  >
                    {copied ? "Kopiert ✓" : "Kopieren"}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push(`/soullink/${createdRoomCode}`)}
                className="rounded-xl px-4 py-3 text-sm font-bold text-white transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(135deg, var(--primary), oklch(0.44 0.22 15))",
                  boxShadow: "0 4px 20px var(--primary-glow)",
                }}
              >
                Zum Room
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
