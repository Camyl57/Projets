"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CodeDigits } from "@/components/CodeDigits";
import { GroupSummary } from "@/components/GroupSummary";
import { Logo } from "@/components/Logo";
import { ShareCode } from "@/components/ShareCode";
import { ButtonLink } from "@/components/ui/Button";
import { getGroupSnapshot, subscribe } from "@/lib/storage";

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

/** Lit un groupe dans le stockage : `undefined` = pas encore chargé (serveur), `null` = introuvable. */
export function useGroup(code: string) {
  return useSyncExternalStore(
    subscribe,
    () => getGroupSnapshot(code),
    () => undefined,
  );
}

export function GroupNotFound({ code }: { code: string }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pb-10 pt-5">
      <header className="flex items-center justify-between">
        <Logo />
        <Link href="/" className="rounded-full px-3 py-1.5 text-sm font-bold text-ink-soft hover:bg-ink/5">
          Accueil
        </Link>
      </header>
      <section className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <span aria-hidden className="text-6xl">
          🕵️
        </span>
        <h1 className="font-display text-3xl font-extrabold">Groupe introuvable</h1>
        <p className="max-w-sm text-ink-soft">
          Aucun groupe avec le code <strong className="text-ink">{code}</strong> sur cet appareil. Pour
          l&apos;instant, les groupes ne sont pas encore partagés entre téléphones : cette étape arrive avec le
          serveur.
        </p>
        <div className="flex w-full max-w-xs flex-col gap-3">
          <ButtonLink href="/rejoindre" variant="secondary">
            Réessayer un code
          </ButtonLink>
          <ButtonLink href="/creer">Créer un groupe</ButtonLink>
        </div>
      </section>
    </main>
  );
}

export function GroupLobby({ code }: { code: string }) {
  const group = useGroup(code);

  if (group === undefined) return <LobbySkeleton />;
  if (group === null) return <GroupNotFound code={code} />;

  const voted = Object.keys(group.votes ?? {}).length;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pb-10 pt-5">
      <header className="flex items-center justify-between">
        <Logo />
        <Link href="/" className="rounded-full px-3 py-1.5 text-sm font-bold text-ink-soft hover:bg-ink/5">
          Accueil
        </Link>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center gap-7 text-center">
        <div className="flex flex-col gap-1">
          <p className="font-display text-lg font-bold text-ink-soft">Salon</p>
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Code du groupe</h1>
        </div>
        <CodeDigits code={group.code} animate={false} />
        <GroupSummary group={group} />
        <ShareCode code={group.code} />
        <div className="mt-2 flex w-full flex-col items-center gap-2">
          <ButtonLink href={`/groupe/${group.code}/swipe`} big className="w-full">
            👉 {voted > 0 ? "Reprendre le swipe" : "Lancer le swipe"}
          </ButtonLink>
          <p className="text-sm text-ink-soft">
            Mode démo : tes potes sont simulés tant que le serveur n&apos;est pas branché.
          </p>
        </div>
      </section>
    </main>
  );
}
