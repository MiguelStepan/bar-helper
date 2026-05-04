"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Checklist, ChecklistItem, Employee } from "@/lib/types";
import { useActiveProfile } from "@/lib/profile";
import { EmployeeAvatar } from "@/components/EmployeeAvatar";
import { ProfileGate } from "@/components/ProfileGate";

export default function ChecklistDetailPage() {
  return (
    <ProfileGate>
      <ChecklistDetail />
    </ProfileGate>
  );
}

function ChecklistDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useActiveProfile();
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [employees, setEmployees] = useState<Record<number, Employee>>({});
  const [newLabel, setNewLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingChecklist, setEditingChecklist] = useState(false);
  const [checklistName, setChecklistName] = useState("");

  const load = useCallback(async () => {
    const [{ data: cl }, { data: its }, { data: emps }] = await Promise.all([
      supabase.from("checklists").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("checklist_items")
        .select("*")
        .eq("checklist_id", id)
        .order("position", { ascending: true })
        .order("id", { ascending: true }),
      supabase.from("employees").select("*"),
    ]);
    setChecklist(cl);
    setChecklistName(cl?.name ?? "");
    setItems(its ?? []);
    const empMap: Record<number, Employee> = {};
    (emps ?? []).forEach((e) => (empMap[e.id] = e));
    setEmployees(empMap);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim() || !checklist) return;
    const maxPos = items.reduce((m, it) => Math.max(m, it.position), -1);
    await supabase.from("checklist_items").insert({
      checklist_id: checklist.id,
      label: newLabel.trim(),
      position: maxPos + 1,
    });
    setNewLabel("");
    load();
  };

  const toggle = async (item: ChecklistItem) => {
    const next = !item.done;
    await supabase
      .from("checklist_items")
      .update({
        done: next,
        done_by: next ? profile?.id ?? null : null,
        done_at: next ? new Date().toISOString() : null,
      })
      .eq("id", item.id);
    load();
  };

  const removeItem = async (itemId: number) => {
    await supabase.from("checklist_items").delete().eq("id", itemId);
    load();
  };

  const resetAll = async () => {
    if (!confirm("Opravdu vyresetovat celý checklist?")) return;
    await supabase
      .from("checklist_items")
      .update({ done: false, done_by: null, done_at: null })
      .eq("checklist_id", id);
    load();
  };

  const renameChecklist = async () => {
    if (!checklist || !checklistName.trim()) return;
    await supabase
      .from("checklists")
      .update({ name: checklistName.trim() })
      .eq("id", checklist.id);
    setEditingChecklist(false);
    load();
  };

  const deleteChecklist = async () => {
    if (!checklist) return;
    if (
      !confirm(
        `Smazat checklist "${checklist.name}" včetně všech položek? Tahle akce je nevratná.`,
      )
    )
      return;
    await supabase.from("checklists").delete().eq("id", checklist.id);
    router.push("/checklists");
  };

  if (loading) return <p className="text-sm text-slate-500">Načítám…</p>;
  if (!checklist)
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-500">Checklist nenalezen.</p>
        <Link href="/checklists" className="text-sm underline">
          Zpět
        </Link>
      </div>
    );

  const doneCount = items.filter((i) => i.done).length;

  return (
    <div className="space-y-6">
      <Link
        href="/checklists"
        className="text-sm text-slate-500 hover:text-blue-500 hover:underline"
      >
        ← Checklisty
      </Link>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {editingChecklist ? (
          <div className="flex flex-1 gap-2">
            <input
              value={checklistName}
              onChange={(e) => setChecklistName(e.target.value)}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-lg font-bold focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950"
            />
            <button
              onClick={renameChecklist}
              className="rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition active:scale-95 hover:bg-blue-600"
            >
              Uložit
            </button>
            <button
              onClick={() => {
                setEditingChecklist(false);
                setChecklistName(checklist.name);
              }}
              className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-900 transition active:scale-95 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              Zrušit
            </button>
          </div>
        ) : (
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{checklist.name}</h1>
            <p className="mt-1 text-sm text-slate-500">
              Hotovo {doneCount} z {items.length}
            </p>
          </div>
        )}

        {!editingChecklist && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setEditingChecklist(true)}
              className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition active:scale-95 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Přejmenovat
            </button>
            <button
              onClick={resetAll}
              className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition active:scale-95 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Reset
            </button>
            <button
              onClick={deleteChecklist}
              className="rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition active:scale-95 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-300 dark:hover:bg-red-950"
            >
              Smazat
            </button>
          </div>
        )}
      </header>

      <ul className="space-y-2">
        {items.map((it) => {
          const doneBy = it.done_by ? employees[it.done_by] : null;
          return (
            <li
              key={it.id}
              className={`flex items-center gap-3 rounded-2xl border p-4 shadow-sm transition ${
                it.done
                  ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950"
                  : "border-slate-200/70 bg-white dark:border-slate-800/70 dark:bg-slate-900"
              }`}
            >
              <button
                onClick={() => toggle(it)}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition active:scale-90 ${
                  it.done
                    ? "border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                    : "border-slate-300 dark:border-slate-600"
                }`}
                aria-label={it.done ? "Zrušit odškrtnutí" : "Odškrtnout"}
              >
                {it.done && "✓"}
              </button>
              <div className="flex-1">
                <div
                  className={`text-sm ${it.done ? "line-through text-slate-500" : ""}`}
                >
                  {it.label}
                </div>
                {doneBy && (
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <EmployeeAvatar employee={doneBy} size="sm" />
                    <span>
                      {doneBy.name}
                      {it.done_at &&
                        ` · ${new Date(it.done_at).toLocaleString("cs-CZ", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "numeric",
                          month: "numeric",
                        })}`}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => removeItem(it.id)}
                className="text-xs text-slate-400 transition hover:text-red-600"
                title="Smazat položku"
              >
                ✕
              </button>
            </li>
          );
        })}
      </ul>

      <form onSubmit={addItem} className="flex gap-2">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Nová položka — např. Spustit kávovar"
          className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950"
        />
        <button
          type="submit"
          className="rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition active:scale-95 hover:bg-blue-600"
        >
          Přidat
        </button>
      </form>
    </div>
  );
}
