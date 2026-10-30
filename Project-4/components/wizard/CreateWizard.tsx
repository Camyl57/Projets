"use client";

import { useEffect, useReducer, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { createGroup } from "@/lib/storage";
import type { BudgetId, Group, GroupLocation } from "@/lib/types";
import { StepBudget } from "./StepBudget";
import { ANY_CUISINE, StepCuisine } from "./StepCuisine";
import { StepDone } from "./StepDone";
import { StepLocation } from "./StepLocation";

type Step = 0 | 1 | 2 | 3;

type State = {
  step: Step;
  dir: 1 | -1;
  location: GroupLocation | null;
  budget: BudgetId | null;
  cuisines: string[];
  group: Group | null;
  error: string | null;
};

type Action =
  | { type: "location"; location: GroupLocation | null }
  | { type: "budget"; budget: BudgetId }
  | { type: "cuisine"; id: string }
  | { type: "next" }
  | { type: "back" }
  | { type: "done"; group: Group }
  | { type: "error"; message: string };

const initial: State = {
  step: 0,
  dir: 1,
  location: null,
  budget: null,
  cuisines: [],
  group: null,
  error: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "location":
      return { ...state, location: action.location };
    case "budget":
      return { ...state, budget: action.budget };
    case "cuisine": {
      if (action.id === ANY_CUISINE) {
        return { ...state, cuisines: state.cuisines.includes(ANY_CUISINE) ? [] : [ANY_CUISINE] };
      }
      const without = state.cuisines.filter((c) => c !== ANY_CUISINE);
      const cuisines = without.includes(action.id)
        ? without.filter((c) => c !== action.id)
        : [...without, action.id];
      return { ...state, cuisines };
    }
    case "next":
      return { ...state, step: Math.min(state.step + 1, 2) as Step, dir: 1, error: null };
    case "back":
      return { ...state, step: Math.max(state.step - 1, 0) as Step, dir: -1, error: null };
    case "done":
      return { ...state, step: 3, dir: 1, group: action.group, error: null };
    case "error":
      return { ...state, error: action.message };
  }
}

const STEPS = [
  { title: "Où est-ce qu'on mange ?", subtitle: "On cherche les restos autour de vous." },
  { title: "Quel budget par personne ?", subtitle: "Pour que personne ne grimace à l'addition." },
  { title: "Qu'est-ce qui vous fait envie ?", subtitle: "Choisis une ou plusieurs envies." },
] as const;

const slide = {
  enter: (dir: number) => ({ x: dir * 48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -48, opacity: 0 }),
};

/** Un panneau d'étape : le titre reçoit le focus à l'arrivée pour les lecteurs d'écran. */
function StepPanel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);
  return (
    <>
      <div className="mb-7 flex flex-col gap-1.5">
        <h1 ref={heading} tabIndex={-1} className="font-display text-3xl font-extrabold leading-tight outline-none sm:text-4xl">
          {title}
        </h1>
        <p className="text-base text-ink-soft">{subtitle}</p>
      </div>
      {children}
    </>
  );
}

export function CreateWizard() {
  const [state, dispatch] = useReducer(reducer, initial);
  const { step, dir } = state;

  const canNext =
    step === 0 ? state.location !== null : step === 1 ? state.budget !== null : state.cuisines.length > 0;

  const submit = () => {
    if (!state.location || !state.budget) return;
    try {
      const group = createGroup({
        location: state.location,
        budget: state.budget,
        cuisines: state.cuisines.filter((c) => c !== ANY_CUISINE),
      });
      dispatch({ type: "done", group });
    } catch {
      dispatch({ type: "error", message: "Impossible de créer le groupe, réessaie dans un instant." });
    }
  };

  const onContinue = () => (step === 2 ? submit() : dispatch({ type: "next" }));

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pt-5">
      <header className="flex items-center justify-between gap-3">
        <Logo />
        {step < 3 ? (
          <Link href="/" className="rounded-full px-3 py-1.5 text-sm font-bold text-ink-soft hover:bg-ink/5">
            Quitter
          </Link>
        ) : null}
      </header>

      {step < 3 ? (
        <nav aria-label="Progression" className="mt-6 flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm font-bold">
            <button
              type="button"
              onClick={() => dispatch({ type: "back" })}
              disabled={step === 0}
              className="-ml-2 rounded-full px-2 py-1 text-ink-soft enabled:hover:bg-ink/5 disabled:invisible"
            >
              ← Retour
            </button>
            <span aria-live="polite">Étape {step + 1} sur 3</span>
          </div>
          <div className="flex gap-2" aria-hidden>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-2.5 flex-1 overflow-hidden rounded-full bg-line">
                <motion.div
                  className="h-full rounded-full bg-tomato"
                  initial={false}
                  animate={{ width: i <= step ? "100%" : "0%" }}
                  transition={{ type: "spring", stiffness: 200, damping: 26 }}
                />
              </div>
            ))}
          </div>
        </nav>
      ) : null}

      <div className="relative mt-8 flex-1">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={step}
            custom={dir}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.9 }}
          >
            {step === 0 ? (
              <StepPanel title={STEPS[0].title} subtitle={STEPS[0].subtitle}>
                <StepLocation location={state.location} onChange={(location) => dispatch({ type: "location", location })} />
              </StepPanel>
            ) : null}
            {step === 1 ? (
              <StepPanel title={STEPS[1].title} subtitle={STEPS[1].subtitle}>
                <StepBudget value={state.budget} onChange={(budget) => dispatch({ type: "budget", budget })} />
              </StepPanel>
            ) : null}
            {step === 2 ? (
              <StepPanel title={STEPS[2].title} subtitle={STEPS[2].subtitle}>
                <StepCuisine value={state.cuisines} onToggle={(id) => dispatch({ type: "cuisine", id })} />
              </StepPanel>
            ) : null}
            {step === 3 && state.group ? <StepDone group={state.group} /> : null}
          </motion.div>
        </AnimatePresence>
      </div>

      {step < 3 ? (
        <div className="sticky bottom-0 -mx-5 mt-8 bg-gradient-to-t from-cream via-cream/95 to-transparent px-5 pb-6 pt-8">
          {state.error ? (
            <p role="alert" className="mb-3 rounded-2xl bg-tomato/15 px-4 py-2.5 text-sm font-semibold">
              {state.error}
            </p>
          ) : null}
          <Button onClick={onContinue} disabled={!canNext} className="w-full">
            {step === 2 ? "🎲 Générer le code du groupe" : "Continuer →"}
          </Button>
        </div>
      ) : (
        <div className="pb-8" />
      )}
    </main>
  );
}
