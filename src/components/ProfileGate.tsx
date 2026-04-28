"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useActiveProfile } from "@/lib/profile";

export function ProfileGate({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useActiveProfile();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !profile) router.replace("/");
  }, [loading, profile, router]);

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">Načítám…</div>
    );
  }
  if (!profile) return null;
  return <>{children}</>;
}
