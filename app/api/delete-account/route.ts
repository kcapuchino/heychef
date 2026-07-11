import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing authentication token." },
        { status: 401 }
      );
    }

    const accessToken = authHeader.replace("Bearer ", "");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      console.error("Missing Supabase environment variables.");

      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 }
      );
    }

    // This client verifies which signed-in user made the request.
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Your session is invalid or has expired." },
        { status: 401 }
      );
    }

    // This server-only client can delete protected records and Auth users.
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const userId = user.id;

    // Delete dependent data before deleting the Auth account.
    // Each delete is limited to this authenticated user's ID.
    const tables = [
  "recently_made",
  "meal_plan",
  "shopping_items",
  "pantry_items",
  "ingredient_images",
  "recipes",
];
    for (const table of tables) {
      const { error } = await adminClient
        .from(table)
        .delete()
        .eq("user_id", userId);

      if (error) {
        // profiles may use id instead of user_id, so handle it separately below.
        if (table !== "profiles") {
          console.error(`Could not delete ${table}:`, error);
          throw new Error(`Could not delete account data from ${table}.`);
        }
      }
    }

    // Your profiles table uses id = auth user ID.
    const { error: profileError } = await adminClient
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      console.error("Could not delete profile:", profileError);
      throw new Error("Could not delete profile.");
    }

    const { error: deleteUserError } =
      await adminClient.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      console.error("Could not delete Auth user:", deleteUserError);

      return NextResponse.json(
        {
          error:
            "Your saved data was removed, but the account could not be fully deleted. Please contact support.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Delete account route error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not delete your account.",
      },
      { status: 500 }
    );
  }
}