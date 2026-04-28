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
        <h1 className="text-2xl font-bold">Checklisty</h1>
        <p className="text-sm text-slate-500">
          Šablony rutin — otevření, zavření, …
        </p>
      </div>

      <form
        onSubmit={create}
        className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Otevření baru"
          className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
        />
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
        >
          + Přidat
        </button>
      </form>

      {loading && <p className="text-sm text-slate-500">Načítám…</p>}
      {!loading && checklists.length === 0 && (
        <p className="text-sm text-slate-500">
          Žádné checklisty. Začni přidáním šablony.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {checklists.map((c) => (
          <Link
            key={c.id}
            href={`/checklists/${c.id}`}
            className="block rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
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
