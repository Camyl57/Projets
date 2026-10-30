"use client";

import { MotionConfig } from "framer-motion";

/** Respecte le réglage « réduire les animations » du système. */
export function Providers({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
