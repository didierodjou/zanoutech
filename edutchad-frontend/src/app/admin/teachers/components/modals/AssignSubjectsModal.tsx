// app/teachers/components/modals/AssignSubjectsModal.tsx
'use client';
import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { Teacher, Subject } from '../../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface AssignSubjectsModalProps {
  teacher: Teacher;
  subjects: Subject[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssignSubjectsModal({ teacher, subjects, onClose, onSuccess }: AssignSubjectsModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(teacher.subjects?.map(s => s.id) || []);
  const [loading, setLoading] = useState(false);

  const toggleSubject = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/teachers/${teacher.id}/assign-subjects`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subjectIds: selectedIds }),
      });
      if (res.ok) {
        alert('✅ Matières mises à jour');
        onSuccess();
        onClose();
      } else {
        alert('Erreur');
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
          <h3 className="text-xl font-bold"><Icon icon="fa-book" className="text-green-500 mr-2" /> Gérer les matières</h3>
          <button onClick={onClose}><Icon icon="fa-times" /></button>
        </div>
        <p className="text-sm text-gray-600 mb-4">Professeur: {teacher.firstName} {teacher.lastName}</p>
        <div className="border rounded-lg max-h-60 overflow-y-auto p-2">
          {subjects.map(s => (
            <label key={s.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggleSubject(s.id)} className="w-4 h-4" />
              <span>{s.name}</span>
            </label>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-2">{selectedIds.length} matière(s) sélectionnée(s)</p>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-gray-700">Annuler</button>
          <button onClick={handleSubmit} disabled={loading} className="px-6 py-2 bg-green-600 text-white rounded flex items-center gap-2">
            {loading ? <><Icon icon="fa-spinner" className="fa-spin" /> Enregistrement...</> : <><Icon icon="fa-check" /> Enregistrer</>}
          </button>
        </div>
      </div>
    </div>
  );
}