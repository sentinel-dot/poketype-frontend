"use client";

import { useState } from "react";
import type { SoulLinkTeamSlot } from "@/lib/soullinkTypes";
import TeamSlotButton from "./TeamSlotButton";
import SlotEditorModal from "./SlotEditorModal";

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
  const normalized = normalizeSlots(slots);

  return (
    <>
      <div className="grid h-full grid-cols-6 gap-1.5 px-2 py-1.5">
        {normalized.map((slot) => (
          <TeamSlotButton
            key={slot.slot}
            slot={slot}
            isOwn={isOwn}
            onClick={() => setEditingSlot(slot.slot)}
          />
        ))}
      </div>

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
