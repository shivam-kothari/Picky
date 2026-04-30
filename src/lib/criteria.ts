export type InterrogatorScript = {
  en: string;
  fr: string;
  es: string;
  hi: string;
  zh: string;
  ja: string;
  ar: string;
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
      es: "¿Este plato está preparado sin ningún producto de origen animal, incluyendo mantequilla, crema, huevos, miel o caldo animal?",
      hi: "क्या यह व्यंजन किसी भी पशु उत्पाद के बिना बनाया गया है — जिसमें मक्खन, क्रीम, अंडे, शहद या पशु शोरबा शामिल है?",
      zh: "这道菜是否不含任何动物产品——包括黄油、奶油、鸡蛋、蜂蜜或动物高汤？",
      ja: "この料理にはバター、クリーム、卵、はちみつ、動物性の出汁を含め、動物性食品は一切使われていませんか？",
      ar: "هل هذا الطبق محضّر بدون أي منتجات حيوانية — بما في ذلك الزبدة والقشدة والبيض والعسل والمرق الحيواني؟",
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
      es: "¿Puede confirmar que este plato no contiene carne, pollo, pescado, mariscos ni caldo de carne?",
      hi: "क्या आप पुष्टि कर सकते हैं कि इस व्यंजन में कोई मांस, मुर्गी, मछली, शेलफिश या मांस-आधारित शोरबा नहीं है?",
      zh: "请问这道菜是否不含任何肉类、家禽、鱼类、贝类或肉汤？",
      ja: "この料理に肉、鶏肉、魚、貝類、または肉ベースの出汁が含まれていないことを確認できますか？",
      ar: "هل يمكنك التأكد من أن هذا الطبق لا يحتوي على لحوم أو دواجن أو أسماك أو مأكولات بحرية أو مرق لحم؟",
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
      es: "¿Este plato no contiene cereales, lácteos, legumbres ni azúcares refinados?",
      hi: "क्या यह व्यंजन अनाज, डेयरी, दालों और परिष्कृत शर्करा से मुक्त है?",
      zh: "这道菜是否不含谷物、乳制品、豆类和精制糖？",
      ja: "この料理は穀物、乳製品、豆類、精製糖を含んでいませんか？",
      ar: "هل هذا الطبق خالٍ من الحبوب ومنتجات الألبان والبقوليات والسكريات المكررة؟",
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
      es: "¿Este plato contiene cereales, vegetales con almidón o azúcar añadido?",
      hi: "क्या इस व्यंजन में कोई अनाज, स्टार्चयुक्त सब्जियां या अतिरिक्त चीनी है?",
      zh: "这道菜是否含有谷物、淀粉类蔬菜或添加糖？",
      ja: "この料理に穀物、でんぷん質の野菜、または砂糖は含まれていますか？",
      ar: "هل يحتوي هذا الطبق على حبوب أو خضروات نشوية أو سكر مضاف؟",
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
      es: "¿Este plato contiene cerdo, mariscos o una mezcla de carne y lácteos en su preparación?",
      hi: "क्या इस व्यंजन में सूअर का मांस, शेलफिश, या मांस और डेयरी का मिश्रण है?",
      zh: "这道菜是否含有猪肉、贝类，或在制作过程中混合了肉和乳制品？",
      ja: "この料理に豚肉、貝類、または肉と乳製品の組み合わせは含まれていますか？",
      ar: "هل يحتوي هذا الطبق على لحم خنزير أو مأكولات بحرية أو مزيج من اللحم ومنتجات الألبان؟",
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
      es: "¿Este plato se cocina sin carne, pollo, pescado, manteca o caldo de carne como fondo de ternera?",
      hi: "क्या यह व्यंजन बिना किसी मांस, मुर्गी, मछली, चर्बी या मांस-आधारित शोरबा के बनाया गया है?",
      zh: "这道菜是否不使用任何肉类、家禽、鱼类、猪油或肉汤（如小牛高汤）烹制？",
      ja: "この料理は肉、鶏肉、魚、ラード、またはフォン・ド・ヴォーなどの肉ベースのだしを使わずに調理されていますか？",
      ar: "هل هذا الطبق مطهو بدون أي لحوم أو دواجن أو أسماك أو شحم حيواني أو مرق لحم؟",
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
      es: "¿Puede verificar que nada en este plato — incluyendo las salsas — lleve mantequilla, crema, leche o queso?",
      hi: "क्या आप जांच सकते हैं कि इस व्यंजन में — सॉस सहित — मक्खन, क्रीम, दूध या पनीर नहीं है?",
      zh: "请问这道菜（包括酱料）是否不含黄油、奶油、牛奶或奶酪？",
      ja: "この料理のソースを含め、バター、クリーム、牛乳、チーズが使われていないか確認していただけますか？",
      ar: "هل يمكنك التأكد من أن لا شيء في هذا الطبق — بما في ذلك الصلصات — يحتوي على زبدة أو قشدة أو حليب أو جبن؟",
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
      es: "¿Este plato contiene cacahuetes, aceite de cacahuete, o se fríe en una freidora que también usa aceite de cacahuete?",
      hi: "क्या इस व्यंजन में मूंगफली, मूंगफली का तेल है, या यह मूंगफली के तेल में तली जाने वाली चीजों के साथ तला गया है?",
      zh: "这道菜是否含有花生、花生油，或是在同时使用花生油的炸锅中烹制的？",
      ja: "この料理にピーナッツやピーナッツオイルは含まれていますか？また、ピーナッツオイルを使用するフライヤーで調理されていますか？",
      ar: "هل يحتوي هذا الطبق على فول سوداني أو زيت فول سوداني، أو يُقلى في مقلاة تستخدم زيت الفول السوداني؟",
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
      es: "¿Este plato se prepara lejos de mariscos, y la salsa o caldo contiene camarones, cangrejo, langosta o moluscos?",
      hi: "क्या यह व्यंजन शेलफिश से अलग तैयार किया गया है, और क्या सॉस या शोरबा में झींगा, केकड़ा, लॉबस्टर या मोलस्क है?",
      zh: "这道菜是否远离贝类制作？酱汁或高汤中是否含有虾、蟹、龙虾或软体动物？",
      ja: "この料理は甲殻類から離れて調理されていますか？ソースや出汁にエビ、カニ、ロブスター、貝類は含まれていますか？",
      ar: "هل هذا الطبق محضّر بعيداً عن المأكولات البحرية؟ وهل تحتوي الصلصة أو المرق على روبيان أو سلطعون أو جراد البحر أو رخويات؟",
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
      es: "¿Este plato es libre de gluten, incluyendo roux, salsa de soja, cerveza, marinada o empanizado?",
      hi: "क्या यह व्यंजन ग्लूटेन-मुक्त है, जिसमें रू, सोया सॉस, बीयर, मैरिनेड या ब्रेडिंग शामिल है?",
      zh: "这道菜是否不含麸质——包括面糊、酱油、啤酒、腌料或面包糠？",
      ja: "この料理はルー、醤油、ビール、マリネ、パン粉を含め、グルテンフリーですか？",
      ar: "هل هذا الطبق خالٍ من الغلوتين، بما في ذلك الرو وصلصة الصويا والبيرة والتتبيلة والبقسماط؟",
    },
  },
];

export function getCriterionById(id: string): Criterion | undefined {
  return CRITERIA.find((c) => c.id === id);
}
