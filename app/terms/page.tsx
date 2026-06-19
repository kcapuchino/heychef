export default function TermsPage() {
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
          <h1 className="mb-6 text-4xl font-bold">
            Terms of Service
          </h1>

          <p className="mb-6 text-[#6d5549]">
            Last updated: June 2026
          </p>

          <div className="space-y-6">
            <section>
              <h2 className="mb-2 text-2xl font-bold">
                Acceptance of Terms
              </h2>
              <p>
                By using Hey Chef, you agree to these terms.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-2xl font-bold">
                User Content
              </h2>
              <p>
                You are responsible for any recipes, notes, or content you save
                within your account.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-2xl font-bold">
                Recipe Imports
              </h2>
              <p>
                Hey Chef helps organize recipes from third-party websites.
                Ownership of imported content remains with its original creator.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-2xl font-bold">
                Availability
              </h2>
              <p>
                Hey Chef is provided "as is" without warranties of any kind.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-2xl font-bold">
                Limitation of Liability
              </h2>
              <p>
                Hey Chef is not liable for damages resulting from use of the
                service.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-2xl font-bold">
                Contact
              </h2>
              <p>
                Questions? Contact us at kcapuchino06@gmail.com
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