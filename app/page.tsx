"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/Archive/lib/supabase";

type Recipe = {
  id: string;
  title: string;
  image?: string;
  ingredients: string[];
  steps: string[];
  cookTime?: string;
  servings?: string;
  category?: string;
  sourceUrl?: string;
  isFavorite?: boolean;
  isPlanningQueue?: boolean;
  createdAt: string;
  type?: "recipe" | "grocery";
brand?: string;
packageSize?: string;
pantryQuantity?: number;
source?: "recipe" | "shopping_list" | "leftovers";
price?: string;
};


type PlannedRecipe = Recipe & {
  parentMealPlanId?: string;
  mealPlanId: string;
  plannedDate?: string;
  isMade?: boolean;
  weekStart?: string;
  week_start?: string;
};

type PantryItem = {
  id: string;
  name: string;
  quantity: string;
  unit?: string;
  category: string;
  createdAt: string;
  brand?: string;
  packageSize?: string;
  image?: string;
  sourceUrl?: string;
  price?: string;
};

type ShoppingItem = {
  id: string;
  name: string;
  storeSection?: string;
  sourceMealPlanId?: string;
  brand?: string;
  packageSize?: string;
  image?: string;
  sourceUrl?: string;
  price?: string;
};

type SavedUserData = {
  recipes: Recipe[];
  shoppingList: string[];
  mealPlan: Record<string, PlannedRecipe[]>;
  pantryItems: PantryItem[];
  
};



const meals = ["Breakfast", "Lunch", "Dinner"];
const placeholderImage = "https://placehold.co/1200x800/f8efe6/a63a0a?text=Hey+Chef";

const sampleRecipes: Recipe[] = [
  {
    id: "sample-tostadas",
    title: "Avocado & Black Bean Tostadas",
    image:
      "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1200&q=80",
    ingredients: [
      "2 ripe avocados",
      "1 lime, juiced",
      "1 can black beans, drained and rinsed",
      "8 tostada shells",
      "2 cups shredded cabbage",
      "1/4 cup chopped cilantro",
      "Salt and pepper to taste",
    ],
    steps: [
      "Mash avocados with lime juice, salt, and pepper.",
      "Warm black beans in a saucepan over medium heat.",
      "Spread beans over tostada shells.",
      "Top with avocado mixture, cabbage, and cilantro.",
      "Serve immediately.",
    ],
    cookTime: "20 min",
    servings: "4 servings",
    category: "Main Dish",
    sourceUrl:
      "https://cooking.nytimes.com/recipes/1027324-avocado-black-bean-tostadas",
    isFavorite: false,
    createdAt: new Date().toISOString(),
  },

  {
    id: "sample-green-beans",
    title: "Green Bean Salad with Dill Pickles & Feta",
    image:
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80",
    ingredients: [
      "1 lb fresh green beans",
      "1/2 cup chopped dill pickles",
      "1/2 cup crumbled feta cheese",
      "2 tbsp fresh dill",
      "2 tbsp olive oil",
      "1 tbsp white wine vinegar",
      "Salt and pepper to taste",
    ],
    steps: [
      "Blanch green beans until tender-crisp.",
      "Drain and cool completely.",
      "Whisk olive oil and vinegar together.",
      "Toss green beans with pickles, dill, feta, and dressing.",
      "Season and serve.",
    ],
    cookTime: "15 min",
    servings: "4 servings",
    category: "Side Dish",
    sourceUrl:
      "https://cooking.nytimes.com/recipes/1025454-green-bean-salad-with-dill-pickles-and-feta",
    isFavorite: false,
    createdAt: new Date().toISOString(),
  },

  {
    id: "sample-pancakes",
    title: "Sorghum Lemon Ricotta Pancakes",
    image:
      "https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=1200&q=80",
    ingredients: [
      "1 cup sorghum flour",
      "2 tsp baking powder",
      "2 large eggs",
      "2 tbsp lemon juice",
      "1 tbsp lemon zest",
      "3/4 cup milk",
      "1/2 cup ricotta cheese",
      "1 tbsp maple syrup",
    ],
    steps: [
      "Whisk together sorghum flour and baking powder.",
      "In a separate bowl whisk eggs, milk, ricotta, lemon juice, and zest.",
      "Combine wet and dry ingredients until just mixed.",
      "Let batter rest for 5 minutes.",
      "Cook pancakes on a lightly greased skillet until golden brown.",
    ],
    cookTime: "25 min",
    servings: "4 servings",
    category: "Breakfast",
    sourceUrl:
      "https://www.sorghumcheckoff.com/recipes/sorghum-lemon-ricotta-pancakes/",
    isFavorite: false,
    createdAt: new Date().toISOString(),
  },
];

function getHomeMenuLabel(day: "today" | "tomorrow") {
  const date = new Date();

  if (day === "tomorrow") {
    date.setDate(date.getDate() + 1);
  }

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
function getWeekStartDate(week: "current" | "next") {
  const today = new Date();

  const monday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const diff = monday.getDay() === 0 ? -6 : 1 - monday.getDay();
  monday.setDate(monday.getDate() + diff);

  if (week === "next") {
    monday.setDate(monday.getDate() + 7);
  }

  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, "0");
  const day = String(monday.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
function addDays(dateString: string, days: number) {
  const date = new Date(dateString + "T00:00:00");
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

function getCurrentWeekLabel() {
  const today = new Date();

  const monday = new Date(today);
  const diff = today.getDay() === 0 ? -6 : 1 - today.getDay();
  monday.setDate(today.getDate() + diff);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return `${monday.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} – ${sunday.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}`;
}
function cleanPantryDisplayName(text: string) {
  return text
    .replace(/\(.*?\)/g, "")
    .replace(/^\s*[\d¼½¾⅓⅔⅛⅜⅝⅞\s/.-]+/g, "")
    .replace(/^(cups?|cup|tbsp|tablespoons?|teaspoons?|tsp|ounces?|ounce|oz|grams?|g|ml|cans?|can)\s+/i, "")
    .replace(/^(small|large|medium)\s+/i, "")
    .trim();
}
function normalizeItemName(text?: string | null) {
  return String(text || "")
    .toLowerCase()
    .replace(/-/g, " ")
    .split(",")[0]
    .replace(/[()]/g, " ")
    .replace(/\bor\b/g, " ")

    // remove recipe fluff
    .replace(/other sandwich toppings?.*/g, "")
    .replace(/sandwich toppings?.*/g, "")

    .replace(
      /\b\d+|cups?|cup|tbsp|tablespoons?|teaspoons?|tsp|ounces?|ounce|oz|grams?|gram|g|kg|ml|l|liters?|cans?|can|packages?|package|packs?|pack|boxes?|box|bags?|bag|containers?|container|cartons?|carton|jars?|jar|bottles?|bottle|loaves?|loaf|bunches?|bunch|heads?|head|cloves?|clove|sticks?|stick|pounds?|pound|lbs?|lb|small|large|medium|extra|fresh|freshly|organic|each|kroger|simple truth|private selection\b/g,
      " "
    )
    .replace(
      /\b(vegan|dairy[- ]free|plant[- ]based|plant|chopped|diced|sliced|minced|shredded|grated|julienned|juiced|peeled|seeded|crushed|ground|whole|halved|quartered|thinly|thickly|finely|coarsely|boneless|skinless|cooked|uncooked|frozen|thawed|drained|rinsed|optional|divided|to taste|for garnish|leaves|leaf)\b/g,
      " "
    )
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getUpcomingWeekLabel() {
  const today = new Date();
  const day = today.getDay();
  const daysUntilNextMonday = day === 0 ? 1 : 8 - day;

  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilNextMonday);

  const nextSunday = new Date(nextMonday);
  nextSunday.setDate(nextMonday.getDate() + 6);

  return `${nextMonday.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} – ${nextSunday.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}`;
}

export default function Home() {
  
  const [userEmail, setUserEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [signupName, setSignupName] = useState("");
  const [userCreatedAt, setUserCreatedAt] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [hasLoadedUser, setHasLoadedUser] = useState(false);

  const [plan, setPlan] = useState("free");
  const [foundingChef, setFoundingChef] = useState(false);
  const [lifetimePremium, setLifetimePremium] = useState(false);
  const [supportedAt, setSupportedAt] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState<
  "home" | "recipes" | "planner" | "shopping" | "pantry" | "profile"
>("home");

  const [showTomorrow, setShowTomorrow] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showFoodImport, setShowFoodImport] = useState(false);
  const [foodPreview, setFoodPreview] = useState<any>(null);
  const [showShoppingImport, setShowShoppingImport] = useState(false);
  const [isAddingShoppingItem, setIsAddingShoppingItem] = useState(false);
  const [foodUrl, setFoodUrl] = useState("");
  const [foodBrand, setFoodBrand] = useState("");
  const [foodTitle, setFoodTitle] = useState("");
  const [foodPackageSize, setFoodPackageSize] = useState("");
  const [foodCategory, setFoodCategory] = useState("Frozen Food");
  const [foodImage, setFoodImage] = useState("");
  const importSectionRef = useRef<HTMLElement>(null);
  const [recipeUrl, setRecipeUrl] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showAllRecipes, setShowAllRecipes] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [shoppingList, setShoppingList] = useState<string[]>([])
  const [shoppingItemImages, setShoppingItemImages] = useState<Record<string, string>>({});
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [shoppingItemCategories, setShoppingItemCategories] = useState<Record<string, string>>({});

  const [showMealPlanner, setShowMealPlanner] = useState(false);
  const [mealPlan, setMealPlan] = useState<Record<string, PlannedRecipe[]>>({})
  const [activePlannerWeek, setActivePlannerWeek] = useState<"current" | "next">("current");

  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [showManualImport, setShowManualImport] = useState(false);
  const [manualRecipe, setManualRecipe] = useState("");
  

  const [selectedDay, setSelectedDay] = useState("Monday");
  const [selectedMeal, setSelectedMeal] = useState("Dinner");
  const [plannerDay, setPlannerDay] = useState("");
  const [plannerMeal, setPlannerMeal] = useState("Dinner");
  const [plannerRecipeId, setPlannerRecipeId] = useState("");
  const [plannerShoppingItemId, setPlannerShoppingItemId] = useState("");
  const [plannerLeftoverId, setPlannerLeftoverId] = useState("");
  const [plannerPopup, setPlannerPopup] = useState<{
  day: string;
  meal: string;
} | null>(null);
  const [isEditingRecipe, setIsEditingRecipe] = useState(false);
  const [editRecipeDraft, setEditRecipeDraft] = useState<Recipe | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [foodTypeFilter, setFoodTypeFilter] = useState<
  "all" | "recipe" | "grocery"
>("all");
  const [recipeSort, setRecipeSort] = useState("newest");

  const [shoppingItemUrls, setShoppingItemUrls] = useState<Record<string, string>>({});
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [hidePantryItems, setHidePantryItems] = useState(true);
  const [pantrySearch, setPantrySearch] = useState("");
  const [expandedPantryCategory, setExpandedPantryCategory] = useState<string | null>("all");
  const [editingPantryItemId, setEditingPantryItemId] = useState<string | null>(null);
  const [isBulkEditingPantry, setIsBulkEditingPantry] = useState(false);
  const [pantryDrafts, setPantryDrafts] = useState<Record<string, PantryItem>>({});
  const [newShoppingItem, setNewShoppingItem] = useState("");
  const [lastAddedShoppingItem, setLastAddedShoppingItem] = useState<any>(null);
  const [newPantryItem, setNewPantryItem] = useState("");
  const [newPantryQuantity, setNewPantryQuantity] = useState("");
  const [newPantryCategory, setNewPantryCategory] = useState("Other");
  const [newPantryUnit, setNewPantryUnit] = useState("");
  const [showPantryModal, setShowPantryModal] = useState(false);
  const [pantrySessionAddCount, setPantrySessionAddCount] = useState(0);
  const [recentlyAddedPantryId, setRecentlyAddedPantryId] = useState<string | null>(null);
  const [pantryModalItem, setPantryModalItem] = useState("");
  const [pantryModalImage, setPantryModalImage] = useState("");
  const [pantryModalSourceUrl, setPantryModalSourceUrl] = useState("");
  const [editingPantryModalId, setEditingPantryModalId] = useState<string | null>(null);
  const [originalPantrySourceUrl, setOriginalPantrySourceUrl] = useState("");
  const [pantryModalShoppingItem, setPantryModalShoppingItem] = useState("");
  const [pantryModalQuantity, setPantryModalQuantity] = useState("1");
  const [pantryModalUnit, setPantryModalUnit] = useState("");
  const [pantryModalCategory, setPantryModalCategory] = useState("Other");
  const [addAnotherPantryItem, setAddAnotherPantryItem] = useState(false);
  const [manuallyMarkedOnHand, setManuallyMarkedOnHand] = useState<string[]>([]);
  const [checkedShoppingItems, setCheckedShoppingItems] = useState<string[]>([]);
  const [checkedRecipeIngredients, setCheckedRecipeIngredients] = useState<string[]>([]);
  const [buyAnywayItems, setBuyAnywayItems] = useState<string[]>([]);
  const [shoppingSort, setShoppingSort] = useState("az");
  const [showPantry, setShowPantry] = useState(false);
  const [pantryCategoryFilter, setPantryCategoryFilter] = useState("all");
  const [pantrySort, setPantrySort] = useState("newest");
  const [cookingQueueFilter, setCookingQueueFilter] = useState("all");
  const [showAllCookingQueue, setShowAllCookingQueue] = useState(false);
  const [recentlyMade, setRecentlyMade] = useState<any[]>([]);
  const [showAllRecentlyMade, setShowAllRecentlyMade] = useState(false);

  const [loginPassword, setLoginPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [authError, setAuthError] = useState("");
  const [sampleRecipe, setSampleRecipe] = useState<Recipe | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const settingsRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [dismissedRestockItems, setDismissedRestockItems] = useState<string[]>([]);


  const neededShoppingListCount = shoppingList.filter((item) => {
    const matchingPantryItem = getMatchingPantryItem(item);
    const isManuallyMarkedOnHand = manuallyMarkedOnHand.includes(item);

  return !matchingPantryItem && !isManuallyMarkedOnHand;
}).length;


const cookingQueue = Object.values(mealPlan)
  .flat()
  .filter((recipe: PlannedRecipe) => !recipe.isMade)
  .filter((recipe: PlannedRecipe) => {
    const isReady = canMakeRecipeFromPantry(recipe);
const neededCount = recipe.type === "grocery"
  ? isReady ? 0 : 1
  : getRecipePantryGaps(recipe).length;

if (cookingQueueFilter === "ready") return isReady;
if (cookingQueueFilter === "needs") return !isReady;

    return true;
  })
  .sort((a: PlannedRecipe, b: PlannedRecipe) => {
    if (a.isMade !== b.isMade) {
      return a.isMade ? 1 : -1;
    }

    return (
      new Date(a.plannedDate || "").getTime() -
      new Date(b.plannedDate || "").getTime()
    );
  });

  const favoriteRecipes = recipes.filter((recipe) => recipe.isFavorite);
  const homeRecipes = recipes
  .filter((recipe) => recipe.isFavorite)
  .slice(-6)
  .reverse();
  const homeSectionTitle = favoriteRecipes.length > 0 ? "Favorite Recipes" : "Recent Recipes";
  const ingredientCounts = recipes
  .flatMap((recipe) => recipe.ingredients)
  .map((ingredient) => cleanPantryDisplayName(ingredient))
  .filter(Boolean)
  .reduce((counts: Record<string, number>, ingredient) => {
    counts[ingredient] = (counts[ingredient] || 0) + 1;
    return counts;
  }, {});

  function cleanIngredientName(name: string) {
  return name
    .replace(/^packed\s+/i, "")
    .replace(/^light\s+/i, "")
    .replace(/^dark\s+/i, "")
    .replace(/^table\s+/i, "")
    .replace(/^freshly baked\s+/i, "")
    .replace(/^thick-cut\s+/i, "")
    .replace(/^loaf\s+/i, "")
    .replace(/^to\s+\d+\s+slices?\s+/i, "")
    .replace(/\)/g, "")
    .replace(/\(/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const mostUsedIngredients = Object.entries(ingredientCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 3);

const readyToCookRecipes = recipes.filter((recipe) =>
  recipe.ingredients.some((ingredient) => getMatchingPantryItem(ingredient))
).length;

const missingFromFavorites = favoriteRecipes
  .flatMap((recipe) => recipe.ingredients)
  .map((ingredient) => cleanPantryDisplayName(ingredient))
  .filter((ingredient) => !getMatchingPantryItem(ingredient))
  .filter((ingredient, index, array) => array.indexOf(ingredient) === index)
  .slice(0, 3);


  const plannedIngredients = Object.values(mealPlan)
  .flat()
  .flatMap((recipe: any) => recipe.ingredients || []);

const smartRestockItems = [
  ...favoriteRecipes.flatMap((recipe) => recipe.ingredients || []),
  ...plannedIngredients,
]
  .map((ingredient) => cleanPantryDisplayName(ingredient))
  .map((item) => cleanIngredientName(item))
  .map((item) =>
    item
      .replace(/Fresh /gi, "")
      .replace(/Frozen /gi, "")
      .replace(/Or .*$/gi, "")
      .replace(/,.*$/g, "")
      .trim()
  )
  .filter(Boolean)
  .filter((item, index, array) => array.indexOf(item) === index)
  .filter((item) => {
    const cleanedSuggestion = normalizeItemName(item);

    const alreadyInPantry = pantryItems.some((pantryItem) => {
      const cleanedPantryItem = normalizeItemName(pantryItem.name);

      return (
        cleanedPantryItem.includes(cleanedSuggestion) ||
        cleanedSuggestion.includes(cleanedPantryItem)
      );
    });

    const alreadyInShoppingList = shoppingList.some((shoppingItem) => {
      const cleanedShoppingItem = normalizeItemName(shoppingItem);

      return (
        cleanedShoppingItem.includes(cleanedSuggestion) ||
        cleanedSuggestion.includes(cleanedShoppingItem)
      );
    });

    return !alreadyInPantry && !alreadyInShoppingList;
  })
  .filter((item) => !dismissedRestockItems.includes(item))
  .slice(0, 8);
  
  const filteredRecipes = recipes
  .filter((recipe) => {
  if (foodTypeFilter === "all") return true;

  if (foodTypeFilter === "recipe") {
    return recipe.type !== "grocery";
  }

  return recipe.type === "grocery";
})
  .filter((recipe) =>
    categoryFilter === "all"
      ? true
      : recipe.category === categoryFilter
  )
  .filter((recipe) => {
    if (recipeSort !== "ready") return true;

    return canMakeRecipeFromPantry(recipe);
  })
  .filter((recipe) => {
  if (recipe.type !== "grocery") return true;

  const isAlreadyInShoppingList = shoppingList.some(
    (item) =>
      normalizeItemName(item) === normalizeItemName(recipe.title) ||
      normalizeItemName(item).includes(normalizeItemName(recipe.title)) ||
      normalizeItemName(recipe.title).includes(normalizeItemName(item))
  );

  return !isAlreadyInShoppingList;
})
  .sort((a, b) => {
    if (recipeSort === "az") {
      return a.title.localeCompare(b.title);
    }

    if (recipeSort === "za") {
      return b.title.localeCompare(a.title);
    }

    if (recipeSort === "newest") {
      return (
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
      );
    }

    if (recipeSort === "oldest") {
      return (
        new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime()
      );
    }

    if (a.isFavorite !== b.isFavorite) {
      return a.isFavorite ? -1 : 1;
    }

    return (
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
    );
  });
function getMealPlanKey(day: string, meal: string, week = activePlannerWeek) {
  return `${week}-${day}-${meal}`;
}

const totalSlots = 21;

const currentWeekStart = getWeekStartDate("current");
const nextWeekStart = getWeekStartDate("next");

const currentWeekFilledSlots = Object.values(mealPlan)
  .flat()
  .filter((recipe: any) => recipe.weekStart === currentWeekStart)
  .length;

const nextWeekFilledSlots = Object.values(mealPlan)
  .flat()
  .filter((recipe: any) => recipe.weekStart === nextWeekStart)
  .length;

const filledSlots =
  activePlannerWeek === "next"
    ? nextWeekFilledSlots
    : currentWeekFilledSlots;

const plannerPercent = Math.round((filledSlots / totalSlots) * 100);

const selectedWeekStart =
  activePlannerWeek === "next" ? nextWeekStart : currentWeekStart;

const plannerDays = [
  { label: "Monday", date: addDays(selectedWeekStart, 0) },
  { label: "Tuesday", date: addDays(selectedWeekStart, 1) },
  { label: "Wednesday", date: addDays(selectedWeekStart, 2) },
  { label: "Thursday", date: addDays(selectedWeekStart, 3) },
  { label: "Friday", date: addDays(selectedWeekStart, 4) },
  { label: "Saturday", date: addDays(selectedWeekStart, 5) },
  { label: "Sunday", date: addDays(selectedWeekStart, 6) },
];

const todayLocal = new Date();
const localDateString = `${todayLocal.getFullYear()}-${String(
  todayLocal.getMonth() + 1
).padStart(2, "0")}-${String(todayLocal.getDate()).padStart(2, "0")}`;

const homeMenuDate = addDays(
  localDateString,
  showTomorrow ? 1 : 0
);

const homeMenuWeek =
  homeMenuDate >= nextWeekStart ? "next" : "current";

useEffect(() => {
  const saved = localStorage.getItem("hey-chef-on-hand-items");

  if (saved) {
    setManuallyMarkedOnHand(JSON.parse(saved));
  }
}, []);

useEffect(() => {
  localStorage.setItem(
    "hey-chef-on-hand-items",
    JSON.stringify(manuallyMarkedOnHand)
  );
}, [manuallyMarkedOnHand]);

useEffect(() => {
  const saved = localStorage.getItem("hey-chef-checked-recipe-ingredients");

  if (saved) {
    setCheckedRecipeIngredients(JSON.parse(saved));
  }
}, []);

useEffect(() => {
  localStorage.setItem(
    "hey-chef-checked-recipe-ingredients",
    JSON.stringify(checkedRecipeIngredients)
  );
}, [checkedRecipeIngredients]);

useEffect(() => {
  supabase.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") {
      setIsResettingPassword(true);
    }
  });
}, []);
useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as Node;

    if (
      settingsRef.current &&
      !settingsRef.current.contains(target)
    ) {
      setShowSettingsMenu(false);
    }

    if (
      mobileMenuRef.current &&
      !mobileMenuRef.current.contains(target)
    ) {
      setIsMenuOpen(false);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);
  useEffect(() => {
    const savedUser = localStorage.getItem("hey-chef-current-user");

    if (savedUser) {
      loadUser(savedUser);
    }
  }, []);
useEffect(() => {
  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

const { data, error } = await supabase
  .from("profiles")
  .select(`
    display_name,
    founding_chef,
    lifetime_premium,
    supported_at
  `)
  .eq("id", user.id)
  .single();

if (error) {
  console.error(error);
  return;
}

setDisplayName(data?.display_name || "");
setFoundingChef(Boolean(data?.founding_chef));
setLifetimePremium(Boolean(data?.lifetime_premium));
setSupportedAt(data?.supported_at || null);

    setDisplayName(data?.display_name || "");
  }

  if (userEmail) {
    loadProfile();
  }
}, [userEmail]);
  useEffect(() => {
  async function loadSession() {
    const {
  data: { user },
} = await supabase.auth.getUser();

setUserCreatedAt(user?.created_at || "");
    const {
      data: { session },
    } = await supabase.auth.getSession();
    

    if (session?.user?.email) {
      setUserEmail(session.user.email);
      setHasLoadedUser(true);
    } else {
      setUserEmail("");
      setHasLoadedUser(true);
    }
  }

  loadSession();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user?.email) {
      setUserEmail(session.user.email);
      setHasLoadedUser(true);
    } else {
      setUserEmail("");
      setHasLoadedUser(true);
      setRecipes([]);
    }
  });
  

  return () => subscription.unsubscribe();
}, []);

  function loadUser(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const savedData = localStorage.getItem(`hey-chef-data-${normalizedEmail}`);

    if (savedData) {
      const parsed: SavedUserData = JSON.parse(savedData);
      setRecipes(parsed.recipes || []);
setMealPlan(parsed.mealPlan || {});
setPantryItems(
  (parsed.pantryItems || []).map((item) => ({
    ...item,
    category: item.category || "Other",
  }))
);
    } else {
  setRecipes([]);
  setMealPlan({});
  setPantryItems([]);
  setPlannerRecipeId("");
}

    setUserEmail(normalizedEmail);
    localStorage.setItem("hey-chef-current-user", normalizedEmail);
    setHasLoadedUser(true);
  }

 useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const sharedText = params.get("text");
  const sharedUrl = params.get("url");

  if (!sharedText && !sharedUrl) return;

  setCurrentPage("recipes");
  setShowImport(true);
  setShowManualImport(true);

  setShowAllRecipes(false);
  setShowMealPlanner(false);
  setShowShoppingList(false);
  setShowPantry(false);
  setSelectedRecipe(null);

  if (sharedText) {
    setManualRecipe(sharedText);
  }

  if (sharedUrl) {
    setRecipeUrl(sharedUrl);
  }

  const action = params.get("action");
const page = params.get("page");

if (action === "add-recipe") {
  setCurrentPage("recipes");
  setShowImport(true);
}

if (page === "planner") {
  setCurrentPage("planner");
}

if (page === "shopping") {
  setCurrentPage("shopping");
}

if (page === "pantry") {
  setCurrentPage("pantry");
}

  window.history.replaceState({}, "", "/");
}, []);

  useEffect(() => {
  async function loadRecipes() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setRecipes(
      (data || []).map((recipe) => ({
        id: recipe.id,
        title: recipe.title,
        image: recipe.image_url || "",
        ingredients: recipe.ingredients || [],
        steps: recipe.steps || [],
        cookTime: recipe.cook_time || "",
        servings: recipe.servings || "",
        category: recipe.category || "",
        sourceUrl: recipe.source_url || "",
        isFavorite: recipe.is_favorite || false,
        isPlanningQueue: recipe.is_planning_queue || false,
        createdAt: recipe.created_at,
        type: recipe.type || "recipe",
brand: recipe.brand || "",
packageSize: recipe.package_size || "",
      }))
    );
  }

  if (userEmail) {
    loadRecipes();
  }
}, [userEmail]);

async function loadShoppingItems() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data, error } = await supabase
    .from("shopping_items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const normalizedNames = [...new Set(
    (data || []).map((item) => normalizeItemName(item.name))
  )];

  const { data: imageMemory, error: imageMemoryError } = await supabase
    .from("ingredient_images")
    .select("normalized_name, image_url, source_url")
    .eq("user_id", user.id)
    .in("normalized_name", normalizedNames);

  if (imageMemoryError) {
    console.error(imageMemoryError);
  }

  const imageMemoryMap = new Map(
    (imageMemory || []).map((item) => [item.normalized_name, item])
  );
  function getImageMemoryForItem(itemName: string) {
  const cleanedItem = normalizeItemName(itemName);

  return (
    imageMemoryMap.get(cleanedItem) ||
    (imageMemory || []).find((memory) => {
      const cleanedMemory = normalizeItemName(memory.normalized_name);

      return (
        cleanedItem.includes(cleanedMemory) ||
        cleanedMemory.includes(cleanedItem)
      );
    })
  );
}

  setShoppingList((data || []).map((item) => item.name));
  setBuyAnywayItems(
  (data || [])
    .filter((item) => item.buy_anyway)
    .map((item) => item.name)
);

  setShoppingItemImages(
    (data || []).reduce((images, item) => {
      const memory = getImageMemoryForItem(item.name);

      images[item.name] = item.image_url || memory?.image_url || "";

      return images;
    }, {} as Record<string, string>)
  );

  setShoppingItemUrls(
    (data || []).reduce((urls, item) => {
      const memory = getImageMemoryForItem(item.name);

      urls[item.name] = item.source_url || memory?.source_url || "";

      return urls;
    }, {} as Record<string, string>)
  );

  setShoppingItemCategories(
  (data || []).reduce((categories, item) => {
    categories[item.name] = item.store_section || guessShoppingCategory(item.name);
    return categories;
  }, {} as Record<string, string>)
);

  setCheckedShoppingItems(
    (data || [])
      .filter((item) => item.is_checked)
      .map((item) => item.id)
  );
}

useEffect(() => {
  async function loadPantry() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("pantry_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setPantryItems(
  (data || []).map((item) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity || "",
    unit: item.unit || "",
    category: item.category || "Other",
    createdAt: item.created_at,

    brand: item.brand || "",
    packageSize: item.package_size || "",
    image: item.image_url || "",
    sourceUrl: item.source_url || "",
    price: item.price || "",
  }))
);
  }

  if (userEmail) {
    loadPantry();
  }
  
}, [userEmail]);
async function saveBulkPantryEdits() {
  for (const item of Object.values(pantryDrafts)) {
    if ((item as any).markedForDelete) {
      await supabase
        .from("pantry_items")
        .delete()
        .eq("id", item.id);

      continue;
    }

    await supabase
      .from("pantry_items")
      .update({
  name: item.name,
  quantity: item.quantity || "1",
  unit: item.unit || "",
  category: item.category || "Other",
  image_url: item.image || "",
  source_url: item.sourceUrl || "",
})
      .eq("id", item.id);
  }

  setPantryItems(
  Object.values(pantryDrafts)
    .filter((item: any) => !item.markedForDelete)
);

setIsBulkEditingPantry(false);
setPantryDrafts({});

showToast("Pantry updated.");
}
useEffect(() => {
  if (userEmail) {
    loadShoppingItems();
  }
}, [userEmail]);

