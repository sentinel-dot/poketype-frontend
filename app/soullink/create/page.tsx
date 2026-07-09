"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createRoom, saveCredentials, inviteToRoom } from "@/lib/soullinkApi";
import { listFriends, type AuthUser } from "@/lib/authApi";
import { useAuthStore } from "@/lib/authStore";
import { ApiError } from "@/lib/apiclient";
import { toast } from "@/lib/toastStore";

export default function CreateRoomPage() {
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  const [name, setName] = useState("");
  const [gameName, setGameName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinLink, setJoinLink] = useState<string | null>(null);
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [friends, setFriends] = useState<AuthUser[]>([]);
  const [invited, setInvited] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (createdRoomCode && authUser) {
      listFriends().then((l) => setFriends(l.friends)).catch(() => {});
    }
  }, [createdRoomCode, authUser]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await createRoom({
        name: name.trim(),
        gameName: gameName.trim() || undefined,
        displayName: authUser ? undefined : displayName.trim(),
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

  async function handleInvite(friend: AuthUser) {
    if (!createdRoomCode) return;
    try {
      await inviteToRoom(createdRoomCode, friend.id);
      setInvited((prev) => new Set(prev).add(friend.id));
      toast.success(`${friend.displayName} eingeladen.`);
    } catch {
      toast.error("Einladung fehlgeschlagen.");
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Zurück zur Startseite
        </Link>

        <div className="glass-card p-6 sm:p-8 animate-fade-in-up">
          <div className="mb-7">
            <div className="mb-2 flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: "linear-gradient(135deg, var(--primary), oklch(0.44 0.22 15))",
                  boxShadow: "0 4px 14px var(--primary-glow)",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-foreground">
                  SoulLink Room erstellen
                </h1>
                <p className="text-xs text-muted-foreground">Stream · Team · Nuzlocke</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Erstelle einen Room und teile den Link mit deinen Mitspielern.
            </p>
          </div>

          {!createdRoomCode ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="room-name">
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
                  className="input-field"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="game-name">
                  Spiel <span className="font-normal normal-case text-muted-foreground/50">(optional)</span>
                </label>
                <input
                  id="game-name"
                  type="text"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  maxLength={100}
                  placeholder="z. B. Emerald"
                  className="input-field"
                />
              </div>

              {hydrated && !authUser && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="display-name">
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
                    className="input-field"
                  />
                  <p className="text-xs text-muted-foreground/60">
                    <Link href="/login?redirect=/soullink/create" className="text-primary hover:underline">Anmelden</Link>{" "}
                    für Freunde-Einladungen &amp; gespeicherte Räume.
                  </p>
                </div>
              )}

              {error && (
                <div
                  className="flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/8 px-4 py-3"
                  role="alert"
                >
                  <svg className="mt-0.5 flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                  </svg>
                  <p className="text-sm text-foreground/80">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary mt-2 px-4 py-3 disabled:shadow-none">
                {loading ? "Erstelle Room…" : "Room erstellen"}
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-4 animate-fade-in">
              <div
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{
                  background: "oklch(0.55 0.18 150 / 0.10)",
                  border: "1px solid oklch(0.55 0.18 150 / 0.28)",
                }}
              >
                <svg className="flex-shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="oklch(0.65 0.18 150)" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <p className="text-sm font-semibold" style={{ color: "oklch(0.72 0.15 150)" }}>
                  Room erfolgreich erstellt!
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Einladungs-Link</p>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5">
                  <span className="flex-1 truncate font-mono text-xs text-muted-foreground">{joinLink}</span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="btn-ghost shrink-0 px-2.5 py-1"
                    style={
                      copied
                        ? {
                            background: "oklch(0.55 0.18 150 / 0.12)",
                            borderColor: "oklch(0.55 0.18 150 / 0.30)",
                            color: "oklch(0.65 0.18 150)",
                          }
                        : undefined
                    }
                  >
                    {copied ? "Kopiert ✓" : "Kopieren"}
                  </button>
                </div>
              </div>

              {authUser && friends.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Freunde einladen
                  </p>
                  <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto">
                    {friends.map((f) => {
                      const done = invited.has(f.id);
                      return (
                        <div key={f.id} className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
                          <span
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
                            style={{ background: "linear-gradient(135deg, var(--primary), oklch(0.44 0.22 15))" }}
                          >
                            {f.displayName.charAt(0).toUpperCase()}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                            {f.displayName}
                          </span>
                          <button
                            onClick={() => handleInvite(f)}
                            disabled={done}
                            className={done ? "badge-chip" : "btn-primary px-3 py-1.5 text-xs"}
                          >
                            {done ? "Eingeladen ✓" : "Einladen"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => router.push(`/soullink/${createdRoomCode}`)}
                className="btn-primary flex items-center justify-center gap-2 px-4 py-3"
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
