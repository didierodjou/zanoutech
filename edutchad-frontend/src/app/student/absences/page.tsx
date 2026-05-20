'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/Icon';
import { useStudentDetails } from '@/hooks/useStudentData';
import { SectionHeader} from '@/components/student/SectionHeader';
import { LoadingSpinner } from '@/components/student/LoadingSpinner';
import { ErrorState } from '@/components/student/ErrorState';

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
}

export default function AbsencesPage() {
  const { details, loading, error, refetch } = useStudentDetails();
  const [filter, setFilter] = useState<'all' | 'justified' | 'unjustified'>('all');

  if (loading) return <LoadingSpinner />;
  if (error || !details) return <ErrorState error={error} onRetry={refetch} />;

  const absences = [...details.absences].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const filtered = absences.filter((a) => {
    if (filter === 'justified') return a.isJustified;
    if (filter === 'unjustified') return !a.isJustified;
    return true;
  });

  const justifiedCount = absences.filter((a) => a.isJustified).length;
  const unjustifiedCount = absences.length - justifiedCount;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Absences</h1>
        <p className="text-slate-500 text-sm">Suivi des présences et justificatifs</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-100 text-slate-700">
          <Icon icon="fa-calendar-times" className="text-xl" />
          <div>
            <p className="text-xs font-medium">Total absences</p>
            <p className="text-2xl font-bold">{absences.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-100 text-emerald-700">
          <Icon icon="fa-check-circle" className="text-xl" />
          <div>
            <p className="text-xs font-medium">Justifiées</p>
            <p className="text-2xl font-bold">{justifiedCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-100 text-rose-700">
          <Icon icon="fa-exclamation-circle" className="text-xl" />
          <div>
            <p className="text-xs font-medium">Non justifiées</p>
            <p className="text-2xl font-bold">{unjustifiedCount}</p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200 w-fit">
        {(['all', 'justified', 'unjustified'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition capitalize ${filter === f ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {f === 'all' ? 'Toutes' : f === 'justified' ? 'Justifiées' : 'Non justifiées'}
          </button>
        ))}
      </div>

      {/* Liste */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <SectionHeader icon="fa-list" title="Historique des absences" />
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <Icon icon="fa-calendar-check" className="text-3xl mb-2" />
            <p>Aucune absence à afficher</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((absence) => (
              <div key={absence.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${absence.isJustified ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                  <Icon icon={absence.isJustified ? 'fa-check' : 'fa-times'} className={`${absence.isJustified ? 'text-emerald-600' : 'text-rose-600'}`} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{absence.type || 'Absence'}</p>
                  {absence.reason && <p className="text-xs text-slate-500">{absence.reason}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600">{formatDate(absence.date)}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${absence.isJustified ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {absence.isJustified ? 'Justifiée' : 'Non justifiée'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}