"use client";

import { motion } from "framer-motion";

/** Affiche le code à 4 chiffres, chaque chiffre « tombe » dans sa case. */
export function CodeDigits({ code, animate = true }: { code: string; animate?: boolean }) {
  return (
    <div role="img" aria-label={`Code du groupe : ${code.split("").join(" ")}`} className="flex justify-center gap-3">
      {code.split("").map((digit, i) => (
        <motion.span
          key={i}
          aria-hidden
          initial={animate ? { y: -60, opacity: 0, rotate: -12, scale: 0.6 } : false}
          animate={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 17, delay: animate ? 0.25 + i * 0.12 : 0 }}
          className="grid h-24 w-[4.25rem] place-items-center rounded-2xl border-2 border-ink bg-paper font-display text-6xl font-extrabold shadow-[0_6px_0_var(--color-ink)] sm:h-28 sm:w-20 sm:text-7xl"
        >
          {digit}
        </motion.span>
      ))}
    </div>
  );
}
