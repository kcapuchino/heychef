"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { requestFirebaseNotificationToken } from "../lib/firebaseNotifications";
import {
  getNextDailyRun,
  getNextHydrationRun,
  getNextWeeklyRun,
} from "../lib/notificationSchedule";

type HydrationInterval = 1 | 2 | 3;

type ReminderSettings = {
  notificationsEnabled: boolean;

  weeklyMealPlanEnabled: boolean;
  weeklyMealPlanDay: number;
  weeklyMealPlanTime: string;

  weeklyShoppingEnabled: boolean;
  weeklyShoppingDay: number;
  weeklyShoppingTime: string;

  breakfastEnabled: boolean;
  breakfastTime: string;

  lunchEnabled: boolean;
  lunchTime: string;

  dinnerEnabled: boolean;
  dinnerTime: string;

  hydrationEnabled: boolean;
  hydrationIntervalHours: HydrationInterval;
  hydrationStartTime: string;
  hydrationEndTime: string;
  hydrationDays: number[];
};

const defaultSettings: ReminderSettings = {
  notificationsEnabled: true,

  weeklyMealPlanEnabled: false,
  weeklyMealPlanDay: 0,
  weeklyMealPlanTime: "17:00",

  weeklyShoppingEnabled: false,
  weeklyShoppingDay: 5,
  weeklyShoppingTime: "16:00",

  breakfastEnabled: false,
  breakfastTime: "09:00",

  lunchEnabled: false,
  lunchTime: "12:00",

  dinnerEnabled: false,
  dinnerTime: "19:00",

  hydrationEnabled: false,
  hydrationIntervalHours: 2,
  hydrationStartTime: "08:00",
  hydrationEndTime: "20:00",
  hydrationDays: [1, 2, 3, 4, 5],
};

const weekDays = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
];

