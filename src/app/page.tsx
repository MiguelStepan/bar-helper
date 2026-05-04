"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { setActiveProfileId } from "@/lib/profile";
import type { Employee } from "@/lib/types";
import { EmployeeAvatar } from "@/components/EmployeeAvatar";

export default function ProfilePicker() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase
      .from("employees")
      .select("*")
      .order("name", { ascending: true })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setEmployees(data ?? []);
        setLoading(false);
      });
  }, []);

  const pick = (id: number) => {
    setActiveProfileId(id);
    router.push("/cocktails");
  };

  return (
    <div className="flex flex-col items-center gap-10 py-10 sm:py-20">
      <div className="text-center">
        <div className="text-6xl">🍸</div>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">Bar Helper</h1>
        <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
          Vyber svůj profil — a pojďme do směny.
        </p>
      </div>

      {loading && <p className="text-sm text-slate-500">Načítám profily…</p>}

      {error && (
        <div className="max-w-md rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 shadow-md dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          Chyba načtení: {error}. Zkontroluj Supabase env hodnoty a SQL.
        </div>
      )}

      {!loading && !error && employees.length === 0 && (
        <div className="max-w-md rounded-3xl border border-slate-200/70 bg-white p-10 text-center shadow-md dark:border-slate-800/70 dark:bg-slate-900">
          <div className="text-5xl">👥</div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            Zatím žádný profil. Vytvoř první v sekci{" "}
            <Link
              href="/employees"
              className="font-semibold text-blue-500 underline-offset-4 hover:underline"
            >
              Zaměstnanci
            </Link>
            .
          </p>
        </div>
      )}

      {!loading && employees.length > 0 && (
        <div className="grid w-full max-w-3xl grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
          {employees.map((e) => (
            <button
              key={e.id}
              onClick={() => pick(e.id)}
              className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200/70 bg-white p-5 shadow-md shadow-slate-200/40 transition active:scale-95 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800/70 dark:bg-slate-900 dark:shadow-black/30"
            >
              <span className="transition-transform group-hover:scale-105">
                <EmployeeAvatar employee={e} size="lg" />
              </span>
              <span className="text-sm font-semibold">{e.name}</span>
            </button>
          ))}
        </div>
      )}

      <Link
        href="/employees"
        className="text-sm font-medium text-slate-500 underline-offset-4 hover:text-blue-500 hover:underline"
      >
        Spravovat profily
      </Link>
    </div>
  );
}
