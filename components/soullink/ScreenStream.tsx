"use client";

import { useState } from "react";
import {
  useMaybeRoomContext,
  useTracks,
  useLocalParticipant,
  VideoTrack,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { getMediaErrorMessage } from "@/lib/mediaError";
import {
  StreamStartCTA,
  StreamStopChip,
  StreamPermissionError,
  StreamUnavailableHint,
} from "./StreamControlOverlay";

const Placeholder = () => (
  <div
    className="flex h-full flex-col items-center justify-center gap-2"
    style={{ background: "oklch(0.07 0.01 260)" }}
  >
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.2">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
    <span className="text-[10px] text-muted-foreground/25">Kein Stream</span>
  </div>
);

function ScreenStreamLive({
  seatId,
  isOwn,
}: {
  seatId: string;
  isOwn: boolean;
}) {
  const [mediaError, setMediaError] = useState<string | null>(null);
  const tracks = useTracks([{ source: Track.Source.ScreenShare, withPlaceholder: false }]);
  const track = tracks.find(
    (t) => t.participant.identity === seatId && t.publication !== undefined
  );
  const { localParticipant } = useLocalParticipant();

  async function startScreenShare() {
    setMediaError(null);
    try {
      await localParticipant.setScreenShareEnabled(true, undefined, {
        screenShareEncoding: { maxBitrate: 3_000_000, maxFramerate: 30 },
      });
    } catch (err) {
      console.warn("ScreenStream: setScreenShareEnabled failed", err);
      setMediaError(getMediaErrorMessage(err, "screen"));
    }
  }

  if (track?.publication) {
    return (
      <div className="relative h-full w-full">
        <VideoTrack trackRef={track} className="h-full w-full object-contain" />
        {isOwn && (
          <div className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2">
            <StreamStopChip
              label="Stream beenden"
              accent="blue"
              onClick={() => localParticipant.setScreenShareEnabled(false)}
            />
          </div>
        )}
      </div>
    );
  }

  if (isOwn) {
    return (
      <div
        className="flex h-full items-center justify-center"
        style={{ background: "oklch(0.07 0.01 260)" }}
      >
        {mediaError ? (
          <StreamPermissionError message={mediaError} onRetry={startScreenShare} />
        ) : (
          <StreamStartCTA
            icon="screen"
            accent="blue"
            label="Bildschirm teilen"
            sublabel="Spiel oder Emulator übertragen"
            onClick={startScreenShare}
          />
        )}
      </div>
    );
  }

  return <Placeholder />;
}

export default function ScreenStream({
  seatId,
  isOwn = false,
}: {
  seatId: string;
  isOwn?: boolean;
}) {
  const room = useMaybeRoomContext();

  if (!room) {
    return (
      <div
        className="flex h-full items-center justify-center"
        style={{ background: "oklch(0.07 0.01 260)" }}
      >
        {isOwn ? <StreamUnavailableHint /> : <Placeholder />}
      </div>
    );
  }

  return <ScreenStreamLive seatId={seatId} isOwn={isOwn} />;
}
