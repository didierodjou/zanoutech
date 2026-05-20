// app/students/components/SemesterSelectorModal.tsx
'use client';

import Icon from '@/components/ui/Icon';
import { Student } from '../types';

interface Props {
  student: Student;
  selectedSemester: '1' | '2' | '3';
  setSelectedSemester: (sem: '1' | '2' | '3') => void;
  onGenerate: () => void;
  onClose: () => void;
  loading: boolean;
}

export default function SemesterSelectorModal({ student, selectedSemester, setSelectedSemester, onGenerate, onClose, loading }: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold"><Icon icon="fa-calendar-alt" className="text-purple-500 mr-2" /> Générer le bulletin</h3>
          <button onClick={onClose}><Icon icon="fa-times" /></button>
        </div>
        <div className="space-y-5">
          <p>Élève : <span className="font-semibold">{student.lastName} {student.firstName}</span></p>
          <div><label className="block font-semibold mb-2">Trimestre</label><div className="grid grid-cols-3 gap-3">{(['1','2','3'] as const).map(t => (<button key={t} onClick={() => setSelectedSemester(t)} className={`p-3 rounded-lg border-2 text-center ${selectedSemester === t ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-200'}`}><span className="text-2xl font-bold block">{t}</span><span className="text-sm">Trimestre {t}</span></button>))}</div></div>
          <div className="flex justify-end gap-3"><button onClick={onClose} className="px-4 py-2 text-gray-700">Annuler</button><button onClick={onGenerate} disabled={loading} className="bg-purple-600 text-white px-6 py-2 rounded flex items-center gap-2">{loading ? <Icon icon="fa-spinner" className="fa-spin" /> : 'Générer'}</button></div>
        </div>
      </div>
    </div>
  );
}