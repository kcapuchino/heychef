"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

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
};
type PlannedRecipe = Recipe & {
  mealPlanId: string;
};

type PantryItem = {
  id: string;
  name: string;
  quantity: string;
  unit?: string;
  category: string;
  createdAt: string;
};

type ShoppingItem = {
  id: string;
  name: string;
  storeSection?: string;
  sourceMealPlanId?: string;
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
    image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1200&q=80",
    ingredients: ["Avocado", "Black beans", "Tostada shells", "Cabbage", "Lime", "Cilantro"],
    steps: ["Mash avocado with lime.", "Warm black beans.", "Layer beans, avocado, cabbage, and cilantro on tostadas."],
    cookTime: "20 min",
    servings: "4 servings",
    category: "Main Dish",
    sourceUrl: "https://cooking.nytimes.com/recipes/1027324-avocado-black-bean-tostadas",
    isFavorite: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "sample-green-beans",
    title: "Green Bean Salad with Dill Pickles & Feta",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80",
    ingredients: ["Green beans", "Dill pickles", "Feta", "Herbs", "Olive oil", "Vinegar"],
    steps: ["Blanch green beans.", "Chop pickles and herbs.", "Toss everything with feta and dressing."],
    cookTime: "15 min",
    servings: "4 servings",
    category: "Side Dish",
    sourceUrl: "https://cooking.nytimes.com/recipes/1025454-green-bean-salad-with-dill-pickles-and-feta",
    isFavorite: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "sample-pancakes",
    title: "Sorghum Lemon Ricotta Pancakes",
    image: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=1200&q=80",
    ingredients: ["Sorghum flour", "Baking powder", "Eggs", "Lemon juice", "Lemon zest", "Milk", "Ricotta"],
    steps: ["Mix dry ingredients.", "Whisk wet ingredients.", "Combine, rest batter, then cook pancakes."],
    cookTime: "25 min",
    servings: "4 servings",
    category: "Breakfast",
    sourceUrl: "https://www.sorghumcheckoff.com/recipes/sorghum-lemon-ricotta-pancakes/",
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
function normalizeItemName(text: string) {
  return text
    .toLowerCase()
    .replace(/[()]/g, " ")
.replace(/\bor\b/g, " ")
    .replace(/\d+|cups?|tbsp|tablespoons?|teaspoons?|tsp|ounces?|oz|grams?|g|ml|cans?|small|large|medium/g, " ")
    .replace(/vegan|dairy-free|plant-based|plant/g, " ")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\bleaves\b/g, "leaf")
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
  const [loginEmail, setLoginEmail] = useState("");
  const [hasLoadedUser, setHasLoadedUser] = useState(false);

  const [currentPage, setCurrentPage] = useState<
  "home" | "recipes" | "planner" | "shopping" | "pantry" | "profile"
>("home");

  const [showTomorrow, setShowTomorrow] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [recipeUrl, setRecipeUrl] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showAllRecipes, setShowAllRecipes] = useState(false);

  const [shoppingList, setShoppingList] = useState<string[]>([]);
  const [showShoppingList, setShowShoppingList] = useState(false);

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
  const [plannerPopup, setPlannerPopup] = useState<{
  day: string;
  meal: string;
} | null>(null);
  const [isEditingRecipe, setIsEditingRecipe] = useState(false);
  const [editRecipeDraft, setEditRecipeDraft] = useState<Recipe | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
const [recipeSort, setRecipeSort] = useState("newest");

  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [hidePantryItems, setHidePantryItems] = useState(true);
  const [newShoppingItem, setNewShoppingItem] = useState("");
  const [newPantryItem, setNewPantryItem] = useState("");
 const [newPantryQuantity, setNewPantryQuantity] = useState("");
const [newPantryCategory, setNewPantryCategory] = useState("Other");
const [newPantryUnit, setNewPantryUnit] = useState("");
const [showPantryModal, setShowPantryModal] = useState(false);
const [pantryModalItem, setPantryModalItem] = useState("");
const [pantryModalShoppingItem, setPantryModalShoppingItem] = useState("");
const [pantryModalQuantity, setPantryModalQuantity] = useState("1");
const [pantryModalUnit, setPantryModalUnit] = useState("package");
const [manuallyMarkedOnHand, setManuallyMarkedOnHand] = useState<string[]>([]);
const [buyAnywayItems, setBuyAnywayItems] = useState<string[]>([]);
const [shoppingSort, setShoppingSort] = useState("az");
const [showPantry, setShowPantry] = useState(false);
const [pantryCategoryFilter, setPantryCategoryFilter] = useState("all");
const [pantrySort, setPantrySort] = useState("newest");

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

const neededShoppingListCount = shoppingList.filter((item) => {
  const matchingPantryItem = getMatchingPantryItem(item);
  const isManuallyMarkedOnHand = manuallyMarkedOnHand.includes(item);

  return !matchingPantryItem && !isManuallyMarkedOnHand;
}).length;

  const favoriteRecipes = recipes.filter((recipe) => recipe.isFavorite);
  const homeRecipes = recipes
  .filter((recipe) => recipe.isFavorite)
  .slice(-6)
  .reverse();
  const homeSectionTitle = favoriteRecipes.length > 0 ? "Favorite Recipes" : "Recent Recipes";
  const filteredRecipes = recipes
  .filter((recipe) =>
    categoryFilter === "all"
      ? true
      : recipe.category === categoryFilter
  )
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

  // Default: favorites first
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

const currentWeekFilledSlots = Object.entries(mealPlan).filter(
  ([key, recipes]) =>
    key.startsWith("current-") && recipes.length > 0
).length;

const nextWeekFilledSlots = Object.entries(mealPlan).filter(
  ([key, recipes]) =>
    key.startsWith("next-") && recipes.length > 0
).length;

const filledSlots =
  activePlannerWeek === "next"
    ? nextWeekFilledSlots
    : currentWeekFilledSlots;

const plannerPercent = Math.round(
  (filledSlots / totalSlots) * 100
);

const currentWeekStart = getWeekStartDate("current");
const nextWeekStart = getWeekStartDate("next");

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
      .select("display_name")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error(error);
      return;
    }

    setDisplayName(data?.display_name || "");
  }

  if (userEmail) {
    loadProfile();
  }
}, [userEmail]);
  useEffect(() => {
  async function loadSession() {
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
setShoppingList(parsed.shoppingList || []);
setMealPlan(parsed.mealPlan || {});
setPantryItems(
  (parsed.pantryItems || []).map((item) => ({
    ...item,
    category: item.category || "Other",
  }))
);
    } else {
  setRecipes([]);
  setShoppingList([]);
  setMealPlan({});
  setPantryItems([]);
  setPlannerRecipeId("");
}

    setUserEmail(normalizedEmail);
    localStorage.setItem("hey-chef-current-user", normalizedEmail);
    setHasLoadedUser(true);
  }

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
      }))
    );
  }

  if (userEmail) {
    loadRecipes();
  }
}, [userEmail]);

