import { create } from "zustand";
import type {
  RoomStore,
  SoulLinkRoom,
  SoulLinkSeat,
  SoulLinkTeamSlot,
} from "./soullinkTypes";

export const useRoomStore = create<RoomStore>((set) => ({
  room: null,
  seats: [],
  myToken: null,
  mySeatId: null,

  setMyCredentials(token, seatId) {
    set({ myToken: token, mySeatId: seatId });
  },

  setRoomState({ room, seats }: { room: SoulLinkRoom; seats: SoulLinkSeat[] }) {
    set({ room, seats });
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

  reset() {
    set({ room: null, seats: [], myToken: null, mySeatId: null });
  },

  socket: null,
  setSocket(socket) {
    set({ socket });
  },
}));
