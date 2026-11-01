import "server-only";
import { cacheLife } from "next/cache";
import { CUISINE_PRIORITY, CUISINE_TO_GOOGLE_TYPES, GOOGLE_TYPE_TO_CUISINE, styleFor } from "../cuisineStyles";
import { distanceMeters } from "../geo";
import type { BudgetId, Coords, GroupDraft, Restaurant } from "../types";

/**
 * Restos réels via Google Places API (New) — Nearby Search.
 * Doc : https://developers.google.com/maps/documentation/places/web-service/nearby-search
 * Tout se passe côté serveur : la clé n'est jamais envoyée au navigateur.
 */

const BASE_URL = process.env.GOOGLE_PLACES_BASE_URL ?? "https://places.googleapis.com";

/** Les champs demandés déterminent le tarif : ne rien ajouter sans nécessité. */
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.shortFormattedAddress",
  "places.location",
  "places.types",
  "places.primaryType",
  "places.businessStatus",
  "places.googleMapsUri",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.priceRange",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.currentOpeningHours.openNow",
  "places.regularOpeningHours.weekdayDescriptions",
].join(",");

export const RESULT_COUNT = 12;
const RADII = [1500, 5000];
const MIN_RESULTS = 8;

export type GooglePlace = {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  shortFormattedAddress?: string;
  location?: { latitude: number; longitude: number };
  types?: string[];
  primaryType?: string;
  businessStatus?: string;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  priceRange?: { startPrice?: { units?: string }; endPrice?: { units?: string } };
  nationalPhoneNumber?: string;
  websiteUri?: string;
  currentOpeningHours?: { openNow?: boolean };
  /** Sept lignes (lundi → dimanche), par exemple « lundi: 12:00 – 14:30, 19:00 – 22:30 » ou « mardi: Fermé ». */
  regularOpeningHours?: { weekdayDescriptions?: string[] };
};


// ------------------------------------------------------------- fiabilité

/** Combien d'avis minimum pour considérer une fiche « installée » (les cuisines fantômes en ont très peu). */
const MIN_REVIEWS_STRICT = 15;
const MIN_REVIEWS_RELAXED = 3;
/** Si les règles strictes laissent moins de résultats, on les assouplit (petites villes). */
const MIN_STRICT_RESULTS = 6;

const FOOD_PRIMARY = new Set(["restaurant", "meal_takeaway", "sandwich_shop", "steak_house", "bar_and_grill", "food_court"]);
const DESSERT_PRIMARY = new Set(["bakery", "dessert_shop", "ice_cream_shop", "cafe", "coffee_shop", "dessert_restaurant", "cake_shop"]);
/** Types qui, sans type principal fiable, trahissent un lieu qui n'est pas un resto (station-service, hôtel, supermarché…). */
const NOT_A_RESTAURANT = new Set(["gas_station", "lodging", "hotel", "supermarket", "convenience_store", "grocery_store", "store", "shopping_mall", "department_store"]);

/** Vrai resto, et non une station-service ou un hôtel que Google range aussi dans « restaurant ». */
function isFoodPlace(p: GooglePlace, wantsDessert: boolean): boolean {
  const primary = p.primaryType ?? "";
  if (primary) {
    if (primary.endsWith("_restaurant") || FOOD_PRIMARY.has(primary)) return true;
    return wantsDessert && DESSERT_PRIMARY.has(primary);
  }
  const types = p.types ?? [];
  return types.includes("restaurant") && !types.some((t) => NOT_A_RESTAURANT.has(t));
}

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** Ligne d'horaires du jour (fuseau de Paris) : « 12:00 – 14:30, 19:00 – 22:30 » ou « Fermé ». */
export function hoursForToday(p: GooglePlace, now: Date = new Date()): string | undefined {
  const lines = p.regularOpeningHours?.weekdayDescriptions;
  if (!lines || lines.length !== 7) return undefined;
  const day = now.toLocaleDateString("en-US", { weekday: "long", timeZone: "Europe/Paris" });
  const line = lines[WEEKDAYS.indexOf(day)];
  if (!line) return undefined;
  return line.slice(line.indexOf(":") + 1).trim().replace(/[\u202f\u2009]/g, " ");
}

const isClosedToday = (hours?: string) => hours !== undefined && /ferm/i.test(hours) && !/\d/.test(hours);

// ---------------------------------------------------------------- appel API

/**
 * Un appel Nearby Search, mis en cache quelques minutes côté serveur pour éviter de payer
 * deux fois la même requête (arguments arrondis, donc partagés entre voisins proches).
 */
async function fetchNearby(latKey: number, lngKey: number, radius: number, typesKey: string): Promise<GooglePlace[]> {
  "use cache";
  cacheLife("minutes");

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY manquante");

  const res = await fetch(`${BASE_URL}/v1/places:searchNearby`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      includedTypes: typesKey.split(","),
      maxResultCount: 20,
      rankPreference: "POPULARITY",
      languageCode: "fr",
      regionCode: "FR",
      locationRestriction: { circle: { center: { latitude: latKey, longitude: lngKey }, radius } },
    }),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    // Le message de Google aide à diagnostiquer (API non activée, clé restreinte, quota…).
    const detail = await res.text().catch(() => "");
    throw new GooglePlacesError(res.status, detail.slice(0, 300));
  }
  const data = (await res.json()) as { places?: GooglePlace[] };
  return data.places ?? [];
}

