export type InterrogatorScript = {
  en: string;
  fr: string;
};

export type Criterion = {
  id: string;
  label: string;
  negativePrompt: string;
  hiddenRisks: readonly string[];
  unsafeIfPresent: readonly string[];
  uncertainIfPossible: readonly string[];
  script: InterrogatorScript;
};

export const CRITERIA: readonly Criterion[] = [
  {
    id: "vegan",
    label: "Vegan",
    negativePrompt:
      "Exclude all animal products including dairy, eggs, honey, gelatin, and animal-derived stocks.",
    hiddenRisks: [
      "butter or cream finishes",
      "egg-based sauces or batter",
      "honey glazes",
      "gelatin-set desserts",
      "animal-derived stocks",
    ],
    unsafeIfPresent: ["meat", "fish", "shellfish", "dairy", "egg", "honey"],
    uncertainIfPossible: ["stock base", "fried batter", "sauce finish", "dessert setting agent"],
    script: {
      en: "Is this dish prepared without any animal products — including butter, cream, eggs, honey, or animal stock?",
      fr: "Ce plat est-il préparé sans aucun produit d'origine animale — y compris beurre, crème, œufs, miel ou bouillon animal ?",
    },
  },
  {
    id: "vegetarian",
    label: "Vegetarian",
    negativePrompt:
      "Exclude all meat, poultry, fish, shellfish, and meat-derived stocks or fats.",
    hiddenRisks: [
      "meat stocks",
      "lard or rendered animal fat",
      "anchovy or fish sauce",
      "gelatin",
      "shellfish-based sauces",
    ],
    unsafeIfPresent: ["meat", "poultry", "fish", "shellfish", "meat stock", "lard"],
    uncertainIfPossible: ["broth", "demi-glace", "sauce base", "fried fat"],
    script: {
      en: "Could you confirm this dish contains no meat, poultry, fish, shellfish, or meat-based stock?",
      fr: "Pouvez-vous confirmer que ce plat ne contient ni viande, ni volaille, ni poisson, ni fruits de mer, ni bouillon à base de viande ?",
    },
  },
  {
    id: "paleo",
    label: "Paleo",
    negativePrompt:
      "Exclude all grains, legumes, dairy, refined sugar, and highly processed oils.",
    hiddenRisks: [
      "soy or peanut oil",
      "refined sugar in sauces",
      "legumes or peanuts",
      "dairy finishes",
      "grain-based thickeners",
    ],
    unsafeIfPresent: ["grains", "legumes", "dairy", "refined sugar", "soy", "peanuts"],
    uncertainIfPossible: ["vegetable oil", "sauce thickener", "sweetener"],
    script: {
      en: "Is this dish free of grains, dairy, legumes, and refined sugars?",
      fr: "Ce plat est-il sans céréales, produits laitiers, légumineuses et sucres raffinés ?",
    },
  },
  {
    id: "keto",
    label: "Keto",
    negativePrompt:
      "Exclude high-carb foods like grains, sugar, fruit, and starchy vegetables.",
    hiddenRisks: [
      "sugar in marinades",
      "starchy thickeners",
      "sweet fruits",
      "breaded coatings",
      "root vegetables",
    ],
    unsafeIfPresent: ["sugar", "grains", "starchy vegetables", "sweet fruit"],
    uncertainIfPossible: ["sauce sweetener", "marinade", "starchy vegetable base"],
    script: {
      en: "Does this dish contain any grains, starchy vegetables, or added sugar?",
      fr: "Ce plat contient-il des céréales, des légumes féculents ou du sucre ajouté ?",
    },
  },
  {
    id: "kosher",
    label: "Kosher",
    negativePrompt:
      "Exclude pork, shellfish, and any dish that combines meat with dairy.",
    hiddenRisks: [
      "pork derivatives",
      "shellfish stocks or sauces",
      "meat and dairy combinations",
      "gelatin source",
      "non-kosher cooking surfaces",
    ],
    unsafeIfPresent: ["pork", "shellfish", "meat with dairy", "lard"],
    uncertainIfPossible: ["gelatin", "stock source", "shared preparation", "cheese served with meat"],
    script: {
      en: "Does this dish contain any pork, shellfish, or a mix of meat and dairy in its preparation?",
      fr: "Ce plat contient-il du porc, des fruits de mer, ou un mélange de viande et de produits laitiers dans sa préparation ?",
    },
  },
  {
    id: "no-meat",
    label: "No Meat",
    negativePrompt:
      "Exclude all meat, poultry, fish, lard, and animal stocks such as fond de veau.",
    hiddenRisks: [
      "veal or chicken stock",
      "lardons",
      "pancetta or bacon garnish",
      "demi-glace",
      "fish sauce",
    ],
    unsafeIfPresent: ["meat", "poultry", "fish", "lard", "animal stock"],
    uncertainIfPossible: ["fond de veau", "broth", "demi-glace", "savory sauce base"],
    script: {
      en: "Is this dish cooked without any meat, poultry, fish, lard, or meat-based stock like fond de veau?",
      fr: "Ce plat est-il cuisiné sans viande, volaille, poisson, saindoux, ni fond de veau ?",
    },
  },
  {
    id: "no-dairy",
    label: "No Dairy",
    negativePrompt:
      "Exclude milk, butter, cream, cheese, whey, casein, and any hidden dairy in sauces.",
    hiddenRisks: [
      "butter-mounted sauces",
      "cream reductions",
      "cheese garnish",
      "whey or casein in processed ingredients",
      "ghee",
    ],
    unsafeIfPresent: ["milk", "butter", "cream", "cheese", "whey", "casein", "ghee"],
    uncertainIfPossible: ["sauce finish", "puree enrichment", "pastry crust", "fried coating"],
    script: {
      en: "Could you check that nothing in this dish — including sauces — is finished with butter, cream, milk, or cheese?",
      fr: "Pouvez-vous vérifier qu'aucun élément de ce plat — y compris les sauces — n'est monté au beurre, à la crème, au lait ou au fromage ?",
    },
  },
  {
    id: "no-peanuts",
    label: "No Peanuts",
    negativePrompt:
      "Exclude peanuts, peanut oil, and any peanut-derived ingredients, including shared fryer cross-contamination.",
    hiddenRisks: [
      "peanut oil",
      "satay or peanut sauces",
      "crushed peanut garnish",
      "shared fryer oil",
      "dessert toppings",
    ],
    unsafeIfPresent: ["peanuts", "peanut oil", "peanut sauce", "groundnuts"],
    uncertainIfPossible: ["shared fryer", "Asian-style sauce", "garnish", "dessert topping"],
    script: {
      en: "Does this dish contain peanuts, peanut oil, or come from a fryer that also cooks with peanut oil?",
      fr: "Ce plat contient-il des cacahuètes, de l'huile d'arachide, ou provient-il d'une friteuse utilisant de l'huile d'arachide ?",
    },
  },
  {
    id: "no-shellfish",
    label: "No Shellfish",
    negativePrompt:
      "Exclude crustaceans, mollusks, shellfish stocks, shellfish sauces, and cross-contamination from shared prep surfaces.",
    hiddenRisks: [
      "shrimp paste",
      "shellfish stock",
      "oyster sauce",
      "shared seafood grill",
      "mollusk-based sauces",
    ],
    unsafeIfPresent: ["shrimp", "crab", "lobster", "mollusks", "oyster sauce", "shellfish stock"],
    uncertainIfPossible: ["seafood sauce", "shared prep surface", "stock", "fried seafood station"],
    script: {
      en: "Is this dish prepared away from any shellfish, and does the sauce or stock contain shrimp, crab, lobster, or mollusks?",
      fr: "Ce plat est-il préparé à l'écart des fruits de mer, et la sauce ou le bouillon contiennent-ils crevettes, crabe, homard ou mollusques ?",
    },
  },
  {
    id: "no-gluten",
    label: "No Gluten",
    negativePrompt:
      "Exclude wheat, barley, rye, and hidden gluten sources such as roux, soy sauce, beer, or breading.",
    hiddenRisks: [
      "roux-thickened sauces",
      "soy sauce",
      "beer marinades",
      "breading",
      "flour-dusted fryer items",
    ],
    unsafeIfPresent: ["wheat", "barley", "rye", "roux", "soy sauce", "beer", "breading"],
    uncertainIfPossible: ["sauce thickener", "marinade", "shared fryer", "crispy garnish"],
    script: {
      en: "Is this dish gluten-free, including any roux, soy sauce, beer, marinade, or breading?",
      fr: "Ce plat est-il sans gluten, y compris roux, sauce soja, bière, marinade ou panure ?",
    },
  },
];

export function getCriterionById(id: string): Criterion | undefined {
  return CRITERIA.find((c) => c.id === id);
}
