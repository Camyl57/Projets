import type { Metadata } from "next";
import { JoinForm } from "@/components/JoinForm";

export const metadata: Metadata = { title: "Rejoindre un groupe" };

export default function JoinPage() {
  return <JoinForm />;
}