useEffect(() => {
  async function loadMealPlan() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
  .from("meal_plan")
  .select(`
  id,
  date,
  day,
  meal,
  week,
  week_start,
  is_made,
  source,
  title,
  image_url,
  recipes (*)
`)
  .eq("user_id", user.id);

    if (error) {
  console.error(error);
  return;
}

console.log("MEAL PLAN DATA", data);

const loadedPlan: Record<string, PlannedRecipe[]> = {};

    (data || []).forEach((item: any) => {
      console.log(item.week_start);

const currentWeekStart = getWeekStartDate("current");
const nextWeekStart = getWeekStartDate("next");

let plannerWeek = item.week || "current";

if (item.week_start === currentWeekStart) {
  plannerWeek = "current";
} else if (item.week_start === nextWeekStart) {
  plannerWeek = "next";
}

const mealDate = item.date || item.day;
const key = getMealPlanKey(mealDate, item.meal, plannerWeek);

if (!loadedPlan[key]) {
  loadedPlan[key] = [];
}

if (item.source === "shopping_list" || item.source === "leftovers") {
  loadedPlan[key].push({
    id: item.recipes?.id || item.id,
    title: item.recipes?.title || item.title || "Planned item",
    image: item.recipes?.image_url || item.image_url || "",
    ingredients: item.recipes?.ingredients || [],
    steps: item.recipes?.steps || [],
    cookTime: item.recipes?.cook_time || "",
    servings: item.recipes?.servings || "",
    category: item.recipes?.category || "Prepared Food",
    sourceUrl: item.recipes?.source_url || "",
    isFavorite: item.recipes?.is_favorite || false,
    createdAt: item.recipes?.created_at || item.created_at,
    isMade: item.is_made || false,
    mealPlanId: item.id,
    plannedDate: item.day,
    weekStart: item.week_start,
    source: item.source,
    type: item.recipes?.type || "grocery",
    brand: item.recipes?.brand || "",
    packageSize: item.recipes?.package_size || "",
    price: item.recipes?.price || "",
  });

  return;
}

if (!item.recipes) return;

loadedPlan[key].push({
  id: item.recipes.id,
  title: item.recipes.title,
  image: item.recipes.image_url || "",
  ingredients: item.recipes.ingredients || [],
  steps: item.recipes.steps || [],
  cookTime: item.recipes.cook_time || "",
  servings: item.recipes.servings || "",
  category: item.recipes.category || "",
  sourceUrl: item.recipes.source_url || "",
  isFavorite: item.recipes.is_favorite || false,
  createdAt: item.recipes.created_at,
  isMade: item.is_made || false,
  mealPlanId: item.id,
  plannedDate: item.date,
  weekStart: item.week_start,
});
    });

    setMealPlan(loadedPlan);
  }

  if (userEmail) {
    loadMealPlan();
  }
}, [userEmail]);

useEffect(() => {
  if (userEmail) {
    loadRecentlyMade();
  }
}, [userEmail, showAllRecentlyMade]);


  async function loginUser(email: string, password: string, name?: string) {
  setAuthError("");

  if (!email || !password) {
    setAuthError("Enter your email and password.");
    return;
  }

  const cleanEmail = email.trim().toLowerCase();

  const { data, error } =
  authMode === "signup"
    ? await supabase.auth.signUp({
        email: cleanEmail,
        password,
      })
    : await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

if (error) {
  if (
    error.message.toLowerCase().includes("already registered") ||
    error.message.toLowerCase().includes("already exists")
  ) {
    setAuthError("Account already created. Please log in instead.");
  } else {
    setAuthError(error.message);
  }

  return;
}

  const user = data.user ?? data.session?.user;

if (authMode === "signup" && user) {
  const isGovEmail =
    cleanEmail.endsWith("@in.gov") || cleanEmail.endsWith(".gov");

  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  const { error: profileError } = await supabase.from("profiles").insert({
    id: user.id,
    email: cleanEmail,
display_name: name?.trim() || null,
plan: isGovEmail ? "gov_free" : "free",
    verified_domain: isGovEmail ? "in.gov" : null,
    domain_verified_at: isGovEmail ? new Date().toISOString() : null,
    domain_expires_at: isGovEmail ? oneYearFromNow.toISOString() : null,
  });

  if (profileError) {
    setAuthError(profileError.message);
    return;
  }
}

  setUserEmail(cleanEmail);
  setHasLoadedUser(true);
}

async function updatePassword() {
  if (!newPassword) {
    setAuthError("Enter a new password.");
    return;
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    setAuthError(error.message);
    return;
  }

  setAuthError("");
  setIsResettingPassword(false);
  setNewPassword("");
  showToast("Password updated. You can log in now.");
}
async function changePasswordNow() {
  const password = prompt("Enter your new password:");

  if (!password) return;

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    showToast(error.message);
    return;
  }

  showToast("Password updated.");
}

  async function logoutUser() {
  await supabase.auth.signOut();

  setUserEmail("");
  setHasLoadedUser(false);

  setRecipes([]);
  setMealPlan({});
  setSelectedRecipe(null);

  setShowMealPlanner(false);
  setShowShoppingList(false);
  setShowAllRecipes(false);

  setLoginEmail("");
  setLoginPassword("");

  localStorage.removeItem("hey-chef-current-user");
}


async function importFoodItem() {
  if (!foodUrl.trim()) {
    showToast("Paste a product URL first.");
    return;
  }

  setIsImporting(true);
  setImportError("");

  try {
    const response = await fetch("/api/import-food", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: foodUrl }),
    });

    const data = await response.json();

    if (!response.ok) {
      setImportError(data.error || "Could not import this product. Enter it manually below.");
      return;
    }

    setFoodTitle(data.title || "");
    setFoodBrand(data.brand || "");
    setFoodPackageSize(data.packageSize || "");
    setFoodCategory(data.category || "Prepared Food");
    setFoodImage(data.image || "");

    setFoodPreview({
      name: data.title || "",
      brand: data.brand || "",
      package_size: data.packageSize || "",
      price: data.price || "",
      image_url: data.image || "",
      source_url: foodUrl,
    });

    showToast("Product details imported.");
  } catch {
    setImportError("Could not import this product. Enter it manually below.");
  } finally {
    setIsImporting(false);
  }
}

async function saveFoodItem() {
  if (!foodTitle.trim()) {
    showToast("Enter a food item name.");
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    showToast("Please log in again.");
    return;
  }

  const existingFoodCard = recipes.find((recipe) => {
  if (recipe.type !== "grocery") return false;

  const existingName = normalizeItemName(recipe.title);
  const newName = normalizeItemName(foodTitle);

  return (
    existingName === newName ||
    existingName.includes(newName) ||
    newName.includes(existingName)
  );
});

if (existingFoodCard) {
  showToast("Food card already exists.");
  setSelectedRecipe(existingFoodCard);
  setShowFoodImport(false);
  return;
}

  const { data, error } = await supabase
    .from("recipes")
    .insert({
      user_id: user.id,
      title: foodTitle.trim(),
      image_url: foodImage.trim(),
      ingredients: [],
      steps: [],
      cook_time: "",
      servings: "",
      category: foodCategory,
      source_url: foodUrl.trim(),
      is_favorite: false,
      is_planning_queue: false,
      type: "grocery",
brand: foodBrand.trim(),
package_size: foodPackageSize.trim(),
    })
    .select()
    .single();

  if (error) {
    showToast(error.message);
    return;
  }

  const newFoodItem: Recipe = {
    id: data.id,
    title: data.title,
    image: data.image_url || "",
    ingredients: [],
    steps: [],
    cookTime: "",
    servings: "",
    category: data.category || foodCategory,
    sourceUrl: data.source_url || "",
    isFavorite: false,
    isPlanningQueue: false,
    createdAt: data.created_at,
    type: "grocery",
    brand: foodBrand.trim(),
    packageSize: foodPackageSize.trim(),
  };

  setRecipes([newFoodItem, ...recipes]);

  setFoodUrl("");
  setFoodBrand("");
  setFoodTitle("");
  setFoodPackageSize("");
  setFoodCategory("Frozen Food");
  setFoodImage("");
  setShowFoodImport(false);
  setFoodTypeFilter("grocery");

  showToast("Food item saved.");
}
  function createNewRecipe() {
  const newRecipe: Recipe = {
    id: "new-recipe",
    title: "",
    image: "",
    ingredients: [],
    steps: [],
    cookTime: "",
    servings: "",
    category: "",
    sourceUrl: "",
    isFavorite: false,
    isPlanningQueue: false,
    createdAt: new Date().toISOString(),
  };

  setSelectedRecipe(newRecipe);
  setEditRecipeDraft(newRecipe);
  setIsEditingRecipe(true);

  setShowAllRecipes(false);
  setShowImport(false);
  setShowMealPlanner(false);
  setShowShoppingList(false);
  setShowPantry(false);
}
function saveGuestRecipe(recipe: Recipe) {
  const existing = JSON.parse(
    localStorage.getItem("hey-chef-guest-recipes") || "[]"
  );

  localStorage.setItem(
    "hey-chef-guest-recipes",
    JSON.stringify([recipe, ...existing])
  );

  setRecipes((currentRecipes) => [recipe, ...currentRecipes]);
}
  async function importRecipe() {
  if (!recipeUrl && !manualRecipe) return;

  setIsImporting(true);
  setImportError("");
  setShowManualImport(false);

  try {
    const response = await fetch("/api/import-recipe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: recipeUrl,
        text: manualRecipe,
      }),
    });

    const text = await response.text();

    let importedData;

    try {
      importedData = JSON.parse(text);
    } catch {
      setImportError("The import route is not returning JSON.");
      setShowManualImport(true);
      return;
    }

    if (!response.ok) {
      setImportError(importedData.error || "Could not import this recipe.");
      setShowManualImport(true);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const guestRecipe: Recipe = {
        id: crypto.randomUUID(),
        title: importedData.title || "Imported Recipe",
        image: importedData.image || "",
        ingredients: importedData.ingredients || [],
        steps: importedData.steps || [],
        cookTime: importedData.cookTime || "",
        servings: importedData.servings || "",
        sourceUrl: importedData.sourceUrl || recipeUrl,
        isFavorite: false,
        isPlanningQueue: false,
        createdAt: new Date().toISOString(),
      };

      saveGuestRecipe(guestRecipe);
setSampleRecipe(guestRecipe);

      setRecipeUrl("");
      setManualRecipe("");
      setShowImport(false);
      setImportError("");
      setShowManualImport(false);

      showToast("Recipe imported. Create an account to save it permanently.");
      return;
    }

    const { data: savedRecipe, error } = await supabase
      .from("recipes")
      .insert({
        user_id: user.id,
        title: importedData.title || "Imported Recipe",
        image_url: importedData.image || "",
        ingredients: importedData.ingredients || [],
        steps: importedData.steps || [],
        cook_time: importedData.cookTime || "",
        servings: importedData.servings || "",
        source_url: importedData.sourceUrl || recipeUrl,
        is_favorite: false,
      })
      .select()
      .single();

    if (error) {
      setImportError(error.message);
      return;
    }

    const newRecipe: Recipe = {
      id: savedRecipe.id,
      title: savedRecipe.title,
      image: savedRecipe.image_url || "",
      ingredients: savedRecipe.ingredients || [],
      steps: savedRecipe.steps || [],
      cookTime: savedRecipe.cook_time || "",
      servings: savedRecipe.servings || "",
      sourceUrl: savedRecipe.source_url || "",
      isFavorite: savedRecipe.is_favorite || false,
      createdAt: savedRecipe.created_at,
    };

    setRecipes([newRecipe, ...recipes]);
    setSelectedRecipe(newRecipe);
    setPlannerRecipeId(newRecipe.id);

    setRecipeUrl("");
    setManualRecipe("");
    setShowImport(false);
    setImportError("");
    setShowManualImport(false);
  } catch (error) {
    console.error(error);
    setImportError("Something went wrong importing this recipe. Try pasting it manually.");
    setShowManualImport(true);
  } finally {
    setIsImporting(false);
  }
}


  async function importManualRecipe() {
  if (!manualRecipe) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    showToast("Please log in again.");
    return;
  }

  const lines = manualRecipe
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const recipe: Recipe = {
    id: crypto.randomUUID(),
    title: lines[0] || "Manual Recipe",
    image: "",
    ingredients: [],
    steps: [],
    sourceUrl: recipeUrl || "",
    isFavorite: false,
    createdAt: new Date().toISOString(),
  };

  let inSteps = false;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    if (
      lowerLine.includes("directions") ||
      lowerLine.includes("instructions") ||
      lowerLine.includes("steps")
    ) {
      inSteps = true;
      continue;
    }

    if (inSteps) {
      recipe.steps.push(line);
    } else {
      recipe.ingredients.push(line);
    }
  }

  const { data: savedRecipe, error } = await supabase
    .from("recipes")
    .insert({
      user_id: user.id,
      title: recipe.title,
      image_url: placeholderImage,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      source_url: recipe.sourceUrl,
      is_favorite: false,
    })
    .select()
    .single();

  if (error) {
    showToast(error.message);
    return;
  }

  const dbRecipe: Recipe = {
    id: savedRecipe.id,
    title: savedRecipe.title,
    image: savedRecipe.image_url || "",
    ingredients: savedRecipe.ingredients || [],
    steps: savedRecipe.steps || [],
    sourceUrl: savedRecipe.source_url || "",
    isFavorite: savedRecipe.is_favorite || false,
    createdAt: savedRecipe.created_at,
  };

  setRecipes([dbRecipe, ...recipes]);
  setPlannerRecipeId(dbRecipe.id);
  setManualRecipe("");
  setRecipeUrl("");
  setShowManualImport(false);
  setImportError("");
  setShowImport(false);
}

function getRecipeForShoppingItem(itemName: string) {
  return recipes.find((recipe) =>
    recipe.ingredients.some(
      (ingredient) =>
        normalizeItemName(ingredient) === normalizeItemName(itemName)
    )
  );
}

function getShoppingItemIcon(item: string) {
  const text = normalizeItemName(item);

  if (/lettuce|onion|garlic|lime|lemon|avocado|tomato|cilantro|potato|berries|grapes/.test(text)) return "🥬";
  if (/rice|pasta|bread|flour|oats|beans|tortilla/.test(text)) return "🌾";
  if (/milk|cheese|yogurt|cream|butter/.test(text)) return "🥛";
  if (/frozen|burrito|pizza|fries/.test(text)) return "❄️";
  if (/oil|vinegar|sauce|tamari|mustard|ketchup|mayo|adobo/.test(text)) return "🫙";
  if (/salt|pepper|cumin|paprika|spice|seasoning/.test(text)) return "🧂";

  return "🛒";
}


function showToast(message: string) {
  setToastMessage(message);

  setTimeout(() => {
    setToastMessage("");
  }, 2500);
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "GOOD MORNING ☀️";
  }

  if (hour < 17) {
    return "GOOD AFTERNOON 🌤️";
  }

  return "GOOD EVENING 🌙";
}

function getKitchenGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "☕ Espresso yourself.";
  }

  if (hour < 17) {
    return "🌮 Taco 'bout lunch!";
  }

  return "🥄 Whisking up something good?";
}

  async function toggleFavorite(recipeId: string) {
  const recipe = recipes.find((item) => item.id === recipeId);
  if (!recipe) return;

  const newFavoriteValue = !recipe.isFavorite;

  const { error } = await supabase
    .from("recipes")
    .update({
      is_favorite: newFavoriteValue,
    })
    .eq("id", recipeId);

  if (error) {
    showToast(error.message);
    return;
  }

  const updatedRecipes = recipes.map((item) =>
    item.id === recipeId ? { ...item, isFavorite: newFavoriteValue } : item
  );

  setRecipes(updatedRecipes);

  const updatedSelectedRecipe =
    updatedRecipes.find((item) => item.id === recipeId) || null;

  if (selectedRecipe?.id === recipeId) {
    setSelectedRecipe(updatedSelectedRecipe);
  }
}

async function togglePlanningQueue(recipeId: string) {
  const recipe = recipes.find((item) => item.id === recipeId);
  if (!recipe) return;

  const newValue = !recipe.isPlanningQueue;

  const { error } = await supabase
    .from("recipes")
    .update({
      is_planning_queue: newValue,
    })
    .eq("id", recipeId);

  if (error) {
    showToast(error.message);
    return;
  }

  const updatedRecipes = recipes.map((item) =>
    item.id === recipeId
      ? { ...item, isPlanningQueue: newValue }
      : item
  );

  setRecipes(updatedRecipes);

  if (selectedRecipe?.id === recipeId) {
    setSelectedRecipe({
      ...selectedRecipe,
      isPlanningQueue: newValue,
    });
  }
}

function getIngredientQuantity(item: string) {
  const match = item.match(
    /^(\d+(?:\.\d+)?(?:\s+\d\/\d)?|\d\/\d)\s*(cups?|cup|tbsp|tablespoons?|tsp|teaspoons?|cans?|can|lbs?|lb|pounds?|pound|oz|ounces?)?/i
  );

  return match ? match[0].trim() : "";
}

  function cleanForSort(item: string) {
  return item
    .replace(/×\s*\d+$/g, "")
    .replace(/^\d+(\s+\d\/\d|\/\d|\.\d+)?\s*/g, "")
    .replace(/^(cups?|cup|tablespoons?|tbsp|teaspoons?|tsp|pounds?|lb|ounces?|oz)\s+/i, "")
    .toLowerCase()
    .trim();
}

const shoppingCategories = [
  "Produce",
  "Refrigerated",
  "Frozen",
  "Meat & Protein",
  "Canned Goods",
  "Grains & Pasta",
  "Baking",
  "Spices",
  "Beverages",
  "Condiments",
  "Snacks",
  "Other",
];

function guessShoppingCategory(item: string) {
  const clean = normalizeItemName(item);

  if (/(lettuce|spinach|tomato|onion|garlic|pepper|apple|banana|fruit|vegetable|cilantro|avocado)/i.test(clean)) return "Produce";
  if (/(milk|cheese|yogurt|butter|cream|eggs|tofu|hummus)/i.test(clean)) return "Refrigerated";
  if (/(frozen|ice cream|pizza rolls)/i.test(clean)) return "Frozen";
  if (/(chicken|beef|pork|turkey|fish|salmon|shrimp|beans|lentils|protein)/i.test(clean)) return "Meat & Protein";
  if (/(can|canned|tomato sauce|beans|corn|soup)/i.test(clean)) return "Canned Goods";
  if (/(rice|pasta|noodle|bread|tortilla|quinoa|oats|flour)/i.test(clean)) return "Grains & Pasta";
  if (/(baking|sugar|flour|vanilla|yeast|baking powder|baking soda)/i.test(clean)) return "Baking";
  if (/(salt|pepper|cumin|paprika|oregano|basil|seasoning|spice)/i.test(clean)) return "Spices";
  if (/(juice|soda|coffee|tea|water|drink)/i.test(clean)) return "Beverages";
  if (/(sauce|ketchup|mustard|mayo|dressing|vinegar|oil|salsa)/i.test(clean)) return "Condiments";
  if (/(chips|crackers|cookies|granola|snack)/i.test(clean)) return "Snacks";

  return "Other";
}

async function addItemsToShoppingList(items: string[], sourceRecipe?: Recipe) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    showToast("Please log in again.");
    return;
  }

  const isGroceryItem = sourceRecipe?.type === "grocery";

  const rows = items.map((item) => ({
    user_id: user.id,
    name: item,

    // Only grocery/product cards keep images.
    // Recipe ingredients should NOT inherit recipe image.
    image_url: isGroceryItem ? sourceRecipe?.image || "" : "",
    source_url: isGroceryItem ? sourceRecipe?.sourceUrl || "" : "",

    brand: isGroceryItem ? sourceRecipe?.brand || "" : "",
    package_size: isGroceryItem ? sourceRecipe?.packageSize || "" : "",
    price: isGroceryItem ? sourceRecipe?.price || "" : "",
    store_section: isGroceryItem
  ? sourceRecipe?.category || guessShoppingCategory(item)
  : guessShoppingCategory(item),
  }));

  const { data, error } = await supabase
    .from("shopping_items")
    .insert(rows)
    .select();

  if (error) {
    showToast(error.message);
    return;
  }

  const newItems = (data || []).map((item) => item.name);


  setShoppingItemImages((current) => {
  const updated = { ...current };

  (data || []).forEach((item) => {
    updated[item.name] = item.image_url || "";
  });

  return updated;
});

setShoppingItemUrls((current) => {
  const updated = { ...current };

  (data || []).forEach((item) => {
    updated[item.name] = item.source_url || "";
  });

  
  return updated;
});

  await loadShoppingItems();
  

  showToast(
    isGroceryItem
      ? "Item added to your shopping list."
      : "Ingredients added to your shopping list."
  );
}

function addToShoppingList(recipe: Recipe) {
  if (recipe.type === "grocery") {
    addItemsToShoppingList([recipe.title], recipe);
    return;
  }

  addItemsToShoppingList(recipe.ingredients, recipe);
}

  function addMealPlanToShoppingList() {
    const allIngredients = Object.values(mealPlan)
      .flat()
      .flatMap((recipe) => recipe.ingredients);

    addItemsToShoppingList(allIngredients);
    setShowMealPlanner(false);
    setShowShoppingList(true);
  }

  async function addNewMealPlanItemsToShoppingList() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    showToast("Please log in again.");
    return;
  }
const { error: deleteError } = await supabase
  .from("shopping_items")
  .delete()
  .eq("user_id", user.id)
  .not("source_meal_plan_id", "is", null);

if (deleteError) {
  showToast(deleteError.message);
  return;
}
  showToast("Updating grocery list...");

  const plannedMeals = Object.values(mealPlan)
    .flat()
    .filter((item: any) => !item.isMade);

  if (plannedMeals.length === 0) {
    showToast("No meal plan items to add.");
    return;
  }

  const mealPlanItems: any[] = [];

  for (const item of plannedMeals) {
  console.log("PLANNED ITEM", item.title, item.type, item.source, item);

  const shouldSkipShoppingList =
    item.source === "shopping_list" ||
    item.source === "leftovers";

  if (shouldSkipShoppingList) {
    continue;
  }

  const isGroceryMeal =
    item.type === "grocery" ||
    !item.ingredients ||
    item.ingredients.length === 0;

  if (isGroceryMeal) {
    mealPlanItems.push({
      name: item.title,
      mealPlanId: item.mealPlanId,
      imageUrl: item.image || "",
      sourceUrl: item.sourceUrl || "",
      buyAnyway: true,
    });

    continue;
  }
      
    const recipeId = item.id;

    const { data: fullRecipe, error } = await supabase
      .from("recipes")
      .select("ingredients, image_url, source_url")
      .eq("id", recipeId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      showToast(error.message);
      return;
    }

    const ingredients = fullRecipe?.ingredients || item.ingredients || [];

    ingredients.forEach((ingredient: string) => {
  mealPlanItems.push({
    name: ingredient,
    mealPlanId: item.mealPlanId,
    imageUrl: fullRecipe?.image_url || item.image || "",
sourceUrl: fullRecipe?.source_url || item.sourceUrl || "",
    buyAnyway: false,
  });
});
  }

  if (mealPlanItems.length === 0) {
    showToast("No ingredients found to add.");
    return;
  }

  const { error } = await supabase.from("shopping_items").insert(
  mealPlanItems.map((item) => ({
    user_id: user.id,
    name: item.name,
    source_meal_plan_id: item.mealPlanId,
    store_section: guessShoppingCategory(item.name),
    image_url: item.imageUrl,
    source_url: item.sourceUrl,
    buy_anyway: item.buyAnyway,
  }))
);

  if (error) {
    showToast(error.message);
    return;
  }

  await loadShoppingItems();

  showToast("Grocery list updated.");
}
  async function addRecipeToMealPlan(day: string, meal: string, recipe: Recipe) {
  const key = getMealPlanKey(day, meal);
  const currentRecipes = mealPlan[key] || [];

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    showToast("Please log in again.");
    return;
  }

  const { data, error } = await supabase
    .from("meal_plan")
    .insert({
  user_id: user.id,
  recipe_id: recipe.id,
  date: day,
  day: new Date(day + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
  }),
  meal,
  week: activePlannerWeek,
  week_start: getWeekStartDate(activePlannerWeek),
  is_made: false,
})
    .select()
    .single();

  if (error) {
    showToast(error.message);
    return;
  }

  const plannedRecipe: PlannedRecipe = {
  ...recipe,
  mealPlanId: data.id,
  plannedDate: day,
  isMade: false,
  weekStart: getWeekStartDate(activePlannerWeek),
};

  setMealPlan({
    ...mealPlan,
    [key]: [...currentRecipes, plannedRecipe],
  });
}

  function addRecipeFromPlanner() {
  const recipe = recipes.find((item) => item.id === plannerRecipeId);
  if (!recipe) return;

  const day = plannerPopup?.day || plannerDay;
  const meal = plannerPopup?.meal || plannerMeal;

  addRecipeToMealPlan(day, meal, recipe);
  setPlannerPopup(null);
}
async function addLeftoverFromPlanner() {
  if (!plannerPopup || !plannerLeftoverId) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const original = Object.values(mealPlan)
    .flat()
    .find((item) => item.mealPlanId === plannerLeftoverId);

  if (!original) return;

  const key = getMealPlanKey(plannerPopup.day, plannerPopup.meal);

  const newItem: PlannedRecipe = {
    ...original,
    id: crypto.randomUUID(),
    mealPlanId: crypto.randomUUID(),
    isMade: false,
    source: "leftovers",
parentMealPlanId: original.mealPlanId,
  };

  const { data, error } = await supabase
    .from("meal_plan")
    .insert({
      user_id: user.id,
      day: plannerPopup.day,
      meal: plannerPopup.meal,
      week_start: getWeekStartDate(activePlannerWeek),
      source: "leftovers",
      title: original.title,
      image_url: original.image || "",
      is_made: false,
    })
    .select()
    .single();

  if (error) {
    showToast(error.message);
    return;
  }

  const plannedRecipe: PlannedRecipe = {
    ...newItem,
    mealPlanId: data.id,
  };

  setMealPlan((current) => ({
    ...current,
    [key]: [...(current[key] || []), plannedRecipe],
  }));

  setPlannerLeftoverId("");
  setPlannerPopup(null);
}
  async function removeRecipeFromMealPlan(
  day: string,
  meal: string,
  mealPlanId: string
) {
  const key = getMealPlanKey(day, meal);
  const currentRecipes = mealPlan[key] || [];

  const removedRecipe = currentRecipes.find(
    (recipe) => recipe.mealPlanId === mealPlanId
  );

  const { error } = await supabase
    .from("meal_plan")
    .delete()
    .eq("id", mealPlanId);

  if (error) {
    showToast(error.message);
    return;
  }

  if (removedRecipe) {
    const uniqueIngredients = Array.from(new Set(removedRecipe.ingredients));

    for (const ingredient of uniqueIngredients) {
      const { data: row } = await supabase
        .from("shopping_items")
        .select("id")
        .eq("name", ingredient)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (row) {
        await supabase
          .from("shopping_items")
          .delete()
          .eq("id", row.id);
      }
    }

    setShoppingList((currentList) => {
      const updatedList = [...currentList];

      uniqueIngredients.forEach((ingredient) => {
        const index = updatedList.indexOf(ingredient);

        if (index !== -1) {
          updatedList.splice(index, 1);
        }
      });

      return updatedList;
    });
  }

  setMealPlan({
    ...mealPlan,
    [key]: currentRecipes.filter(
      (recipe) => recipe.mealPlanId !== mealPlanId
    ),
  });
}
async function addShoppingListFromPlanner() {
  console.log("clicked shopping list planner", plannerShoppingItemId);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !plannerPopup || !plannerShoppingItemId) return;


  const alreadyPlannedCount = Object.values(mealPlan)
  .flat()
  .filter(
    (item) =>
      item.source === "shopping_list" &&
      item.title === plannerShoppingItemId &&
      !item.isMade
  ).length;

const cartCount = shoppingList.filter(
  (item) => item === plannerShoppingItemId
).length;

if (alreadyPlannedCount >= cartCount) {
  showToast(`You only have ${cartCount} ${plannerShoppingItemId} in your shopping list.`);
  return;
}

  const key = getMealPlanKey(plannerPopup.day, plannerPopup.meal);

  const newItem: PlannedRecipe = {
  id: crypto.randomUUID(),
  mealPlanId: crypto.randomUUID(),

  title: plannerShoppingItemId,
  image: shoppingItemImages[plannerShoppingItemId] || "",
  ingredients: [],
  steps: [],
  cookTime: "",
  servings: "",
  category: "Prepared Food",
  sourceUrl: "",
  createdAt: new Date().toISOString(),
  type: "grocery",

  isMade: false,
  weekStart: getWeekStartDate(activePlannerWeek),
  source: "shopping_list",
};



  const { data, error } = await supabase
    .from("meal_plan")
    .insert({
  user_id: user.id,
  day: plannerPopup.day,
  meal: plannerPopup.meal,
  week_start: getWeekStartDate(activePlannerWeek),
  source: "shopping_list",
  title: plannerShoppingItemId,
  image_url: shoppingItemImages[plannerShoppingItemId] || "",
})
    .select()
    .single();

  if (error) {
  console.log("SHOPPING PLAN ERROR", error);
  showToast(error.message);
  return;
}

  const plannedRecipe: PlannedRecipe = {
  ...newItem,
  mealPlanId: data.id,
  plannedDate: plannerPopup.day,
  weekStart: getWeekStartDate(activePlannerWeek),
};

