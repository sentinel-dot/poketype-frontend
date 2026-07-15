"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useRoomStore, useRoutes, useEncounters } from "@/lib/soullinkStore";
import type { Encounter, EncounterOutcome, SoulLinkSeat } from "@/lib/soullinkTypes";
import { getPixelSpriteUrl } from "@/lib/apiclient";
import EncounterCellEditor from "./EncounterCellEditor";

interface EncounterMatrixProps {
  mySeatId: string | null;
  canEditAll?: boolean;
  onClose: () => void;
}

const OUTCOME_META: Record<EncounterOutcome, { label: string; color: string; bg: string; icon: string }> = {
  caught: { label: "Gefangen", color: "oklch(0.80 0.16 150)", bg: "oklch(0.55 0.18 150 / 0.14)", icon: "✓" },
  dead: { label: "Tot", color: "oklch(0.78 0.18 15)", bg: "oklch(0.55 0.22 15 / 0.16)", icon: "☠" },
  fled: { label: "Geflohen", color: "oklch(0.72 0 0)", bg: "oklch(0.95 0 0 / 0.06)", icon: "🏃" },
};

export default function EncounterMatrix({ mySeatId, canEditAll, onClose }: EncounterMatrixProps) {
  const params = useParams<{ roomCode: string }>();
  const roomCode = params.roomCode;
  const socket = useRoomStore((s) => s.socket);
  const seats = useRoomStore((s) => s.seats);
  const routes = useRoutes();
  const encounters = useEncounters();

  const [newRoute, setNewRoute] = useState("");
  const [editing, setEditing] = useState<{ seatId: string; routeId: string } | null>(null);
  const [renamingRoute, setRenamingRoute] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const players: SoulLinkSeat[] = useMemo(
    () => seats.filter((s) => s.status !== "empty").sort((a, b) => a.position - b.position),
    [seats]
  );

  // Fast lookup: `${seatId}:${routeId}` → encounter.
  const cellMap = useMemo(() => {
    const m = new Map<string, Encounter>();
    for (const e of encounters) m.set(`${e.seatId}:${e.routeId}`, e);
    return m;
  }, [encounters]);

  function canEditSeat(seatId: string): boolean {
    return seatId === mySeatId || !!canEditAll;
  }

  function handleAddRoute() {
    const label = newRoute.trim();
    if (!label || !socket) return;
    socket.emit("route:add", { roomCode, label });
    setNewRoute("");
  }

  function handleDeleteRoute(routeId: string) {
    if (!socket) return;
    socket.emit("route:delete", { roomCode, routeId });
  }

  function commitRename(routeId: string) {
    const label = renameValue.trim();
    if (label && socket) socket.emit("route:rename", { roomCode, routeId, label });
    setRenamingRoute(null);
    setRenameValue("");
  }

  function moveRoute(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (!socket || next < 0 || next >= routes.length) return;
    const ordered = routes.map((r) => r.id);
    [ordered[index], ordered[next]] = [ordered[next], ordered[index]];
    socket.emit("route:reorder", { roomCode, orderedIds: ordered });
  }

  const editingCell = editing
    ? {
        seatId: editing.seatId,
        routeId: editing.routeId,
        routeLabel: routes.find((r) => r.id === editing.routeId)?.label ?? "",
        playerName: players.find((p) => p.id === editing.seatId)?.displayName ?? null,
        encounter: cellMap.get(`${editing.seatId}:${editing.routeId}`) ?? null,
      }
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
      style={{ background: "oklch(0 0 0 / 0.72)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass-card flex max-h-[86vh] w-full max-w-4xl flex-col p-5 animate-fade-in-up">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-black text-foreground">
              <span aria-hidden>🗺️</span> Begegnungen
            </h2>
            <p className="text-xs text-muted-foreground">
              Wer hat auf welcher Route was getroffen — die zentrale Nuzlocke-/Randomizer-Steuerung.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
            style={{ background: "oklch(0.95 0 0 / 0.08)", border: "1px solid oklch(0.95 0 0 / 0.12)", color: "oklch(0.5 0 0)" }}
            aria-label="Schließen"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Add-route */}
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={newRoute}
            onChange={(e) => setNewRoute(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddRoute()}
            maxLength={100}
            placeholder="Neue Route / Ort — z. B. Route 1"
            className="input-field flex-1"
          />
          <button onClick={handleAddRoute} disabled={!newRoute.trim()} className="btn-primary px-4 disabled:opacity-40">
            + Route
          </button>
        </div>

        {/* Matrix */}
        {routes.length === 0 ? (
          <p className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground/60">
            Noch keine Routen. Füge oben die erste Route hinzu, um Begegnungen zu erfassen.
          </p>
        ) : players.length === 0 ? (
          <p className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground/60">
            Noch keine Spieler im Raum.
          </p>
        ) : (
          <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-border">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10">
                <tr style={{ background: "oklch(0.12 0.02 260)" }}>
                  <th className="sticky left-0 z-10 min-w-[140px] px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground" style={{ background: "oklch(0.12 0.02 260)" }}>
                    Route
                  </th>
                  {players.map((p) => (
                    <th key={p.id} className="min-w-[130px] px-3 py-2.5 text-left text-xs font-bold text-foreground">
                      {p.displayName ?? "—"}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {routes.map((route, idx) => (
                  <tr key={route.id} className="border-t border-border/60">
                    {/* Route label + admin controls */}
                    <th
                      scope="row"
                      className="sticky left-0 z-[5] px-3 py-2 text-left align-middle"
                      style={{ background: "oklch(0.10 0.02 260)" }}
                    >
                      {renamingRoute === route.id ? (
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={() => commitRename(route.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitRename(route.id);
                            if (e.key === "Escape") setRenamingRoute(null);
                          }}
                          maxLength={100}
                          className="input-field w-full px-2 py-1 text-xs"
                        />
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="flex-1 truncate text-xs font-bold text-foreground/90">{route.label}</span>
                          {canEditAll && (
                            <span className="flex shrink-0 items-center">
                              <button
                                onClick={() => moveRoute(idx, -1)}
                                disabled={idx === 0}
                                className="flex h-5 w-4 items-center justify-center text-muted-foreground/60 hover:text-foreground disabled:opacity-25"
                                aria-label="Nach oben"
                                title="Nach oben"
                              >▲</button>
                              <button
                                onClick={() => moveRoute(idx, 1)}
                                disabled={idx === routes.length - 1}
                                className="flex h-5 w-4 items-center justify-center text-muted-foreground/60 hover:text-foreground disabled:opacity-25"
                                aria-label="Nach unten"
                                title="Nach unten"
                              >▼</button>
                              <button
                                onClick={() => { setRenamingRoute(route.id); setRenameValue(route.label); }}
                                className="ml-0.5 flex h-5 w-5 items-center justify-center rounded text-muted-foreground/60 hover:text-foreground"
                                aria-label="Route umbenennen"
                                title="Umbenennen"
                              >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteRoute(route.id)}
                                className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground/60 hover:text-[oklch(0.75_0.18_15)]"
                                aria-label="Route löschen"
                                title="Route löschen"
                              >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                </svg>
                              </button>
                            </span>
                          )}
                        </div>
                      )}
                    </th>

                    {/* One cell per player */}
                    {players.map((p) => {
                      const enc = cellMap.get(`${p.id}:${route.id}`);
                      const editable = canEditSeat(p.id);
                      const meta = enc ? OUTCOME_META[enc.outcome] : null;
                      return (
                        <td key={p.id} className="px-2 py-1.5 align-middle">
                          <button
                            onClick={() => editable && setEditing({ seatId: p.id, routeId: route.id })}
                            disabled={!editable && !enc}
                            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors"
                            style={{
                              background: enc ? meta!.bg : editable ? "oklch(0.95 0 0 / 0.03)" : "transparent",
                              border: `1px solid ${enc ? "transparent" : "oklch(0.95 0 0 / 0.06)"}`,
                              cursor: editable ? "pointer" : enc ? "default" : "default",
                            }}
                            title={editable ? "Begegnung bearbeiten" : undefined}
                          >
                            {enc ? (
                              <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={getPixelSpriteUrl(enc.pokemonId)}
                                  alt=""
                                  width={28}
                                  height={28}
                                  loading="lazy"
                                  decoding="async"
                                  className={enc.outcome === "dead" ? "grayscale opacity-50" : ""}
                                  style={{ imageRendering: "pixelated" }}
                                />
                                <span className="min-w-0 flex-1">
                                  <span className="flex items-center gap-1 truncate text-xs font-semibold text-foreground/85">
                                    {enc.isShiny && <span aria-label="Schillernd">✨</span>}
                                    {enc.nickname || enc.pokemonName || `#${enc.pokemonId}`}
                                  </span>
                                  <span className="text-[10px] font-bold" style={{ color: meta!.color }}>
                                    {meta!.icon} {meta!.label}
                                    {enc.level ? ` · Lv${enc.level}` : ""}
                                  </span>
                                </span>
                              </>
                            ) : (
                              <span className="text-lg" style={{ color: "oklch(0.95 0 0 / 0.18)" }}>
                                {editable ? "+" : "·"}
                              </span>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingCell && (
        <EncounterCellEditor
          seatId={editingCell.seatId}
          routeId={editingCell.routeId}
          routeLabel={editingCell.routeLabel}
          playerName={editingCell.playerName}
          encounter={editingCell.encounter}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
