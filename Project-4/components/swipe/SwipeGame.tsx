"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { GroupNotFound, LobbySkeleton, useGroup } from "@/components/GroupLobby";
import { Logo } from "@/components/Logo";
import { Button, ButtonLink } from "@/components/ui/Button";
import { consensusIds, DEMO_FRIENDS } from "@/lib/friends";
import { resetVotes, setMatch, setVote } from "@/lib/storage";
import type { Group, Restaurant, RestaurantSource } from "@/lib/types";
import { MatchScreen } from "./MatchScreen";
import { RestaurantLoader } from "./RestaurantLoader";
import { SwipeCard } from "./SwipeCard";

export function SwipeGame({ code }: { code: string }) {
  const group = useGroup(code);
  if (group === undefined) return <LobbySkeleton />;
  if (group === null) return <GroupNotFound code={code} />;
  if (!group.restaurants?.length) return <RestaurantLoader group={group} />;
  return <Deck group={group} restaurants={group.restaurants} source={group.restaurantsSource ?? "demo"} />;
}

function Deck({ group, restaurants, source }: { group: Group; restaurants: Restaurant[]; source: RestaurantSource }) {
  const { code } = group;
  const [dir, setDir] = useState<1 | -1>(1);

  const consensus = useMemo(() => consensusIds(code, restaurants), [code, restaurants]);

  const votes = group.votes ?? {};
  const remaining = restaurants.filter((r) => votes[r.id] === undefined);
  const current = remaining[0];
  const done = restaurants.length - remaining.length;
  const match = group.matchId ? restaurants.find((r) => r.id === group.matchId) : undefined;

  const vote = (liked: boolean) => {
    if (!current || match) return;
    setDir(liked ? 1 : -1);
    setVote(code, current.id, liked);
    if (liked && consensus.has(current.id)) setMatch(code, current.id);
  };

  // Raccourcis clavier : ← non, → oui. La référence garde toujours la dernière version de `vote`.
  const voteRef = useRef(vote);
  useEffect(() => {
    voteRef.current = vote;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") voteRef.current(true);
      if (e.key === "ArrowLeft") voteRef.current(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-6 pt-4">
      <header className="flex items-center justify-between gap-3">
        <Logo />
        <Link
          href={`/groupe/${code}`}
          className="rounded-full px-3 py-1.5 text-sm font-bold text-ink-soft hover:bg-ink/5"
        >
          ← Salon {code}
        </Link>
      </header>

      <div className="mt-4 flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm font-bold">
          <span aria-live="polite">
            Resto {Math.min(done + 1, restaurants.length)} sur {restaurants.length}
          </span>
          <span className="rounded-full bg-sun px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wide ring-2 ring-ink">
            Mode démo
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-line" aria-hidden>
          <motion.div
            className="h-full rounded-full bg-tomato"
            initial={false}
            animate={{ width: `${(done / restaurants.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 26 }}
          />
        </div>
        <p className="text-xs font-semibold text-ink-soft">
          {source === "google" ? "🌍 Restos réels autour de toi · données Google Maps" : "🧪 Restos d'exemple (fictifs)"}
        </p>
        <p className="flex items-center gap-2 text-sm text-ink-soft">
          <span aria-hidden className="flex -space-x-1.5">
            {DEMO_FRIENDS.map((f) => (
              <span key={f.name} className="grid size-7 place-items-center rounded-full bg-paper text-base ring-2 ring-cream">
                {f.emoji}
              </span>
            ))}
          </span>
          {DEMO_FRIENDS.map((f) => f.name).join(", ")} swipent avec toi (simulés).
        </p>
      </div>

      <div className="relative mt-5 min-h-[30rem] flex-1">
        <AnimatePresence custom={dir}>
          {remaining
            .slice(0, 3)
            .map((r, pos) => ({ r, pos }))
            .reverse()
            .map(({ r, pos }) => (
              <SwipeCard key={r.id} restaurant={r} pos={pos} dir={dir} onVote={vote} />
            ))}
        </AnimatePresence>

        {remaining.length === 0 && !match ? (
          <motion.section
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-[2rem] border-2 border-dashed border-ink-soft p-6 text-center"
          >
            <span aria-hidden className="text-6xl">
              🍽️
            </span>
            <h2 className="font-display text-2xl font-extrabold">Plus de restos autour de toi</h2>
            <p className="text-ink-soft">Aucun match cette fois. Recommence, ou change les critères du groupe.</p>
            <div className="flex w-full flex-col gap-3">
              <Button onClick={() => resetVotes(code)}>🔄 Recommencer</Button>
              <ButtonLink href="/creer" variant="secondary">
                Nouveau groupe
              </ButtonLink>
            </div>
          </motion.section>
        ) : null}
      </div>

      <div className="mt-6 flex items-center justify-center gap-8">
        <motion.button
          type="button"
          onClick={() => vote(false)}
          disabled={!current || !!match}
          whileHover={{ y: -3, scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Non, pas ce resto"
          className="grid size-20 place-items-center rounded-full border-2 border-ink bg-paper text-4xl shadow-[0_5px_0_var(--color-ink)] disabled:opacity-40"
        >
          <span aria-hidden>❌</span>
        </motion.button>
        <motion.button
          type="button"
          onClick={() => vote(true)}
          disabled={!current || !!match}
          whileHover={{ y: -3, scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Oui, ce resto me tente"
          className="grid size-24 place-items-center rounded-full border-2 border-ink bg-basil text-5xl shadow-[0_5px_0_var(--color-ink)] disabled:opacity-40"
        >
          <span aria-hidden>😋</span>
        </motion.button>
      </div>
      <p className="mt-4 hidden text-center text-sm text-ink-soft sm:block">
        Glisse la carte, ou utilise les flèches ← → du clavier.
      </p>

      <AnimatePresence>
        {match ? (
          <MatchScreen
            key={match.id}
            restaurant={match}
            onContinue={() => setMatch(code, null)}
            onRestart={() => resetVotes(code)}
          />
        ) : null}
      </AnimatePresence>
    </main>
  );
}