setMealPlan((current) => ({
  ...current,
  [key]: [...(current[key] || []), plannedRecipe],
}));

  setPlannerShoppingItemId("");
  setPlannerPopup(null);
}
  async function deleteRecipe(recipeId: string) {
  const recipeToDelete = recipes.find((recipe) => recipe.id === recipeId);

  const { error } = await supabase
    .from("recipes")
    .delete()
    .eq("id", recipeId);

  if (error) {
    showToast(error.message);
    return;
  }

  setRecipes(recipes.filter((recipe) => recipe.id !== recipeId));

  const updatedMealPlan = { ...mealPlan };

  Object.keys(updatedMealPlan).forEach((key) => {
    updatedMealPlan[key] = updatedMealPlan[key].filter(
      (recipe) => recipe.id !== recipeId
    );
  });

  setMealPlan(updatedMealPlan);
  setSelectedRecipe(null);
  setShowAllRecipes(true);

  showToast(
    recipeToDelete?.type === "grocery"
      ? "Food item removed from library and pantry."
      : "Recipe deleted."
  );
}
  async function updateSelectedRecipe(updatedRecipe: Recipe) {
    console.log("Saving recipe:", updatedRecipe);
    if (updatedRecipe.id === "new-recipe") {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    showToast("Please log in again.");
    return;
  }

  const { data, error } = await supabase
    .from("recipes")
    .insert({
      user_id: user.id,
      title: updatedRecipe.title || "Untitled Recipe",
      category: updatedRecipe.category || null,
      image_url: updatedRecipe.image || "",
      cook_time: updatedRecipe.cookTime || "",
      servings: updatedRecipe.servings || "",
      ingredients: updatedRecipe.ingredients,
      steps: updatedRecipe.steps,
      source_url: updatedRecipe.sourceUrl || "",
      is_favorite: updatedRecipe.isFavorite || false,
      is_planning_queue: updatedRecipe.isPlanningQueue || false,
      type: updatedRecipe.type || "recipe",
brand: updatedRecipe.brand || "",
package_size: updatedRecipe.packageSize || "",
    })
    .select()
    .single();

  if (error) {
    showToast(error.message);
    return;
  }

  const savedRecipe: Recipe = {
    ...updatedRecipe,
    id: data.id,
    title: data.title,
    createdAt: data.created_at,
  };

  setRecipes([savedRecipe, ...recipes]);
  setSelectedRecipe(savedRecipe);
  setIsEditingRecipe(false);
  setEditRecipeDraft(null);

  return;
}
  const { error } = await supabase
    .from("recipes")
    .update({
      title: updatedRecipe.title,
      category: updatedRecipe.category || null,
      image_url: updatedRecipe.image || "",
      cook_time: updatedRecipe.cookTime || "",
      servings: updatedRecipe.servings || "",
      ingredients: updatedRecipe.ingredients,
      steps: updatedRecipe.steps,
      source_url: updatedRecipe.sourceUrl || "",
      is_favorite: updatedRecipe.isFavorite || false,
      type: updatedRecipe.type || "recipe",
brand: updatedRecipe.brand || "",
package_size: updatedRecipe.packageSize || "",
    })
    .eq("id", updatedRecipe.id);

  if (error) {
    showToast(error.message);
    return;
  }

  const updatedRecipes = recipes.map((recipe) =>
    recipe.id === updatedRecipe.id ? updatedRecipe : recipe
  );

  setRecipes(updatedRecipes);
  setSelectedRecipe(updatedRecipe);
  setIsEditingRecipe(false);
setEditRecipeDraft(null);
}
async function toggleShoppingItemChecked(item: string, checked: boolean) {
  if (checked) {
    setCheckedShoppingItems([...checkedShoppingItems, item]);
  } else {
    setCheckedShoppingItems(
      checkedShoppingItems.filter((savedItem) => savedItem !== item)
    );
  }

  const { error } = await supabase
    .from("shopping_items")
    .update({ is_checked: checked })
    .eq("name", item);

  if (error) {
    showToast(error.message);
  }
}

async function addCheckedItemsToPantry() {
  if (checkedShoppingItems.length === 0) {
    showToast("Check items first.");
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    showToast("Please log in again.");
    return;
  }

  const { data: shoppingRows, error: shoppingError } = await supabase
  .from("shopping_items")
  .select("*")
  .in("name", checkedShoppingItems)
  .order("created_at", { ascending: false });

  if (shoppingError) {
    showToast(shoppingError.message);
    return;
  }

const uniqueShoppingRows = (shoppingRows || []).filter(
  (item, index, array) =>
    index ===
    array.findIndex(
      (other) =>
        normalizeItemName(cleanPantryDisplayName(other.name)) ===
        normalizeItemName(cleanPantryDisplayName(item.name))
    )
);

const { data: imageMemory } = await supabase
  .from("ingredient_images")
  .select("normalized_name, image_url, source_url, name")
  .eq("user_id", user.id);

  for (const item of uniqueShoppingRows) {
  const cleanedName = cleanPantryDisplayName(item.name);
  const normalizedName = normalizeItemName(cleanedName);

  const finalCategory =
  shoppingItemCategories[item.name] &&
  shoppingItemCategories[item.name] !== "Prepared Food"
    ? shoppingItemCategories[item.name]
    : item.store_section && item.store_section !== "Prepared Food"
      ? item.store_section
      : guessShoppingCategory(item.name) || "Other";

  console.log("Shopping:", cleanedName);
console.log("Normalized shopping:", normalizedName);

pantryItems.forEach((item) => {
  console.log(
    "Pantry:",
    item.name,
    "=>",
    normalizeItemName(cleanPantryDisplayName(item.name))
  );
});    

  const existingPantryItem = pantryItems.find((pantryItem) => {
  const pantryName = normalizeItemName(cleanPantryDisplayName(pantryItem.name));

  return pantryName === normalizedName;
});

  if (existingPantryItem) {
  const currentQty = Number(existingPantryItem.quantity || 0);
  const addQty = Number(item.quantity || 1);

  const { error } = await supabase
    .from("pantry_items")
    .update({
  quantity: String(currentQty + addQty),
})
    .eq("id", existingPantryItem.id);

  if (error) {
    showToast(error.message);
    return;
  }

  continue;
}

  const memoryMatch = (imageMemory || []).find(
    (memory) => memory.normalized_name === normalizedName
  );

  const { error } = await supabase.from("pantry_items").insert({
    user_id: user.id,
    name: cleanedName,
    quantity: String(item.quantity || 1),
    unit: item.unit || "package",
    category: finalCategory,
    image_url:
      item.image_url ||
      shoppingItemImages[item.name] ||
      memoryMatch?.image_url ||
      "",

    source_url:
      item.source_url ||
      shoppingItemUrls[item.name] ||
      memoryMatch?.source_url ||
      "",
    brand: item.brand || "",
    package_size: item.package_size || "",
    price: item.price || "",
  });

  if (error) {
    showToast(error.message);
    return;
  }
}

function getImageMemoryForPantryItem(itemName: string) {
  const cleanedItem = normalizeItemName(itemName);

  return (imageMemory || []).find((memory) => {
    const cleanedMemory = normalizeItemName(
      memory.normalized_name || memory.name
    );

    return (
      cleanedItem === cleanedMemory ||
      cleanedItem.includes(cleanedMemory) ||
      cleanedMemory.includes(cleanedItem)
    );
  });
}

let updatedPantryItems = [...pantryItems];

for (const item of uniqueShoppingRows) {
  const cleanName = cleanPantryDisplayName(item.name);
  const normalizedName = normalizeItemName(cleanName);
  const memory = getImageMemoryForPantryItem(cleanName);

  const existingPantryItem = updatedPantryItems.find(
    (pantryItem) =>
      normalizeItemName(pantryItem.name) === normalizedName
  );

  if (existingPantryItem) {
    const currentQty = Number(existingPantryItem.quantity || 0);
    const addQty = Number(item.quantity || 1);

    const { error } = await supabase
      .from("pantry_items")
      .update({
        quantity: String(currentQty + addQty),
      })
      .eq("id", existingPantryItem.id);

    if (error) {
      showToast(error.message);
      return;
    }

    updatedPantryItems = updatedPantryItems.map((pantryItem) =>
  pantryItem.id === existingPantryItem.id
    ? {
        ...pantryItem,
        quantity: String(currentQty + addQty),
      }
    : pantryItem
    );

    continue;
  }

  const shoppingImage = shoppingItemImages[item.name] || "";
  const shoppingUrl = shoppingItemUrls[item.name] || "";

  const hasProductData =
    item.buy_anyway === true ||
    item.brand ||
    item.package_size ||
    item.price ||
    item.source_url;

  const assignedCategory =
  shoppingItemCategories[item.name] ||
  Object.entries(shoppingItemCategories).find(
    ([savedName]) =>
      normalizeItemName(savedName) === normalizeItemName(item.name)
  )?.[1];

const pantryCategory =
  assignedCategory ||
  item.store_section ||
  guessShoppingCategory(item.name) ||
  "Other";

  const pantryRow = {
    user_id: user.id,
    name: memory?.name || cleanName,
    quantity: String(item.quantity || 1),
    unit: hasProductData || memory?.image_url ? "package" : "",
    category: pantryCategory,
    brand: item.brand || "",
    package_size: item.package_size || "",
    image_url: hasProductData
      ? item.image_url || shoppingImage || memory?.image_url || ""
      : memory?.image_url || "",
    source_url: hasProductData
      ? item.source_url || shoppingUrl || memory?.source_url || ""
      : memory?.source_url || "",
    price: item.price || "",
  };

  const { data: insertedPantryItem, error: pantryError } = await supabase
    .from("pantry_items")
    .insert(pantryRow)
    .select()
    .single();

  if (pantryError) {
    showToast(pantryError.message);
    return;
  }

  if (insertedPantryItem) {
    updatedPantryItems = [
      ...updatedPantryItems,
      {
        id: insertedPantryItem.id,
        name: insertedPantryItem.name,
        quantity: insertedPantryItem.quantity || "",
        unit: insertedPantryItem.unit || "",
        category: insertedPantryItem.category || "Other",
        createdAt: insertedPantryItem.created_at,
        brand: insertedPantryItem.brand || "",
        packageSize: insertedPantryItem.package_size || "",
        image: insertedPantryItem.image_url || "",
        sourceUrl: insertedPantryItem.source_url || "",
        price: insertedPantryItem.price || "",
      },
    ];
  }

  const existingFoodCard = recipes.find(
    (recipe) =>
      recipe.type === "grocery" &&
      normalizeItemName(recipe.title) === normalizeItemName(pantryRow.name)
  );

  if (!existingFoodCard) {
    const { data: newFoodCard } = await supabase
      .from("recipes")
      .insert({
        user_id: user.id,
        title: pantryRow.name,
        image_url: pantryRow.image_url || "",
        ingredients: [],
        steps: [],
        cook_time: "",
        servings: "",
        category: pantryRow.category || "Other",
        source_url: pantryRow.source_url || "",
        is_favorite: false,
        is_planning_queue: false,
        type: "grocery",
        brand: pantryRow.brand || "",
        package_size: pantryRow.package_size || "",
        price: pantryRow.price || "",
      })
      .select()
      .single();

    if (newFoodCard) {
      setRecipes((current) => [
        {
          id: newFoodCard.id,
          title: newFoodCard.title,
          image: newFoodCard.image_url || "",
          ingredients: [],
          steps: [],
          cookTime: "",
          servings: "",
          category: newFoodCard.category || "Other",
          sourceUrl: newFoodCard.source_url || "",
          isFavorite: false,
          isPlanningQueue: false,
          createdAt: newFoodCard.created_at,
          type: "grocery",
          brand: newFoodCard.brand || "",
          packageSize: newFoodCard.package_size || "",
        },
        ...current,
      ]);
    }
  }
}

  const { error: deleteError } = await supabase
    .from("shopping_items")
    .delete()
    .in("name", checkedShoppingItems);

  if (deleteError) {
    showToast(deleteError.message);
    return;
  }

  setShoppingList(
    shoppingList.filter((item) => !checkedShoppingItems.includes(item))
  );

setPantryItems(updatedPantryItems);

  setCheckedShoppingItems([]);

  showToast("Checked items moved to pantry.");
}

async function markRecipeMade(recipe: Recipe | PlannedRecipe) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    showToast("Please log in again.");
    return;
  }

  const isLeftovers = "source" in recipe && recipe.source === "leftovers";
  const isGrocery = "type" in recipe && recipe.type === "grocery";

  if (!isLeftovers) {
    const { error: madeError } = await supabase
      .from("recently_made")
      .insert({
        user_id: user.id,
        recipe_id: isGrocery ? null : recipe.id,
        title: recipe.title,
        image_url: recipe.image || null,
        source_url: recipe.sourceUrl || null,
        source_type: isGrocery ? "grocery" : "recipe",
        cooked_at: new Date().toISOString(),
      });

    if (madeError) {
      showToast(madeError.message);
      return;
    }
  }

  if ("mealPlanId" in recipe) {
    const { error: updateError } = await supabase
      .from("meal_plan")
      .update({ is_made: true })
      .eq("id", recipe.mealPlanId);

    if (updateError) {
      showToast(updateError.message);
      return;
    }

    setMealPlan((currentPlan) => {
      const updatedPlan = { ...currentPlan };

      Object.keys(updatedPlan).forEach((key) => {
        updatedPlan[key] = updatedPlan[key].map((plannedRecipe) =>
          plannedRecipe.mealPlanId === recipe.mealPlanId
            ? { ...plannedRecipe, isMade: true }
            : plannedRecipe
        );
      });

      return updatedPlan;
    });
  }

  setRecipes(
    recipes.map((item) =>
      item.id === recipe.id
        ? { ...item, isPlanningQueue: false }
        : item
    )
  );

  await loadRecentlyMade();

  showToast(isLeftovers ? "Marked as made." : "Nice! Added to Recently Made.");
}

async function loadRecentlyMade() {
  const { data, error } = await supabase
    .from("recently_made")
    .select(`
      id,
      cooked_at,
      title,
      image_url,
      source_url,
      source_type,
      recipes (*)
    `)
    .order("cooked_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  setRecentlyMade(data || []);
}
async function makeRecentlyMadeAgain(item: any) {
  const recipe = item.recipes;

  if (recipe) {
    togglePlanningQueue(recipe.id);
    showToast("Added back to your meal plan options.");
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase.from("shopping_items").insert({
  user_id: user.id,
  name: item.title,
  image_url: item.image_url || null,
  source_url: item.source_url || null,
  is_checked: false,
});

  if (error) {
    showToast(error.message);
    return;
  }

  await loadShoppingItems();
  showToast("Added back to your meal plan options.");
}
  async function removeShoppingItem(item: string) {
  const { data: row } = await supabase
    .from("shopping_items")
    .select("id")
    .eq("name", item)
    .limit(1)
    .single();

  if (!row) return;

  const { error } = await supabase
    .from("shopping_items")
    .delete()
    .eq("id", row.id);

  if (error) {
    showToast(error.message);
    return;
  }

  const index = shoppingList.indexOf(item);

  if (index !== -1) {
    const updated = [...shoppingList];
    updated.splice(index, 1);
    setShoppingList(updated);
  }
}

  function goHome() {
  setCurrentPage("home");

  setSelectedRecipe(null);
  setShowAllRecipes(false);
  setShowMealPlanner(false);
  setShowShoppingList(false);
  setShowPantry(false);
  setShowProfile(false);
  setShowImport(false);
  setIsMenuOpen(false);
  setShowSettingsMenu(false);
  
  window.scrollTo({
  top: 0,
  behavior: "smooth",
});
}

function pantryNamesMatch(ingredient: string, pantryName: string) {
  const cleanIngredient = normalizeItemName(ingredient);
  const cleanPantry = normalizeItemName(pantryName);

  if (!cleanIngredient || !cleanPantry) return false;

  if (cleanIngredient === cleanPantry) return true;

  const ingredientWords = cleanIngredient.split(" ");
  const pantryWords = cleanPantry.split(" ");

  return ingredientWords.every((word) => pantryWords.includes(word)) ||
    pantryWords.every((word) => ingredientWords.includes(word));
}

function getMatchingPantryItem(ingredient: string) {
  const cleanedIngredientName = normalizeItemName(ingredient);

  return pantryItems.find((pantryItem) => {
    const cleanedPantryName = normalizeItemName(pantryItem.name);

    if (Number(pantryItem.quantity || 0) <= 0) {
      return false;
    }
    if (!cleanedIngredientName || !cleanedPantryName) {
      return false;
    }

    if (cleanedIngredientName.length < 3 || cleanedPantryName.length < 3) {
      return false;
    }

    return pantryNamesMatch(ingredient, pantryItem.name);
  });
}

function getRecipePantryGaps(recipe: Recipe | PlannedRecipe) {
  return recipe.ingredients.filter(
    (ingredient) => !getMatchingPantryItem(ingredient)
  );
}

function canMakeRecipeFromPantry(recipe: Recipe | PlannedRecipe) {
  if (recipe.type === "grocery") {
    const matchingPantryItem = getMatchingPantryItem(recipe.title);

    if (!matchingPantryItem) return false;

    return Number(matchingPantryItem.quantity || 0) > 0;
  }

  return getRecipePantryGaps(recipe).length === 0;
}

function shouldSaveAsFoodCard(name: string) {
  const text = name.toLowerCase();

  const foodCardWords = [
    "burrito",
    "pizza rolls",
    "pizza",
    "frozen meal",
    "soup",
    "mac and cheese",
    "protein bar",
    "granola bar",
    "yogurt",
    "cereal",
    "snack",
    "chips",
    "crackers",
  ];

  const ingredientWords = [
    "grapes",
    "blueberries",
    "strawberries",
    "lettuce",
    "lemon",
    "lime",
    "onion",
    "garlic",
    "cilantro",
    "flour",
    "sugar",
    "rice",
    "beans",
  ];

  if (ingredientWords.some((word) => text.includes(word))) {
    return false;
  }

  return foodCardWords.some((word) => text.includes(word));
}

async function saveShoppingItemAsFoodItem(itemName: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    showToast("Please log in again.");
    return;
  }

  const { data: shoppingRow, error: shoppingError } = await supabase
    .from("shopping_items")
    .select("*")
    .eq("user_id", user.id)
    .eq("name", itemName)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (shoppingError) {
    showToast(shoppingError.message);
    return;
  }

  const newFoodItem: Recipe = {
    id: crypto.randomUUID(),
    title: cleanPantryDisplayName(itemName),
    image: shoppingRow?.image_url || "",
    ingredients: [],
    steps: [],
    cookTime: "",
    servings: "",
    category:
    shoppingItemCategories[itemName] ||
    shoppingRow?.store_section ||
    guessShoppingCategory(itemName) ||
    "Other",
    sourceUrl: shoppingRow?.source_url || "",
    isFavorite: false,
    isPlanningQueue: false,
    createdAt: new Date().toISOString(),
    type: "grocery",
    brand: shoppingRow?.brand || "",
    packageSize: shoppingRow?.package_size || "",
  };

  const { data, error } = await supabase
    .from("recipes")
    .insert({
      user_id: user.id,
      title: newFoodItem.title,
      image_url: newFoodItem.image,
      ingredients: [],
      steps: [],
      cook_time: "",
      servings: "",
      category: newFoodItem.category,
      source_url: newFoodItem.sourceUrl,
      is_favorite: false,
      is_planning_queue: false,
      type: "grocery",
      brand: newFoodItem.brand,
      package_size: newFoodItem.packageSize,
    })
    .select()
    .single();

  if (error) {
    showToast(error.message);
    return;
  }

  setRecipes([
    {
      ...newFoodItem,
      id: data.id,
      createdAt: data.created_at,
    },
    ...recipes,
  ]);
}
function guessFoodCategory(text: string) {
  const value = text.toLowerCase();

  if (
    value.includes("potato") ||
    value.includes("yam") ||
    value.includes("lettuce") ||
    value.includes("spinach") ||
    value.includes("cilantro") ||
    value.includes("onion") ||
    value.includes("garlic") ||
    value.includes("carrot") ||
    value.includes("celery") ||
    value.includes("lemon") ||
    value.includes("lime") ||
    value.includes("avocado")
  ) {
    return "Produce";
  }

  if (
    value.includes("cheese") ||
    value.includes("milk") ||
    value.includes("butter") ||
    value.includes("yogurt")
  ) {
    return "Refrigerated";
  }

  if (value.includes("frozen")) return "Frozen";

  if (
    value.includes("chips") ||
    value.includes("crackers") ||
    value.includes("cookies")
  ) {
    return "Snacks";
  }

  if (
    value.includes("beans") ||
    value.includes("tomato") ||
    value.includes("soup") ||
    value.includes("lentil")
  ) {
    return "Canned Goods";
  }

  return "Other";
}
async function savePantryItemAsFoodCard(item: PantryItem) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    showToast("Please log in again.");
    return;
  }
  
const existingFoodCard = recipes.find((recipe) => {
  const recipeName = normalizeItemName(recipe.title);
const itemName = normalizeItemName(item.name);

return (
  recipeName === itemName ||
  recipeName.includes(itemName) ||
  itemName.includes(recipeName)
);

  const existingName = normalizeItemName(recipe.title);
  const pantryName = normalizeItemName(item.name);

  return (
    existingName === pantryName ||
    existingName.includes(pantryName) ||
    pantryName.includes(existingName) ||
    (!!item.sourceUrl && recipe.sourceUrl === item.sourceUrl)
  );
});

if (existingFoodCard) {
  showToast("Food card already exists.");
  setSelectedRecipe(existingFoodCard);
  setCurrentPage("recipes");
  return;
}
  const { data, error } = await supabase
    .from("recipes")
    .insert({
      user_id: user.id,
      title: item.name,
      image_url: item.image || "",
      ingredients: [],
      steps: [],
      cook_time: "",
      servings: "",
      category: item.category || "Prepared Food",
      source_url: item.sourceUrl || "",
      is_favorite: false,
      is_planning_queue: false,
      type: "grocery",
      brand: item.brand || "",
      package_size: item.packageSize || "",
    })
    .select()
    .single();

  if (error) {
    showToast(error.message);
    return;
  }

  setRecipes([
    {
      id: data.id,
      title: data.title,
      image: data.image_url || "",
      ingredients: [],
      steps: [],
      cookTime: "",
      servings: "",
      category: data.category || "Prepared Food",
      sourceUrl: data.source_url || "",
      isFavorite: false,
      isPlanningQueue: false,
      createdAt: data.created_at,
      type: "grocery",
      brand: data.brand || "",
      packageSize: data.package_size || "",
    },
    ...recipes,
  ]);

  showToast("Added to Go-To Foods.");
}

async function addShoppingItemToPantry(shoppingItem: string, count = 1) {
  const cleanedShoppingName = normalizeItemName(shoppingItem);

  const alreadyInPantry = pantryItems.find((pantryItem) => {
    const cleanedPantryName = normalizeItemName(pantryItem.name);

    return (
      cleanedShoppingName.includes(cleanedPantryName) ||
      cleanedPantryName.includes(cleanedShoppingName)
    );
  });

  if (alreadyInPantry) {
    showToast(`${shoppingItem} already matches ${alreadyInPantry.name} in your pantry.`);
    return;
  }

  const cleanedName = cleanPantryDisplayName(shoppingItem);

  setPantryModalItem(cleanedName);
  setPantryModalShoppingItem(shoppingItem);
  setPantryModalQuantity(String(count));
  setPantryModalUnit("package");
  setPantryModalCategory(
  shoppingItemCategories[shoppingItem] ||
  guessShoppingCategory(shoppingItem) ||
  "Other"
);
  setShowPantryModal(true)

  showToast(`${cleanedName} ready to add to pantry.`);
}

async function refreshPantryImageFromUrl() {
  const sourceUrl = pantryModalSourceUrl.trim();

  if (!sourceUrl) {
    showToast("Paste a product URL first.");
    return;
  }

  try {
    const response = await fetch("/api/import-food", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: sourceUrl }),
    });

    const product = await response.json();

    console.log("REFRESH PANTRY IMAGE RESULT", product);

    if (!response.ok) {
      showToast(product.error || "Could not import image.");
      return;
    }

    if (product.title) {
  setPantryModalItem(product.title);

  setPantryModalCategory(
    guessFoodCategory(
      `${product.title} ${pantryModalSourceUrl}`
    )
  );
}

if (product.image) {
  setPantryModalImage(product.image);
}

    showToast("Image refreshed.");
  } catch (error) {
    console.error(error);
    showToast("Could not refresh image.");
  }
}

async function resetPantry() {
  if (
    !confirm(
      "Remove all pantry items and start over?"
    )
  ) {
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase
    .from("pantry_items")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    showToast(error.message);
    return;
  }

  setPantryItems([]);
  showToast("Pantry reset.");
}


async function saveIngredientImageMemory(
  name: string,
  imageUrl: string,
  sourceUrl: string
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const cleanName = name.trim();
  if (!cleanName) return;

  const { data, error } = await supabase
    .from("ingredient_images")
    .upsert(
      {
        user_id: user.id,
        name: cleanName,
        normalized_name: normalizeItemName(cleanName),
        image_url: imageUrl.trim(),
        source_url: sourceUrl.trim(),
      },
      {
        onConflict: "user_id,normalized_name",
      }
    )
    .select();

  console.log("INGREDIENT IMAGE MEMORY RESULT", { data, error });

  if (error) {
    showToast(error.message);
  }
}
async function savePantryModal() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    showToast("Please log in again.");
    return;
  }

  let name = pantryModalItem.trim();
  let imageUrl = pantryModalImage.trim();
  const sourceUrl = pantryModalSourceUrl.trim();

  const urlChanged =
  sourceUrl !== "" && sourceUrl !== originalPantrySourceUrl.trim();

const shouldImportProduct =
  sourceUrl !== "" && (urlChanged || imageUrl === "");

if (shouldImportProduct) {
  try {
    const response = await fetch("/api/import-food", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: sourceUrl }),
    });

    const product = await response.json();

    console.log("PANTRY IMPORT RESULT", product);

    if (response.ok) {
      name = product.title || name;
      imageUrl = product.image || "";
    }
  } catch (error) {
    console.error(error);
  }
}

  if (!name) return;

  const payload = {
    name,
    quantity: pantryModalQuantity.trim() || "1",
    unit: pantryModalUnit,
    category: pantryModalCategory,
    image_url: imageUrl,
    source_url: sourceUrl,
  };

  if (editingPantryModalId) {
    const { data, error } = await supabase
      .from("pantry_items")
      .update(payload)
      .eq("id", editingPantryModalId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      showToast(error.message);
      return;
    }

    setPantryItems((current) =>
      current.map((item) =>
        item.id === editingPantryModalId
          ? {
              ...item,
              name: data.name,
              quantity: data.quantity || "1",
              unit: data.unit || "",
              category: data.category || "Other",
              image: data.image_url || "",
              sourceUrl: data.source_url || "",
            }
          : item
      )
    );

    await saveIngredientImageMemory(name, imageUrl, sourceUrl);

    setEditingPantryModalId(null);
    setOriginalPantrySourceUrl("");
    setShowPantryModal(false);
    return;
  }

  const { data, error } = await supabase
    .from("pantry_items")
    .insert({
      user_id: user.id,
      ...payload,
    })
    .select()
    .single();

  if (error) {
    showToast(error.message);
    return;
  }

  const newPantryItem: PantryItem = {
    id: data.id,
    name: data.name,
    quantity: data.quantity || "1",
    unit: data.unit || "",
    category: data.category || "Other",
    createdAt: data.created_at,
    image: data.image_url || "",
    sourceUrl: data.source_url || "",
  };

  setPantryItems((current) => [newPantryItem, ...current]);

  await saveIngredientImageMemory(name, imageUrl, sourceUrl);

  setPantrySessionAddCount((count) => count + 1);

  if (addAnotherPantryItem) {
    setPantryModalItem("");
    setPantryModalImage("");
    setPantryModalSourceUrl("");
    setOriginalPantrySourceUrl("");
    setPantryModalQuantity("1");
    return;
  }

  setRecentlyAddedPantryId(newPantryItem.id);
  setTimeout(() => setRecentlyAddedPantryId(null), 2000);

  setShowPantryModal(false);
}

function goAllRecipes() {
  setCurrentPage("recipes");

  setSelectedRecipe(null);
  setShowMealPlanner(false);
  setShowShoppingList(false);
  setShowPantry(false);
  setShowAllRecipes(true);
  setShowImport(false);
  setIsMenuOpen(false);
  setShowSettingsMenu(false);

  window.scrollTo({
  top: 0,
  behavior: "smooth",
});
}

function goMealPlanner() {
  setCurrentPage("planner");

  setSelectedRecipe(null);
  setShowAllRecipes(false);
  setShowShoppingList(false);
  setShowPantry(false);
  setShowMealPlanner(true);
  setShowImport(false);
  setIsMenuOpen(false);
  setShowSettingsMenu(false);

  window.scrollTo({
  top: 0,
  behavior: "smooth",
});
}

function goShoppingList() {
  setCurrentPage("shopping");

  setSelectedRecipe(null);
  setShowAllRecipes(false);
  setShowMealPlanner(false);
  setShowPantry(false);
  setShowShoppingList(true);
  setShowImport(false);
  setIsMenuOpen(false);
  setShowSettingsMenu(false);

  window.scrollTo({
  top: 0,
  behavior: "smooth",
});
}

function goPantry() {
  setCurrentPage("pantry");

  setSelectedRecipe(null);
  setShowAllRecipes(false);
  setShowMealPlanner(false);
  setShowShoppingList(false);
  setShowPantry(true);
  setShowImport(false);
  setIsMenuOpen(false);
  setShowSettingsMenu(false);

  window.scrollTo({
  top: 0,
  behavior: "smooth",
});
}


