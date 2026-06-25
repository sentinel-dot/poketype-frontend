import { useState, useEffect } from "react";
import { getLiveKitToken, type LiveKitTokenResponse } from "../soullinkApi";

/**
 * Fetches a LiveKit token for the given seat.
 * Returns null while loading or when LiveKit is not configured on the backend (503).
 * Errors are silently swallowed — the UI gracefully falls back to placeholders.
 */
export function useLiveKit(
  roomCode: string,
  seatId: string | null,
  participantToken: string | null
): LiveKitTokenResponse | null {
  const [liveKit, setLiveKit] = useState<LiveKitTokenResponse | null>(null);

  useEffect(() => {
    if (!seatId || !participantToken) return;

    let cancelled = false;

    getLiveKitToken(roomCode, seatId, participantToken)
      .then((data) => {
        if (!cancelled) setLiveKit(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // 503 means the server runs without LiveKit env vars — that's fine,
        // we degrade gracefully to placeholder UI.
        if (err instanceof Error && err.message === "livekit_not_configured") return;
        console.warn("useLiveKit: could not get token", err);
      });

    return () => {
      cancelled = true;
    };
  }, [roomCode, seatId, participantToken]);

  return liveKit;
}
