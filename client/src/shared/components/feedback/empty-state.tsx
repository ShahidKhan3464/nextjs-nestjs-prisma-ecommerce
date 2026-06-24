import type { ReactNode } from "react";

type Props = {
  title: string;
  action?: ReactNode;
  description?: string;
};

export function EmptyState({ title, description, action }: Props) {
  return (
    <div
      role="status"
      className="border-border bg-muted/30 flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center"
    >
      <p className="font-medium">{title}</p>
      {description && (
        <p className="text-muted-foreground mt-2 max-w-md text-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
