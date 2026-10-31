import { Logo } from "@/components/Logo";
import { ButtonLink } from "@/components/ui/Button";

/** Affiché tant que les clés Supabase ne sont pas renseignées dans `.env.local`. */
export function SetupNotice() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-10 pt-5">
      <Logo />
      <section className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <span aria-hidden className="text-6xl">
          🔌
        </span>
        <h1 className="font-display text-3xl font-extrabold">Serveur à brancher</h1>
        <p className="text-ink-soft">
          Les groupes passent par Supabase, qui n&apos;est pas encore configuré. Ajoute{" "}
          <code className="rounded bg-ink/10 px-1.5 py-0.5 text-sm">NEXT_PUBLIC_SUPABASE_URL</code> et{" "}
          <code className="rounded bg-ink/10 px-1.5 py-0.5 text-sm">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> dans{" "}
          <code className="rounded bg-ink/10 px-1.5 py-0.5 text-sm">.env.local</code>, puis relance l&apos;application. Les
          étapes détaillées sont dans le README.
        </p>
        <ButtonLink href="/" variant="secondary" className="w-full max-w-xs">
          ← Retour à l&apos;accueil
        </ButtonLink>
      </section>
    </main>
  );
}
