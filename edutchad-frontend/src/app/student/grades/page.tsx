'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/Icon';
import { useStudentDetails } from '@/hooks/useStudentData';
import { TrimesterSelector } from '@/components/student/TrimesterSelector';
import { LoadingSpinner } from '@/components/student/LoadingSpinner';
import { ErrorState } from '@/components/student/ErrorState';
import { SectionHeader } from '@/components/student/SectionHeader';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ==================== TYPES ====================

interface EvaluationControl {
  id: string;
  type: string;
  title: string;
  value: number;
  maxScore: number;
  date: string;
}

interface SubjectBreakdown {
  subject: { id: string; name: string; color?: string | null; category?: string };
  average: number | null;
  coefficient: number;
  controls: EvaluationControl[];
}

// ==================== HELPERS ====================

function getAverageColor(avg: number) {
  if (avg >= 14) return 'text-emerald-600';
  if (avg >= 10) return 'text-amber-600';
  return 'text-rose-600';
}

function getAverageBarColor(avg: number) {
  if (avg >= 14) return 'bg-emerald-500';
  if (avg >= 10) return 'bg-amber-500';
  return 'bg-rose-500';
}

function calcTrimAvg(grades: any[], trimester: number) {
  const g = grades.filter((x) => x.trimester === trimester);
  if (!g.length) return null;
  const totalPts = g.reduce((acc, x) => acc + x.value * (x.coefficient || 1), 0);
  const totalCoef = g.reduce((acc, x) => acc + (x.coefficient || 1), 0);
  return totalCoef > 0 ? Number((totalPts / totalCoef).toFixed(2)) : null;
}

// Les titres backend sont déjà explicites (ex: "Devoir T1", "Interrogation 2 T1"),
// on ne reformate que si jamais le titre est absent.
const TYPE_LABELS: Record<string, string> = {
  DEVOIR: 'Devoir',
  INTERROGATION: 'Interrogation',
  CONTROLE: 'Contrôle',
  EXAMEN: 'Examen',
};

