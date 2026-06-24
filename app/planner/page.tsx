"use client";

import { useState } from "react";
import AppShell from "../components/AppShell";

type Recipe = {
  id: string;
  title: string;
  image?: string;
  ingredients: string[];
  steps: string[];
  createdAt: string;
  isFavorite?: boolean;
  isPlanningQueue?: boolean;
  isMade?: boolean;
  mealPlanId?: string;
  source?: "recipe" | "shopping_list" | "leftovers";
};

const meals = ["Breakfast", "Lunch", "Dinner"];

const placeholderImage =
  "https://placehold.co/1200x800/f8efe6/a63a0a?text=Hey+Chef";

export default function PlannerPage() {
  const [activePlannerWeek, setActivePlannerWeek] =
    useState<"current" | "next">("current");
  const [plannerPopup, setPlannerPopup] =
    useState<{ day: string; meal: string } | null>(null);

  const [recipes] = useState<Recipe[]>([]);
  const [shoppingList] = useState<string[]>([]);
  const [mealPlan, setMealPlan] = useState<Record<string, Recipe[]>>({});

  const [plannerRecipeId, setPlannerRecipeId] = useState("");
  const [plannerShoppingItemId, setPlannerShoppingItemId] = useState("");
  const [plannerLeftoverId, setPlannerLeftoverId] = useState("");
  const [showAllCookingQueue] = useState(false);

  const plannerDays = [
    { label: "Monday", date: "2026-06-22" },
    { label: "Tuesday", date: "2026-06-23" },
    { label: "Wednesday", date: "2026-06-24" },
    { label: "Thursday", date: "2026-06-25" },
    { label: "Friday", date: "2026-06-26" },
    { label: "Saturday", date: "2026-06-27" },
    { label: "Sunday", date: "2026-06-28" },
  ];

  function getMealPlanKey(day: string, meal: string) {
    return `${activePlannerWeek}-${day}-${meal}`;
  }

  function addNewMealPlanItemsToShoppingList() {}
  function resetWeek() {}
  function addRecipeFromPlanner() {}
  function addShoppingListFromPlanner() {}
  function addLeftoverFromPlanner() {}
  function removeRecipeFromMealPlan(day: string, meal: string, mealPlanId?: string) {}

  function normalizeItemName(text?: string | null) {
    return String(text || "").toLowerCase().trim();
  }

  return (
    <AppShell>
      <div className="mb-8 rounded-[2rem] border border-[#ead7c8] bg-[#fffaf5] p-6 shadow-sm md:p-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-4xl font-bold md:text-5xl">
              Weekly Meal Planner
            </h1>
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
              onClick={resetWeek}
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

            <p className="mb-3 text-center text-sm font-bold text-[#6d5549]">
              or
            </p>

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

            <p className="mb-3 text-center text-sm font-bold text-[#6d5549]">
              or
            </p>

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
                        normalizeItemName(other.title) ===
                        normalizeItemName(item.title)
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
              disabled={
                !plannerRecipeId && !plannerShoppingItemId && !plannerLeftoverId
              }
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
        {plannerDays.map((day) => (
          <div key={day.date} className="rounded-3xl bg-white p-4 shadow md:p-5">
            <h2 className="mb-4 text-2xl font-bold text-[#a63a0a]">
              {day.label}
            </h2>

            <div className="grid gap-4 md:grid-cols-3">
              {meals.map((meal) => {
                const key = getMealPlanKey(day.date, meal);
                const plannedRecipes = mealPlan[key] || [];

                return (
                  <div key={meal} className="rounded-2xl bg-[#f8efe6] p-4 md:p-5">
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
                          .slice(
                            0,
                            showAllCookingQueue ? plannedRecipes.length : 5
                          )
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

                                  <div className="text-left font-medium text-[#a63a0a]">
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
                                  </div>
                                </div>

                                <button
                                  onClick={() =>
                                    removeRecipeFromMealPlan(
                                      day.date,
                                      meal,
                                      recipe.mealPlanId
                                    )
                                  }
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
    </AppShell>
  );
}