import "server-only";
import { cacheLife } from "next/cache";
import { CUISINE_TO_GOOGLE_TYPES, GOOGLE_TYPE_TO_CUISINE, styleFor } from "../cuisineStyles";
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
};

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

function cuisineOf(p: GooglePlace): string {
  for (const t of [p.primaryType, ...(p.types ?? [])]) {
    if (t && GOOGLE_TYPE_TO_CUISINE[t]) return GOOGLE_TYPE_TO_CUISINE[t];
  }
  return "autre";
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

type Candidate = { restaurant: Restaurant; bands: BudgetId[] };

export function normalizePlace(p: GooglePlace, origin: Coords): Candidate | null {
  const name = p.displayName?.text?.trim();
  if (!p.id || !name || !p.location) return null;
  if (p.businessStatus && p.businessStatus !== "OPERATIONAL") return null;

  const coords = { lat: p.location.latitude, lng: p.location.longitude };
  const cuisineId = cuisineOf(p);
  const style = styleFor(cuisineId);
  const price = readPrice(p);

  return {
    bands: price.bands,
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
    },
  };
}

// ------------------------------------------------------------- sélection

/** Score d'un resto pour ce groupe : plus il est haut, plus il sera proposé tôt. */
function score(c: Candidate, draft: GroupDraft): number {
  const r = c.restaurant;
  let s = 0;
  // La cuisine demandée prime sur le reste : on a choisi « sushi », pas « le moins cher ».
  if (draft.cuisines.length) s += draft.cuisines.includes(r.cuisineId) ? 5 : 0;
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
  return s;
}

/** Garde les meilleurs restos, sans doublons, du plus pertinent au moins pertinent. */
export function selectRestaurants(places: GooglePlace[], draft: GroupDraft, origin: Coords): Restaurant[] {
  const seen = new Set<string>();
  const candidates: Candidate[] = [];
  for (const p of places) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    const c = normalizePlace(p, origin);
    if (c) candidates.push(c);
  }
  return candidates
    .map((c) => ({ c, s: score(c, draft) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, RESULT_COUNT)
    .map(({ c }) => c.restaurant);
}

// ------------------------------------------------------------- point d'entrée

/** Cherche les restos autour de la position du groupe (général + cuisines choisies). */
export async function findRestaurants(draft: GroupDraft): Promise<Restaurant[]> {
  const origin = draft.location.coords;
  const latKey = Math.round(origin.lat * 1000) / 1000;
  const lngKey = Math.round(origin.lng * 1000) / 1000;

  const cuisineTypes = [...new Set(draft.cuisines.flatMap((c) => CUISINE_TO_GOOGLE_TYPES[c] ?? []))];
  let places: GooglePlace[] = [];

  for (const radius of RADII) {
    const calls: Promise<GooglePlace[]>[] = [fetchNearby(latKey, lngKey, radius, "restaurant")];
    if (cuisineTypes.length) {
      // Si un type est refusé par Google, on garde quand même la recherche générale.
      calls.push(fetchNearby(latKey, lngKey, radius, cuisineTypes.join(",")).catch(() => []));
    }
    places = (await Promise.all(calls)).flat();
    if (new Set(places.map((p) => p.id)).size >= MIN_RESULTS) break;
  }

  return selectRestaurants(places, draft, origin);
}
