import { Suspense } from "react";
import type { Metadata } from "next";
import { GroupLobby, LobbySkeleton } from "@/components/GroupLobby";

export const metadata: Metadata = { title: "Salon" };

// `params` est une promesse : on la résout sous <Suspense> pour garder la coquille de la page statique.
export default function GroupPage({ params }: PageProps<"/groupe/[code]">) {
  return (
    <Suspense fallback={<LobbySkeleton />}>
      {params.then(({ code }) => (
        <GroupLobby code={code} />
      ))}
    </Suspense>
  );
}
