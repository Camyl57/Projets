"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button, ButtonLink } from "@/components/ui/Button";
import { DEMO_FRIENDS } from "@/lib/friends";
import { mapsUrl } from "@/lib/restaurants";
import type { Restaurant } from "@/lib/types";
import { RestaurantCard } from "./RestaurantCard";

/** Confettis alimentaires : positions fixes (rendu identique serveur / client). */
const CONFETTI = [
  { e: "🎉", x: "6%", d: 0 },
  { e: "🍕", x: "18%", d: 0.12 },
  { e: "✨", x: "30%", d: 0.04 },
  { e: "🍔", x: "42%", d: 0.22 },
  { e: "🎊", x: "54%", d: 0.08 },
  { e: "🍣", x: "66%", d: 0.3 },
  { e: "✨", x: "78%", d: 0.16 },
  { e: "🌮", x: "90%", d: 0.02 },
];

type Props = {
  restaurant: Restaurant;
  onContinue: () => void;
  onRestart: () => void;
};

export function MatchScreen({ restaurant, onContinue, onRestart }: Props) {
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    dialog.current?.focus({ preventScroll: true });
  }, []);

  return (
    <motion.div
      ref={dialog}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-ink/75 p-5 outline-none backdrop-blur-sm"
    >
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 h-full overflow-hidden">
        {CONFETTI.map((c, i) => (
          <motion.span
            key={i}
            initial={{ y: -60, opacity: 0, rotate: 0 }}
            animate={{ y: "105vh", opacity: [0, 1, 1, 0], rotate: i % 2 ? 200 : -200 }}
            transition={{ duration: 3.2, delay: c.d, ease: "easeIn" }}
            style={{ left: c.x }}
            className="absolute text-4xl"
          >
            {c.e}
          </motion.span>
        ))}
      </div>

      <div className="mx-auto flex min-h-full w-full max-w-sm items-center py-6">
        <motion.div
          initial={{ scale: 0.6, rotate: -6, y: 60, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 240, damping: 17 }}
          className="relative flex w-full flex-col gap-5 rounded-[2rem] bg-cream p-5 text-center"
        >
          <div>
            <motion.p
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ repeat: Infinity, duration: 1.4 }}
              className="text-5xl"
              aria-hidden
            >
              🎉
            </motion.p>
            <h2 id="match-title" className="font-display text-4xl font-extrabold text-tomato">
              C&apos;est un match !
            </h2>
            <p className="mt-1 text-ink-soft">Tout le monde est d&apos;accord pour ce resto.</p>
          </div>

          <div className="h-80">
            <RestaurantCard r={restaurant} compact />
          </div>

          <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm font-bold">
            <span className="rounded-full bg-sun px-2.5 py-1">🙋 Toi</span>
            {DEMO_FRIENDS.map((f) => (
              <span key={f.name} className="rounded-full bg-sun px-2.5 py-1">
                {f.emoji} {f.name}
              </span>
            ))}
            <span className="w-full text-xs font-medium text-ink-soft">ont tous dit oui (démo)</span>
          </p>

          {restaurant.phone || restaurant.website ? (
            <p className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm font-bold">
              {restaurant.phone ? (
                <a href={`tel:${restaurant.phone.replace(/\s/g, "")}`} className="underline underline-offset-4">
                  📞 {restaurant.phone}
                </a>
              ) : null}
              {restaurant.website ? (
                <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                  🌐 Site web
                </a>
              ) : null}
            </p>
          ) : null}

          <div className="flex flex-col gap-3">
            <ButtonLink href={mapsUrl(restaurant)} external big className="!min-h-16 w-full !text-xl">
              🧭 On y va !
            </ButtonLink>
            <Button variant="secondary" onClick={onContinue}>
              Continuer à swiper
            </Button>
            <Button variant="ghost" onClick={onRestart} className="!min-h-11 !text-base">
              Recommencer à zéro
            </Button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
