import type { TrackReferenceOrPlaceholder } from "@livekit/components-core";

export function isTrackStreaming(trackRef: TrackReferenceOrPlaceholder | undefined): boolean {
  if (!trackRef?.publication) return false;
  const pub = trackRef.publication;
  const mediaTrack = pub.track?.mediaStreamTrack;
  return !pub.isMuted && mediaTrack?.readyState === "live";
}
