/** Apparence (emoji, dégradé) de chaque cuisine, et correspondance avec les types Google Places. */

export type CuisineStyle = { label: string; emoji: string; gradient: [string, string] };

export const CUISINE_STYLES: Record<string, CuisineStyle> = {
  burger: { label: "Burger", emoji: "🍔", gradient: ["#ffb347", "#ff5a36"] },
  pizza: { label: "Pizza", emoji: "🍕", gradient: ["#ff8a5b", "#e03f1c"] },
  italien: { label: "Italien", emoji: "🍝", gradient: ["#7bd389", "#2bb673"] },
  asiatique: { label: "Asiatique", emoji: "🥢", gradient: ["#ff9aa2", "#e4572e"] },
  sushi: { label: "Sushi", emoji: "🍣", gradient: ["#9ad0f5", "#4e8fd6"] },
  mexicain: { label: "Mexicain", emoji: "🌮", gradient: ["#ffd166", "#ef8354"] },
  indien: { label: "Indien", emoji: "🍛", gradient: ["#f9a826", "#b5651d"] },
  kebab: { label: "Kebab", emoji: "🥙", gradient: ["#f4a261", "#9c4a1a"] },
  francais: { label: "Français", emoji: "🥖", gradient: ["#a0c4ff", "#5e60cd"] },
  libanais: { label: "Libanais", emoji: "🧆", gradient: ["#c9e4ca", "#52796f"] },
  vegetarien: { label: "Végé", emoji: "🥗", gradient: ["#b7e4c7", "#40916c"] },
  dessert: { label: "Desserts", emoji: "🍰", gradient: ["#ffc8dd", "#ff70a6"] },
  // Catégories que Google renvoie mais qu'on ne propose pas dans le choix de cuisine.
  fastfood: { label: "Fast-food", emoji: "🍟", gradient: ["#ffd54f", "#ef5350"] },
  sandwich: { label: "Sandwich", emoji: "🥪", gradient: ["#ffe0b2", "#e07b39"] },
  grill: { label: "Grillades", emoji: "🥩", gradient: ["#e57373", "#7b1e1e"] },
  mer: { label: "Poissons", emoji: "🐟", gradient: ["#80deea", "#00838f"] },
  cafe: { label: "Café", emoji: "☕", gradient: ["#d7ccc8", "#6d4c41"] },
  autre: { label: "Restaurant", emoji: "🍽️", gradient: ["#d9c5b2", "#8d6e63"] },
};

export function styleFor(cuisineId: string): CuisineStyle {
  return CUISINE_STYLES[cuisineId] ?? CUISINE_STYLES.autre;
}

/** Type Google Places → identifiant de cuisine. Le premier type reconnu l'emporte. */
export const GOOGLE_TYPE_TO_CUISINE: Record<string, string> = {
  hamburger_restaurant: "burger",
  pizza_restaurant: "pizza",
  italian_restaurant: "italien",
  chinese_restaurant: "asiatique",
  thai_restaurant: "asiatique",
  vietnamese_restaurant: "asiatique",
  korean_restaurant: "asiatique",
  indonesian_restaurant: "asiatique",
  asian_restaurant: "asiatique",
  sushi_restaurant: "sushi",
  japanese_restaurant: "sushi",
  ramen_restaurant: "sushi",
  mexican_restaurant: "mexicain",
  indian_restaurant: "indien",
  turkish_restaurant: "kebab",
  middle_eastern_restaurant: "kebab",
  french_restaurant: "francais",
  lebanese_restaurant: "libanais",
  mediterranean_restaurant: "libanais",
  vegetarian_restaurant: "vegetarien",
  vegan_restaurant: "vegetarien",
  dessert_shop: "dessert",
  dessert_restaurant: "dessert",
  ice_cream_shop: "dessert",
  bakery: "dessert",
  fast_food_restaurant: "fastfood",
  sandwich_shop: "sandwich",
  steak_house: "grill",
  barbecue_restaurant: "grill",
  seafood_restaurant: "mer",
  coffee_shop: "cafe",
  cafe: "cafe",
};

/** Cuisine choisie dans le parcours → types Google à interroger en plus de la recherche générale. */
export const CUISINE_TO_GOOGLE_TYPES: Record<string, string[]> = {
  burger: ["hamburger_restaurant"],
  pizza: ["pizza_restaurant"],
  italien: ["italian_restaurant"],
  asiatique: ["chinese_restaurant", "thai_restaurant", "vietnamese_restaurant", "korean_restaurant"],
  sushi: ["sushi_restaurant", "japanese_restaurant", "ramen_restaurant"],
  mexicain: ["mexican_restaurant"],
  indien: ["indian_restaurant"],
  kebab: ["turkish_restaurant", "middle_eastern_restaurant"],
  francais: ["french_restaurant"],
  libanais: ["lebanese_restaurant"],
  vegetarien: ["vegetarian_restaurant", "vegan_restaurant"],
  dessert: ["dessert_shop", "ice_cream_shop", "bakery"],
};
