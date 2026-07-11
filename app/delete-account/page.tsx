export default function DeleteAccountPage() {
  return (
    <main className="min-h-screen bg-[#f8efe6] px-6 py-12">
      <section className="mx-auto max-w-2xl rounded-[2rem] border border-[#ead7c8] bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#a63a0a]">
          Hey Chef
        </p>

        <h1 className="mt-2 text-4xl font-bold text-[#2b1b14]">
          Delete your account
        </h1>

        <p className="mt-4 leading-7 text-[#6d5549]">
          You can permanently delete your Hey Chef account from inside the app.
        </p>

        <div className="mt-6 rounded-[1.5rem] border border-[#ead7c8] bg-[#fbf7f2] p-5">
          <h2 className="text-xl font-bold text-[#2b1b14]">
            Delete your account in Hey Chef
          </h2>

          <ol className="mt-4 list-decimal space-y-2 pl-6 text-[#6d5549]">
            <li>Sign in to your Hey Chef account.</li>
            <li>Open Profile.</li>
            <li>Scroll to the Danger Zone.</li>
            <li>Select Delete My Account.</li>
            <li>Type DELETE and confirm.</li>
          </ol>
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-red-200 bg-red-50 p-5">
          <h2 className="text-xl font-bold text-red-800">
            What will be deleted
          </h2>

          <p className="mt-3 leading-7 text-[#6d5549]">
            Deleting your account permanently removes your account information,
            saved recipes, meal plans, shopping-list items, pantry items,
            recently made history, and other saved Hey Chef data.
          </p>

          <p className="mt-3 font-semibold text-red-800">
            This action cannot be undone.
          </p>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-bold text-[#2b1b14]">
            Unable to access your account?
          </h2>

          <p className="mt-3 leading-7 text-[#6d5549]">
            Email support from the address connected to your Hey Chef account
            and request account deletion.
          </p>

          <a
            href="mailto:kcapuchino06@gmail.com?subject=Hey Chef Account Deletion Request"
            className="mt-5 inline-flex rounded-full bg-[#a63a0a] px-6 py-3 font-semibold text-white"
          >
            Email Support
          </a>
        </div>

        <a
          href="/"
          className="mt-8 inline-block font-semibold text-[#a63a0a] underline"
        >
          Return to Hey Chef
        </a>
      </section>
       <footer className="mt-10 border-t border-[#ead7c8] pt-6 text-center text-sm text-[#6d5549]">
          <p>© 2020–2026 Hey Chef™. All rights reserved.</p>

          <div className="mt-3 flex flex-wrap justify-center gap-6">
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="/delete-account">Delete Account</a>
            <a href="/contact">Contact</a>
          </div>
        </footer>
    </main>
  );
}