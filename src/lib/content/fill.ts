/** Replace {{name}} (site-wide values) and {name} (per-page values) placeholders. */
export function fill(text: string, vars: Record<string, string | number | undefined>): string {
  return String(text ?? "").replace(/\{\{(\w+)\}\}|\{(\w+)\}/g, (m, a: string | undefined, b: string | undefined) => {
    const k = (a ?? b) as string;
    const v = vars[k];
    return v === undefined ? m : String(v);
  });
}