function RecipeMeta({ recipe }: { recipe: Recipe }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[#6d5549]">
      <span>⏱ {recipe.cookTime || ""}</span>
      <span>👥 {recipe.servings || ""}</span>

      {recipe.category && (
        <span className="rounded-full bg-[#fff4ef] px-3 py-1 text-xs text-[#a63a0a]">
          {recipe.category}
        </span>
      )}
    </div>
  );
}
async function resetPassword() {
  const email = prompt("Enter your email address:");

  if (!email) return;

  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    {
      redirectTo: "https://heychef-six.vercel.app",
    }
  );

  if (error) {
    showToast(error.message);
    return;
  }

  showToast("Password reset email sent.");
}
function PantryModal() {

  if (!showPantryModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 px-4 pb-6 md:items-center md:justify-center md:pb-0">
      <div className="w-full rounded-[2rem] bg-white p-6 shadow-2xl md:max-w-md">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
  {editingPantryModalId ? "Edit Pantry Item" : "Add Pantry Item"}
  {pantrySessionAddCount > 0 && (
  <div className="mt-2 inline-flex rounded-full bg-[#cfe3bf] px-3 py-1 text-sm font-bold text-[#2f5f25]">
    ✓ {pantrySessionAddCount} item{pantrySessionAddCount !== 1 ? "s" : ""} added
  </div>
)}
</h2>

          <button
            onClick={() => {
  setShowPantryModal(false);
  setPantrySessionAddCount(0);
}}
            className="text-3xl text-[#a63a0a]"
          >
            ×
          </button>
        </div>

        <input
          value={pantryModalItem}
          onChange={(e) => setPantryModalItem(e.target.value)}
          placeholder="Item name"
          className="mb-3 w-full rounded-full border border-[#ead7c8] px-5 py-3"
        />
        <input
  value={pantryModalSourceUrl}
  onChange={(e) => setPantryModalSourceUrl(e.target.value)}
  placeholder="Product URL (optional)"
  className="mb-3 w-full rounded-full border border-[#ead7c8] px-5 py-3"
/>

<input
  value={pantryModalImage}
  onChange={(e) => setPantryModalImage(e.target.value)}
  placeholder="Image URL"
  className="mb-3 w-full rounded-full border border-[#ead7c8] px-5 py-3"
/>



  <button
  type="button"
  onClick={refreshPantryImageFromUrl}
  className="mb-3 w-full rounded-full border border-[#a63a0a] py-2 text-sm font-bold text-[#a63a0a]"
>
  {editingPantryModalId ? "Update Pantry Item" : "Import Pantry Item"}
</button>
        <div className="mb-3 flex items-center gap-2">
  <button
  type="button"
  onClick={async () => {
    const nextQty = Number(pantryModalQuantity || 0) - 1;

    if (nextQty <= 0) {
      if (editingPantryModalId) {
        await supabase
          .from("pantry_items")
          .delete()
          .eq("id", editingPantryModalId);

        setPantryItems(
          pantryItems.filter(
            (item) => item.id !== editingPantryModalId
          )
        );
      }

      setShowPantryModal(false);
setPantrySessionAddCount(0);
      return;
    }

    setPantryModalQuantity(String(nextQty));
  }}
  className="h-12 w-12 rounded-full border border-[#ead7c8] text-xl font-bold text-[#a63a0a]"
>
  −
</button>

  <input
    value={pantryModalQuantity}
    onChange={(e) => setPantryModalQuantity(e.target.value)}
    placeholder="Qty"
    inputMode="decimal"
    className="h-12 flex-1 rounded-full border border-[#ead7c8] px-5 text-center"
  />

  <button
    type="button"
    onClick={() =>
      setPantryModalQuantity(String(Number(pantryModalQuantity || 0) + 1))
    }
    className="h-12 w-12 rounded-full border border-[#ead7c8] text-xl font-bold text-[#a63a0a]"
  >
    +
  </button>
</div>

        <select
          value={pantryModalUnit}
          onChange={(e) => setPantryModalUnit(e.target.value)}
          className="mb-3 w-full rounded-full border border-[#ead7c8] bg-white px-5 py-3"
        >
          <option value="">Unit</option>
          <option value="package">package</option>
          <option value="bag">bag</option>
          <option value="box">box</option>
          <option value="jar">jar</option>
          <option value="bottle">bottle</option>
          <option value="can">can</option>
          <option value="carton">carton</option>
          <option value="loaf">loaf</option>
          <option value="bunch">bunch</option>
          <option value="gallon">gallon</option>
          <option value="lb">lb</option>
          <option value="oz">oz</option>
        </select>

        <select
          value={pantryModalCategory}
          onChange={(e) => setPantryModalCategory(e.target.value)}
          className="mb-4 w-full rounded-full border border-[#ead7c8] bg-white px-5 py-3"
        >
          <option value="Produce">Produce</option>
          <option value="Refrigerated">Refrigerated</option>
          <option value="Frozen">Frozen</option>
          <option value="Meat & Protein">Meat & Protein</option>
          <option value="Canned Goods">Canned Goods</option>
          <option value="Grains & Pasta">Grains & Pasta</option>
          <option value="Baking">Baking</option>
          <option value="Spices">Spices</option>
          <option value="Beverages">Beverages</option>
          <option value="Condiments">Condiments</option>
          <option value="Snacks">Snacks</option>
          <option value="Other">Other</option>
        </select>

        {!editingPantryModalId && (
  <label className="mb-5 flex items-center gap-2 text-sm text-[#6d5549]">
    <input
      type="checkbox"
      checked={addAnotherPantryItem}
      onChange={(e) => setAddAnotherPantryItem(e.target.checked)}
    />
    Add another item after saving
  </label>
)}

          

      <button
        onClick={savePantryModal}
        className="w-full rounded-full bg-[#a63a0a] px-6 py-3 font-bold text-white"
      >
        {editingPantryModalId ? "Save Pantry Changes" : "Save Pantry Item"}
      </button>
    </div>
  </div>
);
}
function BottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-[#ead7c8] bg-white px-2 py-2 shadow-xl md:hidden">


      <button
        onClick={goAllRecipes}
        className={
          currentPage === "recipes"
            ? "rounded-2xl px-2 py-2 font-bold text-[#a63a0a]"
            : "rounded-2xl px-2 py-2  text-[#a63a0a]"
        }
      >
        🍳<br />Recipes
      </button>

      <button
        onClick={goMealPlanner}
        className={
          currentPage === "planner"
            ? "rounded-2xl px-2 py-2 font-bold text-[#a63a0a]"
            : "rounded-2xl px-2 py-2  text-[#a63a0a]"
        }
      >
        📅<br />Planner
      </button>

      <button
  onClick={() => {
    goHome();
    setShowImport(true);

    setTimeout(() => {
      importSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 300);
  }}
   className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#a63a0a] text-4xl leading-none text-white shadow-lg"
>
  +
</button>

      <button
        onClick={goShoppingList}
        className={
          currentPage === "shopping"
            ? "rounded-2xl px-2 py-2 font-bold text-[#a63a0a]"
            : "rounded-2xl px-2 py-2 text-[#a63a0a]"
        }
      >
        🛒<br />Shopping
      </button>

      <button
  onClick={goPantry}
  className={
    currentPage === "pantry"
      ? "rounded-2xl px-2 py-2 font-bold text-[#a63a0a]"
      : "rounded-2xl px-2 py-2 text-[#a63a0a]"
  }
>
  🥫<br />Pantry
</button>

    </div>
  );
}
function renderAuthCard() {
  return (
    <>
      <h2 className="mb-2 text-3xl font-bold">
        {authMode === "signup" ? "Ready to cook?" : "Let's get cookin'"}
      </h2>

      <p className="mb-5 text-[#6d5549]">
        {authMode === "signup"
          ? "Create a free account to save your recipes."
          : "Log in to see what's on the menu today."}
      </p>

      <form
  onSubmit={(e) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    loginUser(
  String(formData.get("email") || ""),
  String(formData.get("password") || ""),
  String(formData.get("displayName") || "")
);
  }}
>
  {authMode === "signup" && (
  <input
    name="displayName"
    type="text"
    value={signupName}
    onChange={(e) => setSignupName(e.target.value)}
    placeholder="Name or nickname (optional)"
    className="mb-4 w-full rounded-full border border-[#ead7c8] bg-white px-5 py-4 text-lg text-[#2b1a12] outline-none"
  />
)}
  <input
    name="email"
    type="email"
    placeholder="Email"
    autoComplete="email"
    className="mb-4 w-full rounded-full border border-[#ead7c8] bg-white px-5 py-4 text-lg text-[#2b1a12] outline-none"
  />

  <div className="relative mb-4">
  <input
  name="password"
  type={showPassword ? "text" : "password"}
  placeholder="Password"
  autoComplete={
    authMode === "signup"

      ? "new-password"
      : "current-password"
  }
  className="w-full rounded-full border border-[#ead7c8] px-5 py-3 pr-20"
/>

  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-5 top-1/2 -translate-y-1/2 text-sm text-[#a63a0a]"
  >
    {showPassword ? "Hide" : "Show"}
  </button>
</div>

  {authError && <p className="mb-4 text-red-600">{authError}</p>}

  <button
    type="submit"
    className="w-full rounded-full bg-[#a63a0a] px-6 py-3 text-white"
  >
    {authMode === "signup" ? "Create Account" : "Log In"}
  </button>
</form>

      <button
  onClick={() => {
    const ua = navigator.userAgent;

    if (/iPhone|iPad|iPod/.test(ua)) {
      showToast(
        "Install Hey Chef:\n\nTap the Share button in Safari, then choose 'Add to Home Screen'."
      );
    } else if (/Android/.test(ua)) {
      showToast(
        "Install Hey Chef:\n\nTap the browser menu and choose 'Install App' or 'Add to Home Screen'."
      );
    } else {
      showToast(
        "Install Hey Chef:\n\nLook for the install icon in Chrome's address bar or use Chrome Menu → Install Hey Chef."
      );
    }
  }}
  className="mt-4 w-full rounded-full border border-[#a63a0a] px-6 py-3 text-[#a63a0a]"
>
  📱 Install Hey Chef
</button>

      {authMode === "login" && (
  <button
    type="button"
    onClick={resetPassword}
    className="mt-4 w-full text-[#a63a0a] underline"
  >
    Forgot password?
  </button>
)}

<button
  type="button"
  onClick={() =>
    setAuthMode(authMode === "login" ? "signup" : "login")
  }
  className="mt-4 w-full text-[#a63a0a]"
>
  {authMode === "login"
    ? "Need an account? Create one"
    : "Already have an account? Log in"}
</button>
    </>
    
  );
}
  if (isResettingPassword) {
  return (
    <main className="min-h-screen bg-[#f8efe6] p-8 text-[#2b1a12]">
      <section className="mx-auto max-w-md rounded-[2rem] bg-white p-6 shadow-xl">
        <h1 className="mb-3 text-3xl font-bold text-[#a63a0a]">
          Reset your password
        </h1>

        <p className="mb-5 text-[#6d5549]">
          Enter a new password for your Hey Chef account.
        </p>

        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New password"
          className="mb-4 w-full rounded-full border border-[#ead7c8] px-5 py-3"
        />

        {authError && <p className="mb-4 text-red-600">{authError}</p>}

        <button
          onClick={updatePassword}
          className="w-full rounded-full bg-[#a63a0a] px-6 py-3 text-white"
        >
          Save new password
        </button>
      </section>
      <BottomNav />
    </main>
  );
}

if (!userEmail) {
  return (
    <main className="min-h-screen bg-[#f8efe6] px-5 py-6 pb-32 text-[#2b1a12] md:p-8">
     <section className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl items-center gap-12 py-8 md:grid-cols-[1.2fr_0.8fr] md:py-16">
        <div>
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-[#a63a0a]">
            Hey Chef
          </p>

          <h1 className="mb-4 text-5xl font-bold leading-tight md:text-7xl">
            Plan meals. Use what you have.
          </h1>

          <p className="mb-6 max-w-xl text-lg text-[#6d5549]">
            Import recipes, plan your week, build your grocery list, and cook with confidence.
          </p>

          {/* Mobile login form goes here */}
          <div className="mb-8 rounded-[2rem] bg-white p-6 shadow-xl md:hidden">
            {renderAuthCard()}
          </div>

          

          <div className="my-6 rounded-[2rem] bg-white p-5 shadow-sm">
  <p className="mb-4 text-[#6d5549]">
    Paste a recipe URL. Hey Chef will clean it into ingredients and steps.
  </p>

  <div className="flex flex-wrap gap-2">
    <input
      value={recipeUrl}
      onChange={(e) => setRecipeUrl(e.target.value)}
      placeholder="https://example.com/recipe"
      className="flex-1 rounded-full border border-[#ead7c8] px-5 py-3"
    />

    <button
      onClick={importRecipe}
      disabled={isImporting}
      className="rounded-full bg-[#a63a0a] px-6 py-3 text-white disabled:opacity-60"
    >
      {isImporting ? "Importing..." : "Import"}
    </button>
  </div>
</div>


          <div
  onClick={() => setSampleRecipe(sampleRecipes[0])}
  className="cursor-pointer rounded-[2rem] bg-white p-5 shadow-sm transition hover:shadow-lg"
>
  <div className="flex flex-col gap-4 md:flex-row">
    <img
      src={sampleRecipes[0].image || placeholderImage}
      alt={sampleRecipes[0].title}
      className="h-40 w-full rounded-2xl object-cover md:w-64"
    />

    <div className="flex-1">
      <h3 className="mb-2 text-2xl font-bold">
        {sampleRecipes[0].title}
      </h3>

      <RecipeMeta recipe={sampleRecipes[0]} />

      <p className="mt-4 text-[#6d5549]">
        Click to preview
      </p>
    </div>
  </div>
</div>
<div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
  {[
    {
      icon: "🌎",
      title: "Save recipes anywhere",
      text: "Import from websites, social media, and shared links.",
    },
    {
      icon: "📅",
      title: "Plan meals faster",
      text: "Organize breakfast, lunch, and dinner in minutes.",
    },
    {
      icon: "🛒",
      title: "Shop smarter",
      text: "Automatically build grocery lists from your meal plan.",
    },
    {
      icon: "📦",
      title: "Use what you have",
      text: "Track pantry items and reduce food waste.",
    },
  ].map((feature) => (
    <div
      key={feature.title}
      className="rounded-3xl bg-white/70 p-4 shadow-sm ring-1 ring-[#ead7c8]/70"
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#fff4ef] text-2xl">
        {feature.icon}
      </div>

      <h3 className="mb-1 font-bold">
        {feature.title}
      </h3>

      <p className="text-sm leading-relaxed text-[#6d5549]">
        {feature.text}
      </p>
    </div>
  ))}
</div>

<div className="mt-5 rounded-full bg-white/70 px-5 py-3 text-center shadow-sm ring-1 ring-[#ead7c8]/70">
  <p className="text-sm font-medium text-[#6d5549]">
    Built with smart logic, not AI guesses.
  </p>
</div>
      
</div>  

        {/* Desktop login form stays in right column */}
        <div className="hidden rounded-[2rem] bg-white p-8 shadow-xl md:block">
          {renderAuthCard()}
        </div>
      </section>
    

      {sampleRecipe && (
  <div
    className="fixed inset-0 z-50 flex items-end bg-black/40 px-4 pb-6 md:items-center md:justify-center md:pb-0"
    onClick={() => setSampleRecipe(null)}
  >
    <div
      className="relative max-h-[90vh] w-full overflow-y-auto rounded-[2rem] bg-white p-5 shadow-xl md:max-w-4xl md:p-6"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => setSampleRecipe(null)}
        className="absolute right-4 top-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white text-3xl text-[#6d5549] shadow-lg hover:text-[#a63a0a]"
      >
        ×
      </button>


      <img
        src={sampleRecipe.image || placeholderImage}
        alt={sampleRecipe.title}
        className="mb-6 h-60 w-full rounded-[1.5rem] object-cover"
      />

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="mb-2 text-4xl font-bold">
            {sampleRecipe.title}
          </h1>

          <RecipeMeta recipe={sampleRecipe} />
        </div>

       <div className="flex flex-col gap-3 md:flex-row md:w-auto w-full">
          <button
            type="button"
            onClick={() => {
              setSampleRecipe(null);
              setAuthMode("signup");
            }}
            className="w-full rounded-full bg-[#fff4ef] px-4 py-2 text-[#a63a0a]"
          >
            Save Recipe
          </button>

          <button
            type="button"
            onClick={() => {
              setSampleRecipe(null);
              setAuthMode("signup");
            }}
            className="w-full rounded-full border border-[#a63a0a] px-4 py-2 text-[#a63a0a]"
          >
            ☆ Favorite
          </button>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-3">
        <button
          onClick={() => {
            setSampleRecipe(null);
            setAuthMode("signup");
          }}
          className="w-full rounded-full bg-[#a63a0a] px-6 py-3 text-white"
        >
          Add Ingredients to Shopping List
        </button>

        <button
          onClick={() => {
            setSampleRecipe(null);
            setAuthMode("signup");
          }}
          className="w-full rounded-full border border-[#a63a0a] px-6 py-3 text-[#a63a0a]"
        >
          Create Account to Save
        </button>
      </div>

      {sampleRecipe.sourceUrl && (
        <a
          href={sampleRecipe.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="mb-6 block text-[#a63a0a] underline"
        >
         🔗 View original recipe
        </a>
      )}

      <div className="mb-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
  <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#ead7c8]">
    <h2 className="mb-4 text-2xl font-bold">Ingredients</h2>

    <ul className="space-y-3">
      {sampleRecipe.ingredients.map((ingredient) => (
        <li key={ingredient} className="flex items-center gap-3">
          <input type="checkbox" disabled className="h-5 w-5" />
          <span>{ingredient}</span>
        </li>
      ))}
    </ul>
  </div>

  <div className="rounded-3xl bg-[#f8efe6] p-5">
    <h2 className="mb-3 text-2xl font-bold">Plan This Recipe</h2>

    <p className="mb-4 text-sm text-[#6d5549]">
      Create a free account to add recipes to your meal plan and shopping list.
    </p>

    <button
      type="button"
      onClick={() => {
        setSampleRecipe(null);
        setAuthMode("signup");
      }}
      className="w-full rounded-full bg-[#a63a0a] px-6 py-3 text-white"
    >
      Create Free Account
    </button>
  </div>
</div>

      <h2 className="mb-4 text-2xl font-bold">Steps</h2>

      <ol className="space-y-3">
        {sampleRecipe.steps.map((step, index) => (
          <li
            key={`${step}-${index}`}
            className="rounded-2xl bg-[#f8efe6] p-4"
          >
            <strong>Step {index + 1}:</strong> {step}
          </li>
        ))}
      </ol>
    </div>
  </div>
)}
<footer className="mt-20 border-t border-[#ead7c8] pt-8 text-center text-sm text-[#6d5549]">
  <p>© 2020–2026 Hey Chef™. All rights reserved.</p>

  <div className="mt-3 flex justify-center gap-6">
    <a href="/privacy">Privacy</a>
    <a href="/terms">Terms</a>
    <a href="/contact">Contact</a>
  </div>
</footer>
    </main>
  );
}

if (showProfile) {
  return (
    <main className="min-h-screen bg-[#f8efe6] px-5 py-6 pb-32 text-[#2b1a12] md:p-8">
      <section className="mx-auto max-w-6xl py-6 md:px-6 md:py-10">
 <nav className="sticky top-0 z-50 -mx-5 mb-8 flex items-start justify-between gap-3 bg-[#f8efe6] px-5 py-4 md:-mx-6 md:px-6">
  <div className="flex flex-col">
  <button
    onClick={goHome}
    className="text-3xl font-bold text-[#a63a0a]"
  >
    Hey Chef™
  </button>

  <button
    onClick={goHome}
    className="mt-1 text-left text-sm text-[#a63a0a]"
  >
   ← Return to Dashboard
  </button>
</div>
</nav>



        <section className="rounded-[2rem] bg-white p-6 shadow-xl">
  <h1 className="mb-2 text-4xl font-bold">Profile</h1>
  <p className="mb-6 text-[#6d5549]">
    Update your name and account settings.
  </p>

<div className="mb-6 rounded-[1.5rem] border border-[#ead7c8] bg-[#fbf7f2] p-5">
  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div>
      <p className="text-sm uppercase tracking-[0.2em] text-[#a63a0a]">
        Membership
      </p>

      <h2 className="text-2xl font-bold">
        {foundingChef ? "👨‍🍳 Founding Chef" : "⭐ Hey Chef Member"}
      </h2>

      <p className="mt-1 text-sm text-[#6d5549]">
        {plan === "free" ? "Free Membership" : "Premium Membership"}
      </p>

      

      <p className="mt-2 text-sm text-[#6d5549]">
        Joined{" "}
        {userCreatedAt
          ? new Date(userCreatedAt).toLocaleDateString()
          : "Recently"}
      </p>

      {foundingChef && supportedAt && (
        <p className="mt-1 text-xs text-[#6d5549]">
          Founding Chef since{" "}
          {new Date(supportedAt).toLocaleDateString()}
        </p>
      )}
    </div>

    {!foundingChef && (
      <button
        onClick={() => {
          window.location.href = "/founding-chef";
        }}
        className="rounded-full border border-[#a63a0a] px-5 py-3 font-semibold text-[#a63a0a] transition hover:bg-[#a63a0a] hover:text-white"
      >
        Become a Founding Chef
      </button>
    )}
  </div>
</div>

  <div className="mb-6 rounded-[1.5rem] border border-[#ead7c8] p-5">
  <p className="mb-1 text-sm uppercase tracking-[0.2em] text-[#a63a0a]">
    Account
  </p>

  <p className="font-semibold">{userEmail}</p>

  <p className="mt-1 text-sm text-[#6d5549]">
    Account created{" "}
    {userCreatedAt
      ? new Date(userCreatedAt).toLocaleDateString()
      : "Recently"}
  </p>
</div>

<label className="mb-2 block font-semibold">
  Display Name
</label>

<input
  value={displayName}
  onChange={(e) => setDisplayName(e.target.value)}
  placeholder="Chef"
  className="mb-5 w-full rounded-full border border-[#ead7c8] px-5 py-3"
/>

<button
  onClick={async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      showToast("Please log in again.");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
      })
      .eq("id", user.id);

    if (error) {
      showToast(error.message);
      return;
    }

    showToast("Profile saved.");
  }}
  className="w-full rounded-full bg-[#a63a0a] px-6 py-3 text-white"
>
  Save Profile
</button>

  <button
    onClick={changePasswordNow}
    className="mt-3 w-full rounded-full border border-[#a63a0a] px-6 py-3 text-[#a63a0a]"
  >
    Change Password
  </button>

  <div className="mt-8 border-t border-[#ead7c8] pt-6">
    <h2 className="mb-2 text-lg font-bold text-red-700">
      Danger Zone
    </h2>

    <p className="mb-4 text-sm text-[#6d5549]">
      Permanently delete your Hey Chef account and saved data.
      <br />
      Contact support and we'll process your request.
    </p>

    <button
      onClick={() => {
        window.location.href =
          "mailto:kcapuchino06@gmail.com?subject=Hey Chef Account Deletion Request";
      }}
      className="w-full rounded-full border border-red-600 px-6 py-3 font-semibold text-red-600"
    >
      Request Account Deletion
    </button>
  </div>
</section>
      </section>

      <BottomNav />
      <footer className="mt-20 border-t border-[#ead7c8] pt-8 text-center text-sm text-[#6d5549]">
  <p>© 2020–2026 Hey Chef™. All rights reserved.</p>

  <div className="mt-3 flex justify-center gap-6">
    <a href="/privacy" className="hover:text-[#a63a0a]">
      Privacy
    </a>

    <a href="/terms" className="hover:text-[#a63a0a]">
      Terms
    </a>

    <a href="/contact" className="hover:text-[#a63a0a]">
      Contact
    </a>
  </div>