function formatControlLabel(control: EvaluationControl) {
  if (control.title) return control.title;
  return TYPE_LABELS[control.type?.toUpperCase()] || control.type || 'Évaluation';
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ==================== PAGE ====================

export default function GradesPage() {
  const { details, loading, error, refetch } = useStudentDetails();
  const [trimester, setTrimester] = useState<1 | 2 | 3>(1);

  const [breakdown, setBreakdown] = useState<SubjectBreakdown[]>([]);
  const [breakdownLoading, setBreakdownLoading] = useState(true);
  const [breakdownError, setBreakdownError] = useState<string | null>(null);

  const fetchBreakdown = useCallback(async () => {
    if (!details?.id) return;
    setBreakdownLoading(true);
    setBreakdownError(null);
    try {
      const res = await fetch(
        `${API_BASE}/grades/student/${details.id}/breakdown?trimester=${trimester}`,
        { credentials: 'include' },
      );
      if (!res.ok) throw new Error('Impossible de charger le détail des notes.');
      const data = await res.json();
      setBreakdown(data);
    } catch (err) {
      setBreakdownError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setBreakdownLoading(false);
    }
  }, [details?.id, trimester]);

  useEffect(() => {
    fetchBreakdown();
  }, [fetchBreakdown]);

  if (loading) return <LoadingSpinner />;
  if (error || !details) return <ErrorState error={error} onRetry={refetch} />;

  const trimAvg = calcTrimAvg(details.grades, trimester);

  // Historique chronologique de toutes les évaluations (devoir, interrogations, contrôle...)
  // toutes matières confondues, pour ce trimestre.
  const allEvaluations = breakdown
    .flatMap((row) =>
      row.controls.map((c) => ({
        ...c,
        subjectName: row.subject.name,
        subjectColor: row.subject.color,
      })),
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notes & Moyennes</h1>
          <p className="text-slate-500 text-sm">Suivi détaillé des résultats par matière</p>
        </div>
        <TrimesterSelector trimester={trimester} onChange={setTrimester} />
      </div>

      {/* Moyenne générale */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-6 border border-indigo-100"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-indigo-600 text-sm font-semibold uppercase tracking-wide">
              Moyenne générale T{trimester}
            </p>
            <p className={`text-5xl font-bold mt-2 ${trimAvg !== null ? getAverageColor(trimAvg) : 'text-slate-400'}`}>
              {trimAvg !== null ? trimAvg : '—'}
              <span className="text-xl text-slate-400">/20</span>
            </p>
          </div>
          <div className="w-32 h-32 relative">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={trimAvg !== null ? (trimAvg >= 14 ? '#10b981' : trimAvg >= 10 ? '#f59e0b' : '#f43f5e') : '#cbd5e1'}
                strokeWidth="3"
                strokeDasharray={`${((trimAvg ?? 0) / 20) * 100}, 100`}
                strokeLinecap="round"
              />
              <text x="18" y="22" textAnchor="middle" className="text-xs font-bold fill-slate-700">
                {trimAvg !== null ? `${Math.round((trimAvg / 20) * 100)}%` : '?'}
              </text>
            </svg>
          </div>
        </div>
      </motion.div>

      {/* Détail par matière — TOUTES les matières de la classe, notées ou non */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5"
      >
        <SectionHeader icon="fa-chart-line" title={`Résultats détaillés - T${trimester}`} />

        {breakdownLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : breakdownError ? (
          <div className="text-center py-10">
            <Icon icon="fa-exclamation-triangle" className="text-3xl text-rose-400 mb-2" />
            <p className="text-slate-500 text-sm mb-3">{breakdownError}</p>
            <button
              onClick={() => fetchBreakdown()}
              className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition"
            >
              Réessayer
            </button>
          </div>
        ) : breakdown.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <Icon icon="fa-inbox" className="text-3xl mb-2" />
            <p>Aucune matière enregistrée pour la classe de l'élève</p>
          </div>
        ) : (
          <div className="space-y-4">
            {breakdown.map((row) => (
              <div key={row.subject.id} className="border border-slate-100 rounded-xl p-4">
                <div className="flex justify-between items-center gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {row.subject.color && (
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: row.subject.color }}
                      />
                    )}
                    <span className="font-medium text-slate-800 truncate">{row.subject.name}</span>
                    <span className="text-xs text-slate-400 flex-shrink-0">(coef {row.coefficient})</span>
                  </div>
                  <span
                    className={`font-bold flex-shrink-0 ${row.average !== null ? getAverageColor(row.average) : 'text-slate-400'}`}
                  >
                    {row.average !== null ? `${row.average}/20` : 'Non noté'}
                  </span>
                </div>

                <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      row.average !== null ? getAverageBarColor(row.average) : 'bg-slate-300'
                    }`}
                    style={{ width: row.average !== null ? `${(row.average / 20) * 100}%` : '0%' }}
                  />
                </div>

                {row.controls.length === 0 ? (
                  <p className="text-xs text-slate-400">Aucune évaluation enregistrée pour ce trimestre</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {row.controls.map((c) => (
                      <span
                        key={c.id}
                        className="text-xs bg-slate-50 border border-slate-100 text-slate-600 px-2 py-1 rounded-lg"
                      >
                        {formatControlLabel(c)} :{' '}
                        <span className="font-semibold text-slate-800">
                          {c.value}/{c.maxScore ?? 20}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Historique de toutes les évaluations (devoir, interrogations, contrôle...) */}
      {allEvaluations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5"
        >
          <SectionHeader icon="fa-list" title="Relevé des évaluations" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200">
                <tr className="text-left text-slate-500">
                  <th className="pb-2 font-medium">Matière</th>
                  <th className="pb-2 font-medium">Évaluation</th>
                  <th className="pb-2 font-medium">Note</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {allEvaluations.map((evaluation) => (
                  <tr key={evaluation.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 text-slate-800">
                      <div className="flex items-center gap-2">
                        {evaluation.subjectColor && (
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: evaluation.subjectColor }}
                          />
                        )}
                        {evaluation.subjectName}
                      </div>
                    </td>
                    <td className="py-2 text-slate-600">{formatControlLabel(evaluation)}</td>
                    <td className={`py-2 font-semibold ${getAverageColor(evaluation.value)}`}>
                      {evaluation.value}/{evaluation.maxScore ?? 20}
                    </td>
                    <td className="py-2 text-slate-500">{formatDate(evaluation.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}