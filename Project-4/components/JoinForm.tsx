"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";

/** Saisie du code à 4 chiffres : un vrai champ invisible au-dessus de 4 cases. */
export function JoinForm() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const complete = value.length === 4;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (complete) router.push(`/groupe/${value}`);
  };

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-5">
      <header className="flex items-center justify-between">
        <Logo />
        <Link href="/" className="rounded-full px-3 py-1.5 text-sm font-bold text-ink-soft hover:bg-ink/5">
          Retour
        </Link>
      </header>

      <form onSubmit={submit} className="flex flex-1 flex-col justify-center gap-8 pb-16 text-center">
        <div className="flex flex-col gap-2">
          <span aria-hidden className="text-5xl">
            🔑
          </span>
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Entre le code du groupe</h1>
          <p className="text-ink-soft">Celui que ton ami t&apos;a envoyé : 4 chiffres.</p>
        </div>

        <div className="relative mx-auto" onClick={() => input.current?.focus()}>
          <label htmlFor="code" className="sr-only">
            Code du groupe à 4 chiffres
          </label>
          <input
            id="code"
            ref={input}
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, 4))}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            inputMode="numeric"
            pattern="[0-9]{4}"
            autoComplete="one-time-code"
            maxLength={4}
            autoFocus
            className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
          />
          <div className="flex gap-3" aria-hidden>
            {[0, 1, 2, 3].map((i) => {
              const active = focused && i === Math.min(value.length, 3);
              return (
                <motion.span
                  key={i}
                  animate={active ? { y: -4, scale: 1.05 } : { y: 0, scale: 1 }}
                  className={[
                    "grid h-24 w-[4.25rem] place-items-center rounded-2xl border-2 bg-paper font-display text-6xl font-extrabold",
                    active ? "border-tomato shadow-[0_6px_0_var(--color-tomato)]" : "border-ink shadow-[0_6px_0_var(--color-ink)]",
                  ].join(" ")}
                >
                  {value[i] ?? ""}
                </motion.span>
              );
            })}
          </div>
        </div>

        <Button type="submit" disabled={!complete} big className="w-full">
          Rejoindre le groupe →
        </Button>
      </form>
    </main>
  );
}
