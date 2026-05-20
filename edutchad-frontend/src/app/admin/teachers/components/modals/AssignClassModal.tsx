// app/teachers/components/modals/AssignClassModal.tsx
'use client';
import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { Teacher, Class, Subject } from '../../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface AssignClassModalProps {
  teacher: Teacher;
  classes: Class[];
  subjects: Subject[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssignClassModal({ teacher, classes, subjects, onClose, onSuccess }: AssignClassModalProps) {
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [coefficient, setCoefficient] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!classId || !subjectId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/teachers/${teacher.id}/assign-class`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ classId, subjectId, coefficient }),
      });
      if (res.ok) {
        alert('✅ Classe assignée avec succès');
        onSuccess();
        onClose();
      } else {
        const err = await res.text();
        alert(`Erreur: ${err}`);
      }
    } catch {
      alert('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold"><Icon icon="fa-chalkboard-teacher" className="text-green-500 mr-2" /> Assigner une classe</h3>
          <button onClick={onClose}><Icon icon="fa-times" /></button>
        </div>
        <p className="text-sm text-gray-600 mb-4">Professeur: {teacher.firstName} {teacher.lastName}</p>
        <select value={classId} onChange={e => setClassId(e.target.value)} className="w-full border p-3 rounded mb-4">
          <option value="">Sélectionner une classe...</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.level})</option>)}
        </select>
        <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full border p-3 rounded mb-4">
          <option value="">Sélectionner une matière...</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {/* <input type="number" min="1" max="10" value={coefficient} onChange={e => setCoefficient(parseInt(e.target.value) || 1)} className="w-full border p-3 rounded mb-4" placeholder="Coefficient" /> */}
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-700">Annuler</button>
          <button onClick={handleSubmit} disabled={!classId || !subjectId || loading} className="px-6 py-2 bg-green-600 text-white rounded flex items-center gap-2">
            {loading ? <><Icon icon="fa-spinner" className="fa-spin" /> Assignation...</> : <><Icon icon="fa-check" /> Assigner</>}
          </button>
        </div>
      </div>
    </div>
  );
}