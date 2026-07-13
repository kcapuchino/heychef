"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/Archive/lib/supabase";

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

  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showDeviceInstructions, setShowDeviceInstructions] =
    useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    void loadReminderSettings();

    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    } else {
      setNotificationPermission("unsupported");
    }
  }, []);

  async function loadReminderSettings() {
    setIsLoading(true);
    setMessage("");

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

      if (data) {
        setSettings({
          notificationsEnabled:
            data.notifications_enabled ?? true,

          weeklyMealPlanEnabled:
            data.weekly_meal_plan_enabled ?? false,
          weeklyMealPlanDay:
            data.weekly_meal_plan_day ?? 0,
          weeklyMealPlanTime:
            data.weekly_meal_plan_time?.slice(0, 5) ?? "17:00",

          weeklyShoppingEnabled:
            data.weekly_shopping_enabled ?? false,
          weeklyShoppingDay:
            data.weekly_shopping_day ?? 5,
          weeklyShoppingTime:
            data.weekly_shopping_time?.slice(0, 5) ?? "16:00",

          breakfastEnabled:
            data.breakfast_enabled ?? false,
          breakfastTime:
            data.breakfast_time?.slice(0, 5) ?? "09:00",

          lunchEnabled:
            data.lunch_enabled ?? false,
          lunchTime:
            data.lunch_time?.slice(0, 5) ?? "12:00",

          dinnerEnabled:
            data.dinner_enabled ?? false,
          dinnerTime:
            data.dinner_time?.slice(0, 5) ?? "19:00",

          hydrationEnabled:
            data.hydration_enabled ?? false,
          hydrationIntervalHours:
            (data.hydration_interval_hours ??
              2) as HydrationInterval,
          hydrationStartTime:
            data.hydration_start_time?.slice(0, 5) ?? "08:00",
          hydrationEndTime:
            data.hydration_end_time?.slice(0, 5) ?? "20:00",
          hydrationDays:
            data.hydration_days ?? [1, 2, 3, 4, 5],
        });
      }
    } catch (error) {
      console.error("Could not load reminder settings:", error);
      setMessage("Could not load your reminder settings.");
    } finally {
      setIsLoading(false);
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
    <main className="min-h-screen bg-[#fffaf5] px-4 py-8">
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#2b1b14]">
                Device notifications
              </h2>

              <p className="mt-1 text-[#6d5549]">
                Allow this browser or installed app to show
                notifications.
              </p>
            </div>

            {notificationPermission === "granted" ? (
              <span className="rounded-full bg-[#edf7ed] px-4 py-2 text-sm font-bold text-[#27632a]">
                ✓ Device permission enabled
              </span>
            ) : (
              <button
                type="button"
                onClick={requestNotificationPermission}
                disabled={notificationPermission === "unsupported"}
                className="rounded-full bg-[#a63a0a] px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Enable Notifications
              </button>
            )}
          </div>

          {notificationPermission === "denied" && (
            <div className="mt-4 rounded-2xl bg-[#fff4ef] p-4 text-sm text-[#6d5549]">
              <p>
                Notifications are blocked in your device or browser
                settings.
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

          {notificationPermission === "granted" && (
            <button
              type="button"
              onClick={() =>
                setShowDeviceInstructions((current) => !current)
              }
              className="mt-4 text-sm font-bold text-[#a63a0a] underline"
            >
              {showDeviceInstructions
                ? "Hide device instructions"
                : "Turn off device permission completely"}
            </button>
          )}

          {showDeviceInstructions && (
            <div className="mt-4 space-y-3 rounded-2xl border border-[#ead7c8] bg-[#fffaf5] p-4 text-sm leading-6 text-[#6d5549]">
              <p>
                <strong className="text-[#2b1b14]">
                  Hey Chef switch:
                </strong>{" "}
                Turn off “Hey Chef reminders” above to pause all
                reminders while keeping your saved schedule.
              </p>

              <p>
                <strong className="text-[#2b1b14]">
                  iPhone or iPad:
                </strong>{" "}
                Open Settings → Notifications → Hey Chef, then turn
                off Allow Notifications.
              </p>

              <p>
                <strong className="text-[#2b1b14]">
                  Android:
                </strong>{" "}
                Open Settings → Apps → Hey Chef → Notifications, then
                turn notifications off.
              </p>

              <p>
                <strong className="text-[#2b1b14]">
                  Desktop Chrome:
                </strong>{" "}
                Open the site controls beside the web address, choose
                Site settings, then change Notifications to Block.
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
              <div className="grid gap-3 sm:grid-cols-2">
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
              <div className="grid gap-3 sm:grid-cols-2">
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

                <div className="grid gap-3 sm:grid-cols-2">
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

        {message && (
          <p className="mb-4 rounded-2xl border border-[#ead7c8] bg-white p-4 text-center font-medium text-[#6d5549]">
            {message}
          </p>
        )}

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
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-[#2b1b14]">
        {label}
      </span>

      <input
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        step={900}
        className="min-h-12 w-full rounded-2xl border border-[#ead7c8] bg-white px-4 py-3 text-base text-[#2b1b14]"
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