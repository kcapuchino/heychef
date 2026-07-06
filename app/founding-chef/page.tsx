"use client";

import { useState } from "react";
import { supabase } from "@/Archive/lib/supabase";


export default function Page() {
    const [waitlistEmail, setWaitlistEmail] = useState("");
    const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false);
    const [showWaitlistModal, setShowWaitlistModal] = useState(false);

    async function joinWaitlist() {
  if (!waitlistEmail.trim()) return;

  setIsJoiningWaitlist(true);

  const { error } = await supabase
    .from("founding_chef_waitlist")
    .insert({
      email: waitlistEmail.trim().toLowerCase(),
    });

  if (error) {
    console.error("WAITLIST ERROR:", error);
    alert(error.message);
  } else {
    alert("You're on the waitlist!");
    setWaitlistEmail("");
    setShowWaitlistModal(false);
    setIsJoiningWaitlist(false);
  }

  setIsJoiningWaitlist(false);
}
async function startCheckout(
  type: "founding" | "features" | "coffee" | "support"
) {
  const response = await fetch("/api/create-checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type }),
  });

  const text = await response.text();

  if (!response.ok) {
    console.error("Checkout failed:", text);
    alert("Checkout failed. Check the console.");
    return;
  }

  const data = JSON.parse(text);

  if (data.url) {
    window.location.href = data.url;
  }
}
  return (
    <main className="min-h-screen bg-[#f8efe6] px-6 py-10 text-[#2b1711]">
     
      <section className="mx-auto max-w-6xl">
        <a href="/" className="mb-8 inline-block font-semibold text-[#a63a0a]">
          ← Back to Hey Chef
        </a>

        <section className="mb-8 overflow-hidden rounded-[2rem] bg-white shadow-xl">
  <div className="grid gap-10 p-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:p-12">
    <div>
              <p className="mb-4 text-sm uppercase tracking-[0.3em] text-[#a63a0a]">
                ❤️ Help Build the Future
              </p>

              {/* Mobile image first */}
<div className="mb-8 lg:hidden">
  <img
    src="/hero-kitchen.jpg"
    alt=""
    className="h-[220px] w-full rounded-[1.5rem] object-cover"
  />
</div>

              <h1 className="mb-6 text-center text-5xl font-bold leading-tight md:text-left md:text-7xl">
  Support <br /> Hey Chef
</h1>

<p
  className="mb-6 text-center text-3xl text-[#a63a0a] md:text-left"
  style={{ fontFamily: "'Dancing Script', cursive" }}
>
  Food shouldn&apos;t be this complicated.
</p>
      <div className="mb-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-[#d96f32]" />
        <span className="text-2xl text-[#a63a0a]">♡</span>
        <div className="h-px flex-1 bg-[#d96f32]" />
      </div>


   <p className="mb-6 max-w-2xl text-center text-lg leading-8 text-[#6d5549] md:text-left">
                Hey Chef helps simplify everyday cooking by bringing recipes, meal planning, shopping lists, pantry tracking, and leftovers together in one place. Spend less time figuring out what's for dinner and more time enjoying it.
              </p>

            </div>

            <div className="hidden lg:block rounded-[2rem] bg-[#fff7ef] p-4 shadow-inner">
      <div className="overflow-hidden rounded-[1.5rem] bg-[#1f1713] shadow-2xl">
        <img
          src="/hero-kitchen.jpg"
          alt="Hey Chef app preview"
          className="h-[420px] w-full rounded-[1rem] object-cover object-top"
        />
      </div>
    </div>
  </div>
</section>

        <section className="mb-8 grid gap-6 md:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-[#d8b36a] bg-[#1f1713] p-8 text-white shadow-2xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-[#d8b36a]">
                  Premium Memberships
                </p>

                <h2 className="mt-2 text-3xl font-bold">
                  👨‍🍳 Founding Chef
                </h2>
              </div>

              <span className="rounded-full border border-[#d8b36a] px-4 py-2 text-sm font-bold text-[#d8b36a]">
                Lifetime Access
              </span>
            </div>

            <p className="mb-6">
              <span className="text-6xl font-bold">$49</span>
              <span className="ml-3 text-[#d8b36a]">one-time</span>
            </p>

            <p className="mb-8 leading-7 text-[#f1e5d7]">
              Become a Founding Chef and receive lifetime premium access when
              premium launches.
            </p>

            <div className="mb-8 border-t border-[#4a3a30] pt-8">
              <ul className="space-y-4">
                <li>✓ Lifetime Premium Access</li>
                <li>✓ Founder Badge in Hey Chef</li>
                <li>✓ Early Access to New Features</li>
              </ul>
            </div>

           <button
            onClick={() => startCheckout("founding")}
            className="w-full rounded-full bg-[#d8b36a] px-6 py-4 font-bold text-[#1f1713] transition hover:bg-[#e6c67d]"
          >
            👨‍🍳 Become a Founding Chef
          </button>

            <p className="mt-4 text-center text-sm text-[#d8b36a]">
              Secure one-time payment • Lifetime Premium Access
            </p>
          </div>

          <div className="rounded-[2rem] bg-white p-8 shadow-xl">
            <h2 className="mb-3 text-3xl font-bold">❤️ Just Want to Help?</h2>

            <p className="mb-6 text-[#6d5549]">
              Every little bit helps keep Hey Chef growing.
            </p>

            <div className="grid gap-4">
            {[
            ["$5", "Support development", "Help with hosting and tools.", "support"],
            ["$10", "Buy me a coffee", "Fuel more late-night building.", "coffee"],
            ["$25", "Help fund new features", "Support future improvements.", "features"],
          ].map(([amount, title, text, type]) => (
            <button
              key={amount}
              onClick={() =>
                startCheckout(type as "support" | "coffee" | "features")
              }
              className="flex items-center justify-between rounded-[1.25rem] border border-[#ead7c8] bg-[#fffaf5] px-6 py-5 text-left shadow-sm transition hover:border-[#a63a0a]"
            >
              <div>
                <p className="text-2xl font-bold text-[#a63a0a]">{amount}</p>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-[#6d5549]">{text}</p>
              </div>

              <span className="text-sm font-bold text-[#a63a0a]">
                Support
              </span>
            </button>
          ))}   
      </div>

            <p className="mt-6 text-center text-sm text-[#6d5549]">
              Secure one-time payment • No recurring fees
            </p>
          </div>
        </section>

        <section className="mb-8 rounded-[2rem] bg-white p-8 text-center shadow-xl">
          <p className="mb-8 text-lg uppercase tracking-[0.3em] text-[#a63a0a]">
            Your support helps fund
          </p>

          <div className="grid gap-6 md:grid-cols-5 ">
            <div className="text-lg">🛒<br />Grocery integrations</div>
            <div className="text-lg">💵<br />Budget tracking</div>
            <div className="text-lg">🥫<br />Pantry intelligence</div>
            <div className="text-lg">💻<br />Hosting & development</div>
            <div className="text-lg">✨<br />New features</div>
          </div>
        </section>

        <section className="rounded-[2rem] overflow-hidden bg-white shadow-xl">
  <div className="grid md:grid-cols-[320px_1fr]">
    <div className="bg-[#f8efe6]">
      <img
        src="/kimber.jpg"
        alt="Kimber"
        className="h-full w-full object-cover"
      />
    </div>

    <div className="p-8 md:p-10">
      <p className="mb-3 text-sm uppercase tracking-[0.25em] text-[#a63a0a]">
        Founder Story
      </p>

      <h2 className="mb-6 text-4xl font-bold">
  A Note From Kimber
</h2>

<div className="max-w-3xl space-y-5 text-lg leading-8 text-[#6d5549]">
  <p>
    I first came up with the idea for Hey Chef as a college capstone project in 2019. Like many people, I was constantly juggling recipes, grocery lists, meal plans, pantry items, and leftovers across multiple apps, notes, and websites.
  </p>

  <p>
    After years working in UX and digital strategy, I finally decided to build the app I always wished existed. Today, Hey Chef is being built one feature at a time with help from early users who believe meal planning should be simpler, smarter, and less stressful.
  </p>

  <p
    className="text-xl font-semibold text-[#a63a0a]"
    style={{ fontFamily: "'Dancing Script', cursive" }}
  >
    Thank you for believing in the idea. ❤️
  </p>
      </div>
    </div>
  </div>
</section>
<section className="mt-6 rounded-[2rem] bg-white p-6 shadow-xl">
  <div className="grid gap-6 text-center md:grid-cols-3">
    <div>
      <div className="mb-2 text-3xl">🔒</div>
      <p className="font-semibold">Secure Payments</p>
      <p className="text-sm text-[#6d5549]">
        Processed securely through Stripe.
      </p>
    </div>

    <div>
      <div className="mb-2 text-3xl">⭐</div>
      <p className="font-semibold">One-Time Support</p>
      <p className="text-sm text-[#6d5549]">
        No subscriptions or recurring fees.
      </p>
    </div>

    <div>
      <div className="mb-2 text-3xl">❤️</div>
      <p className="font-semibold">Built With Heart</p>
      <p className="text-sm text-[#6d5549]">
        Independently developed by Kimber.
      </p>
    </div>
  </div>
</section>
      </section>
      {showWaitlistModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
    <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl">
      <h2 className="mb-3 text-3xl font-bold">
        👨‍🍳 Founding Chef
      </h2>

      <p className="mb-6 text-[#6d5549]">
        Coming soon! Join the waitlist and be the first to know when
        Founding Chef memberships launch.
      </p>

      <input
        type="email"
        value={waitlistEmail}
        onChange={(e) => setWaitlistEmail(e.target.value)}
        placeholder="Enter your email"
        className="mb-4 w-full rounded-xl border border-[#ead7c8] px-4 py-3"
      />

      <button
  onClick={joinWaitlist}
  disabled={isJoiningWaitlist}
  className="w-full rounded-full bg-[#a63a0a] px-6 py-4 font-bold text-white"
>
  {isJoiningWaitlist ? "Joining..." : "Join Waitlist"}
</button>

      <button
        onClick={() => setShowWaitlistModal(false)}
        className="mt-3 w-full text-sm text-[#6d5549]"
      >
        Close
      </button>
    </div>
  </div>
)}
    </main>
  );
}