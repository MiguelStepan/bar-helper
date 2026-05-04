import type { Employee } from "@/lib/types";

type Props = {
  employee: Pick<Employee, "initials" | "color" | "emoji"> | null;
  size?: "sm" | "md" | "lg";
  title?: string;
};

const sizes = {
  sm: "h-7 w-7 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-lg",
};

// Emoji škála — větší než iniciály, ať jsou rozeznatelné.
const emojiSizes = {
  sm: "text-base",
  md: "text-2xl",
  lg: "text-4xl",
};

export function EmployeeAvatar({ employee, size = "md", title }: Props) {
  const initials = employee?.initials ?? "?";
  const bg = employee?.color || "#64748b";
  const emoji = employee?.emoji;
  return (
    <span
      title={title}
      className={`inline-flex items-center justify-center rounded-full font-semibold text-white shadow-md ring-1 ring-black/5 ${sizes[size]}`}
      style={{ backgroundColor: bg }}
    >
      {emoji ? (
        <span className={`${emojiSizes[size]} leading-none`}>{emoji}</span>
      ) : (
        initials
      )}
    </span>
  );
}
