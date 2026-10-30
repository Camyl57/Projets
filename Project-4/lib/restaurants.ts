import { BUDGETS } from "./data";
import { hash, pick, seeded, shuffle } from "./random";
import type { BudgetId, Coords, GroupDraft } from "./types";

export type Restaurant = {
  id: string;
  name: string;
  cuisineId: string;
  cuisineLabel: string;
  emoji: string;
  priceLabel: string;
  rating: number;
  reviews: number;
  /** Distance à vol d'oiseau, en mètres. */
  distance: number;
  address: string;
  coords: Coords;
  tags: string[];
  gradient: [string, string];
};

type CuisineStyle = { label: string; emoji: string; gradient: [string, string]; names: string[] };

/** Noms fictifs : aucun ne correspond volontairement à un vrai établissement. */
const STYLES: Record<string, CuisineStyle> = {
  burger: { label: "Burger", emoji: "🍔", gradient: ["#ffb347", "#ff5a36"], names: ["Le Bun Bleu", "Smash & Co", "Chez Patty", "Burger Fabrik"] },
  pizza: { label: "Pizza", emoji: "🍕", gradient: ["#ff8a5b", "#e03f1c"], names: ["Il Forno Rosso", "La Pâte à Papa", "Fior di Napoli", "Pizza Margot"] },
  italien: { label: "Italien", emoji: "🍝", gradient: ["#7bd389", "#2bb673"], names: ["Trattoria Bella Vita", "Casa Nonna", "Al Dente", "La Piccola Cucina"] },
  asiatique: { label: "Asiatique", emoji: "🥢", gradient: ["#ff9aa2", "#e4572e"], names: ["Wok & Roll", "Jardin de Jade", "Le Dragon Doré", "Bambou Express"] },
  sushi: { label: "Sushi", emoji: "🍣", gradient: ["#9ad0f5", "#4e8fd6"], names: ["Sakura Maki", "Umi Sushi Bar", "Tokyo Roll", "Nori & Riz"] },
  mexicain: { label: "Mexicain", emoji: "🌮", gradient: ["#ffd166", "#ef8354"], names: ["El Taco Loco", "Casa Jalapeño", "La Cantina", "Pueblo Burrito"] },
  indien: { label: "Indien", emoji: "🍛", gradient: ["#f9a826", "#b5651d"], names: ["Maharaja Palace", "Le Curry Épicé", "Delhi Street", "Masala Corner"] },
  kebab: { label: "Kebab", emoji: "🥙", gradient: ["#f4a261", "#9c4a1a"], names: ["Istanbul Grill", "Le Durum d'Or", "Ocakbaşı", "Chez Mehmet"] },
  francais: { label: "Français", emoji: "🥖", gradient: ["#a0c4ff", "#5e60cd"], names: ["Le Bistrot du Coin", "Chez Marcel", "La Table d'Odette", "Brasserie des Halles"] },
  libanais: { label: "Libanais", emoji: "🧆", gradient: ["#c9e4ca", "#52796f"], names: ["Le Cèdre", "Beyrouth Mezzé", "Falafel Nour", "Les Mille et un Mezzés"] },
  vegetarien: { label: "Végé", emoji: "🥗", gradient: ["#b7e4c7", "#40916c"], names: ["Graine & Feuille", "Le Potager", "Green Bowl", "Racines"] },
  dessert: { label: "Desserts", emoji: "🍰", gradient: ["#ffc8dd", "#ff70a6"], names: ["Sucre d'Orge", "La Douceur", "Crêperie Gwenn", "Maison Gourmande"] },
};

const STREETS = ["rue des Lilas", "avenue de la République", "place du Marché", "rue Victor Hugo", "boulevard Gambetta", "rue de la Gare", "quai des Arts", "rue Pasteur", "cours Jean Jaurès"];
const TAGS = ["Terrasse", "Ouvert tard", "Service rapide", "Cadre sympa", "À emporter", "Groupes bienvenus", "Végé friendly", "Brunch"];
const BUDGET_IDS = BUDGETS.map((b) => b.id);

export const RESTAURANT_COUNT = 12;

function budgetNear(rand: () => number, budget: BudgetId): BudgetId {
  // 3 restos sur 4 dans le budget choisi, les autres juste à côté pour varier.
  if (rand() < 0.75) return budget;
  const i = BUDGET_IDS.indexOf(budget);
  const candidates = [BUDGET_IDS[i - 1], BUDGET_IDS[i + 1]].filter((b): b is BudgetId => b !== undefined);
  return pick(rand, candidates);
}

/**
 * Restos fictifs autour d'une position : mêmes critères + même code de groupe = mêmes restos.
 * À remplacer par une vraie API (Google Places, Foursquare…) quand le serveur sera en place.
 */
export function buildRestaurants(code: string, group: GroupDraft): Restaurant[] {
  const { coords } = group.location;
  const seed = hash(`${code}|${coords.lat.toFixed(2)}|${coords.lng.toFixed(2)}|${group.budget}|${group.cuisines.join(",")}`);
  const rand = seeded(seed);

  const pool = (group.cuisines.length ? group.cuisines : Object.keys(STYLES)).filter((c) => STYLES[c]);
  const order = shuffle(rand, pool);
  const usedNames = new Map<string, number>();

  return Array.from({ length: RESTAURANT_COUNT }, (_, i) => {
    const cuisineId = order[i % order.length];
    const style = STYLES[cuisineId];
    const n = usedNames.get(cuisineId) ?? 0;
    usedNames.set(cuisineId, n + 1);
    const name = style.names[n % style.names.length];

    const budget = budgetNear(rand, group.budget);
    const distance = Math.round((120 + rand() * 2080) / 10) * 10;
    const bearing = rand() * Math.PI * 2;
    const dLat = (distance * Math.cos(bearing)) / 111_320;
    const dLng = (distance * Math.sin(bearing)) / (111_320 * Math.cos((coords.lat * Math.PI) / 180));

    return {
      id: `${cuisineId}-${n}`,
      name,
      cuisineId,
      cuisineLabel: style.label,
      emoji: style.emoji,
      priceLabel: BUDGETS.find((b) => b.id === budget)?.label ?? "",
      rating: Math.round((3.9 + rand() * 1.0) * 10) / 10,
      reviews: Math.round(40 + rand() * 860),
      distance,
      address: `${Math.floor(1 + rand() * 78)} ${pick(rand, STREETS)}`,
      coords: { lat: coords.lat + dLat, lng: coords.lng + dLng },
      tags: shuffle(rand, TAGS).slice(0, 3),
      gradient: style.gradient,
    };
  });
}

export function formatDistance(m: number): string {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1).replace(".", ",")} km`;
}

/** Les restos de la démo sont fictifs : on ouvre la carte sur leurs coordonnées. */
export function mapsUrl(r: Restaurant): string {
  return `https://www.google.com/maps/search/?api=1&query=${r.coords.lat.toFixed(5)},${r.coords.lng.toFixed(5)}`;
}
