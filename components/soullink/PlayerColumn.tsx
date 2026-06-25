"use client";

import type { SoulLinkSeat } from "@/lib/soullinkTypes";
import EmptySeat from "./EmptySeat";
import CameraFeed from "./CameraFeed";
import ScreenStream from "./ScreenStream";
import EditableTeamBar from "./EditableTeamBar";

interface PlayerColumnProps {
  seat: SoulLinkSeat;
  mySeatId: string | null;
}

export default function PlayerColumn({ seat, mySeatId }: PlayerColumnProps) {
  if (seat.status === "empty") {
    return <EmptySeat position={seat.position} />;
  }

  const isOwn = seat.id === mySeatId;
  const isDisconnected = seat.status === "disconnected";

  return (
    <section
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl"
      style={{
        border: "1px solid oklch(0.95 0 0 / 0.08)",
        background: "oklch(0.10 0.025 260 / 0.7)",
      }}
    >
      {/* Name bar */}
      <header
        className="flex h-9 shrink-0 items-center justify-between px-3"
        style={{
          background: "oklch(0.13 0.03 260 / 0.9)",
          borderBottom: "1px solid oklch(0.95 0 0 / 0.07)",
        }}
      >
        <span className="text-sm font-bold text-foreground truncate">{seat.displayName}</span>
        <div className="flex items-center gap-2 shrink-0">
          {isOwn && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{
                background: "oklch(0.55 0.22 15 / 0.15)",
                border: "1px solid oklch(0.55 0.22 15 / 0.3)",
                color: "oklch(0.75 0.18 15)",
              }}
            >
              Du
            </span>
          )}
          {isDisconnected && (
            <span className="text-[10px] text-muted-foreground/50">• Getrennt</span>
          )}
        </div>
      </header>

      {/* Camera */}
      <div
        className="relative flex-[2] min-h-0"
        style={{ borderBottom: "1px solid oklch(0.95 0 0 / 0.07)", background: "oklch(0.07 0.01 260)" }}
      >
        <CameraFeed seatId={seat.id} isOwn={isOwn} />
      </div>

      {/* Team bar */}
      <div
        className="h-12 shrink-0"
        style={{ borderBottom: "1px solid oklch(0.95 0 0 / 0.07)" }}
      >
        <EditableTeamBar seatId={seat.id} slots={seat.teamSlots} isOwn={isOwn} />
      </div>

      {/* Screen stream */}
      <div className="flex-[3] min-h-0" style={{ background: "oklch(0.06 0.01 260)" }}>
        <ScreenStream seatId={seat.id} isOwn={isOwn} />
      </div>
    </section>
  );
}
