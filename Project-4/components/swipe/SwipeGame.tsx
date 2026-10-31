"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LobbySkeleton } from "@/components/GroupLobby";
import { Logo } from "@/components/Logo";
import { SetupNotice } from "@/components/SetupNotice";
import { Button } from "@/components/ui/Button";
import { type LiveState, useLiveGroup, liveGroup } from "@/lib/liveGroup";
import { resetGroupRemote } from "@/lib/remote";
import { explain, isSupabaseConfigured, RemoteError } from "@/lib/supabase/client";
import type { Group, Member, Restaurant } from "@/lib/types";
import { MatchScreen } from "./MatchScreen";
import { SwipeCard } from "./SwipeCard";

type Store = ReturnType<typeof liveGroup>;
type Ready = Extract<LiveState, { status: "ready" }>;

export function SwipeGame({ code }: { code: string }) {
  if (!isSupabaseConfigured) return <SetupNotice />;
  return <Game code={code} />;
}

function seenKey(code: string) {
  return `obo:seen-match:${code}`;
}

function Game({ code }: { code: string }) {
  const router = useRouter();
  const { state, store } = useLiveGroup(code);

  const ready = state.status === "ready" ? state : null;
  const playable = ready !== null && ready.group.status === "swiping" && ready.group.restaurants !== null;
  const mustLeave = state.status === "notfound" || (ready !== null && !playable);

  // Pas de swipe sans groupe lancé : on renvoie au salon (qui sait aussi faire rejoindre).
  useEffect(() => {
    if (mustLeave) router.replace(`/groupe/${code}`);
  }, [mustLeave, code, router]);

  if (state.status === "error") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-8 pt-5">
        <Logo />
        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <span aria-hidden className="text-6xl">
            📡
          </span>
          <h1 className="font-display text-2xl font-extrabold">Connexion impossible</h1>
          <p role="alert" className="text-ink-soft">
            {explain(new RemoteError(state.code))}
          </p>
          <Button onClick={() => window.location.reload()}>🔄 Réessayer</Button>
        </div>
      </main>
    );
  }
  if (!ready || !playable) return <LobbySkeleton />;
  return <Deck key={code} code={code} ready={ready} store={store} />;
}

