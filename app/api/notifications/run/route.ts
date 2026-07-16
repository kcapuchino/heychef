import { NextResponse } from "next/server";
import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { getFirebaseAdminMessaging } from "@/app/lib/firebaseAdmin";
import {
  getNextDailyRun,
  getNextHydrationRun,
  getNextWeeklyRun,
} from "@/app/lib/notificationSchedule";

type NotificationJob = {
  id: string;
  user_id: string;
  reminder_type:
    | "weekly_meal_plan"
    | "weekly_shopping"
    | "breakfast"
    | "lunch"
    | "dinner"
    | "hydration";
  title: string;
  body: string;
  destination_url: string | null;
};
type MealType = "breakfast" | "lunch" | "dinner";

type PlannedMealRow = {
  title: string | null;
  recipes:
    | {
        title: string | null;
      }
    | {
        title: string | null;
      }[]
    | null;
};
type ReminderSettingsRow = {
  timezone: string | null;

  weekly_meal_plan_day: number | null;
  weekly_meal_plan_time: string | null;

  weekly_shopping_day: number | null;
  weekly_shopping_time: string | null;

  breakfast_time: string | null;
  lunch_time: string | null;
  dinner_time: string | null;

  hydration_interval_hours: 1 | 2 | 3 | null;
  hydration_start_time: string | null;
  hydration_end_time: string | null;
  hydration_days: number[] | null;
};

function cleanTime(value: string | null, fallback: string) {
  return value?.slice(0, 5) ?? fallback;
}

function calculateNextRun(
  job: NotificationJob,
  settings: ReminderSettingsRow
) {
  const timezone =
    settings.timezone || "America/Indiana/Indianapolis";

  switch (job.reminder_type) {
    case "weekly_meal_plan":
      return getNextWeeklyRun({
        weekday: settings.weekly_meal_plan_day ?? 0,
        time: cleanTime(
          settings.weekly_meal_plan_time,
          "17:00"
        ),
        timezone,
      });

    case "weekly_shopping":
      return getNextWeeklyRun({
        weekday: settings.weekly_shopping_day ?? 5,
        time: cleanTime(
          settings.weekly_shopping_time,
          "16:00"
        ),
        timezone,
      });

    case "breakfast":
      return getNextDailyRun({
        time: cleanTime(settings.breakfast_time, "09:00"),
        timezone,
      });

    case "lunch":
      return getNextDailyRun({
        time: cleanTime(settings.lunch_time, "12:00"),
        timezone,
      });

    case "dinner":
      return getNextDailyRun({
        time: cleanTime(settings.dinner_time, "19:00"),
        timezone,
      });

    case "hydration":
      return getNextHydrationRun({
        intervalHours:
          settings.hydration_interval_hours ?? 2,
        startTime: cleanTime(
          settings.hydration_start_time,
          "08:00"
        ),
        endTime: cleanTime(
          settings.hydration_end_time,
          "20:00"
        ),
        days:
          settings.hydration_days ?? [1, 2, 3, 4, 5],
        timezone,
      });

    default:
      throw new Error(
        `Unsupported reminder type: ${job.reminder_type}`
      );
  }
}
function getDateInTimezone(
  date: Date,
  timezone: string
): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find(
    (part) => part.type === "year"
  )?.value;

  const month = parts.find(
    (part) => part.type === "month"
  )?.value;

  const day = parts.find(
    (part) => part.type === "day"
  )?.value;

  return `${year}-${month}-${day}`;
}

function getRecipeTitle(
  plannedMeal: PlannedMealRow
): string | null {
  if (plannedMeal.title?.trim()) {
    return plannedMeal.title.trim();
  }

  if (Array.isArray(plannedMeal.recipes)) {
    return plannedMeal.recipes[0]?.title?.trim() || null;
  }

  return plannedMeal.recipes?.title?.trim() || null;
}

