import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getFirebaseAdminMessaging } from "@/app/lib/firebaseAdmin";

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 }
      );
    }

    const accessToken = authorization.replace("Bearer ", "");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Your session could not be verified." },
        { status: 401 }
      );
    }

    const { data: pushToken, error: tokenError } =
      await supabase
        .from("push_tokens")
        .select("token")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (tokenError) {
      throw tokenError;
    }

    if (!pushToken?.token) {
      return NextResponse.json(
        {
          error:
            "No connected device was found. Connect this device first.",
        },
        { status: 404 }
      );
    }

    const messageId = await getFirebaseAdminMessaging().send({
      token: pushToken.token,
      notification: {
        title: "Hey Chef Test",
        body: "Your push notifications are working! 🎉",
      },
      webpush: {
        notification: {
          icon: "/icon-192.png",
          badge: "/icon-192.png",
        },
        fcmOptions: {
          link: "/reminders",
        },
      },
      data: {
        url: "/reminders",
      },
    });

    return NextResponse.json({
      success: true,
      messageId,
    });
  } catch (error) {
    console.error("Test notification failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not send the test notification.",
      },
      { status: 500 }
    );
  }
}