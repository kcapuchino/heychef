"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "@/app/lib/supabase";
import { useRouter } from "next/navigation";

type SortOption =
  | "newest"
  | "oldest"
  | "az"
  | "za";

type PublicRecipe = {
  id: string;
  userId: string;
  title: string;
  image: string;
  category: string;
  tags: string[];
  ingredients: string[];
  steps: string[];
  cookTime: string;
  servings: string;
  sourceUrl: string;
  createdAt: string;
  creatorName: string;
};

type RecipeRow = {
  id: string;
  user_id?: string | null;
  title?: string | null;
  image?: string | null;
  image_url?: string | null;
  category?: string | null;
  tags?: string[] | null;
  ingredients?: string[] | null;
  steps?: string[] | null;
  cook_time?: string | number | null;
  cookTime?: string | number | null;
  servings?: string | number | null;
  source_url?: string | null;
  sourceUrl?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
  visibility?: "private" | "public" | null;
  type?: string | null;
};

type ProfileRow = {
  id: string;
  display_name?: string | null;
  full_name?: string | null;
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

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0
  );
}

function getRecipeImage(recipe: PublicRecipe) {
  if (recipe.image.trim()) {
    return recipe.image;
  }

  switch (recipe.category.toLowerCase()) {
    case "main dish":
      return "/food-icons/main-dish.png";

    case "bread":
      return "/food-icons/bread.png";

    case "dessert":
      return "/food-icons/dessert.png";

    case "soup":
      return "/food-icons/soup.png";

    case "salad":
      return "/food-icons/salad.png";

    case "beverage":
      return "/food-icons/beverage.png";

    default:
      return "/food-icons/recipe.png";
  }
}

function getSourceName(sourceUrl: string) {
  if (!sourceUrl) return "";

  try {
    const hostname = new URL(sourceUrl).hostname.replace(/^www\./, "");

    return hostname;
  } catch {
    return "Original source";
  }
}

