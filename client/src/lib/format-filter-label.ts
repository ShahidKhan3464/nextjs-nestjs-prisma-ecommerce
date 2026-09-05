/** UI-only: first letter uppercase, remaining letters lowercase (e.g. "ELECTRONICS" → "Electronics"). */
export function formatFilterLabel(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}
