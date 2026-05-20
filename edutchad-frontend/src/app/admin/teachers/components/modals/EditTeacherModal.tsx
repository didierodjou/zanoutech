// app/teachers/components/modals/EditTeacherModal.tsx
'use client';
import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { Teacher } from '../../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface EditTeacherModalProps {
  teacher: Teacher;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditTeacherModal({ teacher, onClose, onSuccess }: EditTeacherModalProps) {
  const [form, setForm] = useState({
    firstName: teacher.firstName,
    lastName: teacher.lastName,
    phone: teacher.phone || '',
    specialty: teacher.specialty || '',
    photo: teacher.photo || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/teachers/${teacher.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        alert('✅ Professeur modifié avec succès');
        onSuccess();
        onClose();
      } else {
        alert('Erreur lors de la modification');
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
          <h3 className="text-xl font-bold"><Icon icon="fa-edit" className="text-blue-500 mr-2" /> Modifier le professeur</h3>
          <button onClick={onClose}><Icon icon="fa-times" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Prénom" required value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} className="border p-2 rounded" />
            <input type="text" placeholder="Nom" required value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} className="border p-2 rounded" />
          </div>
          <input type="text" placeholder="Spécialité" required value={form.specialty} onChange={e => setForm({...form, specialty: e.target.value})} className="w-full border p-2 rounded" />
          <input type="url" placeholder="Photo URL" value={form.photo} onChange={e => setForm({...form, photo: e.target.value})} className="w-full border p-2 rounded" />
          <input type="tel" placeholder="Téléphone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full border p-2 rounded" />
          <div className="bg-gray-100 p-3 rounded">
            <p className="text-sm text-gray-600">Email: <span className="font-semibold">{teacher.user?.email}</span> (non modifiable)</p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700">Annuler</button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded flex items-center gap-2">
              {loading ? <><Icon icon="fa-spinner" className="fa-spin" /> Enregistrement...</> : <><Icon icon="fa-save" /> Enregistrer</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}