export default function CommunityPage() {
    const [recipes, setRecipes] = useState<PublicRecipe[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const router = useRouter();
    const [isInstalledApp, setIsInstalledApp] = useState(false);
    const [toastMessage, setToastMessage] = useState("");

    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] =
        useState("all");
    const [tagFilter, setTagFilter] = useState("all");
    const [sortOption, setSortOption] =
        useState<SortOption>("newest")
    const [isMenuOpen, setIsMenuOpen] = useState(false);
        const [showSettingsMenu, setShowSettingsMenu] =
        useState(false);
    const [currentUserId, setCurrentUserId] =
        useState<string | null>(null);    

    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const settingsRef = useRef<HTMLDivElement>(null);

    function showToast(message: string) {
  setToastMessage(message);

  window.setTimeout(() => {
    setToastMessage("");
  }, 4000);
}

async function logoutUser() {
  setShowSettingsMenu(false);
  setIsMenuOpen(false);

  const { error } = await supabase.auth.signOut();

  if (error) {
    showToast(
      "We could not log you out. Please try again."
    );
    return;
  }

  router.push("/");
  router.refresh();
}

  useEffect(() => {
    async function loadPublicRecipes() {
      setIsLoading(true);
      setLoadError("");

      try {
        const { data: recipeData, error: recipeError } =
  await supabase
    .from("recipes")
    .select("*")
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

console.log("Public recipe data:", recipeData);
console.log("Public recipe error:", recipeError);

        if (recipeError) {
          throw recipeError;
        }

        const publicRecipeRows = (
          (recipeData ?? []) as RecipeRow[]
        ).filter((recipe) => recipe.type !== "grocery");

        const creatorIds = Array.from(
          new Set(
            publicRecipeRows
              .map((recipe) => recipe.user_id)
              .filter(
                (userId): userId is string =>
                  typeof userId === "string" &&
                  userId.length > 0
              )
          )
        );

        let profileMap = new Map<string, string>();

        if (creatorIds.length > 0) {
          const { data: profileData, error: profileError } =
            await supabase
              .from("profiles")
              .select("id, display_name")
              .in("id", creatorIds);

          if (profileError) {
            console.warn(
              "Public recipes loaded, but creator names could not be loaded:",
              profileError
            );
          } else {
            profileMap = new Map(
  ((profileData ?? []) as ProfileRow[]).map(
    (profile) => [
      profile.id,
      profile.display_name?.trim() ||
        "Hey Chef Cook",
    ]
  )
);
          }
        }

        const formattedRecipes: PublicRecipe[] =
          publicRecipeRows.map((recipe) => ({
            id: recipe.id,
            userId: recipe.user_id ?? "",
            title:
              recipe.title?.trim() || "Untitled Recipe",
            image:
  recipe.image?.trim() ||
  recipe.image_url?.trim() ||
  "",
            category:
              recipe.category?.trim() || "Uncategorized",
            tags: normalizeStringArray(recipe.tags),
            ingredients: normalizeStringArray(
              recipe.ingredients
            ),
            steps: normalizeStringArray(recipe.steps),
            cookTime: String(
              recipe.cook_time ??
                recipe.cookTime ??
                ""
            ),
            servings: String(recipe.servings ?? ""),
            sourceUrl:
              recipe.source_url ??
              recipe.sourceUrl ??
              "",
            createdAt:
              recipe.created_at ??
              recipe.createdAt ??
              new Date(0).toISOString(),
            creatorName:
              profileMap.get(recipe.user_id ?? "") ??
              "Hey Chef Cook",
          }));

        setRecipes(formattedRecipes);
      } catch (error) {
        console.error(
          "Could not load public recipes:",
          error
        );

        setLoadError(
          "We could not load the public cookbook right now."
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadPublicRecipes();
  }, []);

  const categoryOptions = useMemo(() => {
    return Array.from(
      new Set(
        recipes
          .map((recipe) => recipe.category)
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [recipes]);

  const tagOptions = useMemo(() => {
    return Array.from(
      new Set(
        recipes.flatMap((recipe) => recipe.tags)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [recipes]);

  const filteredRecipes = useMemo(() => {
    const normalizedSearch = searchQuery
      .trim()
      .toLowerCase();

    const matchingRecipes = recipes.filter(
      (recipe) => {
        const matchesSearch =
          normalizedSearch.length === 0 ||
          recipe.title
            .toLowerCase()
            .includes(normalizedSearch) ||
          recipe.category
            .toLowerCase()
            .includes(normalizedSearch) ||
          recipe.creatorName
            .toLowerCase()
            .includes(normalizedSearch) ||
          recipe.tags.some((tag) =>
            tag
              .toLowerCase()
              .includes(normalizedSearch)
          ) ||
          recipe.ingredients.some((ingredient) =>
            ingredient
              .toLowerCase()
              .includes(normalizedSearch)
          );

        const matchesCategory =
          categoryFilter === "all" ||
          recipe.category === categoryFilter;

        const matchesTag =
          tagFilter === "all" ||
          recipe.tags.includes(tagFilter);

        return (
          matchesSearch &&
          matchesCategory &&
          matchesTag
        );
      }
    );

    return [...matchingRecipes].sort((a, b) => {
      switch (sortOption) {
        case "oldest":
          return (
            new Date(a.createdAt).getTime() -
            new Date(b.createdAt).getTime()
          );

        case "az":
          return a.title.localeCompare(b.title);

        case "za":
          return b.title.localeCompare(a.title);

        case "newest":
        default:
          return (
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
          );
      }
    });
  }, [
    recipes,
    searchQuery,
    categoryFilter,
    tagFilter,
    sortOption,
  ]);

  useEffect(() => {
  const checkInstalledMode = () => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia(
        "(display-mode: window-controls-overlay)"
      ).matches ||
      Boolean(
        (
          window.navigator as Navigator & {
            standalone?: boolean;
          }
        ).standalone
      );

    setIsInstalledApp(isStandalone);
  };

  checkInstalledMode();

  const standaloneQuery = window.matchMedia(
    "(display-mode: standalone)"
  );

  const overlayQuery = window.matchMedia(
    "(display-mode: window-controls-overlay)"
  );

  standaloneQuery.addEventListener(
    "change",
    checkInstalledMode
  );

  overlayQuery.addEventListener(
    "change",
    checkInstalledMode
  );

  return () => {
    standaloneQuery.removeEventListener(
      "change",
      checkInstalledMode
    );

    overlayQuery.removeEventListener(
      "change",
      checkInstalledMode
    );
  };
}, []);

  useEffect(() => {
  async function loadCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setCurrentUserId(user?.id ?? null);
  }

  void loadCurrentUser();
}, []);

  useEffect(() => {
  function handleOutsideClick(event: MouseEvent) {
    const target = event.target as Node;

    if (
      mobileMenuRef.current &&
      !mobileMenuRef.current.contains(target)
    ) {
      setIsMenuOpen(false);
    }

    if (
      settingsRef.current &&
      !settingsRef.current.contains(target)
    ) {
      setShowSettingsMenu(false);
    }
  }

  document.addEventListener("mousedown", handleOutsideClick);

  return () => {
    document.removeEventListener(
      "mousedown",
      handleOutsideClick
    );
  };
}, []);

  function clearFilters() {
    setSearchQuery("");
    setCategoryFilter("all");
    setTagFilter("all");
    setSortOption("newest");
  }

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    categoryFilter !== "all" ||
    tagFilter !== "all";

    function BottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-[#ead7c8] bg-white px-2 py-2 shadow-xl md:hidden">

      <button
        onClick={() => router.push("/recipes")}
        className="rounded-2xl px-2 py-2 text-[#a63a0a]"
      >
        🍳<br />Recipes
      </button>

      <button
        onClick={() => router.push("/planner")}
        className="rounded-2xl px-2 py-2 text-[#a63a0a]"
      >
        📅<br />Planner
      </button>

      <button
        onClick={() => router.push("/")}
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#a63a0a] text-4xl leading-none text-white shadow-lg"
      >
        +
      </button>

      <button
        onClick={() => router.push("/shopping")}
        className="rounded-2xl px-2 py-2 text-[#a63a0a]"
      >
        🛒<br />Shopping
      </button>

      <button
        onClick={() => router.push("/pantry")}
        className="rounded-2xl px-2 py-2 text-[#a63a0a]"
      >
        🥫<br />Pantry
      </button>
    </div>
  );
}

  return (
    <main className="min-h-screen bg-[#f8efe6] px-5 py-6 pb-32 text-[#2b1a12] md:p-8">
        <header className="mx-auto max-w-6xl py-6 md:px-6 md:py-10">
   <nav className="sticky top-0 z-50 -mx-5 mb-8 flex items-start justify-between gap-3 bg-[#f8efe6] px-5 py-4 md:-mx-6 md:px-6">
  <Link
    href="/"
    className="text-left text-3xl font-bold text-[#a63a0a]"
  >
    Hey Chef™
  </Link>

  <button
    type="button"
    onClick={() => setIsMenuOpen((open) => !open)}
    aria-expanded={isMenuOpen}
    aria-controls="community-mobile-menu"
    aria-label={
      isMenuOpen
        ? "Close navigation menu"
        : "Open navigation menu"
    }
    className="rounded-full bg-white px-4 py-3 text-3xl text-[#a63a0a] shadow md:hidden"
  >
    ☰
  </button>

  {/* Desktop navigation */}
  <div className="hidden items-center gap-8 text-lg md:flex">
    <Link
      href="/recipes"
      className="text-[#a63a0a] hover:underline hover:underline-offset-8"
    >
      Recipes
    </Link>

    <Link
      href="/planner"
      className="text-[#a63a0a] hover:underline hover:underline-offset-8"
    >
      Meal Planner
    </Link>

    <Link
      href="/shopping"
      className="text-[#a63a0a] hover:underline hover:underline-offset-8"
    >
      Shopping List
    </Link>

    <Link
      href="/pantry"
      className="text-[#a63a0a] hover:underline hover:underline-offset-8"
    >
      Pantry
    </Link>

    <div ref={settingsRef} className="relative">
      <button
        type="button"
        onClick={() =>
          setShowSettingsMenu((open) => !open)
        }
        aria-expanded={showSettingsMenu}
        className="font-bold text-[#a63a0a] underline underline-offset-8"
      >
        ⚙️ Settings
      </button>

      {showSettingsMenu && (
        <div className="absolute right-0 top-10 z-50 w-64 rounded-2xl bg-white p-2 shadow-xl">
          <p className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#6d5549]">
            Account
          </p>

          <Link
            href="/profile"
            onClick={() => setShowSettingsMenu(false)}
            className="block w-full rounded-xl px-4 py-3 text-left hover:bg-[#fff4ef]"
          >
            👤 Profile
          </Link>

          <Link
            href="/reminders"
            onClick={() => setShowSettingsMenu(false)}
            className="block w-full rounded-xl px-4 py-3 text-left hover:bg-[#fff4ef]"
          >
            🔔 Reminders
          </Link>

          <hr className="my-2 border-[#ead7c8]" />

          <p className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#6d5549]">
            Community
          </p>

          <Link
            href="/community"
            onClick={() => setShowSettingsMenu(false)}
            className="block w-full rounded-xl bg-[#fff4ef] px-4 py-3 text-left font-bold text-[#a63a0a]"
          >
            🌎 Explore Recipes
          </Link>

          <Link
            href={`/chef/${currentUserId}`}
            onClick={() => setShowSettingsMenu(false)}
            className="block w-full rounded-xl px-4 py-3 text-left hover:bg-[#fff4ef]"
          >
            👨‍🍳 My Cookbook
          </Link>

          <hr className="my-2 border-[#ead7c8]" />

          <p className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#6d5549]">
            Tools
          </p>

          <Link
            href="/add-to-hey-chef"
            onClick={() => setShowSettingsMenu(false)}
            className="block w-full rounded-xl px-4 py-3 text-left hover:bg-[#fff4ef]"
          >
            🧩 Import Tools
          </Link>

          {!isInstalledApp && (
            <button
              type="button"
              onClick={() => {
                setShowSettingsMenu(false);

                const ua =
                  navigator.userAgent.toLowerCase();

                const isIOS =
                  /iphone|ipad|ipod/.test(ua) ||
                  (navigator.platform === "MacIntel" &&
                    navigator.maxTouchPoints > 1);

                const isAndroid =
                  /android/.test(ua);

                if (isIOS) {
                  showToast(
                    "Install Hey Chef:\n\nTap Share, then Add to Home Screen."
                  );
                  return;
                }

                if (isAndroid) {
                  showToast(
                    "Install Hey Chef:\n\nTap the browser menu, then Install App or Add to Home Screen."
                  );
                  return;
                }

                showToast(
                  "Install Hey Chef:\n\nClick the install icon in your browser's address bar."
                );
              }}
              className="block w-full rounded-xl px-4 py-3 text-left hover:bg-[#fff4ef]"
            >
              📱 Install App
            </button>
          )}

          <hr className="my-2 border-[#ead7c8]" />

          <button
            type="button"
            onClick={() => {
              setShowSettingsMenu(false);
              logoutUser();
            }}
            className="block w-full rounded-xl px-4 py-3 text-left text-red-600 hover:bg-red-50"
          >
            ↪ Log Out
          </button>
        </div>
      )}
    </div>
  </div>

  {/* Mobile navigation */}
  {isMenuOpen && (
    <div
      id="community-mobile-menu"
      ref={mobileMenuRef}
      className="absolute right-0 top-16 z-50 max-h-[calc(100vh-5rem)] w-72 overflow-y-auto rounded-3xl bg-white p-4 shadow-xl md:hidden"
    >
      <p className="mb-2 px-4 text-xs font-bold uppercase tracking-[0.2em] text-[#a63a0a]">
        Account
      </p>

      <Link
        href="/profile"
        onClick={() => setIsMenuOpen(false)}
        className="block w-full rounded-xl px-4 py-3 text-left hover:bg-[#fff4ef]"
      >
        👤 Profile
      </Link>

      <Link
        href="/reminders"
        onClick={() => setIsMenuOpen(false)}
        className="block w-full rounded-xl px-4 py-3 text-left hover:bg-[#fff4ef]"
      >
        🔔 Reminders
      </Link>

      <hr className="my-3 border-[#ead7c8]" />

      <p className="mb-2 px-4 text-xs font-bold uppercase tracking-[0.2em] text-[#a63a0a]">
        Community
      </p>

      <Link
        href="/community"
        onClick={() => setIsMenuOpen(false)}
        className="block w-full rounded-xl bg-[#fff4ef] px-4 py-3 text-left font-bold text-[#a63a0a]"
      >
        🌎 Explore Recipes
      </Link>

      <Link
        href={`/chef/${currentUserId}`}
        onClick={() => setIsMenuOpen(false)}
        className="block w-full rounded-xl px-4 py-3 text-left hover:bg-[#fff4ef]"
      >
        👨‍🍳 My Cookbook
      </Link>

      <hr className="my-3 border-[#ead7c8]" />

      <p className="mb-2 px-4 text-xs font-bold uppercase tracking-[0.2em] text-[#a63a0a]">
        Tools
      </p>

      <Link
        href="/add-to-hey-chef"
        onClick={() => setIsMenuOpen(false)}
        className="block w-full rounded-xl px-4 py-3 text-left hover:bg-[#fff4ef]"
      >
        🧩 Import Tools
      </Link>

      {!isInstalledApp && (
        <button
          type="button"
          onClick={() => {
            setIsMenuOpen(false);

            const ua =
              navigator.userAgent.toLowerCase();

            const isIOS =
              /iphone|ipad|ipod/.test(ua) ||
              (navigator.platform === "MacIntel" &&
                navigator.maxTouchPoints > 1);

            const isAndroid =
              /android/.test(ua);

            if (isIOS) {
              showToast(
                "Install Hey Chef:\n\nTap Share, then Add to Home Screen."
              );
              return;
            }

            if (isAndroid) {
              showToast(
                "Install Hey Chef:\n\nTap the browser menu, then Install App or Add to Home Screen."
              );
              return;
            }

            showToast(
              "Install Hey Chef:\n\nClick the install icon in your browser's address bar."
            );
          }}
          className="block w-full rounded-xl px-4 py-3 text-left hover:bg-[#fff4ef]"
        >
          📱 Install App
        </button>
      )}

      <hr className="my-3 border-[#ead7c8]" />

      <button
        type="button"
        onClick={() => {
          setIsMenuOpen(false);
          logoutUser();
        }}
        className="block w-full rounded-xl px-4 py-3 text-left font-semibold text-red-600 hover:bg-red-50"
      >
        ↪ Log Out
      </button>
    </div>
  )}
</nav>
</header>
      <div className="mx-auto w-full max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
        <section className="rounded-[2rem] border border-[#ead7c8] bg-[#fffaf5] p-6 shadow-sm md:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#a63a0a]">
            Hey Chef Community
          </p>

          <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold md:text-5xl">
                Explore Recipes
              </h1>

              <p className="mt-3 max-w-2xl text-[#6d5549]">
                Discover public recipes shared by cooks
                across the Hey Chef community.
              </p>
            </div>

            <div className="rounded-full border border-[#ead7c8] bg-white px-4 py-2 text-sm font-bold text-[#6d5549]">
              {filteredRecipes.length}{" "}
              {filteredRecipes.length === 1
                ? "recipe"
                : "recipes"}
            </div>
          </div>

          <div className="mt-8">
            <label
              htmlFor="community-recipe-search"
              className="mb-2 block font-bold"
            >
              🍽️ What are you craving today?
            </label>

            <input
              id="community-recipe-search"
              type="search"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder='Try "Pasta", "High Protein", "Soup", or "30 Minutes"'
              className="w-full rounded-2xl border border-[#ead7c8] bg-white px-4 py-3 text-base outline-none transition focus:border-[#a63a0a] focus:ring-2 focus:ring-[#a63a0a]/20"
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <label
                htmlFor="community-category-filter"
                className="mb-2 block text-sm font-bold"
              >
                Category
              </label>

              <select
                id="community-category-filter"
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(event.target.value)
                }
                className="w-full rounded-xl border border-[#ead7c8] bg-white p-3"
              >
                <option value="all">
                  All categories
                </option>

                {categoryOptions.map((category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="community-tag-filter"
                className="mb-2 block text-sm font-bold"
              >
                Dietary and recipe tags
              </label>

              <select
                id="community-tag-filter"
                value={tagFilter}
                onChange={(event) =>
                  setTagFilter(event.target.value)
                }
                className="w-full rounded-xl border border-[#ead7c8] bg-white p-3"
              >
                <option value="all">
                  All tags
                </option>

                {tagOptions.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="community-sort"
                className="mb-2 block text-sm font-bold"
              >
                Sort
              </label>

              <select
                id="community-sort"
                value={sortOption}
                onChange={(event) =>
                  setSortOption(
                    event.target.value as SortOption
                  )
                }
                className="w-full rounded-xl border border-[#ead7c8] bg-white p-3"
              >
                <option value="newest">
                  Newest
                </option>
                <option value="oldest">
                  Oldest
                </option>
                <option value="az">
                  Recipe name A–Z
                </option>
                <option value="za">
                  Recipe name Z–A
                </option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4">
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-full border border-[#a63a0a] bg-white px-4 py-2 text-sm font-bold text-[#a63a0a] transition hover:bg-[#fff3eb]"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>

        {isLoading && (
          <div
            className="mt-8 rounded-[2rem] border border-[#ead7c8] bg-white p-10 text-center"
            role="status"
          >
            <p className="text-lg font-bold">
              Preparing the community cookbook…
            </p>

            <p className="mt-2 text-[#6d5549]">
              Loading public recipes.
            </p>
          </div>
        )}

        {!isLoading && loadError && (
          <div
            className="mt-8 rounded-[2rem] border border-[#e7b7a3] bg-white p-8 text-center"
            role="alert"
          >
            <h2 className="text-2xl font-bold">
              We could not load the cookbook
            </h2>

            <p className="mt-2 text-[#6d5549]">
              {loadError}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-full bg-[#a63a0a] px-5 py-3 font-bold text-white"
            >
              Try Again
            </button>
          </div>
        )}

        {!isLoading &&
          !loadError &&
          filteredRecipes.length === 0 && (
            <div className="mt-8 rounded-[2rem] border border-[#ead7c8] bg-white p-10 text-center">
              <div className="text-4xl" aria-hidden="true">
                🍲
              </div>

              <h2 className="mt-4 text-2xl font-bold">
                No public recipes found
              </h2>

              <p className="mt-2 text-[#6d5549]">
                Try changing your search or filters.
              </p>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 rounded-full bg-[#a63a0a] px-5 py-3 font-bold text-white"
                >
                  Show All Recipes
                </button>
              )}
            </div>
          )}

        {!isLoading &&
          !loadError &&
          filteredRecipes.length > 0 && (
            <section
              aria-label="Public recipes"
              className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
            >
              {filteredRecipes.map((recipe) => {
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
                          src={getRecipeImage(recipe)}
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
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#fff3eb] px-3 py-1 text-xs font-bold text-[#a63a0a]">
                          {recipe.category}
                        </span>

                        <span className="rounded-full border border-[#ead7c8] bg-white px-3 py-1 text-xs font-bold text-[#6d5549]">
                          🌎 Public
                        </span>
                      </div>

                      <Link
                        href={`/recipe/${recipe.id}/${recipeSlug}`}
                        className="mt-3 block"
                      >
                        <h2 className="text-2xl font-bold transition hover:text-[#a63a0a]">
                          {recipe.title}
                        </h2>
                      </Link>

                      <p className="mt-2 text-sm text-[#6d5549]">
                        Shared by{" "}
                        <span className="font-bold text-[#2b1b14]">
                          {recipe.creatorName}
                        </span>
                      </p>

                      {(recipe.cookTime ||
                        recipe.servings) && (
                        <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#6d5549]">
                          {recipe.cookTime && (
                            <span>
                              ⏱ {recipe.cookTime}
                            </span>
                          )}

                          {recipe.servings && (
                            <span>
                              🍽 {recipe.servings} servings
                            </span>
                          )}
                        </div>
                      )}

                      {recipe.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {recipe.tags
                            .slice(0, 4)
                            .map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() =>
                                  setTagFilter(tag)
                                }
                                className="rounded-full border border-[#ead7c8] bg-[#fffaf5] px-3 py-1 text-xs font-semibold text-[#6d5549] transition hover:border-[#a63a0a] hover:text-[#a63a0a]"
                              >
                                {tag}
                              </button>
                            ))}

                          {recipe.tags.length > 4 && (
                            <span className="rounded-full border border-[#ead7c8] px-3 py-1 text-xs font-semibold text-[#6d5549]">
                              +{recipe.tags.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      {recipe.sourceUrl && (
                        <div className="mt-4 border-t border-[#ead7c8] pt-4">
                          <p className="text-xs font-bold uppercase tracking-wide text-[#6d5549]">
                            Original source
                          </p>

                          <a
                            href={recipe.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-block text-sm font-bold text-[#a63a0a] underline-offset-4 hover:underline"
                          >
                            {getSourceName(
                              recipe.sourceUrl
                            )}{" "}
                            ↗
                          </a>
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
      </div>
    <BottomNav />

    {toastMessage && (
  <div
    role="status"
    aria-live="polite"
    className="fixed bottom-24 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 whitespace-pre-line rounded-2xl bg-[#2b1b14] px-5 py-4 text-center font-semibold text-white shadow-xl"
  >
    {toastMessage}
  </div>
)}

       <footer className="mt-10 border-t border-[#ead7c8] pt-6 text-center text-sm text-[#6d5549]">
          <p>© 2020–2026 Hey Chef™. All rights reserved.</p>

          <div className="mt-3 flex flex-wrap justify-center gap-6">
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="/delete-account">Delete Account</a>
            <a href="/contact">Contact</a>
          </div>
        </footer>
    </main>
  );
}