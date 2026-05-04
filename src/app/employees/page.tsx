"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Employee } from "@/lib/types";
import { EmployeeAvatar } from "@/components/EmployeeAvatar";
import { ColorWheel } from "@/components/ColorWheel";
import { PROFILE_EMOJIS } from "@/lib/emojis";

const DEFAULT_COLOR = "#3b82f6";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [name, setName] = useState("");
  const [initials, setInitials] = useState("");
  const [color, setColor] = useState<string>(DEFAULT_COLOR);
  const [emoji, setEmoji] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("name");
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setError(null);
    setEmployees(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const reset = () => {
    setName("");
    setInitials("");
    setColor(DEFAULT_COLOR);
    setEmoji(null);
    setEditingId(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !initials.trim()) return;
    const payload = {
      name: name.trim(),
      initials: initials.trim().toUpperCase(),
      color,
      emoji,
    };
    if (editingId) {
      const { error } = await supabase
        .from("employees")
        .update(payload)
        .eq("id", editingId);
      if (error) {
        setError(error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("employees").insert(payload);
      if (error) {
        setError(error.message);
        return;
      }
    }
    setError(null);
    reset();
    load();
  };

  const startEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setName(emp.name);
    setInitials(emp.initials);
    setColor(emp.color || DEFAULT_COLOR);
    setEmoji(emp.emoji ?? null);
  };

  const remove = async (id: number) => {
    if (!confirm("Opravdu smazat tento profil?")) return;
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setError(null);
    load();
  };

  const previewEmployee: Pick<Employee, "initials" | "color" | "emoji"> = {
    initials: initials.trim().toUpperCase() || "?",
    color,
    emoji,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Zaměstnanci</h1>
        <p className="mt-1 text-sm text-slate-500">
          Profily, kterými se obsluha podepisuje na lepíky a checklisty.
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <form
        onSubmit={submit}
        className="space-y-5 rounded-3xl border border-slate-200/70 bg-white p-6 shadow-md shadow-slate-200/40 dark:border-slate-800/70 dark:bg-slate-900 dark:shadow-black/30"
      >
        <h2 className="text-lg font-semibold">
          {editingId ? "Upravit profil" : "Přidat nový profil"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Jméno</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Honza Novák"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Iniciály (max 3)</span>
            <input
              value={initials}
              onChange={(e) => setInitials(e.target.value.slice(0, 3))}
              placeholder="HN"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm uppercase transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950"
              required
            />
          </label>
        </div>

        <div className="grid gap-6 sm:grid-cols-[auto,1fr]">
          {/* Color wheel + náhled */}
          <div className="flex flex-col items-center gap-3">
            <span className="text-sm font-medium">Barva avataru</span>
            <ColorWheel value={color} onChange={setColor} size={200} />
            <div className="flex items-center gap-3">
              <EmployeeAvatar employee={previewEmployee} size="lg" />
              <span className="text-xs text-slate-500">Náhled</span>
            </div>
          </div>

          {/* Emoji picker */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">Emoji ikonka</span>
              <button
                type="button"
                onClick={() => setEmoji(null)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition active:scale-95 ${
                  emoji === null
                    ? "bg-blue-500 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                Žádné (iniciály)
              </button>
            </div>
            <div className="grid grid-cols-8 gap-1.5">
              {PROFILE_EMOJIS.map((em) => {
                const active = emoji === em;
                return (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setEmoji(em)}
                    className={`flex aspect-square items-center justify-center rounded-xl text-2xl transition active:scale-90 ${
                      active
                        ? "bg-blue-50 ring-2 ring-blue-500 dark:bg-blue-950"
                        : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800"
                    }`}
                    aria-label={`Emoji ${em}`}
                  >
                    {em}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition active:scale-95 hover:bg-blue-600"
          >
            {editingId ? "Uložit" : "Přidat"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={reset}
              className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-900 transition active:scale-95 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              Zrušit
            </button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        {loading && <p className="text-sm text-slate-500">Načítám…</p>}
        {!loading && employees.length === 0 && (
          <div className="rounded-3xl border border-slate-200/70 bg-white p-10 text-center dark:border-slate-800/70 dark:bg-slate-900">
            <div className="text-5xl">👥</div>
            <p className="mt-3 text-base font-medium">Zatím žádné profily</p>
            <p className="mt-1 text-sm text-slate-500">
              Přidej první nahoře.
            </p>
          </div>
        )}
        {employees.map((e) => (
          <div
            key={e.id}
            className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900"
          >
            <EmployeeAvatar employee={e} size="md" />
            <div className="flex-1">
              <div className="font-semibold">{e.name}</div>
              <div className="text-xs text-slate-500">{e.initials}</div>
            </div>
            <button
              onClick={() => startEdit(e)}
              className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition active:scale-95 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Upravit
            </button>
            <button
              onClick={() => remove(e.id)}
              className="rounded-xl bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 transition active:scale-95 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-300 dark:hover:bg-red-950"
            >
              Smazat
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
