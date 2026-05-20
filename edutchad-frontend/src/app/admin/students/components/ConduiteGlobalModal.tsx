// app/students/components/ConduiteGlobalModal.tsx
'use client';
import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { studentApi } from '../services/studentApi';
import { Class } from '../types';

export default function ConduiteGlobalModal({ classes, onClose, onSuccess }: { classes: Class[]; onClose: () => void; onSuccess: () => void }) {
  const [trimester, setTrimester] = useState(3);
  const [conduiteNote, setConduiteNote] = useState(10);
  const [classId, setClassId] = useState('');
  const [loading, setLoading] = useState(false);

  const apply = async () => {
    setLoading(true);
    try {
      await studentApi.setConduiteForAll(trimester, conduiteNote, classId || undefined);
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
      <div className="bg-white rounded-xl max-w-lg w-full p-6">
        <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold"><Icon icon="fa-star" className="text-orange-500 mr-2" />Notation conduite (massive)</h3><button onClick={onClose}><Icon icon="fa-times" /></button></div>
        <div className="space-y-4">
          <div><label>Trimestre</label><select className="w-full border p-2 rounded" value={trimester} onChange={e => setTrimester(parseInt(e.target.value))}><option value={1}>1</option><option value={2}>2</option><option value={3}>3</option></select></div>
          <div>
            <label>Note (0-20)</label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="20"
              className="w-full border p-2 rounded"
              value={conduiteNote ?? ''}
              onChange={e => {
                const rawValue = e.target.value;
                const numericValue = rawValue === '' ? 0 : parseFloat(rawValue);
                setConduiteNote(isNaN(numericValue) ? 0 : numericValue);
              }}
            />
          </div>
          <div><label>Appliquer à</label><select className="w-full border p-2 rounded" value={classId} onChange={e => setClassId(e.target.value)}><option value="">Tous les élèves</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="flex justify-end gap-3"><button onClick={onClose} className="px-4 py-2 text-gray-700">Annuler</button><button onClick={apply} disabled={loading} className="bg-orange-600 text-white px-6 py-2 rounded flex items-center gap-2">{loading ? <Icon icon="fa-spinner" className="fa-spin" /> : 'Appliquer'}</button></div>
        </div>
      </div>
    </div>
  );
}