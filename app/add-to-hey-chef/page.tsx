"use client";

import { useRouter } from "next/navigation";

const RECIPE_SHORTCUT_URL = "PASTE_YOUR_RECIPE_SHORTCUT_LINK_HERE";
const GROCERY_SHORTCUT_URL = "PASTE_YOUR_GROCERY_SHORTCUT_LINK_HERE";
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
              Add to Hey Chef
            </h1>
          </div>
        </div>

        <section className="rounded-[2rem] border border-[#ead7c8] bg-white p-6 shadow-xl sm:p-8">
          <h2 className="text-2xl font-bold text-[#2b1b14]">
            Bring recipes home from anywhere
          </h2>

          <p className="mt-3 text-[#6d5549]">
            Save recipes and grocery products directly to Hey Chef while you
            browse.
          </p>

          <div className="mt-8 grid gap-5">
            <article className="rounded-3xl border border-[#ead7c8] bg-[#fffaf5] p-5">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#a63a0a]">
                Apple Devices
              </p>

              <h3 className="mt-2 text-xl font-bold text-[#2b1b14]">
                Apple Shortcuts
              </h3>

              <p className="mt-2 text-[#6d5549]">
                Use Safari on iPhone, iPad, or Mac to send recipes and grocery
                products to Hey Chef.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <a
                  href={RECIPE_SHORTCUT_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-[#a63a0a] px-5 py-3 text-center font-bold text-white"
                >
                  Install Recipe Shortcut
                </a>

                <a
                  href={GROCERY_SHORTCUT_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[#a63a0a] px-5 py-3 text-center font-bold text-[#a63a0a]"
                >
                  Install Grocery Shortcut
                </a>
              </div>
            </article>

            <article className="rounded-3xl border border-[#ead7c8] bg-[#fffaf5] p-5">
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
                className="mt-5 inline-block w-full rounded-full bg-[#a63a0a] px-5 py-3 text-center font-bold text-white sm:w-auto"
              >
                Install Browser Extension
              </a>
            </article>

            <article className="rounded-3xl border border-[#ead7c8] bg-[#fffaf5] p-5">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#a63a0a]">
                Safari Extension
              </p>

              <h3 className="mt-2 text-xl font-bold text-[#2b1b14]">
                Coming Soon
              </h3>

              <p className="mt-2 text-[#6d5549]">
                Apple Shortcuts work today while we prepare the Safari
                extension.
              </p>
            </article>
          </div>

          <button
  type="button"
  onClick={() => {
    router.replace("/");
  }}
  className="mt-8 w-full rounded-full border border-[#ead7c8] px-5 py-3 font-semibold text-[#6d5549]"
>
  Start Building Your Kitchen
</button>
        </section>
      </section>
    </main>
  );
}