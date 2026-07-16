import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getFirebaseAdminMessaging } from "@/app/lib/firebaseAdmin";

export async function POST(request: Request) {
  try {
    const authorization =
      request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 }
      );
    }

    const accessToken = authorization.replace(
      "Bearer ",
      ""
    );

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
        {
          error:
            "Your session could not be verified.",
        },
        { status: 401 }
      );
    }

    const { data: pushTokens, error: tokenError } =
      await supabase
        .from("push_tokens")
        .select("id, token")
        .eq("user_id", user.id)
        .eq("is_active", true);

    if (tokenError) {
      throw tokenError;
    }

    if (!pushTokens || pushTokens.length === 0) {
      return NextResponse.json(
        {
          error:
            "No connected devices were found. Connect a device first.",
        },
        { status: 404 }
      );
    }

    const messagingResponse =
      await getFirebaseAdminMessaging()
        .sendEachForMulticast({
          tokens: pushTokens.map((item) => item.token),
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

    const invalidTokenIds: string[] = [];

    messagingResponse.responses.forEach(
      (response, index) => {
        if (response.success) return;

        const errorCode = response.error?.code;

        if (
          errorCode ===
            "messaging/registration-token-not-registered" ||
          errorCode ===
            "messaging/invalid-registration-token"
        ) {
          const tokenId = pushTokens[index]?.id;

          if (tokenId) {
            invalidTokenIds.push(tokenId);
          }
        }
      }
    );

    if (invalidTokenIds.length > 0) {
      const serviceSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      );

      const { error: deactivateError } =
        await serviceSupabase
          .from("push_tokens")
          .update({
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .in("id", invalidTokenIds);

      if (deactivateError) {
        console.error(
          "Could not deactivate invalid tokens:",
          deactivateError
        );
      }
    }

    if (messagingResponse.successCount === 0) {
      return NextResponse.json(
        {
          error:
            "Firebase could not deliver the test notification to any connected device.",
          failed:
            messagingResponse.failureCount,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      devicesFound: pushTokens.length,
      sent: messagingResponse.successCount,
      failed: messagingResponse.failureCount,
    });
  } catch (error) {
    console.error(
      "Test notification failed:",
      error
    );

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