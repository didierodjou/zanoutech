'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { api } from '../services/api';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  registrationNo: string;
}

interface AbsenceRecord {
  id: string;
  date: string;
  type: string;
  isJustified: boolean;
  reason?: string;
}

interface AbsenceHistoryModalProps {
  student: Student;
  onClose: () => void;
}

export function AbsenceHistoryModal({ student, onClose }: AbsenceHistoryModalProps) {
  const [absences, setAbsences] = useState<AbsenceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/absences/student/${student.id}`)
      .then((data) => setAbsences(data.absences || []))
      .catch(() => setAbsences([]))
      .finally(() => setLoading(false));
  }, [student.id]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Icon icon="fa-history" />
            Historique des absences
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <Icon icon="fa-times" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <p className="text-sm text-slate-600 mb-4">
            <span className="font-medium">{student.lastName} {student.firstName}</span> · Matricule {student.registrationNo}
          </p>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
            </div>
          ) : absences.length === 0 ? (
            <p className="text-slate-400 text-center py-4">Aucune absence enregistrée</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-500 text-xs uppercase">
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Justifié</th>
                  <th className="px-3 py-2 text-left">Motif</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {absences.map((a) => (
                  <tr key={a.id}>
                    <td className="px-3 py-2">{new Date(a.date).toLocaleDateString('fr-FR')}</td>
                    <td className="px-3 py-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        a.type === 'ABSENCE' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {a.type === 'ABSENCE' ? 'Absence' : 'Retard'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {a.isJustified ? (
                        <span className="text-emerald-600 text-xs font-medium">Oui</span>
                      ) : (
                        <span className="text-slate-400 text-xs">Non</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{a.reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="px-6 py-3 border-t bg-slate-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}