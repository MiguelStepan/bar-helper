"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Checklist } from "@/lib/types";
import { ProfileGate } from "@/components/ProfileGate";

export default function ChecklistsPage() {
  return (
    <ProfileGate>
      <ChecklistsList />
    </ProfileGate>
  );
}

function ChecklistsList() {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("checklists")
      .select("*")
      .order("name");
    setChecklists(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await supabase.from("checklists").insert({ name: name.trim() });
    setName("");
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Checklisty</h1>
        <p className="mt-1 text-sm text-slate-500">
          Šablony rutin — otevření, zavření, …
        </p>
      </div>

      <form
        onSubmit={create}
        className="flex gap-2 rounded-3xl border border-slate-200/70 bg-white p-4 shadow-md shadow-slate-200/40 dark:border-slate-800/70 dark:bg-slate-900 dark:shadow-black/30"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Otevření baru"
          className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950"
        />
        <button
          type="submit"
          className="rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition active:scale-95 hover:bg-blue-600"
        >
          + Přidat
        </button>
      </form>

      {loading && <p className="text-sm text-slate-500">Načítám…</p>}
      {!loading && checklists.length === 0 && (
        <div className="rounded-3xl border border-slate-200/70 bg-white p-10 text-center dark:border-slate-800/70 dark:bg-slate-900">
          <div className="text-5xl">✅</div>
          <p className="mt-3 text-base font-medium">Žádné checklisty</p>
          <p className="mt-1 text-sm text-slate-500">
            Začni přidáním šablony.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {checklists.map((c) => (
          <Link
            key={c.id}
            href={`/checklists/${c.id}`}
            className="block rounded-3xl border border-slate-200/70 bg-white p-5 shadow-md shadow-slate-200/40 transition active:scale-95 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800/70 dark:bg-slate-900 dark:shadow-black/30"
          >
            <div className="text-lg font-semibold">{c.name}</div>
            <div className="mt-1 text-xs text-slate-500">
              Otevři pro odškrtávání →
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
