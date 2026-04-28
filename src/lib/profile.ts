"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { Employee } from "./types";

const STORAGE_KEY = "bar-helper:active-profile-id";

export function getActiveProfileId(): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? Number(raw) : null;
}

export function setActiveProfileId(id: number | null) {
  if (typeof window === "undefined") return;
  if (id === null) localStorage.removeItem(STORAGE_KEY);
  else localStorage.setItem(STORAGE_KEY, String(id));
  window.dispatchEvent(new Event("bar-helper:profile-changed"));
}

export function useActiveProfile() {
  const [profile, setProfile] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const id = getActiveProfileId();
      if (!id) {
        if (!cancelled) {
          setProfile(null);
          setLoading(false);
        }
        return;
      }
      const { data } = await supabase
        .from("employees")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!cancelled) {
        setProfile(data ?? null);
        setLoading(false);
      }
    };

    load();
    const onChange = () => {
      setLoading(true);
      load();
    };
    window.addEventListener("bar-helper:profile-changed", onChange);
    return () => {
      cancelled = true;
      window.removeEventListener("bar-helper:profile-changed", onChange);
    };
  }, []);

  return { profile, loading };
}
