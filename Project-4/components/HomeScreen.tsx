"use client";

import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { APP_TAGLINE } from "@/lib/brand";

/** Emojis décoratifs : positions fixes, mouvement lent et décalé. */
const FLOATERS = [
  { e: "🍕", top: "8%", left: "6%", size: "text-5xl", d: 0, dur: 6 },
  { e: "🍔", top: "14%", left: "84%", size: "text-6xl", d: 0.6, dur: 7 },
  { e: "🍣", top: "46%", left: "3%", size: "text-4xl", d: 1.1, dur: 5.5 },
  { e: "🌮", top: "58%", left: "90%", size: "text-5xl", d: 0.3, dur: 6.5 },
  { e: "🍜", top: "80%", left: "10%", size: "text-5xl", d: 0.9, dur: 7.5 },
  { e: "🥐", top: "88%", left: "78%", size: "text-4xl", d: 1.4, dur: 6 },
];

const STEPS = [
  { n: "1", emoji: "📍", title: "Crée le groupe", text: "Position, budget, envies : 3 questions et c'est parti." },
  { n: "2", emoji: "🔢", title: "Partage le code", text: "Un code à 4 chiffres à envoyer à tes potes." },
  { n: "3", emoji: "👉", title: "Swipez, ça match", text: "Droite = oui, gauche = non. Le premier resto validé par tous gagne." },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } } };
const item = {
  hidden: { y: 28, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 260, damping: 22 } },
};

export function HomeScreen() {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      {FLOATERS.map((f) => (
        <motion.span
          key={f.e}
          aria-hidden
          style={{ top: f.top, left: f.left }}
          className={`pointer-events-none absolute select-none opacity-80 ${f.size}`}
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0, y: [0, -14, 0] }}
          transition={{
            scale: { type: "spring", delay: f.d, stiffness: 200, damping: 12 },
            rotate: { type: "spring", delay: f.d },
            y: { repeat: Infinity, duration: f.dur, ease: "easeInOut", delay: f.d },
          }}
        >
          {f.e}
        </motion.span>
      ))}

      <motion.main
        variants={container}
        initial="hidden"
        animate="show"
        className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-5 pb-12 pt-5"
      >
        <motion.header variants={item} className="self-start">
          <Logo />
        </motion.header>

        <section className="flex flex-1 flex-col items-center justify-center gap-6 py-10 text-center">
          <motion.p
            variants={item}
            className="rounded-full bg-sun px-4 py-1.5 text-sm font-extrabold uppercase tracking-wide shadow-[0_3px_0_var(--color-ink)] ring-2 ring-ink"
          >
            Le Tinder des restos entre amis
          </motion.p>

          <motion.h1
            variants={item}
            className="font-display text-6xl font-extrabold leading-[0.95] tracking-tight sm:text-8xl"
          >
            On bouffe
            <br />
            <span className="relative inline-block text-tomato">
              où ?
              <motion.svg
                aria-hidden
                viewBox="0 0 200 14"
                className="absolute -bottom-2 left-0 w-full"
                fill="none"
              >
                <motion.path
                  d="M3 9 C 40 2, 70 14, 110 7 S 170 3, 197 8"
                  stroke="var(--color-sun)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.9, duration: 0.8, ease: "easeOut" }}
                />
              </motion.svg>
            </span>
          </motion.h1>

          <motion.p variants={item} className="max-w-md text-lg text-ink-soft">
            {APP_TAGLINE}
          </motion.p>

          <motion.div variants={item} className="mt-2 flex w-full max-w-md flex-col gap-4">
            <ButtonLink href="/creer" big>
              <span aria-hidden className="text-4xl">
                🍽️
              </span>
              Créer un groupe
            </ButtonLink>
            <ButtonLink href="/rejoindre" big variant="secondary">
              <span aria-hidden className="text-4xl">
                🔑
              </span>
              <span className="flex flex-col items-start leading-tight">
                Rejoindre
                <span className="text-sm font-semibold text-ink-soft">Code à 4 chiffres</span>
              </span>
            </ButtonLink>
          </motion.div>
        </section>

        <motion.section variants={item} aria-labelledby="how" className="w-full">
          <h2 id="how" className="mb-4 text-center font-display text-2xl font-extrabold">
            Comment ça marche ?
          </h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            {STEPS.map((s) => (
              <motion.li
                key={s.n}
                whileHover={{ y: -4, rotate: -0.8 }}
                className="flex flex-col gap-1 rounded-3xl border-2 border-line bg-paper p-5 shadow-[0_5px_0_var(--color-line)]"
              >
                <span aria-hidden className="text-3xl">
                  {s.emoji}
                </span>
                <h3 className="font-display text-lg font-bold">
                  <span className="mr-1.5 text-tomato">{s.n}.</span>
                  {s.title}
                </h3>
                <p className="text-sm text-ink-soft">{s.text}</p>
              </motion.li>
            ))}
          </ol>
        </motion.section>
      </motion.main>
    </div>
  );
}
