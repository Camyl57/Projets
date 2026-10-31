import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase côté navigateur. La clé « anon » / « publishable » est faite pour être publique :
 * c'est le schéma SQL (règles RLS + fonctions) qui protège les données, pas le secret de la clé.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && key);

/** Erreur lisible : `code` correspond à un message de la base (`group_full`…) ou à un cas côté client. */
export class RemoteError extends Error {
  constructor(
    readonly code: string,
    detail?: string,
  ) {
    super(detail ? `${code}: ${detail}` : code);
  }
}

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!url || !key) throw new RemoteError("not_configured");
  client ??= createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } });
  return client;
}

let session: Promise<string> | null = null;

/** Identifiant anonyme de cet appareil : créé au premier usage puis conservé par le navigateur. */
export function ensureUser(): Promise<string> {
  session ??= (async () => {
    const sb = supabase();
    const { data } = await sb.auth.getSession();
    if (data.session?.user) return data.session.user.id;
    const { data: created, error } = await sb.auth.signInAnonymously();
    if (error || !created.user) throw new RemoteError("auth_failed", error?.message);
    return created.user.id;
  })().catch((e) => {
    session = null; // permet de réessayer plus tard
    throw e;
  });
  return session;
}

const MESSAGES: Record<string, string> = {
  not_configured: "Supabase n'est pas configuré sur ce serveur.",
  auth_failed: "Impossible de te connecter. Vérifie que les connexions anonymes sont activées dans Supabase.",
  group_not_found: "Aucun groupe avec ce code (ou il a expiré).",
  already_started: "Ce groupe a déjà lancé le swipe : on ne peut plus le rejoindre.",
  group_full: "Ce groupe est complet (12 personnes maximum).",
  too_many_groups: "Tu as déjà 5 groupes en cours. Attends qu'ils expirent.",
  bad_name: "Choisis un prénom de 1 à 20 caractères.",
  not_host: "Seul le créateur du groupe peut faire ça.",
  not_a_member: "Tu ne fais pas partie de ce groupe.",
  no_restaurants: "La liste des restos n'est pas encore prête.",
  not_started: "Le swipe n'a pas encore été lancé.",
  network: "Pas de connexion. Réessaie dans un instant.",
};

export function explain(error: unknown): string {
  if (error instanceof RemoteError) return MESSAGES[error.code] ?? "Une erreur est survenue. Réessaie.";
  return MESSAGES.network;
}
