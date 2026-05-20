'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/Icon';
import { useStudentDetails } from '@/hooks/useStudentData';
import { ErrorState } from '@/components/student/ErrorState';
import { LoadingSpinner } from '@/components/student/LoadingSpinner';
import { SectionHeader } from '@/components/student/SectionHeader';
import { TrimesterSelector } from '@/components/student/TrimesterSelector';


const statusConfig = {
  PENDING: { label: 'En attente', color: 'bg-slate-100 text-slate-600', icon: 'fa-clock' },
  VERIFIED: { label: 'Vérifié', color: 'bg-blue-100 text-blue-700', icon: 'fa-check-circle' },
  CONFIRMED: { label: 'Confirmé', color: 'bg-emerald-100 text-emerald-700', icon: 'fa-file-pdf' },
};

export default function BulletinsPage() {
  const { details, loading, error, refetch } = useStudentDetails();
  const [selectedTrim, setSelectedTrim] = useState<1 | 2 | 3>(1);

  if (loading) return <LoadingSpinner />;
  if (error || !details) return <ErrorState error={error} onRetry={refetch} />;

  const bulletin = details.bulletins.find((b) => b.trimester === selectedTrim);
  const trimestersWithBulletins = details.bulletins.map((b) => b.trimester);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bulletins</h1>
          <p className="text-slate-500 text-sm">Consultez vos relevés de notes officiels</p>
        </div>
        <TrimesterSelector trimester={selectedTrim} onChange={setSelectedTrim} />
      </div>

      {bulletin ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-6 py-4 text-white">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-indigo-200 text-xs">Année scolaire 2024-2025</p>
                <h2 className="text-xl font-bold">Bulletin T{selectedTrim}</h2>
                <p className="text-indigo-200 text-sm mt-1">{details.class?.name} · {details.registrationNo}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">{bulletin.generalAverage ?? '—'}/20</p>
                <p className="text-indigo-200 text-xs">Moyenne générale</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bulletin.conduiteNote !== undefined && bulletin.conduiteNote !== null && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500">Note de conduite</p>
                  <p className="text-2xl font-bold text-slate-800">{bulletin.conduiteNote}/20</p>
                </div>
              )}
              {bulletin.appreciation && (
                <div className="bg-indigo-50 rounded-xl p-4">
                  <p className="text-xs text-indigo-600">Appréciation</p>
                  <p className="text-sm text-indigo-800 italic">« {bulletin.appreciation} »</p>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Icon icon={statusConfig[bulletin.status].icon as any} className="text-slate-500" />
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusConfig[bulletin.status].color}`}>
                  {statusConfig[bulletin.status].label}
                </span>
              </div>
              {bulletin.status === 'CONFIRMED' && (
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm transition">
                  <Icon icon="fa-download" />
                  Télécharger PDF
                </button>
              )}
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100">
          <Icon icon="fa-file-alt" className="text-5xl text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Aucun bulletin disponible pour le trimestre {selectedTrim}</p>
          {trimestersWithBulletins.length > 0 && (
            <p className="text-sm text-slate-400 mt-1">Bulletins disponibles : T{trimestersWithBulletins.join(', T')}</p>
          )}
        </div>
      )}

      {details.bulletins.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <SectionHeader icon="fa-archive" title="Autres trimestres" />
          <div className="flex flex-wrap gap-3">
            {details.bulletins.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedTrim(b.trimester as 1 | 2 | 3)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition ${
                  selectedTrim === b.trimester
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <Icon icon="fa-file-pdf" className="text-sm" />
                Trimestre {b.trimester}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}