function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
}

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

export function getArtworkUrl(pokemonId: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;
}

export interface PokemonSuggestion {
  id: number;
  nameDE: string | null;
  nameEN: string | null;
}

export async function fetchSuggestions(query: string): Promise<PokemonSuggestion[]> {
  if (query.length < 3) return [];
  const url = `${getApiBase()}/pokemon/search?q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const body = await res.json();
    return body.results ?? [];
  } catch {
    return [];
  }
}
