"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import { AVATARS } from "@/lib/profile";
import type { Profile } from "@/lib/types";

type Props = { value: Profile; onChange: (profile: Profile) => void; autoFocus?: boolean };

/** Prénom + avatar : ce que les autres voient dans le salon et pendant le swipe. */
export function ProfileFields({ value, onChange, autoFocus }: Props) {
  const nameId = useId();
  return (
    <div className="flex flex-col gap-5 text-left">
      <div className="flex flex-col gap-2">
        <label htmlFor={nameId} className="font-display text-lg font-bold">
          Ton prénom
        </label>
        <input
          id={nameId}
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value.slice(0, 20) })}
          maxLength={20}
          autoComplete="given-name"
          autoFocus={autoFocus}
          placeholder="Léa, Tom, Karim…"
          className="min-h-14 w-full rounded-2xl border-2 border-ink bg-paper px-4 text-xl font-semibold shadow-[0_4px_0_var(--color-ink)] placeholder:font-medium placeholder:text-ink-soft/60"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span id={`${nameId}-avatar`} className="font-display text-lg font-bold">
          Ton avatar
        </span>
        <div role="radiogroup" aria-labelledby={`${nameId}-avatar`} className="flex flex-wrap gap-2.5">
          {AVATARS.map((emoji) => {
            const selected = value.emoji === emoji;
            return (
              <motion.button
                key={emoji}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={`Avatar ${emoji}`}
                onClick={() => onChange({ ...value, emoji })}
                whileTap={{ scale: 0.88 }}
                animate={selected ? { scale: 1.12, rotate: [0, -8, 8, 0] } : { scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
                className={[
                  "grid size-14 place-items-center rounded-2xl border-2 text-3xl",
                  selected
                    ? "border-ink bg-sun shadow-[0_4px_0_var(--color-ink)]"
                    : "border-line bg-paper hover:border-ink-soft",
                ].join(" ")}
              >
                <span aria-hidden>{emoji}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
