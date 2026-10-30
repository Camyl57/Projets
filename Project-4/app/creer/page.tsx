import type { Metadata } from "next";
import { CreateWizard } from "@/components/wizard/CreateWizard";

export const metadata: Metadata = { title: "Créer un groupe" };

export default function CreatePage() {
  return <CreateWizard />;
}
