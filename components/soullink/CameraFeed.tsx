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
    style={{ background: "oklch(0.09 0.02 260)" }}
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.3">
      <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
    <span className="text-[10px] text-muted-foreground/30">Keine Kamera</span>
  </div>
);

function CameraFeedLive({
  seatId,
  isOwn,
}: {
  seatId: string;
  isOwn: boolean;
}) {
  const [mediaError, setMediaError] = useState<string | null>(null);
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: false }]);
  const track = tracks.find(
    (t) => t.participant.identity === seatId && t.publication !== undefined
  );
  const { localParticipant } = useLocalParticipant();

  async function startCamera() {
    setMediaError(null);
    try {
      await localParticipant.setCameraEnabled(true);
    } catch (err) {
      console.warn("CameraFeed: setCameraEnabled failed", err);
      setMediaError(getMediaErrorMessage(err, "camera"));
    }
  }

  if (track?.publication) {
    return (
      <div className="relative h-full w-full">
        <VideoTrack trackRef={track} className="h-full w-full object-cover" />
        {isOwn && (
          <div className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2">
            <StreamStopChip
              label="Kamera beenden"
              accent="green"
              onClick={() => localParticipant.setCameraEnabled(false)}
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
        style={{ background: "oklch(0.09 0.02 260)" }}
      >
        {mediaError ? (
          <StreamPermissionError message={mediaError} onRetry={startCamera} />
        ) : (
          <StreamStartCTA
            icon="camera"
            accent="green"
            label="Kamera starten"
            sublabel="Webcam für andere Spieler freigeben"
            onClick={startCamera}
          />
        )}
      </div>
    );
  }

  return <Placeholder />;
}

export default function CameraFeed({
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
        style={{ background: "oklch(0.09 0.02 260)" }}
      >
        {isOwn ? <StreamUnavailableHint /> : <Placeholder />}
      </div>
    );
  }

  return <CameraFeedLive seatId={seatId} isOwn={isOwn} />;
}
