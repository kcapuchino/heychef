export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#f8efe6] px-5 py-10 text-[#2b1a12]">
      <div className="mx-auto max-w-3xl">
        <a
          href="/"
          className="mb-6 inline-block text-sm font-bold text-[#a63a0a]"
        >
          ← Back to Hey Chef
        </a>

        <div className="rounded-[2rem] bg-white p-8 shadow-sm">
          <h1 className="mb-6 text-4xl font-bold">
            Contact Hey Chef
          </h1>

          <p className="mb-8 text-lg text-[#6d5549]">
            Questions, feedback, bug reports, or feature requests? Send a
            message below.
          </p>

          <form
            action="https://formsubmit.co/kcapuchino06@gmail.com"
            method="POST"
            className="space-y-4"
          >
            <input
              type="hidden"
              name="_subject"
              value="New Hey Chef message"
            />

            <input
              type="hidden"
              name="_captcha"
              value="false"
            />

            <div>
              <label className="mb-2 block font-bold">
                Name
              </label>

              <input
                name="name"
                required
                className="w-full rounded-full border border-[#ead7c8] px-5 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-bold">
                Email
              </label>

              <input
                type="email"
                name="email"
                required
                className="w-full rounded-full border border-[#ead7c8] px-5 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block font-bold">
                Message
              </label>

              <textarea
                name="message"
                required
                rows={6}
                className="w-full rounded-3xl border border-[#ead7c8] px-5 py-3"
              />
            </div>

            <button
              type="submit"
              className="rounded-full bg-[#a63a0a] px-6 py-3 font-bold text-white"
            >
              Send Message
            </button>
          </form>
        </div>

         <footer className="mt-10 border-t border-[#ead7c8] pt-6 text-center text-sm text-[#6d5549]">
          <p>© 2020–2026 Hey Chef™. All rights reserved.</p>

          <div className="mt-3 flex flex-wrap justify-center gap-6">
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="/delete-account">Delete Account</a>
            <a href="/contact">Contact</a>
          </div>
        </footer>
      </div>
    </main>
  );
}