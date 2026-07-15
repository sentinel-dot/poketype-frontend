"use client";

import { memo, useState } from "react";
import { useParams } from "next/navigation";
import { useRoomStore, useSeat } from "@/lib/soullinkStore";
import EmptySeat from "./EmptySeat";
import CameraFeed from "./CameraFeed";
import ScreenStream from "./ScreenStream";
import EditableTeamBar from "./EditableTeamBar";
import DeathCounter from "./DeathCounter";

interface PlayerColumnProps {
  seatId: string;
  mySeatId: string | null;
  levelCap?: number | null;
  /** The viewer is the room admin and may edit / remove other players. */
  canEditAll?: boolean;
}

const PLAYER_ACCENT: Record<number, string> = {
  1: "player-accent-1",
  2: "player-accent-2",
  3: "player-accent-3",
};

function PlayerColumn({ seatId, mySeatId, levelCap, canEditAll }: PlayerColumnProps) {
  const params = useParams<{ roomCode: string }>();
  const roomCode = params.roomCode;
  const socket = useRoomStore((s) => s.socket);
  const seat = useSeat(seatId);
  const [confirmKick, setConfirmKick] = useState(false);

  if (!seat) return null;
  if (seat.status === "empty") {
    return <EmptySeat position={seat.position} />;
  }

  const isOwn = seat.id === mySeatId;
  const canEdit = isOwn || !!canEditAll;
  const canKick = !!canEditAll && !isOwn;
  const isDisconnected = seat.status === "disconnected";
  const accentClass = PLAYER_ACCENT[seat.position] ?? "player-accent-1";

  function handleKick() {
    if (!socket) return;
    socket.emit("room:kick", { roomCode, seatId });
    setConfirmKick(false);
  }

  return (
    <section
      className={`glass-panel flex h-full min-h-0 flex-col overflow-hidden rounded-2xl ${accentClass}`}
      style={{
        borderColor: "var(--player-accent-border)",
        boxShadow: `inset 0 1px 0 var(--player-accent)`,
      }}
    >
      {/* Name bar */}
      <header
        className="flex h-10 shrink-0 items-center justify-between px-3"
        style={{
          background: "var(--player-accent)",
          borderBottom: "1px solid var(--player-accent-border)",
        }}
      >
        <div className="flex min-w-0 items-center gap-2">
          {!isDisconnected && (
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{
                background: "var(--accent-green)",
                boxShadow: "0 0 6px var(--accent-green)",
              }}
              aria-label="Online"
            />
          )}
          <span className="truncate text-sm font-bold text-foreground">{seat.displayName}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isOwn && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{
                background: "oklch(0.55 0.22 15 / 0.20)",
                border: "1px solid oklch(0.55 0.22 15 / 0.35)",
                color: "oklch(0.80 0.18 15)",
              }}
            >
              Du
            </span>
          )}
          {isDisconnected && (
            <span className="text-[10px] text-muted-foreground/50">Getrennt</span>
          )}
          {canKick &&
            (confirmKick ? (
              <span className="flex items-center gap-1">
                <button
                  onClick={handleKick}
                  className="rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white"
                  style={{ background: "oklch(0.55 0.22 15 / 0.9)" }}
                >
                  Entfernen?
                </button>
                <button
                  onClick={() => setConfirmKick(false)}
                  className="rounded-md px-1 py-0.5 text-[10px] font-semibold text-muted-foreground hover:text-foreground"
                >
                  Abbr.
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmKick(true)}
                title="Spieler entfernen"
                aria-label="Spieler entfernen"
                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/70 transition-colors hover:bg-white/10 hover:text-foreground"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            ))}
        </div>
      </header>

      {/* Camera */}
      <div
        className="relative flex-[2] min-h-0 overflow-hidden"
        style={{
          borderBottom: "1px solid oklch(0.95 0 0 / 0.07)",
          background: "var(--stream-bg)",
        }}
      >
        <DeathCounter seatId={seat.id} isOwn={canEdit} />
        <CameraFeed seatId={seat.id} isOwn={isOwn} />
      </div>

      {/* Team bar */}
      <div
        className="h-28 shrink-0"
        style={{
          borderBottom: "1px solid oklch(0.95 0 0 / 0.07)",
          background: "oklch(0.08 0.015 260 / 0.6)",
        }}
      >
        <EditableTeamBar seatId={seat.id} slots={seat.teamSlots} isOwn={canEdit} levelCap={levelCap} />
      </div>

      {/* Screen stream */}
      <div className="flex-[3] min-h-0 overflow-hidden">
        <ScreenStream seatId={seat.id} isOwn={isOwn} />
      </div>
    </section>
  );
}

export default memo(PlayerColumn);
