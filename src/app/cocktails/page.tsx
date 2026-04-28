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
          <h1 className="text-2xl font-bold">Recepty</h1>
          <p className="text-sm text-slate-500">
            Naše nabídka — fotka + bullet point postup.
          </p>
        </div>
        <Link
          href="/cocktails/new"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
        >
          + Nový recept
        </Link>
      </div>

      {loading && <p className="text-sm text-slate-500">Načítám…</p>}
      {!loading && cocktails.length === 0 && (
        <p className="text-sm text-slate-500">
          Zatím žádné recepty. Přidej první.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {cocktails.map((c) => (
          <Link
            key={c.id}
            href={`/cocktails/${c.id}`}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
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
                <div className="flex h-full w-full items-center justify-center text-4xl">
                  🍸
                </div>
              )}
            </div>
            <div className="p-3">
              <div className="font-semibold">{c.name}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
