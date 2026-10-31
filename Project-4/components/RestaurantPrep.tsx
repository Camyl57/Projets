"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { setRestaurantsRemote } from "@/lib/remote";
import { buildDemoRestaurants } from "@/lib/restaurants";
import { explain } from "@/lib/supabase/client";
import type { Group, Restaurant } from "@/lib/types";

type Reason = "no_key" | "upstream" | "empty" | "rate_limited" | "network";

const MESSAGES: Record<Reason, { title: string; text: string }> = {
  no_key: {
    title: "Clé Google Places manquante",
    text: "Ajoute GOOGLE_PLACES_API_KEY dans .env.local puis relance l'application (voir le README).",
  },
  upstream: {
    title: "Google ne répond pas",
    text: "Vérifie que « Places API (New) » est activée pour ta clé, puis réessaie.",
  },
  empty: { title: "Aucun resto trouvé", text: "Rien autour de cette position. Passe aux restos d'exemple ?" },
  rate_limited: { title: "Doucement !", text: "Trop de recherches d'affilée. Attends une minute puis réessaie." },
  network: { title: "Pas de connexion", text: "Impossible de joindre le serveur. Réessaie." },
};

function reasonFrom(status: number, error: unknown): Reason {
  if (error === "no_key") return "no_key";
  if (error === "empty" || status === 404) return "empty";
  if (status === 429) return "rate_limited";
  return "upstream";
}

/**
 * Réservé à l'hôte : cherche les vrais restos du groupe puis les enregistre pour tout le monde.
 * Si la recherche échoue, il peut réessayer ou passer à des restos d'exemple.
 */
export function RestaurantPrep({ group, onReady }: { group: Group; onReady: () => void }) {
  const { code, budget, cuisines, location } = group;
  const { lat, lng } = location.coords;
  const cuisineKey = cuisines.join(",");
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<{ title: string; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/restaurants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lng, budget, cuisines: cuisineKey ? cuisineKey.split(",") : [] }),
        });
        const data = (await res.json().catch(() => ({}))) as { restaurants?: Restaurant[]; error?: unknown };
        if (cancelled) return;
        if (res.ok && Array.isArray(data.restaurants) && data.restaurants.length > 0) {
          await setRestaurantsRemote(code, data.restaurants, "google");
          if (!cancelled) onReady();
        } else {
          setError(MESSAGES[reasonFrom(res.status, data.error)]);
        }
      } catch (e) {
        if (!cancelled) setError({ title: "Enregistrement impossible", text: explain(e) });
      }
    })();
    return () => {
      cancelled = true;
    };
    // `onReady` change à chaque rendu du parent : on ne relance pas la recherche pour autant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, code, lat, lng, budget, cuisineKey]);

  const useDemo = async () => {
    try {
      await setRestaurantsRemote(code, buildDemoRestaurants(code, group), "demo");
      onReady();
    } catch (e) {
      setError({ title: "Enregistrement impossible", text: explain(e) });
    }
  };

  if (error === null) {
    return (
      <div role="status" className="flex flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-ink-soft p-5 text-center">
        <div aria-hidden className="flex gap-2 text-3xl">
          {["🍕", "🍣", "🍔"].map((e, i) => (
            <motion.span
              key={e}
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.15, ease: "easeInOut" }}
            >
              {e}
            </motion.span>
          ))}
        </div>
        <p className="font-display text-lg font-bold">On cherche les meilleurs restos…</p>
        <p className="text-sm text-ink-soft">Autour de {location.label}, selon votre budget et vos envies.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-3xl border-2 border-ink bg-sun/30 p-5 text-center">
      <p className="font-display text-lg font-bold">{error.title}</p>
      <p role="alert" className="text-sm text-ink-soft">
        {error.text}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button
          onClick={() => {
            setError(null);
            setAttempt((a) => a + 1);
          }}
          className="!min-h-12 !text-base"
        >
          🔄 Réessayer
        </Button>
        <Button variant="secondary" onClick={useDemo} className="!min-h-12 !text-base">
          Restos d&apos;exemple
        </Button>
      </div>
    </div>
  );
}
