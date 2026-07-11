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
          <h1 className="mb-3 text-4xl font-bold">Privacy Policy</h1>

          <p className="mb-8 text-[#6d5549]">
            Last updated: July 10, 2026
          </p>

          <div className="space-y-8 leading-7">
            <section>
              <h2 className="mb-2 text-2xl font-bold">
                About This Policy
              </h2>

              <p>
                This Privacy Policy explains how Hey Chef collects, uses,
                stores, and protects information when you use the Hey Chef
                website, progressive web app, or mobile application.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-2xl font-bold">
                Information We Collect
              </h2>

              <p className="mb-3">
                We collect information you provide when you create and use a
                Hey Chef account, including:
              </p>

              <ul className="list-disc space-y-2 pl-6">
                <li>Your email address and display name.</li>
                <li>
                  Account information, including your membership status and
                  account creation date.
                </li>
                <li>
                  Recipes, ingredients, cooking instructions, recipe images,
                  categories, favorites, and recipe source links.
                </li>
                <li>
                  Meal plans, planned dates, meals, leftovers, and cooking
                  history.
                </li>
                <li>
                  Shopping-list items, product information, store links, and
                  checked-item status.
                </li>
                <li>
                  Pantry items, quantities, categories, product details, and
                  related images.
                </li>
                <li>
                  Information you voluntarily submit through a contact form or
                  support request.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 text-2xl font-bold">
                How We Use Your Information
              </h2>

              <p className="mb-3">We use your information to:</p>

              <ul className="list-disc space-y-2 pl-6">
                <li>Create, authenticate, and maintain your account.</li>
                <li>
                  Save and synchronize your recipes, meal plans, shopping
                  lists, pantry items, and related account content.
                </li>
                <li>
                  Provide features such as recipe importing, pantry matching,
                  shopping-list creation, and meal planning.
                </li>
                <li>
                  Respond to support questions and account deletion requests.
                </li>
                <li>
                  Maintain the security, reliability, and functionality of Hey
                  Chef.
                </li>
                <li>
                  Diagnose technical errors and improve the application.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 text-2xl font-bold">
                Authentication and Data Storage
              </h2>

              <p>
                Hey Chef uses Supabase to provide account authentication and
                database storage. Your account information and saved Hey Chef
                content may be processed and stored through Supabase systems.
                Supabase provides authentication and database services used to
                identify users and control access to saved information.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-2xl font-bold">
                Third-Party Websites and Recipe Imports
              </h2>

              <p>
                Hey Chef may allow you to import information from recipe,
                grocery, or retail websites. When you visit or import content
                from a third-party website, that website may collect
                information according to its own privacy policy. Hey Chef does
                not control the privacy practices of third-party websites.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-2xl font-bold">
                Payments
              </h2>

              <p>
                If paid memberships or other purchases are offered, payment
                information may be processed by a third-party payment
                provider. Hey Chef does not intend to directly store complete
                payment card numbers. The payment provider&apos;s privacy
                policy and terms will apply to payment processing.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-2xl font-bold">
                Analytics and Technical Information
              </h2>

              <p>
                Hey Chef may receive limited technical information necessary
                to operate and troubleshoot the service, such as browser type,
                device type, error information, and application requests.
                This information may be generated by hosting, authentication,
                database, or deployment providers.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-2xl font-bold">
                How We Share Information
              </h2>

              <p>
                We do not sell your personal information. Information may be
                shared with service providers only as necessary to operate,
                host, secure, support, or process features of Hey Chef. We may
                also disclose information when required by law or when
                necessary to protect the rights, safety, and security of Hey
                Chef, its users, or others.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-2xl font-bold">
                Data Retention
              </h2>

              <p>
                We retain your account information and saved content while your
                account remains active or as needed to provide Hey Chef. When
                you delete your account, the application removes the account
                and associated saved Hey Chef data from the active database,
                subject to limited retention that may be required for legal,
                fraud-prevention, security, or backup purposes.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-2xl font-bold">
                Account and Data Deletion
              </h2>

              <p className="mb-3">
                You may permanently delete your Hey Chef account from within
                the application:
              </p>

              <ol className="list-decimal space-y-2 pl-6">
                <li>Sign in to your Hey Chef account.</li>
                <li>Open Profile.</li>
                <li>Scroll to the Danger Zone.</li>
                <li>Select Delete My Account.</li>
                <li>Type DELETE and confirm.</li>
              </ol>

              <p className="mt-3">
                Account deletion removes your account information, recipes,
                meal plans, shopping-list items, pantry items, recently made
                history, and other saved Hey Chef data. This action cannot be
                undone.
              </p>

              <p className="mt-3">
                You may also review the public deletion instructions at{" "}
                <a
                  href="/delete-account"
                  className="font-semibold text-[#a63a0a] underline"
                >
                  Delete Your Hey Chef Account
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-2xl font-bold">
                Data Security
              </h2>

              <p>
                We use reasonable administrative and technical measures to
                protect account information and saved data. These measures
                include authenticated account access, database access controls,
                and server-side protection for sensitive administrative
                operations. No online service can guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-2xl font-bold">
                Children&apos;s Privacy
              </h2>

              <p>
                Hey Chef is not directed to children under 13, and we do not
                knowingly collect personal information from children under 13.
                If you believe a child has provided personal information,
                contact us so we can review and remove it.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-2xl font-bold">
                Changes to This Policy
              </h2>

              <p>
                We may update this Privacy Policy as Hey Chef changes. The
                revised date at the top of this page will show when the policy
                was most recently updated.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-2xl font-bold">Contact</h2>

              <p>
                Questions, privacy requests, or account deletion requests may
                be sent to{" "}
                <a
                  href="mailto:kcapuchino06@gmail.com"
                  className="font-semibold text-[#a63a0a] underline"
                >
                  kcapuchino06@gmail.com
                </a>
                .
              </p>
            </section>
          </div>
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