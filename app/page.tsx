"use client";

import { useEffect, useState } from "react";
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
  createdAt: string;
};

type PantryItem = {
  id: string;
  name: string;
  quantity: string;
  category: string;
  createdAt: string;
};

type SavedUserData = {
  recipes: Recipe[];
  shoppingList: string[];
  mealPlan: Record<string, Recipe[]>;
  pantryItems: PantryItem[];
};

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const meals = ["Breakfast", "Lunch", "Dinner"];
const placeholderImage = "https://placehold.co/1200x800/f8efe6/a63a0a?text=Hey+Chef";

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
  const [loginEmail, setLoginEmail] = useState("");
  const [hasLoadedUser, setHasLoadedUser] = useState(false);

  const [showImport, setShowImport] = useState(false);
  const [recipeUrl, setRecipeUrl] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showAllRecipes, setShowAllRecipes] = useState(false);

  const [shoppingList, setShoppingList] = useState<string[]>([]);
  const [showShoppingList, setShowShoppingList] = useState(false);

  const [showMealPlanner, setShowMealPlanner] = useState(false);
  const [mealPlan, setMealPlan] = useState<Record<string, Recipe[]>>({});

  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [showManualImport, setShowManualImport] = useState(false);
  const [manualRecipe, setManualRecipe] = useState("");

  const [selectedDay, setSelectedDay] = useState("Monday");
  const [selectedMeal, setSelectedMeal] = useState("Dinner");
  const [plannerDay, setPlannerDay] = useState("Monday");
  const [plannerMeal, setPlannerMeal] = useState("Dinner");
  const [plannerRecipeId, setPlannerRecipeId] = useState("");
  const [plannerPopup, setPlannerPopup] = useState<{
  day: string;
  meal: string;
} | null>(null);
  const [isEditingRecipe, setIsEditingRecipe] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
const [recipeSort, setRecipeSort] = useState("newest");

  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [hidePantryItems, setHidePantryItems] = useState(true);
  const [newShoppingItem, setNewShoppingItem] = useState("");
  const [newPantryItem, setNewPantryItem] = useState("");
  const [newPantryQuantity, setNewPantryQuantity] = useState("");
const [newPantryCategory, setNewPantryCategory] = useState("Other");
const [shoppingSort, setShoppingSort] = useState("az");
const [showPantry, setShowPantry] = useState(false);
const [pantryCategoryFilter, setPantryCategoryFilter] = useState("all");
const [pantrySort, setPantrySort] = useState("az");

const [loginPassword, setLoginPassword] = useState("");
const [authMode, setAuthMode] = useState<"login" | "signup">("login");
const [authError, setAuthError] = useState("");

  const favoriteRecipes = recipes.filter((recipe) => recipe.isFavorite);
  const homeRecipes = favoriteRecipes.length > 0 ? favoriteRecipes : recipes.slice(0, 3);
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

    return (
      new Date(a.createdAt).getTime() -
      new Date(b.createdAt).getTime()
    );
  });

  const totalSlots = 21;

const filledSlots = Object.values(mealPlan).filter(
  (recipes) => recipes.length > 0
).length;

