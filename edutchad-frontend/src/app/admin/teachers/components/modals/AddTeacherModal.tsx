// app/teachers/components/modals/AddTeacherModal.tsx
'use client';
import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { useSubjects } from '../../hooks/useSubjects';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface AddTeacherModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddTeacherModal({ onClose, onSuccess }: AddTeacherModalProps) {
  const { subjects } = useSubjects();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', specialty: '', photo: '', subjectIds: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/teachers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setErrorMsg(data.message || 'Un email a déjà été envoyé récemment.');
        } else {
          setErrorMsg(data.message || 'Erreur lors de la création');
        }
        return;
      }
      alert('✅ Professeur créé avec succès ! Un email a été envoyé.');
      onSuccess();
      onClose();
    } catch {
      setErrorMsg('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold"><Icon icon="fa-user-plus" className="text-blue-500 mr-2" /> Nouveau Professeur</h3>
          <button onClick={onClose}><Icon icon="fa-times" /></button>
        </div>
        {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{errorMsg}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Prénom *" required value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} className="border p-2 rounded" />
            <input type="text" placeholder="Nom *" required value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} className="border p-2 rounded" />
          </div>
          <input type="text" placeholder="Spécialité" value={form.specialty} onChange={e => setForm({...form, specialty: e.target.value})} className="w-full border p-2 rounded" />
          <input type="email" placeholder="Email *" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border p-2 rounded" />
          <p className="text-xs text-gray-500 -mt-2">Un email sera envoyé avec le mot de passe généré automatiquement</p>
          <input type="url" placeholder="Photo (URL)" value={form.photo} onChange={e => setForm({...form, photo: e.target.value})} className="w-full border p-2 rounded" />
          <input type="tel" placeholder="Téléphone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full border p-2 rounded" />
          <div>
            <label className="block text-sm font-medium mb-1">Matières</label>
            <select multiple className="w-full border p-2 rounded min-h-[120px]" value={form.subjectIds} onChange={e => setForm({...form, subjectIds: Array.from(e.target.selectedOptions, o => o.value)})}>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <p className="text-xs text-gray-500 mt-1">Ctrl+clic pour plusieurs matières</p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">Annuler</button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              {loading ? <><Icon icon="fa-spinner" className="fa-spin" /> Création...</> : <><Icon icon="fa-save" /> Créer</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}