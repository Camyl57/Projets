"use client";

import { useState } from "react";
import { ProfileFields } from "@/components/ProfileFields";
import { Button } from "@/components/ui/Button";
import { saveProfile, useProfile } from "@/lib/profile";
import { joinGroupRemote } from "@/lib/remote";
import { explain } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

/** Prénom + avatar puis « Rejoindre » : partagé par la page de saisie du code et par les liens directs. */
export function JoinFields({ code, onJoined }: { code: string; onJoined: () => void }) {
  const saved = useProfile();
  const [edited, setEdited] = useState<Profile | null>(null);
  const profile = edited ?? saved;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !profile.name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      saveProfile(profile);
      await joinGroupRemote(code, { ...profile, name: profile.name.trim() });
      onJoined();
    } catch (err) {
      setError(explain(err));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={join} className="flex flex-col gap-6">
      <ProfileFields value={profile} onChange={setEdited} />
      {error ? (
        <p role="alert" className="rounded-2xl bg-tomato/15 px-4 py-2.5 text-sm font-semibold">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={busy || !profile.name.trim()} big className="w-full">
        {busy ? "Connexion…" : `Rejoindre le groupe ${code} →`}
      </Button>
    </form>
  );
}
