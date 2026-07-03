"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { LiveKitRoom } from "@livekit/components-react";
import { getRoom, loadCredentials, clearCredentials, leaveRoom } from "@/lib/soullinkApi";
import { useRoomStore } from "@/lib/soullinkStore";
import { useRoomSocket } from "@/lib/hooks/useRoomSocket";
import { useLiveKit } from "@/lib/hooks/useLiveKit";
import PlayerColumn from "@/components/soullink/PlayerColumn";
import { POOL_LABELS } from "@/lib/soullinkTypes";

export default function RoomPage() {
  const router = useRouter();
  const params = useParams<{ roomCode: string }>();
  const roomCode = params.roomCode;

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  const room = useRoomStore((s) => s.room);
  const seats = useRoomStore((s) => s.seats);
  const myToken = useRoomStore((s) => s.myToken);
  const mySeatId = useRoomStore((s) => s.mySeatId);
  const setMyCredentials = useRoomStore((s) => s.setMyCredentials);
  const setRoomState = useRoomStore((s) => s.setRoomState);
  const reset = useRoomStore((s) => s.reset);

  useRoomSocket(roomCode, myToken, setError);
  const liveKit = useLiveKit(roomCode, mySeatId, myToken);

  useEffect(() => {
    const creds = loadCredentials(roomCode);
    if (!creds) {
      router.replace(`/soullink/${roomCode}/join`);
      return;
    }
    setMyCredentials(creds.token, creds.seatId);
    getRoom(roomCode)
      .then((state) => { setRoomState(state); setReady(true); })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Room konnte nicht geladen werden.");
      });
    return () => { reset(); };
  }, [roomCode]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleLeave() {
    if (myToken) await leaveRoom(roomCode, myToken);
    clearCredentials(roomCode);
    reset();
    router.push("/");
  }

  async function handleCopyCode() {
    await navigator.clipboard.writeText(roomCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4">
        <div
          className="flex w-full max-w-sm items-start gap-3 rounded-2xl border border-primary/25 bg-primary/8 px-5 py-4"
          role="alert"
        >
          <svg className="mt-0.5 flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
          </svg>
          <p className="text-sm text-foreground/80">{error}</p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="mt-4 text-sm text-muted-foreground underline transition-colors hover:text-foreground"
        >
          Zurück zur Startseite
        </button>
      </main>
    );
  }

  if (!ready || !room) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="pokeball" aria-label="Lade Daten…" />
      </main>
    );
  }

  const sorted = [...seats].sort((a, b) => a.position - b.position);

  const playerGrid = (
    <div className="grid min-h-0 flex-1 grid-cols-3 gap-3">
      {sorted.map((seat) => (
        <PlayerColumn key={seat.id} seat={seat} mySeatId={mySeatId} />
      ))}
    </div>
  );

  return (
    <div className="flex h-screen w-screen flex-col gap-3 overflow-hidden p-3">
      {/* Header */}
      <header className="glass-panel flex shrink-0 items-center justify-between gap-2 rounded-xl px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{
              background: "linear-gradient(135deg, var(--primary), oklch(0.44 0.22 15))",
              boxShadow: "0 4px 12px var(--primary-glow)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h1 className="max-w-[120px] truncate text-sm font-bold text-foreground sm:max-w-xs">
            {room.name}
          </h1>
          <button
            type="button"
            onClick={handleCopyCode}
            title="Room-Code kopieren"
            className="badge-chip hidden font-mono transition-all hover:brightness-110 sm:block"
            style={
              codeCopied
                ? {
                    background: "oklch(0.55 0.18 150 / 0.12)",
                    borderColor: "oklch(0.55 0.18 150 / 0.30)",
                    color: "oklch(0.72 0.15 150)",
                  }
                : undefined
            }
          >
            {codeCopied ? "Kopiert ✓" : room.roomCode}
          </button>
          <span
            className="badge-chip hidden sm:block"
            style={{
              background: "oklch(0.55 0.22 250 / 0.10)",
              borderColor: "oklch(0.55 0.22 250 / 0.25)",
              color: "oklch(0.75 0.15 250)",
            }}
          >
            {POOL_LABELS[room.pokemonPool]}
          </span>
          {room.gameName && (
            <span
              className="badge-chip hidden md:block"
              style={{
                background: "oklch(0.55 0.18 150 / 0.10)",
                borderColor: "oklch(0.55 0.18 150 / 0.25)",
                color: "oklch(0.75 0.15 150)",
              }}
            >
              {room.gameName}
            </span>
          )}
        </div>

        <button onClick={handleLeave} className="btn-destructive flex shrink-0 items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="hidden sm:inline">Verlassen</span>
        </button>
      </header>

      {liveKit ? (
        <LiveKitRoom
          serverUrl={liveKit.url}
          token={liveKit.token}
          connect={true}
          audio={false}
          video={false}
          options={{ adaptiveStream: true, dynacast: true }}
          className="contents"
        >
          {playerGrid}
        </LiveKitRoom>
      ) : (
        playerGrid
      )}
    </div>
  );
}
