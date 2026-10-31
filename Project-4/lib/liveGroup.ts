"use client";

import { useSyncExternalStore } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { castVoteRemote } from "./remote";
import { ensureUser, RemoteError, supabase } from "./supabase/client";
import type { BudgetId, Group, GroupLocation, Member, Restaurant, RestaurantSource } from "./types";

export type LiveState =
  | { status: "loading" }
  | { status: "notfound" }
  | { status: "error"; code: string }
  | {
      status: "ready";
      group: Group;
      members: Member[];
      /** Tes votes : identifiant du resto → oui / non (inclut ceux en cours d'envoi). */
      myVotes: Record<string, boolean>;
      me: Member | undefined;
    };

const LOADING: LiveState = { status: "loading" };
const POLL_MS = 5000;
const REFRESH_DEBOUNCE_MS = 120;

type GroupRow = {
  code: string;
  host_id: string;
  location: GroupLocation;
  budget: BudgetId;
  cuisines: string[];
  restaurants: Restaurant[] | null;
  restaurants_source: RestaurantSource | null;
  status: "lobby" | "swiping";
  match_id: string | null;
};

type MemberRow = {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  is_host: boolean;
  voted_count: number;
};

/** Un seul store par code de groupe, partagé par tous les composants de la page. */
const registry = new Map<string, LiveGroup>();

/**
 * Suit un groupe en direct : lecture initiale, puis nouvelle lecture à chaque changement reçu
 * en temps réel (groupe ou membres). Une relecture régulière sert de filet de sécurité si la
 * connexion temps réel est bloquée (réseau d'entreprise, mise en veille du téléphone…).
 */
class LiveGroup {
  state: LiveState = LOADING;
  private listeners = new Set<() => void>();
  private subscribers = 0;
  private started = false;
  private channel: RealtimeChannel | null = null;
  private poll: ReturnType<typeof setInterval> | null = null;
  private debounce: ReturnType<typeof setTimeout> | null = null;
  private stopTimer: ReturnType<typeof setTimeout> | null = null;
  private busy = false;
  private again = false;
  private userId = "";
  private serverVotes: Record<string, boolean> = {};
  private pending: Record<string, boolean> = {};

  constructor(private readonly code: string) {}

  getSnapshot = () => this.state;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    this.subscribers++;
    registry.set(this.code, this); // au cas où le store aurait été retiré puis réutilisé
    if (this.stopTimer) {
      clearTimeout(this.stopTimer);
      this.stopTimer = null;
    }
    if (!this.started) void this.start();
    return () => {
      this.listeners.delete(listener);
      this.subscribers--;
      // Petit délai : en développement React monte, démonte puis remonte aussitôt le composant.
      if (this.subscribers === 0) this.stopTimer = setTimeout(() => this.stop(), 1500);
    };
  };

  private set(state: LiveState) {
    this.state = state;
    this.listeners.forEach((l) => l());
  }

  private async start() {
    this.started = true;
    try {
      this.userId = await ensureUser();
    } catch (e) {
      this.set({ status: "error", code: e instanceof RemoteError ? e.code : "network" });
      this.started = false; // permettra de retenter à la prochaine souscription
      return;
    }
    await this.refresh();
    if (!this.started) return;

    const sb = supabase();
    this.channel = sb
      .channel(`group-${this.code}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "groups", filter: `code=eq.${this.code}` }, () => this.queueRefresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "members", filter: `group_code=eq.${this.code}` }, () => this.queueRefresh())
      .subscribe();
    this.poll = setInterval(() => {
      if (document.visibilityState === "visible") void this.refresh();
    }, POLL_MS);
  }

  private stop() {
    this.started = false;
    if (this.poll) clearInterval(this.poll);
    if (this.debounce) clearTimeout(this.debounce);
    if (this.channel) void supabase().removeChannel(this.channel);
    this.channel = this.poll = this.debounce = null;
    registry.delete(this.code);
  }

  private queueRefresh() {
    if (this.debounce) clearTimeout(this.debounce);
    this.debounce = setTimeout(() => void this.refresh(), REFRESH_DEBOUNCE_MS);
  }

  /** Relit le groupe, les membres et mes votes. Les relectures qui se chevauchent sont regroupées. */
  async refresh(): Promise<void> {
    if (this.busy) {
      this.again = true;
      return;
    }
    this.busy = true;
    try {
      const sb = supabase();
      const [g, m, v] = await Promise.all([
        sb.from("groups").select("*").eq("code", this.code).maybeSingle(),
        sb.from("members").select("*").eq("group_code", this.code).order("joined_at"),
        sb.from("votes").select("restaurant_id, liked").eq("group_code", this.code),
      ]);
      if (g.error) throw g.error;
      if (m.error) throw m.error;
      if (v.error) throw v.error;

      if (!g.data) {
        this.set({ status: "notfound" });
        return;
      }
      const row = g.data as GroupRow;
      const members: Member[] = (m.data as MemberRow[]).map((r) => ({
        id: r.id,
        userId: r.user_id,
        name: r.name,
        emoji: r.emoji,
        isHost: r.is_host,
        votedCount: r.voted_count,
      }));
      this.serverVotes = Object.fromEntries((v.data ?? []).map((x) => [x.restaurant_id as string, x.liked as boolean]));

      this.set({
        status: "ready",
        group: {
          code: row.code,
          hostId: row.host_id,
          location: row.location,
          budget: row.budget,
          cuisines: row.cuisines,
          restaurants: row.restaurants,
          restaurantsSource: row.restaurants_source,
          status: row.status,
          matchId: row.match_id,
        },
        members,
        myVotes: { ...this.serverVotes, ...this.pending },
        me: members.find((x) => x.userId === this.userId),
      });
    } catch {
      // Un raté réseau ponctuel ne doit pas effacer l'écran : on garde le dernier état connu.
      if (this.state.status === "loading") this.set({ status: "error", code: "network" });
    } finally {
      this.busy = false;
      if (this.again) {
        this.again = false;
        void this.refresh();
      }
    }
  }

  /** Vote tout de suite à l'écran, puis envoie au serveur (annule l'affichage en cas d'échec). */
  async vote(restaurantId: string, liked: boolean) {
    this.pending[restaurantId] = liked;
    this.patchVotes();
    try {
      await castVoteRemote(this.code, restaurantId, liked);
      this.serverVotes[restaurantId] = liked;
      delete this.pending[restaurantId];
      this.patchVotes();
    } catch (e) {
      delete this.pending[restaurantId];
      this.patchVotes();
      throw e;
    }
    void this.refresh();
  }

  private patchVotes() {
    if (this.state.status === "ready") {
      this.set({ ...this.state, myVotes: { ...this.serverVotes, ...this.pending } });
    }
  }
}

export function liveGroup(code: string): LiveGroup {
  let store = registry.get(code);
  if (!store) {
    store = new LiveGroup(code);
    registry.set(code, store);
  }
  return store;
}

/** État en direct d'un groupe + le store (pour voter, relire…). */
export function useLiveGroup(code: string) {
  const store = liveGroup(code);
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, () => LOADING);
  return { state, store };
}
