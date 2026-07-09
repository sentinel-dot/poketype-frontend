"use client";

import { useState } from "react";
import type { SoulLinkRoom } from "@/lib/soullinkTypes";
import { DEFAULT_RULESET } from "@/lib/soullinkTypes";
import { updateRoomSettings } from "@/lib/soullinkApi";
import { toast } from "@/lib/toastStore";

interface RoomSettingsModalProps {
  room: SoulLinkRoom;
  onClose: () => void;
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-all"
      style={{
        background: checked ? "oklch(0.55 0.18 150 / 0.10)" : "oklch(0.95 0 0 / 0.04)",
        border: `1.5px solid ${checked ? "oklch(0.55 0.18 150 / 0.35)" : "oklch(0.95 0 0 / 0.08)"}`,
      }}
    >
      <span className="min-w-0">
        <span className="block text-sm font-bold text-foreground">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
      <span
        className="relative h-5 w-9 shrink-0 rounded-full transition-colors"
        style={{ background: checked ? "oklch(0.6 0.18 150)" : "oklch(0.3 0 0)" }}
      >
        <span
          className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
          style={{ left: checked ? "1.125rem" : "0.125rem" }}
        />
      </span>
    </button>
  );
}

export default function RoomSettingsModal({ room, onClose }: RoomSettingsModalProps) {
  const ruleset = room.ruleset ?? DEFAULT_RULESET;
  const [name, setName] = useState(room.name);
  const [badges, setBadges] = useState(String(room.badges ?? 0));
  const [levelCap, setLevelCap] = useState(room.levelCap != null ? String(room.levelCap) : "");
  const [typeClause, setTypeClause] = useState(ruleset.typeClause);
  const [autoDeadSync, setAutoDeadSync] = useState(ruleset.autoDeadSync);
  const [dupesWarn, setDupesWarn] = useState(ruleset.dupesWarn);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateRoomSettings(room.roomCode, {
        name: name.trim() || room.name,
        badges: Math.max(0, parseInt(badges, 10) || 0),
        levelCap: levelCap.trim() === "" ? null : Math.max(1, Math.min(100, parseInt(levelCap, 10) || 0)),
        ruleset: { typeClause, autoDeadSync, dupesWarn },
      });
      toast.success("Einstellungen gespeichert.");
      onClose();
    } catch {
      toast.error("Nur der Host kann Einstellungen ändern.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "oklch(0 0 0 / 0.72)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass-card max-h-[90vh] w-full max-w-sm overflow-y-auto p-5 animate-fade-in-up">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-black text-foreground">Raum-Einstellungen</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: "oklch(0.95 0 0 / 0.08)", border: "1px solid oklch(0.95 0 0 / 0.12)", color: "oklch(0.5 0 0)" }}
            aria-label="Schließen"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Raumname</label>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className="input-field" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Orden</label>
              <input type="number" min={0} max={16} value={badges} onChange={(e) => setBadges(e.target.value)} className="input-field" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Level-Cap</label>
              <input type="number" min={1} max={100} value={levelCap} onChange={(e) => setLevelCap(e.target.value)} placeholder="—" className="input-field" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Regeln</span>
            <Toggle label="Todes-Verknüpfung" hint="Stirbt ein Pokémon, sterben verknüpfte automatisch." checked={autoDeadSync} onChange={setAutoDeadSync} />
            <Toggle label="Dupes-Klausel" hint="Warnt, wenn eine Entwicklungslinie schon genutzt wurde." checked={dupesWarn} onChange={setDupesWarn} />
            <Toggle label="Typ-Klausel" hint="Hinweis auf doppelte Typen (rein informativ)." checked={typeClause} onChange={setTypeClause} />
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary mt-5 w-full">
          {saving ? "Speichern…" : "Speichern"}
        </button>
      </div>
    </div>
  );
}
