"use client";

import { ChoiceCard } from "@/components/ui/ChoiceCard";
import { CUISINES } from "@/lib/data";

export const ANY_CUISINE = "any";

type Props = { value: string[]; onToggle: (id: string) => void };

export function StepCuisine({ value, onToggle }: Props) {
  return (
    <div role="group" aria-label="Types de cuisine" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {CUISINES.map((c) => (
        <ChoiceCard
          key={c.id}
          role="checkbox"
          size="sm"
          emoji={c.emoji}
          title={c.label}
          selected={value.includes(c.id)}
          onSelect={() => onToggle(c.id)}
        />
      ))}
      <div className="col-span-2 sm:col-span-3">
        <ChoiceCard
          role="checkbox"
          size="sm"
          emoji="🤷"
          title="Peu importe, surprenez-moi"
          selected={value.includes(ANY_CUISINE)}
          onSelect={() => onToggle(ANY_CUISINE)}
        />
      </div>
    </div>
  );
}
