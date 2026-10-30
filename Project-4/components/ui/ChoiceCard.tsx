"use client";

import { motion } from "framer-motion";

type Props = {
  emoji: string;
  title: string;
  hint?: string;
  selected: boolean;
  onSelect: () => void;
  /** `radio` pour un choix unique, `checkbox` pour un choix multiple. */
  role?: "radio" | "checkbox";
  size?: "lg" | "sm";
};

/** Grande carte cliquable avec emoji, utilisée pour le budget et les cuisines. */
export function ChoiceCard({ emoji, title, hint, selected, onSelect, role = "radio", size = "lg" }: Props) {
  const large = size === "lg";
  return (
    <motion.button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={onSelect}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.96 }}
      animate={selected ? { scale: 1.02 } : { scale: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 24 }}
      className={[
        "relative flex w-full flex-col items-center justify-center rounded-3xl border-2 text-center",
        "cursor-pointer select-none transition-colors",
        large ? "gap-1 px-4 py-6" : "gap-0.5 px-2 py-4",
        selected
          ? "border-ink bg-sun shadow-[0_5px_0_var(--color-ink)]"
          : "border-line bg-paper shadow-[0_5px_0_var(--color-line)] hover:border-ink-soft",
      ].join(" ")}
    >
      <span aria-hidden className={large ? "text-5xl" : "text-3xl"}>
        {emoji}
      </span>
      <span className={`font-display font-bold ${large ? "text-xl" : "text-base"}`}>{title}</span>
      {hint ? <span className="text-sm text-ink-soft">{hint}</span> : null}
      {selected ? (
        <motion.span
          aria-hidden
          initial={{ scale: 0, rotate: -40 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute right-3 top-3 grid size-6 place-items-center rounded-full bg-ink text-xs text-paper"
        >
          ✓
        </motion.span>
      ) : null}
    </motion.button>
  );
}
