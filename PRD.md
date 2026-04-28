# PRD: Bar Helper

## Problém
Obsluha baru potřebuje na jednom místě komplet checklisty (otevření / zavření), recepty pro míchání naší nabídky (s fotkou + postupem), a "lepíky" mezi směnami od majitele i mezi sebou. Dnes to řeší papírky, Whatsappem a "co kdo zapomene říct" — informace se ztrácejí, recepty nejsou jednotné.

## Cílový uživatel
Obsluha jednoho baru (bartendeři) + majitel, který appku spravuje. Bez složitého auth, kioskový styl — každý si na začátku směny vybere svůj profil.

## User Stories
- Jako bartender chci si na začátku směny vybrat svůj profil, aby appka věděla kdo jsem.
- Jako bartender chci si rozkliknout recept (fotka + bullet point postup), abych drink správně připravil.
- Jako bartender chci odškrtnout položku checklistu, aby ostatní viděli, co je hotové, a vědělo se kdo to udělal.
- Jako bartender chci přečíst lepíky od šéfa a podepsat je svým profilem na potvrzení.
- Jako bartender chci nechat lepík pro další směnu nebo majitele (např. "došel rum").
- Jako majitel chci nahrát recept včetně fotky, aby ho obsluha měla po ruce.
- Jako majitel chci vytvářet a upravovat checklisty (otevření, zavření, …).
- Jako majitel chci přidávat / mazat profily zaměstnanců.
- Jako majitel chci nechat lepík vyžadující podpis od konkrétních zaměstnanců, abych měl jistotu, že to viděli.

## MVP Scope

### In scope
- **Profile picker** (kioskový režim) — výběr profilu na home, uložení do localStorage; aktivní profil se používá jako `done_by`, `author_id`, podpisující.
- **Zaměstnanci** — list, přidat, upravit (jméno, iniciály, barva avataru), smazat. Volně dostupné v MVP.
- **Recepty (cocktails)** — list s náhledy, detail (jméno + fotka + bullet points), CRUD vč. upload fotky do Supabase Storage.
- **Checklisty** — list, detail s odškrtáváním (`done_by` = aktivní profil, `done_at` timestamp), tlačítko "Reset checklist" (vyresetuje všechny `done`), CRUD na checklisty i položky.
- **Lepíky (notes)** — list aktivních (`done=false`), archiv vyřízených, create (autor = aktivní profil), mark done, sign-off varianta s vybranými zaměstnanci jako povinnými podepsanými. Když všichni podepíší → automaticky `done=true`.
- **Responzivní UI** — mobile first (tablet/mobil za barem).

### Out of scope
- Real auth (Supabase Auth s heslem). Kioskový režim stačí pro MVP.
- Historie checklist runs (kdo kdy dělal otevření za uplynulé dny).
- Strukturované ingredience cocktailů a počítání zásob.
- Strukturovaný taste profile (sladký/kyselý/hořký 0–5).
- Statistiky / dashboard (top recepty, počet vyřízených lepíků).
- Cleanup orphan Storage souborů při delete cocktailu.
- Vyhledávání / filtry v receptech.
- Export checklistu do PDF.
- Push notifikace na nové lepíky.
- Permissions / role (admin vs. obsluha).

## Externí služby
- **Supabase Storage** — bucket `cocktail-images` (Public bucket). Vytvoř v Supabase dashboardu → Storage → New bucket. Žádný další účet.

## Datový model

### Tabulka: employees
| Sloupec | Typ | Popis |
|---------|-----|-------|
| id | integer (PK, identity) | |
| name | text NOT NULL | "Honza Novák" |
| initials | text NOT NULL | "HN" — pro avatar bublinu |
| color | text | hex barva avataru (volitelné) |
| created_at | timestamptz | default now() |

### Tabulka: cocktails
| Sloupec | Typ | Popis |
|---------|-----|-------|
| id | integer (PK, identity) | |
| name | text NOT NULL | název nápoje |
| steps | text | bullet pointy postupu, oddělené `\n` |
| image_url | text | URL z Supabase Storage |
| created_at | timestamptz | default now() |

### Tabulka: checklists
| Sloupec | Typ | Popis |
|---------|-----|-------|
| id | integer (PK, identity) | |
| name | text NOT NULL | např. "Otevření" |
| created_at | timestamptz | default now() |

### Tabulka: checklist_items
| Sloupec | Typ | Popis |
|---------|-----|-------|
| id | integer (PK, identity) | |
| checklist_id | integer NOT NULL | FK → checklists, ON DELETE CASCADE |
| label | text NOT NULL | text položky |
| done | boolean | default false |
| done_by | integer | FK → employees, ON DELETE SET NULL |
| done_at | timestamptz | kdy odškrtnuto |
| position | integer | pořadí, default 0 |
| created_at | timestamptz | default now() |

### Tabulka: notes
| Sloupec | Typ | Popis |
|---------|-----|-------|
| id | integer (PK, identity) | |
| content | text NOT NULL | text lepíku |
| author_id | integer | FK → employees, ON DELETE SET NULL |
| done | boolean | default false (vyřízeno) |
| created_at | timestamptz | default now() |

### Tabulka: note_signers
| Sloupec | Typ | Popis |
|---------|-----|-------|
| id | integer (PK, identity) | |
| note_id | integer NOT NULL | FK → notes, ON DELETE CASCADE |
| employee_id | integer NOT NULL | FK → employees, ON DELETE CASCADE |
| signed | boolean | default false |
| signed_at | timestamptz | kdy podepsáno |
| UNIQUE (note_id, employee_id) | | jeden podpis na zaměstnance/lepík |

## Diagram vztahů

(Mermaid ER diagram je v GitHub Issue — tam se renderuje nativně.)

## SQL pro Supabase

Kompletní SQL v `migrations/001_initial.sql`. Spusť v Supabase SQL Editoru — nejdřív v DEV projektu, před deployem stejné v PROD projektu.

Nezapomeň ještě v Supabase dashboardu:
1. **Storage → New bucket** → name `cocktail-images` → **Public bucket** ✓
