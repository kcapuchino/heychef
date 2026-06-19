export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f8efe6] px-5 py-10 text-[#2b1a12]">
      <div className="mx-auto max-w-3xl">
        <a
          href="/"
          className="mb-6 inline-block text-sm font-bold text-[#a63a0a]"
        >
          ← Back to Hey Chef
        </a>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm md:p-10">
          <h1 className="mb-6 text-4xl font-bold">Privacy Policy</h1>

          <p className="mb-6 text-[#6d5549]">
            Last updated: June 2026
          </p>

          <div className="space-y-6">
            <section>
              <h2 className="mb-2 text-2xl font-bold">
                Information We Collect
              </h2>
              <p>
                We collect information you provide when creating an account,
                including your email address, recipes, meal plans, pantry items,
                and shopping lists.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-2xl font-bold">
                How We Use Information
              </h2>
              <p>
                We use your information to provide and improve Hey Chef,
                synchronize your saved content, and maintain account access.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-2xl font-bold">
                Third-Party Services
              </h2>
              <p>
                Hey Chef uses Supabase for authentication and data storage.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-2xl font-bold">
                Your Data
              </h2>
              <p>
                You may edit or delete your recipes and account data at any
                time.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-2xl font-bold">
                Contact
              </h2>
              <p>
                Questions about this policy? Contact us at
                {" "}
                kcapuchino06@gmail.com
              </p>
            </section>
          </div>
        </div>

        <footer className="mt-10 border-t border-[#ead7c8] pt-6 text-center text-sm text-[#6d5549]">
          <p>© 2020–2026 Hey Chef™. All rights reserved.</p>

          <div className="mt-3 flex justify-center gap-6">
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="/contact">Contact</a>
          </div>
        </footer>
      </div>
    </main>
  );
}