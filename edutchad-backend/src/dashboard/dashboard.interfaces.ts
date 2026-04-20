// src/dashboard/dashboard.interfaces.ts
export interface Activity {
  id: string;
  date: string;
  activity: string;
  user: string;
  type: 'inscription' | 'paiement' | 'note' | 'autre';
}