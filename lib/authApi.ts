import { getApiBase } from "./config";
import { ApiError, isNetworkError, NETWORK_ERROR_MESSAGE } from "./apiclient";

const TOKEN_KEY = "poketype_auth_token";

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/** Authorization header for the current session (empty when logged out). */
export function authHeaders(): Record<string, string> {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Serverfehler (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* body not JSON */
    }
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${getApiBase()}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
        ...(init?.headers ?? {}),
      },
    });
    return handle<T>(res);
  } catch (err) {
    if (isNetworkError(err)) throw new ApiError(0, NETWORK_ERROR_MESSAGE);
    throw err;
  }
}

// ── Auth ────────────────────────────────────────────────────────────────────

export function register(username: string, password: string, displayName?: string): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, password, displayName }),
  });
}

export function login(username: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function fetchMe(): Promise<{ user: AuthUser }> {
  return request<{ user: AuthUser }>("/auth/me");
}

export interface MyRoom {
  roomCode: string;
  name: string;
  status: string;
  createdAt: string;
  isOwner: boolean;
}

export function fetchMyRooms(): Promise<{ rooms: MyRoom[] }> {
  return request<{ rooms: MyRoom[] }>("/auth/me/rooms");
}

// ── Friends ───────────────────────────────────────────────────────────────

export function searchUsers(q: string): Promise<{ users: AuthUser[] }> {
  return request<{ users: AuthUser[] }>(`/friends/search?q=${encodeURIComponent(q)}`);
}

export interface FriendLists {
  friends: AuthUser[];
  incoming: AuthUser[];
  outgoing: AuthUser[];
}

export function listFriends(): Promise<FriendLists> {
  return request<FriendLists>("/friends");
}

export function sendFriendRequest(userId: string): Promise<{ ok: boolean }> {
  return request("/friends/request", { method: "POST", body: JSON.stringify({ userId }) });
}

export function acceptFriendRequest(userId: string): Promise<{ ok: boolean }> {
  return request("/friends/accept", { method: "POST", body: JSON.stringify({ userId }) });
}

export function declineFriendRequest(userId: string): Promise<{ ok: boolean }> {
  return request("/friends/decline", { method: "POST", body: JSON.stringify({ userId }) });
}

export function removeFriend(userId: string): Promise<{ ok: boolean }> {
  return request(`/friends/${userId}`, { method: "DELETE" });
}

// ── Notifications ───────────────────────────────────────────────────────────

export interface NotificationItem {
  id: string;
  type: string;
  payload: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
}

export function listNotifications(): Promise<{ notifications: NotificationItem[]; unread: number }> {
  return request("/notifications");
}

export function markNotificationRead(id: string): Promise<{ ok: boolean }> {
  return request(`/notifications/${id}/read`, { method: "POST" });
}

export function markAllNotificationsRead(): Promise<{ ok: boolean }> {
  return request("/notifications/read-all", { method: "POST" });
}
