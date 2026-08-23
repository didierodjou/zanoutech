'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { AbsenceHistoryModal } from './AbsenceHistoryModal';
import { avgStyle, avgBadge } from '../utils/helpers';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  registrationNo: string;
  averages?: {
    trimestre1: number;
    trimestre2: number;
    trimestre3: number;
  };
  _count?: { absences: number };
}

interface StudentsTabProps {
  students: Student[];
  loading: boolean;
  isMainClass: boolean;
}

export function StudentsTab({ students, loading, isMainClass }: StudentsTabProps) {
  const [historyStudent, setHistoryStudent] = useState<Student | null>(null);

  if (loading) {
    return (
      <div className="p-10 text-center">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="p-10 text-center text-slate-400">
        <Icon icon="fa-user-slash" className="text-3xl mb-2" />
        <p>Aucun élève inscrit</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <th className="text-left px-5 py-3 w-8">#</th>
              <th className="text-left px-5 py-3">Élève</th>
              <th className="text-left px-4 py-3">Matricule</th>
              {isMainClass && (
                <>
                  <th className="text-center px-3 py-3">T1</th>
                  <th className="text-center px-3 py-3">T2</th>
                  <th className="text-center px-3 py-3">T3</th>
                  <th className="text-center px-3 py-3">Annuelle</th>
                </>
              )}
              <th className="text-center px-4 py-3">Absences</th>
              <th className="text-center px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => {
              const annualAvg = isMainClass
                ? s.averages
                  ? (s.averages.trimestre1 + s.averages.trimestre2 + s.averages.trimestre3) / 3
                  : null
                : null;
              return (
                <tr key={s.id} className={`border-t border-slate-50 hover:bg-slate-50/60 ${i % 2 !== 0 ? 'bg-slate-50/30' : ''}`}>
                  <td className="px-5 py-3 text-slate-400 text-xs">{i + 1}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {s.firstName[0]}
                        {s.lastName[0]}
                      </div>
                      <span className="font-medium text-slate-800">
                        {s.lastName} {s.firstName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{s.registrationNo}</td>
                  {isMainClass && (
                    <>
                      {['trimestre1', 'trimestre2', 'trimestre3'].map((k) => (
                        <td key={k} className="px-3 py-3 text-center">
                          {(() => {
                            const average = s.averages?.[k as keyof NonNullable<Student['averages']>];
                            return (
                              <span className={`text-sm ${avgStyle(average)}`}>
                                {average != null ? average.toFixed(2) : '—'}
                              </span>
                            );
                          })()}
                        </td>
                      ))}
                      <td className="px-3 py-3 text-center">
                        <span className={`text-sm font-bold ${avgStyle(annualAvg)}`}>
                          {annualAvg != null ? annualAvg.toFixed(2) : '—'}
                        </span>
                      </td>
                    </>
                  )}
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        (s._count?.absences || 0) > 5
                          ? 'bg-red-100 text-red-600'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {s._count?.absences || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setHistoryStudent(s)}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1 mx-auto"
                    >
                      <Icon icon="fa-history" />
                      Historique
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {historyStudent && (
        <AbsenceHistoryModal student={historyStudent} onClose={() => setHistoryStudent(null)} />
      )}
    </>
  );
}