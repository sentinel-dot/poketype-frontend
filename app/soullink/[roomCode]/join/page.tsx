"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { joinRoom, saveCredentials } from "@/lib/soullinkApi";
import { ApiError } from "@/lib/apiclient";

export default function JoinRoomPage() {
  const router = useRouter();
  const params = useParams<{ roomCode: string }>();
  const roomCode = params.roomCode;

  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await joinRoom(roomCode, displayName.trim());
      saveCredentials(roomCode, res.participantToken, res.seatId);
      router.push(`/soullink/${roomCode}`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) setError("Der Room ist bereits voll.");
        else if (err.status === 404) setError("Room nicht gefunden. Überprüfe den Link.");
        else setError(err.message);
      } else {
        setError("Unbekannter Fehler. Bitte versuche es erneut.");
      }
    } finally {
      setLoading(false);
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
                  background: "linear-gradient(135deg, var(--accent-blue), oklch(0.44 0.22 250))",
                  boxShadow: "0 4px 14px oklch(0.55 0.22 250 / 0.25)",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-foreground">
                  Room beitreten
                </h1>
                <p className="text-xs text-muted-foreground">SoulLink Session</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Room-Code:{" "}
              <span className="font-mono font-bold text-primary">{roomCode}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                autoFocus
                placeholder="z. B. Misty"
                className="input-field"
              />
            </div>

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
              {loading ? "Trete bei…" : "Beitreten"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
