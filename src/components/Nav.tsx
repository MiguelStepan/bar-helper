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
    <header className="bar-nav-blur sticky top-0 z-10 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/70">
      <nav className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:gap-6">
        <Link
          href="/cocktails"
          className="font-bold tracking-tight transition active:scale-95"
        >
          🍸 Bar&nbsp;Helper
        </Link>
        <div className="flex flex-1 flex-wrap gap-1 sm:gap-2">
          {links.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition active:scale-95 sm:text-base ${
                  active
                    ? "bg-blue-500 text-white shadow-md shadow-blue-500/30"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
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
            className="flex items-center gap-2 rounded-full bg-slate-100 py-1 pl-1 pr-3 text-xs font-medium text-slate-700 transition active:scale-95 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
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
