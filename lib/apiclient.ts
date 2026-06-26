import { getApiBase } from "./config";

export const NETWORK_ERROR_MESSAGE =
  "Die Verbindung zum Server ist fehlgeschlagen. Bitte prüfe deine Internetverbindung.";

export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message === "Failed to fetch") return true;
  if (error instanceof Error && /failed to fetch|network error|load failed/i.test(error.message))
    return true;
  return false;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function fetchMatchup(name: string, gen: number) {
  const url = `${getApiBase()}/pokemon/${encodeURIComponent(name)}/matchup?gen=${gen}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch (err) {
    if (isNetworkError(err)) throw new Error(NETWORK_ERROR_MESSAGE);
    throw err;
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof body?.error === "string" ? body.error : `HTTP ${response.status}`;
    const error = new ApiError(response.status, message);
    if (response.status >= 500) console.error("API Error:", error);
    throw error;
  }

  return body;
}

export async function fetchEvolution(name: string) {
  const url = `${getApiBase()}/pokemon/${encodeURIComponent(name)}/evolution`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch (err) {
    if (isNetworkError(err)) throw new Error(NETWORK_ERROR_MESSAGE);
    throw err;
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof body?.error === "string" ? body.error : `HTTP ${response.status}`;
    throw new ApiError(response.status, message);
  }

  return body;
}

export function getArtworkUrl(pokemonId: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;
}

export function getPixelSpriteUrl(pokemonId: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;
}

export function getAnimatedSpriteUrl(pokemonId: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${pokemonId}.gif`;
}

export interface PokemonSuggestion {
  id: number;
  nameDE: string | null;
  nameEN: string | null;
}

export async function fetchSuggestions(query: string, maxNationalDex?: number | null): Promise<PokemonSuggestion[]> {
  if (query.length < 3) return [];
  const params = new URLSearchParams({ q: query });
  if (maxNationalDex != null) params.set("maxNationalDex", String(maxNationalDex));
  const url = `${getApiBase()}/pokemon/search?${params}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const body = await res.json();
    return body.results ?? [];
  } catch {
    return [];
  }
}
