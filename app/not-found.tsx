"use client";

import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fffaf5] px-6">
      <div className="max-w-lg text-center">
        <div className="mb-6 text-7xl">🍳</div>

        <h1 className="mb-3 text-5xl font-bold text-[#a63a0a]">
          404
        </h1>

        <h2 className="mb-4 text-3xl font-bold text-[#2b1b14]">
          Recipe Not Found
        </h2>

        <p className="mb-8 text-lg text-[#6d5549]">
          Looks like this page isn't on the menu.
          Let's get you back to cooking.
        </p>

        <button
          type="button"
          onClick={() => {
  window.location.href = "/";
}}
          className="rounded-full bg-[#a63a0a] px-8 py-4 font-bold text-white transition hover:opacity-90"
        >
          🏠 Back to Hey Chef
        </button>
      </div>
    </main>
  );
}