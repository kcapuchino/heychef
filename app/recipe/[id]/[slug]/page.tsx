"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

type PublicRecipe = {
     
  id: string;
  user_id: string | null;
  title: string;
  description?: string | null;
  image?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;

  ingredients?: string[] | null;
  steps?: string[] | null;
  instructions?: string[] | null;

  category?: string | null;
  tags?: string[] | null;

  cookTime?: string | null;
  cook_time?: string | null;

  servings?: string | number | null;

  sourceUrl?: string | null;
  source_url?: string | null;

  type?: string | null;

  brand?: string | null;

  packageSize?: string | null;
  package_size?: string | null;

  visibility?: string | null;
};

export default function RecipePage() {
  const params = useParams<{
    id: string;
    slug: string;
  }>();

  const router = useRouter();

  const [recipe, setRecipe] =
    useState<PublicRecipe | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadRecipe() {
      setIsLoading(true);
      setMessage("");

      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", params.id)
        .maybeSingle();

      if (error) {
        console.error("Recipe load error:", error);
        setMessage(error.message);
        setIsLoading(false);
        return;
      }

      if (!data) {
        setMessage(
          "This recipe could not be found or is not available."
        );
        setIsLoading(false);
        return;
      }

      console.log("PUBLIC RECIPE ROW:", data);
console.log("PUBLIC RECIPE KEYS:", Object.keys(data));

      setRecipe({
  ...data,
  image:
    data.image?.trim() ||
    data.image_url?.trim() ||
    "",
} as PublicRecipe);
      setIsLoading(false);
    }

    void loadRecipe();
  }, [params.id]);

  async function saveToLibrary() {
    if (!recipe || isSaving) return;

    setIsSaving(true);
    setMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage(
          "Please sign in to save this recipe to your library."
        );
        return;
      }

      const recipeSteps =
  Array.isArray(recipe.steps) && recipe.steps.length > 0
    ? recipe.steps
    : Array.isArray(recipe.instructions)
      ? recipe.instructions
      : [];

const cookTime =
  recipe.cookTime || recipe.cook_time || "";

const sourceUrl =
  recipe.sourceUrl || recipe.source_url || "";

const imageUrl =
  recipe.image ||
  recipe.imageUrl ||
  recipe.image_url ||
  "";

