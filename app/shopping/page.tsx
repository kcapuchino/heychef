"use client";

import { useState } from "react";
import AppShell from "../components/AppShell";

type Recipe = {
  id: string;
  title: string;
  image?: string;
  ingredients: string[];
  steps: string[];
  sourceUrl?: string;
  createdAt: string;
  type?: "recipe" | "grocery";
  mealPlanId?: string;
  plannedDate?: string;
  weekStart?: string;
};

const placeholderImage =
  "https://placehold.co/1200x800/f8efe6/a63a0a?text=Hey+Chef";

export default function ShoppingPage() {
  const [shoppingList, setShoppingList] = useState<string[]>([]);
  const [checkedShoppingItems, setCheckedShoppingItems] = useState<string[]>([]);
  const [shoppingSort, setShoppingSort] = useState("az");
  const [hidePantryItems, setHidePantryItems] = useState(true);

  const [shoppingItemImages] = useState<Record<string, string>>({});
  const [shoppingItemUrls] = useState<Record<string, string>>({});
  const [manuallyMarkedOnHand, setManuallyMarkedOnHand] = useState<string[]>([]);
  const [buyAnywayItems, setBuyAnywayItems] = useState<string[]>([]);

  const [recipes] = useState<Recipe[]>([]);
  const [cookingQueue] = useState<Recipe[]>([]);
  const [recentlyMade] = useState<any[]>([]);

  const [cookingQueueFilter, setCookingQueueFilter] = useState("all");
  const [showAllCookingQueue, setShowAllCookingQueue] = useState(false);
  const [showAllRecentlyMade, setShowAllRecentlyMade] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const neededShoppingListCount = shoppingList.length;

  function showToast(message: string) {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 2500);
  }

  function cleanForSort(item: string) {
    return item.toLowerCase().trim();
  }

  function normalizeItemName(text?: string | null) {
    return String(text || "").toLowerCase().trim();
  }

  function cleanPantryDisplayName(text: string) {
    return text.trim();
  }

  function cleanIngredientName(text: string) {
    return text.trim();
  }

  function getShoppingItemIcon() {
    return "🛒";
  }

  function getMatchingPantryItem(item: string) {
    return null as any;
  }

  function getRecipePantryGaps(recipe: Recipe) {
    return recipe.ingredients || [];
  }

  function canMakeRecipeFromPantry(recipe: Recipe) {
    return false;
  }

  function getWeekStartDate(week: "current" | "next") {
    return "";
  }

  function addCheckedItemsToPantry() {}
  function toggleShoppingItemChecked(item: string, checked: boolean) {
    setCheckedShoppingItems((current) =>
      checked
        ? [...current, item]
        : current.filter((savedItem) => savedItem !== item)
    );
  }

  function removeShoppingItem(item: string) {
    setShoppingList((current) => current.filter((savedItem) => savedItem !== item));
  }

  function markRecipeMade(recipe: Recipe) {}
  function togglePlanningQueue(recipeId: string) {}

  return (
    <AppShell>
      <section className="mb-8 rounded-[2rem] border border-[#ead7c8] bg-[#fffaf5] p-6 shadow-sm md:p-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-4xl font-bold md:text-5xl">Shopping List</h1>

            <p className="mt-2 text-[#6d5549]">
              Review ingredients you need and move items into your pantry.
            </p>
          </div>

          <button
            onClick={() => {
              if (confirm("Clear your shopping list?")) {
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
            onClick={() => {
              const input = document.getElementById(
                "quick-shopping-item"
              ) as HTMLInputElement | null;

              const itemName = input?.value || "";

              if (!itemName.trim()) return;

              setShoppingList((current) => [itemName.trim(), ...current]);

              if (input) input.value = "";

              showToast("Item added.");
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
            </select>

            <button
              onClick={() => setHidePantryItems(!hidePantryItems)}
              className="rounded-full border border-[#a63a0a] px-6 py-3 font-bold text-[#a63a0a]"
            >
              {hidePantryItems ? "Show Pantry Items" : "Hide Pantry Items"}
            </button>

            <div className="rounded-full bg-[#f8efe6] px-6 py-3 text-center font-bold">
              {shoppingList.length} Total Items
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
              .sort((a, b) =>
                shoppingSort === "za"
                  ? cleanForSort(b.item).localeCompare(cleanForSort(a.item))
                  : cleanForSort(a.item).localeCompare(cleanForSort(b.item))
              )
              .map(({ item, count }) => {
                const matchingPantryItem = getMatchingPantryItem(item);
                const isManuallyMarkedOnHand =
                  manuallyMarkedOnHand.includes(item);

                const displayName = `${item.trim()}${
                  count > 1 ? ` ×${count}` : ""
                }`;

                const itemImage = shoppingItemImages[item] || "";
                const storeUrl = shoppingItemUrls[item] || "";

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
                          {getShoppingItemIcon()}
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="max-w-[52ch] break-words font-medium leading-snug">
                          {displayName}
                        </p>

                        {storeUrl && (
                          <a
                            href={storeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm font-bold text-[#a63a0a] hover:underline"
                          >
                            🛒 View in Store
                          </a>
                        )}
                      </div>
                    </label>

                    <div className="flex flex-wrap items-center gap-3 pl-7 md:pl-0">
                      {matchingPantryItem ? (
                        <>
                          <span className="text-sm text-[#6d5549]">
                            ✓ In pantry
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
                              setManuallyMarkedOnHand((current) => [
                                ...current,
                                item,
                              ])
                            }
                            className="text-sm font-medium text-[#a63a0a]"
                          >
                            Mark On Hand
                          </button>

                          <button
                            onClick={() => {
                              if (
                                !confirm(
                                  `Remove ${item} from your shopping list?`
                                )
                              )
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
            {["all", "ready", "needs"].map((filter) => (
              <button
                key={filter}
                onClick={() => setCookingQueueFilter(filter)}
                className={`w-full rounded-full px-4 py-3 text-center text-sm font-bold md:w-40 ${
                  cookingQueueFilter === filter
                    ? "bg-[#a63a0a] text-white"
                    : "border border-[#a63a0a] text-[#a63a0a]"
                }`}
              >
                {filter === "all"
                  ? "All"
                  : filter === "ready"
                  ? "Ready to Make"
                  : "Needs Items"}
              </button>
            ))}
          </div>
        </div>

        {cookingQueue.length === 0 ? (
          <p className="rounded-2xl border border-[#ead7c8] bg-[#fffaf5] p-5 text-[#6d5549]">
            No planned recipes yet. Add recipes to your meal planner to see them
            here.
          </p>
        ) : (
          <div className="space-y-3">
            {cookingQueue
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
                      <h3 className="font-bold">{recipe.title}</h3>

                      <span className="mt-1 inline-block rounded-full bg-[#f3ece7] px-3 py-1 text-xs font-bold text-[#6d5549]">
                        NEEDS ITEMS
                      </span>

                      <p className="text-sm text-[#3f7f32]">
                        {getRecipePantryGaps(recipe).length} ingredients still
                        needed
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {recipe.ingredients.slice(0, 3).map((ingredient) => (
                          <span
                            key={ingredient}
                            className="rounded-full bg-[#f8efe6] px-3 py-1 text-xs text-[#6d5549]"
                          >
                            {cleanIngredientName(
                              cleanPantryDisplayName(ingredient)
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => markRecipeMade(recipe)}
                    className="rounded-full bg-[#a63a0a] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#8f3008]"
                  >
                    ✓ Made This
                  </button>
                </div>
              ))}
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
              <h2 className="text-2xl font-bold text-[#3f7f32]">
                Recently Made
              </h2>

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
        </section>
      )}

      {toastMessage && (
        <div className="fixed left-1/2 top-6 z-[9999] -translate-x-1/2 rounded-full bg-[#2b1a12] px-6 py-3 text-white shadow-xl">
          {toastMessage}
        </div>
      )}
    </AppShell>
  );
}