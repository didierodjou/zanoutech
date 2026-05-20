'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/Icon';
import { useStudentDetails } from '@/hooks/useStudentData';
import { TrimesterSelector} from '@/components/student/TrimesterSelector';
import {LoadingSpinner} from '@/components/student/LoadingSpinner';
import {ErrorState} from '@/components/student/ErrorState';
import {SectionHeader} from '@/components/student/SectionHeader';

function getAverageColor(avg: number) {
  if (avg >= 14) return 'text-emerald-600';
  if (avg >= 10) return 'text-amber-600';
  return 'text-rose-600';
}

function calcTrimAvg(grades: any[], trimester: number) {
  const g = grades.filter((x) => x.trimester === trimester);
  if (!g.length) return null;
  const totalPts = g.reduce((acc, x) => acc + x.value * (x.coefficient || 1), 0);
  const totalCoef = g.reduce((acc, x) => acc + (x.coefficient || 1), 0);
  return totalCoef > 0 ? Number((totalPts / totalCoef).toFixed(2)) : null;
}

function groupBySubjectWithDetails(grades: any[], trimester: number) {
  const g = grades.filter((x) => x.trimester === trimester);
  const map = new Map();
  g.forEach((gr) => {
    const sid = gr.subject.id;
    if (!map.has(sid)) {
      map.set(sid, {
        name: gr.subject.name,
        color: gr.subject.color,
        coef: gr.subject.coefficient,
        grades: [],
      });
    }
    map.get(sid).grades.push({ value: gr.value, coeff: gr.coefficient || 1 });
  });
  return Array.from(map.entries()).map(([, v]) => {
    const totalPoints = v.grades.reduce((sum: number, g: any) => sum + g.value * g.coeff, 0);
    const totalCoef = v.grades.reduce((sum: number, g: any) => sum + g.coeff, 0);
    const average = totalCoef > 0 ? Number((totalPoints / totalCoef).toFixed(2)) : null;
    return { ...v, average, gradesCount: v.grades.length };
  });
}

export default function GradesPage() {
  const { details, loading, error, refetch } = useStudentDetails();
  const [trimester, setTrimester] = useState<1 | 2 | 3>(1);

  if (loading) return <LoadingSpinner />;
  if (error || !details) return <ErrorState error={error} onRetry={refetch} />;

  const trimAvg = calcTrimAvg(details.grades, trimester);
  const subjects = groupBySubjectWithDetails(details.grades, trimester);
  const allGrades = details.grades.filter((g) => g.trimester === trimester).sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime());

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
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-6 border border-indigo-100">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-indigo-600 text-sm font-semibold uppercase tracking-wide">Moyenne générale T{trimester}</p>
            <p className={`text-5xl font-bold mt-2 ${trimAvg !== null ? getAverageColor(trimAvg) : 'text-slate-400'}`}>
              {trimAvg !== null ? trimAvg : '—'}
              <span className="text-xl text-slate-400">/20</span>
            </p>
          </div>
          <div className="w-32 h-32 relative">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3" />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={trimAvg !== null ? (trimAvg >= 14 ? '#10b981' : trimAvg >= 10 ? '#f59e0b' : '#f43f5e') : '#cbd5e1'}
                strokeWidth="3"
                strokeDasharray={`${((trimAvg ?? 0) / 20) * 100}, 100`}
                strokeLinecap="round"
              />
              <text x="18" y="22" textAnchor="middle" className="text-xs font-bold fill-slate-700">{trimAvg !== null ? `${Math.round((trimAvg / 20) * 100)}%` : '?'}</text>
            </svg>
          </div>
        </div>
      </motion.div>

      {/* Détail par matière */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <SectionHeader icon="fa-chart-line" title={`Résultats détaillés - T${trimester}`} />
        {subjects.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <Icon icon="fa-inbox" className="text-3xl mb-2" />
            <p>Aucune note enregistrée pour ce trimestre</p>
          </div>
        ) : (
          <div className="space-y-5">
            {subjects.map((subj) => (
              <div key={subj.name}>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    {subj.color && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subj.color }} />}
                    <span className="font-medium text-slate-800">{subj.name}</span>
                    <span className="text-xs text-slate-400">(coef {subj.coef})</span>
                  </div>
                  <span className={`font-bold ${subj.average !== null ? getAverageColor(subj.average) : 'text-slate-400'}`}>
                    {subj.average !== null ? `${subj.average}/20` : '—'}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${subj.average !== null ? (subj.average >= 14 ? 'bg-emerald-500' : subj.average >= 10 ? 'bg-amber-500' : 'bg-rose-500') : 'bg-slate-300'}`}
                    style={{ width: `${subj.average !== null ? (subj.average / 20) * 100 : 0}%` }}
                  />
                </div>
                {subj.gradesCount > 1 && (
                  <p className="text-xs text-slate-400 mt-1">{subj.gradesCount} notes prises en compte</p>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Historique des notes */}
      {allGrades.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <SectionHeader icon="fa-list" title="Relevé des notes" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200">
                <tr className="text-left text-slate-500">
                  <th className="pb-2 font-medium">Matière</th>
                  <th className="pb-2 font-medium">Note</th>
                  <th className="pb-2 font-medium">Coef.</th>
                </tr>
              </thead>
              <tbody>
                {allGrades.map((grade) => (
                  <tr key={grade.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 text-slate-800">{grade.subject.name}</td>
                    <td className={`py-2 font-semibold ${getAverageColor(grade.value)}`}>{grade.value}/20</td>
                    <td className="py-2 text-slate-600">{grade.coefficient || 1}</td>
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