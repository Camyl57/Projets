import type { BudgetId, Coords } from "./types";

export const BUDGETS: {
  id: BudgetId;
  label: string;
  hint: string;
  emoji: string;
}[] = [
  { id: "lt10", label: "Moins de 10 €", hint: "Sur le pouce", emoji: "🥪" },
  { id: "10-20", label: "10 – 20 €", hint: "Le classique", emoji: "🍝" },
  { id: "20-30", label: "20 – 30 €", hint: "On se fait plaisir", emoji: "🍷" },
  { id: "gt30", label: "30 € et +", hint: "Grande occasion", emoji: "🥂" },
];

export const CUISINES: { id: string; label: string; emoji: string }[] = [
  { id: "burger", label: "Burger", emoji: "🍔" },
  { id: "pizza", label: "Pizza", emoji: "🍕" },
  { id: "italien", label: "Italien", emoji: "🍝" },
  { id: "asiatique", label: "Asiatique", emoji: "🥢" },
  { id: "sushi", label: "Sushi", emoji: "🍣" },
  { id: "mexicain", label: "Mexicain", emoji: "🌮" },
  { id: "indien", label: "Indien", emoji: "🍛" },
  { id: "kebab", label: "Kebab", emoji: "🥙" },
  { id: "francais", label: "Français", emoji: "🥖" },
  { id: "libanais", label: "Libanais", emoji: "🧆" },
  { id: "vegetarien", label: "Végé", emoji: "🥗" },
  { id: "dessert", label: "Desserts", emoji: "🍰" },
];

/** Villes proposées si la géolocalisation est refusée ou indisponible. */
export const CITIES: { label: string; coords: Coords }[] = [
  { label: "Paris", coords: { lat: 48.8566, lng: 2.3522 } },
  { label: "Lyon", coords: { lat: 45.764, lng: 4.8357 } },
  { label: "Marseille", coords: { lat: 43.2965, lng: 5.3698 } },
  { label: "Toulouse", coords: { lat: 43.6047, lng: 1.4442 } },
  { label: "Bordeaux", coords: { lat: 44.8378, lng: -0.5792 } },
  { label: "Lille", coords: { lat: 50.6292, lng: 3.0573 } },
  { label: "Nantes", coords: { lat: 47.2184, lng: -1.5536 } },
  { label: "Strasbourg", coords: { lat: 48.5734, lng: 7.7521 } },
  { label: "Metz", coords: { lat: 49.1193, lng: 6.1757 } },
  { label: "Troyes", coords: { lat: 48.2973, lng: 4.0744 } },
];

export function budgetLabel(id: BudgetId): string {
  return BUDGETS.find((b) => b.id === id)?.label ?? id;
}

export function cuisineById(id: string) {
  return CUISINES.find((c) => c.id === id);
}
