import { budgetLabel, cuisineById } from "@/lib/data";
import type { GroupDraft } from "@/lib/types";

/** Récapitulatif des critères du groupe sous forme de pastilles. */
export function GroupSummary({ group }: { group: GroupDraft }) {
  const cuisines = group.cuisines.length
    ? group.cuisines.map((id) => cuisineById(id)).filter((c) => c !== undefined)
    : [];
  return (
    <ul className="flex flex-wrap justify-center gap-2" aria-label="Critères du groupe">
      <li className="rounded-full bg-paper px-3.5 py-1.5 text-sm font-bold ring-2 ring-line">
        📍 {group.location.label}
      </li>
      <li className="rounded-full bg-paper px-3.5 py-1.5 text-sm font-bold ring-2 ring-line">
        💶 {budgetLabel(group.budget)}
      </li>
      {cuisines.length ? (
        cuisines.map((c) => (
          <li key={c.id} className="rounded-full bg-paper px-3.5 py-1.5 text-sm font-bold ring-2 ring-line">
            {c.emoji} {c.label}
          </li>
        ))
      ) : (
        <li className="rounded-full bg-paper px-3.5 py-1.5 text-sm font-bold ring-2 ring-line">🤷 Toutes cuisines</li>
      )}
    </ul>
  );
}
