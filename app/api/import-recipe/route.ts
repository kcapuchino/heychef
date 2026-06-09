import { NextResponse } from "next/server";

function cleanText(text: string) {
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function findRecipeJsonLd(json: any): any | null {
  if (!json) return null;

  if (Array.isArray(json)) {
    for (const item of json) {
      const found = findRecipeJsonLd(item);
      if (found) return found;
    }
  }

  if (json["@graph"]) return findRecipeJsonLd(json["@graph"]);

  const type = json["@type"];

  if (type === "Recipe" || (Array.isArray(type) && type.includes("Recipe"))) {
    return json;
  }

  return null;
}

function getImage(image: any) {
  if (!image) return "";
  if (typeof image === "string") return image;
  if (Array.isArray(image)) {
    const first = image[0];
    if (typeof first === "string") return first;
    return first?.url || "";
  }
  return image.url || "";
}

function getSteps(instructions: any): string[] {
  if (!instructions) return [];

  if (typeof instructions === "string") return [instructions];

  if (Array.isArray(instructions)) {
    return instructions.flatMap((item) => {
      if (typeof item === "string") return [item];

      if (item.text) return [item.text];

      if (item.itemListElement) {
        return getSteps(item.itemListElement);
      }

      return [];
    });
  }

  if (instructions.text) return [instructions.text];

  return [];
}

function fallbackFromHtml(html: string) {
  const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const title = titleMatch ? cleanText(titleMatch[1]) : "Imported Recipe";

  const ingredientsSection = html.match(/## Ingredients([\s\S]*?)## Directions/i);
  const directionsSection = html.match(/## Directions([\s\S]*?)(###|## Nutrition|Nutrition Facts|$)/i);

  const ingredients =
    ingredientsSection?.[1]
      ?.split(/\n|\*/g)
      .map(cleanText)
      .filter((item) => item.length > 3)
      .filter((item) => !item.includes("Oops"))
      .filter((item) => !item.includes("1/2x"))
      .filter((item) => !item.includes("1x"))
      .filter((item) => !item.includes("2x"))
      .filter((item) => !item.includes("Original recipe")) || [];

  const steps =
    directionsSection?.[1]
      ?.split(/\n\s*\d+\.\s*|\d+\./g)
      .map(cleanText)
      .filter((item) => item.length > 20) || [];

  return {
    title,
    image: "",
    ingredients,
    steps,
  };
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "Missing recipe URL" }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Could not reach recipe page. Status: ${response.status}` },
        { status: 400 }
      );
    }

    const html = await response.text();

    const matches = html.match(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    );

    if (matches) {
      for (const match of matches) {
        const jsonText = match
          .replace(/<script[^>]*type=["']application\/ld\+json["'][^>]*>/i, "")
          .replace(/<\/script>/i, "")
          .trim();

        try {
          const parsed = JSON.parse(jsonText);
          const recipe = findRecipeJsonLd(parsed);

          if (recipe) {
            return NextResponse.json({
              title: recipe.name || "Imported Recipe",
              image: getImage(recipe.image),
              ingredients: recipe.recipeIngredient || [],
              steps: getSteps(recipe.recipeInstructions),
              sourceUrl: url,
            });
          }
        } catch {
          continue;
        }
      }
    }

    const fallback = fallbackFromHtml(html);

    if (fallback.ingredients.length > 0 || fallback.steps.length > 0) {
      return NextResponse.json({
        ...fallback,
        sourceUrl: url,
      });
    }

    return NextResponse.json(
      { error: "No recipe ingredients or steps were found on this page." },
      { status: 404 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Something went wrong importing this recipe." },
      { status: 500 }
    );
  }
}