const plannerPercent = Math.round(
  (filledSlots / totalSlots) * 100
);

  useEffect(() => {
    const savedUser = localStorage.getItem("hey-chef-current-user");

    if (savedUser) {
      loadUser(savedUser);
    }
  }, []);

  useEffect(() => {
  async function loadSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user?.email) {
      setUserEmail(session.user.email);
      setHasLoadedUser(true);
    }
  }

  loadSession();
}, []);

  useEffect(() => {
    if (!userEmail || !hasLoadedUser) return;

    const savedData: SavedUserData = {
  recipes,
  shoppingList,
  mealPlan,
  pantryItems,
};

    localStorage.setItem(`hey-chef-data-${userEmail}`, JSON.stringify(savedData));
  }, [recipes, shoppingList, mealPlan, pantryItems, userEmail, hasLoadedUser]);
  useEffect(() => {
  setIsMenuOpen(false);
}, [
  selectedRecipe,
  showAllRecipes,
  showMealPlanner,
  showShoppingList,
  showImport,
]);

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

  async function loginUser() {
  setAuthError("");

  if (!loginEmail || !loginPassword) {
    setAuthError("Enter your email and password.");
    return;
  }

  const email = loginEmail.trim().toLowerCase();

  const { error } =
    authMode === "signup"
      ? await supabase.auth.signUp({
          email,
          password: loginPassword,
        })
      : await supabase.auth.signInWithPassword({
          email,
          password: loginPassword,
        });

  if (error) {
    setAuthError(error.message);
    return;
  }

  setUserEmail(email);
  setLoginEmail("");
  setLoginPassword("");
  setHasLoadedUser(true);
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
    id: crypto.randomUUID(),
    title: "New Recipe",
    image: "",
    ingredients: [],
    steps: [],
    cookTime: "",
    servings: "",
    sourceUrl: "",
    isFavorite: false,
    createdAt: new Date().toISOString(),
  };

  setRecipes([newRecipe, ...recipes]);
  setSelectedRecipe(newRecipe);
  setIsEditingRecipe(true);
  setShowAllRecipes(false);
  setShowImport(false);
  setShowMealPlanner(false);
  setShowShoppingList(false);
}

  async function importRecipe() {
    if (!recipeUrl) return;

    setIsImporting(true);
    setImportError("");
    setShowManualImport(false);

    try {
      const response = await fetch("/api/import-recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: recipeUrl }),
      });

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        setImportError(
          "The import route is not returning JSON. Check app/api/import-recipe/route.ts and restart npm."
        );
        setShowManualImport(true);
        return;
      }

      if (!response.ok) {
        setImportError(data.error || "Could not import this recipe.");
        setShowManualImport(true);
        return;
      }

      const newRecipe: Recipe = {
  id: crypto.randomUUID(),
  title: data.title || "Imported Recipe",
  image: data.image || "",
  ingredients: data.ingredients || [],
  steps: data.steps || [],
  cookTime: data.cookTime || "",
  servings: data.servings || "",
  sourceUrl: data.sourceUrl || recipeUrl,
  isFavorite: false,
  createdAt: new Date().toISOString(),
};

      if (selectedRecipe && isEditingRecipe) {
  updateSelectedRecipe({
    ...newRecipe,
    id: selectedRecipe.id,
    isFavorite: selectedRecipe.isFavorite,
    createdAt: selectedRecipe.createdAt,
  });

  setPlannerRecipeId(selectedRecipe.id);
} else {
  setRecipes([newRecipe, ...recipes]);
  setSelectedRecipe(newRecipe);
  setPlannerRecipeId(newRecipe.id);
}

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

  function importManualRecipe() {
    if (!manualRecipe) return;

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

    setRecipes([recipe, ...recipes]);
    setPlannerRecipeId(recipe.id);
    setManualRecipe("");
    setRecipeUrl("");
    setShowManualImport(false);
    setImportError("");
    setShowImport(false);
  }

  function toggleFavorite(recipeId: string) {
    const recipe = recipes.find((item) => item.id === recipeId);
    if (!recipe) return;

    const currentFavorites = recipes.filter((item) => item.isFavorite);

    if (!recipe.isFavorite && currentFavorites.length >= 3) {
      alert("You can favorite up to 3 recipes for your homepage.");
      return;
    }

    const updatedRecipes = recipes.map((item) =>
      item.id === recipeId ? { ...item, isFavorite: !item.isFavorite } : item
    );

    setRecipes(updatedRecipes);

    const updatedSelectedRecipe = updatedRecipes.find((item) => item.id === recipeId) || null;

    if (selectedRecipe?.id === recipeId) {
      setSelectedRecipe(updatedSelectedRecipe);
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

function addItemsToShoppingList(items: string[]) {
  const updated = [...shoppingList];

  items.forEach((item) => {
    const existingIndex = updated.findIndex(
      (existingItem) =>
        existingItem === item || existingItem.startsWith(`${item} ×`)
    );

    if (existingIndex >= 0) {
      const existingItem = updated[existingIndex];
      const match = existingItem.match(/×\s*(\d+)$/);

      if (match) {
        updated[existingIndex] = `${item} × ${Number(match[1]) + 1}`;
      } else {
        updated[existingIndex] = `${item} × 2`;
      }
    } else {
      updated.push(item);
    }
  });

  const sorted = [...updated].sort((a, b) =>
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

  function addNewMealPlanItemsToShoppingList() {
  const ingredientCounts: Record<string, number> = {};

  Object.values(mealPlan)
    .flat()
    .forEach((recipe) => {
      recipe.ingredients.forEach((ingredient) => {
        ingredientCounts[ingredient] = (ingredientCounts[ingredient] || 0) + 1;
      });
    });

  const updatedShoppingList = [...shoppingList];

  Object.entries(ingredientCounts).forEach(([ingredient, mealPlanCount]) => {
    const existingIndex = updatedShoppingList.findIndex(
      (item) => item === ingredient || item.startsWith(`${ingredient} ×`)
    );

    if (existingIndex >= 0) {
      if (mealPlanCount > 1) {
        updatedShoppingList[existingIndex] = `${ingredient} × ${mealPlanCount}`;
      } else {
        updatedShoppingList[existingIndex] = ingredient;
      }
    } else {
      updatedShoppingList.push(
        mealPlanCount > 1 ? `${ingredient} × ${mealPlanCount}` : ingredient
      );
    }
  });

  const sorted = updatedShoppingList.sort((a, b) =>
    cleanForSort(a).localeCompare(cleanForSort(b))
  );

  setShoppingList(sorted);
  alert("Shopping list updated from your meal plan.");
}

  function addRecipeToMealPlan(day: string, meal: string, recipe: Recipe) {
    const key = `${day}-${meal}`;
    const currentRecipes = mealPlan[key] || [];

    if (currentRecipes.length >= 3) {
      alert("Free plan allows up to 3 recipes per meal slot.");
      return;
    }

    setMealPlan({
      ...mealPlan,
      [key]: [...currentRecipes, recipe],
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

  function removeRecipeFromMealPlan(day: string, meal: string, recipeId: string) {
    const key = `${day}-${meal}`;
    const currentRecipes = mealPlan[key] || [];

    setMealPlan({
      ...mealPlan,
      [key]: currentRecipes.filter((recipe) => recipe.id !== recipeId),
    });
  }

  function deleteRecipe(recipeId: string) {
  setRecipes(recipes.filter((recipe) => recipe.id !== recipeId));

  const updatedMealPlan: Record<string, Recipe[]> = {};

  Object.entries(mealPlan).forEach(([key, plannedRecipes]) => {
    updatedMealPlan[key] = plannedRecipes.filter((recipe) => recipe.id !== recipeId);
  });

  setMealPlan(updatedMealPlan);
  setSelectedRecipe(null);
  setShowAllRecipes(true);
}

  function updateSelectedRecipe(updatedRecipe: Recipe) {
  const updatedRecipes = recipes.map((recipe) =>
    recipe.id === updatedRecipe.id ? updatedRecipe : recipe
  );

  setRecipes(updatedRecipes);
  setSelectedRecipe(updatedRecipe);
}

  function removeShoppingItem(item: string) {
    setShoppingList(shoppingList.filter((listItem) => listItem !== item));
  }

  function goHome() {
  setSelectedRecipe(null);
  setShowAllRecipes(false);
  setShowMealPlanner(false);
  setShowShoppingList(false);
  setShowPantry(false);
  setShowImport(false);
  setIsMenuOpen(false);
}

function isItemInPantry(shoppingItem: string) {
  return pantryItems.some((pantryItem) =>
    shoppingItem.toLowerCase().includes(
      pantryItem.name.toLowerCase()
    )
  );
}

function addShoppingItemToPantry(shoppingItem: string) {
  const newPantryItem: PantryItem = {
    id: crypto.randomUUID(),
    name: shoppingItem,
    quantity: "1",
    category: "Other",
    createdAt: new Date().toISOString(),
  };

  setPantryItems([newPantryItem, ...pantryItems]);
}

function goAllRecipes() {
  setSelectedRecipe(null);
  setShowMealPlanner(false);
  setShowShoppingList(false);
  setShowPantry(false);
  setShowAllRecipes(true);
  setShowImport(false);
  setIsMenuOpen(false);
}

function goMealPlanner() {
  setSelectedRecipe(null);
  setShowAllRecipes(false);
  setShowShoppingList(false);
  setShowPantry(false);
  setShowMealPlanner(true);
  setShowImport(false);
  setIsMenuOpen(false);
}

function goShoppingList() {
  setSelectedRecipe(null);
  setShowAllRecipes(false);
  setShowMealPlanner(false);
  setShowPantry(false);
  setShowShoppingList(true);
  setShowImport(false);
  setIsMenuOpen(false);
}

function goPantry() {
  setSelectedRecipe(null);
  setShowAllRecipes(false);
  setShowMealPlanner(false);
  setShowShoppingList(false);
  setShowPantry(true);
  setShowImport(false);
  setIsMenuOpen(false);
}
function RecipeMeta({ recipe }: { recipe: Recipe }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[#6d5549]">
      <span>⏱ {recipe.cookTime || "Time not listed"}</span>
      <span>👥 {recipe.servings || "Servings not listed"}</span>

      {recipe.category && (
        <span className="rounded-full bg-[#fff4ef] px-3 py-1 text-xs text-[#a63a0a]">
          {recipe.category}
        </span>
      )}
    </div>
  );
}
  if (!userEmail) {
    return (
      <main className="min-h-screen bg-[#f8efe6] px-4 py-6 text-[#2b1a12] md:p-8">
        <section className="mx-auto max-w-6xl px-0 py-6 md:px-6 md:py-10">
          <div className="w-full rounded-[2rem] bg-white p-8 shadow-xl">
            <p className="mb-3 text-sm uppercase tracking-[0.3em] text-[#a63a0a]">
              Hey Chef!
            </p>
            <h1 className="mb-4 text-5xl font-bold">Welcome back.</h1>
            <p className="mb-6 text-[#6d5549]">
              Log in with an email so recipes, favorites, meal plans, and shopping lists stay
              separate for each tester.
            </p>

            <input
  type="email"
  value={loginEmail}
  onChange={(e) => setLoginEmail(e.target.value)}
  placeholder="Email"
  className="mb-4 w-full rounded-full border border-[#ead7c8] px-5 py-3"
/>

<input
  type="password"
  value={loginPassword}
  onChange={(e) => setLoginPassword(e.target.value)}
  placeholder="Password"
  className="mb-4 w-full rounded-full border border-[#ead7c8] px-5 py-3"
/>

{authError && (
  <p className="mb-4 text-red-600">
    {authError}
  </p>
)}

<button
  onClick={loginUser}
  className="w-full rounded-full bg-[#a63a0a] px-6 py-3 text-white"
>
  {authMode === "signup" ? "Create Account" : "Log In"}
</button>

<button
  onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
  className="mt-4 w-full text-[#a63a0a]"
>
  {authMode === "login"
    ? "Need an account? Create one"
    : "Already have an account? Log in"}
</button>

          
          </div>
        </section>
      </main>
    );
  }

  if (showShoppingList) {
    return (
      <main className="min-h-screen bg-[#f8efe6] px-5 py-6 text-[#2b1a12] md:p-8">
      <section className="mx-auto max-w-6xl py-6 md:px-6 md:py-10">
  <nav className="relative mb-8 flex items-start justify-between gap-3">
  <div>
    <button
  onClick={goHome}
  className="text-3xl font-bold text-[#a63a0a]"
>
  Hey Chef!
</button>
    <p className="text-sm text-[#6d5549]">Logged in as {userEmail}</p>
  </div>

  <button
  onClick={() => setIsMenuOpen(!isMenuOpen)}
  className="rounded-full bg-white px-4 py-3 text-3xl text-[#a63a0a] shadow md:hidden"
>
  ☰
</button>

<div className="hidden md:flex items-center gap-10 text-lg">
  <button onClick={goAllRecipes} className="text-[#a63a0a]">
    Recipes
  </button>

  <button onClick={goMealPlanner} className="text-[#a63a0a]">
  Meal Planner ({filledSlots}/21)
</button>

  <button onClick={goShoppingList} className="text-[#a63a0a]">
  Shopping List ({shoppingList.length})
</button>

<button onClick={goPantry} className="text-[#a63a0a]">
  My Pantry
</button>


  <button onClick={logoutUser} className="text-[#a63a0a]">
    Log Out
  </button>
</div>

  {isMenuOpen && (
    <div className="absolute right-0 top-16 z-50 w-64 rounded-3xl bg-white p-4 shadow-xl">
      <button
        onClick={() => {
          setSelectedRecipe(null);
          setShowShoppingList(false);
          setShowAllRecipes(false);
          setShowMealPlanner(true);
          setIsMenuOpen(false);
        }}
        className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
      >
        📅 Meal Planner
      </button>

      <button
        onClick={() => {
          setSelectedRecipe(null);
          setShowMealPlanner(false);
          setShowAllRecipes(false);
          setShowShoppingList(true);
          setIsMenuOpen(false);
        }}
        className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
      >
        🛒 Shopping List ({shoppingList.length})
      </button>



      <button
        onClick={logoutUser}
        className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
      >
        ↪ Log Out
      </button>
    </div>
  )}
</nav>
          <button
  onClick={() => {
    setShowShoppingList(false);
    setShowAllRecipes(true);
  }}
  className="mb-6 text-[#a63a0a]"
>
  ← Back to All Recipes
</button>

          <div className="mb-8 flex items-start justify-between gap-3">
  <div>
    <h1 className="text-5xl font-bold">Shopping List</h1>

    <p className="mt-2 text-[#6d5549]">
      Review ingredients you need and move items into your pantry.
    </p>
  </div>

  <button
    onClick={() => {
      if (confirm("Clear your shopping list?")) {
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
    onClick={() => {
      if (!newShoppingItem.trim()) return;

      setShoppingList([...shoppingList, newShoppingItem.trim()]);
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
      {shoppingList
        .filter((item) => !hidePantryItems || !isItemInPantry(item))
        .sort((a, b) => {
          if (shoppingSort === "za") {
            return cleanForSort(b).localeCompare(cleanForSort(a));
          }

          return cleanForSort(a).localeCompare(cleanForSort(b));
        })
        .map((item) => (
          <div key={item} className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" className="h-5 w-5" />
              <span>{item}</span>
            </label>

            <div className="flex gap-3">
              {!isItemInPantry(item) && (
                <div className="flex gap-3">
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
    Remove
  </button>
</div>
              )}

          
            </div>
          </div>
        ))}
    </div>
  )}
</div>
        </section>
      </main>
    );
  }

  if (showMealPlanner) {
    return (
      <main className="min-h-screen bg-[#f8efe6] px-5 py-6 text-[#2b1a12] md:p-8">
        <section className="mx-auto max-w-6xl py-6 md:px-6 md:py-10">
  <nav className="relative mb-8 flex items-start justify-between gap-3">
  <div>
    <button
  onClick={goHome}
  className="text-3xl font-bold text-[#a63a0a]"
>
  Hey Chef!
</button>
    <p className="text-sm text-[#6d5549]">Logged in as {userEmail}</p>
  </div>

  <button
  onClick={() => setIsMenuOpen(!isMenuOpen)}
  className="rounded-full bg-white px-4 py-3 text-3xl text-[#a63a0a] shadow md:hidden"
>
  ☰
</button>

<div className="hidden md:flex items-center gap-10 text-lg">
  <button onClick={goAllRecipes} className="text-[#a63a0a]">
    Recipes
  </button>

  <button onClick={goMealPlanner} className="text-[#a63a0a]">
  Meal Planner ({filledSlots}/21)
</button>

  <button onClick={goShoppingList} className="text-[#a63a0a]">
  Shopping List ({shoppingList.length})
</button>

<button onClick={goPantry} className="text-[#a63a0a]">
  My Pantry
</button>

  

  <button onClick={logoutUser} className="text-[#a63a0a]">
    Log Out
  </button>
</div>

  {isMenuOpen && (
    <div className="absolute right-0 top-16 z-50 w-64 rounded-3xl bg-white p-4 shadow-xl">
      <button
  onClick={() => {
    setSelectedRecipe(null);
    setShowShoppingList(false);
    setShowAllRecipes(false);
    setShowMealPlanner(true);
    setIsMenuOpen(false);
  }}
  className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
>
  📅 Meal Planner ({filledSlots}/21)
</button>

      <button
        onClick={() => {
          setSelectedRecipe(null);
          setShowMealPlanner(false);
          setShowAllRecipes(false);
          setShowShoppingList(true);
          setIsMenuOpen(false);
        }}
        className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
      >
        🛒 Shopping List ({shoppingList.length})
      </button>

    

      <button
        onClick={logoutUser}
        className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
      >
        ↪ Log Out
      </button>
    </div>
  )}
</nav>
          <button
  onClick={() => {
    setShowMealPlanner(false);
    setShowAllRecipes(true);
  }}
  className="mb-6 text-[#a63a0a]"
>
  ← Back to All Recipes
</button>

          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
  <div>
    <h1 className="text-4xl font-bold md:text-5xl">Weekly Meal Planner</h1>
    <p className="mt-2 text-[#6d5549]">
      Add up to 3 recipes per meal slot. Resets Weekly
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
      onClick={() => {
        if (confirm("Clear your meal plan and start fresh?")) {
          setMealPlan({});
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
            {recipes.map((recipe) => (
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

<div className="grid gap-4">
  {days.map((day) => (
    <div
  key={day}
  className="rounded-3xl bg-white p-4 shadow md:p-5"
>
      <h2 className="mb-4 text-2xl font-bold text-[#a63a0a]">{day}</h2>

      <div className="grid gap-4 md:grid-cols-3">
        {meals.map((meal) => {
          const key = `${day}-${meal}`;
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
                    <div key={recipe.id} className="rounded-xl bg-white p-3 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <button
                          onClick={() => {
                            setSelectedRecipe(recipe);
                            setShowMealPlanner(false);
                          }}
                          className="text-left font-medium text-[#a63a0a] hover:underline"
                        >
                          {recipe.title}
                        </button>

                        <button
                          onClick={() => removeRecipeFromMealPlan(day, meal, recipe.id)}
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
                    setPlannerPopup({ day, meal });
                    setPlannerRecipeId(recipes[0]?.id || "");
                  }}
                  className="mt-4 w-full rounded-full bg-white px-4 py-3 text-sm font-semibold text-[#a63a0a] shadow-sm"
                >
                  + Add Recipe
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
    <main className="min-h-screen bg-[#f8efe6] px-5 py-6 text-[#2b1a12] md:p-8">
  <section className="mx-auto max-w-6xl py-6 md:px-6 md:py-10">
        <nav className="relative mb-8 flex items-start justify-between gap-3">
  <div>
    <button
      onClick={goHome}
      className="text-3xl font-bold text-[#a63a0a]"
    >
      Hey Chef!
    </button>

    <p className="text-sm text-[#6d5549]">
      Logged in as {userEmail}
    </p>
  </div>

  <button
    onClick={() => setIsMenuOpen(!isMenuOpen)}
    className="rounded-full bg-white px-4 py-3 text-3xl text-[#a63a0a] shadow md:hidden"
  >
    ☰
  </button>

  <div className="hidden md:flex items-center gap-10 text-lg">
    <button onClick={goAllRecipes} className="text-[#a63a0a]">
      Recipes
    </button>

    <button onClick={goMealPlanner} className="text-[#a63a0a]">
      Meal Planner ({filledSlots}/21)
    </button>

    <button onClick={goShoppingList} className="text-[#a63a0a]">
      Shopping List ({shoppingList.length})
    </button>

    <button onClick={goPantry} className="text-[#a63a0a]">
      My Pantry
    </button>

  

    <button onClick={logoutUser} className="text-[#a63a0a]">
      Log Out
    </button>
  </div>

  {isMenuOpen && (
    <div className="absolute right-0 top-16 z-50 w-64 rounded-3xl bg-white p-4 shadow-xl">
      <button
        onClick={goMealPlanner}
        className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
      >
        📅 Meal Planner ({filledSlots}/21)
      </button>

      <button
        onClick={goShoppingList}
        className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
      >
        🛒 Shopping List ({shoppingList.length})
      </button>

      <button
        onClick={goPantry}
        className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
      >
        🥫 My Pantry
      </button>

      

      <button
        onClick={logoutUser}
        className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
      >
        ↪ Log Out
      </button>
    </div>
  )}
</nav><button
  onClick={() => {
    setShowPantry(false);
    setShowAllRecipes(true);
  }}
  className="mb-6 text-[#a63a0a]"
>
  ← Back to Recipes
</button>
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
  <div>
  <h1 className="text-5xl font-bold">
    My Pantry
  </h1>

  <p className="mt-2 text-[#6d5549]">
    Track ingredients you already have on hand.
  </p>
<div className="mt-4 grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_auto]">
    <input
      value={newPantryItem}
      onChange={(e) => setNewPantryItem(e.target.value)}
      placeholder="Add pantry item"
      className="rounded-full border border-[#ead7c8] bg-white px-5 py-3"
    />

    <input
      value={newPantryQuantity}
      onChange={(e) => setNewPantryQuantity(e.target.value)}
      placeholder="Qty"
      className="rounded-full border border-[#ead7c8] bg-white px-5 py-3"
    />

    <select
      value={newPantryCategory}
      onChange={(e) => setNewPantryCategory(e.target.value)}
      className="rounded-full border border-[#ead7c8] bg-white px-5 py-3"
    >
      <option value="Dairy">Dairy</option>
            <option value="Produce">Produce</option>
            <option value="Dry Goods">Dry Goods</option>
            <option value="Baking">Baking</option>
            <option value="Frozen">Frozen</option>
            <option value="Other">Other</option>
    </select>

    <button
      onClick={() => {
        if (!newPantryItem.trim()) return;

        setPantryItems([
          {
            id: crypto.randomUUID(),
            name: newPantryItem.trim(),
            quantity: newPantryQuantity.trim() || "1",
            category: newPantryCategory,
            createdAt: new Date().toISOString(),
          },
          ...pantryItems,
        ]);

        setNewPantryItem("");
        setNewPantryQuantity("");
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
            <option value="Dairy">Dairy</option>
            <option value="Produce">Produce</option>
            <option value="Dry Goods">Dry Goods</option>
            <option value="Baking">Baking</option>
            <option value="Frozen">Frozen</option>
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
            {["Dairy", "Produce", "Dry Goods", "Baking", "Frozen", "Other"].map(
              (category) => {
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
                          <div className="grid gap-3 md:grid-cols-3">
                            <input
                              value={item.name}
                              onChange={(e) =>
                                setPantryItems(
                                  pantryItems.map((p) =>
                                    p.id === item.id
                                      ? { ...p, name: e.target.value }
                                      : p
                                  )
                                )
                              }
                              placeholder="Item"
                              className="rounded-xl border border-[#ead7c8] p-3"
                            />

                            <input
                              value={item.quantity}
                              onChange={(e) =>
                                setPantryItems(
                                  pantryItems.map((p) =>
                                    p.id === item.id
                                      ? { ...p, quantity: e.target.value }
                                      : p
                                  )
                                )
                              }
                              placeholder="Qty"
                              className="rounded-xl border border-[#ead7c8] p-3"
                            />

                    

                            <select
                              value={item.category}
                              onChange={(e) =>
                                setPantryItems(
                                  pantryItems.map((p) =>
                                    p.id === item.id
                                      ? { ...p, category: e.target.value }
                                      : p
                                  )
                                )
                              }
                              className="rounded-xl border border-[#ead7c8] bg-white p-3"
                            >
                              <option value="Dairy">Dairy</option>
                              <option value="Produce">Produce</option>
                              <option value="Dry Goods">Dry Goods</option>
                              <option value="Baking">Baking</option>
                              <option value="Frozen">Frozen</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>

                          <div className="mt-3 flex justify-end">
                            <button
                              onClick={() =>
                                setPantryItems(
                                  pantryItems.filter((p) => p.id !== item.id)
                                )
                              }
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
    </main>
  );
}
  if (showAllRecipes) {
  return (
    <main className="min-h-screen bg-[#f8efe6] px-5 py-6 text-[#2b1a12] md:p-8">
      <section className="mx-auto max-w-6xl py-6 md:px-6 md:py-10">
        <nav className="relative mb-8 flex items-start justify-between gap-3">
  <div>
    <button
  onClick={goHome}
  className="text-3xl font-bold text-[#a63a0a]"
>
  Hey Chef!
</button>
    <p className="text-sm text-[#6d5549]">Logged in as {userEmail}</p>
  </div>

  <button
  onClick={() => setIsMenuOpen(!isMenuOpen)}
  className="rounded-full bg-white px-4 py-3 text-3xl text-[#a63a0a] shadow md:hidden"
>
  ☰
</button>

<div className="hidden md:flex items-center gap-10 text-lg">
  <button onClick={goAllRecipes} className="text-[#a63a0a]">
    Recipes
  </button>

  <button onClick={goMealPlanner} className="text-[#a63a0a]">
  Meal Planner ({filledSlots}/21)
</button>

  <button onClick={goShoppingList} className="text-[#a63a0a]">
  Shopping List ({shoppingList.length})
</button>
<button onClick={goPantry} className="text-[#a63a0a]">
  My Pantry
</button>
 
  <button onClick={logoutUser} className="text-[#a63a0a]">
    Log Out
  </button>
</div>

  {isMenuOpen && (
    <div className="absolute right-0 top-16 z-50 w-64 rounded-3xl bg-white p-4 shadow-xl">
      
      <button
  onClick={goAllRecipes}
  className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
>
  🍳 Recipes
</button>

<button
  onClick={() => {
    setSelectedRecipe(null);
    setShowShoppingList(false);
    setShowAllRecipes(false);
    setShowMealPlanner(true);
    setIsMenuOpen(false);
  }}
  className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
>
  📅 Meal Planner ({filledSlots}/21)
</button>

<button
  onClick={() => {
    setSelectedRecipe(null);
    setShowMealPlanner(false);
    setShowAllRecipes(false);
    setShowShoppingList(true);
    setIsMenuOpen(false);
  }}
  className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
>
  🛒 Shopping List ({shoppingList.length})
</button>

<button
  onClick={goPantry}
  className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
>
  🥫 My Pantry
</button>

<button
  onClick={logoutUser}
  className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
>
  ↪ Log Out
</button>
    </div>
  )}
</nav>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => {
              setShowAllRecipes(false);
              setShowImport(false);
            }}
            className="text-[#a63a0a]"
          >
            ← Back Home
          </button>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
  <div>
    <h1 className="text-4xl font-bold md:text-5xl">All Recipes</h1>
    <p className="mt-2 text-[#6d5549]">
  Build your personal cookbook with recipes imported from anywhere or created from scratch.
    </p>
  </div>

  <div className="flex flex-wrap gap-3">
  <button
    onClick={() => setShowImport(true)}
    className="rounded-full bg-[#a63a0a] px-8 py-4 text-white"
  >
    Import Recipe
  </button>

  <button
    onClick={createNewRecipe}
    className="rounded-full bg-white px-8 py-4 text-[#a63a0a]"
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
    <option value="newest">Newest</option>
    <option value="oldest">Oldest</option>
    <option value="az">A–Z</option>
    <option value="za">Z–A</option>
  </select>
</div>

        {showImport && (
          <section className="mb-8 rounded-3xl bg-white p-6 shadow-lg">
            <h2 className="mb-3 text-2xl font-bold">Import a Recipe</h2>
            <p className="mb-4 text-[#6d5549]">
              Paste a recipe URL. Hey Chef will clean it into ingredients and steps.
            </p>

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
              <button
                key={recipe.id}
                onClick={() => {
                  setShowAllRecipes(false);
                  setSelectedRecipe(recipe);
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
                  <span>{recipe.isFavorite ? "★" : ""}</span>
                </div>

                <RecipeMeta recipe={recipe} />
                
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
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

  if (selectedRecipe) {
    return (
      <main className="min-h-screen bg-[#f8efe6] px-5 py-6 text-[#2b1a12] md:p-8">
       <section className="mx-auto max-w-6xl py-6 md:px-6 md:py-10">
  <nav className="relative mb-8 flex items-start justify-between gap-3">
  <div>
    <button
      onClick={goHome}
      className="text-3xl font-bold text-[#a63a0a]"
    >
      Hey Chef!
    </button>
    <p className="text-sm text-[#6d5549]">Logged in as {userEmail}</p>
  </div>

  <div className="hidden items-center gap-10 text-lg md:flex">
    <button onClick={goAllRecipes} className="text-[#a63a0a]">
      Recipes
    </button>

    <button onClick={goMealPlanner} className="text-[#a63a0a]">
  Meal Planner ({filledSlots}/21)
</button>

    <button onClick={goShoppingList} className="text-[#a63a0a]">
  Shopping List ({shoppingList.length})
</button>
<button onClick={goPantry} className="text-[#a63a0a]">
  My Pantry
</button>
    

    <button onClick={logoutUser} className="text-[#a63a0a]">
      Log Out
    </button>
  </div>

  <button
    onClick={() => setIsMenuOpen(!isMenuOpen)}
    className="rounded-full bg-white px-4 py-3 text-3xl text-[#a63a0a] shadow md:hidden"
  >
    ☰
  </button>

  {isMenuOpen && (
    <div className="absolute right-0 top-16 z-50 w-64 rounded-3xl bg-white p-4 shadow-xl md:hidden">
      <button
        onClick={goAllRecipes}
        className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
      >
        🍳 Recipes
      </button>

      <button
  onClick={() => {
    setSelectedRecipe(null);
    setShowShoppingList(false);
    setShowAllRecipes(false);
    setShowMealPlanner(true);
    setIsMenuOpen(false);
  }}
  className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
>
  📅 Meal Planner ({filledSlots}/21)
</button>

      <button
        onClick={goShoppingList}
        className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
      >
        🛒 Shopping List ({shoppingList.length})
      </button>

    

      <button
        onClick={logoutUser}
        className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
      >
        ↪ Log Out
      </button>
    </div>
  )}
</nav>

  <button
    onClick={() => {
      setSelectedRecipe(null);
      setShowAllRecipes(true);
    }}
    className="mb-6 text-[#a63a0a]"
  >
    ← Back to All Recipes
  </button>

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
    <button
      onClick={() => setIsEditingRecipe(!isEditingRecipe)}
      className="rounded-full bg-[#fff4ef] px-4 py-2 text-[#a63a0a]"
    >
      {isEditingRecipe ? "Done Editing" : "Edit Recipe"}
    </button>

    <button
      onClick={() => toggleFavorite(selectedRecipe.id)}
      className="rounded-full border border-[#a63a0a] px-4 py-2 text-[#a63a0a]"
    >
      {selectedRecipe.isFavorite ? "★ Favorite" : "☆ Favorite"}
    </button>
  </div>
</div>
            {isEditingRecipe && (
  <div className="mb-8 w-full rounded-3xl bg-[#f8efe6] p-6">
    <h2 className="mb-4 text-xl font-bold">Edit Recipe</h2>

    

    <label className="mb-2 block font-bold">Title</label>
    <input
      value={selectedRecipe.title}
      onChange={(e) =>
        updateSelectedRecipe({ ...selectedRecipe, title: e.target.value })
      }
      className="mb-4 w-full rounded-xl border border-[#ead7c8] p-3"
    />

    <label className="mb-2 block font-bold">Image URL</label>
    <input
      value={selectedRecipe.image || ""}
      onChange={(e) =>
        updateSelectedRecipe({ ...selectedRecipe, image: e.target.value })
      }
      className="mb-4 w-full rounded-xl border border-[#ead7c8] p-3"
    />

    <label className="mb-2 block font-bold">Cook Time</label>
    <input
      value={selectedRecipe.cookTime || ""}
      onChange={(e) =>
        updateSelectedRecipe({ ...selectedRecipe, cookTime: e.target.value })
      }
      placeholder="30 min"
      className="mb-4 w-full rounded-xl border border-[#ead7c8] p-3"
    />

    <label className="mb-2 block font-bold">Servings</label>
    <input
      value={selectedRecipe.servings || ""}
      onChange={(e) =>
        updateSelectedRecipe({ ...selectedRecipe, servings: e.target.value })
      }
      placeholder="4 servings"
      className="mb-4 w-full rounded-xl border border-[#ead7c8] p-3"
    />

    <label className="mb-2 block font-bold">Category</label>

<select
  value={selectedRecipe.category || ""}
  onChange={(e) =>
    updateSelectedRecipe({
      ...selectedRecipe,
      category: e.target.value,
    })
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
    updateSelectedRecipe({
      ...selectedRecipe,
      ingredients: e.target.value.split("\n"),
    })
  }
  rows={10}
  placeholder={`2 eggs
1 cup flour
1 tsp salt`}
  className="mb-4 min-h-[250px] w-full rounded-xl border border-[#ead7c8] p-3"
  enterKeyHint="enter"
/>

    <label className="mb-2 block font-bold">Steps</label>
    <textarea
  value={selectedRecipe.steps.join("\n")}
  onChange={(e) =>
    updateSelectedRecipe({
      ...selectedRecipe,
      steps: e.target.value.split("\n"),
    })
  }
  rows={12}
  placeholder={`Mix ingredients
Bake 25 minutes
Let cool`}
  className="min-h-[300px] w-full rounded-xl border border-[#ead7c8] p-3"
  enterKeyHint="enter"
/>
  </div>
)}

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
              <h2 className="mb-3 text-xl font-bold">Add to Meal Plan</h2>

              <div className="mb-4 grid gap-3 md:grid-cols-2">
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="rounded-full border border-[#ead7c8] bg-white px-4 py-3"
                >
                  {days.map((day) => (
                    <option key={day} value={day}>
                      {day}
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
          </div>
        </section>
      </main>
    );
  }

  return (
  <main className="min-h-screen bg-[#f8efe6] px-5 py-6 text-[#2b1a12] md:p-8">
    <section className="mx-auto max-w-6xl py-6 md:px-6 md:py-10">
       <nav className="relative mb-8 flex items-start justify-between gap-3">
  <div>
    <button
  onClick={goHome}
  className="text-3xl font-bold text-[#a63a0a]"
>
  Hey Chef!
</button>
    <p className="text-sm text-[#6d5549]">Logged in as {userEmail}</p>
  </div>

  <button
  onClick={() => setIsMenuOpen(!isMenuOpen)}
  className="rounded-full bg-white px-4 py-3 text-3xl text-[#a63a0a] shadow md:hidden"
>
  ☰
</button>

<div className="hidden md:flex items-center gap-10 text-lg">
  <button onClick={goAllRecipes} className="text-[#a63a0a]">
    Recipes
  </button>

  <button onClick={goMealPlanner} className="text-[#a63a0a]">
  Meal Planner ({filledSlots}/21)
</button>

  <button onClick={goShoppingList} className="text-[#a63a0a]">
  Shopping List ({shoppingList.length})
</button>
<button onClick={goPantry} className="text-[#a63a0a]">
  My Pantry
</button>


  <button onClick={logoutUser} className="text-[#a63a0a]">
    Log Out
  </button>
</div>

  {isMenuOpen && (
    <div className="absolute right-0 top-16 z-50 w-64 rounded-3xl bg-white p-4 shadow-xl">
      <button
  onClick={() => {
    setSelectedRecipe(null);
    setShowShoppingList(false);
    setShowAllRecipes(false);
    setShowMealPlanner(true);
    setIsMenuOpen(false);
  }}
  className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
>
  📅 Meal Planner ({filledSlots}/21)
</button>

      <button
        onClick={() => {
          setSelectedRecipe(null);
          setShowMealPlanner(false);
          setShowAllRecipes(false);
          setShowShoppingList(true);
          setIsMenuOpen(false);
        }}
        className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
      >
        🛒 Shopping List ({shoppingList.length})
      </button>
      <button
  onClick={goPantry}
  className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
>
  🥫 My Pantry
</button>

      

      <button
        onClick={logoutUser}
        className="block w-full rounded-2xl px-4 py-3 text-left text-[#2b1a12] hover:bg-[#fff4ef]"
      >
        ↪ Log Out
      </button>
    </div>
  )}
</nav>

        <div className="grid gap-10 md:grid-cols-2 md:items-center">
  {/* TEXT */}
  <div className="order-2 md:order-1">
    <p className="mb-3 text-sm uppercase tracking-[0.3em] text-[#a63a0a]">
      What’s for dinner?
    </p>

    <h1 className="mb-5 text-4xl font-bold leading-tight md:text-7xl">
      Save recipes from anywhere.
    </h1>

    <p className="mb-8 text-lg text-[#6d5549]">
      Import recipes, clean up the clutter, plan your week, and build your shopping list in
      one place.
    </p>
    



    <div className="grid w-full gap-3 md:w-auto md:grid-cols-2">
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
  </div>

  {/* IMAGE */}
  <div className="order-1 rounded-[2rem] bg-white p-5 shadow-2xl md:order-2">
    <div className="h-72 rounded-[1.5rem] bg-[url('https://images.unsplash.com/photo-1495521821757-a1efb6729352?q=80&w=1200&auto=format&fit=crop')] bg-cover bg-center md:h-80" />
  </div>
</div>

        {showImport && (
          <section className="mt-10 rounded-3xl bg-white p-6 shadow-lg">
            <h2 className="mb-3 text-2xl font-bold">Import a Recipe</h2>
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

        <section id="recipes" className="mt-14">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <div className="mb-6 flex items-center justify-between">
  <div>
    <h2 className="text-3xl font-bold">
      {homeSectionTitle}
    </h2>

    <p className="text-[#6d5549]">
      Star up to 3 recipes to feature them here.
    </p>
  </div>
</div>
            </div>
          </div>

          {recipes.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 shadow">
              <h3 className="mb-2 text-xl font-bold">No recipes yet.</h3>
              <p className="text-[#6d5549]">Import your first recipe to start building your library.</p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              {homeRecipes.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => setSelectedRecipe(recipe)}
                  className="rounded-3xl bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <img
  src={recipe.image || placeholderImage}
  alt={recipe.title}
  className="mb-4 h-36 w-full rounded-2xl object-cover"
/>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-bold">{recipe.title}</h3>
                    <span>{recipe.isFavorite ? "★" : ""}</span>
                  </div>

                  <RecipeMeta recipe={recipe} />
                </button>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}