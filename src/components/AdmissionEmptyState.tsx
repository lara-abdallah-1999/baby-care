import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function AdmissionEmptyState({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="admission-empty-state">
      <span className="admission-empty-icon" aria-hidden="true">
        <Icon size={28} strokeWidth={1.5} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {children && <div className="admission-empty-action">{children}</div>}
    </div>
  );
}
