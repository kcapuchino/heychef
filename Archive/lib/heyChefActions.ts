import { supabase } from "./supabase";
import type { Recipe, PantryItem, PlannedRecipe } from "../types/heychef";

export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

/* RECIPES */

export async function loadRecipes() {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((recipe) => ({
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
  })) as Recipe[];
}

export async function deleteRecipeById(recipeId: string) {
  const { error } = await supabase.from("recipes").delete().eq("id", recipeId);

  if (error) throw error;
}

export async function updateRecipeFavorite(
  recipeId: string,
  isFavorite: boolean
) {
  const { error } = await supabase
    .from("recipes")
    .update({ is_favorite: isFavorite })
    .eq("id", recipeId);

  if (error) throw error;
}

export async function updateRecipePlanningQueue(
  recipeId: string,
  isPlanningQueue: boolean
) {
  const { error } = await supabase
    .from("recipes")
    .update({ is_planning_queue: isPlanningQueue })
    .eq("id", recipeId);

  if (error) throw error;
}

/* PANTRY */

export async function loadPantryItems() {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("pantry_items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((item) => ({
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
  })) as PantryItem[];
}

export async function deletePantryItemById(itemId: string) {
  const { error } = await supabase
    .from("pantry_items")
    .delete()
    .eq("id", itemId);

  if (error) throw error;
}

export async function updatePantryItem(item: PantryItem) {
  const { error } = await supabase
    .from("pantry_items")
    .update({
      name: item.name,
      quantity: item.quantity || "1",
      unit: item.unit || "",
      category: item.category || "Other",
      image_url: item.image || "",
      source_url: item.sourceUrl || "",
      brand: item.brand || "",
      package_size: item.packageSize || "",
      price: item.price || "",
    })
    .eq("id", item.id);

  if (error) throw error;
}

/* SHOPPING */
export async function loadShoppingItems() {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("shopping_items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data || [];
}

export async function addShoppingItem(name: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Please log in again.");

  const { data, error } = await supabase
    .from("shopping_items")
    .insert({
      user_id: user.id,
      name,
      store_section: "Other",
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function removeShoppingItemByName(name: string) {
  const user = await getCurrentUser();
  if (!user) return;

  const { error } = await supabase
    .from("shopping_items")
    .delete()
    .eq("user_id", user.id)
    .eq("name", name);

  if (error) throw error;
}

/* PROFILE */

export async function loadProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) throw error;

  return data;
}

export async function updateProfileDisplayName(displayName: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Please log in again.");

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName.trim() || null,
    })
    .eq("id", user.id);

  if (error) throw error;
}

/* MEAL PLAN */

export async function loadMealPlan() {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("meal_plan")
    .select(
      `
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
    `
    )
    .eq("user_id", user.id);

  if (error) throw error;

  return data || [];
}

export async function savePantryItem(item: {
  id?: string | null;
  name: string;
  quantity: string;
  unit?: string;
  category: string;
  image?: string;
  sourceUrl?: string;
}) {
  const user = await getCurrentUser();

  if (!user) throw new Error("Please log in again.");

  const row = {
    user_id: user.id,
    name: item.name.trim(),
    quantity: item.quantity || "1",
    unit: item.unit || "",
    category: item.category || "Other",
    image_url: item.image || "",
    source_url: item.sourceUrl || "",
  };

  if (item.id) {
    const { error } = await supabase
      .from("pantry_items")
      .update(row)
      .eq("id", item.id);

    if (error) throw error;

    return;
  }

  const { error } = await supabase.from("pantry_items").insert(row);

  if (error) throw error;
}

export async function addPantryItemToShoppingList(item: PantryItem) {
  const user = await getCurrentUser();

  if (!user) throw new Error("Please log in again.");

  const { error } = await supabase.from("shopping_items").insert({
    user_id: user.id,
    name: item.name,
    brand: item.brand || "",
    package_size: item.packageSize || "",
    image_url: item.image || "",
    source_url: item.sourceUrl || "",
    price: item.price || "",
    store_section: item.category || "Other",
  });

  if (error) throw error;
}