useEffect(() => {
  async function loadShoppingItems() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("shopping_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setShoppingList((data || []).map((item) => item.name));
  }

  if (userEmail) {
    loadShoppingItems();
  }
}, [userEmail]);

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
  }))
);
  }

  if (userEmail) {
    loadPantry();
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
  recipes (*)
`);

    if (error) {
      console.error(error);
      return;
    }

    const loadedPlan: Record<string, PlannedRecipe[]> = {};

    (data || []).forEach((item: any) => {
      console.log(item.week_start);
      if (!item.recipes) return;

const currentWeekStart = getWeekStartDate("current");
const nextWeekStart = getWeekStartDate("next");

let plannerWeek = item.week || "current";

if (item.week_start === currentWeekStart) {
  plannerWeek = "current";
} else if (item.week_start === nextWeekStart) {
  plannerWeek = "next";
}

const mealDate = item.date || item.day;
const key = `${plannerWeek}-${mealDate}-${item.meal}`;

      if (!loadedPlan[key]) {
        loadedPlan[key] = [];
      }

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
        mealPlanId: item.id,
      });
    });

    setMealPlan(loadedPlan);
  }

  if (userEmail) {
    loadMealPlan();
  }
}, [userEmail]);


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
  alert("Password updated. You can log in now.");
}
async function changePasswordNow() {
  const password = prompt("Enter your new password:");

  if (!password) return;

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Password updated.");
}

  async function logoutUser() {
  await supabase.auth.signOut();

  setUserEmail("");
  setHasLoadedUser(false);

  setRecipes([]);
  setShoppingList([]);
  setMealPlan({});
  setSelectedRecipe(null);

  setShowMealPlanner(false);
  setShowShoppingList(false);
  setShowAllRecipes(false);

  setLoginEmail("");
  setLoginPassword("");

  localStorage.removeItem("hey-chef-current-user");
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

  async function importRecipe() {
  if (!recipeUrl) return;

  setIsImporting(true);
  setImportError("");
  setShowManualImport(false);

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setImportError("Please log in again before importing a recipe.");
      return;
    }

    const response = await fetch("/api/import-recipe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: recipeUrl }),
    });

    const text = await response.text();

    let importedData;

    try {
      importedData = JSON.parse(text);
    } catch {
      setImportError(
        "The import route is not returning JSON. Check app/api/import-recipe/route.ts and restart npm."
      );
      setShowManualImport(true);
      return;
    }

    if (!response.ok) {
      setImportError(importedData.error || "Could not import this recipe.");
      setShowManualImport(true);
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
    alert("Please log in again.");
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
      image_url: "",
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      source_url: recipe.sourceUrl,
      is_favorite: false,
    })
    .select()
    .single();

  if (error) {
    alert(error.message);
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
function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "GOOD MORNING 👋";
  }

  if (hour < 17) {
    return "GOOD AFTERNOON 👋";
  }

  return "GOOD EVENING 👋";
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
    alert(error.message);
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
    alert(error.message);
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

  function cleanForSort(item: string) {
  return item
    .replace(/×\s*\d+$/g, "")
    .replace(/^\d+(\s+\d\/\d|\/\d|\.\d+)?\s*/g, "")
    .replace(/^(cups?|cup|tablespoons?|tbsp|teaspoons?|tsp|pounds?|lb|ounces?|oz)\s+/i, "")
    .toLowerCase()
    .trim();
}

async function addItemsToShoppingList(items: string[]) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    alert("Please log in again.");
    return;
  }

  const rows = items.map((item) => ({
    user_id: user.id,
    name: item,
  }));

  const { data, error } = await supabase
    .from("shopping_items")
    .insert(rows)
    .select();

  if (error) {
    alert(error.message);
    return;
  }

  const newItems = (data || []).map((item) => item.name);

  const sorted = [...shoppingList, ...newItems].sort((a, b) =>
    cleanForSort(a).localeCompare(cleanForSort(b))
  );

  setShoppingList(sorted);
  alert("Ingredients added to your shopping list.");
}

function addToShoppingList(recipe: Recipe) {
  addItemsToShoppingList(recipe.ingredients);
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
    alert("Please log in again.");
    return;
  }

  const currentMealPlanIngredients = Object.values(mealPlan)
    .flat()
    .flatMap((recipe) =>
      recipe.ingredients.map((ingredient) => ({
        name: ingredient,
        mealPlanId: recipe.mealPlanId,
      }))
    );

  if (currentMealPlanIngredients.length === 0) {
    alert("No meal plan items to add.");
    return;
  }

  const { error: deleteError } = await supabase
    .from("shopping_items")
    .delete()
    .eq("user_id", user.id)
    .not("source_meal_plan_id", "is", null);

  if (deleteError) {
    alert(deleteError.message);
    return;
  }

  const rows = currentMealPlanIngredients.map((item) => ({
    user_id: user.id,
    name: item.name,
    source_meal_plan_id: item.mealPlanId,
    store_section: "Other",
  }));

  const { data, error } = await supabase
    .from("shopping_items")
    .insert(rows)
    .select();

  if (error) {
    alert(error.message);
    return;
  }

  const { data: manualData, error: manualError } = await supabase
  .from("shopping_items")
  .select("*")
  .eq("user_id", user.id)
  .is("source_meal_plan_id", null);

if (manualError) {
  alert(manualError.message);
  return;
}

const manualItems = (manualData || []).map((item) => item.name);

  const newMealPlanItems = (data || []).map((item) => item.name);

  const sorted = [...manualItems, ...newMealPlanItems].sort((a, b) =>
    cleanForSort(a).localeCompare(cleanForSort(b))
  );

  setShoppingList(sorted);

  alert("Shopping list updated from your meal plan.");
}

  async function addRecipeToMealPlan(day: string, meal: string, recipe: Recipe) {
  const key = getMealPlanKey(day, meal);
  const currentRecipes = mealPlan[key] || [];

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    alert("Please log in again.");
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
})
    .select()
    .single();

  if (error) {
    alert(error.message);
    return;
  }

  const plannedRecipe: PlannedRecipe = {
    ...recipe,
    mealPlanId: data.id,
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
    alert(error.message);
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

  async function deleteRecipe(recipeId: string) {
  const { error } = await supabase
    .from("recipes")
    .delete()
    .eq("id", recipeId);

  if (error) {
    alert(error.message);
    return;
  }

  setRecipes(recipes.filter((recipe) => recipe.id !== recipeId));

  const updatedMealPlan = { ...mealPlan };

Object.keys(updatedMealPlan).forEach((key) => {
  if (key.startsWith(`${activePlannerWeek}-`)) {
    delete updatedMealPlan[key];
  }
});

setMealPlan(updatedMealPlan);

  setMealPlan(updatedMealPlan);
  setSelectedRecipe(null);
  setShowAllRecipes(true);
}

  async function updateSelectedRecipe(updatedRecipe: Recipe) {
    console.log("Saving recipe:", updatedRecipe);
    if (updatedRecipe.id === "new-recipe") {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    alert("Please log in again.");
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
    })
    .select()
    .single();

  if (error) {
    alert(error.message);
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
    })
    .eq("id", updatedRecipe.id);

  if (error) {
    alert(error.message);
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
    alert(error.message);
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

function getMatchingPantryItem(shoppingItem: string) {
  const cleanedShoppingName = normalizeItemName(shoppingItem);

  return pantryItems.find((pantryItem) => {
    const cleanedPantryName = normalizeItemName(pantryItem.name);

    if (!cleanedPantryName || cleanedPantryName.length < 3) {
      return false;
    }

    return cleanedShoppingName.includes(cleanedPantryName);
  });
}

function isItemInPantry(shoppingItem: string) {
  return pantryItems.some((pantryItem) =>
    shoppingItem.toLowerCase().includes(
      pantryItem.name.toLowerCase()
    )
  );
}

async function addShoppingItemToPantry(shoppingItem: string) {
  const cleanedShoppingName = normalizeItemName(shoppingItem);

  const alreadyInPantry = pantryItems.find((pantryItem) => {
    const cleanedPantryName = normalizeItemName(pantryItem.name);

    return (
      cleanedShoppingName.includes(cleanedPantryName) ||
      cleanedPantryName.includes(cleanedShoppingName)
    );
  });

  if (alreadyInPantry) {
    alert(`${shoppingItem} already matches ${alreadyInPantry.name} in your pantry.`);
    return;
  }

  const cleanedName = cleanPantryDisplayName(shoppingItem);

  setPantryModalItem(cleanedName);
setPantryModalShoppingItem(shoppingItem);
setPantryModalQuantity("1");
setPantryModalUnit("package");
setPantryModalUnit("package");
setShowPantryModal(true);
}

async function savePantryModal() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    alert("Please log in again.");
    return;
  }

  if (!pantryModalItem.trim()) return;

  const { data, error } = await supabase
    .from("pantry_items")
    .insert({
      user_id: user.id,
      name: pantryModalItem.trim(),
      quantity: pantryModalQuantity.trim() || "1",
      unit: pantryModalUnit,
      category: "Other",
    })
    .select()
    .single();

  if (error) {
    alert(error.message);
    return;
  }

  const newPantryItem: PantryItem = {
    id: data.id,
    name: data.name,
    quantity: data.quantity || "1",
    unit: data.unit || "",
    category: data.category || "Other",
    createdAt: data.created_at,
  };

  setPantryItems([newPantryItem, ...pantryItems]);
  setShowPantryModal(false);
  setPantryModalItem("");
  setPantryModalQuantity("1");
  setPantryModalUnit("package");
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
    alert(error.message);
    return;
  }

  alert("Password reset email sent.");
}
function BottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-[#ead7c8] bg-white px-2 py-2 shadow-xl md:hidden">


      <button
        onClick={goAllRecipes}
        className={
          currentPage === "recipes"
            ? "rounded-2xl px-2 py-2 text-sm font-bold text-[#a63a0a]"
            : "rounded-2xl px-2 py-2 text-sm text-[#a63a0a]"
        }
      >
        🍳<br />Recipes
      </button>

      <button
        onClick={goMealPlanner}
        className={
          currentPage === "planner"
            ? "rounded-2xl px-2 py-2 text-sm font-bold text-[#a63a0a]"
            : "rounded-2xl px-2 py-2 text-sm text-[#a63a0a]"
        }
      >
        📅<br />Planner
      </button>

      <button
  onClick={() => {
    goHome();
    setShowImport(true);
  }}
  className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#a63a0a] text-2xl font-bold text-white shadow"
>
  +
</button>

      <button
        onClick={goShoppingList}
        className={
          currentPage === "shopping"
            ? "rounded-2xl px-2 py-2 text-sm font-bold text-[#a63a0a]"
            : "rounded-2xl px-2 py-2 text-sm text-[#a63a0a]"
        }
      >
        🛒<br />Shopping
      </button>

      <button
  onClick={goPantry}
  className={
    currentPage === "pantry"
      ? "rounded-2xl px-2 py-2 text-sm font-bold text-[#a63a0a]"
      : "rounded-2xl px-2 py-2 text-sm text-[#a63a0a]"
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
        {authMode === "signup" ? "Ready to cook?" : "Welcome back 👋"}
      </h2>

      <p className="mb-5 text-[#6d5549]">
        {authMode === "signup"
          ? "Create an account to save your recipes."
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
      alert(
        "Install Hey Chef:\n\nTap the Share button in Safari, then choose 'Add to Home Screen'."
      );
    } else if (/Android/.test(ua)) {
      alert(
        "Install Hey Chef:\n\nTap the browser menu and choose 'Install App' or 'Add to Home Screen'."
      );
    } else {
      alert(
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
      <section className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-8 py-6 md:grid-cols-[1.2fr_0.8fr] md:py-10">
        <div>
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-[#a63a0a]">
            Hey Chef!
          </p>

          <h1 className="mb-4 text-5xl font-bold leading-tight md:text-7xl">
            Save recipes from anywhere.
          </h1>

          <p className="mb-6 max-w-xl text-lg text-[#6d5549]">
            Import recipes, plan meals, build shopping lists, and keep your favorite meals in one cozy place.
          </p>

          {/* Mobile login form goes here */}
          <div className="mb-8 rounded-[2rem] bg-white p-6 shadow-xl md:hidden">
            {renderAuthCard()}
          </div>

          <p className="mb-4 font-semibold text-[#a63a0a]">
            Explore a few recipes before creating your account.
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            {sampleRecipes.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => setSampleRecipe(recipe)}
                className="rounded-3xl bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <img
                  src={recipe.image || placeholderImage}
                  alt={recipe.title}
                  className="mb-4 h-36 w-full rounded-2xl object-cover"
                />

                <h3 className="text-lg font-bold">{recipe.title}</h3>
                <RecipeMeta recipe={recipe} />

                <p className="mt-3 text-sm text-[#6d5549]">
                  Click to preview
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Desktop login form stays in right column */}
        <div className="hidden rounded-[2rem] bg-white p-6 shadow-xl md:block">
          {renderAuthCard()}
        </div>
      </section>

      {sampleRecipe && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/40 px-4 pb-6 md:items-center md:justify-center md:pb-0"
          onClick={() => setSampleRecipe(null)}
        >
          <div
            className="relative max-h-[90vh] w-full overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl md:max-w-2xl"
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
              className="mb-5 h-56 w-full rounded-3xl object-cover"
            />

            <h2 className="mb-2 text-3xl font-bold">{sampleRecipe.title}</h2>
            <RecipeMeta recipe={sampleRecipe} />

            <h3 className="mb-3 mt-6 text-xl font-bold">Ingredients</h3>
            <ul className="mb-6 space-y-2">
              {sampleRecipe.ingredients.map((ingredient) => (
                <li key={ingredient}>• {ingredient}</li>
              ))}
            </ul>

            <h3 className="mb-3 text-xl font-bold">Steps</h3>
            <ol className="mb-6 space-y-3">
              {sampleRecipe.steps.map((step, index) => (
                <li key={`${step}-${index}`} className="rounded-2xl bg-[#f8efe6] p-4">
                  <strong>Step {index + 1}:</strong> {step}
                </li>
              ))}
            </ol>

            <a
              href={sampleRecipe.sourceUrl}
              target="_blank"
              className="mb-4 block text-[#a63a0a] underline"
            >
              View original recipe
            </a>

            <button
              onClick={() => setSampleRecipe(null)}
              className="w-full rounded-full bg-[#a63a0a] px-6 py-3 text-white"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

if (showProfile) {
  return (
    <main className="min-h-screen bg-[#f8efe6] px-5 py-6 pb-32 text-[#2b1a12] md:p-8">
      <section className="mx-auto max-w-6xl py-6 md:px-6 md:py-10">
  <nav className="relative mb-8 flex items-start justify-between gap-3">
  <div className="flex flex-col">
  <button
    onClick={goHome}
    className="text-3xl font-bold text-[#a63a0a]"
  >
    Hey Chef!
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

          <label className="mb-2 block font-semibold">Display name</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Chef"
            className="mb-5 w-full rounded-full border border-[#ead7c8] px-5 py-3"
          />

          <label className="mb-2 block font-semibold">Email</label>
          <input
            value={userEmail}
            disabled
            className="mb-5 w-full rounded-full border border-[#ead7c8] bg-[#f8efe6] px-5 py-3 text-[#6d5549]"
          />

          <button
            onClick={async () => {
              const {
                data: { user },
              } = await supabase.auth.getUser();

              if (!user) {
                alert("Please log in again.");
                return;
              }

              const { error } = await supabase
                .from("profiles")
                .update({
                  display_name: displayName.trim() || null,
                })
                .eq("id", user.id);

              if (error) {
                alert(error.message);
                return;
              }

              alert("Profile saved.");
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
        </section>
      </section>

      <BottomNav />
    </main>
  );
}

  if (showShoppingList) {
    return (
      <main className="min-h-screen bg-[#f8efe6] px-5 py-6 pb-32 text-[#2b1a12] md:p-8">
      <section className="mx-auto max-w-6xl py-6 md:px-6 md:py-10">
  <nav className="relative mb-8 flex items-start justify-between gap-3">
  <div className="flex flex-col">
  <button
    onClick={goHome}
    className="text-3xl font-bold text-[#a63a0a]"
  >
    Hey Chef!
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
    alert(
      "Install Hey Chef:\n\nOn iPhone: tap Share, then Add to Home Screen.\n\nOn Android: tap the browser menu, then Install App or Add to Home Screen."
    );
  }}
  className="block w-full rounded-xl px-4 py-3 text-left hover:bg-[#fff4ef]"
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
    alert(
      "Install Hey Chef:\n\nOn iPhone: tap Share, then Add to Home Screen.\n\nOn Android: tap the browser menu, then Install App or Add to Home Screen."
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
          

          <div className="mb-8 flex items-start justify-between gap-3">
  <div>
    <h1 className="text-5xl font-bold">Shopping List</h1>

    <p className="mt-2 text-[#6d5549]">
      Review ingredients you need and move items into your pantry.
    </p>
  </div>

  <button
    onClick={async () => {
      if (confirm("Clear your shopping list?")) {
  const { error } = await supabase
    .from("shopping_items")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    alert(error.message);
    return;
  }

  setShoppingList([]);
}
    }}
    className="rounded-full border border-[#a63a0a] px-6 py-3 text-[#a63a0a]"
  >
    🗑 Clear List
  </button>
</div>

<div className="mb-6 grid gap-3 md:grid-cols-[1fr_auto]">
  <input
    value={newShoppingItem}
    onChange={(e) => setNewShoppingItem(e.target.value)}
    placeholder="Add grocery item"
    className="rounded-full border border-[#ead7c8] bg-white px-5 py-3"
  />

  <button
    onClick={async () => {
      if (!newShoppingItem.trim()) return;

      const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) {
  alert("Please log in again.");
  return;
}

const { data, error } = await supabase
  .from("shopping_items")
  .insert({
    user_id: user.id,
    name: newShoppingItem.trim(),
  })
  .select()
  .single();

if (error) {
  alert(error.message);
  return;
}

setShoppingList([data.name, ...shoppingList]);
setNewShoppingItem("");
    }}
    className="rounded-full bg-[#a63a0a] px-6 py-3 text-white"
  >
    Add Item
  </button>
</div>

<div className="mb-8 grid gap-3 md:grid-cols-2">
  <select
    value={shoppingSort}
    onChange={(e) => setShoppingSort(e.target.value)}
    className="rounded-full border border-[#ead7c8] bg-white px-5 py-3"
  >
    <option value="az">A–Z</option>
    <option value="za">Z–A</option>
  </select>

  <button
    onClick={() => setHidePantryItems(!hidePantryItems)}
    className="rounded-full border border-[#a63a0a] px-6 py-3 text-[#a63a0a]"
  >
    {hidePantryItems ? "Show Pantry Items" : "Hide Pantry Items"}
  </button>
</div>

<div className="rounded-3xl bg-white p-6 shadow">
  {shoppingList.length === 0 ? (
    <p className="text-[#6d5549]">Your shopping list is empty.</p>
  ) : (
    <div className="space-y-3">
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

    return (
  !hidePantryItems ||
  (!matchingPantryItem && !isManuallyMarkedOnHand) ||
  buyAnywayItems.includes(item)
);
  })
  .sort((a, b) => {
    if (shoppingSort === "za") {
      return cleanForSort(b.item).localeCompare(cleanForSort(a.item));
    }

    return cleanForSort(a.item).localeCompare(cleanForSort(b.item));
  })
  .map(({ item, count }) => {
          const matchingPantryItem = getMatchingPantryItem(item);
          const isManuallyMarkedOnHand = manuallyMarkedOnHand.includes(item);

          return (
            <div key={item} className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-3">
                <input type="checkbox" className="h-5 w-5" />
                <span>
  {item}
  {count > 1 ? ` ×${count}` : ""}
</span>
              </label>

              <div className="flex items-center gap-3">
                {buyAnywayItems.includes(item) ? (
  <>
    <span className="text-[#6d5549]">
      ✓ In pantry: {matchingPantryItem?.quantity || "on hand"}
    </span>

    <button
      onClick={() => {
        setBuyAnywayItems(
          buyAnywayItems.filter((savedItem) => savedItem !== item)
        );
      }}
      className="text-[#a63a0a]"
    >
      Move Back
    </button>
  </>
) : matchingPantryItem ? (
  <div className="flex items-center gap-3">
    <span className="text-[#6d5549]">
      ✓ In pantry: {matchingPantryItem.quantity || "on hand"}
    </span>

    <button
      onClick={() => {
        setBuyAnywayItems([...buyAnywayItems, item]);
      }}
      className="text-[#a63a0a]"
    >
      Buy Anyway
    </button>
  </div>
) : isManuallyMarkedOnHand ? (
  <>
    <span className="text-[#6d5549]">✓ On hand</span>

    <button
      onClick={() => {
        setManuallyMarkedOnHand(
          manuallyMarkedOnHand.filter((savedItem) => savedItem !== item)
        );
      }}
      className="text-[#a63a0a]"
    >
      Move Back
    </button>
  </>
) : (
  <>
    <button
      onClick={() => addShoppingItemToPantry(item)}
      className="text-[#a63a0a]"
    >
      Add to Pantry
    </button>

    <button
      onClick={() => removeShoppingItem(item)}
      className="text-[#a63a0a]"
    >
      Remove Item
    </button>
  </>
)}
              </div>
            </div>
          );
        })}
    </div>
  )}
</div>
        </section>
<BottomNav />
{showPantryModal && (
  <div className="fixed inset-0 z-50 flex items-end bg-black/40 px-4 pb-6 md:items-center md:justify-center md:pb-0">
    <div className="w-full rounded-[2rem] bg-white p-6 shadow-2xl md:max-w-md">
      <h2 className="mb-4 text-2xl font-bold">Add to Pantry</h2>

      <input
        value={pantryModalItem}
        onChange={(e) => setPantryModalItem(e.target.value)}
        placeholder="Item name"
        className="mb-3 w-full rounded-full border border-[#ead7c8] px-5 py-3"
      />

      <div className="mb-4 grid grid-cols-2 gap-3">
        <input
          value={pantryModalQuantity}
          onChange={(e) => setPantryModalQuantity(e.target.value)}
          placeholder="Qty"
          className="rounded-full border border-[#ead7c8] px-5 py-3"
        />

        <select
          value={pantryModalUnit}
          onChange={(e) => setPantryModalUnit(e.target.value)}
          className="rounded-full border border-[#ead7c8] bg-white px-5 py-3"
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
      </div>

      <div className="flex justify-end gap-3">
  <button
    onClick={() => setShowPantryModal(false)}
    className="rounded-full border border-[#ead7c8] px-5 py-3"
  >
    Cancel
  </button>

  <button
    onClick={() => {
  setManuallyMarkedOnHand([
    ...manuallyMarkedOnHand,
    pantryModalShoppingItem,
  ]);
  setShowPantryModal(false);
}}
    className="rounded-full border border-[#ead7c8] px-5 py-3"
  >
    Mark On Hand
  </button>

  <button
    onClick={savePantryModal}
    className="rounded-full bg-[#a63a0a] px-5 py-3 text-white"
  >
    Add
  </button>
</div>
    </div>
  </div>
)}
      </main>
    );
  }

  if (showMealPlanner) {
    return (
      <main className="min-h-screen bg-[#f8efe6] px-5 py-6 pb-32 text-[#2b1a12] md:p-8">
        <section className="mx-auto max-w-6xl py-6 md:px-6 md:py-10">
  <nav className="relative mb-8 flex items-start justify-between gap-3">
  <div className="flex flex-col">
  <button
    onClick={goHome}
    className="text-3xl font-bold text-[#a63a0a]"
  >
    Hey Chef!
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
    alert(
      "Install Hey Chef:\n\nOn iPhone: tap Share, then Add to Home Screen.\n\nOn Android: tap the browser menu, then Install App or Add to Home Screen."
    );
  }}
  className="block w-full rounded-xl px-4 py-3 text-left hover:bg-[#fff4ef]"
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
    alert(
      "Install Hey Chef:\n\nOn iPhone: tap Share, then Add to Home Screen.\n\nOn Android: tap the browser menu, then Install App or Add to Home Screen."
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
  

          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
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
      Add New Items to Shopping List
    </button>

    <button
      onClick={async () => {
  if (confirm("Clear your meal plan and start fresh?")) {
    const { error } = await supabase
      .from("meal_plan")
  .delete()
  .eq("week_start", getWeekStartDate(activePlannerWeek));

    if (error) {
      alert(error.message);
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
      Reset Meal Plan
    </button>
  </div>
</div>

{plannerPopup && (
  <section className="fixed inset-0 z-50 flex items-end bg-black/30 px-4 pb-6 md:items-center md:justify-center md:pb-0">
    <div className="w-full rounded-[2rem] bg-white p-6 shadow-2xl md:max-w-md">
      <h2 className="mb-2 text-3xl font-bold">Add Recipe</h2>

      <p className="mb-5 text-[#6d5549]">
        Add a recipe to {plannerPopup.day} {plannerPopup.meal}.
      </p>

      {recipes.length === 0 ? (
        <p className="text-[#6d5549]">Import a recipe first.</p>
      ) : (
        <>
          <select
            value={plannerRecipeId}
            onChange={(e) => setPlannerRecipeId(e.target.value)}
            className="mb-4 w-full rounded-full border border-[#ead7c8] bg-white px-5 py-4 pr-12 text-[#2b1a12]"
          >
            <option value="">Choose a recipe</option>
            {recipes
  .filter((recipe) => recipe.isPlanningQueue)
  .map((recipe) => (
              <option key={recipe.id} value={recipe.id}>
                {recipe.title}
              </option>
            ))}
          </select>

          <button
            onClick={addRecipeFromPlanner}
            className="w-full rounded-full bg-[#a63a0a] px-6 py-4 text-white"
          >
            Add to {plannerPopup.meal}
          </button>
        </>
      )}

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
    onClick={() => setActivePlannerWeek("current")}
    className={`rounded-full px-5 py-3 font-semibold transition ${
      activePlannerWeek === "current"
        ? "bg-[#a63a0a] text-white shadow"
        : "text-[#a63a0a]"
    }`}
  >
    This Week
  </button>

  <button
    onClick={() => setActivePlannerWeek("next")}
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
                  {plannedRecipes.map((recipe) => (
                    <div key={recipe.mealPlanId} className="rounded-xl bg-white p-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center justify-between gap-3">
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
    className="text-left font-medium text-[#a63a0a] hover:underline"
  >
    {recipe.title}
  </button>
</div>

                        <button
                          onClick={() => removeRecipeFromMealPlan(day.date, meal, recipe.mealPlanId)}
                          className="shrink-0 text-[#a63a0a]"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {plannedRecipes.length < 3 && (
                <button
                  onClick={() => {
                    setPlannerPopup({ day: day.date, meal });
                    setPlannerRecipeId(recipes[0]?.id || "");
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
        <nav className="relative mb-8 flex items-start justify-between gap-3">
  <div className="flex flex-col">
  <button
    onClick={goHome}
    className="text-3xl font-bold text-[#a63a0a]"
  >
    Hey Chef!
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
    alert(
      "Install Hey Chef:\n\nOn iPhone: tap Share, then Add to Home Screen.\n\nOn Android: tap the browser menu, then Install App or Add to Home Screen."
    );
  }}
  className="block w-full rounded-xl px-4 py-3 text-left hover:bg-[#fff4ef]"
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
    alert(
      "Install Hey Chef:\n\nOn iPhone: tap Share, then Add to Home Screen.\n\nOn Android: tap the browser menu, then Install App or Add to Home Screen."
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
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
  <div className="w-full">
  <h1 className="text-5xl font-bold">
    My Pantry
  </h1>

  <p className="mt-2 text-[#6d5549]">
    Track ingredients you already have on hand.
  </p>
<div className="mt-4 grid gap-3 md:grid-cols-[1.5fr_0.7fr_1fr_1fr_auto]">
    <input
      value={newPantryItem}
      onChange={(e) => setNewPantryItem(e.target.value)}
      placeholder="Add pantry item"
      className="rounded-full border border-[#ead7c8] bg-white px-5 py-3"
    />

    <input
      value={newPantryQuantity}
      onChange={(e) => setNewPantryQuantity(e.target.value)}
      placeholder="On Hand"
      className="rounded-full border border-[#ead7c8] bg-white px-5 py-3"
    />
    
<select
  value={newPantryUnit}
  onChange={(e) => setNewPantryUnit(e.target.value)}
  className="rounded-full border border-[#ead7c8] bg-white px-5 py-3"
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
      value={newPantryCategory}
      onChange={(e) => setNewPantryCategory(e.target.value)}
      className="rounded-full border border-[#ead7c8] bg-white px-5 py-3"
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

    <button
      onClick={async () => {
  if (!newPantryItem.trim()) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data, error } = await supabase
    .from("pantry_items")
    .insert({
      user_id: user.id,
      name: newPantryItem.trim(),
      quantity: newPantryQuantity.trim() || "1",
unit: newPantryUnit,
category: newPantryCategory,
    })
    .select()
    .single();

  if (error) {
    alert(error.message);
    return;
  }

  setPantryItems([
    {
      id: data.id,
      name: data.name,
      quantity: data.quantity,
unit: data.unit || "",
category: data.category,
      createdAt: data.created_at,
    },
    ...pantryItems,
  ]);

  setNewPantryItem("");
  setNewPantryQuantity("");
setNewPantryUnit("");
setNewPantryCategory("Other");
}}
      className="rounded-full bg-[#a63a0a] px-6 py-3 text-white"
    >
      Add Item
    </button>
</div>
</div>
</div>

        <div className="mb-6 mt-6 grid gap-3 md:grid-cols-2">
          <select
            value={pantryCategoryFilter}
            onChange={(e) => setPantryCategoryFilter(e.target.value)}
            className="rounded-full border border-[#ead7c8] bg-white px-5 py-3"
          >
            <option value="all">All Categories</option>
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

          <select
            value={pantrySort}
            onChange={(e) => setPantrySort(e.target.value)}
            className="rounded-full border border-[#ead7c8] bg-white px-5 py-3"
          >
            <option value="az">A–Z</option>
            <option value="za">Z–A</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>

        {pantryItems.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 shadow">
            <p className="text-[#6d5549]">Your pantry is empty.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {[...new Set(pantryItems.map((item) => item.category))]
  .sort()
  .map((category) => {
                const itemsInCategory = filteredPantryItems.filter(
                  (item) => item.category === category
                );

                if (itemsInCategory.length === 0) return null;

                return (
                  <section key={category}>
                    <h2 className="mb-3 text-2xl font-bold text-[#a63a0a]">
                      {category}
                    </h2>

                    <div className="grid gap-3">
                      {itemsInCategory.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-3xl bg-white p-5 shadow"
                        >
                          <div className="grid gap-3 md:grid-cols-4">
                            <input
                              value={item.name}
                              onChange={async (e) => {
  const newName = e.target.value;

  setPantryItems(
    pantryItems.map((p) =>
      p.id === item.id ? { ...p, name: newName } : p
    )
  );

  await supabase
    .from("pantry_items")
    .update({ name: newName })
    .eq("id", item.id);
}}
                              placeholder="Item"
                              className="rounded-xl border border-[#ead7c8] p-3"
                            />

                            <input
                              value={item.quantity}
                              onChange={async (e) => {
  const newQuantity = e.target.value;
<select
  value={item.unit || ""}
  onChange={async (e) => {
    const newUnit = e.target.value;

    setPantryItems(
      pantryItems.map((p) =>
        p.id === item.id ? { ...p, unit: newUnit } : p
      )
    );

    await supabase
      .from("pantry_items")
      .update({ unit: newUnit })
      .eq("id", item.id);
  }}
  className="rounded-xl border border-[#ead7c8] bg-white p-3"
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
  setPantryItems(
    pantryItems.map((p) =>
      p.id === item.id ? { ...p, quantity: newQuantity } : p
    )
  );

  await supabase
    .from("pantry_items")
    .update({ quantity: newQuantity })
    .eq("id", item.id);
}}
                              placeholder="On Hand"
                              className="rounded-xl border border-[#ead7c8] p-3"
                            />

               

<select
  value={item.unit || ""}
  onChange={async (e) => {
    const newUnit = e.target.value;

    setPantryItems(
      pantryItems.map((p) =>
        p.id === item.id ? { ...p, unit: newUnit } : p
      )
    );

    await supabase
      .from("pantry_items")
      .update({ unit: newUnit })
      .eq("id", item.id);
  }}
  className="rounded-xl border border-[#ead7c8] bg-white p-3"
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
                              value={item.category}
                              onChange={async (e) => {
  const newCategory = e.target.value;

  setPantryItems(
    pantryItems.map((p) =>
      p.id === item.id ? { ...p, category: newCategory } : p
    )
  );

  await supabase
    .from("pantry_items")
    .update({ category: newCategory })
    .eq("id", item.id);
}}
                              className="rounded-xl border border-[#ead7c8] bg-white p-3"
                            >
                              <option value="Produce">Produce</option>
<option value="Refrigerated">Refrigerated</option>
<option value="Frozen">Frozen</option>
<option value="Meat & Protein">Meat & Protein</option>
<option value="Canned Goods">Canned Goods</option>
<option value="Grains & Pasta">Grains & Pasta</option>
<option value="Baking">Baking</option>
<option value="Spices">Spices</option>
<option value="Condiments">Condiments</option>
<option value="Snacks">Snacks</option>
<option value="Beverages">Beverages</option>
<option value="Other">Other</option>
                            </select>
                          </div>

                          <div className="mt-3 flex justify-end">
                            <button
                              onClick={async () => {
  const { error } = await supabase
    .from("pantry_items")
    .delete()
    .eq("id", item.id);

  if (error) {
    alert(error.message);
    return;
  }

  setPantryItems(
    pantryItems.filter((p) => p.id !== item.id)
  );
}}
                              className="rounded-full bg-[#fff4ef] px-4 py-2 text-sm text-[#a63a0a]"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              }
            )}
          </div>
        )}
      </section>
      <BottomNav />
    </main>
  );
}
  if (showAllRecipes) {
  return (
    <main className="min-h-screen bg-[#f8efe6] px-5 py-6 pb-32 text-[#2b1a12] md:p-8">
      <section className="mx-auto max-w-6xl py-6 md:px-6 md:py-10">
        <nav className="relative mb-8 flex items-start justify-between gap-3">
  <div className="flex flex-col">
  <button
    onClick={goHome}
    className="text-3xl font-bold text-[#a63a0a]"
  >
    Hey Chef!
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
    alert(
      "Install Hey Chef:\n\nOn iPhone: tap Share, then Add to Home Screen.\n\nOn Android: tap the browser menu, then Install App or Add to Home Screen."
    );
  }}
  className="block w-full rounded-xl px-4 py-3 text-left hover:bg-[#fff4ef]"
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
    alert(
      "Install Hey Chef:\n\nOn iPhone: tap Share, then Add to Home Screen.\n\nOn Android: tap the browser menu, then Install App or Add to Home Screen."
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


        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
  <div className="w-full">
    <h1 className="text-4xl font-bold md:text-5xl">All Recipes</h1>
    <p className="mt-2 text-[#6d5549]">
  Build your personal cookbook with recipes imported from anywhere or created from scratch.
    </p>
  </div>

  <div className="w-full flex flex-col gap-3 md:w-auto md:flex-row">
  <button
    onClick={() => setShowImport(true)}
    className="w-full rounded-full bg-[#a63a0a] px-8 py-4 text-white md:w-auto"
  >
    Import Recipe
  </button>

  <button
    onClick={createNewRecipe}
    className="w-full rounded-full bg-white px-8 py-4 text-[#a63a0a] md:w-auto"
  >
    Create New Recipe
  </button>
</div>
</div>

<div className="mb-8 grid gap-3 md:grid-cols-2">
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
  </select>

  <select
    value={recipeSort}
    onChange={(e) => setRecipeSort(e.target.value)}
    className="rounded-full border border-[#ead7c8] bg-white px-5 py-3"
  >
    <option value="favorites">Favorites</option>
    <option value="newest">Newest</option>
    <option value="oldest">Oldest</option>
    <option value="az">A–Z</option>
    <option value="za">Z–A</option>
  </select>
</div>

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

            <div className="flex gap-3">
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
            

            {importError && <p className="mt-4 text-sm text-red-700">{importError}</p>}

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
                  placeholder={`Lemon Texas Sheet Cake

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
                <img
  src={recipe.image || placeholderImage}
  alt={recipe.title}
  className="mb-4 h-36 w-full rounded-2xl object-cover"
/>

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

                <RecipeMeta recipe={recipe} />
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
    </main>
  );
}

  if (selectedRecipe) {
    return (
      <main className="min-h-screen bg-[#f8efe6] px-5 py-6 pb-32 text-[#2b1a12] md:p-8">
       <section className="mx-auto max-w-6xl py-6 md:px-6 md:py-10">
  <nav className="relative mb-8 flex items-start justify-between gap-3">
  <div className="flex flex-col">
  <button
    onClick={goHome}
    className="text-3xl font-bold text-[#a63a0a]"
  >
    Hey Chef!
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
    alert(
      "Install Hey Chef:\n\nOn iPhone: tap Share, then Add to Home Screen.\n\nOn Android: tap the browser menu, then Install App or Add to Home Screen."
    );
  }}
  className="block w-full rounded-xl px-4 py-3 text-left hover:bg-[#fff4ef]"
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
    alert(
      "Install Hey Chef:\n\nOn iPhone: tap Share, then Add to Home Screen.\n\nOn Android: tap the browser menu, then Install App or Add to Home Screen."
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

    <RecipeMeta recipe={selectedRecipe} />
  </div>
<div className="flex flex-col gap-3 md:flex-row">
  {!isEditingRecipe ? (
  <>
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setEditRecipeDraft(selectedRecipe);
        setIsEditingRecipe(true);
      }}
      className="rounded-full bg-[#fff4ef] px-4 py-2 text-[#a63a0a]"
    >
      Edit Recipe
    </button>

    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        selectedRecipe && toggleFavorite(selectedRecipe.id);
      }}
      className="rounded-full border border-[#a63a0a] px-4 py-2 text-[#a63a0a]"
    >
      {selectedRecipe?.isFavorite ? "★ Favorite" : "☆ Favorite"}
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
      className="rounded-full bg-[#a63a0a] px-6 py-3 text-white"
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
      className="rounded-full border border-[#a63a0a] px-6 py-3 text-[#a63a0a]"
    >
      Cancel Editing
    </button>
  </>
)}
</div>
</div>


            {isEditingRecipe && selectedRecipe && (
  <div className="mb-8 rounded-3xl bg-[#fff4ef] p-6">
    <h2 className="mb-5 text-2xl font-bold">Edit Recipe</h2>

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
      placeholder="4 servings"
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
    </select>

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
  </div>
)}
{!isEditingRecipe && (
  <>
            <div className="mb-8 flex flex-wrap gap-3">
              <button
                onClick={() => addToShoppingList(selectedRecipe)}
                className="rounded-full bg-[#a63a0a] px-6 py-3 text-white"
              >
                Add Ingredients to Shopping List
              </button>

              <button
                onClick={() => deleteRecipe(selectedRecipe.id)}
                className="rounded-full border border-[#a63a0a] px-6 py-3 text-[#a63a0a]"
              >
                Delete Recipe
              </button>
            </div>

            <div className="mb-8 w-full rounded-3xl bg-[#f8efe6] p-6">
              <h2 className="mb-2 text-xl font-bold">Plan This Recipe</h2>

<p className="mb-4 text-sm text-[#6d5549]">
  Already know when you're making it? Add it to your meal plan.
</p>
<button
  onClick={() => togglePlanningQueue(selectedRecipe.id)}
  className="mb-4 rounded-full border border-[#a63a0a] px-5 py-2 text-[#a63a0a]"
>
  {selectedRecipe.isPlanningQueue
    ? "− Remove from Planning Queue"
    : "+ Add to Planning Queue"}
</button>
              <div className="mb-4 grid gap-3 md:grid-cols-2">
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="rounded-full border border-[#ead7c8] bg-white px-4 py-3"
                >
                  {plannerDays.map((day: { label: string; date: string }) => (
  <option key={day.date} value={day.date}>
    {day.label}
  </option>
))}
                </select>

                <select
                  value={selectedMeal}
                  onChange={(e) => setSelectedMeal(e.target.value)}
                  className="rounded-full border border-[#ead7c8] bg-white px-4 py-3"
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
                className="rounded-full bg-[#a63a0a] px-6 py-3 text-white"
              >
                Add to {selectedDay} {selectedMeal}
              </button>
            </div>

            {selectedRecipe.sourceUrl && (
              <a
                href={selectedRecipe.sourceUrl}
                target="_blank"
                className="mb-8 block text-sm text-[#a63a0a] underline"
              >
                View original recipe
              </a>
            )}

          

<div className="mb-8 space-y-3">
  {selectedRecipe.ingredients.map((ingredient) => (
    <label key={ingredient} className="flex items-center gap-3">
      <input type="checkbox" className="h-5 w-5" />
      <span>{ingredient}</span>
    </label>
  ))}
</div>

<h2 className="mb-4 text-2xl font-bold">Steps</h2>

<ol className="space-y-3">
  {selectedRecipe.steps.map((step, index) => (
    <li key={`${step}-${index}`} className="rounded-2xl bg-[#f8efe6] p-4">
      <strong>Step {index + 1}:</strong> {step}
    </li>
  ))}
</ol>
  </>
)}
          </div>
        </section>
        <BottomNav />
      </main>
    );
  }

  return (
  <main className="min-h-screen bg-[#f8efe6] px-5 py-6 text-[#2b1a12] md:p-8">
    <section className="mx-auto max-w-6xl py-6 md:px-6 md:py-10">
       <nav className="relative mb-8 flex items-start justify-between gap-3">
  <div className="flex flex-col">
  <button
    onClick={goHome}
    className="text-3xl font-bold text-[#a63a0a]"
  >
    Hey Chef!
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
    alert(
      "Install Hey Chef:\n\nOn iPhone: tap Share, then Add to Home Screen.\n\nOn Android: tap the browser menu, then Install App or Add to Home Screen."
    );
  }}
  className="block w-full rounded-xl px-4 py-3 text-left hover:bg-[#fff4ef]"
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
    alert(
      "Install Hey Chef:\n\nOn iPhone: tap Share, then Add to Home Screen.\n\nOn Android: tap the browser menu, then Install App or Add to Home Screen."
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
  <section className="mb-8">
    <p className="mb-3 text-sm uppercase tracking-[0.3em] text-[#a63a0a]">
      {getGreeting()}
    </p>

    <h1 className="mb-3 text-4xl font-bold leading-tight md:text-6xl">
      {displayName || "Chef"}
    </h1>

    <p className="mb-6 text-lg text-[#6d5549]">
      What's on the menu today?
    </p>
    <div className="mb-6 grid w-full gap-3 md:w-auto md:grid-cols-2">
      <button
        onClick={() => setShowImport(true)}
        className="rounded-full bg-[#a63a0a] px-6 py-3 text-white shadow-lg"
      >
        Import Recipe
      </button>

      

      <button
        onClick={() => setShowAllRecipes(true)}
        className="rounded-full bg-white px-6 py-3 text-[#a63a0a] shadow"
      >
        View Recipes
      </button>
    </div>
    {showImport && (
  <section className="rounded-3xl bg-white p-6 shadow-lg">
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

    <div className="my-5 flex items-center gap-4">
      <div className="h-px flex-1 bg-[#ead7c8]" />
      <span className="text-sm text-[#6d5549]">OR</span>
      <div className="h-px flex-1 bg-[#ead7c8]" />
    </div>

    <button
      onClick={createNewRecipe}
      className="w-full rounded-full border border-[#a63a0a] px-6 py-3 text-[#a63a0a]"
    >
      + New Recipe
    </button>

    {importError && <p className="mt-4 text-sm text-red-700">{importError}</p>}

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
          placeholder={`Lemon Texas Sheet Cake

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
  {showTomorrow ? "Tomorrow" : "Today"}
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
  onClick={() => setSelectedRecipe(recipe)}
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

    <h2 className="mb-5 text-3xl font-bold">This week</h2>

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
      <BottomNav />
    </main>
  );
}