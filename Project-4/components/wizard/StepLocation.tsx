"use client";

import { AnimatePresence, motion } from "framer-motion";
import { GEO_MESSAGES, useGeolocation } from "@/hooks/useGeolocation";
import { CITIES } from "@/lib/data";
import type { GroupLocation } from "@/lib/types";

type Props = {
  location: GroupLocation | null;
  onChange: (location: GroupLocation | null) => void;
};

export function StepLocation({ location, onChange }: Props) {
  const geo = useGeolocation();
  const loading = geo.state.status === "loading";
  const hasGps = location?.source === "gps";

  const locate = () =>
    geo.request((coords) => onChange({ label: "Ma position actuelle", coords, source: "gps" }));

  return (
    <div className="flex flex-col gap-6">
      <motion.button
        type="button"
        onClick={locate}
        disabled={loading}
        whileHover={loading ? undefined : { y: -3 }}
        whileTap={loading ? undefined : { y: 3, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 500, damping: 26 }}
        className={[
          "relative flex min-h-28 w-full items-center gap-5 rounded-3xl border-2 border-ink px-6 py-5 text-left",
          "font-display text-xl font-extrabold disabled:cursor-wait",
          hasGps
            ? "bg-basil/15 shadow-[0_5px_0_var(--color-ink)]"
            : "bg-tomato text-white shadow-[0_5px_0_var(--color-ink)] hover:bg-tomato-deep",
        ].join(" ")}
      >
        <span aria-hidden className="relative grid size-14 shrink-0 place-items-center rounded-2xl bg-paper text-3xl text-ink">
          {loading ? (
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, ease: "linear", duration: 1 }}
              className="size-7 rounded-full border-4 border-ink border-t-transparent"
            />
          ) : hasGps ? (
            "✅"
          ) : (
            <>
              <motion.span
                className="absolute inset-0 rounded-2xl border-2 border-paper"
                animate={{ scale: [1, 1.5], opacity: [0.7, 0] }}
                transition={{ repeat: Infinity, duration: 1.6, ease: "easeOut" }}
              />
              📍
            </>
          )}
        </span>
        <span className="flex flex-col">
          <span className={hasGps ? "text-ink" : ""}>
            {loading
              ? "Recherche de ta position…"
              : hasGps
                ? "Position trouvée"
                : "Utiliser ma position actuelle"}
          </span>
          <span className={`text-sm font-medium ${hasGps ? "text-ink-soft" : "text-white/85"}`}>
            {loading
              ? "Accepte la demande de ton navigateur"
              : hasGps && location
                ? `${location.coords.lat.toFixed(3)}, ${location.coords.lng.toFixed(3)}` +
                  (location.coords.accuracy ? ` · précision ~${Math.round(location.coords.accuracy)} m` : "")
                : "Pour trouver les restos autour de toi"}
          </span>
        </span>
      </motion.button>

      <AnimatePresence initial={false}>
        {geo.state.status === "error" ? (
          <motion.p
            key="geo-error"
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-2xl bg-sun/40 px-4 py-3 text-sm font-medium"
          >
            ⚠️ {GEO_MESSAGES[geo.state.error]}
          </motion.p>
        ) : null}
      </AnimatePresence>

      <div className="flex items-center gap-3 text-sm font-semibold text-ink-soft" aria-hidden>
        <span className="h-px flex-1 bg-line" />
        ou choisis une ville
        <span className="h-px flex-1 bg-line" />
      </div>

      <div role="radiogroup" aria-label="Ville" className="flex flex-wrap gap-2.5">
        {CITIES.map((city) => {
          const selected = location?.source === "manual" && location.label === city.label;
          return (
            <motion.button
              key={city.label}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange({ label: city.label, coords: city.coords, source: "manual" })}
              whileTap={{ scale: 0.94 }}
              className={[
                "rounded-full border-2 px-4 py-2 text-base font-bold transition-colors",
                selected
                  ? "border-ink bg-sun shadow-[0_3px_0_var(--color-ink)]"
                  : "border-line bg-paper hover:border-ink-soft",
              ].join(" ")}
            >
              {city.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