</footer>
    </main>
  );
}

  if (showShoppingList) {
    return (
      <main className="min-h-screen bg-[#f8efe6] px-5 py-6 pb-32 text-[#2b1a12] md:p-8">
      <section className="mx-auto max-w-6xl py-6 md:px-6 md:py-10">
  <nav className="sticky top-0 z-50 -mx-5 mb-8 flex items-start justify-between gap-3 bg-[#f8efe6] px-5 py-4 md:-mx-6 md:px-6">
  <div className="flex flex-col">
  <button
    onClick={goHome}
    className="text-3xl font-bold text-[#a63a0a]"
  >
    Hey Chef™
  </button>

  <button
    onClick={goHome}
    className="mt-1 text-left text-sm text-[#a63a0a]"
  >
    ← Return to Dashboard
  </button>
</div>

  <button
    onClick={() => setIsMenuOpen((open) => !open)}
    className="rounded-full bg-white px-4 py-3 text-3xl text-[#a63a0a] shadow md:hidden"
  >
    ☰
  </button>

  <div className="hidden items-center gap-10 text-lg md:flex">
    <button
      onClick={goAllRecipes}
      className={
        currentPage === "recipes"
          ? "font-bold text-[#a63a0a] underline underline-offset-8"
          : "text-[#a63a0a]"
      }
    >
      Recipes
    </button>

    <button
      onClick={goMealPlanner}
      className={
        currentPage === "planner"
          ? "font-bold text-[#a63a0a] underline underline-offset-8"
          : "text-[#a63a0a]"
      }
    >
      Meal Planner 
    </button>

    <button
      onClick={goShoppingList}
      className={
        currentPage === "shopping"
          ? "font-bold text-[#a63a0a] underline underline-offset-8"
          : "text-[#a63a0a]"
      }
    >
      Shopping List ({neededShoppingListCount})
    </button>

    <button
      onClick={goPantry}
      className={
        currentPage === "pantry"
          ? "font-bold text-[#a63a0a] underline underline-offset-8"
          : "text-[#a63a0a]"
      }
    >
      My Pantry
    </button>

    <div ref={settingsRef} className="relative">
      <button
        onClick={() => setShowSettingsMenu((open) => !open)}
        className={
          currentPage === "profile"
            ? "font-bold text-[#a63a0a] underline underline-offset-8"
            : "text-[#a63a0a]"
        }
      >
        ⚙️ Settings
      </button>

      {showSettingsMenu && (
        <div className="absolute right-0 top-10 z-50 w-56 rounded-2xl bg-white p-2 shadow-xl">
          <button
            onClick={() => {
              setShowSettingsMenu(false);
              setCurrentPage("profile");
              setShowProfile(true);
            }}
            className="block w-full rounded-xl px-4 py-3 text-left hover:bg-[#fff4ef]"
          >
            👤 Profile
          </button>

      

          <button
          onClick={() => {
            setIsMenuOpen(false);

            const ua = navigator.userAgent.toLowerCase();

            const isIOS =
              /iphone|ipad|ipod/.test(ua) ||
              (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

            const isAndroid = /android/.test(ua);

            if (isIOS) {
              showToast("Install Hey Chef:\n\nTap Share, then Add to Home Screen.");
              return;
            }

            if (isAndroid) {
              showToast(
                "Install Hey Chef:\n\nTap the browser menu, then Install App or Add to Home Screen."
              );
              return;
            }

            showToast(
              "Install Hey Chef:\n\nClick the install icon in your browser's address bar."
            );
          }}
          className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
        >
          📱 Install App
        </button>

          <button
            onClick={() => {
              setShowSettingsMenu(false);
              logoutUser();
            }}
            className="block w-full rounded-xl px-4 py-3 text-left hover:bg-[#fff4ef]"
          >
            ↪ Log Out
          </button>
        </div>
      )}
    </div>
  </div>

  {isMenuOpen && (
  <div
    ref={mobileMenuRef}
    className="absolute right-0 top-16 z-50 w-64 rounded-3xl bg-white p-4 shadow-xl md:hidden"
  >
      <p className="mb-2 px-4 text-xs uppercase tracking-[0.2em] text-[#a63a0a]">
        Settings
      </p>

      <button
        onClick={() => {
          setIsMenuOpen(false);
          setCurrentPage("profile");
          setShowProfile(true);
        }}
        className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
      >
        👤 Profile
      </button>

      
<button
          onClick={() => {
            setIsMenuOpen(false);

            const ua = navigator.userAgent.toLowerCase();

            const isIOS =
              /iphone|ipad|ipod/.test(ua) ||
              (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

            const isAndroid = /android/.test(ua);

            if (isIOS) {
              showToast("Install Hey Chef:\n\nTap Share, then Add to Home Screen.");
              return;
            }

            if (isAndroid) {
              showToast(
                "Install Hey Chef:\n\nTap the browser menu, then Install App or Add to Home Screen."
              );
              return;
            }

            showToast(
              "Install Hey Chef:\n\nClick the install icon in your browser's address bar."
            );
          }}
          className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
        >
          📱 Install App
        </button>
      <button
        onClick={() => {
          setIsMenuOpen(false);
          logoutUser();
        }}
        className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
      >
        ↪ Log Out
      </button>
    </div>
  )}
</nav>
          

          <section className="mb-8 rounded-[2rem] border border-[#ead7c8] bg-[#fffaf5] p-6 shadow-sm md:p-8">
  <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
    <div>
      <h1 className="text-4xl font-bold md:text-5xl">Shopping List</h1>

       <p className="mt-2 text-[#6d5549]">
        Review ingredients you need and move items into your pantry.
      </p>
    </div>

    <button
  onClick={async () => {
    if (confirm("Clear your shopping list?")) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase
        .from("shopping_items")
        .delete()
        .eq("user_id", user.id);

      if (error) {
        showToast(error.message);
        return;
      }

      setShoppingList([]);
      showToast("Shopping list cleared.");
    }
  }}
  className="rounded-full border border-[#a63a0a] px-6 py-3 text-[#a63a0a]"
>
  🗑 Clear Shopping List
</button>
  </div>

  <div className="grid gap-3 md:grid-cols-[1fr_auto]">
    <input
  id="quick-shopping-item"
  defaultValue=""
  placeholder="🛒 Add grocery item or paste url"
  className="flex-1 rounded-full border border-[#ead7c8] px-5 py-3"
/>

    <button
      onClick={async () => {
  const input = document.getElementById("quick-shopping-item") as HTMLInputElement | null;
const rawShoppingItem = input?.value || "";

if (!rawShoppingItem.trim()) return;

let itemName = rawShoppingItem.trim();
let product: any = null;

  // Instacart product URL
  const originalUrl = itemName;
  if (
    itemName.includes("instacart.com/products/")
  ) {
    try {
      const response = await fetch("/api/import-food", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    url: itemName,
  }),
});

product = await response.json();

      console.log("IMPORTED PRODUCT", product);

      if (product?.title) {
        itemName = product.title;
      }
    } catch (error) {
      console.error(error);
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    showToast("Please log in again.");
    return;
  }
  console.log("PRODUCT BEFORE SAVE", product);
  
  const { data, error } = await supabase
  .from("shopping_items")
  .insert({
    user_id: user.id,
    name: itemName,
    brand: product?.brand || "",
    package_size: product?.packageSize || "",
    image_url: product?.image || "",
    source_url: originalUrl.includes("http") ? originalUrl : "",
    price: product?.price || "",
    store_section:
  product?.category === "Prepared Food"
    ? guessShoppingCategory(itemName)
    : product?.category || guessShoppingCategory(itemName),
  })
  .select()
  .single();

  setShoppingList((current) => [data.name, ...current]);
  setShoppingItemImages({
  ...shoppingItemImages,
  [data.name]: data.image_url || "",
});

setShoppingItemUrls({
  ...shoppingItemUrls,
  [data.name]: data.source_url || "",
});
setShoppingItemCategories({
  ...shoppingItemCategories,
  [data.name]: data.store_section || guessShoppingCategory(data.name),
});
setLastAddedShoppingItem(data);
  if (input) input.value = "";
setNewShoppingItem("");
}}
      className="rounded-full bg-[#a63a0a] px-8 py-3 font-bold text-white"
    >
      Add Items to Shopping List 
    </button>
  </div>
</section>

<section className="mb-8 rounded-[2rem] bg-white p-5 shadow-lg md:p-6">
  <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
    <div className="flex items-center gap-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#fff4ef] text-2xl">
        🛒
      </div>

      <div>
  <h2 className="text-2xl font-bold text-[#a63a0a]">
    Shopping List
  </h2>
  <p className="text-sm font-medium text-[#6d5549]">
    {neededShoppingListCount} items still needed
  </p>
</div>
    </div>

    <div className="grid w-full gap-3 md:w-auto md:grid-cols-[160px_auto_auto]">
      <select
        value={shoppingSort}
        onChange={(e) => setShoppingSort(e.target.value)}
        className="rounded-full border border-[#ead7c8] bg-white px-5 py-3"
      >
        <option value="az">A–Z</option>
        <option value="za">Z–A</option>
        <option value="newest">Newest to Oldest</option>
        <option value="oldest">Oldest to Newest</option>
        <option value="location">Location</option>
      </select>

      <button
        onClick={() => setHidePantryItems(!hidePantryItems)}
        className="rounded-full border border-[#a63a0a] px-6 py-3 font-bold text-[#a63a0a]"
      >
        {hidePantryItems ? "Show Pantry Items" : "Hide Pantry Items"}
      </button>

      <div className="rounded-full bg-[#f8efe6] px-6 py-3 text-center font-bold">
  {shoppingList.length - neededShoppingListCount} On Hand
</div>
    </div>
  </div>

  {shoppingList.length === 0 ? (
    <p className="rounded-2xl border border-[#ead7c8] bg-[#fffaf5] p-5 text-[#6d5549]">
      Your shopping list is empty.
    </p>
  ) : (
    <div className="divide-y divide-[#ead7c8]">
      {checkedShoppingItems.length > 0 && (
  <div className="pb-3">
    <button
      onClick={addCheckedItemsToPantry}
      className="w-full rounded-full border border-[#a63a0a] px-4 py-2 text-sm font-bold text-[#a63a0a]"
    >
      Add Checked to Pantry
    </button>
  </div>
)}
      {Object.values(
        shoppingList.reduce<Record<string, { item: string; count: number }>>(
          (groups, item) => {
            const key = cleanForSort(item);

            if (!groups[key]) {
              groups[key] = { item, count: 0 };
            }

            groups[key].count += 1;
            return groups;
          },
          {}
        )
      )
        .filter(({ item }) => {
  const matchingPantryItem = getMatchingPantryItem(item);
  const isManuallyMarkedOnHand = manuallyMarkedOnHand.includes(item);
  const isBuyAnyway = buyAnywayItems.includes(item);

  if (!hidePantryItems) {
    return true;
  }

  return (
    isBuyAnyway ||
    (!matchingPantryItem && !isManuallyMarkedOnHand)
  );
})
        .sort((a, b) => {
  if (shoppingSort === "za") {
    return cleanForSort(b.item).localeCompare(cleanForSort(a.item));
  }

  if (shoppingSort === "newest") {
    return shoppingList.indexOf(a.item) - shoppingList.indexOf(b.item);
  }

  if (shoppingSort === "oldest") {
    return shoppingList.indexOf(b.item) - shoppingList.indexOf(a.item);
  }

  if (shoppingSort === "location") {
    const categoryA = shoppingItemCategories[a.item] || guessShoppingCategory(a.item);
    const categoryB = shoppingItemCategories[b.item] || guessShoppingCategory(b.item);

    const categoryCompare =
      shoppingCategories.indexOf(categoryA) -
      shoppingCategories.indexOf(categoryB);

    if (categoryCompare !== 0) return categoryCompare;

    return cleanForSort(a.item).localeCompare(cleanForSort(b.item));
  }

  return cleanForSort(a.item).localeCompare(cleanForSort(b.item));
})
        
        .map(({ item, count }) => {
          const matchingPantryItem = getMatchingPantryItem(item);
          const isManuallyMarkedOnHand = manuallyMarkedOnHand.includes(item);
           const linkedFoodItem = recipes.find((recipe) => {
  if (recipe.type !== "grocery") return false;

  return normalizeItemName(recipe.title) === normalizeItemName(item);
});

const linkedRecipe = linkedFoodItem
  ? null
  : recipes.find((recipe) => {
      if (recipe.type === "grocery") return false;

      return (recipe.ingredients || []).some(
        (ingredient) =>
          normalizeItemName(ingredient) === normalizeItemName(item)
      );
    });

const recipeUrl = linkedRecipe?.sourceUrl || "";

const storeUrl =
  shoppingItemUrls[item] ||
  linkedFoodItem?.sourceUrl ||
  "";

const itemImage =
  shoppingItemImages[item] ||
  linkedFoodItem?.image ||
  linkedRecipe?.image ||
  "";

           const displayName = `${item
  .replace(/,\s*(optional|for garnish|divided|to taste).*$/i, "")
  .replace(/\(\(.*?\)\)/g, "")
  .replace(/\(optional.*?\)/gi, "")
  .replace(/\s+/g, " ")
  .trim()}${count > 1 ? ` ×${count}` : ""}`;

          return (
            <div
              key={item}
              className="grid gap-3 border-b border-[#ead7c8] py-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
            >
              <label className="flex min-w-0 items-center gap-3">
                <input
                  type="checkbox"
                  checked={checkedShoppingItems.includes(item)}
                  onChange={(e) =>
                    toggleShoppingItemChecked(item, e.target.checked)
                  }
                />
                {itemImage ? (
  <img
    src={itemImage}
    alt={item}
    className="h-12 w-12 shrink-0 rounded-xl object-cover"
  />
) : (
  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#fff4ef] text-xl">
  {getShoppingItemIcon(item)}
</div>
)}

<div className="min-w-0">
  <p className="max-w-[52ch] break-words font-medium leading-snug">
    {displayName}
  </p>

  {storeUrl ? (
  <a
    href={storeUrl}
    target="_blank"
    rel="noopener noreferrer"
    onClick={(e) => e.stopPropagation()}
    className="text-sm font-bold text-[#a63a0a] hover:underline"
  >
    🛒 View in Store
  </a>
) : recipeUrl ? (
  <a
    href={recipeUrl}
    target="_blank"
    rel="noopener noreferrer"
    onClick={(e) => e.stopPropagation()}
    className="text-sm font-bold text-[#a63a0a] hover:underline"
  >
    📖 View Recipe
  </a>
) : null}
</div>

                
              </label>
              

              <div className="flex flex-wrap items-center gap-3 pl-7 md:pl-0">
                <select
  value={shoppingItemCategories[item] || guessShoppingCategory(item)}
  onChange={async (e) => {
    const newCategory = e.target.value;

    setShoppingItemCategories((current) => ({
      ...current,
      [item]: newCategory,
    }));

    const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) return;

const { error } = await supabase
  .from("shopping_items")
  .update({ store_section: newCategory })
  .eq("user_id", user.id)
  .eq("name", item);

    if (error) {
      showToast(error.message);
    }
  }}
  className="rounded-full border border-[#ead7c8] bg-white px-4 py-2 text-sm"
>
  {shoppingCategories.map((category) => (
    <option key={category} value={category}>
      {category}
    </option>
  ))}
</select>
  
  {matchingPantryItem ? (
    <>
      <span className="text-sm text-[#6d5549]">
        ✓ In pantry: {matchingPantryItem.quantity || "on hand"}
      </span>

      {buyAnywayItems.includes(item) ? (
        <button
          onClick={() => {
            setBuyAnywayItems(
              buyAnywayItems.filter(
                (savedItem) => savedItem !== item
              )
            );
          }}
          className="text-sm font-medium text-[#a63a0a]"
        >
          Move Back
        </button>
      ) : (
        <button
          onClick={() => {
            setBuyAnywayItems([...buyAnywayItems, item]);
          }}
          className="text-sm font-medium text-[#a63a0a]"
        >
          Buy Anyway
        </button>
      )}
    </>
  ) : isManuallyMarkedOnHand ? (
    <>
      <span className="text-sm text-[#6d5549]">
        ✓ On hand
      </span>

      <button
        onClick={() => {
          setManuallyMarkedOnHand(
            manuallyMarkedOnHand.filter(
              (savedItem) => savedItem !== item
            )
          );
        }}
        className="text-sm font-medium text-[#a63a0a]"
      >
        Move Back
      </button>
    </>
  ) : (
    <>
      <button
        onClick={() =>
          setManuallyMarkedOnHand((current) => [...current, item])
        }
        className="text-sm font-medium text-[#a63a0a]"
      >
        Mark On Hand
      </button>

      <button
        onClick={() => {
          if (!confirm(`Remove ${item} from your shopping list?`))
            return;

          removeShoppingItem(item);
        }}
        className="text-sm font-medium text-[#a63a0a]"
      >
        Remove
      </button>
    </>
  )}
</div>
            </div>
          );
        })}

      {checkedShoppingItems.length > 0 && (
        <div className="pt-5">
          <button
            onClick={addCheckedItemsToPantry}
            className="w-full rounded-full border border-[#a63a0a] px-5 py-3 text-sm font-bold text-[#a63a0a]"
          >
            Add Checked to Pantry
          </button>
        </div>
      )}
    </div>
  )}
</section>
<section className="mb-8 rounded-[2rem] bg-white p-5 shadow-lg md:p-6">
  <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
  <div className="flex items-center gap-4">
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#fff4ef] text-2xl">
      👩‍🍳
    </div>

    <div>
      <h2 className="text-2xl font-bold text-[#a63a0a]">
        Cooking Queue
      </h2>
      <p className="text-sm text-[#6d5549]">
        Recipes you’re planning to make with these ingredients
      </p>
    </div>
  </div>

  <div className="mt-5 grid gap-2 md:flex md:flex-wrap">
    <button
      onClick={() => setCookingQueueFilter("all")}
      className={`w-full md:w-40 rounded-full px-4 py-3 text-sm font-bold text-center ${
        cookingQueueFilter === "all"
          ? "bg-[#a63a0a] text-white"
          : "border border-[#a63a0a] text-[#a63a0a]"
      }`}
    >
      All
    </button>

    <button
      onClick={() => setCookingQueueFilter("ready")}
      className={`w-full md:w-40 rounded-full px-4 py-3 text-sm font-bold text-center ${
        cookingQueueFilter === "ready"
          ? "bg-[#a63a0a] text-white"
          : "border border-[#a63a0a] text-[#a63a0a]"
      }`}
    >
      Ready to Make
    </button>

    <button
      onClick={() => setCookingQueueFilter("needs")}
      className={`w-full md:w-40 rounded-full px-4 py-3 text-sm font-bold text-center ${
        cookingQueueFilter === "needs"
          ? "bg-[#a63a0a] text-white"
          : "border border-[#a63a0a] text-[#a63a0a]"
      }`}
    >
      Needs Items
    </button>
  </div>
