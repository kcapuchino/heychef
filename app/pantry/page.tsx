"use client";

import { useState } from "react";
import AppShell from "../components/AppShell";
import { supabase } from "@/lib/supabase";

type PantryItem = {
  id: string;
  name: string;
  quantity: string;
  unit?: string;
  category: string;
  createdAt: string;
  image?: string;
  sourceUrl?: string;
  brand?: string;
  packageSize?: string;
  price?: string;
};

const placeholderImage =
  "https://placehold.co/1200x800/f8efe6/a63a0a?text=Hey+Chef";
  

export default function PantryPage() {
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [pantrySearch, setPantrySearch] = useState("");
  const [expandedPantryCategory, setExpandedPantryCategory] =
    useState<string | null>("all");
  const [isBulkEditingPantry, setIsBulkEditingPantry] = useState(false);
  const [pantryDrafts, setPantryDrafts] = useState<Record<string, PantryItem>>(
    {}
  );
  const [showPantryModal, setShowPantryModal] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [smartRestockItems] = useState<string[]>([]);
const [dismissedRestockItems, setDismissedRestockItems] = useState<string[]>([]);

const [buyAnywayItems, setBuyAnywayItems] = useState<string[]>([]);

const [editingPantryModalId, setEditingPantryModalId] = useState<string | null>(null);

const [pantryModalItem, setPantryModalItem] = useState("");
const [pantryModalImage, setPantryModalImage] = useState("");
const [pantryModalSourceUrl, setPantryModalSourceUrl] = useState("");
const [pantryModalShoppingItem, setPantryModalShoppingItem] = useState("");
const [pantryModalQuantity, setPantryModalQuantity] = useState("1");
const [pantryModalUnit, setPantryModalUnit] = useState("package");
const [pantryModalCategory, setPantryModalCategory] = useState("Other");
const [addAnotherPantryItem, setAddAnotherPantryItem] = useState(false);
const [originalPantrySourceUrl, setOriginalPantrySourceUrl] = useState("");
  

  function showToast(message: string) {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 2500);
  }

  function saveBulkPantryEdits() {}
  function resetPantry() {}
  function savePantryItemAsFoodCard(item: PantryItem) {}
  function addItemsToShoppingList(items: string[], sourceItem?: any) {}

  return (
    <AppShell>
      {/* paste pantry JSX here */}

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

  <section className="mb-6 rounded-[2rem] border border-[#ead7c8] bg-white p-5 shadow-sm">
  <div className="flex flex-wrap items-center justify-between gap-4">
    <div>
      <p className="mb-1 text-sm uppercase tracking-[0.2em] text-[#a63a0a]">
        Smart restock
      </p>

      <h2 className="text-xl font-bold">Restock Suggestions</h2>

      <p className="text-sm text-[#6d5549]">
        Based on favorite recipes and items not already on your shopping list.
      </p>
    </div>

    <div className="flex flex-wrap items-center gap-2">
      {smartRestockItems.length === 0 ? (
        <span className="rounded-full bg-[#fff4ef] px-4 py-2 text-sm font-medium text-[#6d5549]">
          Nothing to restock right now
        </span>
      ) : (
        <>
          {smartRestockItems.map((item) => (
  <div
    key={item}
    className="flex items-center overflow-hidden rounded-full bg-[#fff4ef] text-sm font-medium"
  >
    <button
      onClick={() => addItemsToShoppingList([item])}
      className="px-4 py-2 hover:bg-[#f6e7dc]"
    >
      Add {item}
    </button>

    <button
  onClick={() =>
    setDismissedRestockItems((current) => [...current, item])
  }
  className="px-3 py-2 text-[#a63a0a] hover:bg-[#f6e7dc]"
>
  ✕
</button>
  </div>
))}
          <button
            onClick={() => addItemsToShoppingList(smartRestockItems)}
            className="rounded-full bg-[#a63a0a] px-4 py-2 text-sm font-bold text-white"
          >
            Add {smartRestockItems.length} to Shopping List
          </button>
        </>
      )}
    </div>
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
          markedForDelete: nextQty <= 0,
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
          markedForDelete: Number(nextValue) <= 0,
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
       </AppShell>
  );
}