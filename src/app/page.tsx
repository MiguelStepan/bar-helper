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
    <div className="flex flex-col items-center gap-8 py-8 sm:py-16">
      <div className="text-center">
        <div className="text-5xl">🍸</div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Bar Helper</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Vyber svůj profil — a pojďme do směny.
        </p>
      </div>

      {loading && <p className="text-sm text-slate-500">Načítám profily…</p>}

      {error && (
        <div className="max-w-md rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          Chyba načtení: {error}. Zkontroluj Supabase env hodnoty a SQL.
        </div>
      )}

      {!loading && !error && employees.length === 0 && (
        <div className="max-w-md text-center">
          <p className="text-slate-600 dark:text-slate-400">
            Zatím žádný profil. Vytvoř první v sekci{" "}
            <Link href="/employees" className="font-semibold underline">
              Zaměstnanci
            </Link>
            .
          </p>
        </div>
      )}

      {!loading && employees.length > 0 && (
        <div className="grid w-full max-w-2xl grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {employees.map((e) => (
            <button
              key={e.id}
              onClick={() => pick(e.id)}
              className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <EmployeeAvatar employee={e} size="lg" />
              <span className="text-sm font-medium">{e.name}</span>
            </button>
          ))}
        </div>
      )}

      <Link
        href="/employees"
        className="text-sm text-slate-500 underline hover:text-slate-700 dark:hover:text-slate-300"
      >
        Spravovat profily
      </Link>
    </div>
  );
}
