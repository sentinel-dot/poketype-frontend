"use client";

import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { getApiBase } from "../config";
import { getStoredToken, type NotificationItem } from "../authApi";
import { useAuthStore } from "../authStore";

/**
 * Maintains a lightweight user-level socket that receives live notifications
 * (friend requests, room invites) while logged in. Independent of any room.
 */
export function useUserSocket(): void {
  const user = useAuthStore((s) => s.user);
  const pushNotification = useAuthStore((s) => s.pushNotification);

  useEffect(() => {
    const token = getStoredToken();
    if (!user || !token) return;

    const socket: Socket = io(getApiBase(), { transports: ["websocket"] });

    socket.on("connect", () => {
      socket.emit("user:join", { token });
    });

    socket.on("notification:new", (n: NotificationItem) => {
      pushNotification(n);
    });

    return () => {
      socket.disconnect();
    };
  }, [user, pushNotification]);
}
