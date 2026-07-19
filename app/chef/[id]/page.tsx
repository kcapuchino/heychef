"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

type PublicProfile = {
  id: string;
  display_name?: string | null;
  bio?: string | null;
  membership_tier?: string | null;
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

type FollowedChef = {
  id: string;
  display_name?: string | null;
  bio?: string | null;
};

type FollowerChef = {
  id: string;
  display_name?: string | null;
  bio?: string | null;
};

const FALLBACK_RECIPE_IMAGE = "/hero-kitchen.jpg";
function getMembershipDetails(value?: string | null) {
  switch (value?.toLowerCase()) {
    case "premium":
      return {
        label: "Premium Chef",
        icon: "⭐",
        className:
          "border-[#d7a72f] bg-[#fff8dc] text-[#7a5700]",
      };

    case "pro":
      return {
        label: "Pro Chef",
        icon: "👑",
        className:
          "border-[#8f6cc4] bg-[#f4edff] text-[#5d348f]",
      };

    case "founding":
      return {
        label: "Founding Chef",
        icon: "🔥",
        className:
          "border-[#a63a0a] bg-[#fff3eb] text-[#a63a0a]",
      };

    case "state_employee":
      return {
        label: "State Employee Chef",
        icon: "🏛️",
        className:
          "border-[#47755b] bg-[#edf8f1] text-[#315d45]",
      };

    default:
      return {
        label: "Free Chef",
        icon: "🍳",
        className:
          "border-[#ead7c8] bg-[#fffaf5] text-[#6d5549]",
      };
  }
}

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
  const [currentUserId, setCurrentUserId] =
  useState<string | null>(null);
  const [followerCount, setFollowerCount] = useState(0);
const [followingCount, setFollowingCount] = useState(0);
const [totalLikes, setTotalLikes] = useState(0);
const [totalSaves, setTotalSaves] = useState(0);
const [isFollowing, setIsFollowing] = useState(false);
const [isUpdatingFollow, setIsUpdatingFollow] =
  useState(false);

  const [likedRecipes, setLikedRecipes] =
  useState<PublicRecipe[]>([]);

const [savedRecipes, setSavedRecipes] =
  useState<PublicRecipe[]>([]);

const [isLoadingLikedRecipes, setIsLoadingLikedRecipes] =
  useState(false);

const [isLoadingSavedRecipes, setIsLoadingSavedRecipes] =
  useState(false);

const [editDisplayName, setEditDisplayName] =
  useState("");

const [editBio, setEditBio] = useState("");

const [isSavingProfile, setIsSavingProfile] =
  useState(false);

const [statusMessage, setStatusMessage] =
  useState("");

  type ProfilePanel =
  | "recipes"
  | "likes"
  | "saved"
  | "followers"
  | "following";

const [activePanel, setActivePanel] =
  useState<ProfilePanel>("recipes");

  const [followedChefs, setFollowedChefs] =
  useState<FollowedChef[]>([]);

  const [followerChefs, setFollowerChefs] =
  useState<FollowerChef[]>([]);

const [isLoadingFollowerChefs, setIsLoadingFollowerChefs] =
  useState(false);

const [isLoadingFollowedChefs, setIsLoadingFollowedChefs] =
  useState(false);

  useEffect(() => {
    async function loadChefPage() {
      setIsLoading(true);
      setErrorMessage("");

      try {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  setCurrentUserId(user?.id ?? null);
  const signedInUserId = user?.id ?? null;

  const {
    data: profileData,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(
  "id, display_name, bio, membership_tier"
)
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

        const publicRecipes =
  (recipeData ?? []) as PublicRecipe[];

const [
  followersResult,
  followingResult,
] = await Promise.all([
  supabase
    .from("chef_follows")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("followed_id", params.id),

  supabase
    .from("chef_follows")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("follower_id", params.id),
]);

if (followersResult.error) {
  throw followersResult.error;
}

if (followingResult.error) {
  throw followingResult.error;
}

setFollowerCount(followersResult.count ?? 0);
setFollowingCount(followingResult.count ?? 0);
const publicRecipeIds = publicRecipes.map(
  (recipe) => recipe.id
);

if (publicRecipeIds.length > 0) {
  const {
    count: likesCount,
    error: likesError,
  } = await supabase
    .from("recipe_likes")
    .select("*", {
      count: "exact",
      head: true,
    })
    .in("recipe_id", publicRecipeIds);

  if (likesError) {
    throw likesError;
  }

  setTotalLikes(likesCount ?? 0);
} else {
  setTotalLikes(0);
}

if (publicRecipeIds.length > 0) {
  const {
    count: savesCount,
    error: savesError,
  } = await supabase
    .from("recipes")
    .select("*", {
      count: "exact",
      head: true,
    })
    .in("original_recipe_id", publicRecipeIds);

  if (savesError) {
    throw savesError;
  }

  setTotalSaves(savesCount ?? 0);
} else {
  setTotalSaves(0);
}

if (
  signedInUserId &&
  signedInUserId !== params.id
) {
  const {
    data: followData,
    error: followError,
  } = await supabase
    .from("chef_follows")
    .select("follower_id")
    .eq("follower_id", signedInUserId)
    .eq("followed_id", params.id)
    .maybeSingle();

  if (followError) {
    throw followError;
  }

  setIsFollowing(Boolean(followData));
} else {
  setIsFollowing(false);
}

const loadedProfile =
  profileData as PublicProfile | null;

setProfile(loadedProfile);
setRecipes(publicRecipes);

setEditDisplayName(
  loadedProfile?.display_name?.trim() || ""
);

setEditBio(loadedProfile?.bio ?? "");
      } catch (error) {
        console.error("Chef page error:", error);

        const message =
  typeof error === "object" &&
  error !== null &&
  "message" in error
    ? String(error.message)
    : "This chef page could not be loaded.";

setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    }

    void loadChefPage();
  }, [params.id]);
  
  async function loadFollowedChefs() {
  setIsLoadingFollowedChefs(true);

  try {
    const {
      data: followRows,
      error: followError,
    } = await supabase
      .from("chef_follows")
      .select("followed_id")
      .eq("follower_id", params.id);

    if (followError) {
      throw followError;
    }

    const followedIds = (followRows ?? []).map(
      (row) => row.followed_id
    );

    if (followedIds.length === 0) {
      setFollowedChefs([]);
      return;
    }

    const {
      data: profileRows,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select("id, display_name, bio")
      .in("id", followedIds);

    if (profileError) {
      throw profileError;
    }

    setFollowedChefs(
      (profileRows ?? []) as FollowedChef[]
    );
  } catch (error) {
    console.error(
      "Could not load followed chefs:",
      error
    );

    setFollowedChefs([]);
  } finally {
    setIsLoadingFollowedChefs(false);
  }
}

async function loadFollowerChefs() {
  setIsLoadingFollowerChefs(true);

  try {
    const {
      data: followRows,
      error: followError,
    } = await supabase
      .from("chef_follows")
      .select("follower_id")
      .eq("followed_id", params.id);

    if (followError) {
      throw followError;
    }

    const followerIds = (followRows ?? []).map(
      (row) => row.follower_id
    );

    if (followerIds.length === 0) {
      setFollowerChefs([]);
      return;
    }

    const {
      data: profileRows,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select("id, display_name, bio")
      .in("id", followerIds);

    if (profileError) {
      throw profileError;
    }

    setFollowerChefs(
      (profileRows ?? []) as FollowerChef[]
    );
  } catch (error) {
    console.error(
      "Could not load follower chefs:",
      error
    );

    setFollowerChefs([]);
  } finally {
    setIsLoadingFollowerChefs(false);
  }
}

async function loadLikedRecipes() {
  setIsLoadingLikedRecipes(true);

  try {
    const { data: likeRows, error: likeError } =
      await supabase
        .from("recipe_likes")
        .select("recipe_id")
        .eq("user_id", params.id);

    if (likeError) {
      throw likeError;
    }

    const recipeIds = (likeRows ?? []).map(
      (row) => row.recipe_id
    );

    if (recipeIds.length === 0) {
      setLikedRecipes([]);
      return;
    }
    

    const { data: recipeRows, error: recipeError } =
      await supabase
        .from("recipes")
        .select(
          "id, title, image_url, category, cook_time, servings, created_at"
        )
        .in("id", recipeIds)
        .eq("visibility", "public")
        .neq("type", "grocery")
        .order("created_at", { ascending: false });

    if (recipeError) {
      throw recipeError;
    }

    setLikedRecipes(
      (recipeRows ?? []) as PublicRecipe[]
    );
  } catch (error) {
    console.error(
      "Could not load liked recipes:",
      error
    );

    setLikedRecipes([]);
  } finally {
    setIsLoadingLikedRecipes(false);
  }
}
  
async function loadSavedRecipes() {
  setIsLoadingSavedRecipes(true);

  try {
    const publicRecipeIds = recipes.map(
      (recipe) => recipe.id
    );

    if (publicRecipeIds.length === 0) {
      setSavedRecipes([]);
      return;
    }

    const {
      data: savedCopies,
      error: savedCopiesError,
    } = await supabase
      .from("recipes")
      .select("original_recipe_id")
      .in("original_recipe_id", publicRecipeIds);

    if (savedCopiesError) {
      throw savedCopiesError;
    }

    const savedOriginalIds = Array.from(
      new Set(
        (savedCopies ?? [])
          .map((row) => row.original_recipe_id)
          .filter(
            (id): id is string =>
              typeof id === "string"
          )
      )
    );

    if (savedOriginalIds.length === 0) {
      setSavedRecipes([]);
      return;
    }

    const {
      data: recipeRows,
      error: recipeError,
    } = await supabase
      .from("recipes")
      .select(
        "id, title, image_url, category, cook_time, servings, created_at"
      )
      .in("id", savedOriginalIds)
      .eq("visibility", "public")
      .neq("type", "grocery")
      .order("created_at", {
        ascending: false,
      });

    if (recipeError) {
      throw recipeError;
    }

    setSavedRecipes(
      (recipeRows ?? []) as PublicRecipe[]
    );
  } catch (error) {
    console.error(
      "Could not load saved recipes:",
      error
    );

    setSavedRecipes([]);
  } finally {
    setIsLoadingSavedRecipes(false);
  }
}

  async function toggleFollow() {
  if (!currentUserId) {
    setStatusMessage(
      "Please sign in before following a chef."
    );
    return;
  }

  if (currentUserId === params.id) {
    return;
  }

  setIsUpdatingFollow(true);
  setStatusMessage("");

  try {
    if (isFollowing) {
      const { error } = await supabase
        .from("chef_follows")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("followed_id", params.id);

      if (error) {
        throw error;
      }

      setIsFollowing(false);
      setFollowerCount((count) =>
        Math.max(0, count - 1)
      );

      setStatusMessage(
        "You are no longer following this chef."
      );
    } else {
      const { error } = await supabase
        .from("chef_follows")
        .insert({
          follower_id: currentUserId,
          followed_id: params.id,
        });

      if (error) {
        throw error;
      }

      setIsFollowing(true);
      setFollowerCount((count) => count + 1);

      setStatusMessage(
        "You are now following this chef."
      );
    }
  } catch (error) {
    console.error("Follow update failed:", error);

    setStatusMessage(
      error instanceof Error
        ? error.message
        : "We could not update this follow."
    );
  } finally {
    setIsUpdatingFollow(false);
  }
}

  

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
  "Hey Chef Cook";

  const chefInitial =
  chefName.charAt(0).toUpperCase() || "H";

const isOwnProfile =
  Boolean(currentUserId) &&
  currentUserId === params.id;

const membership = getMembershipDetails(
  profile?.membership_tier
);

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

          <header className="grid gap-6 md:grid-cols-[auto_1fr_auto] md:items-center">
  <div className="flex justify-center md:justify-start">
    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#fff4ef] text-4xl font-bold text-[#a63a0a]">
      {chefInitial}
    </div>
  </div>

  <div className="text-center md:text-left">
    <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#a63a0a]">
      Hey Chef Community
    </p>

    <h1 className="mt-2 text-4xl font-bold text-[#2b1b14] md:text-5xl">
      {chefName}
    </h1>

    <div
      className={`mt-3 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${membership.className}`}
    >
      <span aria-hidden="true">
        {membership.icon}
      </span>

      {membership.label}
    </div>

    {profile?.bio ? (
      <p className="mt-4 max-w-2xl whitespace-pre-line text-base leading-7 text-[#6d5549]">
        {profile.bio}
      </p>
    ) : (
      <p className="mt-4 max-w-2xl text-[#6d5549]">
        {isOwnProfile
          ? "Add a short bio so other cooks can get to know you."
          : "Explore recipes shared publicly by this cook."}
      </p>
    )}
  </div>

  <div className="flex justify-center md:justify-end">
    {isOwnProfile ? (
      <Link
        href="/profile"
        className="inline-flex rounded-full bg-[#a63a0a] px-6 py-3 font-bold text-white transition hover:bg-[#8f3108]"
      >
        ✏️ Edit Profile
      </Link>
    ) : (
      <button
        type="button"
        onClick={toggleFollow}
        disabled={isUpdatingFollow}
        className={
          isFollowing
            ? "rounded-full border border-[#a63a0a] bg-white px-6 py-3 font-bold text-[#a63a0a]"
            : "rounded-full bg-[#a63a0a] px-6 py-3 font-bold text-white"
        }
      >
        {isUpdatingFollow
          ? "Updating…"
          : isFollowing
            ? "✓ Following"
            : "+ Follow"}
      </button>
    )}
  </div>
</header>

<div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-5">
  <button
    type="button"
    onClick={() => setActivePanel("recipes")}
    className={`rounded-2xl border px-4 py-4 text-center transition ${
      activePanel === "recipes"
        ? "border-[#a63a0a] bg-[#fff3eb]"
        : "border-[#ead7c8] bg-[#fffaf5] hover:border-[#a63a0a]"
    }`}
  >
    <span className="block text-2xl font-bold text-[#2b1b14]">
      {recipes.length}
    </span>

    <span className="mt-1 block text-sm font-semibold text-[#6d5549]">
      Recipes
    </span>
  </button>

  <button
    type="button"
    onClick={() => {
  setActivePanel("likes");
  void loadLikedRecipes();
}}
    className={`rounded-2xl border px-4 py-4 text-center transition ${
      activePanel === "likes"
        ? "border-[#a63a0a] bg-[#fff3eb]"
        : "border-[#ead7c8] bg-[#fffaf5] hover:border-[#a63a0a]"
    }`}
  >
    <span className="block text-2xl font-bold text-[#2b1b14]">
      {totalLikes}
    </span>

    <span className="mt-1 block text-sm font-semibold text-[#6d5549]">
      Likes
    </span>
  </button>

  <button
    type="button"
    onClick={() => {
  setActivePanel("saved");
  void loadSavedRecipes();
}}
    className={`rounded-2xl border px-4 py-4 text-center transition ${
      activePanel === "saved"
        ? "border-[#a63a0a] bg-[#fff3eb]"
        : "border-[#ead7c8] bg-[#fffaf5] hover:border-[#a63a0a]"
    }`}
  >
    <span className="block text-2xl font-bold text-[#2b1b14]">
      {totalSaves}
    </span>

    <span className="mt-1 block text-sm font-semibold text-[#6d5549]">
      Saved
    </span>
  </button>

  <button
    type="button"
    onClick={() => {
  setActivePanel("followers");
  void loadFollowerChefs();
}}
    className={`rounded-2xl border px-4 py-4 text-center transition ${
      activePanel === "followers"
        ? "border-[#a63a0a] bg-[#fff3eb]"
        : "border-[#ead7c8] bg-[#fffaf5] hover:border-[#a63a0a]"
    }`}
  >
    <span className="block text-2xl font-bold text-[#2b1b14]">
      {followerCount}
    </span>

    <span className="mt-1 block text-sm font-semibold text-[#6d5549]">
      Followers
    </span>
  </button>

  <button
    type="button"
    onClick={() => {
  setActivePanel("following");
  void loadFollowedChefs();
}}
    className={`col-span-2 rounded-2xl border px-4 py-4 text-center transition sm:col-span-1 ${
      activePanel === "following"
        ? "border-[#a63a0a] bg-[#fff3eb]"
        : "border-[#ead7c8] bg-[#fffaf5] hover:border-[#a63a0a]"
    }`}
  >
    <span className="block text-2xl font-bold text-[#2b1b14]">
      {followingCount}
    </span>

    <span className="mt-1 block text-sm font-semibold text-[#6d5549]">
      Following
    </span>
  </button>
</div>

{statusMessage && (
  <p
    role="status"
    aria-live="polite"
    className="mt-4 text-center text-sm font-semibold text-[#6d5549]"
  >
    {statusMessage}
  </p>
)}

</div>

{activePanel === "recipes" && (
  <>
    {recipes.length === 0 ? (
          <div className="mt-8 rounded-[2rem] border border-[#ead7c8] bg-white p-10 text-center">
            <div className="text-4xl" aria-hidden="true">
              🍲
            </div>

            <h2 className="mt-4 text-2xl font-bold text-f<Link[#2b1b14]">
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
  </>
)}

{activePanel === "likes" && (
  <section className="mt-8 rounded-[2rem] border border-[#ead7c8] bg-white p-6 md:p-8">
    <h2 className="text-3xl font-bold text-[#2b1b14]">
      Liked Recipes
    </h2>

    <p className="mt-2 text-[#6d5549]">
      Public recipes this cook has liked.
    </p>

    {isLoadingLikedRecipes ? (
      <p className="mt-6 text-[#6d5549]">
        Loading liked recipes…
      </p>
    ) : likedRecipes.length === 0 ? (
      <div className="mt-6 rounded-2xl bg-[#fffaf5] p-6 text-center">
        <p className="font-bold text-[#2b1b14]">
          No liked recipes yet
        </p>
      </div>
    ) : (
      <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {likedRecipes.map((recipe) => {
          const recipeSlug =
            createRecipeSlug(recipe.title);

          return (
            <article
              key={recipe.id}
              className="overflow-hidden rounded-[2rem] border border-[#ead7c8] bg-white shadow-sm"
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
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.src =
                        FALLBACK_RECIPE_IMAGE;
                    }}
                  />
                </div>
              </Link>

              <div className="p-5">
                <h3 className="text-xl font-bold text-[#2b1b14]">
                  {recipe.title}
                </h3>

                <Link
                  href={`/recipe/${recipe.id}/${recipeSlug}`}
                  className="mt-4 block rounded-full bg-[#a63a0a] px-5 py-3 text-center font-bold text-white"
                >
                  View Recipe
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    )}
  </section>
)}

{activePanel === "saved" && (
  <section className="mt-8 rounded-[2rem] border border-[#ead7c8] bg-white p-6 md:p-8">
    <h2 className="text-3xl font-bold text-[#2b1b14]">
      Saved Recipes
    </h2>

    <p className="mt-2 text-[#6d5549]">
      Public recipes this cook has saved.
    </p>

    {isLoadingSavedRecipes ? (
      <p className="mt-6 text-[#6d5549]">
        Loading saved recipes…
      </p>
    ) : savedRecipes.length === 0 ? (
      <div className="mt-6 rounded-2xl bg-[#fffaf5] p-6 text-center">
        <p className="font-bold text-[#2b1b14]">
          No saved recipes yet
        </p>

        <p className="mt-2 text-sm text-[#6d5549]">
          Recipes saved from the community will appear here.
        </p>
      </div>
    ) : (
      <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {savedRecipes.map((recipe) => {
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
                    🔖 Saved
                  </span>
                </div>

                <Link
                  href={`/recipe/${recipe.id}/${recipeSlug}`}
                  className="mt-3 block"
                >
                  <h3 className="text-xl font-bold text-[#2b1b14] transition hover:text-[#a63a0a]">
                    {recipe.title}
                  </h3>
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
      </div>
    )}
  </section>
)}

{activePanel === "followers" && (
  <section className="mt-8 rounded-[2rem] border border-[#ead7c8] bg-white p-6 md:p-8">
    <h2 className="text-3xl font-bold text-[#2b1b14]">
      Followers
    </h2>

    <p className="mt-2 text-[#6d5549]">
      People following this chef.
    </p>

    {isLoadingFollowerChefs ? (
      <p className="mt-6 text-[#6d5549]">
        Loading followers…
      </p>
    ) : followerChefs.length === 0 ? (
      <div className="mt-6 rounded-2xl bg-[#fffaf5] p-6 text-center">
        <p className="font-bold text-[#2b1b14]">
          No followers yet
        </p>

        <p className="mt-2 text-sm text-[#6d5549]">
          Followers will appear here when people start following this chef.
        </p>
      </div>
    ) : (
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {followerChefs.map((chef) => {
          const followerName =
            chef.display_name?.trim() ||
            "Hey Chef Cook";

          const followerInitial =
            followerName.charAt(0).toUpperCase();

          return (
            <Link
              key={chef.id}
              href={`/chef/${chef.id}`}
              className="rounded-[1.5rem] border border-[#ead7c8] bg-[#fffaf5] p-5 transition hover:-translate-y-1 hover:border-[#a63a0a] hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#fff3eb] text-xl font-bold text-[#a63a0a]">
                  {followerInitial}
                </div>

                <div className="min-w-0">
                  <h3 className="truncate text-xl font-bold text-[#2b1b14]">
                    {followerName}
                  </h3>

                  <p className="mt-1 text-sm font-semibold text-[#a63a0a]">
                    View Chef →
                  </p>
                </div>
              </div>

              {chef.bio && (
                <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#6d5549]">
                  {chef.bio}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    )}
  </section>
)}

{activePanel === "following" && (
  <section className="mt-8 rounded-[2rem] border border-[#ead7c8] bg-white p-6 md:p-8">
    <h2 className="text-3xl font-bold text-[#2b1b14]">
      Following
    </h2>

    <p className="mt-2 text-[#6d5549]">
      Chefs this person follows.
    </p>

    {isLoadingFollowedChefs ? (
      <p className="mt-6 text-[#6d5549]">
        Loading chefs…
      </p>
    ) : followedChefs.length === 0 ? (
      <div className="mt-6 rounded-2xl bg-[#fffaf5] p-6 text-center">
        <p className="font-bold text-[#2b1b14]">
          Not following anyone yet
        </p>

        <p className="mt-2 text-sm text-[#6d5549]">
          Follow cooks from the community to keep their profiles close by.
        </p>
      </div>
    ) : (
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {followedChefs.map((chef) => {
          const followedChefName =
            chef.display_name?.trim() ||
            "Hey Chef Cook";

          const followedChefInitial =
            followedChefName.charAt(0).toUpperCase();

          return (
            <Link
              key={chef.id}
              href={`/chef/${chef.id}`}
              className="rounded-[1.5rem] border border-[#ead7c8] bg-[#fffaf5] p-5 transition hover:-translate-y-1 hover:border-[#a63a0a] hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#fff3eb] text-xl font-bold text-[#a63a0a]">
                  {followedChefInitial}
                </div>

                <div className="min-w-0">
                  <h3 className="truncate text-xl font-bold text-[#2b1b14]">
                    {followedChefName}
                  </h3>

                  <p className="mt-1 text-sm font-semibold text-[#a63a0a]">
                    View Chef →
                  </p>
                </div>
              </div>

              {chef.bio && (
                <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#6d5549]">
                  {chef.bio}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    )}
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