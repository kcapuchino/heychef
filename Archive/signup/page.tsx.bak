"use client";

import { useState } from "react";
import Link from "next/link";

type Recipe = {
  id: string;
  title: string;
  image?: string;
  ingredients: string[];
  steps: string[];
  cookTime?: string;
  servings?: string;
  sourceUrl?: string;
  createdAt: string;
};

const placeholderImage =
  "https://placehold.co/1200x800/f8efe6/a63a0a?text=Hey+Chef";

const sampleRecipes: Recipe[] = [
  {
    id: "sample-tostadas",
    title: "Avocado & Black Bean Tostadas",
    image:
      "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1200&q=80",
    ingredients: ["2 ripe avocados", "1 lime", "1 can black beans"],
    steps: ["Mash avocado.", "Warm beans.", "Build tostadas."],
    cookTime: "20 min",
    servings: "4 servings",
    sourceUrl: "",
    createdAt: new Date().toISOString(),
  },
];

export default function AuthPage() {
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [recipeUrl, setRecipeUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [sampleRecipe, setSampleRecipe] = useState<Recipe | null>(null);

  function importRecipe() {}

  function RecipeMeta({ recipe }: { recipe: Recipe }) {
    return (
      <div className="flex flex-wrap gap-2 text-sm text-[#6d5549]">
        {recipe.cookTime && <span>{recipe.cookTime}</span>}
        {recipe.servings && <span>• {recipe.servings}</span>}
      </div>
    );
  }

  function renderAuthCard() {
    return (
      <div>
        <h2 className="mb-2 text-3xl font-bold">
          {authMode === "signup" ? "Create your account" : "Welcome back"}
        </h2>

        <p className="mb-5 text-[#6d5549]">
          {authMode === "signup"
            ? "Start saving recipes, planning meals, and building your pantry."
            : "Log in to keep cooking."}
        </p>

        <div className="grid grid-cols-2 gap-2 rounded-full bg-[#f8efe6] p-1">
          <button
            onClick={() => setAuthMode("signup")}
            className={`rounded-full px-4 py-2 font-bold ${
              authMode === "signup"
                ? "bg-[#a63a0a] text-white"
                : "text-[#a63a0a]"
            }`}
          >
            Sign Up
          </button>

          <button
            onClick={() => setAuthMode("login")}
            className={`rounded-full px-4 py-2 font-bold ${
              authMode === "login"
                ? "bg-[#a63a0a] text-white"
                : "text-[#a63a0a]"
            }`}
          >
            Log In
          </button>
        </div>

        <input
          placeholder="Email"
          className="mt-5 w-full rounded-full border border-[#ead7c8] px-5 py-3"
        />

        <input
          placeholder="Password"
          type="password"
          className="mt-3 w-full rounded-full border border-[#ead7c8] px-5 py-3"
        />

        <button className="mt-5 w-full rounded-full bg-[#a63a0a] px-6 py-3 font-bold text-white">
          {authMode === "signup" ? "Create Free Account" : "Log In"}
        </button>

        <Link
          href="/"
          className="mt-4 block text-center text-sm font-bold text-[#a63a0a]"
        >
          ← Back to home
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8efe6] px-5 py-6 pb-32 text-[#2b1a12] md:p-8">
      <section className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl items-center gap-12 py-8 md:grid-cols-[1.2fr_0.8fr] md:py-16">
        <div>
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-[#a63a0a]">
            Hey Chef
          </p>

          <h1 className="mb-4 text-5xl font-bold leading-tight md:text-7xl">
            Plan meals. Use what you have.
          </h1>

          <p className="mb-6 max-w-xl text-lg text-[#6d5549]">
            Import recipes, plan your week, build your grocery list, and cook
            with confidence.
          </p>

          <div className="mb-8 rounded-[2rem] bg-white p-6 shadow-xl md:hidden">
            {renderAuthCard()}
          </div>

          <div className="my-6 rounded-[2rem] bg-white p-5 shadow-sm">
            <p className="mb-4 text-[#6d5549]">
              Paste a recipe URL. Hey Chef will clean it into ingredients and
              steps.
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
          </div>

          <div
            onClick={() => setSampleRecipe(sampleRecipes[0])}
            className="cursor-pointer rounded-[2rem] bg-white p-5 shadow-sm transition hover:shadow-lg"
          >
            <div className="flex flex-col gap-4 md:flex-row">
              <img
                src={sampleRecipes[0].image || placeholderImage}
                alt={sampleRecipes[0].title}
                className="h-40 w-full rounded-2xl object-cover md:w-64"
              />

              <div className="flex-1">
                <h3 className="mb-2 text-2xl font-bold">
                  {sampleRecipes[0].title}
                </h3>

                <RecipeMeta recipe={sampleRecipes[0]} />

                <p className="mt-4 text-[#6d5549]">Click to preview</p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: "🌎",
                title: "Save recipes anywhere",
                text: "Import from websites, social media, and shared links.",
              },
              {
                icon: "📅",
                title: "Plan meals faster",
                text: "Organize breakfast, lunch, and dinner in minutes.",
              },
              {
                icon: "🛒",
                title: "Shop smarter",
                text: "Automatically build grocery lists from your meal plan.",
              },
              {
                icon: "📦",
                title: "Use what you have",
                text: "Track pantry items and reduce food waste.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl bg-white/70 p-4 shadow-sm ring-1 ring-[#ead7c8]/70"
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#fff4ef] text-2xl">
                  {feature.icon}
                </div>

                <h3 className="mb-1 font-bold">{feature.title}</h3>

                <p className="text-sm leading-relaxed text-[#6d5549]">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-full bg-white/70 px-5 py-3 text-center shadow-sm ring-1 ring-[#ead7c8]/70">
            <p className="text-sm font-medium text-[#6d5549]">
              Built with smart logic, not AI guesses.
            </p>
          </div>
        </div>

        <div className="hidden rounded-[2rem] bg-white p-8 shadow-xl md:block">
          {renderAuthCard()}
        </div>
      </section>

      {sampleRecipe && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/40 px-4 pb-6 md:items-center md:justify-center md:pb-0"
          onClick={() => setSampleRecipe(null)}
        >
          <div
            className="relative max-h-[90vh] w-full overflow-y-auto rounded-[2rem] bg-white p-5 shadow-xl md:max-w-4xl md:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSampleRecipe(null)}
              className="absolute right-4 top-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white text-3xl text-[#6d5549] shadow-lg hover:text-[#a63a0a]"
            >
              ×
            </button>

            <img
              src={sampleRecipe.image || placeholderImage}
              alt={sampleRecipe.title}
              className="mb-6 h-60 w-full rounded-[1.5rem] object-cover"
            />

            <h1 className="mb-2 text-4xl font-bold">{sampleRecipe.title}</h1>

            <RecipeMeta recipe={sampleRecipe} />

            <div className="my-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-[#ead7c8]">
                <h2 className="mb-4 text-2xl font-bold">Ingredients</h2>

                <ul className="space-y-3">
                  {sampleRecipe.ingredients.map((ingredient) => (
                    <li key={ingredient} className="flex items-center gap-3">
                      <input type="checkbox" disabled className="h-5 w-5" />
                      <span>{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl bg-[#f8efe6] p-5">
                <h2 className="mb-3 text-2xl font-bold">Plan This Recipe</h2>

                <p className="mb-4 text-sm text-[#6d5549]">
                  Create a free account to add recipes to your meal plan and
                  shopping list.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSampleRecipe(null);
                    setAuthMode("signup");
                  }}
                  className="w-full rounded-full bg-[#a63a0a] px-6 py-3 text-white"
                >
                  Create Free Account
                </button>
              </div>
            </div>

            <h2 className="mb-4 text-2xl font-bold">Steps</h2>

            <ol className="space-y-3">
              {sampleRecipe.steps.map((step, index) => (
                <li
                  key={`${step}-${index}`}
                  className="rounded-2xl bg-[#f8efe6] p-4"
                >
                  <strong>Step {index + 1}:</strong> {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      <footer className="mt-20 border-t border-[#ead7c8] pt-8 text-center text-sm text-[#6d5549]">
        <p>© 2020–2026 Hey Chef™. All rights reserved.</p>

        <div className="mt-3 flex justify-center gap-6">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </footer>
    </main>
  );
}