"use client";

import { useEffect, useState } from "react";
import { fetchMatchup } from "@/lib/apiclient";

const cache = new Map<number, string[]>();
const pending = new Map<number, Promise<string[]>>();

async function fetchTypes(pokemonId: number, pokemonName: string | null): Promise<string[]> {
  const cached = cache.get(pokemonId);
  if (cached) return cached;

  const inFlight = pending.get(pokemonId);
  if (inFlight) return inFlight;

  const promise = (async () => {
    try {
      const name = pokemonName ?? String(pokemonId);
      const data = await fetchMatchup(name, 9);
      const types = data.types ?? [];
      cache.set(pokemonId, types);
      return types;
    } catch {
      cache.set(pokemonId, []);
      return [];
    } finally {
      pending.delete(pokemonId);
    }
  })();

  pending.set(pokemonId, promise);
  return promise;
}

export function usePokemonTypes(
  pokemonId: number | null,
  pokemonName: string | null
): { types: string[]; loading: boolean } {
  const [types, setTypes] = useState<string[]>(() =>
    pokemonId != null ? (cache.get(pokemonId) ?? []) : []
  );
  const [loading, setLoading] = useState(
    () => pokemonId != null && !cache.has(pokemonId)
  );

  useEffect(() => {
    if (pokemonId == null) {
      setTypes([]);
      setLoading(false);
      return;
    }

    const cached = cache.get(pokemonId);
    if (cached) {
      setTypes(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchTypes(pokemonId, pokemonName).then((result) => {
      if (!cancelled) {
        setTypes(result);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [pokemonId, pokemonName]);

  return { types, loading };
}

export function prefetchPokemonTypes(pokemonId: number, pokemonName: string | null) {
  if (!cache.has(pokemonId)) {
    void fetchTypes(pokemonId, pokemonName);
  }
}