async function getMealNotification({
  supabase,
  userId,
  meal,
  timezone,
  fallbackTitle,
  fallbackBody,
}: {
  supabase: SupabaseClient;
  userId: string;
  meal: MealType;
  timezone: string;
  fallbackTitle: string;
  fallbackBody: string;
}) {
  const today = getDateInTimezone(new Date(), timezone);

  const { data, error } = await supabase
    .from("meal_plan")
    .select(`
      title,
      recipes (
        title
      )
    `)
    .eq("user_id", userId)
    .eq("date", today)
    .ilike("meal", meal)
    .eq("is_made", false);

  if (error) {
    console.error(
      `Could not load today's ${meal}:`,
      error
    );

    return {
      title: fallbackTitle,
      body: fallbackBody,
    };
  }

  const mealTitles = (
    (data || []) as PlannedMealRow[]
  )
    .map(getRecipeTitle)
    .filter(
      (title): title is string => Boolean(title)
    );

  const uniqueTitles = [...new Set(mealTitles)];

  if (uniqueTitles.length === 0) {
    return {
      title: fallbackTitle,
      body: fallbackBody,
    };
  }

  const mealLabel =
    meal.charAt(0).toUpperCase() + meal.slice(1);

  if (uniqueTitles.length === 1) {
    return {
      title: `${mealLabel} is planned!`,
      body: `Remember, you're having ${uniqueTitles[0]} today. 💛`,
    };
  }

  if (uniqueTitles.length === 2) {
    return {
      title: `${mealLabel} is planned!`,
      body: `You're having ${uniqueTitles[0]} and ${uniqueTitles[1]} today. 💛`,
    };
  }

  return {
    title: `${mealLabel} is planned!`,
    body: `You have ${uniqueTitles.length} items planned for ${meal}. Open Hey Chef to see them. 💛`,
  };
}

async function getShoppingNotification({
  supabase,
  userId,
}: {
  supabase: SupabaseClient;
  userId: string;
}) {
  const { data, error } = await supabase
    .from("shopping_items")
    .select("id, checked")
    .eq("user_id", userId);

  if (error) {
    console.error("Could not load shopping items:", error);

    return {
      title: "Shopping list check",
      body: "Review your shopping list before your next trip.",
    };
  }

  const total = data?.length ?? 0;
  const remaining =
    data?.filter((item) => !item.checked).length ?? 0;

  if (total === 0) {
    return {
      title: "Time to review your shopping list",
      body: "Your list is empty. Add anything you need for the week.",
    };
  }

  if (remaining === 0) {
    return {
      title: "Shopping list complete!",
      body: `You checked off all ${total} items. Nice work! 🎉`,
    };
  }

  return {
    title: "Shopping trip coming up",
    body: `You have ${remaining} ${
      remaining === 1 ? "item" : "items"
    } left to buy.`,
  };
}

async function getWeeklyPlanningNotification({
  supabase,
  userId,
  timezone,
}: {
  supabase: SupabaseClient;
  userId: string;
  timezone: string;
}) {
  const today = new Date();

  const localDay = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  }).format(today);

  const dayIndex = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
  ].indexOf(localDay);

  const daysUntilNextMonday =
    dayIndex === 0 ? 1 : 8 - dayIndex;

  const nextMonday = new Date(today);

  nextMonday.setDate(
    nextMonday.getDate() + daysUntilNextMonday
  );

  const nextWeekStart = getDateInTimezone(
    nextMonday,
    timezone
  );

  const { data, error } = await supabase
    .from("meal_plan")
    .select("id")
    .eq("user_id", userId)
    .eq("week_start", nextWeekStart)
    .eq("is_made", false);

  if (error) {
    console.error("Could not count next week's meals:", error);

    return {
      title: "Plan your week",
      body: "Take a few minutes to plan your meals for the week.",
    };
  }

  const plannedCount = Math.min(data?.length ?? 0, 21);

  if (plannedCount === 0) {
    return {
      title: "Time to plan next week",
      body: "You have 0 of 21 meal slots planned.",
    };
  }

  if (plannedCount >= 21) {
    return {
      title: "Your week is planned!",
      body: "All 21 meal slots are ready. 🎉",
    };
  }

  return {
    title: "Keep planning your week",
    body: `You have ${plannedCount} of 21 meal slots planned.`,
  };
}

