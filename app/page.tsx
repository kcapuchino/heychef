"use client";

import { useEffect, useState } from "react";

type Recipe = {
  id: string;
  title: string;
  image?: string;
  ingredients: string[];
  steps: string[];
  cookTime?: string;
  servings?: string;
  sourceUrl?: string;
  isFavorite?: boolean;
  createdAt: string;
};

type SavedUserData = {
  recipes: Recipe[];
  shoppingList: string[];
  mealPlan: Record<string, Recipe[]>;
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
  const [isEditingRecipe, setIsEditingRecipe] = useState(false);

  const favoriteRecipes = recipes.filter((recipe) => recipe.isFavorite);
  const homeRecipes = favoriteRecipes.length > 0 ? favoriteRecipes : recipes.slice(0, 3);
  const homeSectionTitle = favoriteRecipes.length > 0 ? "Favorite Recipes" : "Recent Recipes";

  useEffect(() => {
    const savedUser = localStorage.getItem("hey-chef-current-user");

    if (savedUser) {
      loadUser(savedUser);
    }
  }, []);

  useEffect(() => {
    if (!userEmail || !hasLoadedUser) return;

    const savedData: SavedUserData = {
      recipes,
      shoppingList,
      mealPlan,
    };

    localStorage.setItem(`hey-chef-data-${userEmail}`, JSON.stringify(savedData));
  }, [recipes, shoppingList, mealPlan, userEmail, hasLoadedUser]);

  function loadUser(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const savedData = localStorage.getItem(`hey-chef-data-${normalizedEmail}`);

    if (savedData) {
      const parsed: SavedUserData = JSON.parse(savedData);
      setRecipes(parsed.recipes || []);
      setShoppingList(parsed.shoppingList || []);
      setMealPlan(parsed.mealPlan || {});
      setPlannerRecipeId(parsed.recipes?.[0]?.id || "");
    } else {
      setRecipes([]);
      setShoppingList([]);
      setMealPlan({});
      setPlannerRecipeId("");
    }

    setUserEmail(normalizedEmail);
    localStorage.setItem("hey-chef-current-user", normalizedEmail);
    setHasLoadedUser(true);
  }

  function loginUser() {
    if (!loginEmail) return;
    loadUser(loginEmail);
    setLoginEmail("");
  }

  function logoutUser() {
    setUserEmail("");
    setHasLoadedUser(false);
    setRecipes([]);
    setShoppingList([]);
    setMealPlan({});
    setSelectedRecipe(null);
    setShowMealPlanner(false);
    setShowShoppingList(false);
    setShowAllRecipes(false);
    localStorage.removeItem("hey-chef-current-user");
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

      setRecipes([newRecipe, ...recipes]);
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

    addRecipeToMealPlan(plannerDay, plannerMeal, recipe);
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
function RecipeMeta({ recipe }: { recipe: Recipe }) {
  return (
    <div className="mt-2 flex flex-wrap gap-4 text-sm text-[#6d5549]">
      <span>⏱ {recipe.cookTime || "Time not listed"}</span>
      <span>👥 {recipe.servings || "Servings not listed"}</span>
    </div>
  );
}
  if (!userEmail) {
    return (
      <main className="min-h-screen bg-[#f8efe6] p-8 text-[#2b1a12]">
        <section className="mx-auto flex min-h-screen max-w-xl items-center">
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
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="you@example.com"
              className="mb-4 w-full rounded-full border border-[#ead7c8] px-5 py-3"
            />

            <button
              onClick={loginUser}
              className="w-full rounded-full bg-[#a63a0a] px-6 py-3 text-white"
            >
              Log In / Create Account
            </button>

            <p className="mt-4 text-sm text-[#6d5549]">
              Prototype note: this saves in this browser for now. Supabase will make it real across
              devices.
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (showShoppingList) {
    return (
      <main className="min-h-screen bg-[#f8efe6] p-8 text-[#2b1a12]">
        <section className="mx-auto max-w-6xl px-6 py-10">
  <nav className="mb-8 flex flex-wrap items-center justify-between gap-3">
    <div>
      <button
  onClick={() => {
    setSelectedRecipe(null);
    setShowMealPlanner(false);
    setShowShoppingList(false);
    setShowAllRecipes(false);
  }}
  className="text-2xl font-bold text-[#a63a0a]"
>
  Hey Chef!
</button>
      <p className="text-sm text-[#6d5549]">Logged in as {userEmail}</p>
    </div>

    <div className="flex flex-wrap gap-3">
  <button
    onClick={() => {
      setSelectedRecipe(null);
      setShowShoppingList(false);
      setShowAllRecipes(false);
      setShowMealPlanner(true);
    }}
    className="rounded-full border border-[#a63a0a] px-5 py-2 text-sm text-[#a63a0a]"
  >
    Meal Planner
  </button>

  <button
    onClick={() => {
      setSelectedRecipe(null);
      setShowMealPlanner(false);
      setShowAllRecipes(false);
      setShowShoppingList(true);
    }}
    className="rounded-full border border-[#a63a0a] px-5 py-2 text-sm text-[#a63a0a]"
  >
    Shopping List ({shoppingList.length})
  </button>

  <button
    onClick={logoutUser}
    className="rounded-full bg-white px-5 py-2 text-sm text-[#a63a0a]"
  >
    Log Out
  </button>
</div>
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

          <div className="mb-6 flex items-center justify-between">
  <h1 className="text-5xl font-bold">Shopping List</h1>

  <button
    onClick={() => {
      if (confirm("Clear your shopping list?")) {
        setShoppingList([]);
      }
    }}
    className="rounded-full bg-[#fff4ef] px-5 py-2 text-sm text-[#a63a0a]"
  >
    🗑 Clear List
  </button>
</div>

          <div className="rounded-3xl bg-white p-6 shadow">
            {shoppingList.length === 0 ? (
              <p className="text-[#6d5549]">Your shopping list is empty.</p>
            ) : (
              <div className="space-y-3">
                {shoppingList.map((item) => (
                  <div key={item} className="flex items-center justify-between gap-3">
                    <label className="flex items-center gap-3">
                      <input type="checkbox" className="h-5 w-5" />
                      <span>{item}</span>
                    </label>

                    <button onClick={() => removeShoppingItem(item)} className="text-sm text-[#a63a0a]">
                      Remove
                    </button>
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
      <main className="min-h-screen bg-[#f8efe6] p-8 text-[#2b1a12]">
        <section className="mx-auto max-w-6xl px-6 py-10">
  <nav className="mb-8 flex flex-wrap items-center justify-between gap-3">
    <div>
      <button
  onClick={() => {
    setSelectedRecipe(null);
    setShowMealPlanner(false);
    setShowShoppingList(false);
    setShowAllRecipes(false);
  }}
  className="text-2xl font-bold text-[#a63a0a]"
>
  Hey Chef!
</button>
      <p className="text-sm text-[#6d5549]">Logged in as {userEmail}</p>
    </div>

    <div className="flex flex-wrap gap-3">
      <button
        onClick={() => {
          setSelectedRecipe(null);
          setShowMealPlanner(true);
        }}
        className="rounded-full border border-[#a63a0a] px-5 py-2 text-sm text-[#a63a0a]"
      >
        Meal Planner
      </button>

      <button
        onClick={() => {
          setSelectedRecipe(null);
          setShowShoppingList(true);
        }}
        className="rounded-full border border-[#a63a0a] px-5 py-2 text-sm text-[#a63a0a]"
      >
        Shopping List ({shoppingList.length})
      </button>

      <button onClick={logoutUser} className="rounded-full bg-white px-5 py-2 text-sm text-[#a63a0a]">
        Log Out
      </button>
    </div>
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
              <h1 className="text-5xl font-bold">Weekly Meal Planner</h1>
              <p className="mt-2 text-[#6d5549]">Add up to 3 recipes per meal slot. Resets Weekly</p>
            </div>

            <button
              onClick={addMealPlanToShoppingList}
              className="rounded-full bg-[#a63a0a] px-6 py-3 text-white"
            >
              Add Week to Shopping List
            </button>
          </div>

          <section className="mb-8 rounded-3xl bg-white p-6 shadow">
            <h2 className="mb-4 text-2xl font-bold">Add a Recipe to Your Week</h2>

            {recipes.length === 0 ? (
              <p className="text-[#6d5549]">Import a recipe first, then add it to your week.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-4">
                <select
                  value={plannerRecipeId}
                  onChange={(e) => setPlannerRecipeId(e.target.value)}
                  className="rounded-full border border-[#ead7c8] bg-white px-4 py-3"
                >
                  {recipes.map((recipe) => (
                    <option key={recipe.id} value={recipe.id}>
                      {recipe.title}
                    </option>
                  ))}
                </select>

                <select
                  value={plannerDay}
                  onChange={(e) => setPlannerDay(e.target.value)}
                  className="rounded-full border border-[#ead7c8] bg-white px-4 py-3"
                >
                  {days.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>

                <select
                  value={plannerMeal}
                  onChange={(e) => setPlannerMeal(e.target.value)}
                  className="rounded-full border border-[#ead7c8] bg-white px-4 py-3"
                >
                  {meals.map((meal) => (
                    <option key={meal} value={meal}>
                      {meal}
                    </option>
                  ))}
                </select>

                <button
                  onClick={addRecipeFromPlanner}
                  className="rounded-full bg-[#a63a0a] px-6 py-3 text-white"
                >
                  Add
                </button>
              </div>
            )}
          </section>

          <div className="grid gap-4">
            {days.map((day) => (
              <div key={day} className="rounded-3xl bg-white p-5 shadow">
                <h2 className="mb-4 text-2xl font-bold text-[#a63a0a]">{day}</h2>

                <div className="grid gap-4 md:grid-cols-3">
                  {meals.map((meal) => {
                    const key = `${day}-${meal}`;
                    const plannedRecipes = mealPlan[key] || [];

                    return (
                      <div key={meal} className="rounded-2xl bg-[#f8efe6] p-4">
                        <h3 className="mb-3 font-bold">{meal}</h3>

                        {plannedRecipes.length === 0 ? (
                          <p className="text-sm text-[#6d5549]">No recipes added.</p>
                        ) : (
                          <div className="space-y-2">
                            {plannedRecipes.map((recipe) => (
                              <div
                                key={recipe.id}
                                className="flex items-center justify-between rounded-xl bg-white p-3 text-sm"
                              >
                                <span>{recipe.title}</span>
                                <button
                                  onClick={() => removeRecipeFromMealPlan(day, meal, recipe.id)}
                                  className="text-[#a63a0a]"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
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

  if (showAllRecipes) {
  return (
    <main className="min-h-screen bg-[#f8efe6] p-8 text-[#2b1a12]">
      <section className="mx-auto max-w-6xl px-6 py-10">
        <nav className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <button
              onClick={() => {
                setSelectedRecipe(null);
                setShowMealPlanner(false);
                setShowShoppingList(false);
                setShowAllRecipes(false);
              }}
              className="text-2xl font-bold text-[#a63a0a]"
            >
              Hey Chef!
            </button>
            <p className="text-sm text-[#6d5549]">Logged in as {userEmail}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                setSelectedRecipe(null);
                setShowShoppingList(false);
                setShowAllRecipes(false);
                setShowMealPlanner(true);
              }}
              className="rounded-full border border-[#a63a0a] px-5 py-2 text-sm text-[#a63a0a]"
            >
              Meal Planner
            </button>

            <button
              onClick={() => {
                setSelectedRecipe(null);
                setShowMealPlanner(false);
                setShowAllRecipes(false);
                setShowShoppingList(true);
              }}
              className="rounded-full border border-[#a63a0a] px-5 py-2 text-sm text-[#a63a0a]"
            >
              Shopping List ({shoppingList.length})
            </button>

            <button
              onClick={logoutUser}
              className="rounded-full bg-white px-5 py-2 text-sm text-[#a63a0a]"
            >
              Log Out
            </button>
          </div>
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

          <button
            onClick={() => setShowImport(!showImport)}
            className="rounded-full bg-[#a63a0a] px-6 py-3 text-white shadow"
          >
            {showImport ? "Close Import" : "Import Recipe"}
          </button>
        </div>

        <h1 className="mb-6 text-5xl font-bold">All Recipes</h1>

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
            {recipes.map((recipe) => (
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
      <main className="min-h-screen bg-[#f8efe6] p-8 text-[#2b1a12]">
        <section className="mx-auto max-w-6xl px-6 py-10">
  <nav className="mb-8 flex flex-wrap items-center justify-between gap-3">
    <div>
      <button
  onClick={() => {
    setSelectedRecipe(null);
    setShowMealPlanner(false);
    setShowShoppingList(false);
    setShowAllRecipes(false);
  }}
  className="text-2xl font-bold text-[#a63a0a]"
>
  Hey Chef!
</button>
      <p className="text-sm text-[#6d5549]">Logged in as {userEmail}</p>
    </div>

    <div className="flex flex-wrap gap-3">
      <button
        onClick={() => {
          setSelectedRecipe(null);
          setShowMealPlanner(true);
        }}
        className="rounded-full border border-[#a63a0a] px-5 py-2 text-sm text-[#a63a0a]"
      >
        Meal Planner
      </button>

      <button
        onClick={() => {
          setSelectedRecipe(null);
          setShowShoppingList(true);
        }}
        className="rounded-full border border-[#a63a0a] px-5 py-2 text-sm text-[#a63a0a]"
      >
        Shopping List ({shoppingList.length})
      </button>

      <button onClick={logoutUser} className="rounded-full bg-white px-5 py-2 text-sm text-[#a63a0a]">
        Log Out
      </button>
    </div>
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

          <div className="rounded-[2rem] bg-white p-6 shadow-xl">
            <img
  src={selectedRecipe.image || placeholderImage}
  alt={selectedRecipe.title}
  className="mb-6 h-60 w-full rounded-[1.5rem] object-cover"
/>

            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h1 className="mb-2 text-4xl font-bold">{selectedRecipe.title}</h1>
                <RecipeMeta recipe={selectedRecipe} />
              </div>

              <div className="flex flex-wrap gap-3">
  

  <div className="flex gap-3">
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
  {isEditingRecipe && (
  <div className="mb-8 rounded-3xl bg-[#f8efe6] p-5">
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

    <label className="mb-2 block font-bold">Ingredients</label>
    <textarea
      value={selectedRecipe.ingredients.join("\n")}
      onChange={(e) =>
        updateSelectedRecipe({
          ...selectedRecipe,
          ingredients: e.target.value.split("\n").filter(Boolean),
        })
      }
      rows={8}
      className="mb-4 w-full rounded-xl border border-[#ead7c8] p-3"
    />

    <label className="mb-2 block font-bold">Steps</label>
    <textarea
      value={selectedRecipe.steps.join("\n")}
      onChange={(e) =>
        updateSelectedRecipe({
          ...selectedRecipe,
          steps: e.target.value.split("\n").filter(Boolean),
        })
      }
      rows={10}
      className="w-full rounded-xl border border-[#ead7c8] p-3"
    />
  </div>
)}
</div>
</div>
            </div>

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

            <div className="mb-8 rounded-3xl bg-[#f8efe6] p-5">
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

            <h2 className="mb-4 text-2xl font-bold">Ingredients</h2>

{isEditingRecipe ? (
  <textarea
    value={selectedRecipe.ingredients.join("\n")}
    onChange={(e) =>
      updateSelectedRecipe({
        ...selectedRecipe,
        ingredients: e.target.value
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
      })
    }
    rows={8}
    className="mb-8 w-full rounded-2xl border border-[#ead7c8] p-4"
  />
) : (
  <div className="mb-8 space-y-3">
    {selectedRecipe.ingredients.map((ingredient) => (
      <label key={ingredient} className="flex items-center gap-3">
        <input type="checkbox" className="h-5 w-5" />
        <span>{ingredient}</span>
      </label>
    ))}
  </div>
)}

            <h2 className="mb-4 text-2xl font-bold">Steps</h2>

{isEditingRecipe ? (
  <textarea
    value={selectedRecipe.steps.join("\n")}
    onChange={(e) =>
      updateSelectedRecipe({
        ...selectedRecipe,
        steps: e.target.value
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
      })
    }
    rows={10}
    className="w-full rounded-2xl border border-[#ead7c8] p-4"
  />
) : (
  <ol className="space-y-3">
    {selectedRecipe.steps.map((step, index) => (
      <li key={`${step}-${index}`} className="rounded-2xl bg-[#f8efe6] p-4">
        <strong>Step {index + 1}:</strong> {step}
      </li>
    ))}
  </ol>
)}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8efe6] text-[#2b1a12]">
      <section className="mx-auto max-w-6xl px-6 py-10">
        <nav className="mb-12 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-2xl font-bold text-[#a63a0a]">Hey Chef!</div>
            <p className="text-sm text-[#6d5549]">Logged in as {userEmail}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowMealPlanner(true)}
              className="rounded-full border border-[#a63a0a] px-5 py-2 text-sm text-[#a63a0a]"
            >
              Meal Planner
            </button>

            <button
              onClick={() => setShowShoppingList(true)}
              className="rounded-full border border-[#a63a0a] px-5 py-2 text-sm text-[#a63a0a]"
            >
              Shopping List ({shoppingList.length})
            </button>

            <button onClick={logoutUser} className="rounded-full bg-white px-5 py-2 text-sm text-[#a63a0a]">
              Log Out
            </button>
          </div>
        </nav>

        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-3 text-sm uppercase tracking-[0.3em] text-[#a63a0a]">
              What’s for dinner?
            </p>

            <h1 className="mb-5 text-5xl font-bold leading-tight md:text-7xl">
              Save recipes from anywhere.
            </h1>

            <p className="mb-8 text-lg text-[#6d5549]">
              Import recipes, clean up the clutter, plan your week, and build your shopping list in
              one place.
            </p>

            <div className="flex flex-wrap gap-3">
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

          <div className="rounded-[2rem] bg-white p-4 shadow-2xl">
            <div className="h-80 rounded-[1.5rem] bg-[url('https://images.unsplash.com/photo-1495521821757-a1efb6729352?q=80&w=1200&auto=format&fit=crop')] bg-cover bg-center" />
          </div>
        </div>

        {showImport && (
          <section className="mt-10 rounded-3xl bg-white p-6 shadow-lg">
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

        <section id="recipes" className="mt-14">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">{homeSectionTitle}</h2>
              <p className="text-sm text-[#6d5549]">
                Star up to 3 recipes to feature them here. If none are starred, your 3 most recent
                recipes show.
              </p>
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