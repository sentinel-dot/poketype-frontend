import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type {
  RoomStore,
  SoulLinkRoom,
  SoulLinkSeat,
  SoulLinkTeamSlot,
  GraveyardEntry,
  UsedSpecies,
} from "./soullinkTypes";

export const useRoomStore = create<RoomStore>((set) => ({
  room: null,
  seats: [],
  graveyard: [],
  myToken: null,
  mySeatId: null,

  setMyCredentials(token, seatId) {
    set({ myToken: token, mySeatId: seatId });
  },

  setRoomState({ room, seats, graveyard }: { room: SoulLinkRoom; seats: SoulLinkSeat[]; graveyard?: GraveyardEntry[] }) {
    set({ room, seats, graveyard: graveyard ?? [] });
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

  addUsedSpecies(seatId, used: UsedSpecies) {
    set((state) => ({
      seats: state.seats.map((s) => {
        if (s.id !== seatId) return s;
        const existing = s.usedSpecies ?? [];
        const others = existing.filter((u) => u.familyKey !== used.familyKey);
        return { ...s, usedSpecies: [...others, used] };
      }),
    }));
  },

  removeUsedSpecies(seatId, familyKey) {
    set((state) => ({
      seats: state.seats.map((s) => {
        if (s.id !== seatId) return s;
        return {
          ...s,
          usedSpecies: (s.usedSpecies ?? []).filter((u) => u.familyKey !== familyKey),
        };
      }),
    }));
  },

  setGraveyard(graveyard) {
    set({ graveyard });
  },

  reset() {
    set({ room: null, seats: [], graveyard: [], myToken: null, mySeatId: null });
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

/** The used-species registry of a seat (for dupes checks). */
export function useUsedSpecies(seatId: string | null): UsedSpecies[] {
  return useRoomStore(
    useShallow((s) => (seatId ? s.seats.find((seat) => seat.id === seatId)?.usedSpecies ?? [] : []))
  );
}