</div>

  {cookingQueue.filter((recipe) => !recipe.isMade).length === 0 ? (
  <p className="rounded-2xl border border-[#ead7c8] bg-[#fffaf5] p-5 text-[#6d5549]">
    No planned recipes yet. Add recipes to your meal planner to see them here.
  </p>
) : (
  <div className="space-y-3">
    {cookingQueue
  .filter((recipe) => !recipe.isMade)
  .slice(0, showAllCookingQueue ? cookingQueue.length : 3)
  .map((recipe) => (
    
      <div
        key={recipe.mealPlanId}
        className="flex flex-col gap-4 rounded-2xl border border-[#ead7c8] p-4 md:flex-row md:items-center md:justify-between"
      >
        <div className="flex gap-4">
          <img
            src={recipe.image || placeholderImage}
            alt={recipe.title}
            className="h-20 w-24 rounded-2xl object-cover"
          />

          <div>
            <span className="mb-1 inline-block rounded-full bg-[#fff4ef] px-3 py-1 text-xs font-bold text-[#a63a0a]">
  {recipe.source === "leftovers"
  ? `Leftovers • ${new Date(
      recipe.plannedDate + "T00:00:00"
    ).toLocaleDateString("en-US", {
      weekday: "long",
    })}`
  : recipe.plannedDate
  ? `${
      recipe.weekStart === getWeekStartDate("current") ? "This" : "Next"
    } ${new Date(recipe.plannedDate + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "long",
    })}`
  : "Planned"}
</span>


            <h3 className="font-bold">{recipe.title}</h3>
{canMakeRecipeFromPantry(recipe) ? (
  <span className="mt-1 inline-block rounded-full bg-[#e4f1dc] px-3 py-1 text-xs font-bold text-[#3f7f32]">
    {recipe.type === "grocery" ? "READY TO EAT" : "READY TO COOK"}
  </span>
) : (
  <span className="mt-1 inline-block rounded-full bg-[#f3ece7] px-3 py-1 text-xs font-bold text-[#6d5549]">
    {recipe.type === "grocery" ? "OUT OF STOCK" : "NEEDS ITEMS"}
  </span>
)}
            <p className="text-sm text-[#3f7f32]">
  {getRecipePantryGaps(recipe).length} ingredients still needed
</p>

            <div className="mt-2 flex flex-wrap gap-2">
              {recipe.ingredients.slice(0, 3).map((ingredient) => (
                <span
                  key={ingredient}
                  className="rounded-full bg-[#f8efe6] px-3 py-1 text-xs text-[#6d5549]"
                >
                  {cleanIngredientName(cleanPantryDisplayName(ingredient))}
                </span>
              ))}

              {recipe.ingredients.length > 3 && (
                <span className="rounded-full bg-[#f8efe6] px-3 py-1 text-xs text-[#6d5549]">
                  +{recipe.ingredients.length - 3} more
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 md:shrink-0">
          <button
            onClick={() => {
              setSelectedRecipe(recipe);
              setCurrentPage("recipes");
              setShowAllRecipes(false);
              setShowMealPlanner(false);
              setShowShoppingList(false);
              setShowPantry(false);
            }}
            className="rounded-full border border-[#a63a0a] px-5 py-2 text-sm font-bold text-[#a63a0a]"
          >
            View Recipe
          </button>

          <button
  onClick={() => markRecipeMade(recipe)}
  className="rounded-full bg-[#a63a0a] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#8f3008]"
>
  ✓ Made This
</button>
                </div>
                
      </div>
        ))}

    {cookingQueue.filter((recipe) => !recipe.isMade).length > 3 && (
      <button
        onClick={() => setShowAllCookingQueue(!showAllCookingQueue)}
        className="mt-4 w-full rounded-full border border-[#a63a0a] px-6 py-3 font-bold text-[#a63a0a]"
      >
        {showAllCookingQueue
          ? "Show Less"
          : `Show All ${cookingQueue.filter((recipe) => !recipe.isMade).length}`}
      </button>
    )}
  </div>
)}

</section>
{recentlyMade.length > 0 && (
  <section className="mb-8 rounded-[2rem] border border-[#cfe3bf] bg-white p-5 shadow-lg md:p-6">
    <div className="mb-5 flex items-center gap-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e4f1dc] text-2xl">
        ✓
      </div>

      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-[#3f7f32]">
            Recently Made
          </h2>

          <span className="rounded-full bg-[#e4f1dc] px-3 py-1 text-sm font-bold text-[#3f7f32]">
            {recentlyMade.length}
          </span>
        </div>

        <p className="text-sm text-[#6d5549]">
          Recipes you've cooked recently
        </p>

        <button
  onClick={() => setShowAllRecentlyMade(!showAllRecentlyMade)}
  className="mt-2 text-sm font-bold text-[#a63a0a]"
>
  {showAllRecentlyMade ? "Show recent 4" : "View full history"}
  
</button>
      </div>
    </div>

    <div className="grid gap-4 md:grid-cols-4">
      {(showAllRecentlyMade ? recentlyMade : recentlyMade.slice(0, 4)).map((item: any) => {
        const recipe = item.recipes;

        const recipeImage =
          recipe?.image_url ||
          recipe?.image ||
          item.image_url ||
          placeholderImage;

        const recipeTitle =
          recipe?.title ||
          item.title ||
          "Recently made";

        const isRecipe = !!recipe;

        return (
  <div
    key={item.id}
    className="rounded-3xl border border-[#ead7c8] bg-[#fffaf5] p-3 text-left transition hover:-translate-y-1 hover:shadow-lg"
  >
    <button
      type="button"
      onClick={() => {
        if (!isRecipe) return;
        setSelectedRecipe({
          id: recipe.id,
          title: recipe.title,
          image: recipe.image_url || recipe.image || "",
          ingredients: recipe.ingredients || [],
          steps: recipe.steps || [],
          cookTime: recipe.cook_time || "",
          servings: recipe.servings || "",
          category: recipe.category || "",
          sourceUrl: recipe.source_url || "",
          isFavorite: recipe.is_favorite || false,
          createdAt: recipe.created_at || "",
        });

        setCurrentPage("recipes");
        setShowAllRecipes(false);
        setShowMealPlanner(false);
        setShowShoppingList(false);
        setShowPantry(false);
        setShowImport(false);

        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      className="w-full text-left"
    >
      <img
        src={recipeImage}
        alt={recipeTitle}
        className="mb-3 h-24 w-full rounded-2xl object-cover"
      />

      <h3 className="font-bold text-[#2b1a12]">
        {recipe?.title || item.title || "Recently made"}
      </h3>

      <p className="text-sm text-[#6d5549]">
        Made {new Date(item.cooked_at).toLocaleDateString()}
      </p>
    </button>

    <button
  type="button"
  onClick={() => makeRecentlyMadeAgain(item)}
  className="mt-3 w-full rounded-full border border-[#a63a0a] px-4 py-2 text-sm font-bold text-[#a63a0a]"
>
  {isRecipe ? "Make Again" : "Buy Again"}
</button>
  </div>
);
      })}
    </div>
  </section>
)}
        </section>
        {showPantryModal && PantryModal()}
    

      {toastMessage && (
  <div className="fixed left-1/2 top-6 z-[9999] -translate-x-1/2 rounded-full bg-[#2b1a12] px-6 py-3 text-white shadow-xl">
    {toastMessage}
  </div>
)}
<BottomNav />
<footer className="mt-20 border-t border-[#ead7c8] pt-8 text-center text-sm text-[#6d5549]">
  <p>© 2020–2026 Hey Chef™. All rights reserved.</p>

  <div className="mt-3 flex justify-center gap-6">
    <a href="/privacy" className="hover:text-[#a63a0a]">
      Privacy
    </a>

    <a href="/terms" className="hover:text-[#a63a0a]">
      Terms
    </a>

    <a href="/contact" className="hover:text-[#a63a0a]">
      Contact
    </a>
  </div>
</footer>
      </main>
    );
  }

  if (showMealPlanner) {
    return (
      <main className="min-h-screen bg-[#f8efe6] px-5 py-6 pb-32 text-[#2b1a12] md:p-8">
        <section className="mx-auto max-w-6xl py-6 md:px-6 md:py-10">
  <nav className="sticky top-0 z-50 -mx-5 mb-8 flex items-start justify-between gap-3 bg-[#f8efe6] px-5 py-4 md:-mx-6 md:px-6">
    <div className="flex flex-col">
  <button
    onClick={goHome}
    className="text-3xl font-bold text-[#a63a0a]"
  >
   Hey Chef™
  </button>

  <button
    onClick={goHome}
    className="mt-1 text-left text-sm text-[#a63a0a]"
  >
    ← Return to Dashboard
  </button>
</div>

  <button
    onClick={() => setIsMenuOpen((open) => !open)}
    className="rounded-full bg-white px-4 py-3 text-3xl text-[#a63a0a] shadow md:hidden"
  >
    ☰
  </button>

  <div className="hidden items-center gap-10 text-lg md:flex">
    <button
      onClick={goAllRecipes}
      className={
        currentPage === "recipes"
          ? "font-bold text-[#a63a0a] underline underline-offset-8"
          : "text-[#a63a0a]"
      }
    >
      Recipes
    </button>

    <button
      onClick={goMealPlanner}
      className={
        currentPage === "planner"
          ? "font-bold text-[#a63a0a] underline underline-offset-8"
          : "text-[#a63a0a]"
      }
    >
      Meal Planner
    </button>

    <button
      onClick={goShoppingList}
      className={
        currentPage === "shopping"
          ? "font-bold text-[#a63a0a] underline underline-offset-8"
          : "text-[#a63a0a]"
      }
    >
      Shopping List ({neededShoppingListCount})
    </button>

    <button
      onClick={goPantry}
      className={
        currentPage === "pantry"
          ? "font-bold text-[#a63a0a] underline underline-offset-8"
          : "text-[#a63a0a]"
      }
    >
      My Pantry
    </button>

    <div ref={settingsRef} className="relative">
      <button
        onClick={() => setShowSettingsMenu((open) => !open)}
        className={
          currentPage === "profile"
            ? "font-bold text-[#a63a0a] underline underline-offset-8"
            : "text-[#a63a0a]"
        }
      >
        ⚙️ Settings
      </button>

      {showSettingsMenu && (
        <div className="absolute right-0 top-10 z-50 w-56 rounded-2xl bg-white p-2 shadow-xl">
          <button
            onClick={() => {
              setShowSettingsMenu(false);
              setCurrentPage("profile");
              setShowProfile(true);
            }}
            className="block w-full rounded-xl px-4 py-3 text-left hover:bg-[#fff4ef]"
          >
            👤 Profile
          </button>

          

          <button
          onClick={() => {
            setIsMenuOpen(false);

            const ua = navigator.userAgent.toLowerCase();

            const isIOS =
              /iphone|ipad|ipod/.test(ua) ||
              (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

            const isAndroid = /android/.test(ua);

            if (isIOS) {
              showToast("Install Hey Chef:\n\nTap Share, then Add to Home Screen.");
              return;
            }

            if (isAndroid) {
              showToast(
                "Install Hey Chef:\n\nTap the browser menu, then Install App or Add to Home Screen."
              );
              return;
            }

            showToast(
              "Install Hey Chef:\n\nClick the install icon in your browser's address bar."
            );
          }}
          className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
        >
          📱 Install App
        </button>

          <button
            onClick={() => {
              setShowSettingsMenu(false);
              logoutUser();
            }}
            className="block w-full rounded-xl px-4 py-3 text-left hover:bg-[#fff4ef]"
          >
            ↪ Log Out
          </button>
        </div>
      )}
    </div>
  </div>

  {isMenuOpen && (
  <div
    ref={mobileMenuRef}
    className="absolute right-0 top-16 z-50 w-64 rounded-3xl bg-white p-4 shadow-xl md:hidden"
  >
      <p className="mb-2 px-4 text-xs uppercase tracking-[0.2em] text-[#a63a0a]">
        Settings
      </p>

      <button
        onClick={() => {
          setIsMenuOpen(false);
          setCurrentPage("profile");
          setShowProfile(true);
        }}
        className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
      >
        👤 Profile
      </button>

      
<button
          onClick={() => {
            setIsMenuOpen(false);

            const ua = navigator.userAgent.toLowerCase();

            const isIOS =
              /iphone|ipad|ipod/.test(ua) ||
              (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

            const isAndroid = /android/.test(ua);

            if (isIOS) {
              showToast("Install Hey Chef:\n\nTap Share, then Add to Home Screen.");
              return;
            }

            if (isAndroid) {
              showToast(
                "Install Hey Chef:\n\nTap the browser menu, then Install App or Add to Home Screen."
              );
              return;
            }

            showToast(
              "Install Hey Chef:\n\nClick the install icon in your browser's address bar."
            );
          }}
          className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
        >
          📱 Install App
        </button>
      <button
        onClick={() => {
          setIsMenuOpen(false);
          logoutUser();
        }}
        className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
      >
        ↪ Log Out
      </button>
    </div>
  )}
</nav>
  

          <div className="mb-8 rounded-[2rem] border border-[#ead7c8] bg-[#fffaf5] p-6 shadow-sm md:p-8">
  <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
  <div>
    <h1 className="text-4xl font-bold md:text-5xl">Weekly Meal Planner</h1>
    <p className="mt-2 text-[#6d5549]">
  Add up to 3 recipes per meal slot. Weeks automatically roll forward.
</p>
  </div>

  <div className="grid w-full gap-3 md:w-auto md:grid-cols-2">
    <button
      onClick={addNewMealPlanItemsToShoppingList}
      className="w-full rounded-full bg-[#a63a0a] px-6 py-3 text-white"
    >
     Add to List
    </button>

    <button
      onClick={async () => {
  if (confirm("Clear your meal plan and start fresh?")) {
    const { error } = await supabase
      .from("meal_plan")
  .delete()
  .eq("week_start", getWeekStartDate(activePlannerWeek));

    if (error) {
      showToast(error.message);
      return;
    }

    const updatedMealPlan = { ...mealPlan };

Object.keys(updatedMealPlan).forEach((key) => {
  if (key.startsWith(`${activePlannerWeek}-`)) {
    delete updatedMealPlan[key];
  }
});

setMealPlan(updatedMealPlan);
  }
}}
      className="w-full rounded-full border border-[#a63a0a] px-6 py-3 text-[#a63a0a]"
    >
      Reset Week
    </button>
  </div>
</div>
</div>
{plannerPopup && (
  <section className="fixed inset-0 z-50 flex items-end bg-black/30 px-4 pb-6 md:items-center md:justify-center md:pb-0">
    <div className="w-full rounded-[2rem] bg-white p-6 shadow-2xl md:max-w-md">
      <h2 className="mb-2 text-3xl font-bold">Add to Plan</h2>

      <p className="mb-5 text-[#6d5549]">
        Add something to{" "}
        {new Date(plannerPopup.day + "T00:00:00").toLocaleDateString(
          "en-US",
          {
            weekday: "long",
            month: "long",
            day: "numeric",
          }
        )}{" "}
        • {plannerPopup.meal}
      </p>

      <select
  value={plannerRecipeId}
  onChange={(e) => {
    setPlannerRecipeId(e.target.value);
    setPlannerShoppingItemId("");
    setPlannerLeftoverId("");
  }}
  className="mb-4 w-full rounded-full border border-[#ead7c8] bg-white px-5 py-4 pr-12 text-[#2b1a12]"
>
  <option value="">Choose a recipe</option>
  {recipes
    .filter((recipe) => recipe.isPlanningQueue || recipe.isFavorite)
    .sort((a, b) => Number(!!b.isFavorite) - Number(!!a.isFavorite))
    .map((recipe) => (
      <option key={recipe.id} value={recipe.id}>
        {recipe.title}
      </option>
    ))}
</select>

<p className="mb-3 text-center text-sm font-bold text-[#6d5549]">or</p>

<select
  value={plannerShoppingItemId}
  onChange={(e) => {
    setPlannerShoppingItemId(e.target.value);
    setPlannerRecipeId("");
    setPlannerLeftoverId("");
  }}
  className="mb-4 w-full rounded-full border border-[#ead7c8] bg-white px-5 py-4 pr-12 text-[#2b1a12]"
>
  <option value="">Plan from shopping list</option>
  {shoppingList.map((item, index) => (
    <option key={`${item}-${index}`} value={item}>
      {item}
    </option>
  ))}
</select>

<p className="mb-3 text-center text-sm font-bold text-[#6d5549]">or</p>

<select
  value={plannerLeftoverId}
  onChange={(e) => {
    setPlannerLeftoverId(e.target.value);
    setPlannerRecipeId("");
    setPlannerShoppingItemId("");
  }}
  className="mb-4 w-full rounded-full border border-[#ead7c8] bg-white px-5 py-4 pr-12 text-[#2b1a12]"
>
  <option value="">Plan leftovers</option>
  {Object.values(mealPlan)
  .flat()
  .filter((item) => !item.isMade)
  .filter(
    (item, index, array) =>
      index ===
      array.findIndex(
        (other) =>
          normalizeItemName(other.title) === normalizeItemName(item.title)
      )
  )
  .map((item) => (
      <option key={item.mealPlanId} value={item.mealPlanId}>
        {item.title}
      </option>
    ))}
</select>

      <button
  onClick={
    plannerRecipeId
      ? addRecipeFromPlanner
      : plannerShoppingItemId
      ? addShoppingListFromPlanner
      : addLeftoverFromPlanner
  }
  disabled={!plannerRecipeId && !plannerShoppingItemId && !plannerLeftoverId}
  className="w-full rounded-full bg-[#a63a0a] px-6 py-4 text-white disabled:opacity-50"
>
  Add to {plannerPopup.meal}
</button>

      <button
        onClick={() => setPlannerPopup(null)}
        className="mt-4 w-full rounded-full bg-[#fff4ef] px-6 py-3 text-[#a63a0a]"
      >
        Cancel
      </button>
    </div>
  </section>
)}
<div className="mb-6 grid grid-cols-2 gap-3 rounded-full bg-white p-2 shadow">
  <button
  onClick={() => {
    setActivePlannerWeek("current");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }}
  className={`rounded-full px-5 py-3 font-semibold transition ${
    activePlannerWeek === "current"
      ? "bg-[#a63a0a] text-white shadow"
      : "text-[#a63a0a]"
  }`}
>
  This Week
</button>

<button
  onClick={() => {
    setActivePlannerWeek("next");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }}
  className={`rounded-full px-5 py-3 font-semibold transition ${
    activePlannerWeek === "next"
      ? "bg-[#a63a0a] text-white shadow"
      : "text-[#a63a0a]"
  }`}
>
  Next Week
</button>
</div>
<div className="grid gap-4">
  {plannerDays.map((day: { label: string; date: string }) => (
  <div
    key={day.date}
    className="rounded-3xl bg-white p-4 shadow md:p-5"
  >
    <h2 className="mb-4 text-2xl font-bold text-[#a63a0a]">
      {day.label}
    </h2>

    <div className="grid gap-4 md:grid-cols-3">
      {meals.map((meal) => {
        const key = getMealPlanKey(day.date, meal);
        const plannedRecipes = mealPlan[key] || [];

          return (
           <div
  key={meal}
  className="rounded-2xl bg-[#f8efe6] p-4 md:p-5"
>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-bold">{meal}</h3>

                <span className="rounded-full bg-white px-3 py-1 text-xs text-[#6d5549]">
                  {plannedRecipes.length}/3
                </span>
              </div>
              

              {plannedRecipes.length === 0 ? (
                <p className="text-sm text-[#6d5549]">No recipes added.</p>
              ) : (
                <div className="space-y-2">
                  {plannedRecipes
    .slice(0, showAllCookingQueue ? plannedRecipes.length : 5)
    .map((recipe) => (
      <div
  key={recipe.mealPlanId}
  className={`rounded-xl p-3 text-sm transition ${
    recipe.isMade
      ? "bg-[#f3f3f3] opacity-60"
      : recipe.source === "leftovers"
      ? "border border-[#cfe0f7] bg-[#f6faff]"
      : recipe.source === "shopping_list"
      ? "border border-[#cfe3bf] bg-[#fbfff7]"
      : "bg-white"
  }`}
>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={recipe.image || placeholderImage}
              alt={recipe.title}
              className="h-10 w-10 rounded-lg object-cover"
            />

            <button
              onClick={() => {
                setSelectedRecipe(recipe);
                setShowAllRecipes(false);
                setShowMealPlanner(false);
                setShowShoppingList(false);
                setIsEditingRecipe(false);
                setEditRecipeDraft(null);

                setTimeout(() => {
                  window.scrollTo(0, 0);
                }, 0);
              }}

   className={`text-left font-medium hover:underline ${
  recipe.isMade
    ? "text-[#8a8a8a]"
    : recipe.source === "shopping_list"
    ? "text-[#3f7f32]"
    : "text-[#a63a0a]"
}`}
  >
    {recipe.title}

  {recipe.source === "shopping_list" && (
    <p className="mt-1 text-xs font-bold text-[#3f7f32]">
      From shopping list
    </p>
  )}

  {recipe.source === "leftovers" && (
    <p className="mt-1 text-xs font-bold text-[#4f6fa8]">
      Leftovers
    </p>
  )}

  {recipe.isMade && (
    <p className="mt-1 text-xs font-bold text-[#8a8a8a]">
      ✓ Made
    </p>
  )}
</button>
</div>

                        <button
  onClick={() => {
    if (
      !confirm(
        `Remove ${recipe.title} from your meal plan?`
      )
    )
      return;

    removeRecipeFromMealPlan(
      day.date,
      meal,
      recipe.mealPlanId
    );
  }}
  className="shrink-0 text-[#a63a0a]"
>
  Remove
</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {plannedRecipes.length <3 && (
                <button
                  onClick={() => {
  setPlannerPopup({ day: day.date, meal });
  setPlannerRecipeId("");
  setPlannerShoppingItemId("");
}}
                  className="mt-4 w-full rounded-full bg-white px-4 py-3 text-sm font-semibold text-[#a63a0a] shadow-sm"
                >
                  + Add from Queue
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  ))}
</div>
        </section>
<BottomNav />
<footer className="mt-20 border-t border-[#ead7c8] pt-8 text-center text-sm text-[#6d5549]">
  <p>© 2020–2026 Hey Chef™. All rights reserved.</p>

  <div className="mt-3 flex justify-center gap-6">
    <a href="/privacy" className="hover:text-[#a63a0a]">
      Privacy
    </a>

    <a href="/terms" className="hover:text-[#a63a0a]">
      Terms
    </a>

    <a href="/contact" className="hover:text-[#a63a0a]">
      Contact
    </a>
  </div>
</footer>
      </main>
    );
  }

  const filteredPantryItems = pantryItems
  .filter((item) =>
    pantryCategoryFilter === "all"
      ? true
      : item.category === pantryCategoryFilter
  )
  .sort((a, b) => {
    if (pantrySort === "az") {
      return a.name.localeCompare(b.name);
    }

    if (pantrySort === "za") {
      return b.name.localeCompare(a.name);
    }

    if (pantrySort === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }

    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

if (showPantry) {
  return (
    <main className="min-h-screen bg-[#f8efe6] px-5 py-6 pb-32 text-[#2b1a12] md:p-8">
  <section className="mx-auto max-w-6xl py-6 md:px-6 md:py-10">
        <nav className="sticky top-0 z-50 -mx-5 mb-8 flex items-start justify-between gap-3 bg-[#f8efe6] px-5 py-4 md:-mx-6 md:px-6">
  <div className="flex flex-col">
  <button
    onClick={goHome}
    className="text-3xl font-bold text-[#a63a0a]"
  >
   Hey Chef™
  </button>

  <button
    onClick={goHome}
    className="mt-1 text-left text-sm text-[#a63a0a]"
  >
    ← Return to Dashboard
  </button>
</div>

  <button
    onClick={() => setIsMenuOpen((open) => !open)}
    className="rounded-full bg-white px-4 py-3 text-3xl text-[#a63a0a] shadow md:hidden"
  >
    ☰
  </button>

  <div className="hidden items-center gap-10 text-lg md:flex">
    <button
      onClick={goAllRecipes}
      className={
        currentPage === "recipes"
          ? "font-bold text-[#a63a0a] underline underline-offset-8"
          : "text-[#a63a0a]"
      }
    >
      Recipes
    </button>

    <button
      onClick={goMealPlanner}
      className={
        currentPage === "planner"
          ? "font-bold text-[#a63a0a] underline underline-offset-8"
          : "text-[#a63a0a]"
      }
    >
      Meal Planner 
    </button>

    <button
      onClick={goShoppingList}
      className={
        currentPage === "shopping"
          ? "font-bold text-[#a63a0a] underline underline-offset-8"
          : "text-[#a63a0a]"
      }
    >
      Shopping List ({neededShoppingListCount})
    </button>

    <button
      onClick={goPantry}
      className={
        currentPage === "pantry"
          ? "font-bold text-[#a63a0a] underline underline-offset-8"
          : "text-[#a63a0a]"
      }
    >
      My Pantry
    </button>

    <div ref={settingsRef} className="relative">
      <button
        onClick={() => setShowSettingsMenu((open) => !open)}
        className={
          currentPage === "profile"
            ? "font-bold text-[#a63a0a] underline underline-offset-8"
            : "text-[#a63a0a]"
        }
      >
        ⚙️ Settings
      </button>

      {showSettingsMenu && (
        <div className="absolute right-0 top-10 z-50 w-56 rounded-2xl bg-white p-2 shadow-xl">
          <button
            onClick={() => {
              setShowSettingsMenu(false);
              setCurrentPage("profile");
              setShowProfile(true);
            }}
            className="block w-full rounded-xl px-4 py-3 text-left hover:bg-[#fff4ef]"
          >
            👤 Profile
          </button>

          

          <button
          onClick={() => {
            setIsMenuOpen(false);

            const ua = navigator.userAgent.toLowerCase();

            const isIOS =
              /iphone|ipad|ipod/.test(ua) ||
              (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

            const isAndroid = /android/.test(ua);

            if (isIOS) {
              showToast("Install Hey Chef:\n\nTap Share, then Add to Home Screen.");
              return;
            }

            if (isAndroid) {
              showToast(
                "Install Hey Chef:\n\nTap the browser menu, then Install App or Add to Home Screen."
              );
              return;
            }

            showToast(
              "Install Hey Chef:\n\nClick the install icon in your browser's address bar."
            );
          }}
          className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
        >
          📱 Install App
        </button>

          <button
            onClick={() => {
              setShowSettingsMenu(false);
              logoutUser();
            }}
            className="block w-full rounded-xl px-4 py-3 text-left hover:bg-[#fff4ef]"
          >
            ↪ Log Out
          </button>
        </div>
      )}
    </div>
  </div>

  {isMenuOpen && (
  <div
    ref={mobileMenuRef}
    className="absolute right-0 top-16 z-50 w-64 rounded-3xl bg-white p-4 shadow-xl md:hidden"
  >
      <p className="mb-2 px-4 text-xs uppercase tracking-[0.2em] text-[#a63a0a]">
        Settings
      </p>

      <button
        onClick={() => {
          setIsMenuOpen(false);
          setCurrentPage("profile");
          setShowProfile(true);
        }}
        className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
      >
        👤 Profile
      </button>

      
<button
          onClick={() => {
            setIsMenuOpen(false);

            const ua = navigator.userAgent.toLowerCase();

            const isIOS =
              /iphone|ipad|ipod/.test(ua) ||
              (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

            const isAndroid = /android/.test(ua);

            if (isIOS) {
              showToast("Install Hey Chef:\n\nTap Share, then Add to Home Screen.");
              return;
            }

            if (isAndroid) {
              showToast(
                "Install Hey Chef:\n\nTap the browser menu, then Install App or Add to Home Screen."
              );
              return;
            }

            showToast(
              "Install Hey Chef:\n\nClick the install icon in your browser's address bar."
            );
          }}
          className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
        >
          📱 Install App
        </button>
      <button
        onClick={() => {
          setIsMenuOpen(false);
          logoutUser();
        }}
        className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
      >
        ↪ Log Out
      </button>
    </div>
  )}
</nav>

        <div className="mb-8">
  <div className="mb-8 rounded-[2rem] border border-[#ead7c8] bg-[#fffaf5] p-6 shadow-sm md:p-8">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-4xl font-bold md:text-5xl">My Pantry</h1>

        <p className="mt-2 max-w-xl text-[#6d5549]">
          See what you already have, find ingredients fast, and keep your kitchen organized.
        </p>
      </div>

      <button
       onClick={() => {
  setEditingPantryModalId(null);
  setPantryModalItem("");
  setPantryModalImage("");
  setPantryModalSourceUrl("");
  setPantryModalShoppingItem("");
  setPantryModalQuantity("1");

  // keep smart defaults
  setPantryModalUnit("package");
  setPantryModalCategory("Other");

  setAddAnotherPantryItem(false);
  setShowPantryModal(true);
}}
        className="w-full rounded-full bg-[#a63a0a] px-6 py-3 font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg md:w-auto"      >
        + Add Pantry Items
      </button>
    </div>

    <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
      <div className="relative">
        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#6d5549]">
          🔍
        </span>

        <input
          value={pantrySearch}
          onChange={(e) => setPantrySearch(e.target.value)}
          placeholder="Search pantry items..."
          className="w-full rounded-full border border-[#ead7c8] bg-white py-4 pl-12 pr-5 shadow-sm outline-none focus:border-[#a63a0a]"
        />
      </div>

      <p className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#2b1a12] shadow-sm">
        {pantryItems.length} Items
        <span className="mx-2 text-[#a63a0a]">•</span>
        {[...new Set(pantryItems.map((item) => item.category))].length} Categories
      </p>
    </div>
  </div>

  <section className="mb-6 rounded-[2rem] border border-[#ead7c8] bg-white p-6 shadow-sm">
  <div>
    <p className="mb-1 text-sm uppercase tracking-[0.2em] text-[#a63a0a]">
      Smart Restock
    </p>

    <h2 className="text-2xl font-bold text-[#2b1a12]">
      Restock Suggestions
    </h2>

    <p className="mt-1 text-[#6d5549]">
      Based on your favorite recipes and items not already on your shopping list.
    </p>

    {smartRestockItems.length === 0 ? (
      <div className="mt-5">
        <span className="rounded-full bg-[#fff4ef] px-4 py-2 text-sm font-medium text-[#6d5549]">
          You're all stocked up.
        </span>
      </div>
    ) : (
      <>
        <div className="mt-5 flex flex-wrap gap-2">
          {smartRestockItems.map((item) => (
            <div
              key={item}
              className="flex items-center overflow-hidden rounded-full border border-[#f3d7c6] bg-[#fff7f2]"
            >
              <button
                onClick={() => addItemsToShoppingList([item])}
                className="px-4 py-2 text-sm font-medium text-[#2b1a12] hover:bg-[#fdf0e7]"
              >
                {item}
              </button>

              <button
                onClick={() =>
                  setDismissedRestockItems((current) => [...current, item])
                }
                className="px-2 py-2 text-[#b68b77] hover:text-[#a63a0a]"
                aria-label={`Dismiss ${item}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={() => addItemsToShoppingList(smartRestockItems)}
          className="mt-5 rounded-full bg-[#a63a0a] px-6 py-3 font-bold text-white hover:bg-[#8f3208]"
        >
          Add All ({smartRestockItems.length})
        </button>
      </>
    )}
  </div>
</section>

  {pantryItems.length === 0 ? (
    <div className="rounded-[2rem] bg-white p-8 text-center shadow-sm">
      <p className="text-[#6d5549]">Your pantry is empty.</p>
    </div>
  ) : (
    <section className="rounded-[2rem] border border-[#ead7c8] bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-1 text-sm uppercase tracking-[0.2em] text-[#a63a0a]">
            Inventory
          </p>

          <h2 className="text-xl font-bold">Your Pantry</h2>
        </div>


<div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:flex-wrap">
  <button
    onClick={() => {
      setIsBulkEditingPantry(!isBulkEditingPantry);

      if (!isBulkEditingPantry) {
        const drafts: Record<string, PantryItem> = {};

        pantryItems.forEach((item) => {
          drafts[item.id] = { ...item };
        });

        setPantryDrafts(drafts);
        setExpandedPantryCategory("all");
      }
    }}
    className="rounded-full border border-[#a63a0a] px-4 py-2 text-sm font-bold text-[#a63a0a]"
  >
    {isBulkEditingPantry ? "Cancel Bulk Edit" : "Bulk Edit"}
  </button>
   <button
    onClick={resetPantry}
    className="rounded-full border border-red-300 px-4 py-2 text-sm font-bold text-red-600"
  >
    Reset Pantry
  </button>

  {isBulkEditingPantry && (
  <button
    onClick={saveBulkPantryEdits}
    className="rounded-full bg-[#a63a0a] px-4 py-2 text-sm font-bold text-white"
  >
    Save All Changes
  </button>
)}

  <button
    onClick={() =>
      setExpandedPantryCategory(
        expandedPantryCategory === "all" ? null : "all"
      )
    }
    className="rounded-full bg-[#fff4ef] px-4 py-2 text-sm font-bold text-[#a63a0a]"
  >
    {expandedPantryCategory === "all" ? "Collapse all" : "Expand all"}
  </button>
</div>
      </div>

      <div className="space-y-2">
        {[...new Set(pantryItems.map((item) => item.category))]
          .sort()
          .map((category) => {
            const itemsInCategory = pantryItems
              .filter((item) => item.category === category)
              .filter((item) =>
                item.name.toLowerCase().includes(pantrySearch.toLowerCase())
              )
              .sort((a, b) => a.name.localeCompare(b.name));

            if (itemsInCategory.length === 0) return null;

            const isExpanded =
  expandedPantryCategory === "all" ||
  expandedPantryCategory === category ||
  pantrySearch.trim().length > 0;

            return (
              <div
                key={category}
                className="overflow-hidden rounded-2xl border border-[#ead7c8] bg-[#fffaf5]"
              >
                <button
                  onClick={() =>
                    setExpandedPantryCategory(isExpanded ? null : category)
                  }
                  className="flex w-full items-center justify-between px-4 py-4 text-left transition hover:bg-[#fff4ef]"
                >
                  <span className="font-bold">
                    {category}{" "}
                    <span className="font-normal text-[#6d5549]">
                      ({itemsInCategory.length})
                    </span>
                  </span>

                  <span className="text-lg text-[#a63a0a]">
                    {isExpanded ? "⌃" : "⌄"}
                  </span>
                </button>

                {isExpanded && (
                  <div className="divide-y divide-[#ead7c8] bg-white">
                    {itemsInCategory.map((item) => (
                      <div key={item.id}>
  <div
  className={
    isBulkEditingPantry
      ? "grid gap-2 px-4 py-3 md:grid-cols-[1fr_180px_120px_180px_auto] md:items-center"
      : "grid grid-cols-1 gap-4 px-4 py-4 md:grid-cols-[1fr_auto] md:items-center"
  }
>
  {isBulkEditingPantry ? (
    <>
      <input
      value={pantryDrafts[item.id]?.name || item.name}
      onChange={(e) =>
        setPantryDrafts({
          ...pantryDrafts,
          [item.id]: {
            ...(pantryDrafts[item.id] || item),
            name: e.target.value,
          },
        })
      }
      className="rounded-full border border-[#ead7c8] px-4 py-2"
    />

    <div className="flex items-center gap-2">
  <button
    type="button"
    onClick={() => {
      const currentQty = Number(
        pantryDrafts[item.id]?.quantity || item.quantity || "1"
      );

      const nextQty = currentQty - 1;

      setPantryDrafts({
        ...pantryDrafts,
        [item.id]: {
          ...(pantryDrafts[item.id] || item),
          quantity: String(Math.max(0, nextQty)),
          markedForDelete: false,
        } as any,
      });
    }}
    className="h-10 w-10 rounded-full border border-[#ead7c8] text-lg font-bold text-[#a63a0a]"
  >
    −
  </button>

  <input
    value={pantryDrafts[item.id]?.quantity || item.quantity || "1"}
    onChange={(e) => {
      const nextValue = e.target.value;

      setPantryDrafts({
        ...pantryDrafts,
        [item.id]: {
          ...(pantryDrafts[item.id] || item),
          quantity: nextValue,
          markedForDelete: false,
        } as any,
      });
    }}
    inputMode="decimal"
    className="h-10 w-16 rounded-full border border-[#ead7c8] text-center"
  />

  <button
    type="button"
    onClick={() => {
      const currentQty = Number(
        pantryDrafts[item.id]?.quantity || item.quantity || "0"
      );

      setPantryDrafts({
        ...pantryDrafts,
        [item.id]: {
          ...(pantryDrafts[item.id] || item),
          quantity: String(currentQty + 1),
          markedForDelete: false,
        } as any,
      });
    }}
    className="h-10 w-10 rounded-full border border-[#ead7c8] text-lg font-bold text-[#a63a0a]"
  >
    +
  </button>
</div>



    
<select
  value={pantryDrafts[item.id]?.unit || item.unit || ""}
  onChange={(e) =>
    setPantryDrafts({
      ...pantryDrafts,
      [item.id]: {
        ...(pantryDrafts[item.id] || item),
        unit: e.target.value,
      },
    })
  }
  className="rounded-full border border-[#ead7c8] px-4 py-2"
>
  <option value="">Unit</option>
  <option value="count">count</option>
  <option value="can">can</option>
  <option value="box">box</option>
  <option value="bag">bag</option>
  <option value="bottle">bottle</option>
  <option value="jar">jar</option>
  <option value="lb">lb</option>
  <option value="oz">oz</option>
  <option value="cup">cup</option>
  <option value="tbsp">tbsp</option>
  <option value="tsp">tsp</option>
</select>

    <select
      value={pantryDrafts[item.id]?.category || item.category}
      onChange={(e) =>
        setPantryDrafts({
          ...pantryDrafts,
          [item.id]: {
            ...(pantryDrafts[item.id] || item),
            category: e.target.value,
          },
        })
      }
      className="rounded-full border border-[#ead7c8] bg-white px-4 py-2"
    >
      <option value="Produce">Produce</option>
      <option value="Refrigerated">Refrigerated</option>
      <option value="Frozen">Frozen</option>
      <option value="Meat & Protein">Meat & Protein</option>
      <option value="Canned Goods">Canned Goods</option>
      <option value="Grains & Pasta">Grains & Pasta</option>
      <option value="Baking">Baking</option>
      <option value="Spices">Spices</option>
      <option value="Beverages">Beverages</option>
      <option value="Condiments">Condiments</option>
      <option value="Snacks">Snacks</option>
      <option value="Other">Other</option>
    </select>

    <label className="flex items-center gap-2  text-[#a63a0a]">
      <input
        type="checkbox"
        checked={(pantryDrafts[item.id] as any)?.markedForDelete || false}
        onChange={(e) =>
          setPantryDrafts({
            ...pantryDrafts,
            [item.id]: {
              ...(pantryDrafts[item.id] || item),
              markedForDelete: e.target.checked,
            } as any,
          })
        }
      />
      Remove
    </label>
  </>
) : (
  
  <div className="flex min-w-0 items-center gap-3">
  <img
  src={item.image || placeholderImage}
  alt={item.name}
  className="h-12 w-12 shrink-0 rounded-xl object-cover"
/>

    <div className="min-w-0">
      <p className="font-bold leading-snug">{item.name}</p>

      <p className="mt-1 text-[#6d5549]">
        {item.quantity || "1"} {item.unit}
      </p>

      {item.sourceUrl && (
  <a
    href={item.sourceUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="mt-1 block text-sm font-bold text-[#a63a0a]"
  >
    🛒 View in Store
  </a>
)}
    </div>
  </div>
)}

    {!isBulkEditingPantry && (
  <div className="flex flex-wrap gap-3 md:items-center md:justify-end">
  <button
    onClick={() => savePantryItemAsFoodCard(item)}
    className="text-sm font-bold text-[#a63a0a]"
  >
    Go-To Foods
  </button>
  <button
  onClick={async () => {
    await addItemsToShoppingList([item.name], {
      id: item.id,
      title: item.name,
      image: item.image || "",
      ingredients: [],
      steps: [],
      sourceUrl: item.sourceUrl || "",
      createdAt: item.createdAt,
      type: "grocery",
      brand: item.brand || "",
      packageSize: item.packageSize || "",
      price: item.price || "",
    });

    setBuyAnywayItems((current) => [
      ...new Set([...current, item.name]),
    ]);
  }}
  className="text-sm font-bold text-[#a63a0a]"
>
  Buy More
</button>
    <button
      onClick={() => {
        setEditingPantryModalId(item.id);
        setPantryModalItem(item.name);
        setPantryModalQuantity(item.quantity || "1");
        setPantryModalUnit(item.unit || "");
        setPantryModalCategory(item.category || "Other");
        setAddAnotherPantryItem(false);
        setShowPantryModal(true);
        setPantryModalImage(item.image || "");
        setPantryModalSourceUrl(item.sourceUrl || "");
        setOriginalPantrySourceUrl(item.sourceUrl || "");
      }}
      className="text-sm font-bold text-[#a63a0a]"
    >
      Edit
    </button>

    <button
      onClick={async () => {
        if (!confirm(`Delete ${item.name} from your pantry?`)) return;

        const { error } = await supabase
          .from("pantry_items")
          .delete()
          .eq("id", item.id);

        if (error) {
          showToast(error.message);
          return;
        }

        setPantryItems(
          pantryItems.filter((p) => p.id !== item.id)
        );
      }}
      className="text-sm text-[#a63a0a]"
    >
      Delete
    </button>
    </div>
)}
  </div>
</div>
                    ))}
                  </div>
                )}
                
              </div>
            );
             })}

    {isBulkEditingPantry && (
      <div className="mt-6 flex justify-center">
        <button
          onClick={saveBulkPantryEdits}
          className="rounded-full bg-[#a63a0a] px-8 py-3 text-sm font-bold text-white"
        >
          Save All Changes
        </button>
      </div>
    )}
</div>
      
    </section>
  )}
</div>
      </section>
      <BottomNav />
        {showPantryModal && PantryModal()}

      {toastMessage && (
  <div className="fixed left-1/2 top-6 z-[9999] -translate-x-1/2 rounded-full bg-[#2b1a12] px-6 py-3 text-white shadow-xl">
    {toastMessage}
  </div>
)}
<footer className="mt-20 border-t border-[#ead7c8] pt-8 text-center text-sm text-[#6d5549]">
  <p>© 2020–2026 Hey Chef™. All rights reserved.</p>

  <div className="mt-3 flex justify-center gap-6">
    <a href="/privacy" className="hover:text-[#a63a0a]">
      Privacy
    </a>

    <a href="/terms" className="hover:text-[#a63a0a]">
      Terms
    </a>

    <a href="/contact" className="hover:text-[#a63a0a]">
      Contact
    </a>
  </div>
</footer>
    </main>
  );
}
  if (showAllRecipes) {
  return (
    <main className="min-h-screen bg-[#f8efe6] px-5 py-6 pb-32 text-[#2b1a12] md:p-8">
      <section className="mx-auto max-w-6xl py-6 md:px-6 md:py-10">
        <nav className="sticky top-0 z-50 -mx-5 mb-8 flex items-start justify-between gap-3 bg-[#f8efe6] px-5 py-4 md:-mx-6 md:px-6">
  <div className="flex flex-col">
  <button
    onClick={goHome}
    className="text-3xl font-bold text-[#a63a0a]"
  >
    Hey Chef™
  </button>

  <button
    onClick={goHome}
    className="mt-1 text-left text-sm text-[#a63a0a]"
  >
    ← Return to Dashboard
  </button>
</div>

  <button
    onClick={() => setIsMenuOpen((open) => !open)}
    className="rounded-full bg-white px-4 py-3 text-3xl text-[#a63a0a] shadow md:hidden"
  >
    ☰
  </button>

  <div className="hidden items-center gap-10 text-lg md:flex">
    <button
      onClick={goAllRecipes}
      className={
        currentPage === "recipes"
          ? "font-bold text-[#a63a0a] underline underline-offset-8"
          : "text-[#a63a0a]"
      }
    >
      Recipes
    </button>

    <button
      onClick={goMealPlanner}
      className={
        currentPage === "planner"
          ? "font-bold text-[#a63a0a] underline underline-offset-8"
          : "text-[#a63a0a]"
      }
    >
      Meal Planner 
    </button>

    <button
      onClick={goShoppingList}
      className={
        currentPage === "shopping"
          ? "font-bold text-[#a63a0a] underline underline-offset-8"
          : "text-[#a63a0a]"
      }
    >
      Shopping List ({neededShoppingListCount})
    </button>

    <button
      onClick={goPantry}
      className={
        currentPage === "pantry"
          ? "font-bold text-[#a63a0a] underline underline-offset-8"
          : "text-[#a63a0a]"
      }
    >
      My Pantry
    </button>

   <div ref={settingsRef} className="relative">
      <button
        onClick={() => setShowSettingsMenu((open) => !open)}
        className={
          currentPage === "profile"
            ? "font-bold text-[#a63a0a] underline underline-offset-8"
            : "text-[#a63a0a]"
        }
      >
        ⚙️ Settings
      </button>

      {showSettingsMenu && (
        <div className="absolute right-0 top-10 z-50 w-56 rounded-2xl bg-white p-2 shadow-xl">
          <button
            onClick={() => {
              setShowSettingsMenu(false);
              setCurrentPage("profile");
              setShowProfile(true);
            }}
            className="block w-full rounded-xl px-4 py-3 text-left hover:bg-[#fff4ef]"
          >
            👤 Profile
          </button>

          
<button
          onClick={() => {
            setIsMenuOpen(false);

            const ua = navigator.userAgent.toLowerCase();

            const isIOS =
              /iphone|ipad|ipod/.test(ua) ||
              (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

            const isAndroid = /android/.test(ua);

            if (isIOS) {
              showToast("Install Hey Chef:\n\nTap Share, then Add to Home Screen.");
              return;
            }

            if (isAndroid) {
              showToast(
                "Install Hey Chef:\n\nTap the browser menu, then Install App or Add to Home Screen."
              );
              return;
            }

            showToast(
              "Install Hey Chef:\n\nClick the install icon in your browser's address bar."
            );
          }}
          className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
        >
          📱 Install App
        </button>
          <button
            onClick={() => {
              setShowSettingsMenu(false);
              logoutUser();
            }}
            className="block w-full rounded-xl px-4 py-3 text-left hover:bg-[#fff4ef]"
          >
            ↪ Log Out
          </button>
        </div>
      )}
    </div>
  </div>

  {isMenuOpen && (
  <div
    ref={mobileMenuRef}
    className="absolute right-0 top-16 z-50 w-64 rounded-3xl bg-white p-4 shadow-xl md:hidden"
  >
      <p className="mb-2 px-4 text-xs uppercase tracking-[0.2em] text-[#a63a0a]">
        Settings
      </p>

      <button
        onClick={() => {
          setIsMenuOpen(false);
          setCurrentPage("profile");
          setShowProfile(true);
        }}
        className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
      >
        👤 Profile
      </button>

      
<button
          onClick={() => {
            setIsMenuOpen(false);

            const ua = navigator.userAgent.toLowerCase();

            const isIOS =
              /iphone|ipad|ipod/.test(ua) ||
              (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

            const isAndroid = /android/.test(ua);

            if (isIOS) {
              showToast("Install Hey Chef:\n\nTap Share, then Add to Home Screen.");
              return;
            }

            if (isAndroid) {
              showToast(
                "Install Hey Chef:\n\nTap the browser menu, then Install App or Add to Home Screen."
              );
              return;
            }

            showToast(
              "Install Hey Chef:\n\nClick the install icon in your browser's address bar."
            );
          }}
          className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
        >
          📱 Install App
        </button>
      <button
        onClick={() => {
          setIsMenuOpen(false);
          logoutUser();
        }}
        className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
      >
        ↪ Log Out
      </button>
    </div>
  )}
</nav>


        <section className="mb-8 rounded-[2rem] border border-[#ead7c8] bg-[#fffaf5] p-6 shadow-sm md:p-8">
  <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
<div>
    <h1 className="text-4xl font-bold md:text-5xl">
      Food Library
    </h1>

    <p className="mt-2 max-w-xl text-[#6d5549]">
      Build your personal food library with recipes, grocery items, and pantry favorites.
    </p>
  </div>

  <div className="grid w-full gap-3 md:w-auto md:grid-cols-2">
  <button
    onClick={() => {
      setShowImport(true);
      setShowFoodImport(false);
    }}
    className="w-full rounded-full bg-[#a63a0a] px-6 py-3 font-bold text-white md:w-auto"
  >
    Import Recipe
  </button>

  <button
    onClick={() => {
  setShowFoodImport(true);
  setShowImport(false);
  setFoodPreview(null);
  setFoodUrl("");
  setImportError("");
}}
    className="w-full rounded-full border border-[#a63a0a] px-6 py-3 font-bold text-[#a63a0a] md:w-auto"
  >
    Add Go-To Food
  </button>
</div>
</div>
</section>

        {showImport && (
  <section className="mb-8 rounded-3xl bg-white p-6 shadow-lg">
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-2xl font-bold">Import a Recipe</h2>

      <button
        onClick={() => setShowImport(false)}
        className="text-2xl text-[#6d5549]"
      >
        ✕
      </button>
    </div>

    <p className="mb-4 text-[#6d5549]">
      Paste a recipe URL. Hey Chef will clean it into ingredients and steps.
    </p>

    <div className="flex flex-col gap-3 md:flex-row">
      <input
        value={recipeUrl}
        onChange={(e) => setRecipeUrl(e.target.value)}
        placeholder="https://example.com/recipe"
        className="flex-1 rounded-full border border-[#ead7c8] px-5 py-3"
      />

      <button
        onClick={importRecipe}
        disabled={isImporting}
        className="rounded-full bg-[#a63a0a] px-6 py-3 text-white disabled:opacity-60"
      >
        {isImporting ? "Importing..." : "Import"}
      </button>
    </div>

    {importError && (
      <p className="mt-4 text-sm text-red-700">{importError}</p>
    )}

    <div className="my-6 flex items-center gap-3 text-sm text-[#6d5549]">
      <div className="h-px flex-1 bg-[#ead7c8]" />
      OR
      <div className="h-px flex-1 bg-[#ead7c8]" />
    </div>

    <button
      onClick={createNewRecipe}
      className="w-full rounded-full border border-[#a63a0a] px-6 py-3 font-bold text-[#a63a0a]"
    >
      + Create Recipe From Scratch
    </button>

    {showManualImport && (
      <div className="mt-6 rounded-3xl border border-[#ead7c8] bg-[#fffaf5] p-5">
        <h3 className="mb-2 text-xl font-bold">Can't Import This Recipe?</h3>

        <p className="mb-4 text-[#6d5549]">
          Some websites block imports. Paste the recipe below and Hey Chef will organize it
          into ingredients and steps.
        </p>

        <textarea
          value={manualRecipe}
          onChange={(e) => setManualRecipe(e.target.value)}
          rows={12}
          placeholder={`Paste Text: Recipe Title

Ingredients
2 cups flour
2 cups sugar
1 cup butter

Directions
Mix ingredients
Bake for 25 minutes`}
          className="w-full rounded-2xl border border-[#ead7c8] p-4"
        />

        <button
          onClick={importManualRecipe}
          className="mt-4 rounded-full bg-[#a63a0a] px-6 py-3 text-white"
        >
          Create Recipe
        </button>
      </div>
    )}
  </section>
)}
{showFoodImport && (
  <section className="mb-8 rounded-3xl bg-white p-6 shadow-lg">
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-2xl font-bold">Add a Go-To Food</h2>

      <button
        onClick={() => setShowFoodImport(false)}
        className="text-2xl text-[#6d5549]"
      >
        ✕
      </button>
    </div>

    <p className="mb-4 text-[#6d5549]">
      Paste a product URL or enter the details manually.
    </p>

    <div className="flex flex-col gap-3 md:flex-row">
      <input
        value={foodUrl}
        onChange={(e) => setFoodUrl(e.target.value)}
        placeholder="https://example.com/product"
        className="flex-1 rounded-full border border-[#ead7c8] px-5 py-3"
      />

      <button
  onClick={importFoodItem}
  disabled={isImporting}
  className="rounded-full bg-[#a63a0a] px-6 py-3 text-white disabled:opacity-60"
>
  {isImporting ? "Importing..." : "Import"}
</button>
    </div>

    {importError && (
      <p className="mt-4 text-sm text-red-700">{importError}</p>
    )}

    <div className="my-6 flex items-center gap-3 text-sm text-[#6d5549]">
      <div className="h-px flex-1 bg-[#ead7c8]" />
      OR
      <div className="h-px flex-1 bg-[#ead7c8]" />
    </div>

    <div className="flex gap-4">
  {foodPreview && (
  <div className="flex gap-4">
    {foodPreview.image_url && (
      <img
        src={foodPreview.image_url}
        alt={foodPreview.name}
        className="h-24 w-24 rounded-2xl object-cover"
      />
    )}

    <div>
      <h3 className="font-bold text-[#2b1b14]">
        {foodPreview.name}
      </h3>

      {foodPreview.brand && (
        <p className="text-sm text-[#6d5549]">{foodPreview.brand}</p>
      )}

      {foodPreview.package_size && (
        <p className="text-sm text-[#6d5549]">{foodPreview.package_size}</p>
      )}

      {foodPreview.price && (
        <p className="text-sm text-[#6d5549]">{foodPreview.price}</p>
      )}
    </div>
  </div>
)}

  <div>
    <h3 className="font-bold text-[#2b1b14]">
      {lastAddedShoppingItem.name}
    </h3>

    {lastAddedShoppingItem.brand && (
      <p className="text-sm text-[#6d5549]">
        {lastAddedShoppingItem.brand}
      </p>
    )}

    {lastAddedShoppingItem.package_size && (
      <p className="text-sm text-[#6d5549]">
        {lastAddedShoppingItem.package_size}
      </p>
    )}

    {lastAddedShoppingItem.price && (
      <p className="text-sm text-[#6d5549]">
        {lastAddedShoppingItem.price}
      </p>
    )}
  </div>
</div>

    <button
      onClick={saveFoodItem}
      className="mt-5 w-full rounded-full bg-[#a63a0a] px-6 py-3 font-bold text-white"
    >
      Save Go-To Food
    </button>
  </section>
)}

<section className="mb-8 rounded-[2rem] bg-white p-4 shadow-lg">
  <div className="mb-4 grid gap-2 sm:grid-cols-2 md:grid-cols-4">
    <button
      onClick={() => {
        setFoodTypeFilter("all");
        setCategoryFilter("all");
        setRecipeSort("newest");
      }}
      className={`rounded-full px-4 py-2 font-bold ${
        foodTypeFilter === "all" && recipeSort === "newest"
          ? "bg-[#a63a0a] text-white"
          : "bg-[#fff4ef] text-[#a63a0a]"
      }`}
    >
      All
    </button>

    <button
      onClick={() => setFoodTypeFilter("recipe")}
      className={`rounded-full px-4 py-2 font-bold ${
        foodTypeFilter === "recipe"
          ? "bg-[#a63a0a] text-white"
          : "bg-[#fff4ef] text-[#a63a0a]"
      }`}
    >
      Recipes
    </button>

    <button
      onClick={() => setFoodTypeFilter("grocery")}
      className={`rounded-full px-4 py-2 font-bold ${
        foodTypeFilter === "grocery"
          ? "bg-[#a63a0a] text-white"
          : "bg-[#fff4ef] text-[#a63a0a]"
      }`}
    >
      Go-To Foods
    </button>

    <button
      onClick={() => setRecipeSort("ready")}
      className={`rounded-full px-4 py-2 font-bold ${
        recipeSort === "ready"
          ? "bg-[#315f25] text-white"
          : "bg-[#e8f6df] text-[#315f25]"
      }`}
    >
      ✓ Ready
    </button>
  </div>

  <div className="grid gap-3 md:grid-cols-2">
    <select
      value={categoryFilter}
      onChange={(e) => setCategoryFilter(e.target.value)}
      className="rounded-full border border-[#ead7c8] bg-white px-5 py-3"
    >
      <option value="all">All Categories</option>
      <option value="Main Dish">Main Dish</option>
      <option value="Side Dish">Side Dish</option>
      <option value="Dessert">Dessert</option>
      <option value="Breakfast">Breakfast</option>
      <option value="Soup">Soup</option>
      <option value="Snack">Snack</option>
      <option value="Drink">Drink</option>
      <option value="Frozen Food">Frozen Food</option>
      <option value="Boxed Meal">Boxed Meal</option>
      <option value="Prepared Food">Prepared Food</option>
      <option value="Canned Food">Canned Food</option>
    </select>

    <select
      value={recipeSort}
      onChange={(e) => setRecipeSort(e.target.value)}
      className="rounded-full border border-[#ead7c8] bg-white px-5 py-3"
    >
      <option value="favorites">Favorites</option>
      <option value="ready">Ready</option>
      <option value="newest">Newest</option>
      <option value="oldest">Oldest</option>
      <option value="az">A–Z</option>
      <option value="za">Z–A</option>
    </select>
  </div>
</section>

        {recipes.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 shadow">
            <p className="text-[#6d5549]">No recipes yet. Import your first recipe.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            {filteredRecipes.map((recipe) => (
              <div
                key={recipe.id}
                onClick={() => {
  setSelectedRecipe(recipe);
  setShowAllRecipes(false);
  setShowMealPlanner(false);
  setShowShoppingList(false);
  setIsEditingRecipe(false);
  setEditRecipeDraft(null);

  setTimeout(() => {
    window.scrollTo(0, 0);
  }, 0);
}}
                className="rounded-3xl bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative mb-4">
  <img
    src={recipe.image || placeholderImage}
    alt={recipe.title}
    className="h-36 w-full rounded-2xl object-cover"
  />

  {recipe.type === "grocery" && (
  canMakeRecipeFromPantry(recipe) ? (
    <div className="absolute left-3 top-3 rounded-full bg-[#315f25] px-3 py-1 text-xs font-bold text-white">
      ✓ Ready to Eat
    </div>
  ) : (
    <div className="absolute left-3 top-3 rounded-full bg-[#a63a0a] px-3 py-1 text-xs font-bold text-white">
      ⚠ Out of Stock
    </div>
  )
)}
</div>

                <div className="flex items-start justify-between gap-3">
  <h3 className="text-lg font-bold">{recipe.title}</h3>

  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      toggleFavorite(recipe.id);
    }}
    className="text-xl text-[#2b1a12]"
  >
    {recipe.isFavorite ? "★" : "☆"}
  </button>
</div>

                {recipe.type === "grocery" ? (
  <div className="mb-3 mt-2 text-sm text-[#6d5549]">
    <div className="flex flex-wrap items-center gap-2">
      <span>📦 {getMatchingPantryItem(recipe.title)?.quantity || "0"}</span>

      {recipe.category && (
        <span className="rounded-full bg-[#fff4ef] px-2 py-1 text-xs text-[#a63a0a]">
          {recipe.category}
        </span>
      )}
    </div>
  </div>
) : (
  <RecipeMeta recipe={recipe} />
)}
                <button
  onClick={(e) => {
    e.stopPropagation();
    togglePlanningQueue(recipe.id);
  }}
  className={`mr-2 rounded-full px-3 py-1.5 font-medium ${
    recipe.isPlanningQueue
      ? "bg-[#fff4ef] text-[#a63a0a]"
      : "bg-[#a63a0a] text-white"
  }`}
>
  {recipe.isPlanningQueue
    ? "− Meal Plan Queue"
    : "+ Meal Plan Queue"}
</button>
{recipe.type === "grocery" && !canMakeRecipeFromPantry(recipe) && (
  <button
    onClick={async (e) => {
  e.stopPropagation();

  await addItemsToShoppingList([recipe.title], recipe);

  

  setPantryItems((current) =>
    current.map((item) =>
      normalizeItemName(item.name) === normalizeItemName(recipe.title)
        ? { ...item, quantity: "0" }
        : item
    )
  );
}}
    className="mt-4 mr-2 rounded-full bg-[#a63a0a] px-4 py-2 text-sm font-bold text-white"
  >
    Buy Again
  </button>
)}

                <button
  onClick={(e) => {
    e.stopPropagation();

    if (confirm(`Delete ${recipe.title}?`)) {
      deleteRecipe(recipe.id);
    }
  }}
  className="mt-4 rounded-full border border-[#a63a0a] px-4 py-2 text-sm text-[#a63a0a]"
>
  Delete
</button>
              </div>
            ))}
          </div>
        )}
        
      </section>
      <BottomNav />

      <footer className="mt-20 border-t border-[#ead7c8] pt-8 text-center text-sm text-[#6d5549]">
  <p>© 2020–2026 Hey Chef™. All rights reserved.</p>

  <div className="mt-3 flex justify-center gap-6">
    <a href="/privacy" className="hover:text-[#a63a0a]">
      Privacy
    </a>

    <a href="/terms" className="hover:text-[#a63a0a]">
      Terms
    </a>

    <a href="/contact" className="hover:text-[#a63a0a]">
      Contact
    </a>
  </div>
</footer>
    </main>
  );
}

  if (selectedRecipe) {
    return (
      <main className="min-h-screen bg-[#f8efe6] px-5 py-6 pb-32 text-[#2b1a12] md:p-8">
       <section className="mx-auto max-w-6xl py-6 md:px-6 md:py-10">
  <nav className="sticky top-0 z-50 -mx-5 mb-8 flex items-start justify-between gap-3 bg-[#f8efe6] px-5 py-4 md:-mx-6 md:px-6">
  <div className="flex flex-col">
  <button
    onClick={goHome}
    className="text-3xl font-bold text-[#a63a0a]"
  >
    Hey Chef™
  </button>

  <button
    onClick={goHome}
    className="mt-1 text-left text-sm text-[#a63a0a]"
  >
    ← Return to Dashboard
  </button>
</div>

  <button
    onClick={() => setIsMenuOpen((open) => !open)}
    className="rounded-full bg-white px-4 py-3 text-3xl text-[#a63a0a] shadow md:hidden"
  >
    ☰
  </button>

  <div className="hidden items-center gap-10 text-lg md:flex">
    <button
      onClick={goAllRecipes}
      className={
        currentPage === "recipes"
          ? "font-bold text-[#a63a0a] underline underline-offset-8"
          : "text-[#a63a0a]"
      }
    >
      Recipes
    </button>

    <button
      onClick={goMealPlanner}
      className={
        currentPage === "planner"
          ? "font-bold text-[#a63a0a] underline underline-offset-8"
          : "text-[#a63a0a]"
      }
    >
      Meal Planner 
    </button>

    <button
      onClick={goShoppingList}
      className={
        currentPage === "shopping"
          ? "font-bold text-[#a63a0a] underline underline-offset-8"
          : "text-[#a63a0a]"
      }
    >
      Shopping List ({neededShoppingListCount})
    </button>

    <button
      onClick={goPantry}
      className={
        currentPage === "pantry"
          ? "font-bold text-[#a63a0a] underline underline-offset-8"
          : "text-[#a63a0a]"
      }
    >
      My Pantry
    </button>

   <div ref={settingsRef} className="relative">
      <button
        onClick={() => setShowSettingsMenu((open) => !open)}
        className={
          currentPage === "profile"
            ? "font-bold text-[#a63a0a] underline underline-offset-8"
            : "text-[#a63a0a]"
        }
      >
        ⚙️ Settings
      </button>

      {showSettingsMenu && (
        <div className="absolute right-0 top-10 z-50 w-56 rounded-2xl bg-white p-2 shadow-xl">
          <button
            onClick={() => {
              setShowSettingsMenu(false);
              setCurrentPage("profile");
              setShowProfile(true);
            }}
            className="block w-full rounded-xl px-4 py-3 text-left hover:bg-[#fff4ef]"
          >
            👤 Profile
          </button>

        
<button
          onClick={() => {
            setIsMenuOpen(false);

            const ua = navigator.userAgent.toLowerCase();

            const isIOS =
              /iphone|ipad|ipod/.test(ua) ||
              (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

            const isAndroid = /android/.test(ua);

            if (isIOS) {
              showToast("Install Hey Chef:\n\nTap Share, then Add to Home Screen.");
              return;
            }

            if (isAndroid) {
              showToast(
                "Install Hey Chef:\n\nTap the browser menu, then Install App or Add to Home Screen."
              );
              return;
            }

            showToast(
              "Install Hey Chef:\n\nClick the install icon in your browser's address bar."
            );
          }}
          className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
        >
          📱 Install App
        </button>
          <button
            onClick={() => {
              setShowSettingsMenu(false);
              logoutUser();
            }}
            className="block w-full rounded-xl px-4 py-3 text-left hover:bg-[#fff4ef]"
          >
            ↪ Log Out
          </button>
        </div>
      )}
    </div>
  </div>

  {isMenuOpen && (
  <div
    ref={mobileMenuRef}
    className="absolute right-0 top-16 z-50 w-64 rounded-3xl bg-white p-4 shadow-xl md:hidden"
  >
      <p className="mb-2 px-4 text-xs uppercase tracking-[0.2em] text-[#a63a0a]">
        Settings
      </p>

      <button
        onClick={() => {
          setIsMenuOpen(false);
          setCurrentPage("profile");
          setShowProfile(true);
        }}
        className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
      >
        👤 Profile
      </button>

    
<button
          onClick={() => {
            setIsMenuOpen(false);

            const ua = navigator.userAgent.toLowerCase();

            const isIOS =
              /iphone|ipad|ipod/.test(ua) ||
              (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

            const isAndroid = /android/.test(ua);

            if (isIOS) {
              showToast("Install Hey Chef:\n\nTap Share, then Add to Home Screen.");
              return;
            }

            if (isAndroid) {
              showToast(
                "Install Hey Chef:\n\nTap the browser menu, then Install App or Add to Home Screen."
              );
              return;
            }

            showToast(
              "Install Hey Chef:\n\nClick the install icon in your browser's address bar."
            );
          }}
          className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
        >
          📱 Install App
        </button>
      <button
        onClick={() => {
          setIsMenuOpen(false);
          logoutUser();
        }}
        className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
      >
        ↪ Log Out
      </button>
    </div>
  )}
</nav>

          <div className="rounded-[2rem] bg-white p-5 md:p-6 shadow-xl">
            <div className="sticky top-25 z-40 mb-4 flex justify-end">
  <button
    onClick={() => {
  setSelectedRecipe(null);
  setShowAllRecipes(true);
  setIsEditingRecipe(false);
  setEditRecipeDraft(null);

  setTimeout(() => {
    window.scrollTo({
      top: 250,
      behavior: "smooth",
    });
  }, 0);
}}
    className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl text-[#a63a0a] shadow"
  >
    ×
  </button>
</div>
            <img
  src={selectedRecipe.image || placeholderImage}
  alt={selectedRecipe.title}
  className="mb-6 h-60 w-full rounded-[1.5rem] object-cover"
/>

            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
  <div>
    <h1 className="mb-2 text-4xl font-bold">
      {selectedRecipe.title}
    </h1>

    {selectedRecipe.type === "grocery" ? (
  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[#6d5549]">
    {selectedRecipe.cookTime && <span>⏱ {selectedRecipe.cookTime}</span>}
    {selectedRecipe.servings && <span>👥 {selectedRecipe.servings}</span>}
    <span>
      In Pantry: {getMatchingPantryItem(selectedRecipe.title)?.quantity || "0"}
    </span>
  </div>
) : (
  <RecipeMeta recipe={selectedRecipe} />
)}
{selectedRecipe.sourceUrl && (
  <div className="mt-3">
  <a
    href={selectedRecipe.sourceUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="text-sm font-medium text-[#a63a0a] hover:underline"
  >
    {selectedRecipe.category === "Prepared Food"
      ? "🛒 View in Store"
      : "🔗 View Original Recipe"}
  </a>
</div>
)}
  </div>
<div className="flex flex-col gap-3 md:flex-row md:w-auto w-full">
  {!isEditingRecipe ? (
  <>
   <button
  type="button"
  onClick={(e) => {
    e.stopPropagation();
    setEditRecipeDraft(selectedRecipe);
    setIsEditingRecipe(true);
  }}
  className="w-full rounded-full bg-[#fff4ef] px-4 py-2 text-[#a63a0a]"
>
  {selectedRecipe.type === "grocery"
    ? "Edit Go-To Food Item"
    : "Edit Recipe"}
</button>

    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        selectedRecipe && toggleFavorite(selectedRecipe.id);
      }}
      className="w-full rounded-full border border-[#a63a0a] px-4 py-2 text-[#a63a0a]"
    >
      {selectedRecipe?.isFavorite ? "★ Favorite" : "☆ Favorite"}
    </button>
    <button
  onClick={() => {
    if (confirm(`Delete ${selectedRecipe.title}?`)) {
      deleteRecipe(selectedRecipe.id);
    }
  }}
  className="w-full rounded-full border border-red-500 px-4 py-2 font-bold text-red-600"
>
  Delete
</button>
  </>
) : (
  <>
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (!selectedRecipe) return;
        updateSelectedRecipe(selectedRecipe);
      }}
      className="w-full rounded-full bg-[#a63a0a] px-6 py-3 text-white"
    >
      Save Changes
    </button>

    <button
      onClick={() => {
        if (selectedRecipe?.id === "new-recipe") {
          setSelectedRecipe(null);
          setEditRecipeDraft(null);
          setIsEditingRecipe(false);
          setShowAllRecipes(true);
          return;
        }

        setEditRecipeDraft(null);
        setIsEditingRecipe(false);
      }}
      className="w-full rounded-full border border-[#a63a0a] px-6 py-3 text-[#a63a0a]"
    >
      Cancel Editing
    </button>
  </>
)}
</div>
</div>


            {isEditingRecipe && selectedRecipe && (
  <div className="mb-8 rounded-3xl bg-[#fff4ef] p-6">
    <h2 className="mb-4 text-2xl font-bold">
      {selectedRecipe.type === "grocery" ? "Edit Go-To Food Item" : "Edit Recipe"}
    </h2>

    <label className="mb-2 block font-bold">Title</label>
    <input
      value={selectedRecipe.title || ""}
      onChange={(e) =>
        setSelectedRecipe({ ...selectedRecipe, title: e.target.value })
      }
      className="mb-4 w-full rounded-xl border border-[#ead7c8] p-3"
    />

    <label className="mb-2 block font-bold">Image URL</label>
    <input
      value={selectedRecipe.image || ""}
      onChange={(e) =>
        setSelectedRecipe({ ...selectedRecipe, image: e.target.value })
      }
      className="mb-4 w-full rounded-xl border border-[#ead7c8] p-3"
    />

    {selectedRecipe.type === "grocery" && (
      <>
        <label className="mb-2 block font-bold">Brand</label>
        <input
          value={selectedRecipe.brand || ""}
          onChange={(e) =>
            setSelectedRecipe({ ...selectedRecipe, brand: e.target.value })
          }
          className="mb-4 w-full rounded-xl border border-[#ead7c8] p-3"
        />

        <label className="mb-2 block font-bold">Package Size</label>
        <input
          value={selectedRecipe.packageSize || ""}
          onChange={(e) =>
            setSelectedRecipe({
              ...selectedRecipe,
              packageSize: e.target.value,
            })
          }
          placeholder="6 oz"
          className="mb-4 w-full rounded-xl border border-[#ead7c8] p-3"
        />
      </>
    )}

    <label className="mb-2 block font-bold">Cook Time</label>
    <input
      value={selectedRecipe.cookTime || ""}
      onChange={(e) =>
        setSelectedRecipe({ ...selectedRecipe, cookTime: e.target.value })
      }
      placeholder="30 min"
      className="mb-4 w-full rounded-xl border border-[#ead7c8] p-3"
    />

    <label className="mb-2 block font-bold">Servings</label>
    <input
      value={selectedRecipe.servings || ""}
      onChange={(e) =>
        setSelectedRecipe({ ...selectedRecipe, servings: e.target.value })
      }
      placeholder="1 serving"
      className="mb-4 w-full rounded-xl border border-[#ead7c8] p-3"
    />

    <label className="mb-2 block font-bold">Category</label>
    <select
      value={selectedRecipe.category || ""}
      onChange={(e) =>
        setSelectedRecipe({ ...selectedRecipe, category: e.target.value })
      }
      className="mb-4 w-full rounded-xl border border-[#ead7c8] p-3"
    >
      <option value="">Select Category</option>
      <option value="Main Dish">Main Dish</option>
      <option value="Side Dish">Side Dish</option>
      <option value="Dessert">Dessert</option>
      <option value="Breakfast">Breakfast</option>
      <option value="Soup">Soup</option>
      <option value="Snack">Snack</option>
      <option value="Drink">Drink</option>
      <option value="Frozen Food">Frozen Food</option>
      <option value="Boxed Meal">Boxed Meal</option>
      <option value="Prepared Food">Prepared Food</option>
      <option value="Canned Food">Canned Food</option>
    </select>

    {selectedRecipe.type !== "grocery" && (
      <>
        <label className="mb-2 block font-bold">Ingredients</label>
        <textarea
          value={selectedRecipe.ingredients.join("\n")}
          onChange={(e) =>
            setSelectedRecipe({
              ...selectedRecipe,
              ingredients: e.target.value.split("\n"),
            })
          }
          rows={10}
          className="mb-4 min-h-[250px] w-full rounded-xl border border-[#ead7c8] p-3"
        />

        <label className="mb-2 block font-bold">Steps</label>
        <textarea
          value={selectedRecipe.steps.join("\n")}
          onChange={(e) => 
            setSelectedRecipe({
              ...selectedRecipe,
              steps: e.target.value.split("\n"),
            })
          }
          rows={12}
          className="min-h-[300px] w-full rounded-xl border border-[#ead7c8] p-3"
        />
      </>
    )}
  </div>
)}

{!isEditingRecipe && selectedRecipe && (
  selectedRecipe.type === "grocery" ? (
    <>
      <div className="grid gap-6 md:grid-cols-[1fr_420px]">
        <div className="rounded-3xl bg-[#fffaf5] p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-bold">Go-To Food Details</h2>

          <div className="flex flex-wrap gap-2 text-sm">
            {selectedRecipe.brand && (
              <span className="rounded-full bg-[#fff4ef] px-3 py-1 text-[#a63a0a]">
                {selectedRecipe.brand}
              </span>
            )}

            {selectedRecipe.packageSize && (
              <span className="rounded-full bg-[#fff4ef] px-3 py-1 text-[#a63a0a]">
                {selectedRecipe.packageSize}
              </span>
            )}

            {selectedRecipe.category && (
              <span className="rounded-full bg-[#fff4ef] px-3 py-1 text-[#a63a0a]">
                {selectedRecipe.category}
              </span>
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-[#ead7c8] bg-white p-5">
            {canMakeRecipeFromPantry(selectedRecipe) ? (
              <p className="font-bold text-[#315f25]">✓ Ready to Eat</p>
            ) : (
              <p className="font-bold text-[#6d5549]">Out of Stock</p>
            )}

            <p className="mt-2 text-sm text-[#6d5549]">
              Food items become ready when they are added to your pantry.
            </p>

            <button
              onClick={() => addItemsToShoppingList([selectedRecipe.title], selectedRecipe)}
              className="mt-4 rounded-full bg-[#a63a0a] px-6 py-3 font-bold text-white"
            >
              Buy Again
            </button>

          </div>
        </div>

        <div className="rounded-3xl bg-[#f8efe6] p-6">
          <h2 className="mb-4 text-2xl font-bold">Plan This Go-To Food</h2>

          <button
            onClick={() => togglePlanningQueue(selectedRecipe.id)}
            className="mb-4 w-full rounded-full border border-[#a63a0a] px-6 py-3 text-[#a63a0a]"
          >
            {selectedRecipe.isPlanningQueue
              ? "− Remove from Planning Queue"
              : "+ Add to Planning Queue"}
          </button>

          <div className="mb-3">
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="w-full rounded-full border border-[#ead7c8] bg-white px-4 py-3"
            >
              {plannerDays.map((day) => (
                <option key={day.date} value={day.date}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <select
              value={selectedMeal}
              onChange={(e) => setSelectedMeal(e.target.value)}
              className="w-full rounded-full border border-[#ead7c8] bg-white px-4 py-3"
            >
              {meals.map((meal) => (
                <option key={meal} value={meal}>
                  {meal}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              addRecipeToMealPlan(selectedDay, selectedMeal, selectedRecipe);
              setSelectedRecipe(null);
              setShowMealPlanner(true);
            }}
            className="w-full rounded-full bg-[#a63a0a] px-6 py-3 text-white"
          >
            Add to Meal Plan
          </button>
        </div>
      </div>
    </>
  ) : (
    <>
    <button
  onClick={() => addToShoppingList(selectedRecipe)}
  className="mb-6 w-full rounded-full bg-[#a63a0a] px-6 py-3 font-bold text-white"
>
  Add Ingredients to Shopping List
</button>
      <div className="grid gap-6 md:grid-cols-[1fr_420px]">
        <div className="rounded-3xl border border-[#ead7c8] bg-white p-6">
  <h2 className="mb-5 text-2xl font-bold">Ingredients</h2>

  <ul className="space-y-3">
    {selectedRecipe.ingredients.map((ingredient, index) => (
      <li
        key={`${ingredient}-${index}`}
        className="flex items-center gap-3"
      >
        <input
          type="checkbox"
          checked={checkedRecipeIngredients.includes(ingredient)}
          onChange={(e) => {
            if (e.target.checked) {
              setCheckedRecipeIngredients([
                ...checkedRecipeIngredients,
                ingredient,
              ]);
            } else {
              setCheckedRecipeIngredients(
                checkedRecipeIngredients.filter(
                  (item) => item !== ingredient
                )
              );
            }
          }}
          className="h-5 w-5"
        />

        <span>{ingredient}</span>
      </li>
    ))}
  </ul>
</div>

        <div className="rounded-3xl bg-[#f8efe6] p-6">
          <h2 className="mb-4 text-2xl font-bold">Plan This Recipe</h2>

          <button
            onClick={() => togglePlanningQueue(selectedRecipe.id)}
            className="mb-4 w-full rounded-full border border-[#a63a0a] px-6 py-3 text-[#a63a0a]"
          >
            {selectedRecipe.isPlanningQueue
              ? "− Remove from Planning Queue"
              : "+ Add to Planning Queue"}
          </button>

          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="mb-3 w-full rounded-full border border-[#ead7c8] bg-white px-4 py-3"
          >
            {plannerDays.map((day) => (
              <option key={day.date} value={day.date}>
                {day.label}
              </option>
            ))}
          </select>

          <select
            value={selectedMeal}
            onChange={(e) => setSelectedMeal(e.target.value)}
            className="mb-4 w-full rounded-full border border-[#ead7c8] bg-white px-4 py-3"
          >
            {meals.map((meal) => (
              <option key={meal} value={meal}>
                {meal}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              addRecipeToMealPlan(selectedDay, selectedMeal, selectedRecipe);
              setSelectedRecipe(null);
              setShowMealPlanner(true);
            }}
            className="w-full rounded-full bg-[#a63a0a] px-6 py-3 text-white"
          >
            Add to Meal Plan
          </button>
        </div>
      </div>

      <h2 className="mb-4 mt-8 text-2xl font-bold">Steps</h2>

      <ol className="space-y-3">
        {selectedRecipe.steps.map((step, index) => (
          <li
            key={`${step}-${index}`}
            className="rounded-2xl bg-[#f8efe6] p-4"
          >
            <strong>Step {index + 1}:</strong> {step}
          </li>
        ))}
      </ol>
    </>
  )
)}
          </div>
        </section>
        
<BottomNav />
<footer className="mt-20 border-t border-[#ead7c8] pt-8 text-center text-sm text-[#6d5549]">
  <p>© 2020–2026 Hey Chef™. All rights reserved.</p>

  <div className="mt-3 flex justify-center gap-6">
    <a href="/privacy" className="hover:text-[#a63a0a]">
      Privacy
    </a>

    <a href="/terms" className="hover:text-[#a63a0a]">
      Terms
    </a>

    <a href="/contact" className="hover:text-[#a63a0a]">
      Contact
    </a>
  </div>
</footer>
      </main>
    );
  }

  return (
  <main className="min-h-screen bg-[#f8efe6] px-5 py-6 pb-32 text-[#2b1a12] md:p-8">
    <section className="mx-auto max-w-6xl py-6 md:px-6 md:py-10">
       <nav className="sticky top-0 z-50 -mx-5 mb-8 flex items-start justify-between gap-3 bg-[#f8efe6] px-5 py-4 md:-mx-6 md:px-6">
  <div className="flex flex-col">
  <button
    onClick={goHome}
    className="text-3xl font-bold text-[#a63a0a]"
  >
    Hey Chef™
  </button>


</div>

  <button
    onClick={() => setIsMenuOpen((open) => !open)}
    className="rounded-full bg-white px-4 py-3 text-3xl text-[#a63a0a] shadow md:hidden"
  >
    ☰
  </button>

  <div className="hidden items-center gap-10 text-lg md:flex">
    <button
      onClick={goAllRecipes}
      className={
        currentPage === "recipes"
          ? "font-bold text-[#a63a0a] underline underline-offset-8"
          : "text-[#a63a0a]"
      }
    >
      Recipes
    </button>

    <button
      onClick={goMealPlanner}
      className={
        currentPage === "planner"
          ? "font-bold text-[#a63a0a] underline underline-offset-8"
          : "text-[#a63a0a]"
      }
    >
      Meal Planner 
    </button>

    <button
      onClick={goShoppingList}
      className={
        currentPage === "shopping"
          ? "font-bold text-[#a63a0a] underline underline-offset-8"
          : "text-[#a63a0a]"
      }
    >
      Shopping List ({neededShoppingListCount})
    </button>

    <button
      onClick={goPantry}
      className={
        currentPage === "pantry"
          ? "font-bold text-[#a63a0a] underline underline-offset-8"
          : "text-[#a63a0a]"
      }
    >
      My Pantry
    </button>

    <div ref={settingsRef} className="relative">
      <button
        onClick={() => setShowSettingsMenu((open) => !open)}
        className={
          currentPage === "profile"
            ? "font-bold text-[#a63a0a] underline underline-offset-8"
            : "text-[#a63a0a]"
        }
      >
        ⚙️ Settings
      </button>

      {showSettingsMenu && (
        <div className="absolute right-0 top-10 z-50 w-56 rounded-2xl bg-white p-2 shadow-xl">
          <button
            onClick={() => {
              setShowSettingsMenu(false);
              setCurrentPage("profile");
              setShowProfile(true);
            }}
            className="block w-full rounded-xl px-4 py-3 text-left hover:bg-[#fff4ef]"
          >
            👤 Profile
          </button>

          
<button
          onClick={() => {
            setIsMenuOpen(false);

            const ua = navigator.userAgent.toLowerCase();

            const isIOS =
              /iphone|ipad|ipod/.test(ua) ||
              (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

            const isAndroid = /android/.test(ua);

            if (isIOS) {
              showToast("Install Hey Chef:\n\nTap Share, then Add to Home Screen.");
              return;
            }

            if (isAndroid) {
              showToast(
                "Install Hey Chef:\n\nTap the browser menu, then Install App or Add to Home Screen."
              );
              return;
            }

            showToast(
              "Install Hey Chef:\n\nClick the install icon in your browser's address bar."
            );
          }}
          className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
        >
          📱 Install App
        </button>
          <button
            onClick={() => {
              setShowSettingsMenu(false);
              logoutUser();
            }}
            className="block w-full rounded-xl px-4 py-3 text-left hover:bg-[#fff4ef]"
          >
            ↪ Log Out
          </button>
        </div>
      )}
    </div>
  </div>

  {isMenuOpen && (
  <div
    ref={mobileMenuRef}
    className="absolute right-0 top-16 z-50 w-64 rounded-3xl bg-white p-4 shadow-xl md:hidden"
  >
      <p className="mb-2 px-4 text-xs uppercase tracking-[0.2em] text-[#a63a0a]">
        Settings
      </p>

      <button
        onClick={() => {
          setIsMenuOpen(false);
          setCurrentPage("profile");
          setShowProfile(true);
        }}
        className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
      >
        👤 Profile
      </button>

      
<button
          onClick={() => {
            setIsMenuOpen(false);

            const ua = navigator.userAgent.toLowerCase();

            const isIOS =
              /iphone|ipad|ipod/.test(ua) ||
              (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

            const isAndroid = /android/.test(ua);

            if (isIOS) {
              showToast("Install Hey Chef:\n\nTap Share, then Add to Home Screen.");
              return;
            }

            if (isAndroid) {
              showToast(
                "Install Hey Chef:\n\nTap the browser menu, then Install App or Add to Home Screen."
              );
              return;
            }

            showToast(
              "Install Hey Chef:\n\nClick the install icon in your browser's address bar."
            );
          }}
          className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
        >
          📱 Install App
        </button>
      <button
        onClick={() => {
          setIsMenuOpen(false);
          logoutUser();
        }}
        className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
      >
        ↪ Log Out
      </button>
    </div>
  )}
</nav>

        <div className="grid gap-8">
  {/* INTRO */}
  <section className="mb-1">
    <p className="mb-3 text-sm uppercase tracking-[0.3em] text-[#a63a0a]">
      {getGreeting()}
    </p>

    <h1 className="mb-3 text-4xl font-bold leading-tight md:text-6xl">
      {displayName || "Chef"}
    </h1>

    <p className="mb-6 text-lg text-[#6d5549]">
  {getKitchenGreeting()}
</p>
    <div className="mb-6 grid w-full gap-3 md:w-auto md:grid-cols-2">
      <button
        onClick={() => setShowImport(true)}
        className="rounded-full bg-[#a63a0a] px-6 py-3 text-white shadow-lg"
      >
        Create New Recipe
      </button>

      

      <button
        onClick={() => setShowAllRecipes(true)}
        className="rounded-full bg-white px-6 py-3 text-[#a63a0a] shadow"
      >
        View Recipes
      </button>
    </div>
    {showImport && (
  <section
    ref={importSectionRef}
    className="rounded-3xl bg-white p-6 shadow-lg"
  >
  <div className="mb-4 flex items-center justify-between">
    <h2 className="text-2xl font-bold">Import a Recipe</h2>

    <button
      onClick={() => {
      setShowImport(false);
      setLastAddedShoppingItem(null);
      setNewShoppingItem("");
    }}
      className="text-2xl text-[#6d5549]"
    >
      ✕
    </button>
  </div>

  <p className="mb-4 text-[#6d5549]">
  Add a recipe, packaged food, or pantry item to Hey Chef.
</p>

<div className="mb-4 flex flex-wrap gap-2">
  <button
    onClick={() => {
      setShowFoodImport(false);
      setShowShoppingImport(false);
      setShowPantryModal(false);
    }}
    className={`rounded-full px-4 py-2 text-sm font-bold ${
      !showFoodImport && !showShoppingImport
        ? "bg-[#a63a0a] text-white"
        : "border border-[#a63a0a] text-[#a63a0a]"
    }`}
  >
    Recipe
  </button>

  <button
  onClick={() => {
    setShowFoodImport(true);
    setShowShoppingImport(false);
    setShowPantryModal(false);
  }}
    
    className={`rounded-full px-4 py-2 text-sm font-bold ${
      showFoodImport
        ? "bg-[#a63a0a] text-white"
        : "border border-[#a63a0a] text-[#a63a0a]"
    }`}
  >
   Go-To Foods
  </button>

  <button
  onClick={() => {
    setShowFoodImport(false);
    setShowPantryModal(false);
    setShowShoppingImport(true);
    setLastAddedShoppingItem(null);
    setNewShoppingItem("");
   }}
  className={`rounded-full px-4 py-2 text-sm font-bold ${
    showShoppingImport
      ? "bg-[#a63a0a] text-white"
      : "border border-[#a63a0a] text-[#a63a0a]"
  }`}
>
  Shopping Item
</button>

  <button
  onClick={() => {
    setEditingPantryModalId(null);
    setPantryModalShoppingItem("");
    setPantryModalItem("");
    setPantryModalQuantity("1");
    setPantryModalUnit("package");
    setPantryModalCategory("Other");
    setAddAnotherPantryItem(false);
    setShowPantryModal(true);
    setShowShoppingImport(false);
  }}
  className="rounded-full border border-[#a63a0a] px-4 py-2 text-sm font-bold text-[#a63a0a]"
>
  Pantry Item
</button>
</div>
{showShoppingImport && (
  <div className="flex flex-wrap gap-2">
    <input
      value={newShoppingItem}
      onChange={(e) => setNewShoppingItem(e.target.value)}
      placeholder="🛒 Add grocery item or paste url"
      className="flex-1 rounded-full border border-[#ead7c8] px-5 py-3"
    />

    <button
  onClick={async () => {
    if (!newShoppingItem.trim()) return;

    setIsAddingShoppingItem(true);

    try {
      let itemName = newShoppingItem.trim();
      let product: any = null;
      const originalUrl = itemName;

      if (originalUrl.includes("http")) {
        try {
          const response = await fetch("/api/import-food", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: originalUrl,
            }),
          });

          product = await response.json();

          if (product?.title) {
            itemName = product.title;
          }
        } catch (error) {
          console.error(error);
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        showToast("Please log in again.");
        return;
      }

      const { data, error } = await supabase
        .from("shopping_items")
        .insert({
          user_id: user.id,
          name: itemName,
          brand: product?.brand || "",
          package_size: product?.packageSize || "",
          image_url: product?.image || "",
          source_url: originalUrl.includes("http") ? originalUrl : "",
          price: product?.price || "",
        })
        .select()
        .single();

      if (error || !data) {
        console.error(error);
        showToast("Could not add shopping item.");
        return;
      }

      setShoppingList([data.name, ...shoppingList]);

      setShoppingItemImages({
        ...shoppingItemImages,
        [data.name]: data.image_url || "",
      });

      setShoppingItemUrls({
        ...shoppingItemUrls,
        [data.name]: data.source_url || "",
      });

      setLastAddedShoppingItem(null);
      setNewShoppingItem("");
      showToast(`${data.name} added to shopping list.`);
    } finally {
      setIsAddingShoppingItem(false);
    }
  }}
  disabled={isAddingShoppingItem}
  className="rounded-full bg-[#a63a0a] px-8 py-3 font-bold text-white disabled:opacity-60"
>
  {isAddingShoppingItem ? "Adding..." : "Add Item to Shopping List"}
</button>
     </div>

    )}
  {showShoppingImport && lastAddedShoppingItem && (
  <div className="mt-5 rounded-3xl border border-[#ead7c8] bg-[#fffaf5] p-5">
    <p className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-[#a63a0a]">
      Added to Cart
    </p>

    <div className="grid gap-3 md:grid-cols-2">
      <input
        value={lastAddedShoppingItem.brand || ""}
        readOnly
        placeholder="Brand"
        className="rounded-full border border-[#ead7c8] px-5 py-3"
      />

      <input
        value={lastAddedShoppingItem.name || ""}
        readOnly
        placeholder="Food item name"
        className="rounded-full border border-[#ead7c8] px-5 py-3"
      />

      <input
        value={lastAddedShoppingItem.package_size || ""}
        readOnly
        placeholder="Package size"
        className="rounded-full border border-[#ead7c8] px-5 py-3"
      />

      <input
        value={lastAddedShoppingItem.price || ""}
        readOnly
        placeholder="Price"
        className="rounded-full border border-[#ead7c8] px-5 py-3"
      />

      <input
        value={lastAddedShoppingItem.image_url || ""}
        readOnly
        placeholder="Image URL"
        className="rounded-full border border-[#ead7c8] px-5 py-3 md:col-span-2"
      />
   
  </div>
  </div>
)}

{!showShoppingImport && (
  <>
{!showFoodImport ? (
  <>
    <div className="flex flex-wrap gap-2">
      <input
        value={recipeUrl}
        onChange={(e) => setRecipeUrl(e.target.value)}
        placeholder="https://example.com/recipe"
        className="flex-1 rounded-full border border-[#ead7c8] px-5 py-3"
      />

      <button
        onClick={importRecipe}
        disabled={isImporting}
        className="rounded-full bg-[#a63a0a] px-6 py-3 text-white disabled:opacity-60"
      >
        {isImporting ? "Importing..." : "Import Recipe"}
      </button>
    </div>

    <div className="my-5 flex items-center gap-4">
      <div className="h-px flex-1 bg-[#ead7c8]" />
      <span className="text-sm text-[#6d5549]">OR</span>
      <div className="h-px flex-1 bg-[#ead7c8]" />
    </div>

    <button
      onClick={() => {
        createNewRecipe();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      className="w-full rounded-full border border-[#a63a0a] px-6 py-3 text-[#a63a0a]"
    >
      + Create from Scratch
    </button>
  </>
) : (
  <>
    <div className="flex flex-wrap gap-2">
      <input
        value={foodUrl}
        onChange={(e) => setFoodUrl(e.target.value)}
        placeholder="Paste grocery or product URL"
        className="flex-1 rounded-full border border-[#ead7c8] px-5 py-3"
      />

      <button
        onClick={importFoodItem}
        disabled={isImporting}
        className="rounded-full bg-[#a63a0a] px-6 py-3 text-white disabled:opacity-60"
      >
        {isImporting ? "Importing..." : "Import Go-To Food"}
      </button>
    </div>
     <div className="my-5 flex items-center gap-4">
      <div className="h-px flex-1 bg-[#ead7c8]" />
      <span className="text-sm text-[#6d5549]">OR</span>
      <div className="h-px flex-1 bg-[#ead7c8]" />
    </div>
{showFoodImport && (
  <div className="mt-5 grid gap-3 md:grid-cols-2">
    <input
      value={foodBrand}
      onChange={(e) => setFoodBrand(e.target.value)}
      placeholder="Brand"
      className="rounded-full border border-[#ead7c8] px-5 py-3"
    />

    <input
      value={foodTitle}
      onChange={(e) => setFoodTitle(e.target.value)}
      placeholder="Food item name"
      className="rounded-full border border-[#ead7c8] px-5 py-3"
    />

    <input
      value={foodPackageSize}
      onChange={(e) => setFoodPackageSize(e.target.value)}
      placeholder="Package size, like 6 oz"
      className="rounded-full border border-[#ead7c8] px-5 py-3"
    />

    <select
      value={foodCategory}
      onChange={(e) => setFoodCategory(e.target.value)}
      className="rounded-full border border-[#ead7c8] bg-white px-5 py-3"
    >
      <option value="Produce">Produce</option>
      <option value="Refrigerated">Refrigerated</option>
      <option value="Frozen Food">Frozen Food</option>
      <option value="Canned Goods">Canned Goods</option>
      <option value="Grains & Pasta">Grains & Pasta</option>
      <option value="Baking">Baking</option>
      <option value="Spices">Spices</option>
      <option value="Beverages">Beverages</option>
      <option value="Condiments">Condiments</option>
      <option value="Snacks">Snacks</option>
      <option value="Other">Other</option>
    </select>

    <input
      value={foodImage}
      onChange={(e) => setFoodImage(e.target.value)}
      placeholder="Image URL"
      className="rounded-full border border-[#ead7c8] px-5 py-3 md:col-span-2"
    />

    <button
      onClick={saveFoodItem}
      className="rounded-full bg-[#a63a0a] px-6 py-3 text-white md:col-span-2"
    >
      Save Go-To Food
    </button>
  </div>
)}

{!showFoodImport && (
  <button
    onClick={() => setShowFoodImport(true)}
    className="mt-4 w-full rounded-full border border-[#a63a0a] px-6 py-3 text-[#a63a0a]"
  >
    + Enter Go-To Foods Manually
  </button>
)}
  </>
)}
  </>
)}
  </section>
)}
  </section>
  <section className="mb-4 rounded-[2rem] border border-[#f4d8c4] bg-[#fff7ef] p-5 shadow-sm">
  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div>
      <p className="mb-1 text-sm uppercase tracking-[0.3em] text-[#a63a0a]">
        ❤️ Founding Chef
      </p>

      <h3 className="text-xl font-bold text-[#2b1b14]">
        Help shape the future of Hey Chef
      </h3>

      <p className="mt-1 text-[#6d5549]">
        Support development and help us build smarter meal planning,
        pantry tracking, grocery imports, budgeting, and more.
      </p>
    </div>

    <a
      href="/founding-chef"
      className="rounded-full bg-[#a63a0a] px-5 py-3 text-center font-bold text-white"
    >
      Learn More
    </a>
  </div>
</section>

  {/* TODAY'S MENU */}
  <section className="rounded-[2rem] bg-white p-6 shadow-lg">
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
  <p className="text-sm uppercase tracking-[0.3em] text-[#a63a0a]">
    {showTomorrow ? "TOMORROW'S MENU" : "TODAY'S MENU"}
  </p>

  <button
    onClick={() => setShowTomorrow(!showTomorrow)}
    className="rounded-full border border-[#ead7c8] px-3 py-1 text-xs text-[#a63a0a]"
  >
    {showTomorrow ? "Today" : "Tomorrow"}
  </button>
</div>

<h2 className="text-3xl font-bold">
  {showTomorrow ? "Ready for tomorrow?" : "Ready for today?"}
</h2>

<p className="mt-1 text-[#6d5549]">
  {new Date(
    Date.now() + (showTomorrow ? 86400000 : 0)
  ).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })}
</p>
      </div>
    </div>

    <div className="grid gap-4 md:grid-cols-3">
      {["Breakfast", "Lunch", "Dinner"].map((meal) => (
        <div
          key={meal}
          className="rounded-3xl border border-[#ead7c8] bg-[#fffaf5] p-5"
        >
          <h3 className="mb-3 text-xl font-bold">{meal}</h3>

          {(
  mealPlan[`${homeMenuWeek}-${homeMenuDate}-${meal}`] ||
  mealPlan[`${homeMenuWeek}-${getHomeMenuLabel(showTomorrow ? "tomorrow" : "today").split(",")[0]}-${meal}`] ||
  []
).length > 0 ? (
  <div className="space-y-2">
    {(
  mealPlan[`${homeMenuWeek}-${homeMenuDate}-${meal}`] ||
  mealPlan[`${homeMenuWeek}-${getHomeMenuLabel(showTomorrow ? "tomorrow" : "today").split(",")[0]}-${meal}`] ||
  []
).map((recipe) => (
      <div
  key={recipe.mealPlanId}
  onClick={() => {
  setSelectedRecipe(recipe);

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}}
  className="flex cursor-pointer items-center gap-3"
>
  <img
    src={recipe.image || placeholderImage}
    alt={recipe.title}
    className="h-12 w-12 rounded-xl object-cover"
  />

  <span className="font-semibold text-[#a63a0a]">
    {recipe.title}
  </span>
</div>
    ))}
  </div>
) : (
  <p className="text-[#6d5549]">Nothing planned yet.</p>
)}
        </div>
      ))}
    </div>
  </section>

  {/* MEAL PLAN OVERVIEW */}
  <section className="rounded-[2rem] bg-white p-6 shadow-lg">
    <p className="mb-2 text-sm uppercase tracking-[0.3em] text-[#a63a0a]">
      MEAL PLAN OVERVIEW
    </p>

    <h2 className="mb-5 text-3xl font-bold">Weekly Progress</h2>

    <div className="grid gap-4 md:grid-cols-2">
      <button
    onClick={() => {
      setActivePlannerWeek("current");
      setCurrentPage("planner");
      setSelectedRecipe(null);
      setShowShoppingList(false);
      setShowAllRecipes(false);
      setShowPantry(false);
      setShowMealPlanner(true);
      setShowImport(false);

      setTimeout(() => {
  window.scrollTo(0, 0);
}, 0);
    }}
    className="rounded-3xl border border-[#ead7c8] bg-[#fffaf5] p-5 text-left"
  >
    <p className="mb-2 text-sm uppercase tracking-[0.2em] text-[#a63a0a]">
  Current Week
</p>

<p className="mb-3 text-sm text-[#6d5549]">
  {getCurrentWeekLabel()}
</p>

<h3 className="text-2xl font-bold">{currentWeekFilledSlots}  / 21</h3>
<p className="text-[#6d5549]">meals planned</p>
  </button>

  <button
    onClick={() => {
      setActivePlannerWeek("next");
      setCurrentPage("planner");
      setSelectedRecipe(null);
      setShowShoppingList(false);
      setShowAllRecipes(false);
      setShowPantry(false);
      setShowMealPlanner(true);
      setShowImport(false);

      setTimeout(() => {
  window.scrollTo(0, 0);
}, 0);
    }}
    className="rounded-3xl border border-[#ead7c8] bg-[#fffaf5] p-5 text-left"
  >
    <p className="mb-2 text-sm uppercase tracking-[0.2em] text-[#a63a0a]">
  Next Week
</p>

<p className="mb-3 text-sm text-[#6d5549]">
  {getUpcomingWeekLabel()}
</p>

<h3 className="text-2xl font-bold">{nextWeekFilledSlots} / 21</h3>
<p className="text-[#6d5549]">meals planned</p>
  </button>
    </div>
  </section>

  <section className="mb-8 rounded-[2rem] border border-[#cfe3bf] bg-[#fbfff7] p-6 shadow-lg">
  <p className="mb-5 text-sm uppercase tracking-[0.3em] text-[#3f7f32]">
    Pantry Snapshot
  </p>

  <div className="grid gap-6 md:grid-cols-3">
    <div className="flex gap-4">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#e4f1dc] text-3xl">
  🥫
</div>

      <div>
        <h2 className="mb-2 text-2xl font-bold">
          Your kitchen looks good!
        </h2>
        <p className="text-[#6d5549]">
  You have pantry matches across {readyToCookRecipes} saved recipes.
</p>

<p className="mt-2 text-sm text-[#3f7f32]">
  🛒 {neededShoppingListCount} items still needed.
</p>
      </div>
    </div>

    <div className="border-t border-[#d8e8ce] pt-5 md:border-l md:border-t-0 md:pl-6 md:pt-0">
      <h3 className="mb-3 text-sm uppercase tracking-[0.2em] text-[#3f7f32]">
        Most Used Ingredients
      </h3>

      <ul className="space-y-2 font-semibold">
        {mostUsedIngredients.length > 0 ? (
  mostUsedIngredients.map(([ingredient, count], index) => (
    <li
      key={ingredient}
      className="flex items-center justify-between border-b border-[#d8e8ce] py-2 last:border-0"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white font-bold shadow-sm">
          {index + 1}
        </span>

        <span>{cleanIngredientName(ingredient)}</span>
      </div>

      <span className="text-sm text-[#6d5549]">
        Used in {count} recipes
      </span>
    </li>
  ))
) : (
  <li className="text-[#6d5549]">
    Add recipes to see trends.
  </li>
)}
      
      </ul>
    </div>

    <div className="border-t border-[#d8e8ce] pt-5 md:border-l md:border-t-0 md:pl-6 md:pt-0">
      <h3 className="mb-3 text-sm uppercase tracking-[0.2em] text-[#3f7f32]">
        Pantry Gaps
      </h3>

      <ul className="mb-4 space-y-2 font-semibold">
        {missingFromFavorites.length > 0 ? (
          missingFromFavorites.map((ingredient, index) => (
            <li key={ingredient} className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
  🛒
</span>
              <span>{cleanIngredientName(ingredient)}</span>
            </li>
          ))
        ) : (
          <li className="text-[#6d5549]">Your favorites are looking stocked.</li>
        )}
      </ul>

      <button
        onClick={goPantry}
        className="w-full md:w-auto rounded-full border border-[#3f7f32] bg-white px-5 py-2 font-semibold text-[#3f7f32]"
      >
        View Pantry
      </button>
    </div>
  </div>
</section>
</div>



<section id="recipes" className="mt-14">
  <div className="mb-5 flex items-end justify-between gap-4">
    <div>
      <h2 className="text-3xl font-bold">{homeSectionTitle}</h2>
    </div>
  </div>

  {recipes.length === 0 ? (
    <div className="rounded-3xl bg-white p-8 shadow">
      <h3 className="mb-2 text-xl font-bold">No recipes yet.</h3>
      <p className="text-[#6d5549]">
        Import your first recipe to start building your library.
      </p>
    </div>
  ) : (
    <div className="grid gap-5 md:grid-cols-3">
      {homeRecipes.map((recipe) => (
        <div
          key={recipe.id}
          onClick={() => {
  setSelectedRecipe(recipe);
  setIsEditingRecipe(false);
  setEditRecipeDraft(null);

  setTimeout(() => {
    window.scrollTo(0, 0);
  }, 0);
}}
          className="rounded-3xl bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
        >
          <img
            src={recipe.image || placeholderImage}
            alt={recipe.title}
            className="mb-4 h-36 w-full rounded-2xl object-cover"
          />

          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-bold">{recipe.title}</h3>

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(recipe.id);
              }}
              className="text-xl text-[#2b1a12]"
            >
              {recipe.isFavorite ? "★" : "☆"}
            </button>
          </div>

          <RecipeMeta recipe={recipe} />
        </div>
      ))}
    </div>
  )}
      </section>
      </section>

      {showPantryModal && PantryModal()}
    

      {toastMessage && (
  <div className="fixed left-1/2 top-6 z-[9999] -translate-x-1/2 rounded-full bg-[#2b1a12] px-6 py-3 text-white shadow-xl">
    {toastMessage}
  </div>
)}

      <BottomNav />
      <footer className="mt-20 border-t border-[#ead7c8] pt-8 text-center text-sm text-[#6d5549]">
  <p>© 2020–2026 Hey Chef™. All rights reserved.</p>

  <div className="mt-3 flex justify-center gap-6">
    <a href="/privacy" className="hover:text-[#a63a0a]">
      Privacy
    </a>

    <a href="/terms" className="hover:text-[#a63a0a]">
      Terms
    </a>

    <a href="/contact" className="hover:text-[#a63a0a]">
      Contact
    </a>
  </div>
</footer>
    </main>
  );
}