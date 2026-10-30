import type { Group, GroupDraft } from "./types";

/**
 * Stockage temporaire des groupes dans le navigateur (localStorage).
 * Il sera remplacé par un vrai serveur (Redis / base de données) pour que
 * plusieurs téléphones puissent rejoindre le même salon : l'unicité du code
 * n'est donc garantie, pour l'instant, que sur cet appareil.
 */
const KEY = "obo:groups";
type Registry = Record<string, Group>;

const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedValue: Registry = {};

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** Renvoie la même référence tant que le contenu n'a pas changé (requis par useSyncExternalStore). */
function registry(): Registry {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedValue = raw ? (JSON.parse(raw) as Registry) : {};
    } catch {
      cachedValue = {};
    }
  }
  return cachedValue;
}

export function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === null) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** `null` = groupe introuvable sur cet appareil. */
export function getGroupSnapshot(code: string): Group | null {
  return registry()[code] ?? null;
}

export function createGroup(draft: GroupDraft): Group {
  const reg = registry();
  let code = "";
  for (let i = 0; i < 200; i++) {
    const candidate = String(Math.floor(1000 + Math.random() * 9000));
    if (!reg[candidate]) {
      code = candidate;
      break;
    }
  }
  if (!code) throw new Error("Aucun code disponible");

  const group: Group = { ...draft, code, createdAt: Date.now() };
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...reg, [code]: group }));
  } catch {
    // Stockage indisponible (navigation privée stricte) : le groupe reste valide pour cette session.
    cachedValue = { ...reg, [code]: group };
  }
  listeners.forEach((l) => l());
  return group;
}

function persist(next: Registry) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Stockage indisponible : on garde au moins l'état en mémoire pour la session.
    cachedValue = next;
  }
  listeners.forEach((l) => l());
}

function updateGroup(code: string, change: (g: Group) => Group) {
  const reg = registry();
  const group = reg[code];
  if (!group) return;
  persist({ ...reg, [code]: change(group) });
}

/** Enregistre ton vote (oui / non) pour un resto. */
export function setVote(code: string, restaurantId: string, liked: boolean) {
  updateGroup(code, (g) => ({ ...g, votes: { ...g.votes, [restaurantId]: liked } }));
}

/** Définit (ou efface avec `null`) le resto sur lequel tout le monde est d'accord. */
export function setMatch(code: string, restaurantId: string | null) {
  updateGroup(code, (g) => ({ ...g, matchId: restaurantId }));
}

/** Efface tes votes et le match pour recommencer le swipe. */
export function resetVotes(code: string) {
  updateGroup(code, (g) => ({ ...g, votes: {}, matchId: null }));
}
