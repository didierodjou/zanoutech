// app/students/components/DetailsModal.tsx
'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { Student } from '../types';
import { studentApi } from '../services/studentApi';

interface Props {
  student: Student;
  onClose: () => void;
  onEdit: () => void;
  onAddAbsence: () => void;
  onAddGrade: () => void;
  onAddPunishment: () => void;
  onPayment: () => void;
}

export default function DetailsModal({ student, onClose, onEdit, onAddAbsence, onAddGrade, onAddPunishment, onPayment }: Props) {
  const [editingGrade, setEditingGrade] = useState<{ id: string; value: number; trimester: number } | null>(null);
  const [editValue, setEditValue] = useState(0);

  const saveEditedGrade = async (gradeId: string, trimester: number) => {
    try {
      await studentApi.updateGrade(gradeId, editValue, trimester);
      window.location.reload(); // simple refresh; could refetch details
    } catch (err) { alert('Erreur mise à jour note'); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-2 border-b flex-wrap gap-2">
          <div className="flex items-center gap-3">
            {student.photo ? <img src={student.photo} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover" /> : <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">{student.lastName[0]}{student.firstName[0]}</div>}
            <div><h3 className="text-base sm:text-xl font-bold">{student.lastName.toUpperCase()} {student.firstName}</h3><p className="text-xs text-gray-500">{student.registrationNo}</p></div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><Icon icon="fa-times" className="text-xl" /></button>
        </div>

        <div className="space-y-6">
          {/* Infos générales */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-600"><Icon icon="fa-calendar" className="mr-1" /> Date de naissance</p><p className="font-semibold">{new Date(student.dateOfBirth).toLocaleDateString('fr-FR')}</p></div>
            <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-600"><Icon icon={student.sex === 'M' ? 'fa-mars' : 'fa-venus'} /> Sexe</p><p>{student.sex === 'M' ? 'Masculin' : 'Féminin'}</p></div>
            <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-600"><Icon icon="fa-school" /> Classe</p><p>{student.class?.name || 'Non assigné'}</p></div>
          </div>
          {/* Parent */}
          <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-600"><Icon icon="fa-users" /> Parent / Tuteur</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><p className="text-xs">Nom</p><p className="font-medium">{student.parentName}</p></div><div><p className="text-xs">Téléphone</p><p className="font-medium">{student.parentPhone}</p></div>{student.parentEmail && <div className="col-span-2"><p className="text-xs">Email</p><p className="font-medium">{student.parentEmail}</p></div>}</div></div>

          {/* Paiement */}
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <div className="flex justify-between items-center"><p className="font-semibold"><Icon icon="fa-money-bill-wave" /> Scolarité</p><button onClick={onPayment} className="text-sm bg-yellow-600 text-white px-3 py-1 rounded">Payer</button></div>
            <p>Total: {student.tuitionFee ?? 0} FCFA | Payé: {student.tuitionPaid ?? 0} FCFA | Statut: <span className={`font-bold ${student.tuitionStatus === 'PAID' ? 'text-green-600' : student.tuitionStatus === 'PARTIAL' ? 'text-orange-600' : 'text-red-600'}`}>{student.tuitionStatus}</span></p>
          </div>

          {/* Notes */}
          <div><div className="flex justify-between items-center mb-3"><h4 className="font-semibold"><Icon icon="fa-star" /> Notes ({student.grades?.length || 0})</h4><button onClick={onAddGrade} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm">+ Ajouter</button></div>
            {student.grades && student.grades.length > 0 ? <div className="border rounded-lg divide-y">{student.grades.slice(0, 10).map(g => (<div key={g.id} className="flex justify-between p-3"><div><p className="font-medium">{g.subject?.name}</p><p className="text-xs">Trimestre {g.trimester} • Coef {g.coefficient}</p></div>{editingGrade?.id === g.id ? <div className="flex gap-2"><input type="number" step="0.5" className="w-20 border rounded p-1" value={editValue} onChange={e => setEditValue(parseFloat(e.target.value))} /><button onClick={() => saveEditedGrade(g.id, g.trimester)} className="text-green-600"><Icon icon="fa-check" /></button><button onClick={() => setEditingGrade(null)}><Icon icon="fa-times" /></button></div> : <div className="flex items-center gap-2"><span className="font-bold text-blue-600">{g.value}/20</span><button onClick={() => { setEditingGrade({ id: g.id, value: g.value, trimester: g.trimester }); setEditValue(g.value); }} className="text-gray-400 hover:text-blue-600"><Icon icon="fa-edit" /></button></div>}</div>))}</div> : <div className="text-center py-6 bg-gray-50 rounded-lg">Aucune note</div>}</div>

          {/* Absences */}
          <div><div className="flex justify-between items-center mb-3"><h4 className="font-semibold"><Icon icon="fa-clock" className="text-orange-500" /> Absences ({student.absences?.length || 0})</h4><button onClick={onAddAbsence} className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-sm">+ Ajouter</button></div>
            {student.absences && student.absences.length > 0 ? <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">{student.absences.map(a => (<div key={a.id} className="flex justify-between p-3"><div><p className="font-medium">{new Date(a.date).toLocaleDateString('fr-FR')}</p><div className="flex gap-2 mt-1"><span className={`text-xs px-2 py-0.5 rounded-full ${a.type === 'RETARD' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{a.type === 'RETARD' ? 'Retard' : 'Absence'}</span>{a.reason && <span className="text-xs text-gray-500">{a.reason}</span>}</div></div><span className={`text-xs px-2 py-1 rounded-full ${a.isJustified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{a.isJustified ? 'Justifiée' : 'Non justifiée'}</span></div>))}</div> : <div className="text-center py-6 bg-gray-50 rounded-lg">Aucune absence</div>}</div>

          {/* Punishments (optional quick view) */}
          <div><h4 className="font-semibold"><Icon icon="fa-gavel" className="text-red-500" /> Punitions</h4><button onClick={onAddPunishment} className="text-sm text-red-600 underline">+ Ajouter</button></div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button onClick={onEdit} className="px-5 py-2 bg-blue-600 text-white rounded-lg">Modifier</button>
          <button onClick={onClose} className="px-5 py-2 bg-gray-600 text-white rounded-lg">Fermer</button>
        </div>
      </div>
    </div>
  );
}