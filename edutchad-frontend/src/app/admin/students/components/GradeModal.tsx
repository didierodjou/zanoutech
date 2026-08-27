// app/students/components/GradeModal.tsx
'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { studentApi } from '../services/studentApi';
import { Student, Subject } from '../types';
import { calculateWeightedAverage } from '../utils/constants';

interface Props {
  student: Student;
  subjects: Subject[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function GradeModal({ student, subjects, onClose, onSuccess }: Props) {
  const [subjectId, setSubjectId] = useState('');
  const [trimester, setTrimester] = useState(1);
  const [devoir, setDevoir] = useState<number>(0);
  const [interrogations, setInterrogations] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const addInterro = () => setInterrogations([...interrogations, 0]);
  const updateInterro = (idx: number, val: number) => {
    const newArr = [...interrogations];
    newArr[idx] = val;
    setInterrogations(newArr);
  };
  const removeInterro = (idx: number) => setInterrogations(interrogations.filter((_, i) => i !== idx));

  // Parse une saisie de note en la plafonnant entre 0 et 20 (retourne null si le
  // champ doit s'afficher vide, ex: l'utilisateur vient d'effacer le champ).
  const parseNoteInput = (raw: string): number => {
    if (raw === '') return 0;
    let val = parseFloat(raw);
    if (isNaN(val)) return 0;
    if (val > 20) val = 20;
    if (val < 0) val = 0;
    return val;
  };

  const handleSave = async () => {
    if (!subjectId || !trimester) return alert('Choisissez matière et trimestre');
    setLoading(true);
    try {
      // Create controls
      await studentApi.createControl({
        studentId: student.id,
        subjectId,
        trimester,
        type: 'DEVOIR',
        value: devoir,
        coefficient: 2,
      });
      for (const note of interrogations) {
        if (note > 0) {
          await studentApi.createControl({
            studentId: student.id,
            subjectId,
            trimester,
            type: 'INTERROGATION',
            value: note,
            coefficient: 1,
          });
        }
      }
      const avg = calculateWeightedAverage(devoir, interrogations);
      await studentApi.calculateGrade({
        studentId: student.id,
        subjectId,
        trimester,
        value: avg,
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
      <div className="bg-white rounded-xl max-w-3xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold"><Icon icon="fa-star" className="text-green-500 mr-2" /> Saisir les notes – {student.lastName} {student.firstName}</h3>
          <button onClick={onClose}><Icon icon="fa-times" /></button>
        </div>
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label>Matière</label><select className="w-full border p-2 rounded" value={subjectId} onChange={e => setSubjectId(e.target.value)}><option value="">Sélectionner</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div><label>Trimestre</label><select className="w-full border p-2 rounded" value={trimester} onChange={e => setTrimester(parseInt(e.target.value))}><option value={1}>1</option><option value={2}>2</option><option value={3}>3</option></select></div>
          </div>
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="mb-4"><label>Note du Devoir</label><input type="number" min={0} max={20} step="0.5" className="w-full border p-2 rounded" value={devoir === 0 ? '' : devoir} onChange={e => setDevoir(parseNoteInput(e.target.value))} /></div>
            <div><div className="flex justify-between"><label>Interrogations</label><button type="button" onClick={addInterro} className="text-blue-600 text-sm">+ Ajouter</button></div>{interrogations.map((n, idx) => (<div key={idx} className="flex gap-2 mt-2"><input type="number" min={0} max={20} step="0.5" className="flex-1 border p-2 rounded" value={n === 0 ? '' : n} onChange={e => updateInterro(idx, parseNoteInput(e.target.value))} /><button onClick={() => removeInterro(idx)} className="text-red-600"><Icon icon="fa-trash" /></button></div>))}</div>
            {subjectId && (<div className="mt-4 p-3 bg-blue-50 rounded"><p className="text-sm">Moyenne pondérée</p><p className="text-2xl font-bold">{calculateWeightedAverage(devoir, interrogations)}/20</p></div>)}
          </div>
          <div className="flex justify-end gap-3"><button onClick={onClose} className="px-4 py-2 text-gray-700">Annuler</button><button onClick={handleSave} disabled={loading} className="bg-green-600 text-white px-6 py-2 rounded flex items-center gap-2">{loading ? <Icon icon="fa-spinner" className="fa-spin" /> : 'Enregistrer'}</button></div>
        </div>
      </div>
    </div>
  );
}