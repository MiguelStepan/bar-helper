import type { Employee } from "@/lib/types";

type Props = {
  employee: Pick<Employee, "initials" | "color"> | null;
  size?: "sm" | "md" | "lg";
  title?: string;
};

const sizes = {
  sm: "h-7 w-7 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-lg",
};

export function EmployeeAvatar({ employee, size = "md", title }: Props) {
  const initials = employee?.initials ?? "?";
  const bg = employee?.color || "#64748b";
  return (
    <span
      title={title}
      className={`inline-flex items-center justify-center rounded-full font-semibold text-white shadow-sm ${sizes[size]}`}
      style={{ backgroundColor: bg }}
    >
      {initials}
    </span>
  );
}
