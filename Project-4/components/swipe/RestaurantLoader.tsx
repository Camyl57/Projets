"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Button, ButtonLink } from "@/components/ui/Button";
import { buildDemoRestaurants } from "@/lib/restaurants";
import { setRestaurants } from "@/lib/storage";
import type { Group, Restaurant } from "@/lib/types";

type Reason = "no_key" | "upstream" | "empty" | "rate_limited" | "network";

const MESSAGES: Record<Reason, { title: string; text: string }> = {
  no_key: {
    title: "Clé Google Places manquante",
    text: "Le serveur n'a pas de clé GOOGLE_PLACES_API_KEY. Ajoute-la dans le fichier .env.local puis relance l'application (voir le README).",
  },
  upstream: {
    title: "Google ne répond pas",
    text: "La recherche de restos a échoué. Vérifie que « Places API (New) » est activée pour ta clé, puis réessaie.",
  },
  empty: {
    title: "Aucun resto trouvé",
    text: "Rien autour de cette position. Essaie une autre ville, ou passe aux restos d'exemple.",
  },
  rate_limited: {
    title: "Doucement !",
    text: "Trop de recherches d'affilée. Attends une minute puis réessaie.",
  },
  network: {
    title: "Pas de connexion",
    text: "Impossible de joindre le serveur. Vérifie ta connexion puis réessaie.",
  },
};

function reasonFrom(status: number, error: unknown): Reason {
  if (error === "no_key") return "no_key";
  if (error === "empty" || status === 404) return "empty";
  if (status === 429) return "rate_limited";
  return "upstream";
}

/** Récupère les vrais restos du groupe au premier affichage, puis les fige dans le groupe. */
export function RestaurantLoader({ group }: { group: Group }) {
  const { code, budget, cuisines, location } = group;
  const { lat, lng } = location.coords;
  const cuisineKey = cuisines.join(",");
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<Reason | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/restaurants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lng, budget, cuisines: cuisineKey ? cuisineKey.split(",") : [] }),
        });
        const data = (await res.json().catch(() => ({}))) as { restaurants?: unknown[]; error?: unknown };
        if (cancelled) return;
        if (res.ok && Array.isArray(data.restaurants) && data.restaurants.length > 0) {
          setRestaurants(code, data.restaurants as Restaurant[], "google");
        } else {
          setError(reasonFrom(res.status, data.error));
        }
      } catch {
        if (!cancelled) setError("network");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt, code, lat, lng, budget, cuisineKey]);

  const retry = () => {
    setError(null);
    setAttempt((a) => a + 1);
  };

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-8 pt-5">
      <Logo />
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        {error === null ? (
          <div role="status" className="flex flex-col items-center gap-5">
            <div aria-hidden className="flex gap-2 text-5xl">
              {["🍕", "🍣", "🍔"].map((e, i) => (
                <motion.span
                  key={e}
                  animate={{ y: [0, -18, 0] }}
                  transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.15, ease: "easeInOut" }}
                >
                  {e}
                </motion.span>
              ))}
            </div>
            <h1 className="font-display text-2xl font-extrabold">On cherche les meilleurs restos…</h1>
            <p className="text-ink-soft">Autour de {location.label}, selon votre budget et vos envies.</p>
          </div>
        ) : (
          <>
            <span aria-hidden className="text-6xl">
              🍽️
            </span>
            <h1 className="font-display text-2xl font-extrabold">{MESSAGES[error].title}</h1>
            <p role="alert" className="max-w-sm text-ink-soft">
              {MESSAGES[error].text}
            </p>
            <div className="flex w-full max-w-xs flex-col gap-3">
              <Button onClick={retry}>🔄 Réessayer</Button>
              <Button
                variant="secondary"
                onClick={() => setRestaurants(code, buildDemoRestaurants(code, group), "demo")}
              >
                Utiliser des restos d&apos;exemple
              </Button>
              <ButtonLink href={`/groupe/${code}`} variant="ghost" className="!min-h-11 !text-base">
                ← Retour au salon
              </ButtonLink>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
