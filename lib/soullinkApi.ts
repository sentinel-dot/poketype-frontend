import type {
  CreateRoomResponse,
  JoinRoomResponse,
  RoomStateResponse,
  PokemonPool,
} from "./soullinkTypes";
import { ApiError, isNetworkError, NETWORK_ERROR_MESSAGE } from "./apiclient";
import { getApiBase } from "./config";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Serverfehler (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // body not JSON
    }
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Room lifecycle
// ---------------------------------------------------------------------------

export interface CreateRoomPayload {
  name: string;
  pokemonPool: PokemonPool;
  gameName?: string;
  displayName: string;
}

export async function createRoom(payload: CreateRoomPayload): Promise<CreateRoomResponse> {
  try {
    const res = await fetch(`${getApiBase()}/soullink/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<CreateRoomResponse>(res);
  } catch (err) {
    if (isNetworkError(err)) throw new ApiError(0, NETWORK_ERROR_MESSAGE);
    throw err;
  }
}

export async function getRoom(roomCode: string): Promise<RoomStateResponse> {
  try {
    const res = await fetch(`${getApiBase()}/soullink/rooms/${roomCode}`);
    return handleResponse<RoomStateResponse>(res);
  } catch (err) {
    if (isNetworkError(err)) throw new ApiError(0, NETWORK_ERROR_MESSAGE);
    throw err;
  }
}

export async function joinRoom(
  roomCode: string,
  displayName: string
): Promise<JoinRoomResponse> {
  try {
    const res = await fetch(`${getApiBase()}/soullink/rooms/${roomCode}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName }),
    });
    return handleResponse<JoinRoomResponse>(res);
  } catch (err) {
    if (isNetworkError(err)) throw new ApiError(0, NETWORK_ERROR_MESSAGE);
    throw err;
  }
}

export async function leaveRoom(
  roomCode: string,
  participantToken: string
): Promise<void> {
  try {
    const res = await fetch(`${getApiBase()}/soullink/rooms/${roomCode}/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantToken }),
    });
    if (!res.ok) {
      // best-effort — ignore errors on leave
      console.warn("leaveRoom: server returned", res.status);
    }
  } catch {
    // best-effort
  }
}

// ---------------------------------------------------------------------------
// localStorage helpers (client-only — call only inside useEffect or handlers)
// ---------------------------------------------------------------------------

export function saveCredentials(
  roomCode: string,
  token: string,
  seatId: string
): void {
  localStorage.setItem(`soullink_token_${roomCode}`, token);
  localStorage.setItem(`soullink_seat_${roomCode}`, seatId);
}

export function loadCredentials(
  roomCode: string
): { token: string; seatId: string } | null {
  const token = localStorage.getItem(`soullink_token_${roomCode}`);
  const seatId = localStorage.getItem(`soullink_seat_${roomCode}`);
  if (token && seatId) return { token, seatId };
  return null;
}

export function clearCredentials(roomCode: string): void {
  localStorage.removeItem(`soullink_token_${roomCode}`);
  localStorage.removeItem(`soullink_seat_${roomCode}`);
}

// ---------------------------------------------------------------------------
// LiveKit
// ---------------------------------------------------------------------------

export interface LiveKitTokenResponse {
  url: string;
  token: string;
}

export async function getLiveKitToken(
  roomCode: string,
  seatId: string,
  participantToken: string
): Promise<LiveKitTokenResponse> {
  const res = await fetch(
    `${getApiBase()}/soullink/rooms/${roomCode}/livekit-token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seatId, participantToken }),
    }
  );
  if (res.status === 503) {
    throw new Error("livekit_not_configured");
  }
  return handleResponse<LiveKitTokenResponse>(res);
}
