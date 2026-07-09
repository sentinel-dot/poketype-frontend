"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import type { SoulLinkTeamSlot } from "@/lib/soullinkTypes";
import { useRoomStore } from "@/lib/soullinkStore";
import TeamSlotButton from "./TeamSlotButton";
import SlotEditorModal from "./SlotEditorModal";
import PokemonDetailModal from "./PokemonDetailModal";

interface EditableTeamBarProps {
  seatId: string;
  slots: SoulLinkTeamSlot[];
  isOwn: boolean;
  levelCap?: number | null;
  flashSlot?: number | null;
}

function normalizeSlots(slots: SoulLinkTeamSlot[]): SoulLinkTeamSlot[] {
  return Array.from({ length: 6 }, (_, i) => {
    const found = slots.find((s) => s.slot === i + 1);
    return (
      found ?? {
        slot: i + 1,
        status: "empty" as const,
        pokemonId: null,
        pokemonName: null,
        nickname: null,
        level: null,
      }
    );
  });
}

export default function EditableTeamBar({ seatId, slots, isOwn, levelCap, flashSlot }: EditableTeamBarProps) {
  const params = useParams<{ roomCode: string }>();
  const roomCode = params.roomCode;
  const socket = useRoomStore((s) => s.socket);
  const clearAllSlots = useRoomStore((s) => s.clearAllSlots);

  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [detailSlot, setDetailSlot] = useState<number | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const normalized = normalizeSlots(slots);
  const hasAny = normalized.some((s) => s.status !== "empty");

  function handleSlotClick(slot: SoulLinkTeamSlot) {
    if (slot.status !== "empty") {
      setDetailSlot(slot.slot);
    } else if (isOwn) {
      setEditingSlot(slot.slot);
    }
  }

  function handleClearAll() {
    if (!socket) return;
    clearAllSlots(seatId); // optimistic
    socket.emit("team-slot:clear-all", { roomCode, seatId });
    setConfirmClear(false);
  }

  const detail = detailSlot !== null ? normalized[detailSlot - 1] : null;

  return (
    <>
      <div className="flex h-full items-stretch gap-2 px-3 py-2">
        <div className="grid flex-1 grid-cols-6 gap-2">
          {normalized.map((slot) => (
            <TeamSlotButton
              key={slot.slot}
              slot={slot}
              isOwn={isOwn}
              levelCap={levelCap}
              highlight={flashSlot != null && flashSlot === slot.slot && slot.status === "dead"}
              onClick={() => handleSlotClick(slot)}
            />
          ))}
        </div>

        {isOwn && hasAny && (
          <div className="flex shrink-0 items-center">
            {confirmClear ? (
              <div className="flex flex-col gap-1">
                <button
                  onClick={handleClearAll}
                  className="rounded-lg px-2 py-1 text-[10px] font-bold text-white"
                  style={{ background: "oklch(0.55 0.22 15 / 0.85)" }}
                >
                  Sicher?
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="rounded-lg px-2 py-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground"
                >
                  Abbr.
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                title="Ganzes Team leeren"
                aria-label="Ganzes Team leeren"
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:brightness-110"
                style={{
                  background: "oklch(0.55 0.22 15 / 0.12)",
                  border: "1px solid oklch(0.55 0.22 15 / 0.3)",
                  color: "oklch(0.75 0.18 15)",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  <line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {detail && detail.pokemonName && (
        <PokemonDetailModal
          pokemonName={detail.pokemonName}
          onEdit={
            isOwn
              ? () => {
                  setEditingSlot(detail.slot);
                  setDetailSlot(null);
                }
              : undefined
          }
          onClose={() => setDetailSlot(null)}
        />
      )}

      {editingSlot !== null && (
        <SlotEditorModal
          seatId={seatId}
          slotNumber={editingSlot}
          slot={normalized[editingSlot - 1]}
          levelCap={levelCap}
          onClose={() => setEditingSlot(null)}
        />
      )}
    </>
  );
}