export default function RemindersPage() {
  const router = useRouter();

  const [settings, setSettings] =
    useState<ReminderSettings>(defaultSettings);
    const settingsRequestId = useRef(0);

  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [message, setMessage] = useState("");
  const [firebaseToken, setFirebaseToken] = useState("");
  const [deviceConnected, setDeviceConnected] =
  useState(false);
  const [showDeviceInstructions, setShowDeviceInstructions] =
    useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission | "unsupported">("default");

useEffect(() => {
  void loadReminderSettings(true);

  if ("Notification" in window) {
    setNotificationPermission(Notification.permission);
  } else {
    setNotificationPermission("unsupported");
  }
}, []);

useEffect(() => {
  if (!userId) return;

  const channel = supabase
    .channel(`reminder-settings-live-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "reminder_settings",
        filter: `user_id=eq.${userId}`,
      },
      () => {
        void loadReminderSettings(false);
      }
    )
    .subscribe();

  function refreshWhenVisible() {
    if (document.visibilityState === "visible") {
      void loadReminderSettings(false);
    }
  }

  document.addEventListener(
    "visibilitychange",
    refreshWhenVisible
  );

  return () => {
    document.removeEventListener(
      "visibilitychange",
      refreshWhenVisible
    );

    void supabase.removeChannel(channel);
  };
}, [userId]);

  useEffect(() => {
  async function checkDeviceConnection() {
    if (notificationPermission !== "granted") return;

    try {
      const token =
        await requestFirebaseNotificationToken();

      if (!token) return;

      setFirebaseToken(token);
      setDeviceConnected(true);
    } catch (error) {
      console.error(
        "Could not restore notification connection:",
        error
      );
    }
  }

  void checkDeviceConnection();
}, [notificationPermission]);

  async function createFirebaseToken() {
  setMessage("");

  try {
    const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) {
  throw new Error(
    "Please sign in before enabling notifications."
  );
}

    const token =
      await requestFirebaseNotificationToken();

    const { error: tokenError } = await supabase
      .from("push_tokens")
      .upsert(
        {
          user_id: user.id,
          token,
          device_name:
            navigator.platform || "Unknown device",
          user_agent: navigator.userAgent,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "token",
        }
      );

    if (tokenError) {
      throw tokenError;
    }

    setFirebaseToken(token);
    setDeviceConnected(true);
    setNotificationPermission("granted");

    setMessage(
      "This device is connected to Hey Chef notifications."
    );

    console.log(
      "Firebase notification token saved:",
      token
    );
  } catch (error) {
    console.error(
      "Could not connect this device:",
      error
    );

    setMessage(
      error instanceof Error
        ? error.message
        : "Could not connect this device to notifications."
    );
  }
}

async function sendTestNotification() {
  setMessage(
    "Test will send in 5 seconds. Switch to another tab now."
  );
  setIsSendingTest(true);

  try {
    await new Promise((resolve) => {
      window.setTimeout(resolve, 5000);
    });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error(
        "Please sign in before sending a test notification."
      );
    }

    const response = await fetch("/api/notifications/test", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error || "Could not send the test notification."
      );
    }

    setMessage(
  `Test sent to ${result.sent} of ${result.devicesFound} connected devices.`
);
  } catch (error) {
    console.error("Test notification error:", error);

    setMessage(
      error instanceof Error
        ? error.message
        : "Could not send the test notification."
    );
  } finally {
    setIsSendingTest(false);
  }
}

  async function loadReminderSettings(
  showLoadingScreen = false
) {
  const requestId = ++settingsRequestId.current;

  if (showLoadingScreen) {
    setIsLoading(true);
  }

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      router.push("/");
      return;
    }

    setUserId(user.id);

    const { data, error } = await supabase
      .from("reminder_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    // Ignore an older request if a newer request already started.
    if (requestId !== settingsRequestId.current) {
      return;
    }

    if (data) {
      setSettings({
        notificationsEnabled:
          data.notifications_enabled ?? true,

        weeklyMealPlanEnabled:
          data.weekly_meal_plan_enabled ?? false,
        weeklyMealPlanDay:
          data.weekly_meal_plan_day ?? 0,
        weeklyMealPlanTime:
          data.weekly_meal_plan_time?.slice(0, 5) ??
          "17:00",

        weeklyShoppingEnabled:
          data.weekly_shopping_enabled ?? false,
        weeklyShoppingDay:
          data.weekly_shopping_day ?? 5,
        weeklyShoppingTime:
          data.weekly_shopping_time?.slice(0, 5) ??
          "16:00",

        breakfastEnabled:
          data.breakfast_enabled ?? false,
        breakfastTime:
          data.breakfast_time?.slice(0, 5) ??
          "09:00",

        lunchEnabled:
          data.lunch_enabled ?? false,
        lunchTime:
          data.lunch_time?.slice(0, 5) ??
          "12:00",

        dinnerEnabled:
          data.dinner_enabled ?? false,
        dinnerTime:
          data.dinner_time?.slice(0, 5) ??
          "19:00",

        hydrationEnabled:
          data.hydration_enabled ?? false,
        hydrationIntervalHours:
          (data.hydration_interval_hours ??
            2) as HydrationInterval,
        hydrationStartTime:
          data.hydration_start_time?.slice(0, 5) ??
          "08:00",
        hydrationEndTime:
          data.hydration_end_time?.slice(0, 5) ??
          "20:00",
        hydrationDays:
          data.hydration_days ?? [1, 2, 3, 4, 5],
      });
    }
  } catch (error) {
    console.error(
      "Could not load reminder settings:",
      error
    );

    if (requestId === settingsRequestId.current) {
      setMessage(
        "Could not load your reminder settings."
      );
    }
  } finally {
    if (
      showLoadingScreen &&
      requestId === settingsRequestId.current
    ) {
      setIsLoading(false);
    }
  }
}

  async function requestNotificationPermission() {
    setMessage("");

    if (!("Notification" in window)) {
      setNotificationPermission("unsupported");
      setMessage(
        "Notifications are not supported in this browser."
      );
      return;
    }

    try {
      const permission = await Notification.requestPermission();

      setNotificationPermission(permission);

      if (permission === "granted") {
        setSettings((current) => ({
          ...current,
          notificationsEnabled: true,
        }));

        setMessage("Notifications are enabled on this device.");

        new Notification("Hey Chef notifications are ready", {
          body: "Your meal and hydration reminders can now appear on this device.",
          icon: "/icon-192.png",
        });
      } else if (permission === "denied") {
        setMessage(
          "Notifications are blocked. You can enable them in your browser or device settings."
        );
      }
    } catch (error) {
      console.error("Notification permission error:", error);
      setMessage("Could not enable notifications.");
    }
  }

  function updateSetting<K extends keyof ReminderSettings>(
    key: K,
    value: ReminderSettings[K]
  ) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function toggleMasterNotifications(enabled: boolean) {
    setSettings((current) => ({
      ...current,
      notificationsEnabled: enabled,
    }));

    setMessage(
      enabled
        ? "Hey Chef reminders are active again. Save your settings to keep this change."
        : "All Hey Chef reminders are paused. Your individual reminder times are still saved."
    );
  }

  function toggleHydrationDay(day: number) {
    setSettings((current) => {
      const isSelected = current.hydrationDays.includes(day);

      return {
        ...current,
        hydrationDays: isSelected
          ? current.hydrationDays.filter(
              (selectedDay) => selectedDay !== day
            )
          : [...current.hydrationDays, day].sort(
              (first, second) => first - second
            ),
      };
    });
  }

  async function syncNotificationJobs(
  currentSettings: ReminderSettings
) {
  if (!userId) {
    throw new Error(
      "Please sign in before scheduling reminders."
    );
  }

  const timezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone;

  const jobs = [
    {
      user_id: userId,
      reminder_type: "weekly_meal_plan",
      enabled:
        currentSettings.notificationsEnabled &&
        currentSettings.weeklyMealPlanEnabled,
      next_run_at: getNextWeeklyRun({
        weekday: currentSettings.weeklyMealPlanDay,
        time: currentSettings.weeklyMealPlanTime,
        timezone,
      }),
      title: "Plan your week",
      body: "Take a few minutes to plan your meals for the week.",
      destination_url: "/planner",
      updated_at: new Date().toISOString(),
    },
    {
      user_id: userId,
      reminder_type: "weekly_shopping",
      enabled:
        currentSettings.notificationsEnabled &&
        currentSettings.weeklyShoppingEnabled,
      next_run_at: getNextWeeklyRun({
        weekday: currentSettings.weeklyShoppingDay,
        time: currentSettings.weeklyShoppingTime,
        timezone,
      }),
      title: "Shopping list check",
      body: "Review your shopping list before your next trip.",
      destination_url: "/shopping",
      updated_at: new Date().toISOString(),
    },
    {
      user_id: userId,
      reminder_type: "breakfast",
      enabled:
        currentSettings.notificationsEnabled &&
        currentSettings.breakfastEnabled,
      next_run_at: getNextDailyRun({
        time: currentSettings.breakfastTime,
        timezone,
      }),
      title: "Time for breakfast!",
      body: "Don’t forget to eat 💛",
      destination_url: "/planner",
      updated_at: new Date().toISOString(),
    },
    {
      user_id: userId,
      reminder_type: "lunch",
      enabled:
        currentSettings.notificationsEnabled &&
        currentSettings.lunchEnabled,
      next_run_at: getNextDailyRun({
        time: currentSettings.lunchTime,
        timezone,
      }),
      title: "Time for lunch!",
      body: "Don’t forget to eat 💛",
      destination_url: "/planner",
      updated_at: new Date().toISOString(),
    },
    {
      user_id: userId,
      reminder_type: "dinner",
      enabled:
        currentSettings.notificationsEnabled &&
        currentSettings.dinnerEnabled,
      next_run_at: getNextDailyRun({
        time: currentSettings.dinnerTime,
        timezone,
      }),
      title: "Time for dinner!",
      body: "Don’t forget to eat 💛",
      destination_url: "/planner",
      updated_at: new Date().toISOString(),
    },
    {
      user_id: userId,
      reminder_type: "hydration",
      enabled:
        currentSettings.notificationsEnabled &&
        currentSettings.hydrationEnabled,
      next_run_at: getNextHydrationRun({
        intervalHours:
          currentSettings.hydrationIntervalHours,
        startTime: currentSettings.hydrationStartTime,
        endTime: currentSettings.hydrationEndTime,
        days: currentSettings.hydrationDays,
        timezone,
      }),
      title: "Hydration check",
      body: "Take a moment to drink some water 💧",
      destination_url: "/reminders",
      updated_at: new Date().toISOString(),
    },
  ];

  console.log("Jobs being sent to Supabase:", jobs);

const { data, error } = await supabase
  .from("notification_jobs")
  .upsert(jobs, {
    onConflict: "user_id,reminder_type",
  })
  .select();

console.log("Notification jobs result:", {
  data,
  error,
});

if (error) {
  throw error;
}

if (!data || data.length === 0) {
  throw new Error(
    "No notification jobs were created."
  );
}
}

async function saveReminderSettings() {
    if (!userId) {
      setMessage("Please sign in before saving reminders.");
      return;
    }

    if (
      settings.notificationsEnabled &&
      settings.hydrationEnabled &&
      settings.hydrationDays.length === 0
    ) {
      setMessage(
        "Choose at least one day for hydration reminders."
      );
      return;
    }

    if (
      settings.notificationsEnabled &&
      settings.hydrationEnabled &&
      settings.hydrationStartTime >= settings.hydrationEndTime
    ) {
      setMessage(
        "The hydration end time must be later than the start time."
      );
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const { error } = await supabase
        .from("reminder_settings")
        .upsert(
          {
            user_id: userId,

            notifications_enabled:
              settings.notificationsEnabled,

            weekly_meal_plan_enabled:
              settings.weeklyMealPlanEnabled,
            weekly_meal_plan_day:
              settings.weeklyMealPlanDay,
            weekly_meal_plan_time:
              settings.weeklyMealPlanTime,

            weekly_shopping_enabled:
              settings.weeklyShoppingEnabled,
            weekly_shopping_day:
              settings.weeklyShoppingDay,
            weekly_shopping_time:
              settings.weeklyShoppingTime,

            breakfast_enabled:
              settings.breakfastEnabled,
            breakfast_time:
              settings.breakfastTime,

            lunch_enabled:
              settings.lunchEnabled,
            lunch_time:
              settings.lunchTime,

            dinner_enabled:
              settings.dinnerEnabled,
            dinner_time:
              settings.dinnerTime,

            hydration_enabled:
              settings.hydrationEnabled,
            hydration_interval_hours:
              settings.hydrationIntervalHours,
            hydration_start_time:
              settings.hydrationStartTime,
            hydration_end_time:
              settings.hydrationEndTime,
            hydration_days:
              settings.hydrationDays,

            timezone:
              Intl.DateTimeFormat().resolvedOptions().timeZone,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          }
        );

      if (error) {
  throw error;
}

await syncNotificationJobs(settings);
await loadReminderSettings(false);

      setMessage(
        settings.notificationsEnabled
          ? "Your reminder settings were saved."
          : "All reminders are paused. Your times and choices are still saved."
      );
    } catch (error) {
      console.error("Could not save reminder settings:", error);
      setMessage("Could not save your reminder settings.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#fffaf5] px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-6 shadow-lg">
          <p className="text-[#6d5549]">
            Loading your reminders...
          </p>
        </div>
      </main>
    );
  }

  const controlsDisabled = !settings.notificationsEnabled;

  return (
    <main className="min-h-screen bg-[#f8efe6] px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#ead7c8] bg-white text-xl shadow-sm"
            aria-label="Go back"
          >
            ←
          </button>

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#a63a0a]">
              Hey Chef
            </p>

            <h1 className="text-3xl font-bold text-[#2b1b14]">
              Reminders
            </h1>
          </div>
        </div>

        <section className="mb-5 rounded-[2rem] border border-[#ead7c8] bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#2b1b14]">
                Hey Chef reminders
              </h2>

              <p className="mt-1 text-[#6d5549]">
                Pause every reminder without losing your saved days
                and times.
              </p>
            </div>

            <Toggle
              checked={settings.notificationsEnabled}
              onChange={toggleMasterNotifications}
              label="Hey Chef reminders"
            />
          </div>

          <p
            className={`mt-4 rounded-2xl p-4 text-sm font-medium ${
              settings.notificationsEnabled
                ? "bg-[#edf7ed] text-[#27632a]"
                : "bg-[#fff4ef] text-[#6d5549]"
            }`}
          >
            {settings.notificationsEnabled
              ? "Reminders are active."
              : "All reminders are paused."}
          </p>
        </section>

        <section className="mb-5 rounded-[2rem] border border-[#ead7c8] bg-white p-6 shadow-sm">
  <div>
    <h2 className="text-xl font-bold text-[#2b1b14]">
      Device notifications
    </h2>

    <p className="mt-1 text-[#6d5549]">
      Allow this browser or installed app to show notifications.
    </p>
  </div>

  <div className="mt-5">
    {deviceConnected ? (
      <div className="rounded-2xl bg-[#edf7ed] px-4 py-3 text-sm font-bold text-[#27632a]">
        ✓ This device is connected
      </div>
    ) : (
      <button
        type="button"
        onClick={() => void createFirebaseToken()}
        disabled={notificationPermission === "unsupported"}
        className="w-full rounded-full bg-[#a63a0a] px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {notificationPermission === "granted"
          ? "Connect This Device"
          : "Enable Notifications"}
      </button>
    )}
  </div>

  {firebaseToken && (
    <button
      type="button"
      onClick={() => void sendTestNotification()}
      disabled={isSendingTest}
      className="mt-4 w-full rounded-full border border-[#a63a0a] px-4 py-3 text-sm font-bold text-[#a63a0a] disabled:cursor-wait disabled:opacity-60"
    >
      {isSendingTest
        ? "Sending Test..."
        : "Send Test Notification"}
    </button>
  )}

  {notificationPermission === "granted" && (
    <button
      type="button"
      onClick={() =>
        setShowDeviceInstructions((current) => !current)
      }
      className="mt-4 block w-full text-center text-sm font-bold text-[#a63a0a] underline"
    >
      {showDeviceInstructions
        ? "Hide device instructions"
        : "Turn off device permission completely"}
    </button>
  )}

  {message && (
    <div className="mt-4 rounded-2xl border border-[#ead7c8] bg-[#fffaf5] p-4 text-sm text-[#6d5549]">
      {message}
    </div>
  )}

  {notificationPermission === "denied" && (
    <div className="mt-4 rounded-2xl bg-[#fff4ef] p-4 text-sm text-[#6d5549]">
      <p>
        Notifications are blocked in your device or browser settings.
      </p>

      <button
        type="button"
        onClick={() =>
          setShowDeviceInstructions((current) => !current)
        }
        className="mt-3 font-bold text-[#a63a0a] underline"
      >
        {showDeviceInstructions
          ? "Hide instructions"
          : "How to change notification permission"}
      </button>
    </div>
  )}

  {showDeviceInstructions && (
    <div className="mt-4 space-y-3 rounded-2xl border border-[#ead7c8] bg-[#fffaf5] p-4 text-sm leading-6 text-[#6d5549]">
      <p>
        <strong className="text-[#2b1b14]">
          Hey Chef switch:
        </strong>{" "}
        Turn off “Hey Chef reminders” above to pause all reminders
        while keeping your saved schedule.
      </p>

      <p>
        <strong className="text-[#2b1b14]">
          iPhone or iPad:
        </strong>{" "}
        Open Settings → Notifications → Hey Chef, then turn off
        Allow Notifications.
      </p>

      <p>
        <strong className="text-[#2b1b14]">
          Android:
        </strong>{" "}
        Open Settings → Apps → Hey Chef → Notifications, then turn
        notifications off.
      </p>

      <p>
        <strong className="text-[#2b1b14]">
          Desktop Chrome:
        </strong>{" "}
        Open the site controls beside the web address, choose Site
        settings, then change Notifications to Block.
      </p>
    </div>
  )}

  {notificationPermission === "unsupported" && (
    <p className="mt-4 rounded-2xl bg-[#fff4ef] p-4 text-sm text-[#6d5549]">
      This browser does not support notifications.
    </p>
  )}
</section>

        <div
          className={
            controlsDisabled
              ? "pointer-events-none select-none opacity-50"
              : ""
          }
          aria-disabled={controlsDisabled}
        >
          <section className="mb-5 rounded-[2rem] border border-[#ead7c8] bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-[#2b1b14]">
                Weekly planning
              </h2>

              <p className="mt-1 text-[#6d5549]">
                Choose when you want to plan meals and review your
                shopping list.
              </p>
            </div>

            <ReminderRow
              title="Weekly meal-plan reminder"
              description="Take a few minutes to plan your meals for the week."
              enabled={settings.weeklyMealPlanEnabled}
              onEnabledChange={(enabled) =>
                updateSetting("weeklyMealPlanEnabled", enabled)
              }
            >
              <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                <SelectField
                  label="Day"
                  value={String(settings.weeklyMealPlanDay)}
                  onChange={(value) =>
                    updateSetting(
                      "weeklyMealPlanDay",
                      Number(value)
                    )
                  }
                  options={weekDays.map((day) => ({
                    value: String(day.value),
                    label: day.label,
                  }))}
                />

                <TimeField
                  label="Time"
                  value={settings.weeklyMealPlanTime}
                  onChange={(value) =>
                    updateSetting("weeklyMealPlanTime", value)
                  }
                />
              </div>
            </ReminderRow>

            <div className="my-5 border-t border-[#f1e4da]" />

            <ReminderRow
              title="Weekly shopping reminder"
              description="Review your list before your next shopping trip."
              enabled={settings.weeklyShoppingEnabled}
              onEnabledChange={(enabled) =>
                updateSetting("weeklyShoppingEnabled", enabled)
              }
            >
              <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                <SelectField
                  label="Day"
                  value={String(settings.weeklyShoppingDay)}
                  onChange={(value) =>
                    updateSetting(
                      "weeklyShoppingDay",
                      Number(value)
                    )
                  }
                  options={weekDays.map((day) => ({
                    value: String(day.value),
                    label: day.label,
                  }))}
                />

                <TimeField
                  label="Time"
                  value={settings.weeklyShoppingTime}
                  onChange={(value) =>
                    updateSetting("weeklyShoppingTime", value)
                  }
                />
              </div>
            </ReminderRow>
          </section>

          <section className="mb-5 rounded-[2rem] border border-[#ead7c8] bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-[#2b1b14]">
                Meal reminders
              </h2>

              <p className="mt-1 text-[#6d5549]">
                Gentle reminders to pause and eat. These do not
                require a meal to be planned.
              </p>
            </div>

            <MealReminderRow
              emoji="☀️"
              title="Breakfast"
              enabled={settings.breakfastEnabled}
              time={settings.breakfastTime}
              onEnabledChange={(enabled) =>
                updateSetting("breakfastEnabled", enabled)
              }
              onTimeChange={(time) =>
                updateSetting("breakfastTime", time)
              }
            />

            <div className="my-5 border-t border-[#f1e4da]" />

            <MealReminderRow
              emoji="🥗"
              title="Lunch"
              enabled={settings.lunchEnabled}
              time={settings.lunchTime}
              onEnabledChange={(enabled) =>
                updateSetting("lunchEnabled", enabled)
              }
              onTimeChange={(time) =>
                updateSetting("lunchTime", time)
              }
            />

            <div className="my-5 border-t border-[#f1e4da]" />

            <MealReminderRow
              emoji="🍲"
              title="Dinner"
              enabled={settings.dinnerEnabled}
              time={settings.dinnerTime}
              onEnabledChange={(enabled) =>
                updateSetting("dinnerEnabled", enabled)
              }
              onTimeChange={(time) =>
                updateSetting("dinnerTime", time)
              }
            />
          </section>

          <section className="mb-6 rounded-[2rem] border border-[#ead7c8] bg-white p-6 shadow-sm">
            <ReminderRow
              title="Hydration reminders"
              description="Choose how often Hey Chef should remind you to drink water."
              enabled={settings.hydrationEnabled}
              onEnabledChange={(enabled) =>
                updateSetting("hydrationEnabled", enabled)
              }
            >
              <div className="space-y-5">
                <div>
                  <p className="mb-2 block text-sm font-bold text-[#2b1b14]">
                    Remind me every
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    {([1, 2, 3] as HydrationInterval[]).map(
                      (hours) => {
                        const selected =
                          settings.hydrationIntervalHours === hours;

                        return (
                          <button
                            key={hours}
                            type="button"
                            onClick={() =>
                              updateSetting(
                                "hydrationIntervalHours",
                                hours
                              )
                            }
                            className={`rounded-2xl border px-3 py-3 text-sm font-bold ${
                              selected
                                ? "border-[#a63a0a] bg-[#fff4ef] text-[#a63a0a]"
                                : "border-[#ead7c8] bg-white text-[#6d5549]"
                            }`}
                          >
                            {hours}{" "}
                            {hours === 1 ? "hour" : "hours"}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                  <TimeField
                    label="Start time"
                    value={settings.hydrationStartTime}
                    onChange={(value) =>
                      updateSetting("hydrationStartTime", value)
                    }
                  />

                  <TimeField
                    label="End time"
                    value={settings.hydrationEndTime}
                    onChange={(value) =>
                      updateSetting("hydrationEndTime", value)
                    }
                  />
                </div>

                <div>
                  <p className="mb-2 text-sm font-bold text-[#2b1b14]">
                    Days
                  </p>

                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                    {weekDays.map((day) => {
                      const selected =
                        settings.hydrationDays.includes(day.value);

                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() =>
                            toggleHydrationDay(day.value)
                          }
                          className={`rounded-2xl border px-2 py-3 text-sm font-bold ${
                            selected
                              ? "border-[#a63a0a] bg-[#a63a0a] text-white"
                              : "border-[#ead7c8] bg-white text-[#6d5549]"
                          }`}
                        >
                          {day.short}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </ReminderRow>
          </section>
        </div>

        <button
          type="button"
          onClick={() => void saveReminderSettings()}
          disabled={isSaving}
          className="w-full rounded-full bg-[#a63a0a] px-6 py-4 text-lg font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Reminder Settings"}
        </button>

        <p className="mt-4 text-center text-sm text-[#6d5549]">
          Times are saved using your current device time zone.
        </p>
      </div>
    </main>
  );
}

type ReminderRowProps = {
  title: string;
  description: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  children: ReactNode;
};

function ReminderRow({
  title,
  description,
  enabled,
  onEnabledChange,
  children,
}: ReminderRowProps) {
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-bold text-[#2b1b14]">{title}</h3>
          <p className="mt-1 text-sm text-[#6d5549]">
            {description}
          </p>
        </div>

        <Toggle
          checked={enabled}
          onChange={onEnabledChange}
          label={title}
        />
      </div>

      {enabled && <div className="mt-5">{children}</div>}
    </div>
  );
}

type MealReminderRowProps = {
  emoji: string;
  title: string;
  enabled: boolean;
  time: string;
  onEnabledChange: (enabled: boolean) => void;
  onTimeChange: (time: string) => void;
};

function MealReminderRow({
  emoji,
  title,
  enabled,
  time,
  onEnabledChange,
  onTimeChange,
}: MealReminderRowProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{emoji}</span>

        <div>
          <h3 className="font-bold text-[#2b1b14]">{title}</h3>
          <p className="text-sm text-[#6d5549]">
            Remember to eat.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {enabled && (
          <input
            type="time"
            value={time}
            onChange={(event) =>
              onTimeChange(event.target.value)
            }
            step={900}
            className="min-h-12 rounded-2xl border border-[#ead7c8] bg-white px-4 py-3 text-base text-[#2b1b14]"
            aria-label={`${title} reminder time`}
          />
        )}

        <Toggle
          checked={enabled}
          onChange={onEnabledChange}
          label={`${title} reminder`}
        />
      </div>
    </div>
  );
}

type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
};

function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-8 w-14 shrink-0 rounded-full transition ${
        checked ? "bg-[#a63a0a]" : "bg-[#d8cbc2]"
      }`}
    >
      <span
        className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${
          checked ? "left-7" : "left-1"
        }`}
      />
    </button>
  );
}

type TimeFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function TimeField({
  label,
  value,
  onChange,
}: TimeFieldProps) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-bold text-[#2b1b14]">
        {label}
      </span>

      <input
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        step={900}
        className="min-h-12 w-full min-w-0 max-w-full rounded-2xl border border-[#ead7c8] bg-white px-4 py-3 text-base text-[#2b1b14]"
      />
    </label>
  );
}

type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{
    value: string;
    label: string;
  }>;
};

function SelectField({
  label,
  value,
  onChange,
  options,
}: SelectFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-[#2b1b14]">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 w-full rounded-2xl border border-[#ead7c8] bg-white px-4 py-3 text-base text-[#2b1b14]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}