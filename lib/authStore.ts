"use client";

import { create } from "zustand";
import {
  type AuthUser,
  type NotificationItem,
  getStoredToken,
  storeToken,
  clearStoredToken,
  fetchMe,
  listNotifications,
} from "./authApi";

interface AuthState {
  user: AuthUser | null;
  hydrated: boolean;
  notifications: NotificationItem[];
  unread: number;

  setSession: (user: AuthUser, token: string) => void;
  logout: () => void;
  hydrate: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  pushNotification: (n: NotificationItem) => void;
  markAllRead: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  hydrated: false,
  notifications: [],
  unread: 0,

  setSession(user, token) {
    storeToken(token);
    set({ user });
    void get().refreshNotifications();
  },

  logout() {
    clearStoredToken();
    set({ user: null, notifications: [], unread: 0 });
  },

  async hydrate() {
    const token = getStoredToken();
    if (!token) {
      set({ hydrated: true });
      return;
    }
    try {
      const { user } = await fetchMe();
      set({ user, hydrated: true });
      void get().refreshNotifications();
    } catch {
      // Invalid/expired token — clear it silently.
      clearStoredToken();
      set({ user: null, hydrated: true });
    }
  },

  async refreshNotifications() {
    if (!getStoredToken()) return;
    try {
      const { notifications, unread } = await listNotifications();
      set({ notifications, unread });
    } catch {
      /* ignore */
    }
  },

  pushNotification(n) {
    set((s) => ({
      notifications: [n, ...s.notifications].slice(0, 50),
      unread: s.unread + 1,
    }));
  },

  markAllRead() {
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unread: 0,
    }));
  },
}));
