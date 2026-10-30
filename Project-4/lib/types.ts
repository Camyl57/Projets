export type BudgetId = "lt10" | "10-20" | "20-30" | "gt30";

export type Coords = {
  lat: number;
  lng: number;
  /** Précision en mètres (uniquement pour la géolocalisation GPS). */
  accuracy?: number;
};

export type GroupLocation = {
  label: string;
  coords: Coords;
  source: "gps" | "manual";
};

/** Ce que le parcours de création collecte avant de générer le code. */
export type GroupDraft = {
  location: GroupLocation;
  budget: BudgetId;
  /** Identifiants de cuisines ; vide = « peu importe ». */
  cuisines: string[];
};

export type Group = GroupDraft & {
  code: string;
  createdAt: number;
  /** Tes votes : identifiant du resto → true (oui) / false (non). */
  votes?: Record<string, boolean>;
  /** Resto sur lequel tout le monde est d'accord, s'il y en a un. */
  matchId?: string | null;
};
