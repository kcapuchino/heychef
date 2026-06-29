"use client";

import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { loadMealPlan } from "@/Archive/lib/heyChefActions";
import { getWeekStartDate } from "@/Archive/lib/helpers";
import type { PlannedRecipe, Recipe } from "../types/heychef";
import { supabase } from "@/Archive/lib/supabase";

type PantryItem = {
  id: string;
  name: string;
  quantity: string;
};

const placeholderImage =
  "https://placehold.co/1200x800/f8efe6/a63a0a?text=Hey+Chef";

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [showFoodImport, setShowFoodImport] = useState(false);
  const [recipeUrl, setRecipeUrl] = useState("");
  const [manualRecipe, setManualRecipe] = useState("");
  const [isImporting] = useState(false);
  const [importError] = useState("");
  const [showManualImport] = useState(false);
  const [foodUrl, setFoodUrl] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [foodTypeFilter, setFoodTypeFilter] =
    useState<"all" | "recipe" | "grocery">("all");
  const [recipeSort, setRecipeSort] = useState("newest");
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);

  useEffect(() => {
  async function fetchRecipes() {
    try {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mappedRecipes = (data || []).map((recipe) => ({
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
        price: recipe.price || "",
      }));

      setRecipes(mappedRecipes);
    } catch (error: any) {
      console.error(error);
    }
  }

  fetchRecipes();
}, []);

  const filteredRecipes = recipes
  .filter((recipe) => {
    if (foodTypeFilter === "recipe") {
      return recipe.type !== "grocery";
    }

    if (foodTypeFilter === "grocery") {
      return recipe.type === "grocery";
    }

    return true;
  })
  .filter((recipe) => {
    if (recipeSort === "ready") {
      return canMakeRecipeFromPantry(recipe);
    }

    return true;
  });

function importRecipe() {}
function importManualRecipe() {}
function createNewRecipe() {}
function importFoodItem() {}
function saveFoodItem() {}

function toggleFavorite(recipeId: string) {
  setRecipes((current) =>
    current.map((recipe) =>
      recipe.id === recipeId
        ? { ...recipe, isFavorite: !recipe.isFavorite }
        : recipe
    )
  );
}

function normalizeItemName(text?: string | null) {
  return String(text || "").toLowerCase().trim();
}

function getMatchingPantryItem(name: string) {
  return pantryItems.find(
    (item) => normalizeItemName(item.name) === normalizeItemName(name)
  );
}

function canMakeRecipeFromPantry(recipe: Recipe) {
  if (recipe.type === "grocery") {
    return Number(getMatchingPantryItem(recipe.title)?.quantity || 0) > 0;
  }

  return false;
}

  return (
    <AppShell>
      <section className="mb-8 rounded-[2rem] border border-[#ead7c8] bg-[#fffaf5] p-6 shadow-sm md:p-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-4xl font-bold md:text-5xl">Food Library</h1>

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

          {importError && <p className="mt-4 text-sm text-red-700">{importError}</p>}

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

              <textarea
                value={manualRecipe}
                onChange={(e) => setManualRecipe(e.target.value)}
                rows={12}
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
    foodTypeFilter === "all" && recipeSort !== "ready"
      ? "bg-[#a63a0a] text-white"
      : "bg-[#fff4ef] text-[#a63a0a]"
  }`}
>
  All
</button>

<button
  onClick={() => {
    setFoodTypeFilter("recipe");
    setRecipeSort("newest");
  }}
  className={`rounded-full px-4 py-2 font-bold ${
    foodTypeFilter === "recipe" && recipeSort !== "ready"
      ? "bg-[#a63a0a] text-white"
      : "bg-[#fff4ef] text-[#a63a0a]"
  }`}
>
  Recipes
</button>

<button
  onClick={() => {
    setFoodTypeFilter("grocery");
    setRecipeSort("newest");
  }}
  className={`rounded-full px-4 py-2 font-bold ${
    foodTypeFilter === "grocery" && recipeSort !== "ready"
      ? "bg-[#a63a0a] text-white"
      : "bg-[#fff4ef] text-[#a63a0a]"
  }`}
>
  Go-To Foods
</button>

<button
  onClick={() => {
    setFoodTypeFilter("all");
    setRecipeSort("ready");
  }}
  className={`rounded-full px-4 py-2 font-bold ${
    recipeSort === "ready"
      ? "bg-[#315f25] text-white"
      : "bg-[#e8f6df] text-[#315f25]"
  }`}
>
  ✓ Ready
</button>
        </div>
      </section>

      {recipes.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 shadow">
          <p className="text-[#6d5549]">No recipes yet. Import your first recipe.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-3">
          {filteredRecipes.map((recipe) => (
            <div key={recipe.id} className="rounded-3xl bg-white p-5 shadow-sm">
              <img
                src={recipe.image || placeholderImage}
                alt={recipe.title}
                className="mb-4 h-36 w-full rounded-2xl object-cover"
              />

              <h3 className="text-lg font-bold">{recipe.title}</h3>

              <p className="mt-2 text-sm text-[#6d5549]">
                {recipe.ingredients.length} ingredients
              </p>

              <button
                onClick={() => toggleFavorite(recipe.id)}
                className="mt-4 rounded-full border border-[#a63a0a] px-4 py-2 text-sm text-[#a63a0a]"
              >
                {recipe.isFavorite ? "★ Favorite" : "☆ Favorite"}
              </button>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}