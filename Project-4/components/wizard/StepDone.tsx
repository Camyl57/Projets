"use client";

import { motion } from "framer-motion";
import { CodeDigits } from "@/components/CodeDigits";
import { GroupSummary } from "@/components/GroupSummary";
import { ShareCode } from "@/components/ShareCode";
import { ButtonLink } from "@/components/ui/Button";
import type { Group } from "@/lib/types";

/** Confettis alimentaires : positions fixes pour rester identiques côté serveur et client. */
const CONFETTI = [
  { e: "🍕", x: "8%", d: 0, r: 20 },
  { e: "🍔", x: "20%", d: 0.15, r: -30 },
  { e: "🍣", x: "33%", d: 0.05, r: 45 },
  { e: "🌮", x: "46%", d: 0.25, r: -15 },
  { e: "🥖", x: "58%", d: 0.1, r: 60 },
  { e: "🍝", x: "70%", d: 0.3, r: -50 },
  { e: "🍰", x: "82%", d: 0.08, r: 25 },
  { e: "🥗", x: "92%", d: 0.2, r: -35 },
];

export function StepDone({ group }: { group: Group }) {
  return (
    <div className="relative flex flex-col items-center gap-7 text-center">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-6 h-72 overflow-hidden">
        {CONFETTI.map((c) => (
          <motion.span
            key={c.x}
            initial={{ y: -40, opacity: 0, rotate: 0 }}
            animate={{ y: 260, opacity: [0, 1, 1, 0], rotate: c.r }}
            transition={{ duration: 2.4, delay: c.d, ease: "easeIn" }}
            style={{ left: c.x }}
            className="absolute text-3xl"
          >
            {c.e}
          </motion.span>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-display text-lg font-bold text-ink-soft">Ton groupe est prêt 🎉</p>
        <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Donne ce code à tes potes</h2>
      </div>

      <CodeDigits code={group.code} />

      <GroupSummary group={group} />

      <ShareCode code={group.code} />

      <ButtonLink href={`/groupe/${group.code}`} big className="w-full sm:w-auto">
        Ouvrir le salon →
      </ButtonLink>
    </div>
  );
}
