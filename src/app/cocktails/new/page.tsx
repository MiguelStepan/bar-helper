"use client";

import { useRouter } from "next/navigation";
import { CocktailForm } from "../CocktailForm";
import { ProfileGate } from "@/components/ProfileGate";

export default function NewCocktailPage() {
  const router = useRouter();
  return (
    <ProfileGate>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Nový recept</h1>
        <CocktailForm
          onSaved={(id) => router.push(`/cocktails/${id}`)}
          onCancel={() => router.push("/cocktails")}
        />
      </div>
    </ProfileGate>
  );
}
