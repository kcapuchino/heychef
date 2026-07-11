"use client";
export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8efe6] px-6">
      <section className="w-full max-w-md rounded-[2rem] border border-[#ead7c8] bg-white p-8 text-center shadow-sm">
        <div className="text-5xl">🍳</div>

        <h1 className="mt-4 text-3xl font-bold text-[#2b1b14]">
          You’re offline
        </h1>

        <p className="mt-3 text-[#6d5549]">
          Hey Chef needs an internet connection to sync your recipes, meal
          plans, shopping list and pantry.
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 w-full rounded-full bg-[#a63a0a] px-5 py-3 font-bold text-white"
        >
          Try Again
        </button>
      </section>
    </main>
  );
}