"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import type { Restaurant } from "@/lib/restaurants";
import { RestaurantCard } from "./RestaurantCard";

/** Direction de sortie : 1 = vers la droite (oui), -1 = vers la gauche (non). */
const exitVariants = {
  exit: (dir: number) => ({
    x: dir * 560,
    rotate: dir * 22,
    opacity: 0,
    transition: { duration: 0.32, ease: "easeIn" as const },
  }),
};

type Props = {
  restaurant: Restaurant;
  /** 0 = carte du dessus (déplaçable), 1 et 2 = cartes dessous. */
  pos: number;
  dir: 1 | -1;
  onVote: (liked: boolean) => void;
};

const SWIPE_THRESHOLD = 110;
/** Déplacement minimal : évite qu'un simple effleurement soit pris pour un swipe. */
const MIN_DISTANCE = 40;

export function SwipeCard({ restaurant, pos, dir, onVote }: Props) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 0, 220], [-14, 0, 14]);
  const yesOpacity = useTransform(x, [30, 130], [0, 1]);
  const noOpacity = useTransform(x, [-130, -30], [1, 0]);
  const isTop = pos === 0;

  return (
    <motion.div
      custom={dir}
      variants={exitVariants}
      exit="exit"
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={(_, info) => {
        // L'élan compte autant que la distance : un petit coup sec suffit.
        const power = info.offset.x + info.velocity.x * 0.25;
        if (Math.abs(info.offset.x) < MIN_DISTANCE) return;
        if (power > SWIPE_THRESHOLD) onVote(true);
        else if (power < -SWIPE_THRESHOLD) onVote(false);
      }}
      initial={{ scale: 0.9, y: 30, opacity: 0 }}
      animate={{ scale: 1 - pos * 0.05, y: pos * 16, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      whileDrag={{ cursor: "grabbing" }}
      style={{ x, rotate: isTop ? rotate : 0, zIndex: 10 - pos, touchAction: "pan-y" }}
      className={`absolute inset-0 ${isTop ? "cursor-grab" : "pointer-events-none"}`}
      aria-hidden={!isTop}
    >
      <RestaurantCard r={restaurant} />
      {isTop ? (
        <>
          <motion.span
            aria-hidden
            style={{ opacity: yesOpacity }}
            className="absolute left-5 top-5 -rotate-12 rounded-xl border-4 border-basil bg-paper/90 px-4 py-1 font-display text-3xl font-extrabold text-basil"
          >
            OUI 😋
          </motion.span>
          <motion.span
            aria-hidden
            style={{ opacity: noOpacity }}
            className="absolute right-5 top-5 rotate-12 rounded-xl border-4 border-tomato bg-paper/90 px-4 py-1 font-display text-3xl font-extrabold text-tomato"
          >
            NON 🙅
          </motion.span>
        </>
      ) : null}
    </motion.div>
  );
}
