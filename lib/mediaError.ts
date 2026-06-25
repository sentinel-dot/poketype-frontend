export function getMediaErrorMessage(err: unknown, kind: "camera" | "screen"): string {
  const name = err instanceof DOMException ? err.name : err instanceof Error ? err.name : "";
  const message = err instanceof Error ? err.message : String(err);

  if (name === "NotAllowedError" || message.includes("Permission denied")) {
    if (kind === "camera") {
      return "Kamera blockiert. Windows: Einstellungen → Datenschutz → Kamera aktivieren. Browser: Kamera für diese Seite erlauben. Nutze http://localhost:3000 (nicht die Netzwerk-IP). Andere Apps (Discord, OBS) schließen.";
    }
    return "Bildschirmfreigabe blockiert. Browser-Berechtigung prüfen und Seite über http://localhost:3000 öffnen.";
  }

  if (name === "NotFoundError" || message.includes("not found")) {
    return kind === "camera"
      ? "Keine Kamera gefunden. Ist ein Webcam angeschlossen?"
      : "Kein Bildschirm zum Teilen gefunden.";
  }

  if (name === "NotReadableError" || message.includes("in use")) {
    return kind === "camera"
      ? "Kamera wird bereits von einer anderen App verwendet (z. B. Discord, OBS, Teams)."
      : "Bildschirmaufnahme gerade nicht möglich — andere App blockiert evtl. den Zugriff.";
  }

  return kind === "camera"
    ? "Kamera konnte nicht gestartet werden. Seite neu laden und erneut versuchen."
    : "Bildschirmfreigabe konnte nicht gestartet werden. Seite neu laden und erneut versuchen.";
}
