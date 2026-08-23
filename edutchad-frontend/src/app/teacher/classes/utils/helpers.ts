export function avgStyle(value?: number | null): string {
  if (value == null) return 'text-slate-300';
  if (value >= 14) return 'text-emerald-600 font-bold';
  if (value >= 10) return 'text-amber-600 font-bold';
  return 'text-red-500 font-bold';
}

export function avgBadge(value?: number | null): string {
  if (value == null) return 'bg-slate-100 text-slate-400';
  if (value >= 14) return 'bg-emerald-100 text-emerald-700';
  if (value >= 10) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-600';
}

export function getInitials(firstName: string, lastName: string): string {
  return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
}