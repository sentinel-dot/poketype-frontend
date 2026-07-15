import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useRoomStore } from "../soullinkStore";
import type { SoulLinkSeat, SoulLinkTeamSlot, SoulLinkRoom, RouteEntry, Encounter } from "../soullinkTypes";
import { getApiBase } from "../config";

// Server → Client event payloads
interface RoomStatePayload {
  room: SoulLinkRoom;
  seats: SoulLinkSeat[];
  routes?: RouteEntry[];
  encounters?: Encounter[];
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
  /** A route-linked death cascaded to the other players on that route. */
  onLinkedDeath?: () => void;
  onSeatJoined?: (displayName: string | null) => void;
  onSeatLeft?: (seatId: string) => void;
  /** This client's own seat was removed by the room admin. */
  onKicked?: () => void;
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
        deathCount: 0,
      });
      useRoomStore.getState().clearSeatEncounters(payload.seatId);
      eventsRef.current?.onSeatLeft?.(payload.seatId);
    });

    // Server targets this event only at the kicked player's own sockets.
    socket.on("seat:kicked", () => {
      eventsRef.current?.onKicked?.();
    });

    socket.on("team-slot:updated", (payload: TeamSlotUpdatedPayload) => {
      useRoomStore.getState().updateSlot(payload.seatId, payload.slot, payload.slotData);
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

    // ── Central encounter matrix ─────────────────────────────────────────────
    socket.on("routes:updated", (payload: { routes: RouteEntry[] }) => {
      useRoomStore.getState().setRoutes(payload.routes);
    });

    socket.on("route:deleted", (payload: { routeId: string }) => {
      useRoomStore.getState().removeRoute(payload.routeId);
    });

    socket.on("encounter:updated", (payload: { encounter: Encounter; linkedDeath?: boolean }) => {
      useRoomStore.getState().upsertEncounter(payload.encounter);
    });

    socket.on("encounter:removed", (payload: { seatId: string; routeId: string }) => {
      useRoomStore.getState().removeEncounterCell(payload.seatId, payload.routeId);
    });

    socket.on("route:link-dead", () => {
      eventsRef.current?.onLinkedDeath?.();
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