export async function POST(request: Request) {
  try {
    const cronSecret = request.headers.get("x-cron-secret");

    if (
      !process.env.CRON_SECRET ||
      cronSecret !== process.env.CRON_SECRET
    ) {
      return NextResponse.json(
        { error: "Unauthorized cron request." },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const now = new Date().toISOString();

    const { data: dueJobs, error: jobsError } =
      await supabase
        .from("notification_jobs")
        .select(
          `
            id,
            user_id,
            reminder_type,
            title,
            body,
            destination_url
          `
        )
        .eq("enabled", true)
        .lte("next_run_at", now)
        .order("next_run_at", { ascending: true })
        .limit(100);

    if (jobsError) {
      throw jobsError;
    }

    if (!dueJobs || dueJobs.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: "No reminders are currently due.",
      });
    }

    let sentCount = 0;
    let failedCount = 0;

    const results: Array<{
      jobId: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const rawJob of dueJobs) {
      const job = rawJob as NotificationJob;

      try {
        const [
          { data: tokens, error: tokensError },
          { data: settings, error: settingsError },
        ] = await Promise.all([
          supabase
            .from("push_tokens")
            .select("id, token")
            .eq("user_id", job.user_id)
            .eq("is_active", true),

          supabase
            .from("reminder_settings")
            .select(
              `
                timezone,
                weekly_meal_plan_day,
                weekly_meal_plan_time,
                weekly_shopping_day,
                weekly_shopping_time,
                breakfast_time,
                lunch_time,
                dinner_time,
                hydration_interval_hours,
                hydration_start_time,
                hydration_end_time,
                hydration_days
              `
            )
            .eq("user_id", job.user_id)
            .maybeSingle(),
        ]);

        if (tokensError) {
          throw tokensError;
        }

        if (settingsError) {
          throw settingsError;
        }

        if (!settings) {
          throw new Error(
            "Reminder settings could not be found."
          );
        }

        if (!tokens || tokens.length === 0) {
          throw new Error(
            "No active notification devices were found."
          );
        }

        const destinationUrl =
  job.destination_url || "/reminders";

let notificationTitle = job.title;
let notificationBody = job.body;

if (job.reminder_type === "weekly_meal_plan") {
  const personalizedNotification =
    await getWeeklyPlanningNotification({
      supabase,
      userId: job.user_id,
      timezone:
        settings.timezone ||
        "America/Indiana/Indianapolis",
    });

  notificationTitle =
    personalizedNotification.title;

  notificationBody =
    personalizedNotification.body;
}

if (job.reminder_type === "weekly_shopping") {
  const personalizedNotification =
    await getShoppingNotification({
      supabase,
      userId: job.user_id,
    });

  notificationTitle =
    personalizedNotification.title;

  notificationBody =
    personalizedNotification.body;
}

if (
  job.reminder_type === "breakfast" ||
  job.reminder_type === "lunch" ||
  job.reminder_type === "dinner"
) {
  const personalizedNotification =
    await getMealNotification({
      supabase,
      userId: job.user_id,
      meal: job.reminder_type,
      timezone:
        settings.timezone ||
        "America/Indiana/Indianapolis",
      fallbackTitle: job.title,
      fallbackBody: job.body,
    });

  notificationTitle =
    personalizedNotification.title;

  notificationBody =
    personalizedNotification.body;
}

const messagingResponse =
  await getFirebaseAdminMessaging().sendEachForMulticast({
    tokens: tokens.map((item) => item.token),
    notification: {
      title: notificationTitle,
      body: notificationBody,

            },
            webpush: {
              notification: {
                icon: "/icon-192.png",
                badge: "/icon-192.png",
              },
              fcmOptions: {
                link: destinationUrl,
              },
            },
            data: {
              url: destinationUrl,
              reminderType: job.reminder_type,
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
              const tokenId = tokens[index]?.id;

              if (tokenId) {
                invalidTokenIds.push(tokenId);
              }
            }
          }
        );

        if (invalidTokenIds.length > 0) {
          const { error: deactivateError } = await supabase
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
          throw new Error(
            "Firebase could not deliver this reminder to any device."
          );
        }

        const nextRunAt = calculateNextRun(
          job,
          settings as ReminderSettingsRow
        );

        const { error: updateError } = await supabase
          .from("notification_jobs")
          .update({
            last_sent_at: new Date().toISOString(),
            next_run_at: nextRunAt,
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);

        if (updateError) {
          throw updateError;
        }

        sentCount += 1;

        results.push({
          jobId: job.id,
          success: true,
        });
      } catch (jobError) {
        failedCount += 1;

        console.error(
          `Notification job ${job.id} failed:`,
          jobError
        );

        results.push({
          jobId: job.id,
          success: false,
          error:
            jobError instanceof Error
              ? jobError.message
              : "Unknown notification error.",
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: dueJobs.length,
      sent: sentCount,
      failed: failedCount,
      results,
    });
  } catch (error) {
    console.error("Notification runner failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not run scheduled notifications.",
      },
      { status: 500 }
    );
  }
}