function Deck({ code, ready, store }: { code: string; ready: Ready; store: Store }) {
  const { members, me, myVotes } = ready;
  const group: Group = ready.group;
  const restaurants: Restaurant[] = group.restaurants ?? [];
  const isHost = me?.isHost ?? false;

  const [dir, setDir] = useState<1 | -1>(1);
  const [error, setError] = useState<string | null>(null);
  // Le match déjà vu sur cet appareil : on ne remontre pas l'écran à chaque rechargement.
  const [dismissed, setDismissed] = useState<string | null>(() => {
    try {
      return window.sessionStorage.getItem(seenKey(code));
    } catch {
      return null;
    }
  });

  const remaining = restaurants.filter((r) => myVotes[r.id] === undefined);
  const current = remaining[0];
  const done = restaurants.length - remaining.length;
  const match = group.matchId ? restaurants.find((r) => r.id === group.matchId) : undefined;
  const showMatch = match !== undefined && group.matchId !== dismissed;

  const vote = (liked: boolean) => {
    if (!current || showMatch) return;
    setDir(liked ? 1 : -1);
    setError(null);
    store.vote(current.id, liked).catch((e) => setError(explain(e)));
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

  const dismissMatch = () => {
    setDismissed(group.matchId);
    try {
      if (group.matchId) window.sessionStorage.setItem(seenKey(code), group.matchId);
    } catch {
      // Sans stockage, l'écran de match réapparaîtra après un rechargement : sans gravité.
    }
  };

  const restart = async () => {
    try {
      await resetGroupRemote(code);
      setDismissed(null);
      await store.refresh();
    } catch (e) {
      setError(explain(e));
    }
  };

  const total = restaurants.length;
  const others = members.filter((m) => m.id !== me?.id);
  const everyoneDone = others.every((m) => m.votedCount >= total);
  const waitingFor = others.filter((m) => m.votedCount < total);

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
            Resto {Math.min(done + 1, total)} sur {total}
          </span>
          <span className="text-xs font-semibold text-ink-soft">
            {group.restaurantsSource === "google" ? "🌍 Données Google Maps" : "🧪 Restos d'exemple"}
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-line" aria-hidden>
          <motion.div
            className="h-full rounded-full bg-tomato"
            initial={false}
            animate={{ width: `${(done / total) * 100}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 26 }}
          />
        </div>
        <ul aria-label="Avancement des membres" className="flex flex-wrap gap-1.5">
          {members.map((m) => {
            const count = m.id === me?.id ? done : m.votedCount;
            return (
              <li
                key={m.id}
                className={`flex items-center gap-1 rounded-full py-0.5 pl-1 pr-2.5 text-xs font-bold ring-2 ${
                  m.id === me?.id ? "bg-sun ring-ink" : "bg-paper ring-line"
                }`}
              >
                <span aria-hidden className="text-base">
                  {m.emoji}
                </span>
                {m.name}
                <span className="font-medium text-ink-soft">
                  {count}/{total}
                </span>
              </li>
            );
          })}
        </ul>
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

        {remaining.length === 0 ? (
          <FinishedCard
            noMatch={everyoneDone && !group.matchId}
            waitingFor={waitingFor}
            isHost={isHost}
            onRestart={restart}
          />
        ) : null}
      </div>

      <div className="mt-6 flex items-center justify-center gap-8">
        <motion.button
          type="button"
          onClick={() => vote(false)}
          disabled={!current || showMatch}
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
          disabled={!current || showMatch}
          whileHover={{ y: -3, scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Oui, ce resto me tente"
          className="grid size-24 place-items-center rounded-full border-2 border-ink bg-basil text-5xl shadow-[0_5px_0_var(--color-ink)] disabled:opacity-40"
        >
          <span aria-hidden>😋</span>
        </motion.button>
      </div>
      {error ? (
        <p role="alert" className="mt-4 rounded-2xl bg-tomato/15 px-4 py-2.5 text-center text-sm font-semibold">
          {error}
        </p>
      ) : (
        <p className="mt-4 hidden text-center text-sm text-ink-soft sm:block">
          Glisse la carte, ou utilise les flèches ← → du clavier.
        </p>
      )}

      <AnimatePresence>
        {showMatch && match ? (
          <MatchScreen
            key={match.id}
            restaurant={match}
            members={members}
            isHost={isHost}
            onContinue={dismissMatch}
            onRestart={restart}
          />
        ) : null}
      </AnimatePresence>
    </main>
  );
}

function FinishedCard({
  noMatch,
  waitingFor,
  isHost,
  onRestart,
}: {
  noMatch: boolean;
  waitingFor: Member[];
  isHost: boolean;
  onRestart: () => void;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-[2rem] border-2 border-dashed border-ink-soft p-6 text-center"
    >
      <span aria-hidden className="text-6xl">
        {noMatch ? "🍽️" : "⏳"}
      </span>
      {noMatch ? (
        <>
          <h2 className="font-display text-2xl font-extrabold">Aucun match cette fois</h2>
          <p className="text-ink-soft">Personne n&apos;a validé le même resto. On refait un tour ?</p>
          {isHost ? (
            <Button onClick={onRestart} className="w-full">
              🔄 Recommencer
            </Button>
          ) : (
            <p className="text-sm font-semibold text-ink-soft">Le créateur du groupe peut relancer une partie.</p>
          )}
        </>
      ) : (
        <>
          <h2 className="font-display text-2xl font-extrabold">Tu as tout swipé !</h2>
          <p className="text-ink-soft">
            {waitingFor.length > 0
              ? `En attente de ${waitingFor.map((m) => m.name).join(", ")}…`
              : "Le résultat arrive…"}
          </p>
        </>
      )}
    </motion.section>
  );
}
