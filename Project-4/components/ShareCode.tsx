"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { APP_NAME } from "@/lib/brand";

type Feedback = "idle" | "code" | "link" | "error";

export function ShareCode({ code }: { code: string }) {
  const [feedback, setFeedback] = useState<Feedback>("idle");

  const flash = (f: Feedback) => {
    setFeedback(f);
    window.setTimeout(() => setFeedback("idle"), 2200);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      flash("code");
    } catch {
      flash("error");
    }
  };

  const share = async () => {
    const url = `${window.location.origin}/groupe/${code}`;
    const text = `Rejoins mon groupe sur ${APP_NAME} avec le code ${code}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: APP_NAME, text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} : ${url}`);
      flash("link");
    } catch (e) {
      // L'utilisateur a simplement fermé la feuille de partage.
      if (e instanceof DOMException && e.name === "AbortError") return;
      flash("error");
    }
  };

  return (
    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
      <Button variant="secondary" onClick={copyCode} className="sm:min-w-52">
        {feedback === "code" ? "✓ Code copié" : "📋 Copier le code"}
      </Button>
      <Button variant="secondary" onClick={share} className="sm:min-w-52">
        {feedback === "link" ? "✓ Lien copié" : "📤 Partager le lien"}
      </Button>
      <p role="status" aria-live="polite" className="sr-only">
        {feedback === "code" ? "Code copié" : feedback === "link" ? "Lien copié" : feedback === "error" ? "Copie impossible" : ""}
      </p>
    </div>
  );
}
