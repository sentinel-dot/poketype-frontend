"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";
import {
  searchUsers,
  listFriends,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  type AuthUser,
  type FriendLists,
} from "@/lib/authApi";
import { toast } from "@/lib/toastStore";

function Avatar({ user }: { user: AuthUser }) {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
      style={{ background: "linear-gradient(135deg, var(--primary), oklch(0.44 0.22 15))" }}
    >
      {user.displayName.charAt(0).toUpperCase()}
    </span>
  );
}

export default function FriendsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  const [lists, setLists] = useState<FriendLists>({ friends: [], incoming: [], outgoing: [] });
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AuthUser[]>([]);
  const [searching, setSearching] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setLists(await listFriends());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (hydrated && !user) router.replace("/login?redirect=/friends");
  }, [hydrated, user, router]);

  useEffect(() => {
    if (user) void refresh();
  }, [user, refresh]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const { users } = await searchUsers(query.trim());
        setResults(users);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const knownIds = new Set([
    ...lists.friends.map((f) => f.id),
    ...lists.incoming.map((f) => f.id),
    ...lists.outgoing.map((f) => f.id),
  ]);

  async function handleAdd(id: string) {
    await sendFriendRequest(id);
    toast.success("Anfrage gesendet.");
    setQuery("");
    setResults([]);
    await refresh();
  }
  async function handleAccept(id: string) {
    await acceptFriendRequest(id);
    await refresh();
  }
  async function handleDecline(id: string) {
    await declineFriendRequest(id);
    await refresh();
  }
  async function handleRemove(id: string) {
    await removeFriend(id);
    await refresh();
  }

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

      <h1 className="mb-6 text-2xl font-black tracking-tight text-foreground">Freunde</h1>

      {/* Search */}
      <section className="glass-card mb-6 p-5">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Freunde suchen
        </label>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Benutzername oder Name…"
          className="input-field [&::-webkit-search-cancel-button]:hidden"
        />
        {query.trim().length >= 2 && (
          <div className="mt-3 flex flex-col gap-1.5">
            {searching && <p className="px-1 text-sm text-muted-foreground/60">Suche…</p>}
            {!searching && results.length === 0 && (
              <p className="px-1 text-sm text-muted-foreground/60">Keine Nutzer gefunden.</p>
            )}
            {results.map((u) => (
              <div key={u.id} className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2">
                <Avatar user={u} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{u.displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">@{u.username}</p>
                </div>
                {knownIds.has(u.id) ? (
                  <span className="badge-chip">bereits verknüpft</span>
                ) : (
                  <button onClick={() => handleAdd(u.id)} className="btn-primary px-3 py-1.5 text-xs">
                    Hinzufügen
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Incoming requests */}
      {lists.incoming.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Anfragen ({lists.incoming.length})
          </h2>
          <div className="flex flex-col gap-1.5">
            {lists.incoming.map((u) => (
              <div key={u.id} className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2">
                <Avatar user={u} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{u.displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">@{u.username}</p>
                </div>
                <button onClick={() => handleAccept(u.id)} className="btn-primary px-3 py-1.5 text-xs">Annehmen</button>
                <button onClick={() => handleDecline(u.id)} className="btn-ghost px-3 py-1.5 text-xs">Ablehnen</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Outgoing */}
      {lists.outgoing.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Gesendet ({lists.outgoing.length})
          </h2>
          <div className="flex flex-col gap-1.5">
            {lists.outgoing.map((u) => (
              <div key={u.id} className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2">
                <Avatar user={u} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{u.displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">@{u.username}</p>
                </div>
                <span className="badge-chip">ausstehend</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Friends */}
      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Meine Freunde ({lists.friends.length})
        </h2>
        {lists.friends.length === 0 ? (
          <p className="rounded-xl border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground/60">
            Noch keine Freunde. Suche oben nach Nutzern.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {lists.friends.map((u) => (
              <div key={u.id} className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2">
                <Avatar user={u} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{u.displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">@{u.username}</p>
                </div>
                <button onClick={() => handleRemove(u.id)} className="btn-destructive">Entfernen</button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
