import { DateTime } from "luxon";

export type ReminderJobType =
  | "weekly_meal_plan"
  | "weekly_shopping"
  | "breakfast"
  | "lunch"
  | "dinner"
  | "hydration";

type NextDailyRunOptions = {
  time: string;
  timezone: string;
};

type NextWeeklyRunOptions = {
  weekday: number;
  time: string;
  timezone: string;
};

type NextHydrationRunOptions = {
  intervalHours: number;
  startTime: string;
  endTime: string;
  days: number[];
  timezone: string;
};

function parseTime(time: string) {
  const [hourText, minuteText] = time.split(":");

  return {
    hour: Number(hourText),
    minute: Number(minuteText),
  };
}

function luxonWeekdayFromJsDay(day: number) {
  // JavaScript: Sunday = 0
  // Luxon: Monday = 1, Sunday = 7
  return day === 0 ? 7 : day;
}

function jsDayFromLuxonWeekday(day: number) {
  return day === 7 ? 0 : day;
}

function toRequiredIso(dateTime: DateTime): string {
  const iso = dateTime.toUTC().toISO();

  if (!iso) {
    throw new Error(
      "Could not convert the notification time to ISO format."
    );
  }

  return iso;
}

export function getNextDailyRun({
  time,
  timezone,
}: NextDailyRunOptions): string {
  const now = DateTime.now().setZone(timezone);
  const { hour, minute } = parseTime(time);

  let nextRun = now.set({
    hour,
    minute,
    second: 0,
    millisecond: 0,
  });

  if (nextRun <= now) {
    nextRun = nextRun.plus({ days: 1 });
  }

  return toRequiredIso(nextRun);
}

export function getNextWeeklyRun({
  weekday,
  time,
  timezone,
}: NextWeeklyRunOptions): string {
  const now = DateTime.now().setZone(timezone);
  const { hour, minute } = parseTime(time);
  const targetWeekday = luxonWeekdayFromJsDay(weekday);

  let daysAhead = targetWeekday - now.weekday;

  if (daysAhead < 0) {
    daysAhead += 7;
  }

  let nextRun = now.plus({ days: daysAhead }).set({
    hour,
    minute,
    second: 0,
    millisecond: 0,
  });

  if (nextRun <= now) {
    nextRun = nextRun.plus({ weeks: 1 });
  }

  return toRequiredIso(nextRun);
}

export function getNextHydrationRun({
  intervalHours,
  startTime,
  endTime,
  days,
  timezone,
}: NextHydrationRunOptions): string {
  if (days.length === 0) {
    throw new Error(
      "Hydration reminders require at least one selected day."
    );
  }

  const now = DateTime.now().setZone(timezone);
  const start = parseTime(startTime);
  const end = parseTime(endTime);

  for (let dayOffset = 0; dayOffset <= 7; dayOffset += 1) {
    const candidateDay = now.plus({ days: dayOffset });

    const candidateJsDay = jsDayFromLuxonWeekday(
      candidateDay.weekday
    );

    if (!days.includes(candidateJsDay)) {
      continue;
    }

    const windowStart = candidateDay.set({
      hour: start.hour,
      minute: start.minute,
      second: 0,
      millisecond: 0,
    });

    const windowEnd = candidateDay.set({
      hour: end.hour,
      minute: end.minute,
      second: 0,
      millisecond: 0,
    });

    if (dayOffset > 0 || now < windowStart) {
      return toRequiredIso(windowStart);
    }

    if (now >= windowEnd) {
      continue;
    }

    let candidate = windowStart;

    while (candidate <= now) {
      candidate = candidate.plus({
        hours: intervalHours,
      });
    }

    if (candidate <= windowEnd) {
      return toRequiredIso(candidate);
    }
  }

  throw new Error(
    "Could not calculate the next hydration reminder."
  );
}