export class GooglePlacesError extends Error {
  constructor(
    readonly status: number,
    detail: string,
  ) {
    super(`Google Places ${status}: ${detail}`);
  }
}

// ----------------------------------------------------------- normalisation

const BUDGET_ORDER: BudgetId[] = ["lt10", "10-20", "20-30", "gt30"];

function bandForAverage(avg: number): BudgetId {
  return avg < 10 ? "lt10" : avg < 20 ? "10-20" : avg < 30 ? "20-30" : "gt30";
}

/** Tranches de budget compatibles avec la fourchette de prix, et libellé à afficher. */
function readPrice(p: GooglePlace): { label?: string; bands: BudgetId[] } {
  const start = Number(p.priceRange?.startPrice?.units);
  const end = Number(p.priceRange?.endPrice?.units);
  if (Number.isFinite(start)) {
    const hi = Number.isFinite(end) ? end : start;
    const a = BUDGET_ORDER.indexOf(bandForAverage(start));
    const b = BUDGET_ORDER.indexOf(bandForAverage(hi));
    return {
      label: Number.isFinite(end) ? `${start}–${end} €` : `dès ${start} €`,
      bands: BUDGET_ORDER.slice(Math.min(a, b), Math.max(a, b) + 1),
    };
  }
  switch (p.priceLevel) {
    case "PRICE_LEVEL_FREE":
    case "PRICE_LEVEL_INEXPENSIVE":
      return { label: "€", bands: ["lt10", "10-20"] };
    case "PRICE_LEVEL_MODERATE":
      return { label: "€€", bands: ["10-20", "20-30"] };
    case "PRICE_LEVEL_EXPENSIVE":
      return { label: "€€€", bands: ["20-30", "gt30"] };
    case "PRICE_LEVEL_VERY_EXPENSIVE":
      return { label: "€€€€", bands: ["gt30"] };
    default:
      return { bands: [] };
  }
}

/** Toutes les cuisines que Google associe à la fiche, de la plus précise à la plus vague. */
function cuisinesOf(p: GooglePlace): string[] {
  const found = new Set<string>();
  for (const type of [p.primaryType, ...(p.types ?? [])]) {
    const id = type ? GOOGLE_TYPE_TO_CUISINE[type] : undefined;
    if (id) found.add(id);
  }
  return [...found].sort((a, b) => CUISINE_PRIORITY.indexOf(a) - CUISINE_PRIORITY.indexOf(b));
}

function tagsOf(p: GooglePlace): string[] {
  const types = new Set(p.types ?? []);
  const tags: string[] = [];
  if (p.currentOpeningHours?.openNow) tags.push("Ouvert maintenant");
  if ((p.rating ?? 0) >= 4.5 && (p.userRatingCount ?? 0) >= 30) tags.push("Très bien noté");
  if (types.has("meal_takeaway")) tags.push("À emporter");
  if (types.has("meal_delivery")) tags.push("Livraison");
  if (types.has("bar")) tags.push("Bar");
  if (types.has("brunch_restaurant") || types.has("breakfast_restaurant")) tags.push("Brunch");
  return tags.slice(0, 3);
}

type Candidate = { restaurant: Restaurant; bands: BudgetId[]; closedToday: boolean; cuisines: string[] };

type Rules = {
  /** Règles strictes : avis, horaires et ouverture du jour exigés. Sinon : version assouplie pour les petites villes. */
  strict: boolean;
  wantsDessert: boolean;
  /** Cuisines choisies par le groupe : si la fiche en a une, c'est celle qu'on affiche. */
  selected: string[];
  now: Date;
};

export function normalizePlace(p: GooglePlace, origin: Coords, rules: Rules): Candidate | null {
  const name = p.displayName?.text?.trim();
  if (!p.id || !name || !p.location) return null;
  // Seules les fiches explicitement « en activité » : un statut absent ou « fermé » est écarté.
  if (p.businessStatus !== "OPERATIONAL") return null;
  if (!isFoodPlace(p, rules.wantsDessert)) return null;

  // Une fiche installée a des avis. Les cuisines fantômes de livraison en ont très peu, ou aucun.
  const reviews = p.userRatingCount ?? 0;
  if (p.rating === undefined || reviews < (rules.strict ? MIN_REVIEWS_STRICT : MIN_REVIEWS_RELAXED)) return null;

  // Un resto où l'on va manger n'est pas « livraison seulement » : c'est la signature des cuisines fantômes.
  const types = p.types ?? [];
  if (rules.strict && types.includes("meal_delivery") && !types.includes("meal_takeaway")) return null;

  const hours = hoursForToday(p, rules.now);
  const closedToday = isClosedToday(hours);
  if (rules.strict && (hours === undefined || closedToday)) return null;

  const coords = { lat: p.location.latitude, lng: p.location.longitude };
  const cuisines = cuisinesOf(p);
  const cuisineId = cuisines.find((c) => rules.selected.includes(c)) ?? cuisines[0] ?? "autre";
  const style = styleFor(cuisineId);
  const price = readPrice(p);

  return {
    bands: price.bands,
    closedToday,
    cuisines,
    restaurant: {
      id: `g-${p.id}`,
      name,
      cuisineId,
      cuisineLabel: style.label,
      emoji: style.emoji,
      priceLabel: price.label,
      rating: p.rating,
      reviews: p.userRatingCount,
      distance: Math.round(distanceMeters(origin, coords) / 10) * 10,
      address: (p.shortFormattedAddress ?? p.formattedAddress ?? "").replace(/, France$/, ""),
      coords,
      tags: tagsOf(p),
      gradient: style.gradient,
      phone: p.nationalPhoneNumber,
      website: p.websiteUri,
      mapsUrl: p.googleMapsUri,
      hoursToday: hours,
    },
  };
}

