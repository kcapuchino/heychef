"use client";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8efe6] px-6">
      <section className="w-full max-w-lg rounded-[2rem] border border-[#ead7c8] bg-white p-10 text-center shadow-lg">
        <img
          src="/hey-chef-logo.png"
          alt="Hey Chef"
          width={184}
          height={77}
          className="mx-auto mb-6 h-auto w-[184px]"
        />

        <h1 className="mt-4 text-3xl font-bold text-[#2b1b14]">
          Preparing your kitchen
        </h1>

        <p className="mt-3 text-[#6d5549]">
          We&apos;ll reconnect automatically when you&apos;re back online.
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