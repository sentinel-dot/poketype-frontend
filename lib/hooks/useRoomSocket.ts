import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useRoomStore } from "../soullinkStore";
import type { SoulLinkSeat, SoulLinkTeamSlot, SoulLinkRoom, GraveyardEntry, UsedSpecies } from "../soullinkTypes";
import { getApiBase } from "../config";

// Server → Client event payloads
interface RoomStatePayload {
  room: SoulLinkRoom;
  seats: SoulLinkSeat[];
  graveyard?: GraveyardEntry[];
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
  linkedDeath?: boolean;
}
interface TeamSlotClearedPayload {
  seatId: string;
  slot: number;
}

export type ConnectionState = "connecting" | "online" | "reconnecting" | "offline";

export interface RoomSocketEvents {
  onLinkedDeath?: (slot: number) => void;
  onSeatJoined?: (displayName: string | null) => void;
  onSeatLeft?: (seatId: string) => void;
}

export function useRoomSocket(
  roomCode: string,
  participantToken: string | null,
  onError?: (message: string) => void,
  events?: RoomSocketEvents,
): { socket: Socket | null; connection: ConnectionState } {
  const socketRef = useRef<Socket | null>(null);
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  // Access store methods without subscribing this hook to state changes.
  const setSocket = useRoomStore((s) => s.setSocket);
  const eventsRef = useRef(events);
  eventsRef.current = events;

  useEffect(() => {
    if (!participantToken) return;

    const store = useRoomStore.getState();
    const socket = io(getApiBase(), {
      transports: ["websocket"],
    });
    socketRef.current = socket;
    setSocket(socket);

    // Emit room:join on every (re)connect — covers the initial connect AND
    // automatic Socket.io reconnects after network blips.
    socket.on("connect", () => {
      setConnection("online");
      socket.emit("room:join", { roomCode, participantToken });
    });
    socket.io.on("reconnect_attempt", () => setConnection("reconnecting"));
    socket.on("disconnect", () => setConnection("reconnecting"));
    socket.io.on("error", () => setConnection("offline"));

    socket.on("room:state", (payload: RoomStatePayload) => {
      useRoomStore.getState().setRoomState(payload);
    });

    socket.on("room:settings-updated", (payload: { room: SoulLinkRoom }) => {
      useRoomStore.getState().setRoom(payload.room);
    });

    socket.on("seat:joined", (payload: SeatPayload) => {
      useRoomStore.getState().updateSeat(payload.seatId, {
        ...(payload.position !== undefined && { position: payload.position }),
        displayName: payload.displayName ?? null,
        status: payload.status ?? "online",
        teamSlots: [],
      });
      eventsRef.current?.onSeatJoined?.(payload.displayName ?? null);
    });

    socket.on("seat:reconnected", (payload: SeatPayload) => {
      useRoomStore.getState().updateSeat(payload.seatId, {
        ...(payload.position !== undefined && { position: payload.position }),
        displayName: payload.displayName ?? null,
        status: "online",
      });
    });

    socket.on("seat:disconnected", (payload: SeatPayload) => {
      useRoomStore.getState().updateSeat(payload.seatId, { status: "disconnected" });
    });

    socket.on("seat:left", (payload: SeatPayload) => {
      useRoomStore.getState().updateSeat(payload.seatId, {
        status: "empty",
        displayName: null,
        teamSlots: [],
      });
      eventsRef.current?.onSeatLeft?.(payload.seatId);
    });

    socket.on("team-slot:updated", (payload: TeamSlotUpdatedPayload) => {
      useRoomStore.getState().updateSlot(payload.seatId, payload.slot, payload.slotData);
      if (payload.linkedDeath) eventsRef.current?.onLinkedDeath?.(payload.slot);
    });

    socket.on("team-slot:cleared", (payload: TeamSlotClearedPayload) => {
      useRoomStore.getState().clearSlot(payload.seatId, payload.slot);
    });

    socket.on("team:cleared-all", (payload: { seatId: string }) => {
      useRoomStore.getState().clearAllSlots(payload.seatId);
    });

    socket.on("death:updated", (payload: { seatId: string; deathCount: number }) => {
      useRoomStore.getState().setDeathCount(payload.seatId, payload.deathCount);
    });

    socket.on("encounter:added", (payload: { seatId: string; used: UsedSpecies }) => {
      useRoomStore.getState().addUsedSpecies(payload.seatId, payload.used);
    });

    socket.on("encounter:removed", (payload: { seatId: string; familyKey: number }) => {
      useRoomStore.getState().removeUsedSpecies(payload.seatId, payload.familyKey);
    });

    socket.on("slot:link-dead", (payload: { slot: number }) => {
      eventsRef.current?.onLinkedDeath?.(payload.slot);
    });

    socket.on("error", (payload: { message: string }) => {
      console.error("[socket] error:", payload.message);
      onError?.(payload.message);
    });

    // Keep the previously-shared behaviour of also having the getter grab store
    void store;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, participantToken]);

  return { socket: socketRef.current, connection };
}