// ------------------------------------------------------------- sélection

/** Score d'un resto pour ce groupe : plus il est haut, plus il sera proposé tôt. */
function score(c: Candidate, draft: GroupDraft): number {
  const r = c.restaurant;
  let s = 0;
  // La cuisine demandée prime sur le reste : on a choisi « sushi », pas « le moins cher ».
  if (draft.cuisines.length) s += c.cuisines.some((id) => draft.cuisines.includes(id)) ? 5 : 0;
  if (c.bands.length === 0) s += 1; // prix inconnu : on ne l'écarte pas
  else if (c.bands.includes(draft.budget)) s += 3;
  else {
    const i = BUDGET_ORDER.indexOf(draft.budget);
    const gap = Math.min(...c.bands.map((b) => Math.abs(BUDGET_ORDER.indexOf(b) - i)));
    s -= gap; // un cran d'écart : léger malus ; deux ou plus : on les met au fond
  }
  if (r.rating) s += (r.rating - 3.5) * 1.2;
  if ((r.reviews ?? 0) >= 50) s += 0.5;
  s -= (r.distance / 1000) * 0.4;
  if (c.closedToday) s -= 6; // ne servira qu'en dernier recours (règles assouplies)
  return s;
}

/** Garde les meilleurs restos, sans doublons, du plus pertinent au moins pertinent. */
export function selectRestaurants(places: GooglePlace[], draft: GroupDraft, origin: Coords, now: Date = new Date()): Restaurant[] {
  const wantsDessert = draft.cuisines.includes("dessert");
  const unique = [...new Map(places.map((p) => [p.id, p])).values()];

  const pick = (strict: boolean) => {
    const found = unique
      .map((p) => normalizePlace(p, origin, { strict, wantsDessert, selected: draft.cuisines, now }))
      .filter((c): c is Candidate => c !== null);

    // Plusieurs « restos » à la même adresse = une cuisine partagée qui vend sous plusieurs marques :
    // on ne garde que la fiche la plus établie (le plus d'avis).
    const byAddress = new Map<string, Candidate>();
    const kept: Candidate[] = [];
    for (const c of found) {
      const key = c.restaurant.address.trim().toLowerCase();
      if (!key) {
        kept.push(c);
        continue;
      }
      const other = byAddress.get(key);
      if (!other || (c.restaurant.reviews ?? 0) > (other.restaurant.reviews ?? 0)) byAddress.set(key, c);
    }
    kept.push(...byAddress.values());

    return kept
      .map((c) => ({ c, s: score(c, draft) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, RESULT_COUNT)
      .map(({ c }) => c.restaurant);
  };

  const strict = pick(true);
  // Petite ville : trop peu de fiches passent les règles strictes, on assouplit plutôt que de ne rien proposer.
  return strict.length >= MIN_STRICT_RESULTS ? strict : pick(false);
}

// ------------------------------------------------------------- point d'entrée

/** Cherche les restos autour de la position du groupe (général + cuisines choisies). */
export async function findRestaurants(draft: GroupDraft): Promise<Restaurant[]> {
  const origin = draft.location.coords;
  const latKey = Math.round(origin.lat * 1000) / 1000;
  const lngKey = Math.round(origin.lng * 1000) / 1000;

  const cuisineTypes = [...new Set(draft.cuisines.flatMap((c) => CUISINE_TO_GOOGLE_TYPES[c] ?? []))];
  let best: Restaurant[] = [];

  for (const radius of RADII) {
    const calls: Promise<GooglePlace[]>[] = [fetchNearby(latKey, lngKey, radius, "restaurant")];
    if (cuisineTypes.length) {
      // Si un type est refusé par Google, on garde quand même la recherche générale.
      calls.push(fetchNearby(latKey, lngKey, radius, cuisineTypes.join(",")).catch(() => []));
    }
    best = selectRestaurants((await Promise.all(calls)).flat(), draft, origin);
    // On élargit la zone tant que trop peu de fiches fiables ont passé les filtres.
    if (best.length >= MIN_RESULTS) break;
  }

  return best;
}
