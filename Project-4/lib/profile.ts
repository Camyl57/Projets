"use client";

import { useSyncExternalStore } from "react";
import type { Profile } from "./types";

export const AVATARS = ["🦊", "🐻", "🐼", "🐸", "🦁", "🐵", "🐙", "🦄", "🐧", "🐯"];

const KEY = "obo:profile";
const EMPTY: Profile = { name: "", emoji: AVATARS[0] };
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cached: Profile = EMPTY;

function read(): Profile {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    // Stockage indisponible : on reste sur le profil vide.
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      const p = raw ? (JSON.parse(raw) as Partial<Profile>) : null;
      cached = p && typeof p.name === "string" && typeof p.emoji === "string" ? { name: p.name, emoji: p.emoji } : EMPTY;
    } catch {
      cached = EMPTY;
    }
  }
  return cached;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function saveProfile(profile: Profile) {
  const clean = { name: profile.name.trim().slice(0, 20), emoji: profile.emoji };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(clean));
  } catch {
    cachedRaw = undefined;
    cached = clean;
  }
  listeners.forEach((l) => l());
}

/** Profil enregistré sur cet appareil (vide côté serveur et à la première visite). */
export function useProfile(): Profile {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
