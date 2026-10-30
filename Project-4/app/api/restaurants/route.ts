import { BUDGETS, CUISINES } from "@/lib/data";
import { findRestaurants, GooglePlacesError } from "@/lib/places/google";
import type { BudgetId, GroupDraft } from "@/lib/types";

const BUDGET_IDS = new Set<string>(BUDGETS.map((b) => b.id));
const CUISINE_IDS = new Set<string>(CUISINES.map((c) => c.id));

/** Limite simple en mémoire : 12 recherches par minute et par adresse IP. */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 12;
const hits = new Map<string, number[]>();

function tooMany(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear(); // évite une croissance sans fin
  return recent.length > MAX_PER_WINDOW;
}

function parse(body: unknown): GroupDraft | null {
  if (typeof body !== "object" || body === null) return null;
  const { lat, lng, budget, cuisines } = body as Record<string, unknown>;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (!(lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180)) return null;
  if (typeof budget !== "string" || !BUDGET_IDS.has(budget)) return null;
  if (!Array.isArray(cuisines) || cuisines.length > CUISINES.length) return null;
  if (!cuisines.every((c) => typeof c === "string" && CUISINE_IDS.has(c))) return null;
  return {
    location: { label: "", coords: { lat, lng }, source: "manual" },
    budget: budget as BudgetId,
    cuisines: cuisines as string[],
  };
}

export async function POST(request: Request) {
  // N'accepte que les appels venant de ce site (la clé Google a un coût).
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (tooMany(ip)) return Response.json({ error: "rate_limited" }, { status: 429 });

  const draft = parse(await request.json().catch(() => null));
  if (!draft) return Response.json({ error: "bad_request" }, { status: 400 });

  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return Response.json({ error: "no_key" }, { status: 503 });
  }

  try {
    const restaurants = await findRestaurants(draft);
    if (restaurants.length === 0) return Response.json({ error: "empty" }, { status: 404 });
    return Response.json({ restaurants, source: "google" });
  } catch (e) {
    // Détail dans les logs serveur uniquement (jamais la clé, jamais renvoyé au navigateur).
    console.error(e instanceof GooglePlacesError ? e.message : e);
    return Response.json({ error: "upstream" }, { status: 502 });
  }
}
