import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useRoomStore } from "../soullinkStore";
import type { SoulLinkSeat, SoulLinkTeamSlot, SoulLinkRoom } from "../soullinkTypes";
import { getApiBase } from "../config";

// Server → Client event payloads
interface RoomStatePayload {
  room: SoulLinkRoom;
  seats: SoulLinkSeat[];
}
interface SeatPayload {
  seatId: string;
  position?: number;
  displayName?: string | null;
  status?: SoulLinkSeat["status"];
}
interface TeamSlotUpdatedPayload {
  seatId: string;
  slot: number;
  slotData: Partial<SoulLinkTeamSlot>;
}
interface TeamSlotClearedPayload {
  seatId: string;
  slot: number;
}

export function useRoomSocket(
  roomCode: string,
  participantToken: string | null,
  onError?: (message: string) => void
): Socket | null {
  const socketRef = useRef<Socket | null>(null);
  const store = useRoomStore();

  useEffect(() => {
    if (!participantToken) return;

    const socket = io(getApiBase(), {
      transports: ["websocket"],
    });
    socketRef.current = socket;
    store.setSocket(socket);

    // Emit room:join on every (re)connect — covers the initial connect AND
    // automatic Socket.io reconnects after network blips. Without this,
    // the server-side socket room subscription is lost after a reconnect
    // and the client stops receiving broadcast events.
    socket.on("connect", () => {
      socket.emit("room:join", { roomCode, participantToken });
    });

    socket.on("room:state", (payload: RoomStatePayload) => {
      store.setRoomState(payload);
    });

    socket.on("seat:joined", (payload: SeatPayload) => {
      store.updateSeat(payload.seatId, {
        ...(payload.position !== undefined && { position: payload.position }),
        displayName: payload.displayName ?? null,
        status: payload.status ?? "online",
        teamSlots: [],
      });
    });

    socket.on("seat:reconnected", (payload: SeatPayload) => {
      store.updateSeat(payload.seatId, {
        ...(payload.position !== undefined && { position: payload.position }),
        displayName: payload.displayName ?? null,
        status: "online",
      });
    });

    socket.on("seat:disconnected", (payload: SeatPayload) => {
      store.updateSeat(payload.seatId, { status: "disconnected" });
    });

    socket.on("seat:left", (payload: SeatPayload) => {
      store.updateSeat(payload.seatId, {
        status: "empty",
        displayName: null,
        teamSlots: [],
      });
    });

    socket.on("team-slot:updated", (payload: TeamSlotUpdatedPayload) => {
      store.updateSlot(payload.seatId, payload.slot, payload.slotData);
    });

    socket.on("team-slot:cleared", (payload: TeamSlotClearedPayload) => {
      store.clearSlot(payload.seatId, payload.slot);
    });

    socket.on("error", (payload: { message: string }) => {
      console.error("[socket] error:", payload.message);
      onError?.(payload.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      store.setSocket(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, participantToken]);

  return socketRef.current;
}
