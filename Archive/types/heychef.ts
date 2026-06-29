export type Recipe = {
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

export type PlannedRecipe = Recipe & {
  parentMealPlanId?: string;
  mealPlanId: string;
  plannedDate?: string;
  isMade?: boolean;
  weekStart?: string;
  week_start?: string;
};

export type PantryItem = {
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

export type ShoppingItem = {
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

export type SavedUserData = {
  recipes: Recipe[];
  shoppingList: string[];
  mealPlan: Record<string, PlannedRecipe[]>;
  pantryItems: PantryItem[];
};