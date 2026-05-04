"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Employee, Note, NotePriority, NoteSigner } from "@/lib/types";

const PRIORITY_LABEL: Record<NotePriority, string> = {
  normal: "Normální",
  important: "Důležité",
  urgent: "Urgent",
};

const PRIORITY_WEIGHT: Record<NotePriority, number> = {
  urgent: 3,
  important: 2,
  normal: 1,
};

// Barvy karet podle priority — barva nese význam, ne jen dekoraci.
const PRIORITY_CARD: Record<NotePriority, string> = {
  normal:
    "border-amber-300/70 bg-yellow-100 shadow-amber-200/40 dark:border-amber-900/70 dark:bg-amber-950/30 dark:shadow-black/30",
  important:
    "border-orange-400/70 bg-orange-100 shadow-orange-300/40 dark:border-orange-800/70 dark:bg-orange-950/40 dark:shadow-black/30",
  urgent:
    "border-red-400/70 bg-red-100 shadow-red-300/50 dark:border-red-800/70 dark:bg-red-950/40 dark:shadow-black/30",
};

const PRIORITY_BADGE: Record<NotePriority, string> = {
  normal: "bg-amber-200/80 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100",
  important: "bg-orange-300/80 text-orange-950 dark:bg-orange-900/60 dark:text-orange-100",
  urgent: "bg-red-500 text-white",
};
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
  const [priority, setPriority] = useState<NotePriority>("normal");
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
        priority,
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
    setPriority("normal");
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

  const togglePin = async (note: NoteWithSigners) => {
    await supabase
      .from("notes")
      .update({ pinned: !note.pinned })
      .eq("id", note.id);
    load();
  };

  const remove = async (noteId: number) => {
    if (!confirm("Smazat lepík?")) return;
    await supabase.from("notes").delete().eq("id", noteId);
    load();
  };

  const filtered = notes
    .filter((n) => (tab === "active" ? !n.done : n.done))
    .sort((a, b) => {
      // Aktivní: pinned → priorita → created_at desc. Archiv: jen created_at desc.
      if (tab === "active") {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        const pa = PRIORITY_WEIGHT[a.priority] ?? 1;
        const pb = PRIORITY_WEIGHT[b.priority] ?? 1;
        if (pa !== pb) return pb - pa;
      }
      return b.created_at.localeCompare(a.created_at);
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Lepíky</h1>
        <p className="mt-1 text-sm text-slate-500">
          Komunikace mezi směnami a od majitele.
        </p>
      </div>

      <div className="flex gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
        {(["active", "archive"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition active:scale-95 ${
              tab === t
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
                : "text-slate-600 dark:text-slate-300"
            }`}
          >
            {t === "active"
              ? `Aktivní (${notes.filter((n) => !n.done).length})`
              : "Archiv"}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-slate-500">Načítám…</p>}
      {!loading && filtered.length === 0 && (
        <div className="rounded-3xl border border-slate-200/70 bg-white p-10 text-center dark:border-slate-800/70 dark:bg-slate-900">
          <div className="text-5xl">{tab === "active" ? "📝" : "📦"}</div>
          <p className="mt-3 text-base font-medium">
            {tab === "active" ? "Žádné aktivní lepíky" : "Archiv prázdný"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {tab === "active"
              ? "Nalep první níž."
              : "Až vyřídíš lepík, ulož se sem."}
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
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
              className={`relative flex flex-col gap-3 rounded-3xl border p-5 shadow-md ${
                n.done
                  ? "border-slate-200/70 bg-slate-100/60 shadow-slate-200/40 dark:border-slate-800/70 dark:bg-slate-900/40 dark:shadow-black/30"
                  : PRIORITY_CARD[n.priority]
              } ${n.pinned && !n.done ? "ring-2 ring-slate-900/10 dark:ring-white/20" : ""}`}
            >
              {n.pinned && !n.done && (
                <span
                  className="absolute -top-2 -right-2 rotate-12 rounded-full bg-white px-2 py-1 text-base shadow-md dark:bg-slate-800"
                  title="Připnuto"
                >
                  📌
                </span>
              )}
              {!n.done && n.priority !== "normal" && (
                <span
                  className={`self-start rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${PRIORITY_BADGE[n.priority]}`}
                >
                  {PRIORITY_LABEL[n.priority]}
                </span>
              )}
              <p
                className={`whitespace-pre-wrap text-lg font-medium leading-snug sm:text-xl ${
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
                <div className="space-y-1.5 rounded-2xl bg-white/70 p-3 dark:bg-slate-900/70">
                  <div className="text-xs font-semibold">
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
                    className="rounded-xl bg-blue-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/30 transition active:scale-95 hover:bg-blue-600"
                  >
                    Podepsat
                  </button>
                )}
                {totalRequired === 0 && !n.done && (
                  <button
                    onClick={() => markDone(n.id, true)}
                    className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-500/30 transition active:scale-95 hover:bg-emerald-600"
                  >
                    Vyřízeno
                  </button>
                )}
                {!n.done && (
                  <button
                    onClick={() => togglePin(n)}
                    className={`rounded-xl px-4 py-2 text-xs font-semibold transition active:scale-95 ${
                      n.pinned
                        ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {n.pinned ? "📌 Odepnout" : "📌 Připnout"}
                  </button>
                )}
                {n.done && (
                  <button
                    onClick={() => markDone(n.id, false)}
                    className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition active:scale-95 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    Znovu otevřít
                  </button>
                )}
                <button
                  onClick={() => remove(n.id)}
                  className="ml-auto text-xs text-slate-400 transition hover:text-red-600"
                >
                  Smazat
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {tab === "active" && (
        <form
          onSubmit={create}
          className="space-y-4 rounded-3xl border border-amber-200/70 bg-amber-50 p-6 shadow-md shadow-amber-200/40 dark:border-amber-900/70 dark:bg-amber-950/40 dark:shadow-black/30"
        >
          <h2 className="text-lg font-semibold">Nový lepík</h2>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder={`Nový lepík od ${profile?.name ?? "tebe"}…`}
            className="w-full rounded-2xl border border-amber-300 bg-white px-3 py-2.5 text-sm transition focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/20 dark:border-amber-800 dark:bg-slate-900"
            required
          />

          <div className="flex flex-wrap gap-2">
            {(["normal", "important", "urgent"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition active:scale-95 ${
                  priority === p
                    ? PRIORITY_BADGE[p] + " ring-2 ring-offset-1 ring-slate-900/20 dark:ring-white/30"
                    : "bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300"
                }`}
              >
                {PRIORITY_LABEL[p]}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={requireSignoff}
              onChange={(e) => setRequireSignoff(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            Vyžaduje podpis vybraných osob
          </label>

          {requireSignoff && (
            <div className="flex flex-wrap gap-2 rounded-2xl bg-white p-3 dark:bg-slate-900">
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
                    className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-xs font-medium transition active:scale-95 ${
                      selected
                        ? "border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-200"
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
            className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-500/30 transition active:scale-95 hover:bg-amber-600"
          >
            Nalepit
          </button>
        </form>
      )}
    </div>
  );
}
