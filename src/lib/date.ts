
export function parseDobInputToISO(input: string): string | null {
  // erwartet "TT.MM.JJJJ"
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(input.trim());
  if (!m) return null;
  const [_, dd, mm, yyyy] = m;
  // naive Prüfung; optional echte Date-Validation ergänzen
  return `${yyyy}-${mm}-${dd}`; // ISO
}

export function formatISOToDob(iso?: string | null): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return "";
  const [_, yyyy, mm, dd] = m;
  return `${dd}.${mm}.${yyyy}`;
}

export function calcAgeFromISO(iso?: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}
