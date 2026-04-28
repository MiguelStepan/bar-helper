"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Employee, Note, NoteSigner } from "@/lib/types";
import { useActiveProfile } from "@/lib/profile";
import { EmployeeAvatar } from "@/components/EmployeeAvatar";
import { ProfileGate } from "@/components/ProfileGate";

export default function NotesPage() {
  return (
    <ProfileGate>
      <NotesView />
    </ProfileGate>
  );
}

type NoteWithSigners = Note & { signers: NoteSigner[] };

function NotesView() {
  const { profile } = useActiveProfile();
  const [notes, setNotes] = useState<NoteWithSigners[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tab, setTab] = useState<"active" | "archive">("active");
  const [content, setContent] = useState("");
  const [requireSignoff, setRequireSignoff] = useState(false);
  const [requiredIds, setRequiredIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const employeesById: Record<number, Employee> = {};
  employees.forEach((e) => (employeesById[e.id] = e));

  const load = useCallback(async () => {
    const [{ data: nts }, { data: emps }, { data: signers }] = await Promise.all([
      supabase
        .from("notes")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("employees").select("*").order("name"),
      supabase.from("note_signers").select("*"),
    ]);
    const signersByNote: Record<number, NoteSigner[]> = {};
    (signers ?? []).forEach((s) => {
      (signersByNote[s.note_id] ??= []).push(s);
    });
    setNotes(
      (nts ?? []).map((n) => ({ ...n, signers: signersByNote[n.id] ?? [] })),
    );
    setEmployees(emps ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleRequired = (id: number) => {
    setRequiredIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    const { data: note, error } = await supabase
      .from("notes")
      .insert({
        content: content.trim(),
        author_id: profile?.id ?? null,
      })
      .select()
      .single();
    if (error || !note) {
      alert(error?.message ?? "Chyba uložení");
      return;
    }
    if (requireSignoff && requiredIds.length > 0) {
      await supabase
        .from("note_signers")
        .insert(
          requiredIds.map((eid) => ({
            note_id: note.id,
            employee_id: eid,
          })),
        );
    }
    setContent("");
    setRequireSignoff(false);
    setRequiredIds([]);
    load();
  };

  const sign = async (note: NoteWithSigners) => {
    if (!profile) return;
    const mySigner = note.signers.find((s) => s.employee_id === profile.id);
    if (!mySigner) {
      alert("Tento lepík nevyžaduje tvůj podpis.");
      return;
    }
    if (mySigner.signed) return;

    const { error: signErr } = await supabase
      .from("note_signers")
      .update({ signed: true, signed_at: new Date().toISOString() })
      .eq("id", mySigner.id);
    if (signErr) {
      alert("Chyba podpisu: " + signErr.message);
      return;
    }

    // Re-fetch signery z DB (lokální stav může být stale, když podepsal někdo souběžně)
    const { data: fresh } = await supabase
      .from("note_signers")
      .select("signed")
      .eq("note_id", note.id);
    if (fresh && fresh.length > 0 && fresh.every((s) => s.signed)) {
      await supabase.from("notes").update({ done: true }).eq("id", note.id);
    }

    load();
  };

  const markDone = async (noteId: number, done: boolean) => {
    await supabase.from("notes").update({ done }).eq("id", noteId);
    load();
  };

  const remove = async (noteId: number) => {
    if (!confirm("Smazat lepík?")) return;
    await supabase.from("notes").delete().eq("id", noteId);
    load();
  };

  const filtered = notes.filter((n) =>
    tab === "active" ? !n.done : n.done,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lepíky</h1>
        <p className="text-sm text-slate-500">
          Komunikace mezi směnami a od majitele.
        </p>
      </div>

      <form
        onSubmit={create}
        className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40"
      >
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder={`Nový lepík od ${profile?.name ?? "tebe"}…`}
          className="w-full rounded-md border border-amber-300 bg-white px-3 py-2 text-sm dark:border-amber-800 dark:bg-slate-900"
          required
        />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={requireSignoff}
            onChange={(e) => setRequireSignoff(e.target.checked)}
          />
          Vyžaduje podpis vybraných osob
        </label>

        {requireSignoff && (
          <div className="flex flex-wrap gap-2 rounded-md bg-white p-3 dark:bg-slate-900">
            {employees.length === 0 && (
              <span className="text-xs text-slate-500">
                Žádné profily — přidej v sekci Zaměstnanci.
              </span>
            )}
            {employees.map((emp) => {
              const selected = requiredIds.includes(emp.id);
              return (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => toggleRequired(emp.id)}
                  className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-xs transition ${
                    selected
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950"
                      : "border-slate-300 dark:border-slate-700"
                  }`}
                >
                  <EmployeeAvatar employee={emp} size="sm" />
                  <span>{emp.name}</span>
                </button>
              );
            })}
          </div>
        )}

        <button
          type="submit"
          className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          Nalepit
        </button>
      </form>

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        {(["active", "archive"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium transition ${
              tab === t
                ? "border-b-2 border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-100"
                : "text-slate-500"
            }`}
          >
            {t === "active" ? `Aktivní (${notes.filter((n) => !n.done).length})` : "Archiv"}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-slate-500">Načítám…</p>}
      {!loading && filtered.length === 0 && (
        <p className="text-sm text-slate-500">
          {tab === "active" ? "Žádné aktivní lepíky." : "Archiv prázdný."}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((n) => {
          const author = n.author_id ? employeesById[n.author_id] : null;
          const mySigner = profile
            ? n.signers.find((s) => s.employee_id === profile.id)
            : null;
          const totalRequired = n.signers.length;
          const totalSigned = n.signers.filter((s) => s.signed).length;
          return (
            <article
              key={n.id}
              className={`flex flex-col gap-3 rounded-2xl border p-4 shadow-sm ${
                n.done
                  ? "border-slate-200 bg-slate-100/60 dark:border-slate-800 dark:bg-slate-900/40"
                  : "border-amber-300 bg-yellow-100 dark:border-amber-900 dark:bg-amber-950/30"
              }`}
            >
              <p
                className={`whitespace-pre-wrap text-sm ${
                  n.done ? "text-slate-500 line-through" : ""
                }`}
              >
                {n.content}
              </p>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  {author ? (
                    <>
                      <EmployeeAvatar employee={author} size="sm" />
                      <span>{author.name}</span>
                    </>
                  ) : (
                    <span>Neznámý autor</span>
                  )}
                </div>
                <span>
                  {new Date(n.created_at).toLocaleString("cs-CZ", {
                    day: "numeric",
                    month: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {totalRequired > 0 && (
                <div className="space-y-1 rounded-md bg-white/70 p-2 dark:bg-slate-900/70">
                  <div className="text-xs font-medium">
                    Podpisy: {totalSigned}/{totalRequired}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {n.signers.map((s) => {
                      const emp = employeesById[s.employee_id];
                      if (!emp) return null;
                      return (
                        <span
                          key={s.id}
                          title={emp.name}
                          className={`flex items-center gap-1 rounded-full border py-0.5 pl-0.5 pr-2 text-xs ${
                            s.signed
                              ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950"
                              : "border-slate-300 opacity-60 dark:border-slate-700"
                          }`}
                        >
                          <EmployeeAvatar employee={emp} size="sm" />
                          <span>
                            {emp.initials}
                            {s.signed ? " ✓" : ""}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {mySigner && !mySigner.signed && (
                  <button
                    onClick={() => sign(n)}
                    className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    Podepsat
                  </button>
                )}
                {totalRequired === 0 && !n.done && (
                  <button
                    onClick={() => markDone(n.id, true)}
                    className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    Vyřízeno
                  </button>
                )}
                {n.done && (
                  <button
                    onClick={() => markDone(n.id, false)}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs dark:border-slate-700"
                  >
                    Znovu otevřít
                  </button>
                )}
                <button
                  onClick={() => remove(n.id)}
                  className="ml-auto text-xs text-slate-400 hover:text-red-600"
                >
                  Smazat
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
