"use client";
import { createPortal } from "react-dom";

type OnboardingProps = {
  onStartTour: () => void;
  onSkip: () => void;
};

export default function OnboardingModal({
  onStartTour,
  onSkip,
}: OnboardingProps) {
  return createPortal(
  <div className="fixed inset-0 z-[5000] overflow-y-auto bg-black/60 px-4 py-6">
      <div className="flex min-h-full items-center justify-center">
        <section className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onSkip}
              className="text-sm font-medium text-[#6d5549]"
            >
              Skip
            </button>
          </div>

          <p className="mt-2 text-sm font-bold uppercase tracking-[0.2em] text-[#a63a0a]">
            Welcome to Hey Chef
          </p>

          <h2 className="mt-3 text-3xl font-bold text-[#2b1b14]">
            Let’s get your kitchen started
          </h2>

          <p className="mt-4 text-lg leading-7 text-[#6d5549]">
            We’ll walk through the real import tools using a Chewy Chocolate
            Chip Cookies recipe.
          </p>

          <div className="mt-6 rounded-3xl border border-[#ead7c8] bg-[#fffaf5] p-5">
            <p className="font-bold text-[#2b1b14]">
              During this quick tour, you’ll learn how to:
            </p>

            <div className="mt-4 space-y-3 text-[#6d5549]">
              <p>🔗 Import a recipe from a website</p>
              <p>🥫 Import a grocery product</p>
              <p>🛒 Add something directly to your shopping list</p>
              <p>🏠 Add food you already have to your pantry</p>
            </div>
          </div>

          <div className="mt-5 text-sm leading-6 text-[#6d5549]">
            
          

          <button
            type="button"
            onClick={onStartTour}
            className="mt-7 w-full rounded-full bg-[#a63a0a] px-5 py-3 font-bold text-white"
          >
            Start the Quick Tour
          </button>

          <button
            type="button"
            onClick={onSkip}
            className="mt-3 w-full rounded-full border border-[#ead7c8] px-5 py-3 font-semibold text-[#6d5549]"
          >
            Explore on My Own
          </button>
          </div>
        </section>
      </div>
    </div>
   ,
  document.body
);
}