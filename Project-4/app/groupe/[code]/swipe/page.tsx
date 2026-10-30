import { Suspense } from "react";
import type { Metadata } from "next";
import { LobbySkeleton } from "@/components/GroupLobby";
import { SwipeGame } from "@/components/swipe/SwipeGame";

export const metadata: Metadata = { title: "Swipe" };

export default function SwipePage({ params }: PageProps<"/groupe/[code]/swipe">) {
  return (
    <Suspense fallback={<LobbySkeleton />}>
      {params.then(({ code }) => (
        <SwipeGame code={code} />
      ))}
    </Suspense>
  );
}
