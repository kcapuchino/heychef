"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

type PublicProfile = {
  id: string;
  display_name?: string | null;
  full_name?: string | null;
};

type PublicRecipe = {
  id: string;
  title: string;
  image_url?: string | null;
  category?: string | null;
  cook_time?: string | number | null;
  servings?: string | number | null;
  created_at?: string | null;
};

const FALLBACK_RECIPE_IMAGE = "/hero-kitchen.jpg";

function createRecipeSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function ChefPage() {
  const params = useParams<{ id: string }>();

  const [profile, setProfile] =
    useState<PublicProfile | null>(null);

  const [recipes, setRecipes] =
    useState<PublicRecipe[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadChefPage() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("id, display_name")
          .eq("id", params.id)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        const {
          data: recipeData,
          error: recipeError,
        } = await supabase
          .from("recipes")
          .select(
            "id, title, image_url, category, cook_time, servings, created_at"
          )
          .eq("user_id", params.id)
          .eq("visibility", "public")
          .neq("type", "grocery")
          .order("created_at", { ascending: false });

        if (recipeError) {
          throw recipeError;
        }

        setProfile(profileData as PublicProfile | null);
        setRecipes((recipeData ?? []) as PublicRecipe[]);
      } catch (error) {
        console.error("Chef page error:", error);

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "This chef page could not be loaded."
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadChefPage();
  }, [params.id]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#f8efe6] px-4 py-8">
        <section className="mx-auto max-w-6xl rounded-[2rem] bg-white p-8 shadow-xl">
          <p className="text-[#6d5549]">
            Preparing this chef’s cookbook…
          </p>
        </section>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-[#f8efe6] px-4 py-8">
        <section className="mx-auto max-w-4xl rounded-[2rem] bg-white p-8 shadow-xl">
          <h1 className="text-3xl font-bold text-[#2b1b14]">
            Chef page unavailable
          </h1>

          <p className="mt-3 text-[#6d5549]">
            {errorMessage}
          </p>

          <Link
            href="/community"
            className="mt-6 inline-flex rounded-full bg-[#a63a0a] px-6 py-3 font-bold text-white"
          >
            Back to Community
          </Link>
        </section>
      </main>
    );
  }

  const chefName =
    profile?.display_name?.trim() ||
    profile?.full_name?.trim() ||
    "Hey Chef Cook";

  const chefInitial =
    chefName.charAt(0).toUpperCase() || "H";

  return (
    <main className="min-h-screen bg-[#f8efe6] px-4 py-8 md:px-6">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] bg-white p-6 shadow-xl md:p-8">
          <div className="flex justify-end">
            <Link
              href="/community"
              aria-label="Close chef page"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#ead7c8] bg-white text-2xl text-[#a63a0a]"
            >
              ×
            </Link>
          </div>

          <header className="flex flex-col items-center text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#fff4ef] text-4xl font-bold text-[#a63a0a]">
              {chefInitial}
            </div>

            <p className="mt-5 text-sm font-bold uppercase tracking-[0.2em] text-[#a63a0a]">
              Hey Chef Community
            </p>

            <h1 className="mt-2 text-4xl font-bold text-[#2b1b14] md:text-5xl">
              {chefName}
            </h1>

            <p className="mt-3 max-w-xl text-[#6d5549]">
              Explore recipes shared publicly by this cook.
            </p>

            <div className="mt-5 rounded-full border border-[#ead7c8] bg-[#fffaf5] px-4 py-2 text-sm font-bold text-[#6d5549]">
              {recipes.length}{" "}
              {recipes.length === 1
                ? "public recipe"
                : "public recipes"}
            </div>
          </header>
        </div>

        {recipes.length === 0 ? (
          <div className="mt-8 rounded-[2rem] border border-[#ead7c8] bg-white p-10 text-center">
            <div className="text-4xl" aria-hidden="true">
              🍲
            </div>

            <h2 className="mt-4 text-2xl font-bold text-[#2b1b14]">
              No public recipes yet
            </h2>

            <p className="mt-2 text-[#6d5549]">
              This cook has not shared any recipes publicly.
            </p>
          </div>
        ) : (
          <section
            aria-label={`${chefName}'s public recipes`}
            className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
          >
            {recipes.map((recipe) => {
              const recipeSlug =
                createRecipeSlug(recipe.title);

              return (
                <article
                  key={recipe.id}
                  className="overflow-hidden rounded-[2rem] border border-[#ead7c8] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <Link
                    href={`/recipe/${recipe.id}/${recipeSlug}`}
                    className="block"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-[#f8efe6]">
                      <img
                        src={
                          recipe.image_url ||
                          FALLBACK_RECIPE_IMAGE
                        }
                        alt=""
                        className="h-full w-full object-cover transition duration-300 hover:scale-105"
                        onError={(event) => {
                          event.currentTarget.src =
                            FALLBACK_RECIPE_IMAGE;
                        }}
                      />
                    </div>
                  </Link>

                  <div className="p-5">
                    <div className="flex flex-wrap gap-2">
                      {recipe.category && (
                        <span className="rounded-full bg-[#fff3eb] px-3 py-1 text-xs font-bold text-[#a63a0a]">
                          {recipe.category}
                        </span>
                      )}

                      <span className="rounded-full border border-[#ead7c8] bg-white px-3 py-1 text-xs font-bold text-[#6d5549]">
                        🌎 Public
                      </span>
                    </div>

                    <Link
                      href={`/recipe/${recipe.id}/${recipeSlug}`}
                      className="mt-3 block"
                    >
                      <h2 className="text-2xl font-bold text-[#2b1b14] transition hover:text-[#a63a0a]">
                        {recipe.title}
                      </h2>
                    </Link>

                    {(recipe.cook_time ||
                      recipe.servings) && (
                      <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#6d5549]">
                        {recipe.cook_time && (
                          <span>
                            ⏱ {recipe.cook_time}
                          </span>
                        )}

                        {recipe.servings && (
                          <span>
                            🍽 {recipe.servings} servings
                          </span>
                        )}
                      </div>
                    )}

                    <Link
                      href={`/recipe/${recipe.id}/${recipeSlug}`}
                      className="mt-5 block rounded-full bg-[#a63a0a] px-5 py-3 text-center font-bold text-white transition hover:bg-[#8f3108]"
                    >
                      View Recipe
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <div className="mt-8">
          <Link
            href="/community"
            className="inline-flex rounded-full border border-[#a63a0a] bg-white px-6 py-3 font-bold text-[#a63a0a] transition hover:bg-[#fff3eb]"
          >
            ← Back to Community
          </Link>
        </div>
      </section>
    </main>
  );
}