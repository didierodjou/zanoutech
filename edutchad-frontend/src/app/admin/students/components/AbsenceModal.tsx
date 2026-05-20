// app/students/components/AbsenceModal.tsx
'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { studentApi } from '../services/studentApi';
import { Student, AbsenceData } from '../types';

interface Props {
  student: Student;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AbsenceModal({ student, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<AbsenceData>({
    studentId: student.id,
    date: new Date().toISOString().split('T')[0],
    type: 'ABSENCE',
    isJustified: false,
    reason: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.date) return;
    setLoading(true);
    try {
      await studentApi.createAbsence(form);
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold"><Icon icon="fa-clock" className="text-orange-500 mr-2" /> Absence – {student.lastName} {student.firstName}</h3>
          <button onClick={onClose}><Icon icon="fa-times" /></button>
        </div>
        <div className="space-y-4">
          <div><label>Date</label><input type="date" className="w-full border p-2 rounded" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
          <div><label>Type</label><select className="w-full border p-2 rounded" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="ABSENCE">Absence</option><option value="RETARD">Retard</option></select></div>
          <div><label className="flex items-center gap-2"><input type="checkbox" checked={form.isJustified} onChange={e => setForm({ ...form, isJustified: e.target.checked })} /> Justifiée</label></div>
          <div><label>Motif (optionnel)</label><textarea rows={2} className="w-full border p-2 rounded" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></div>
          <div className="flex justify-end gap-3"><button onClick={onClose} className="px-4 py-2 text-gray-700">Annuler</button><button onClick={handleSubmit} disabled={loading} className="bg-orange-600 text-white px-6 py-2 rounded flex items-center gap-2">{loading ? <Icon icon="fa-spinner" className="fa-spin" /> : 'Enregistrer'}</button></div>
        </div>
      </div>
    </div>
  );
}