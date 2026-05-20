// app/students/components/DeletedStudentsModal.tsx
'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { studentApi } from '../services/studentApi';
import { Student } from '../types';

interface Props {
  onClose: () => void;
  onRestore: () => void;
}

export default function DeletedStudentsModal({ onClose, onRestore }: Props) {
  const [deletedStudents, setDeletedStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const fetchDeleted = async () => {
    try {
      const data = await studentApi.getDeleted();
      setDeletedStudents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeleted();
  }, []);

  const handleRestore = async (id: string) => {
    setRestoringId(id);
    try {
      await studentApi.restore(id);
      await fetchDeleted();
      onRestore(); // rafraîchit la liste principale
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            <Icon icon="fa-trash-restore" className="text-red-500 mr-2" />
            Élèves supprimés (soft delete)
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <Icon icon="fa-times" className="text-xl" />
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><Icon icon="fa-spinner" className="fa-spin text-2xl text-gray-600" /></div>
        ) : deletedStudents.length === 0 ? (
          <p className="text-center text-gray-600 py-8">Aucun élève supprimé</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left text-gray-800">Nom complet</th>
                  <th className="p-2 text-left text-gray-800">Matricule</th>
                  <th className="p-2 text-left text-gray-800">Supprimé le</th>
                  <th className="p-2 text-left text-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deletedStudents.map(s => (
                  <tr key={s.id} className="border-t border-gray-200">
                    <td className="p-2 text-gray-900">{s.lastName} {s.firstName}</td>
                    <td className="p-2 text-gray-900">{s.registrationNo}</td>
                    <td className="p-2 text-gray-900">{s.user?.deletedAt ? new Date(s.user.deletedAt).toLocaleDateString() : '-'}</td>
                    <td className="p-2">
                      <button
                        onClick={() => handleRestore(s.id)}
                        disabled={restoringId === s.id}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1 hover:bg-green-700 disabled:opacity-50"
                      >
                        {restoringId === s.id ? <Icon icon="fa-spinner" className="fa-spin" /> : <Icon icon="fa-undo" />}
                        Restaurer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Fermer</button>
        </div>
      </div>
    </div>
  );
}