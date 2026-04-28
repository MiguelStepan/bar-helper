"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Employee } from "@/lib/types";
import { EmployeeAvatar } from "@/components/EmployeeAvatar";

const COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [name, setName] = useState("");
  const [initials, setInitials] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("employees")
      .select("*")
      .order("name");
    setEmployees(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const reset = () => {
    setName("");
    setInitials("");
    setColor(COLORS[0]);
    setEditingId(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !initials.trim()) return;
    const payload = {
      name: name.trim(),
      initials: initials.trim().toUpperCase(),
      color,
    };
    if (editingId) {
      await supabase.from("employees").update(payload).eq("id", editingId);
    } else {
      await supabase.from("employees").insert(payload);
    }
    reset();
    load();
  };

  const startEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setName(emp.name);
    setInitials(emp.initials);
    setColor(emp.color || COLORS[0]);
  };

  const remove = async (id: number) => {
    if (!confirm("Opravdu smazat tento profil?")) return;
    await supabase.from("employees").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Zaměstnanci</h1>
        <p className="text-sm text-slate-500">
          Profily, kterými se obsluha podepisuje na lepíky a checklisty.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
      >
        <h2 className="font-semibold">
          {editingId ? "Upravit profil" : "Přidat nový profil"}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Jméno</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Honza Novák"
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Iniciály (max 3)</span>
            <input
              value={initials}
              onChange={(e) => setInitials(e.target.value.slice(0, 3))}
              placeholder="HN"
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm uppercase dark:border-slate-700 dark:bg-slate-950"
              required
            />
          </label>
        </div>
        <div>
          <span className="text-sm font-medium">Barva avataru</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-8 w-8 rounded-full transition ${
                  color === c ? "ring-2 ring-offset-2 ring-slate-900 dark:ring-slate-100" : ""
                }`}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
          >
            {editingId ? "Uložit" : "Přidat"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={reset}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm dark:border-slate-700"
            >
              Zrušit
            </button>
          )}
        </div>
      </form>

      <div className="space-y-2">
        {loading && <p className="text-sm text-slate-500">Načítám…</p>}
        {!loading && employees.length === 0 && (
          <p className="text-sm text-slate-500">Žádné profily zatím.</p>
        )}
        {employees.map((e) => (
          <div
            key={e.id}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
          >
            <EmployeeAvatar employee={e} size="md" />
            <div className="flex-1">
              <div className="font-medium">{e.name}</div>
              <div className="text-xs text-slate-500">{e.initials}</div>
            </div>
            <button
              onClick={() => startEdit(e)}
              className="rounded-md border border-slate-300 px-3 py-1 text-xs hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Upravit
            </button>
            <button
              onClick={() => remove(e.id)}
              className="rounded-md border border-red-300 px-3 py-1 text-xs text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
            >
              Smazat
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
