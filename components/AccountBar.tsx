"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";
import {
  markAllNotificationsRead,
  acceptFriendRequest,
  declineFriendRequest,
  type NotificationItem,
} from "@/lib/authApi";

function notificationText(n: NotificationItem): string {
  const name = (n.payload?.displayName as string) || (n.payload?.username as string) || "Jemand";
  switch (n.type) {
    case "friend_request":
      return `${name} möchte dich als Freund hinzufügen.`;
    case "friend_accepted":
      return `${name} hat deine Freundschaftsanfrage angenommen.`;
    case "room_invite":
      return `${name} hat dich in einen SoulLink-Raum eingeladen.`;
    default:
      return "Neue Benachrichtigung.";
  }
}

export default function AccountBar() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const logout = useAuthStore((s) => s.logout);
  const notifications = useAuthStore((s) => s.notifications);
  const unread = useAuthStore((s) => s.unread);
  const markAllRead = useAuthStore((s) => s.markAllRead);
  const refreshNotifications = useAuthStore((s) => s.refreshNotifications);

  const [openBell, setOpenBell] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpenBell(false);
        setOpenMenu(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!hydrated) {
    return <div className="h-9 w-24" aria-hidden />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className="btn-ghost">Anmelden</Link>
        <Link href="/register" className="btn-primary px-3 py-2">Registrieren</Link>
      </div>
    );
  }

  async function handleBellOpen() {
    const next = !openBell;
    setOpenBell(next);
    setOpenMenu(false);
    if (next && unread > 0) {
      markAllRead();
      await markAllNotificationsRead();
    }
  }

  async function handleAccept(userId: string) {
    await acceptFriendRequest(userId);
    await refreshNotifications();
  }
  async function handleDecline(userId: string) {
    await declineFriendRequest(userId);
    await refreshNotifications();
  }

  return (
    <div ref={ref} className="flex items-center gap-2">
      {/* Notification bell */}
      <div className="relative">
        <button
          onClick={handleBellOpen}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card transition-colors hover:brightness-110"
          aria-label="Benachrichtigungen"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          {unread > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-black text-white"
              style={{ background: "var(--primary)" }}
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        {openBell && (
          <div
            className="glass-card absolute right-0 top-11 z-50 w-80 max-w-[90vw] p-2 animate-fade-in"
            style={{ borderRadius: "var(--radius-xl)" }}
          >
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Benachrichtigungen
              </span>
              <Link href="/friends" className="text-xs font-semibold text-primary hover:underline" onClick={() => setOpenBell(false)}>
                Freunde
              </Link>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground/60">
                  Keine Benachrichtigungen.
                </p>
              ) : (
                notifications.map((n) => {
                  const friendRequestUserId =
                    n.type === "friend_request" && typeof n.payload?.userId === "string"
                      ? n.payload.userId
                      : null;
                  const roomInviteCode =
                    n.type === "room_invite" && typeof n.payload?.roomCode === "string"
                      ? n.payload.roomCode
                      : null;

                  return (
                  <div key={n.id} className="rounded-lg px-3 py-2.5 transition-colors hover:bg-white/5">
                    <p className="text-sm text-foreground/85">{notificationText(n)}</p>
                    {friendRequestUserId && (
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => handleAccept(friendRequestUserId)}
                          className="btn-primary px-2.5 py-1 text-xs"
                        >
                          Annehmen
                        </button>
                        <button
                          onClick={() => handleDecline(friendRequestUserId)}
                          className="btn-ghost px-2.5 py-1 text-xs"
                        >
                          Ablehnen
                        </button>
                      </div>
                    )}
                    {roomInviteCode && (
                      <div className="mt-2">
                        <Link
                          href={`/soullink/${roomInviteCode}/join`}
                          onClick={() => setOpenBell(false)}
                          className="btn-primary inline-block px-2.5 py-1 text-xs"
                        >
                          Beitreten
                        </Link>
                      </div>
                    )}
                  </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => { setOpenMenu(!openMenu); setOpenBell(false); }}
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-1.5 transition-colors hover:brightness-110"
        >
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-black text-white"
            style={{ background: "linear-gradient(135deg, var(--primary), oklch(0.44 0.22 15))" }}
          >
            {user.displayName.charAt(0).toUpperCase()}
          </span>
          <span className="max-w-[100px] truncate text-sm font-semibold text-foreground">
            {user.displayName}
          </span>
        </button>

        {openMenu && (
          <div
            className="glass-card absolute right-0 top-11 z-50 w-48 p-1.5 animate-fade-in"
            style={{ borderRadius: "var(--radius-xl)" }}
          >
            <Link href="/friends" className="block rounded-lg px-3 py-2 text-sm text-foreground/85 transition-colors hover:bg-white/5" onClick={() => setOpenMenu(false)}>
              Freunde
            </Link>
            <Link href="/rooms" className="block rounded-lg px-3 py-2 text-sm text-foreground/85 transition-colors hover:bg-white/5" onClick={() => setOpenMenu(false)}>
              Meine Räume
            </Link>
            <button
              onClick={() => { logout(); setOpenMenu(false); router.push("/"); }}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm text-foreground/85 transition-colors hover:bg-white/5"
            >
              Abmelden
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
