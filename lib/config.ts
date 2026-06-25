/**
 * Central config helpers for the frontend.
 * NEXT_PUBLIC_API_URL must be set at build time for production deployments.
 * In local development the API defaults to port 4000 (backend default).
 */
export function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}
