import { styleFor } from "./cuisineStyles";
import { BUDGETS } from "./data";
import { hash, pick, seeded, shuffle } from "./random";
import type { BudgetId, GroupDraft, Restaurant } from "./types";

export type { Restaurant } from "./types";

/** Noms fictifs des restos d'exemple : aucun ne correspond volontairement à un vrai établissement. */
const DEMO_NAMES: Record<string, string[]> = {
  burger: ["Le Bun Bleu", "Smash & Co", "Chez Patty", "Burger Fabrik"],
  pizza: ["Il Forno Rosso", "La Pâte à Papa", "Fior di Napoli", "Pizza Margot"],
  italien: ["Trattoria Bella Vita", "Casa Nonna", "Al Dente", "La Piccola Cucina"],
  asiatique: ["Wok & Roll", "Jardin de Jade", "Le Dragon Doré", "Bambou Express"],
  sushi: ["Sakura Maki", "Umi Sushi Bar", "Tokyo Roll", "Nori & Riz"],
  mexicain: ["El Taco Loco", "Casa Jalapeño", "La Cantina", "Pueblo Burrito"],
  indien: ["Maharaja Palace", "Le Curry Épicé", "Delhi Street", "Masala Corner"],
  kebab: ["Istanbul Grill", "Le Durum d'Or", "Ocakbaşı", "Chez Mehmet"],
  francais: ["Le Bistrot du Coin", "Chez Marcel", "La Table d'Odette", "Brasserie des Halles"],
  libanais: ["Le Cèdre", "Beyrouth Mezzé", "Falafel Nour", "Les Mille et un Mezzés"],
  vegetarien: ["Graine & Feuille", "Le Potager", "Green Bowl", "Racines"],
  dessert: ["Sucre d'Orge", "La Douceur", "Crêperie Gwenn", "Maison Gourmande"],
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
 * Restos d'exemple (fictifs) autour d'une position : mêmes critères + même code = mêmes restos.
 * Sert de repli quand la source de vrais restos n'est pas disponible.
 */
export function buildDemoRestaurants(code: string, group: GroupDraft): Restaurant[] {
  const { coords } = group.location;
  const seed = hash(`${code}|${coords.lat.toFixed(2)}|${coords.lng.toFixed(2)}|${group.budget}|${group.cuisines.join(",")}`);
  const rand = seeded(seed);

  const pool = (group.cuisines.length ? group.cuisines : Object.keys(DEMO_NAMES)).filter((c) => DEMO_NAMES[c]);
  const order = shuffle(rand, pool);
  const usedNames = new Map<string, number>();

  return Array.from({ length: RESTAURANT_COUNT }, (_, i) => {
    const cuisineId = order[i % order.length];
    const style = styleFor(cuisineId);
    const names = DEMO_NAMES[cuisineId];
    const n = usedNames.get(cuisineId) ?? 0;
    usedNames.set(cuisineId, n + 1);

    const budget = budgetNear(rand, group.budget);
    const distance = Math.round((120 + rand() * 2080) / 10) * 10;
    const bearing = rand() * Math.PI * 2;
    const dLat = (distance * Math.cos(bearing)) / 111_320;
    const dLng = (distance * Math.sin(bearing)) / (111_320 * Math.cos((coords.lat * Math.PI) / 180));

    return {
      id: `demo-${cuisineId}-${n}`,
      name: names[n % names.length],
      cuisineId,
      cuisineLabel: style.label,
      emoji: style.emoji,
      priceLabel: BUDGETS.find((b) => b.id === budget)?.label,
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

/** Fiche Google quand on l'a ; sinon recherche sur le nom et l'adresse, ou sur les coordonnées. */
export function mapsUrl(r: Restaurant): string {
  if (r.mapsUrl) return r.mapsUrl;
  return `https://www.google.com/maps/search/?api=1&query=${r.coords.lat.toFixed(5)},${r.coords.lng.toFixed(5)}`;
}
