-- Přidá emoji ikonku k zaměstnanci (volitelné, vedle iniciál)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS emoji text;
