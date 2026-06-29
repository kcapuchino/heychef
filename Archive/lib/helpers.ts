export function getHomeMenuLabel(day: "today" | "tomorrow") {
  const date = new Date();

  if (day === "tomorrow") {
    date.setDate(date.getDate() + 1);
  }

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function getWeekStartDate(week: "current" | "next") {
  const today = new Date();

  const monday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const diff = monday.getDay() === 0 ? -6 : 1 - monday.getDay();
  monday.setDate(monday.getDate() + diff);

  if (week === "next") {
    monday.setDate(monday.getDate() + 7);
  }

  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, "0");
  const day = String(monday.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getTodayLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function addDays(dateString: string, days: number) {
  const date = new Date(dateString + "T00:00:00");
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

export function getCurrentWeekLabel() {
  const today = new Date();

  const monday = new Date(today);
  const diff = today.getDay() === 0 ? -6 : 1 - today.getDay();
  monday.setDate(today.getDate() + diff);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return `${monday.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} – ${sunday.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}`;
}

export function getUpcomingWeekLabel() {
  const today = new Date();
  const day = today.getDay();
  const daysUntilNextMonday = day === 0 ? 1 : 8 - day;

  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilNextMonday);

  const nextSunday = new Date(nextMonday);
  nextSunday.setDate(nextMonday.getDate() + 6);

  return `${nextMonday.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} – ${nextSunday.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}`;
}

export function cleanPantryDisplayName(text: string) {
  return text
    .replace(/\(.*?\)/g, "")
    .replace(/^\s*[\d¼½¾⅓⅔⅛⅜⅝⅞\s/.-]+/g, "")
    .replace(
      /^(cups?|cup|tbsp|tablespoons?|teaspoons?|tsp|ounces?|ounce|oz|grams?|g|ml|cans?|can)\s+/i,
      ""
    )
    .replace(/^(small|large|medium)\s+/i, "")
    .trim();
}

export function normalizeItemName(text?: string | null) {
  return String(text || "")
    .toLowerCase()
    .replace(/-/g, " ")
    .split(",")[0]
    .replace(/[()]/g, " ")
    .replace(/\bor\b/g, " ")
    .replace(/other sandwich toppings?.*/g, "")
    .replace(/sandwich toppings?.*/g, "")
    .replace(
      /\b\d+|cups?|cup|tbsp|tablespoons?|teaspoons?|tsp|ounces?|ounce|oz|grams?|g|ml|cans?|can|pounds?|pound|lbs?|lb|small|large|medium|fresh|organic|bunched|bunches|bunch|each|kroger\b/g,
      " "
    )
    .replace(
      /\b(vegan|dairy-free|plant-based|plant|chopped|diced|sliced|minced|shredded|juiced|leaves)\b/g,
      " "
    )
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}