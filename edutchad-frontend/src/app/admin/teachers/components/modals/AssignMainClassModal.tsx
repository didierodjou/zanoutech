// app/teachers/components/modals/AssignMainClassModal.tsx
'use client';
import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { Teacher, Class } from '../../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface AssignMainClassModalProps {
  teacher: Teacher;
  classes: Class[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssignMainClassModal({ teacher, classes, onClose, onSuccess }: AssignMainClassModalProps) {
  const [classId, setClassId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/teachers/${teacher.id}/assign-main-class`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ classId }),
      });
      if (res.ok) {
        alert('✅ Classe principale assignée');
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
          <h3 className="text-xl font-bold"><Icon icon="fa-crown" className="text-yellow-500 mr-2" /> Assigner classe principale</h3>
          <button onClick={onClose}><Icon icon="fa-times" /></button>
        </div>
        <p className="text-sm text-gray-600 mb-4">Professeur: {teacher.firstName} {teacher.lastName}</p>
        <select value={classId} onChange={e => setClassId(e.target.value)} className="w-full border p-3 rounded mb-4">
          <option value="">Sélectionner une classe...</option>
          {classes.filter(c => !c.mainTeacher || c.mainTeacher.id === teacher.id).map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.level}) - {c._count?.students || 0} élèves</option>
          ))}
        </select>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-700">Annuler</button>
          <button onClick={handleSubmit} disabled={!classId || loading} className="px-6 py-2 bg-yellow-600 text-white rounded flex items-center gap-2">
            {loading ? <><Icon icon="fa-spinner" className="fa-spin" /> Assignation...</> : <><Icon icon="fa-check" /> Assigner</>}
          </button>
        </div>
      </div>
    </div>
  );
}