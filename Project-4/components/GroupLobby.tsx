"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CodeDigits } from "@/components/CodeDigits";
import { GroupSummary } from "@/components/GroupSummary";
import { JoinFields } from "@/components/JoinFields";
import { Logo } from "@/components/Logo";
import { RestaurantPrep } from "@/components/RestaurantPrep";
import { SetupNotice } from "@/components/SetupNotice";
import { ShareCode } from "@/components/ShareCode";
import { Button, ButtonLink } from "@/components/ui/Button";
import { useLiveGroup } from "@/lib/liveGroup";
import { startSwipingRemote } from "@/lib/remote";
import { explain, isSupabaseConfigured, RemoteError } from "@/lib/supabase/client";

export function LobbySkeleton() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pt-5">
      <Logo />
      <div className="flex flex-1 items-center justify-center" role="status" aria-label="Chargement du salon">
        <motion.span
          aria-hidden
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, ease: "linear", duration: 1.2 }}
          className="size-10 rounded-full border-4 border-ink border-t-transparent"
        />
      </div>
    </main>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pb-10 pt-5">
      <header className="flex items-center justify-between">
        <Logo />
        <Link href="/" className="rounded-full px-3 py-1.5 text-sm font-bold text-ink-soft hover:bg-ink/5">
          Accueil
        </Link>
      </header>
      {children}
    </main>
  );
}

export function GroupLobby({ code }: { code: string }) {
  if (!isSupabaseConfigured) return <SetupNotice />;
  return <Lobby code={code} />;
}

function Lobby({ code }: { code: string }) {
  const router = useRouter();
  const { state, store } = useLiveGroup(code);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = state.status === "ready" ? state.group.status : null;
  // Dès que l'hôte lance le swipe, tout le monde est emmené sur l'écran de swipe.
  useEffect(() => {
    if (status === "swiping") router.push(`/groupe/${code}/swipe`);
  }, [status, code, router]);

  if (state.status === "loading") return <LobbySkeleton />;

  if (state.status === "error") {
    return (
      <Shell>
        <section className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <span aria-hidden className="text-6xl">
            📡
          </span>
          <h1 className="font-display text-3xl font-extrabold">Connexion impossible</h1>
          <p role="alert" className="max-w-sm text-ink-soft">
            {explain(new RemoteError(state.code))}
          </p>
          <Button onClick={() => window.location.reload()}>🔄 Réessayer</Button>
        </section>
      </Shell>
    );
  }

  // Lien partagé ouvert par quelqu'un qui n'est pas (encore) dans le groupe : il choisit son prénom et rejoint.
  if (state.status === "notfound") {
    return (
      <Shell>
        <section className="flex flex-1 flex-col justify-center gap-6 py-8 text-center">
          <div className="flex flex-col gap-2">
            <span aria-hidden className="text-5xl">
              🙌
            </span>
            <h1 className="font-display text-3xl font-extrabold">Rejoindre le groupe {code}</h1>
            <p className="text-ink-soft">Choisis ton prénom pour qu&apos;ils te reconnaissent.</p>
          </div>
          <JoinFields code={code} onJoined={() => void store.refresh()} />
        </section>
      </Shell>
    );
  }

  const { group, members, me } = state;
  const isHost = me?.isHost ?? false;
  const host = members.find((m) => m.isHost);
  const ready = group.restaurants !== null;

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      await startSwipingRemote(code);
      await store.refresh();
    } catch (e) {
      setError(explain(e));
      setBusy(false);
    }
  };

  return (
    <Shell>
      <section className="flex flex-1 flex-col items-center justify-center gap-7 py-6 text-center">
        <div className="flex flex-col gap-1">
          <p className="font-display text-lg font-bold text-ink-soft">Salon</p>
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Code du groupe</h1>
        </div>
        <CodeDigits code={group.code} animate={false} />
        <GroupSummary group={group} />
        <ShareCode code={group.code} />

        <div className="w-full">
          <h2 className="mb-3 font-display text-lg font-bold">
            {members.length} {members.length > 1 ? "personnes dans le groupe" : "personne dans le groupe"}
          </h2>
          <ul aria-label="Membres du groupe" className="flex flex-wrap justify-center gap-3">
            <AnimatePresence initial={false}>
              {members.map((m) => (
                <motion.li
                  key={m.id}
                  layout
                  initial={{ scale: 0.4, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 18 }}
                  className="flex items-center gap-2 rounded-full border-2 border-ink bg-paper py-1.5 pl-1.5 pr-4 shadow-[0_3px_0_var(--color-ink)]"
                >
                  <span aria-hidden className="grid size-9 place-items-center rounded-full bg-sun text-xl">
                    {m.emoji}
                  </span>
                  <span className="font-bold">{m.name}</span>
                  {m.isHost ? <span title="Créateur du groupe">👑</span> : null}
                  {m.id === me?.id ? <span className="text-xs font-bold text-ink-soft">(toi)</span> : null}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          <p aria-live="polite" className="sr-only">
            {members.length} {members.length > 1 ? "personnes" : "personne"} dans le groupe
          </p>
        </div>

        <div className="flex w-full flex-col items-stretch gap-3">
          {!ready && isHost ? <RestaurantPrep group={group} onReady={() => void store.refresh()} /> : null}
          {!ready && !isHost ? (
            <p className="rounded-3xl border-2 border-dashed border-ink-soft p-4 text-ink-soft">
              {host?.name ?? "L'hôte"} prépare la liste des restos…
            </p>
          ) : null}
          {ready ? (
            <p className="text-sm font-semibold text-ink-soft">
              {group.restaurantsSource === "google" ? "🌍" : "🧪"} {group.restaurants?.length} restos prêts
              {group.restaurantsSource === "demo" ? " (exemples)" : ""}
            </p>
          ) : null}

          {error ? (
            <p role="alert" className="rounded-2xl bg-tomato/15 px-4 py-2.5 text-sm font-semibold">
              {error}
            </p>
          ) : null}

          {isHost ? (
            <>
              <Button big onClick={start} disabled={!ready || busy} className="w-full">
                👉 {busy ? "Lancement…" : "Lancer le swipe"}
              </Button>
              <p className="text-sm text-ink-soft">
                Attends que tes amis aient rejoint : après le lancement, plus personne ne peut entrer.
              </p>
            </>
          ) : (
            <div role="status" className="flex flex-col items-center gap-2 rounded-3xl bg-sun/40 p-5">
              <motion.span
                aria-hidden
                animate={{ rotate: [0, -12, 12, 0] }}
                transition={{ repeat: Infinity, duration: 1.8 }}
                className="text-4xl"
              >
                ⏳
              </motion.span>
              <p className="font-display text-lg font-bold">
                En attente de {host?.name ?? "l'hôte"} pour lancer le swipe…
              </p>
              <ButtonLink href="/" variant="ghost" className="!min-h-10 !text-sm">
                Quitter le salon
              </ButtonLink>
            </div>
          )}
        </div>
      </section>
    </Shell>
  );
}
