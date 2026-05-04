"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Cocktail } from "@/lib/types";
import { CocktailForm } from "../CocktailForm";
import { ProfileGate } from "@/components/ProfileGate";

export default function CocktailDetailPage() {
  return (
    <ProfileGate>
      <CocktailDetail />
    </ProfileGate>
  );
}

function CocktailDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [cocktail, setCocktail] = useState<Cocktail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("cocktails")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    setCocktail(data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async () => {
    if (!cocktail) return;
    if (!confirm(`Smazat recept "${cocktail.name}"?`)) return;
    await supabase.from("cocktails").delete().eq("id", cocktail.id);
    router.push("/cocktails");
  };

  if (loading) return <p className="text-sm text-slate-500">Načítám…</p>;
  if (!cocktail)
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-500">Recept nenalezen.</p>
        <Link href="/cocktails" className="text-sm underline">
          Zpět na recepty
        </Link>
      </div>
    );

  if (editing) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Upravit recept</h1>
        <CocktailForm
          cocktail={cocktail}
          onSaved={() => {
            setEditing(false);
            load();
          }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  const stepsList = (cocktail.steps ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <article className="space-y-6">
      <Link
        href="/cocktails"
        className="text-sm text-slate-500 hover:text-blue-500 hover:underline"
      >
        ← Recepty
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-3xl font-bold">{cocktail.name}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(true)}
            className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition active:scale-95 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Upravit
          </button>
          <button
            onClick={remove}
            className="rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition active:scale-95 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-300 dark:hover:bg-red-950"
          >
            Smazat
          </button>
        </div>
      </header>

      {cocktail.image_url && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={cocktail.image_url}
          alt={cocktail.name}
          className="max-h-96 w-full rounded-3xl object-cover shadow-md"
        />
      )}

      {stepsList.length > 0 ? (
        <ul className="space-y-3 rounded-3xl border border-slate-200/70 bg-white p-6 shadow-md shadow-slate-200/40 dark:border-slate-800/70 dark:bg-slate-900 dark:shadow-black/30">
          {stepsList.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-sm font-bold text-blue-500">{i + 1}.</span>
              <span className="text-sm">{s}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">Recept zatím nemá postup.</p>
      )}
    </article>
  );
}
