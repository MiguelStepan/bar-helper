"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActiveProfile, setActiveProfileId } from "@/lib/profile";
import { EmployeeAvatar } from "./EmployeeAvatar";

const links = [
  { href: "/cocktails", label: "Recepty" },
  { href: "/checklists", label: "Checklisty" },
  { href: "/notes", label: "Lepíky" },
  { href: "/employees", label: "Zaměstnanci" },
];

export function Nav() {
  const pathname = usePathname();
  const { profile, loading } = useActiveProfile();

  if (pathname === "/") return null;

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <nav className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:gap-6">
        <Link href="/cocktails" className="font-bold tracking-tight">
          🍸 Bar&nbsp;Helper
        </Link>
        <div className="flex flex-1 flex-wrap gap-1 sm:gap-2">
          {links.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-md px-2 py-1 text-sm transition sm:px-3 sm:text-base ${
                  active
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
        {!loading && profile && (
          <button
            type="button"
            onClick={() => {
              setActiveProfileId(null);
              window.location.href = "/";
            }}
            className="flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3 text-xs text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            title="Odhlásit profil"
          >
            <EmployeeAvatar employee={profile} size="sm" />
            <span className="hidden sm:inline">{profile.name}</span>
          </button>
        )}
      </nav>
    </header>
  );
}
