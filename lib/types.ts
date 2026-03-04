export interface MatchupResponse {
  pokemon: string;
  pokemonId?: number;
  generation: number;
  types: string[];
  matchup: {
    "0": string[];
    "0.25": string[];
    "0.5": string[];
    "1": string[];
    "2": string[];
    "4": string[];
  };
}

export type Multiplier = "0" | "0.25" | "0.5" | "1" | "2" | "4";

export const TYPE_COLORS: Record<string, string> = {
  normal:   "#A8A878",
  fire:     "#F08030",
  water:    "#6890F0",
  electric: "#F8D030",
  grass:    "#78C850",
  ice:      "#98D8D8",
  fighting: "#C03028",
  poison:   "#A040A0",
  ground:   "#E0C068",
  flying:   "#A890F0",
  psychic:  "#F85888",
  bug:      "#A8B820",
  rock:     "#B8A038",
  ghost:    "#705898",
  dragon:   "#7038F8",
  dark:     "#705848",
  steel:    "#B8B8D0",
  fairy:    "#EE99AC",
};

export const TYPE_LABELS: Record<string, string> = {
  normal:   "Normal",
  fire:     "Feuer",
  water:    "Wasser",
  electric: "Elektro",
  grass:    "Pflanze",
  ice:      "Eis",
  fighting: "Kampf",
  poison:   "Gift",
  ground:   "Boden",
  flying:   "Flug",
  psychic:  "Psycho",
  bug:      "Käfer",
  rock:     "Gestein",
  ghost:    "Geist",
  dragon:   "Drache",
  dark:     "Unlicht",
  steel:    "Stahl",
  fairy:    "Fee",
};

export function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#2d2d2d" : "#ffffff";
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 30, g: 60, b: 100 };
}
