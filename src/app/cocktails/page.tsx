"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Cocktail } from "@/lib/types";
import { ProfileGate } from "@/components/ProfileGate";

export default function CocktailsPage() {
  return (
    <ProfileGate>
      <CocktailsList />
    </ProfileGate>
  );
}

function CocktailsList() {
  const [cocktails, setCocktails] = useState<Cocktail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("cocktails")
      .select("*")
      .order("name")
      .then(({ data }) => {
        setCocktails(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Recepty</h1>
          <p className="mt-1 text-sm text-slate-500">
            Naše nabídka — fotka + bullet point postup.
          </p>
        </div>
        <Link
          href="/cocktails/new"
          className="rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition active:scale-95 hover:bg-blue-600"
        >
          + Nový recept
        </Link>
      </div>

      {loading && <p className="text-sm text-slate-500">Načítám…</p>}
      {!loading && cocktails.length === 0 && (
        <div className="rounded-3xl border border-slate-200/70 bg-white p-10 text-center dark:border-slate-800/70 dark:bg-slate-900">
          <div className="text-5xl">🍸</div>
          <p className="mt-3 text-base font-medium">Zatím žádné recepty</p>
          <p className="mt-1 text-sm text-slate-500">Přidej první.</p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
        {cocktails.map((c) => (
          <Link
            key={c.id}
            href={`/cocktails/${c.id}`}
            className="group overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-md shadow-slate-200/40 transition active:scale-95 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800/70 dark:bg-slate-900 dark:shadow-black/30"
          >
            <div className="relative aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
              {c.image_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={c.image_url}
                  alt={c.name}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-5xl">
                  🍸
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="font-semibold">{c.name}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
