"use client";

import { ChoiceCard } from "@/components/ui/ChoiceCard";
import { BUDGETS } from "@/lib/data";
import type { BudgetId } from "@/lib/types";

type Props = { value: BudgetId | null; onChange: (id: BudgetId) => void };

export function StepBudget({ value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="Budget par personne" className="grid grid-cols-2 gap-4">
      {BUDGETS.map((b) => (
        <ChoiceCard
          key={b.id}
          emoji={b.emoji}
          title={b.label}
          hint={b.hint}
          selected={value === b.id}
          onSelect={() => onChange(b.id)}
        />
      ))}
    </div>
  );
}
