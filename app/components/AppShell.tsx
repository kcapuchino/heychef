"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/recipes", label: "Recipes" },
  { href: "/planner", label: "Meal Planner" },
  { href: "/shopping", label: "Shopping List" },
  { href: "/pantry", label: "My Pantry" },
  { href: "/settings", label: "⚙️ Settings" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-[#f8efe6] px-5 py-6 pb-28 text-[#2b1a12] md:p-8">
      <section className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between gap-3">
          <Link href="/" className="text-3xl font-bold text-[#a63a0a]">
            Hey Chef™
          </Link>

          <nav className="hidden items-center gap-8 text-lg md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  pathname === item.href
                    ? "font-bold text-[#a63a0a]"
                    : "text-[#6d5549]"
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        {children}

        <footer className="mt-20 border-t border-[#ead7c8] pt-8 text-center text-sm text-[#6d5549]">
          <p>© 2020–2026 Hey Chef™. All rights reserved.</p>

          <div className="mt-3 flex justify-center gap-6">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </footer>
      </section>

      <nav className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-5 border-t border-[#ead7c8] bg-[#fffaf3] text-xs shadow-2xl md:hidden">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-2 py-3 text-center ${
              pathname === item.href
                ? "font-bold text-[#a63a0a]"
                : "text-[#6d5549]"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </main>
  );
}