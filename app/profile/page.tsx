"use client";

import { useState } from "react";
import AppShell from "../components/AppShell";
import { supabase } from "@/lib/supabase";

export default function profilePage() {
  const [userEmail] = useState("");
  const [userCreatedAt] = useState("");
  const [displayName, setDisplayName] = useState("");

  function showToast(message: string) {
    alert(message);
  }

  async function changePasswordNow() {
    const password = prompt("Enter your new password:");
    if (!password) return;

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      showToast(error.message);
      return;
    }

    showToast("Password updated.");
  }

  return (
    <AppShell>
      <section className="rounded-[2rem] bg-white p-6 shadow-xl">
        <h1 className="mb-2 text-4xl font-bold">Profile</h1>

        <p className="mb-6 text-[#6d5549]">
          Update your name and account settings.
        </p>

        <div className="mb-6 rounded-[1.5rem] border border-[#ead7c8] bg-[#fbf7f2] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[#a63a0a]">
                Membership
              </p>

              <h2 className="text-2xl font-bold">
                {userEmail.endsWith("@in.gov")
                  ? "🏛️ State Employee Chef"
                  : "⭐ Hey Chef Member"}
              </h2>

              <p className="mt-1 text-sm text-[#6d5549]">
                {userEmail.endsWith("@in.gov")
                  ? "Complimentary Premium Access"
                  : "Free Membership"}
              </p>

              {userEmail.endsWith("@in.gov") && (
                <p className="mt-2 text-sm text-[#6d5549]">
                  In appreciation of your public service.
                </p>
              )}

              <p className="mt-2 text-sm text-[#6d5549]">
                Joined{" "}
                {userCreatedAt
                  ? new Date(userCreatedAt).toLocaleDateString()
                  : "Recently"}
              </p>
            </div>

            <button
              onClick={() => {
                window.location.href = "/founding-chef";
              }}
              className="rounded-full border border-[#a63a0a] px-5 py-3 font-semibold text-[#a63a0a]"
            >
              Become a Founding Chef
            </button>
          </div>
        </div>

        <div className="mb-6 rounded-[1.5rem] border border-[#ead7c8] p-5">
          <p className="mb-1 text-sm uppercase tracking-[0.2em] text-[#a63a0a]">
            Account
          </p>

          <p className="font-semibold">{userEmail || "Not signed in"}</p>

          <p className="mt-1 text-sm text-[#6d5549]">
            Account created{" "}
            {userCreatedAt
              ? new Date(userCreatedAt).toLocaleDateString()
              : "Recently"}
          </p>
        </div>

        <label className="mb-2 block font-semibold">Display Name</label>

        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Chef"
          className="mb-5 w-full rounded-full border border-[#ead7c8] px-5 py-3"
        />

        <button
          onClick={async () => {
            const {
              data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
              showToast("Please log in again.");
              return;
            }

            const { error } = await supabase
              .from("profiles")
              .update({
                display_name: displayName.trim() || null,
              })
              .eq("id", user.id);

            if (error) {
              showToast(error.message);
              return;
            }

            showToast("Profile saved.");
          }}
          className="w-full rounded-full bg-[#a63a0a] px-6 py-3 text-white"
        >
          Save Profile
        </button>

        <button
          onClick={changePasswordNow}
          className="mt-3 w-full rounded-full border border-[#a63a0a] px-6 py-3 text-[#a63a0a]"
        >
          Change Password
        </button>

        <div className="mt-8 border-t border-[#ead7c8] pt-6">
          <h2 className="mb-2 text-lg font-bold text-red-700">
            Danger Zone
          </h2>

          <p className="mb-4 text-sm text-[#6d5549]">
            Permanently delete your Hey Chef account and saved data.
            <br />
            Contact support and we'll process your request.
          </p>

          <button
            onClick={() => {
              window.location.href =
                "mailto:kcapuchino06@gmail.com?subject=Hey Chef Account Deletion Request";
            }}
            className="w-full rounded-full border border-red-600 px-6 py-3 font-semibold text-red-600"
          >
            Request Account Deletion
          </button>
        </div>
      </section>
    </AppShell>
  );
}