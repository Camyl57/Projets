import { formatDistance, type Restaurant } from "@/lib/restaurants";

/** Carte d'un resto (présentation seule) : utilisée dans le swipe et dans l'écran de match. */
export function RestaurantCard({ r, compact = false }: { r: Restaurant; compact?: boolean }) {
  return (
    <article className="flex h-full w-full flex-col overflow-hidden rounded-[2rem] border-2 border-ink bg-paper shadow-[0_8px_0_var(--color-ink)]">
      <div
        className={`relative grid place-items-center overflow-hidden ${compact ? "h-36" : "h-[46%] min-h-40"}`}
        style={{ backgroundImage: `linear-gradient(135deg, ${r.gradient[0]}, ${r.gradient[1]})` }}
      >
        <span aria-hidden className="absolute -left-10 -top-10 size-40 rounded-full bg-white/20" />
        <span aria-hidden className="absolute -bottom-12 -right-8 size-44 rounded-full bg-white/15" />
        <span aria-hidden className={`relative drop-shadow-lg ${compact ? "text-7xl" : "text-[7rem] leading-none"}`}>
          {r.emoji}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-paper/90 px-3 py-1 text-sm font-extrabold">
          📍 {formatDistance(r.distance)}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5 text-left">
        <h2 className={`font-display font-extrabold leading-tight ${compact ? "text-2xl" : "text-3xl"}`}>{r.name}</h2>
        <p className="text-base font-semibold text-ink-soft">
          {r.emoji} {r.cuisineLabel} · 💶 {r.priceLabel}
        </p>
        <p className="text-base font-bold">
          <span aria-hidden>⭐</span> {r.rating.toFixed(1).replace(".", ",")}{" "}
          <span className="font-medium text-ink-soft">({r.reviews} avis)</span>
        </p>
        {!compact ? <p className="text-sm text-ink-soft">{r.address}</p> : null}
        <ul className="mt-auto flex flex-wrap gap-2" aria-label="Points forts">
          {r.tags.map((t) => (
            <li key={t} className="rounded-full bg-cream px-3 py-1 text-xs font-bold ring-1 ring-line">
              {t}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
