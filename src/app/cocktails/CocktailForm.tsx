"use client";

import { useState } from "react";
import { supabase, COCKTAIL_BUCKET } from "@/lib/supabase";
import type { Cocktail } from "@/lib/types";

type Props = {
  cocktail?: Cocktail;
  onSaved: (id: number) => void;
  onCancel: () => void;
};

export function CocktailForm({ cocktail, onSaved, onCancel }: Props) {
  const [name, setName] = useState(cocktail?.name ?? "");
  const [steps, setSteps] = useState(cocktail?.steps ?? "");
  const [imageUrl, setImageUrl] = useState(cocktail?.image_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(COCKTAIL_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) {
      setError(`Upload selhal: ${upErr.message}`);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from(COCKTAIL_BUCKET).getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setUploading(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    const payload = {
      name: name.trim(),
      steps: steps.trim() || null,
      image_url: imageUrl || null,
    };
    if (cocktail) {
      const { error: updErr } = await supabase
        .from("cocktails")
        .update(payload)
        .eq("id", cocktail.id);
      if (updErr) {
        setError(updErr.message);
        setSaving(false);
        return;
      }
      onSaved(cocktail.id);
    } else {
      const { data, error: insErr } = await supabase
        .from("cocktails")
        .insert(payload)
        .select()
        .single();
      if (insErr || !data) {
        setError(insErr?.message ?? "Chyba uložení");
        setSaving(false);
        return;
      }
      onSaved(data.id);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
    >
      <label className="block">
        <span className="text-sm font-medium">Název</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Mojito"
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          required
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Postup (jeden krok = jeden řádek)</span>
        <textarea
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          rows={6}
          placeholder={`5 lístků máty\n2 lžičky cukru\nPromuddlovat\nLed + rum 50 ml\nDoplnit sodou`}
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
        />
      </label>

      <div>
        <span className="text-sm font-medium">Fotka finálního produktu</span>
        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-start">
          {imageUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={imageUrl}
              alt="Náhled"
              className="h-32 w-32 rounded-md object-cover"
            />
          )}
          <div className="flex flex-col gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload(file);
              }}
              disabled={uploading}
              className="text-sm"
            />
            {uploading && (
              <span className="text-xs text-slate-500">Nahrávám…</span>
            )}
            {imageUrl && (
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="self-start text-xs text-red-600 underline"
              >
                Odebrat fotku
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || uploading}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
        >
          {saving ? "Ukládám…" : cocktail ? "Uložit změny" : "Vytvořit recept"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm dark:border-slate-700"
        >
          Zrušit
        </button>
      </div>
    </form>
  );
}
