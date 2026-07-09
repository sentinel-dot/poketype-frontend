"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";
import { fetchMyRooms, type MyRoom } from "@/lib/authApi";

export default function MyRoomsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const [rooms, setRooms] = useState<MyRoom[] | null>(null);

  useEffect(() => {
    if (hydrated && !user) router.replace("/login?redirect=/rooms");
  }, [hydrated, user, router]);

  useEffect(() => {
    if (user) fetchMyRooms().then((r) => setRooms(r.rooms)).catch(() => setRooms([]));
  }, [user]);

  if (!hydrated || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="pokeball" aria-label="Lädt…" />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Startseite
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight text-foreground">Meine Räume</h1>
        <Link href="/soullink/create" className="btn-primary px-3 py-2 text-sm">
          + Neuer Raum
        </Link>
      </div>

      {rooms === null ? (
        <div className="flex justify-center py-12"><div className="pokeball" /></div>
      ) : rooms.length === 0 ? (
        <p className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground/60">
          Noch keine Räume. Erstelle deinen ersten SoulLink-Raum!
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {rooms.map((r) => (
            <Link
              key={r.roomCode}
              href={`/soullink/${r.roomCode}`}
              className="glass-card flex items-center gap-3 p-4 transition-all hover:brightness-110"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "linear-gradient(135deg, var(--primary), oklch(0.44 0.22 15))" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">{r.name}</p>
                <p className="font-mono text-xs text-muted-foreground">{r.roomCode}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {r.isOwner && <span className="badge-chip">Host</span>}
                {r.status === "archived" && (
                  <span className="badge-chip" style={{ color: "oklch(0.6 0 0)" }}>archiviert</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
