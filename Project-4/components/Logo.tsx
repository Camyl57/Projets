import Link from "next/link";
import { APP_NAME } from "@/lib/brand";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label={`${APP_NAME} – accueil`}
      className={`inline-flex items-center gap-2 font-display text-xl font-extrabold tracking-tight ${className}`}
    >
      <span aria-hidden className="grid size-9 place-items-center rounded-xl bg-tomato text-lg shadow-[0_3px_0_var(--color-tomato-deep)]">
        🍽️
      </span>
      <span>{APP_NAME}</span>
    </Link>
  );
}
