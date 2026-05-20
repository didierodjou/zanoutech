// app/students/components/PunishmentModal.tsx
'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { studentApi } from '../services/studentApi';
import { PUNISHMENT_REASONS } from '../utils/constants';
import { Student } from '../types';

interface Props {
  student: Student;
  defaultTrimester: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PunishmentModal({ student, defaultTrimester, onClose, onSuccess }: Props) {
  const [hours, setHours] = useState(2);
  const [trimester, setTrimester] = useState(defaultTrimester);
  const [givenBy, setGivenBy] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);

  const getReason = () => (selectedReason === 'AUTRE' ? customReason : selectedReason);

  const handleSubmit = async () => {
    if (hours <= 0) return alert('Heures invalides');
    setLoading(true);
    try {
      await studentApi.addPunishment(student.id, {
        hours,
        reason: getReason() || undefined,
        trimester,
        givenBy: givenBy || 'Système',
      });
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
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold"><Icon icon="fa-gavel" className="text-red-500 mr-2" /> Ajouter une punition</h3>
          <button onClick={onClose}><Icon icon="fa-times" /></button>
        </div>
        <div className="space-y-4">
          <p>Élève : <span className="font-semibold">{student.lastName} {student.firstName}</span></p>
          <div><label>Trimestre</label><select className="w-full border p-2 rounded" value={trimester} onChange={e => setTrimester(parseInt(e.target.value))}><option value={1}>1</option><option value={2}>2</option><option value={3}>3</option></select></div>
          <div><label>Heures de colle</label><input type="number" min="0.5" step="0.5" className="w-full border p-2 rounded" value={hours} onChange={e => setHours(parseFloat(e.target.value))} /></div>
          <div><label>Motif</label><select className="w-full border p-2 rounded mb-2" value={selectedReason} onChange={e => setSelectedReason(e.target.value)}><option value="">-- Choisir --</option>{PUNISHMENT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}<option value="AUTRE">Autre</option></select>{selectedReason === 'AUTRE' && <input type="text" placeholder="Saisissez le motif" className="w-full border p-2 rounded" value={customReason} onChange={e => setCustomReason(e.target.value)} />}</div>
          <div><label>Donné par</label><input type="text" className="w-full border p-2 rounded" value={givenBy} onChange={e => setGivenBy(e.target.value)} placeholder="Nom du professeur" /></div>
          <div className="flex justify-end gap-3"><button onClick={onClose} className="px-4 py-2 text-gray-700">Annuler</button><button onClick={handleSubmit} disabled={loading} className="bg-red-600 text-white px-6 py-2 rounded flex items-center gap-2">{loading ? <Icon icon="fa-spinner" className="fa-spin" /> : 'Enregistrer'}</button></div>
        </div>
      </div>
    </div>
  );
}