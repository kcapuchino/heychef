"use client";

import { useRouter } from "next/navigation";

const RECIPE_SHORTCUT_URL = "https://www.icloud.com/shortcuts/4c2265d097784166a60c9ce2020977bd";
const GROCERY_SHORTCUT_URL = "https://www.icloud.com/shortcuts/c29d3a84b803471b939ddd302419e761";
const SHOPPING_SHORTCUT_URL = "https://www.icloud.com/shortcuts/cfa1b190ddf149a2a812bb07e628f909";
const PANTRY_SHORTCUT_URL = "https://www.icloud.com/shortcuts/8527bb2b6c1e4254bb26d8b080d53b35";

const CHROME_EXTENSION_URL = "PASTE_YOUR_CHROME_WEB_STORE_LINK_HERE";

export default function AddToHeyChefPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#f8efe6] px-4 py-8 sm:px-6">
      <section className="mx-auto w-full max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#ead7c8] bg-white text-2xl font-bold text-[#2b1b14] shadow-sm"
  aria-label="Go back"
          >
            ←
          </button>

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#a63a0a]">
              Hey Chef
            </p>

            <h1 className="text-3xl font-bold text-[#2b1b14]">
              Add to Hey Chef
            </h1>
          </div>
        </div>

        <section className="rounded-[2rem] border border-[#ead7c8] bg-white p-6 shadow-xl sm:p-8">
          <h2 className="text-2xl font-bold text-[#2b1b14]">
            Save recipes from anywhere
          </h2>

          <p className="mt-3 max-w-2xl text-[#6d5549]">
            Import recipes and grocery products from your favorite websites in
            just a tap or click.
          </p>

          <div className="mt-8 grid gap-5">
            <article className="rounded-3xl border border-[#ead7c8] bg-[#fffaf5] p-5 sm:p-6">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#a63a0a]">
                Apple Devices
              </p>

              <h3 className="mt-2 text-xl font-bold text-[#2b1b14]">
                Apple Shortcuts
              </h3>

              <p className="mt-2 text-[#6d5549]">
                Save recipes and grocery products directly from Safari on your
                iPhone, iPad, or Mac.
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold text-[#6d5549]">
                <span className="rounded-full border border-[#ead7c8] bg-white px-3 py-1">
                  ✓ iPhone
                </span>

                <span className="rounded-full border border-[#ead7c8] bg-white px-3 py-1">
                  ✓ iPad
                </span>

                <span className="rounded-full border border-[#ead7c8] bg-white px-3 py-1">
                  ✓ Mac
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
  <a
    href={RECIPE_SHORTCUT_URL}
    target="_blank"
    rel="noreferrer"
    className="rounded-full bg-[#a63a0a] px-5 py-3 text-center font-bold text-white transition hover:bg-[#8f3108] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a63a0a] focus-visible:ring-offset-2"
  >
    Install Recipe Shortcut
  </a>

  <a
    href={GROCERY_SHORTCUT_URL}
    target="_blank"
    rel="noreferrer"
    className="rounded-full bg-[#a63a0a] px-5 py-3 text-center font-bold text-white transition hover:bg-[#8f3108] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a63a0a] focus-visible:ring-offset-2"
  >
    Install Grocery Shortcut
  </a>

  <a
    href={SHOPPING_SHORTCUT_URL}
    target="_blank"
    rel="noreferrer"
    className="rounded-full bg-[#a63a0a] px-5 py-3 text-center font-bold text-white transition hover:bg-[#8f3108] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a63a0a] focus-visible:ring-offset-2"
  >
    Install Shopping Shortcut
  </a>

  <a
    href={PANTRY_SHORTCUT_URL}
    target="_blank"
    rel="noreferrer"
    className="rounded-full bg-[#a63a0a] px-5 py-3 text-center font-bold text-white transition hover:bg-[#8f3108] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a63a0a] focus-visible:ring-offset-2"
  >
    Install Pantry Shortcut
  </a>
</div>

<div className="mt-5 rounded-2xl border border-[#ead7c8] bg-white p-4">
  <p className="font-bold text-[#2b1b14]">
    How to use your shortcuts
  </p>

  <p className="mt-2 text-sm text-[#6d5549]">
    Install whichever shortcuts you want to use. Apple requires each shortcut
    to be installed individually.
  </p>

  <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-[#6d5549]">
    <li>Open a recipe, grocery product, shopping page, or pantry item in Safari.</li>
    <li>Tap or click the <strong>Share</strong> button.</li>
    <li>Select the appropriate <strong>Hey Chef</strong> shortcut.</li>
    <li>Follow the prompts to import it into Hey Chef.</li>
  </ol>
</div>
            </article>

            <article className="rounded-3xl border border-[#ead7c8] bg-[#fffaf5] p-5 sm:p-6">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#a63a0a]">
                Chrome, Edge and Brave
              </p>

              <h3 className="mt-2 text-xl font-bold text-[#2b1b14]">
                Browser Extension
              </h3>

              <p className="mt-2 text-[#6d5549]">
                Add recipes and grocery products with one click while browsing
                on your computer.
              </p>

              <a
                href={CHROME_EXTENSION_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-block w-full rounded-full bg-[#a63a0a] px-5 py-3 text-center font-bold text-white transition hover:bg-[#8f3108] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a63a0a] focus-visible:ring-offset-2 sm:w-auto"
              >
                Install Browser Extension
              </a>
            </article>
          </div>

          <button
            type="button"
            onClick={() => router.replace("/")}
            className="mt-8 w-full rounded-full border border-[#ead7c8] bg-white px-5 py-3 font-semibold text-[#6d5549] transition hover:bg-[#fffaf5] hover:text-[#2b1b14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a63a0a] focus-visible:ring-offset-2"
          >
            Start Building Your Kitchen
          </button>
        </section>
      </section>
    </main>
  );
}