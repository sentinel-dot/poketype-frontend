import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type {
  RoomStore,
  SoulLinkRoom,
  SoulLinkSeat,
  SoulLinkTeamSlot,
  RouteEntry,
  Encounter,
  UsedSpecies,
  GraveyardEntry,
} from "./soullinkTypes";

export const useRoomStore = create<RoomStore>((set) => ({
  room: null,
  seats: [],
  routes: [],
  encounters: [],
  myToken: null,
  mySeatId: null,

  setMyCredentials(token, seatId) {
    set({ myToken: token, mySeatId: seatId });
  },

  setRoomState({ room, seats, routes, encounters }) {
    set({ room, seats, routes: routes ?? [], encounters: encounters ?? [] });
  },

  setRoom(room: SoulLinkRoom) {
    set({ room });
  },

  updateSeat(seatId, patch) {
    set((state) => ({
      seats: state.seats.map((s) =>
        s.id === seatId ? { ...s, ...patch } : s
      ),
    }));
  },

  updateSlot(seatId, slot, slotData) {
    set((state) => ({
      seats: state.seats.map((s) => {
        if (s.id !== seatId) return s;
        const existing = s.teamSlots.find((ts) => ts.slot === slot);
        const updated: SoulLinkTeamSlot = existing
          ? { ...existing, ...slotData }
          : {
              slot,
              status: "alive",
              pokemonId: null,
              pokemonName: null,
              nickname: null,
              level: null,
              ...slotData,
            };
        const others = s.teamSlots.filter((ts) => ts.slot !== slot);
        return { ...s, teamSlots: [...others, updated] };
      }),
    }));
  },

  clearSlot(seatId, slot) {
    set((state) => ({
      seats: state.seats.map((s) => {
        if (s.id !== seatId) return s;
        return {
          ...s,
          teamSlots: s.teamSlots.filter((ts) => ts.slot !== slot),
        };
      }),
    }));
  },

  clearAllSlots(seatId) {
    set((state) => ({
      seats: state.seats.map((s) =>
        s.id === seatId ? { ...s, teamSlots: [] } : s
      ),
    }));
  },

  setDeathCount(seatId, deathCount) {
    set((state) => ({
      seats: state.seats.map((s) =>
        s.id === seatId ? { ...s, deathCount } : s
      ),
    }));
  },

  // ── Central encounter matrix ──────────────────────────────────────────────

  setRoutes(routes: RouteEntry[]) {
    set({ routes: [...routes].sort((a, b) => a.position - b.position) });
  },

  removeRoute(routeId) {
    set((state) => ({
      routes: state.routes.filter((r) => r.id !== routeId),
      encounters: state.encounters.filter((e) => e.routeId !== routeId),
    }));
  },

  upsertEncounter(encounter: Encounter) {
    set((state) => {
      const others = state.encounters.filter(
        (e) => !(e.seatId === encounter.seatId && e.routeId === encounter.routeId)
      );
      return { encounters: [...others, encounter] };
    });
  },

  removeEncounterCell(seatId, routeId) {
    set((state) => ({
      encounters: state.encounters.filter(
        (e) => !(e.seatId === seatId && e.routeId === routeId)
      ),
    }));
  },

  clearSeatEncounters(seatId) {
    set((state) => ({
      encounters: state.encounters.filter((e) => e.seatId !== seatId),
    }));
  },

  reset() {
    set({ room: null, seats: [], routes: [], encounters: [], myToken: null, mySeatId: null });
  },

  socket: null,
  setSocket(socket) {
    set({ socket });
  },
}));

// ── Fine-grained selectors — components subscribe only to what they need ────

/** A single seat by id — only re-renders when that seat changes. */
export function useSeat(seatId: string): SoulLinkSeat | undefined {
  return useRoomStore((s) => s.seats.find((seat) => seat.id === seatId));
}

/** Ordered routes of the room. */
export function useRoutes(): RouteEntry[] {
  return useRoomStore((s) => s.routes);
}

/** All encounters of the room (matrix cells). */
export function useEncounters(): Encounter[] {
  return useRoomStore((s) => s.encounters);
}

/** The used-species registry of a seat, derived from its encounters. */
export function useUsedSpecies(seatId: string | null): UsedSpecies[] {
  return useRoomStore(
    useShallow((s) =>
      seatId
        ? s.encounters
            .filter((e) => e.seatId === seatId)
            .map((e) => ({
              familyKey: e.familyKey,
              pokemonId: e.pokemonId,
              pokemonName: e.pokemonName,
              outcome: e.outcome,
              routeLabel: s.routes.find((r) => r.id === e.routeId)?.label ?? null,
            }))
        : []
    )
  );
}

/** Graveyard derived from dead encounters, enriched with player + route. */
export function useGraveyard(): GraveyardEntry[] {
  return useRoomStore(
    useShallow((s) =>
      s.encounters
        .filter((e) => e.outcome === "dead")
        .map((e) => {
          const seat = s.seats.find((x) => x.id === e.seatId);
          return {
            seatId: e.seatId,
            position: seat?.position ?? null,
            displayName: seat?.displayName ?? null,
            pokemonId: e.pokemonId,
            pokemonName: e.pokemonName,
            routeLabel: s.routes.find((r) => r.id === e.routeId)?.label ?? null,
            diedAt: null,
          };
        })
    )
  );
}
