-- Bar Helper — initial schema
-- Spusť v Supabase SQL Editor (DEV projekt teď, PROD před deployem).

-- ZAMĚSTNANCI / PROFILY (kioskový režim, žádný auth)
create table employees (
  id          integer generated always as identity primary key,
  name        text not null,
  initials    text not null,
  color       text,
  created_at  timestamptz not null default now()
);

alter table employees enable row level security;
create policy "employees_allow_all" on employees for all using (true) with check (true);


-- KOKTEJLY / RECEPTY
create table cocktails (
  id          integer generated always as identity primary key,
  name        text not null,
  steps       text,                       -- bullet pointy oddělené \n
  image_url   text,                       -- URL z Supabase Storage bucketu cocktail-images
  created_at  timestamptz not null default now()
);

alter table cocktails enable row level security;
create policy "cocktails_allow_all" on cocktails for all using (true) with check (true);


-- CHECKLISTY (šablony, např. "Otevření", "Zavření")
create table checklists (
  id          integer generated always as identity primary key,
  name        text not null,
  created_at  timestamptz not null default now()
);

alter table checklists enable row level security;
create policy "checklists_allow_all" on checklists for all using (true) with check (true);


-- POLOŽKY CHECKLISTU
create table checklist_items (
  id            integer generated always as identity primary key,
  checklist_id  integer not null references checklists(id) on delete cascade,
  label         text not null,
  done          boolean not null default false,
  done_by       integer references employees(id) on delete set null,
  done_at       timestamptz,
  position      integer not null default 0,
  created_at    timestamptz not null default now()
);

create index checklist_items_checklist_idx on checklist_items(checklist_id);

alter table checklist_items enable row level security;
create policy "checklist_items_allow_all" on checklist_items for all using (true) with check (true);


-- LEPÍKY (NOTES) — komunikace mezi směnami a od majitele
create table notes (
  id          integer generated always as identity primary key,
  content     text not null,
  author_id   integer references employees(id) on delete set null,
  done        boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table notes enable row level security;
create policy "notes_allow_all" on notes for all using (true) with check (true);


-- PODPISY NA LEPÍCÍCH
-- Pokud lepík nevyžaduje podpisy, tabulka pro něj zůstane prázdná a `notes.done` se ovládá ručně.
-- Pokud vyžaduje (např. od HN, PN), vloží se 2 řádky se signed=false. Když všechny signed=true,
-- frontend (nebo cron) nastaví `notes.done = true`.
create table note_signers (
  id           integer generated always as identity primary key,
  note_id      integer not null references notes(id) on delete cascade,
  employee_id  integer not null references employees(id) on delete cascade,
  signed       boolean not null default false,
  signed_at    timestamptz,
  unique (note_id, employee_id)
);

create index note_signers_note_idx on note_signers(note_id);

alter table note_signers enable row level security;
create policy "note_signers_allow_all" on note_signers for all using (true) with check (true);
