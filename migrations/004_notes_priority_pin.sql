-- Lepíky: priorita + pin
-- Spusť v Supabase SQL Editor.

ALTER TABLE notes ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal';
ALTER TABLE notes ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;

-- Constraint na hodnoty priority (přidáme zvlášť, ať ALTER ... ADD COLUMN je idempotentní).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notes_priority_check'
  ) THEN
    ALTER TABLE notes ADD CONSTRAINT notes_priority_check
      CHECK (priority IN ('normal','important','urgent'));
  END IF;
END $$;
