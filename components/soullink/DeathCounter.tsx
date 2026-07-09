"use client";

import { useParams } from "next/navigation";
import { useRoomStore, useSeat } from "@/lib/soullinkStore";

interface DeathCounterProps {
  seatId: string;
  isOwn: boolean;
}

/** Per-seat death counter overlaid on the top-left of the camera area. */
export default function DeathCounter({ seatId, isOwn }: DeathCounterProps) {
  const params = useParams<{ roomCode: string }>();
  const roomCode = params.roomCode;
  const seat = useSeat(seatId);
  const socket = useRoomStore((s) => s.socket);
  const setDeathCount = useRoomStore((s) => s.setDeathCount);

  const count = seat?.deathCount ?? 0;

  function adjust(delta: 1 | -1) {
    if (!isOwn || !socket) return;
    const next = Math.max(0, count + delta);
    if (next === count) return;
    setDeathCount(seatId, next); // optimistic
    socket.emit("death:adjust", { roomCode, seatId, delta });
  }

  return (
    <div
      className="pointer-events-auto absolute left-2 top-2 z-20 flex select-none items-center gap-1 rounded-xl px-1.5 py-1"
      style={{
        background: "oklch(0.10 0.02 260 / 0.78)",
        border: "1px solid oklch(0.55 0.22 15 / 0.35)",
        backdropFilter: "blur(6px)",
      }}
      title="Todeszähler"
    >
      <span className="text-sm leading-none" aria-hidden>💀</span>
      {isOwn && (
        <button
          onClick={() => adjust(-1)}
          disabled={count === 0}
          className="flex h-5 w-5 items-center justify-center rounded-md text-sm font-black text-foreground/70 transition-colors hover:bg-white/10 disabled:opacity-30"
          aria-label="Todeszähler verringern"
        >
          −
        </button>
      )}
      <span
        className="min-w-5 text-center text-sm font-black tabular-nums"
        style={{ color: "oklch(0.80 0.18 15)" }}
      >
        {count}
      </span>
      {isOwn && (
        <button
          onClick={() => adjust(1)}
          className="flex h-5 w-5 items-center justify-center rounded-md text-sm font-black text-foreground/70 transition-colors hover:bg-white/10"
          aria-label="Todeszähler erhöhen"
        >
          +
        </button>
      )}
    </div>
  );
}
