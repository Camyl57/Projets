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

export type Restaurant = {
  id: string;
  name: string;
  cuisineId: string;
  cuisineLabel: string;
  emoji: string;
  /** Absents quand la source ne les fournit pas. */
  priceLabel?: string;
  rating?: number;
  reviews?: number;
  /** Distance à vol d'oiseau, en mètres. */
  distance: number;
  address: string;
  coords: Coords;
  tags: string[];
  gradient: [string, string];
  phone?: string;
  website?: string;
  /** Lien direct vers la fiche sur la carte (sinon on construit une recherche). */
  mapsUrl?: string;
};

/** `google` = vrais restos (Google Places), `demo` = restos d'exemple générés. */
export type RestaurantSource = "google" | "demo";

/** Un groupe tel que le serveur le partage à tous ses membres. */
export type Group = GroupDraft & {
  code: string;
  hostId: string;
  /** `lobby` = salon d'attente (on peut rejoindre), `swiping` = swipe lancé. */
  status: "lobby" | "swiping";
  /** Liste figée : les votes s'y réfèrent par identifiant. `null` tant qu'elle n'est pas chargée. */
  restaurants: Restaurant[] | null;
  restaurantsSource: RestaurantSource | null;
  /** Dernier resto approuvé par tous les membres. */
  matchId: string | null;
};

export type Member = {
  id: string;
  userId: string;
  name: string;
  emoji: string;
  isHost: boolean;
  votedCount: number;
};

/** Prénom et avatar choisis sur cet appareil. */
export type Profile = { name: string; emoji: string };
