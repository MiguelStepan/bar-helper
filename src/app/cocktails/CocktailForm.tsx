"use client";

import { useState } from "react";
import { supabase, COCKTAIL_BUCKET } from "@/lib/supabase";
import type { Cocktail } from "@/lib/types";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

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
    if (file.size > MAX_UPLOAD_BYTES) {
      const mb = (file.size / 1024 / 1024).toFixed(1);
      setError(`Fotka je moc velká (${mb} MB). Maximum je 5 MB.`);
      return;
    }
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
      className="space-y-5 rounded-3xl border border-slate-200/70 bg-white p-6 shadow-md shadow-slate-200/40 dark:border-slate-800/70 dark:bg-slate-900 dark:shadow-black/30"
    >
      <label className="block">
        <span className="text-sm font-medium">Název</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Mojito"
          className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950"
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
          className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950"
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
              className="h-32 w-32 rounded-2xl object-cover shadow-md"
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
                className="self-start text-xs font-semibold text-red-600 underline-offset-4 hover:underline"
              >
                Odebrat fotku
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || uploading}
          className="rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition active:scale-95 hover:bg-blue-600 disabled:opacity-50"
        >
          {saving ? "Ukládám…" : cocktail ? "Uložit změny" : "Vytvořit recept"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-900 transition active:scale-95 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          Zrušit
        </button>
      </div>
    </form>
  );
}
