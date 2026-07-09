import type { Socket } from "socket.io-client";

// ---------------------------------------------------------------------------
// SoulLink Types
// ---------------------------------------------------------------------------

export type PokemonPool = "gen1" | "gen1-2" | "gen1-3" | "gen1-4" | "gen1-5" | "gen1-6" | "gen1-7" | "gen1-8" | "gen1-9" | "all";

export const POOL_TO_MAX_DEX: Record<PokemonPool, number | null> = {
  "gen1":   151,
  "gen1-2": 251,
  "gen1-3": 386,
  "gen1-4": 493,
  "gen1-5": 649,
  "gen1-6": 721,
  "gen1-7": 809,
  "gen1-8": 905,
  "gen1-9": 1025,
  "all":    null,
};

export const POOL_LABELS: Record<PokemonPool, string> = {
  "gen1":   "Gen 1 (bis #151)",
  "gen1-2": "Gen 1–2 (bis #251)",
  "gen1-3": "Gen 1–3 (bis #386)",
  "gen1-4": "Gen 1–4 (bis #493)",
  "gen1-5": "Gen 1–5 (bis #649)",
  "gen1-6": "Gen 1–6 (bis #721)",
  "gen1-7": "Gen 1–7 (bis #809)",
  "gen1-8": "Gen 1–8 (bis #905)",
  "gen1-9": "Gen 1–9 (bis #1025)",
  "all":    "Alle",
};

export type SeatStatus = "empty" | "joining" | "online" | "disconnected";
export type SlotStatus = "empty" | "alive" | "dead";
export type EncounterOutcome = "caught" | "dead" | "fled";

export interface SoulLinkTeamSlot {
  slot: number;           // 1–6
  status: SlotStatus;
  pokemonId: number | null;
  pokemonName: string | null;
  nickname: string | null;
  level: number | null;
  isShiny?: boolean;
  encounterLabel?: string | null;
  route?: string | null;
}

export interface UsedSpecies {
  familyKey: number;
  pokemonId: number;
  pokemonName: string | null;
  outcome: EncounterOutcome;
  routeLabel: string | null;
}

export interface SoulLinkSeat {
  id: string;
  position: number;       // 1–3
  displayName: string | null;
  status: SeatStatus;
  joinedAt: string | null;
  userId?: string | null;
  deathCount?: number;
  teamSlots: SoulLinkTeamSlot[];
  usedSpecies?: UsedSpecies[];
}

export interface Ruleset {
  typeClause: boolean;
  autoDeadSync: boolean;
  dupesWarn: boolean;
}

export const DEFAULT_RULESET: Ruleset = {
  typeClause: true,
  autoDeadSync: true,
  dupesWarn: true,
};

export interface GraveyardEntry {
  seatId: string | null;
  position: number | null;
  displayName: string | null;
  pokemonId: number;
  pokemonName: string | null;
  routeLabel: string | null;
  diedAt: string | null;
}

export interface SoulLinkRoom {
  id: string;
  roomCode: string;
  name: string;
  maxPlayers: number;
  pokemonPool: PokemonPool;
  gameName: string | null;
  ownerUserId?: string | null;
  badges?: number;
  levelCap?: number | null;
  ruleset?: Ruleset;
  status?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// API response shapes
// ---------------------------------------------------------------------------

export interface CreateRoomResponse {
  roomCode: string;
  seatId: string;
  participantToken: string;
}

export interface JoinRoomResponse {
  seatId: string;
  participantToken: string;
}

export interface RoomStateResponse {
  room: SoulLinkRoom;
  seats: SoulLinkSeat[];
  graveyard?: GraveyardEntry[];
}

// ---------------------------------------------------------------------------
// Zustand store shape (exported so store + hooks share it)
// ---------------------------------------------------------------------------

export interface RoomStore {
  room: SoulLinkRoom | null;
  seats: SoulLinkSeat[];
  graveyard: GraveyardEntry[];
  myToken: string | null;
  mySeatId: string | null;

  setMyCredentials: (token: string, seatId: string) => void;
  setRoomState: (state: { room: SoulLinkRoom; seats: SoulLinkSeat[]; graveyard?: GraveyardEntry[] }) => void;
  setRoom: (room: SoulLinkRoom) => void;
  updateSeat: (seatId: string, patch: Partial<SoulLinkSeat>) => void;
  updateSlot: (seatId: string, slot: number, slotData: Partial<SoulLinkTeamSlot>) => void;
  clearSlot: (seatId: string, slot: number) => void;
  clearAllSlots: (seatId: string) => void;
  setDeathCount: (seatId: string, deathCount: number) => void;
  addUsedSpecies: (seatId: string, used: UsedSpecies) => void;
  removeUsedSpecies: (seatId: string, familyKey: number) => void;
  setGraveyard: (graveyard: GraveyardEntry[]) => void;
  reset: () => void;

  socket: Socket | null;
  setSocket: (socket: Socket | null) => void;
}