const packageSize =
  recipe.packageSize || recipe.package_size || "";

  console.log("SAVING RECIPE COPY:", {
  currentUserId: user.id,
  originalRecipeId: recipe.id,
  title: recipe.title,
  image: imageUrl,
  sourceUrl,
  ingredients: recipe.ingredients,
  steps: recipeSteps,
});

      const { data: savedRecipe, error } = await supabase
        .from("recipes")
        .insert({
          user_id: user.id,
          title: recipe.title,
          image_url: imageUrl || null,
          ingredients: recipe.ingredients || [],
          steps: recipeSteps,
          category: recipe.category || null,
          tags: recipe.tags || [],
          cook_time: cookTime || null,
          servings: recipe.servings || null,
          source_url: sourceUrl || null,
          type: recipe.type || "recipe",
          brand: recipe.brand || null,
          package_size: packageSize || null,
          visibility: "private",
        })
        .select("id, title")
        .single();

      if (error) {
  console.error("SAVE TO LIBRARY SUPABASE ERROR:", {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  });

  throw new Error(
    error.details ||
      error.hint ||
      error.message ||
      "Could not save this recipe."
  );
}

      const savedSlug = savedRecipe.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      router.push(
  `/recipes?recipe=${savedRecipe.id}&edit=true`
);
    } catch (error) {
      console.error("Save recipe error:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Could not save this recipe."
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#f8efe6] px-4 py-8">
        <section className="mx-auto max-w-6xl rounded-[2rem] bg-white p-6 shadow-xl">
          <p className="text-[#6d5549]">
            Loading recipe...
          </p>
        </section>
      </main>
    );
  }

  if (!recipe) {
    return (
      <main className="min-h-screen bg-[#f8efe6] px-4 py-8">
        <section className="mx-auto max-w-4xl rounded-[2rem] bg-white p-6 shadow-xl">
          <h1 className="text-2xl font-bold text-[#2b1b14]">
            Recipe unavailable
          </h1>

          <p className="mt-3 text-[#6d5549]">
            {message}
          </p>

          <Link
            href="/community"
            className="mt-5 inline-flex rounded-full bg-[#a63a0a] px-6 py-3 font-bold text-white transition hover:bg-[#8f3108]"
          >
            Back to Community
          </Link>
        </section>
      </main>
    );
  }

  const recipeSteps =
    Array.isArray(recipe.steps) &&
    recipe.steps.length > 0
      ? recipe.steps
      : Array.isArray(recipe.instructions)
        ? recipe.instructions
        : [];

  const cookTime =
    recipe.cookTime || recipe.cook_time || "";

  const sourceUrl =
    recipe.sourceUrl || recipe.source_url || "";

  const packageSize =
    recipe.packageSize || recipe.package_size || "";

  const isGroceryItem = recipe.type === "grocery";

  return (
    <main className="min-h-screen bg-[#f8efe6] px-4 py-8 md:px-6">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] bg-white p-5 shadow-xl md:p-6">
          <div className="mb-4 flex justify-end">
            <Link
              href="/community"
              aria-label="Close recipe preview"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl text-[#a63a0a] shadow"
            >
              ×
            </Link>
          </div>

          {recipe.image && (
  <img
    src={recipe.image}
    alt={recipe.title}
    className="mb-6 h-60 w-full rounded-[1.5rem] object-cover md:h-80"
    onError={(event) => {
      console.error("Recipe image failed to load:", recipe.image);
      event.currentTarget.style.display = "none";
    }}
  />
)}

          <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#fff4ef] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#a63a0a]">
                  {isGroceryItem
                    ? "Public Go-To Food"
                    : "Public Recipe"}
                </span>

                <span className="rounded-full border border-[#ead7c8] bg-white px-3 py-1 text-xs font-semibold text-[#6d5549]">
                  Read-only preview
                </span>
              </div>

              <h1 className="text-3xl font-bold text-[#2b1b14] md:text-4xl">
                {recipe.title}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[#6d5549]">
                {cookTime && (
                  <span>⏱ {cookTime}</span>
                )}

                {recipe.servings && (
                  <span>👥 {recipe.servings}</span>
                )}

                {recipe.category && (
                  <span>{recipe.category}</span>
                )}

                {isGroceryItem && recipe.brand && (
                  <span>{recipe.brand}</span>
                )}

                {isGroceryItem && packageSize && (
                  <span>{packageSize}</span>
                )}
              </div>

              {recipe.description && (
                <p className="mt-4 max-w-2xl leading-7 text-[#6d5549]">
                  {recipe.description}
                </p>
              )}

              {sourceUrl && (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm font-medium text-[#a63a0a] hover:underline"
                >
                  {isGroceryItem
                    ? "🛒 View in Store"
                    : "🔗 View Original Recipe"}
                </a>
              )}
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 md:w-auto md:min-w-[420px]">
              <button
                type="button"
                onClick={() => void saveToLibrary()}
                disabled={isSaving}
                className="w-full rounded-full bg-[#a63a0a] px-6 py-3 font-bold text-white transition hover:bg-[#8f3108] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving
                  ? "Saving..."
                  : "Save to My Library"}
              </button>

              {recipe.user_id && (
                <Link
                  href={`/chef/${recipe.user_id}`}
                  className="w-full rounded-full border border-[#a63a0a] bg-white px-6 py-3 text-center font-bold text-[#a63a0a] transition hover:bg-[#fff3eb]"
                >
                  View Chef Page
                </Link>
              )}
            </div>
          </div>

          {message && (
            <div
              role="status"
              className="mb-6 rounded-2xl border border-[#f0c7b2] bg-[#fff7f1] p-4 font-semibold text-[#a63a0a]"
            >
              {message}
            </div>
          )}

          {isGroceryItem ? (
            <div className="rounded-3xl bg-[#fffaf5] p-6 shadow-sm">
              <h2 className="mb-4 text-2xl font-bold text-[#2b1b14]">
                Go-To Food Details
              </h2>

              <div className="flex flex-wrap gap-2 text-sm">
                {recipe.brand && (
                  <span className="rounded-full bg-[#fff4ef] px-3 py-1 text-[#a63a0a]">
                    {recipe.brand}
                  </span>
                )}

                {packageSize && (
                  <span className="rounded-full bg-[#fff4ef] px-3 py-1 text-[#a63a0a]">
                    {packageSize}
                  </span>
                )}

                {recipe.category && (
                  <span className="rounded-full bg-[#fff4ef] px-3 py-1 text-[#a63a0a]">
                    {recipe.category}
                  </span>
                )}
              </div>

              <div className="mt-6 rounded-2xl border border-[#ead7c8] bg-white p-5">
                <p className="font-bold text-[#2b1b14]">
                  Save this item to use it in Hey Chef
                </p>

                <p className="mt-2 text-sm leading-6 text-[#6d5549]">
                  Once saved, you can edit it, add it to
                  your pantry, buy it again, or plan it.
                </p>

                <button
                  type="button"
                  onClick={() => void saveToLibrary()}
                  disabled={isSaving}
                  className="mt-5 w-full rounded-full bg-[#a63a0a] px-6 py-3 font-bold text-white transition hover:bg-[#8f3108] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {isSaving
                    ? "Saving..."
                    : "Save to My Library"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 rounded-3xl bg-[#fff4ef] p-5 text-center md:p-6">
                <p className="font-bold text-[#2b1b14]">
                  Want to shop, plan, or edit this recipe?
                </p>

                <p className="mt-1 text-sm text-[#6d5549]">
                  Save it to your personal library to unlock
                  all Hey Chef tools.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-[1fr_420px]">
                <section className="rounded-3xl border border-[#ead7c8] bg-white p-6">
                  <h2 className="mb-5 text-2xl font-bold text-[#2b1b14]">
                    Ingredients
                  </h2>

                  {Array.isArray(recipe.ingredients) &&
                  recipe.ingredients.length > 0 ? (
                    <ul className="space-y-3">
                      {recipe.ingredients.map(
                        (ingredient, index) => (
                          <li
                            key={`${ingredient}-${index}`}
                            className="flex items-start gap-3"
                          >
                            <span
                              aria-hidden="true"
                              className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-[#a63a0a] text-xs text-[#a63a0a]"
                            >
                              ✓
                            </span>

                            <span className="text-[#2b1b14]">
                              {ingredient}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p className="text-[#6d5549]">
                      No ingredients were provided.
                    </p>
                  )}
                </section>

                <aside className="rounded-3xl bg-[#f8efe6] p-6">
                  <h2 className="mb-4 text-2xl font-bold text-[#2b1b14]">
                    Add to Hey Chef
                  </h2>

                  <p className="leading-7 text-[#6d5549]">
                    Save this recipe to add its ingredients
                    to your shopping list, put it in your
                    planning queue, schedule it, and make
                    personal edits.
                  </p>

                  <button
                    type="button"
                    onClick={() => void saveToLibrary()}
                    disabled={isSaving}
                    className="mt-6 w-full rounded-full bg-[#a63a0a] px-6 py-3 font-bold text-white transition hover:bg-[#8f3108] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving
                      ? "Saving..."
                      : "Save to My Library"}
                  </button>
                </aside>
              </div>

              <section className="mt-8">
                <h2 className="mb-4 text-2xl font-bold text-[#2b1b14]">
                  Steps
                </h2>

                {recipeSteps.length > 0 ? (
                  <ol className="space-y-3">
                    {recipeSteps.map((step, index) => (
                      <li
                        key={`${step}-${index}`}
                        className="rounded-2xl bg-[#f8efe6] p-4 text-[#2b1b14]"
                      >
                        <strong>
                          Step {index + 1}:
                        </strong>{" "}
                        {step}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="rounded-2xl bg-[#f8efe6] p-4 text-[#6d5549]">
                    No steps were provided.
                  </p>
                )}
              </section>
            </>
          )}

          <div className="mt-8 border-t border-[#ead7c8] pt-6">
            <Link
              href="/community"
              className="inline-flex rounded-full border border-[#a63a0a] bg-white px-6 py-3 font-bold text-[#a63a0a] transition hover:bg-[#fff3eb]"
            >
              ← Back to Community
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}