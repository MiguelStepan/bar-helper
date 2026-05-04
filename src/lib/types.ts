export type Employee = {
  id: number;
  name: string;
  initials: string;
  color: string | null;
  emoji: string | null;
  created_at: string;
};

export type Cocktail = {
  id: number;
  name: string;
  steps: string | null;
  image_url: string | null;
  created_at: string;
};

export type Checklist = {
  id: number;
  name: string;
  created_at: string;
};

export type ChecklistItem = {
  id: number;
  checklist_id: number;
  label: string;
  done: boolean;
  done_by: number | null;
  done_at: string | null;
  position: number;
  created_at: string;
};

export type NotePriority = "normal" | "important" | "urgent";

export type Note = {
  id: number;
  content: string;
  author_id: number | null;
  done: boolean;
  priority: NotePriority;
  pinned: boolean;
  created_at: string;
};

export type NoteSigner = {
  id: number;
  note_id: number;
  employee_id: number;
  signed: boolean;
  signed_at: string | null;
};
