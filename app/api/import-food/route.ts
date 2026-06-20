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
function getMetaContent(html: string, selector: string) {
  const regex = new RegExp(
    `<meta[^>]+${selector}[^>]+content=["']([^"']*)["'][^>]*>`,
    "i"
  );

  const match = html.match(regex);
  return match ? cleanText(match[1]) : "";
}

function findProductJsonLd(json: any): any | null {
  if (!json) return null;

  if (Array.isArray(json)) {
    for (const item of json) {
      const found = findProductJsonLd(item);
      if (found) return found;
    }
  }

  if (json["@graph"]) return findProductJsonLd(json["@graph"]);

  const type = json["@type"];

  if (type === "Product" || (Array.isArray(type) && type.includes("Product"))) {
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

function guessPackageSize(text: string) {
  const match = text.match(/\b\d+(\.\d+)?\s?(oz|ounce|ounces|lb|lbs|ct|count|fl oz)\b/i);
  return match ? match[0] : "";
}

function guessCategory(text: string) {
  const lower = text.toLowerCase();

  if (lower.includes("frozen")) return "Frozen Food";
  if (lower.includes("cracker") || lower.includes("lunch") || lower.includes("meal kit")) return "Prepared Food";
  if (lower.includes("soup") || lower.includes("can")) return "Canned Food";
  if (lower.includes("snack") || lower.includes("chips")) return "Snack";
  if (lower.includes("drink") || lower.includes("juice")) return "Drink";

  return "Prepared Food";
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "Missing product URL" }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "text/html",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Could not reach product page. Status: ${response.status}` },
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
          const product = findProductJsonLd(parsed);

          if (product) {
            const title = cleanText(product.name || "Food Item");
            const brand =
              typeof product.brand === "string"
                ? product.brand
                : product.brand?.name || "";

            return NextResponse.json({
              title,
              brand,
              packageSize: guessPackageSize(title),
              category: guessCategory(title),
              image: getImage(product.image),
              sourceUrl: url,
              cookTime: "0 min",
              servings: "1",
              type: "grocery",
            });
          }
        } catch {
          continue;
        }
      }
    }

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

const ogTitle =
  getMetaContent(html, 'property=["\\\']og:title["\\\']') ||
  getMetaContent(html, 'name=["\\\']title["\\\']');

const rawTitle = ogTitle || cleanText(titleMatch?.[1] || "");

const title = rawTitle
  .replace(/\s*-\s*Kroger.*$/i, "")
  .replace(/\s*\|\s*Kroger.*$/i, "")
  .replace(/\s*:\s*Kroger.*$/i, "")
  .trim();

    if (!title) {
  return NextResponse.json(
    { error: "Could not find product details. Enter them manually below." },
    { status: 404 }
  );
}

const image =
  getMetaContent(html, 'property=["\\\']og:image["\\\']') ||
  getMetaContent(html, 'name=["\\\']og:image["\\\']') ||
  "";

const brand = title.split(" ")[0];

return NextResponse.json({
  title,
  brand,
  packageSize: guessPackageSize(title),
  category: guessCategory(title),
  image,
  sourceUrl: url,
  cookTime: "0 min",
  servings: "1",
  type: "grocery",
});
  } catch {
    return NextResponse.json(
      { error: "Could not import this product. Enter it manually below." },
      { status: 500 }
    );
  }
}