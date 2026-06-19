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
      if (typeof item === "string") return [cleanText(item)];
      if (item.text) return [cleanText(item.text)];

      if (item.itemListElement) {
        return getSteps(item.itemListElement);
      }

      return [];
    });
  }

  if (instructions.text) return [cleanText(instructions.text)];

  return [];
}

function formatDuration(value: any) {
  if (!value) return "";

  const text = String(value);

  const isoMatch = text.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (isoMatch) {
    const h = isoMatch[1] ? Number(isoMatch[1]) : 0;
    const m = isoMatch[2] ? Number(isoMatch[2]) : 0;

    if (h && m) return `${h} hr ${m} min`;
    if (h) return `${h} hr`;
    if (m) return `${m} min`;
  }

  return cleanText(text);
}

function getServings(recipe: any) {
  const yieldValue = recipe.recipeYield || recipe.yield || "";

  if (Array.isArray(yieldValue)) {
    return cleanText(String(yieldValue[0] || ""));
  }

  return cleanText(String(yieldValue || ""));
}

function findTimeInHtml(html: string) {
  const cleaned = cleanText(html);

  const totalTimeMatch = cleaned.match(
    /(total time|total):?\s*([0-9]+\s*(hours?|hrs?|hr|minutes?|mins?|min)(\s*[0-9]+\s*(minutes?|mins?|min))?)/i
  );

  if (totalTimeMatch?.[2]) return cleanText(totalTimeMatch[2]);

  const cookTimeMatch = cleaned.match(
    /(cook time|cook):?\s*([0-9]+\s*(hours?|hrs?|hr|minutes?|mins?|min)(\s*[0-9]+\s*(minutes?|mins?|min))?)/i
  );

  if (cookTimeMatch?.[2]) return cleanText(cookTimeMatch[2]);

  const prepTimeMatch = cleaned.match(
    /(prep time|prep):?\s*([0-9]+\s*(hours?|hrs?|hr|minutes?|mins?|min)(\s*[0-9]+\s*(minutes?|mins?|min))?)/i
  );

  if (prepTimeMatch?.[2]) return cleanText(prepTimeMatch[2]);

  return "";
}

function findServingsInHtml(html: string) {
  const cleaned = cleanText(html);

  const servingsMatch = cleaned.match(/(servings|yield):?\s*([0-9]+(\s*to\s*[0-9]+)?)/i);

  if (servingsMatch?.[2]) return cleanText(servingsMatch[2]);

  return "";
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
    cookTime: findTimeInHtml(html),
    servings: findServingsInHtml(html),
  };
}
function decodeHtmlEntities(text: string) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, num) =>
      String.fromCharCode(parseInt(num, 10))
    )
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .trim();
}

function getMetaContent(html: string, selector: string) {
  const regex = new RegExp(
    `<meta[^>]+${selector}[^>]+content=["']([^"']*)["'][^>]*>`,
    "i"
  );

  const match = html.match(regex);
  return match ? decodeHtmlEntities(match[1]) : "";
}

function parseInstagramRecipeText(text: string) {
  const decoded = decodeHtmlEntities(text);

  const englishOnly = decoded
    .split(/\n-\s*LINSEN|\nREZEPTE|\nDas hier/i)[0]
    .trim();

  const lines = englishOnly
    .split(/\n|•/)
    .map((line) => line.trim())
    .filter(Boolean);

  const title =
    lines.find((line) => line.toLowerCase().includes("recipe")) ||
    lines[0] ||
    "Instagram Recipe";

  const ingredients: string[] = [];
  const steps: string[] = [];

  let inRecipe = false;

  for (const line of lines) {
    const lower = line.toLowerCase();

    if (lower.includes("recipe")) {
      inRecipe = true;
      continue;
    }

    if (!inRecipe) continue;

    if (
      line.startsWith("-") ||
      /^\d/.test(line) ||
      lower.includes("cup") ||
      lower.includes("tbsp") ||
      lower.includes("tsp") ||
      lower.includes("can")
    ) {
      ingredients.push(line.replace(/^-/, "").trim());
      continue;
    }

    if (
      /^[A-Z\s/]+$/.test(line) ||
      lower.includes("fry") ||
      lower.includes("mix") ||
      lower.includes("fill") ||
      lower.includes("roll") ||
      lower.includes("grill")
    ) {
      steps.push(line);
    }
  }

  return {
    title: cleanText(title.replace(/recipe.*/i, "").trim()) || "Instagram Recipe",
    ingredients,
    steps,
  };
}

export async function POST(request: Request) {
  try {
    const { url, text } = await request.json();

    if (!url && !text) {
      return NextResponse.json(
        { error: "Missing recipe URL or recipe text" },
        { status: 400 }
      );
    }

    if (url?.includes("instagram.com")) {
      if (!text) {
        return NextResponse.json(
          { error: "Instagram needs pasted caption text or shortcut text to import." },
          { status: 400 }
        );
      }

      const instagram = parseInstagramRecipeText(text);

      if (instagram.ingredients.length > 0 || instagram.steps.length > 0) {
        return NextResponse.json({
          ...instagram,
          image: "",
          cookTime: "",
          servings: "",
          sourceUrl: url,
        });
      }
    }

    if (!url && text) {
      const instagram = parseInstagramRecipeText(text);

      if (instagram.ingredients.length > 0 || instagram.steps.length > 0) {
        return NextResponse.json({
          ...instagram,
          image: "",
          cookTime: "",
          servings: "",
          sourceUrl: "",
        });
      }

      const fallback = fallbackFromHtml(text);

      if (fallback.ingredients.length > 0 || fallback.steps.length > 0) {
        return NextResponse.json({
          ...fallback,
          sourceUrl: "",
        });
      }

      return NextResponse.json(
        { error: "No recipe ingredients or steps were found in the pasted text." },
        { status: 404 }
      );
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
            const cookTime =
              formatDuration(recipe.totalTime || recipe.cookTime || recipe.prepTime || "") ||
              findTimeInHtml(html);

            const servings = getServings(recipe) || findServingsInHtml(html);

            return NextResponse.json({
              title: recipe.name || "Imported Recipe",
              image: getImage(recipe.image),
              ingredients: recipe.recipeIngredient || [],
              steps: getSteps(recipe.recipeInstructions),
              cookTime,
              servings,
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