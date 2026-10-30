import { hash } from "./random";
import type { Restaurant } from "./restaurants";

/**
 * MODE DÉMO : tant qu'il n'y a pas de serveur partagé, les amis sont simulés.
 * Leurs votes sont déterministes (même code + même resto = même réponse).
 */
export const DEMO_FRIENDS = [
  { name: "Lina", emoji: "🦊" },
  { name: "Tom", emoji: "🐻" },
  { name: "Sarah", emoji: "🐼" },
] as const;

function friendLikes(code: string, friendIndex: number, restaurantId: string): boolean {
  return hash(`${code}|${friendIndex}|${restaurantId}`) % 100 < 52;
}

/** Aucun match avant le 4e resto : la démo doit laisser le temps de swiper. */
const FIRST_MATCHABLE = 3;

/**
 * Identifiants des restos que tous les amis simulés aiment (à partir du 4e de la liste).
 * Un match est garanti entre le 4e et le 7e resto pour que la démo aboutisse sans trop attendre.
 */
export function consensusIds(code: string, restaurants: Restaurant[]): Set<string> {
  const ids = new Set<string>();
  restaurants.slice(FIRST_MATCHABLE).forEach((r) => {
    if (DEMO_FRIENDS.every((_, i) => friendLikes(code, i, r.id))) ids.add(r.id);
  });
  const early = restaurants.slice(FIRST_MATCHABLE, FIRST_MATCHABLE + 4);
  if (early.length > 0 && !early.some((r) => ids.has(r.id))) {
    ids.add(early[hash(code) % early.length].id);
  }
  return ids;
}
