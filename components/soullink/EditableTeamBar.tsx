"use client";

import { useState } from "react";
import type { SoulLinkTeamSlot } from "@/lib/soullinkTypes";
import TeamSlotButton from "./TeamSlotButton";
import SlotEditorModal from "./SlotEditorModal";
import PokemonDetailModal from "./PokemonDetailModal";

interface EditableTeamBarProps {
  seatId: string;
  slots: SoulLinkTeamSlot[];
  isOwn: boolean;
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

export default function EditableTeamBar({ seatId, slots, isOwn }: EditableTeamBarProps) {
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [detailSlot, setDetailSlot] = useState<number | null>(null);
  const normalized = normalizeSlots(slots);

  function handleSlotClick(slot: SoulLinkTeamSlot) {
    if (slot.status !== "empty") {
      // Gefüllter Slot (eigen oder fremd) → Detail-Ansicht.
      setDetailSlot(slot.slot);
    } else if (isOwn) {
      // Leerer eigener Slot → direkt Pokémon hinzufügen.
      setEditingSlot(slot.slot);
    }
  }

  const detail = detailSlot !== null ? normalized[detailSlot - 1] : null;

  return (
    <>
      <div className="grid h-full grid-cols-6 gap-2 px-3 py-2">
        {normalized.map((slot) => (
          <TeamSlotButton
            key={slot.slot}
            slot={slot}
            isOwn={isOwn}
            onClick={() => handleSlotClick(slot)}
          />
        ))}
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
          onClose={() => setEditingSlot(null)}
        />
      )}
    </>
  );
}
