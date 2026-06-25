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

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4">
        <div
          className="rounded-2xl px-5 py-4 flex items-start gap-3 max-w-sm w-full"
          style={{ background: "oklch(0.55 0.22 15 / 0.08)", border: "1px solid oklch(0.55 0.22 15 / 0.25)" }}
          role="alert"
        >
          <svg className="flex-shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
          </svg>
          <p className="text-sm text-foreground/80">{error}</p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors underline"
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
    <div
      className="flex h-screen w-screen flex-col overflow-hidden p-3 gap-3"
      style={{ background: "var(--background)" }}
    >
      {/* Header */}
      <header
        className="flex shrink-0 items-center justify-between gap-2 rounded-xl px-3 py-2"
        style={{
          background: "oklch(0.11 0.03 260 / 0.85)",
          border: "1px solid oklch(0.95 0 0 / 0.08)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-sm font-bold text-foreground truncate max-w-[120px] sm:max-w-xs">
            {room.name}
          </h1>
          <span
            className="hidden sm:block shrink-0 rounded-lg px-2 py-0.5 font-mono text-xs text-muted-foreground"
            style={{ background: "oklch(0.95 0 0 / 0.05)", border: "1px solid oklch(0.95 0 0 / 0.08)" }}
          >
            {room.roomCode}
          </span>
          <span
            className="hidden sm:block shrink-0 rounded-lg px-2 py-0.5 text-xs text-muted-foreground"
            style={{ background: "oklch(0.95 0 0 / 0.05)", border: "1px solid oklch(0.95 0 0 / 0.08)" }}
          >
            {POOL_LABELS[room.pokemonPool]}
          </span>
          {room.gameName && (
            <span
              className="hidden md:block shrink-0 rounded-lg px-2 py-0.5 text-xs text-muted-foreground"
              style={{ background: "oklch(0.95 0 0 / 0.05)", border: "1px solid oklch(0.95 0 0 / 0.08)" }}
            >
              {room.gameName}
            </span>
          )}
        </div>

        <button
          onClick={handleLeave}
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-200"
          style={{
            background: "oklch(0.55 0.22 15 / 0.07)",
            border: "1px solid oklch(0.55 0.22 15 / 0.22)",
            color: "oklch(0.72 0.16 15)",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="hidden sm:inline">Verlassen</span>
        </button>
      </header>

      {/* Player grid — wrapped in LiveKitRoom when available */}
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

