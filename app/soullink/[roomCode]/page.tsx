"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import { LiveKitRoom } from "@livekit/components-react";
import { getRoom, loadCredentials, clearCredentials, leaveRoom } from "@/lib/soullinkApi";
import { useRoomStore, useGraveyard } from "@/lib/soullinkStore";
import { useAuthStore } from "@/lib/authStore";
import { useRoomSocket, type ConnectionState } from "@/lib/hooks/useRoomSocket";
import { useLiveKit } from "@/lib/hooks/useLiveKit";
import { toast } from "@/lib/toastStore";
import PlayerColumn from "@/components/soullink/PlayerColumn";
import GraveyardPanel from "@/components/soullink/GraveyardPanel";
import EncounterMatrix from "@/components/soullink/EncounterMatrix";
import RoomSettingsModal from "@/components/soullink/RoomSettingsModal";

const CONNECTION_META: Record<ConnectionState, { label: string; color: string }> = {
  connecting: { label: "Verbinde…", color: "oklch(0.75 0.15 90)" },
  online: { label: "Online", color: "oklch(0.7 0.18 150)" },
  reconnecting: { label: "Verbinde neu…", color: "oklch(0.75 0.15 90)" },
  offline: { label: "Offline", color: "oklch(0.65 0.22 15)" },
};

export default function RoomPage() {
  const router = useRouter();
  const params = useParams<{ roomCode: string }>();
  const roomCode = params.roomCode;

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showGraveyard, setShowGraveyard] = useState(false);
  const [showEncounters, setShowEncounters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const room = useRoomStore((s) => s.room);
  // Subscribe only to the stable seat ORDER — not the seat contents. Each
  // PlayerColumn subscribes to its own seat via useSeat, so a slot edit
  // re-renders just that column, never the whole grid (and never the video).
  const seatOrder = useRoomStore(
    useShallow((s) => [...s.seats].sort((a, b) => a.position - b.position).map((x) => x.id))
  );
  const graveyard = useGraveyard();
  const myToken = useRoomStore((s) => s.myToken);
  const mySeatId = useRoomStore((s) => s.mySeatId);
  const setMyCredentials = useRoomStore((s) => s.setMyCredentials);
  const setRoomState = useRoomStore((s) => s.setRoomState);
  const reset = useRoomStore((s) => s.reset);
  const authUser = useAuthStore((s) => s.user);

  const { connection } = useRoomSocket(roomCode, myToken, (message) => {
    // Our seat was reclaimed (stale disconnect) and handed to someone else —
    // the stored token no longer resolves. Drop it and send the user through
    // the normal (capacity-checked) join flow instead of showing a raw error.
    if (message === "Invalid token or room code") {
      clearCredentials(roomCode);
      router.replace(`/soullink/${roomCode}/join`);
      return;
    }
    setError(message);
  }, {
    onLinkedDeath: () => {
      toast.warning("Verknüpfter Tod! Die Partner-Pokémon dieser Route sind gefallen.");
    },
    onSeatJoined: (name) => toast.info(`${name ?? "Ein Spieler"} ist beigetreten.`),
    onSeatLeft: () => toast.info("Ein Spieler hat den Raum verlassen."),
    onKicked: () => {
      clearCredentials(roomCode);
      reset();
      toast.warning("Du wurdest vom Admin aus dem Raum entfernt.");
      router.replace("/");
    },
  });
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

  const isOwner = !!(room.ownerUserId && authUser && room.ownerUserId === authUser.id);
  const conn = CONNECTION_META[connection];

  const playerGrid = (
    <div
      className={`grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto [grid-auto-rows:78vh] md:overflow-hidden md:[grid-auto-rows:auto] ${
        room.maxPlayers === 2 ? "md:grid-cols-2" : "md:grid-cols-3"
      }`}
    >
      {seatOrder.map((seatId) => (
        <PlayerColumn
          key={seatId}
          seatId={seatId}
          mySeatId={mySeatId}
          levelCap={room.levelCap}
          canEditAll={isOwner}
        />
      ))}
    </div>
  );

  return (
    <div className="flex h-[100dvh] w-screen flex-col gap-3 overflow-hidden p-3">
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
          <h1 className="max-w-[110px] truncate text-sm font-bold text-foreground sm:max-w-xs">
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
          {typeof room.badges === "number" && room.badges > 0 && (
            <span className="badge-chip hidden md:block" title="Orden">
              🎖 {room.badges}
            </span>
          )}
          {room.levelCap != null && (
            <span
              className="badge-chip hidden md:block"
              style={{
                background: "oklch(0.65 0.2 60 / 0.10)",
                borderColor: "oklch(0.65 0.2 60 / 0.25)",
                color: "oklch(0.82 0.16 70)",
              }}
              title="Level-Cap"
            >
              Cap Lv{room.levelCap}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* Connection status */}
          <span className="hidden items-center gap-1.5 text-xs font-semibold sm:flex" style={{ color: conn.color }}>
            <span
              className="h-2 w-2 rounded-full"
              style={{
                background: conn.color,
                boxShadow: `0 0 6px ${conn.color}`,
                animation: connection === "online" ? undefined : "pulse 1.4s ease-in-out infinite",
              }}
            />
            {conn.label}
          </span>

          {/* Encounter matrix */}
          <button
            onClick={() => setShowEncounters(true)}
            title="Begegnungen (Route-Tracker)"
            aria-label="Begegnungen"
            className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-sm transition-colors hover:brightness-110"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
            </svg>
            <span className="hidden text-xs font-bold text-muted-foreground sm:inline">Begegnungen</span>
          </button>

          {/* Graveyard */}
          <button
            onClick={() => setShowGraveyard(true)}
            title="Friedhof"
            aria-label="Friedhof"
            className="flex h-8 items-center gap-1 rounded-lg border border-border bg-card px-2 text-sm transition-colors hover:brightness-110"
          >
            🪦 <span className="text-xs font-bold text-muted-foreground">{graveyard.length}</span>
          </button>

          {isOwner && (
            <button
              onClick={() => setShowSettings(true)}
              title="Einstellungen"
              aria-label="Einstellungen"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:brightness-110"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          )}

          <button onClick={handleLeave} className="btn-destructive flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className="hidden sm:inline">Verlassen</span>
          </button>
        </div>
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

      {showGraveyard && <GraveyardPanel entries={graveyard} onClose={() => setShowGraveyard(false)} />}
      {showEncounters && (
        <EncounterMatrix
          mySeatId={mySeatId}
          canEditAll={isOwner}
          onClose={() => setShowEncounters(false)}
        />
      )}
      {showSettings && <RoomSettingsModal room={room} onClose={() => setShowSettings(false)} />}
    </div>
  );
}
