import { ensureUser, RemoteError, supabase } from "./supabase/client";
import type { GroupDraft, Profile, Restaurant, RestaurantSource } from "./types";

/** Appelle une fonction SQL du schéma (supabase/schema.sql) en tant qu'utilisateur anonyme connecté. */
async function rpc<T = void>(fn: string, args: Record<string, unknown>): Promise<T> {
  await ensureUser();
  const { data, error } = await supabase().rpc(fn, args);
  if (error) {
    // Les erreurs métier de la base sont de simples mots (`group_full`…) ; le reste est un problème réseau ou de config.
    const known = /^[a-z_]+$/.test(error.message);
    throw new RemoteError(known ? error.message : "network", known ? undefined : error.message);
  }
  return data as T;
}

/** Crée le groupe, inscrit l'hôte et renvoie le code à 4 chiffres. */
export function createGroupRemote(draft: GroupDraft, profile: Profile): Promise<string> {
  return rpc<string>("create_group", {
    p_location: draft.location,
    p_budget: draft.budget,
    p_cuisines: draft.cuisines,
    p_name: profile.name,
    p_emoji: profile.emoji,
  });
}

export function joinGroupRemote(code: string, profile: Profile): Promise<string> {
  return rpc<string>("join_group", { p_code: code, p_name: profile.name, p_emoji: profile.emoji });
}

export function setRestaurantsRemote(code: string, restaurants: Restaurant[], source: RestaurantSource) {
  return rpc("set_restaurants", { p_code: code, p_restaurants: restaurants, p_source: source });
}

export function startSwipingRemote(code: string) {
  return rpc("start_swiping", { p_code: code });
}

export function castVoteRemote(code: string, restaurantId: string, liked: boolean) {
  return rpc("cast_vote", { p_code: code, p_restaurant_id: restaurantId, p_liked: liked });
}

export function resetGroupRemote(code: string) {
  return rpc("reset_group", { p_code: code });
}
