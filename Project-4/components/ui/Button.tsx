"use client";

import Link from "next/link";
import { motion } from "framer-motion";

type Variant = "primary" | "secondary" | "ghost";

const styles: Record<Variant, string> = {
  primary:
    "bg-tomato text-white border-ink shadow-[0_5px_0_var(--color-ink)] hover:bg-tomato-deep",
  secondary: "bg-paper text-ink border-ink shadow-[0_5px_0_var(--color-ink)] hover:bg-sun",
  ghost: "bg-transparent text-ink border-transparent hover:bg-ink/5",
};

type CommonProps = {
  variant?: Variant;
  big?: boolean;
  className?: string;
  children: React.ReactNode;
};

const base =
  "inline-flex items-center justify-center gap-3 rounded-3xl border-2 font-display font-extrabold " +
  "transition-colors select-none disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none";

function classes({ variant = "primary", big, className = "" }: CommonProps) {
  return `${base} ${styles[variant]} ${big ? "min-h-24 px-8 text-2xl" : "min-h-14 px-6 text-lg"} ${className}`;
}

const MotionLink = motion.create(Link);
const press = { whileHover: { y: -3 }, whileTap: { y: 3, scale: 0.98 } } as const;
const spring = { type: "spring", stiffness: 500, damping: 26 } as const;

/** Lien stylé en bouton ; `external` ouvre un nouvel onglet (carte, site externe…). */
export function ButtonLink({ href, external, ...rest }: CommonProps & { href: string; external?: boolean }) {
  if (external) {
    return (
      <motion.a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        {...press}
        transition={spring}
        className={classes(rest)}
      >
        {rest.children}
      </motion.a>
    );
  }
  return (
    <MotionLink href={href} {...press} transition={spring} className={classes(rest)}>
      {rest.children}
    </MotionLink>
  );
}

export function Button({
  onClick,
  disabled,
  type = "button",
  ...rest
}: CommonProps & { onClick?: () => void; disabled?: boolean; type?: "button" | "submit" }) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      {...(disabled ? {} : press)}
      transition={spring}
      className={classes(rest)}
    >
      {rest.children}
    </motion.button>
  );
}
