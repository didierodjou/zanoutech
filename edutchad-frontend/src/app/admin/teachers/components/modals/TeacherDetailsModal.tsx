// app/teachers/components/modals/TeacherDetailsModal.tsx
'use client';
import Icon from '@/components/ui/Icon';
import { Teacher } from '../../types';

interface TeacherDetailsModalProps {
  teacher: Teacher;
  onClose: () => void;
  onRemoveMainClass?: (id: string, name: string) => void;
}

export default function TeacherDetailsModal({ teacher, onClose, onRemoveMainClass }: TeacherDetailsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <div className="flex items-center gap-3">
            {teacher.photo ? <img src={teacher.photo} alt="photo" className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl">{teacher.firstName[0]}{teacher.lastName[0]}</div>}
            <div><h3 className="text-xl font-bold">{teacher.firstName} {teacher.lastName}</h3><p className="text-gray-600">{teacher.specialty || 'Aucune spécialité'}</p></div>
          </div>
          <button onClick={onClose}><Icon icon="fa-times" className="text-xl" /></button>
        </div>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded"><p className="text-sm text-gray-600"><Icon icon="fa-phone" /> Téléphone</p><p className="font-semibold">{teacher.phone || 'Non renseigné'}</p></div>
            <div className="bg-gray-50 p-4 rounded"><p className="text-sm text-gray-600"><Icon icon="fa-envelope" /> Email</p><p className="font-semibold">{teacher.user?.email || '-'}</p></div>
          </div>

          <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-yellow-700"><Icon icon="fa-crown" /> Classe principale</p>
              {teacher.mainClass && onRemoveMainClass && (
                <button
                  onClick={() => {
                    if (confirm(`Retirer le rôle de professeur principal à ${teacher.firstName} ${teacher.lastName} ?`)) {
                      onRemoveMainClass(teacher.id, `${teacher.firstName} ${teacher.lastName}`);
                      onClose();
                    }
                  }}
                  className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                >
                  <Icon icon="fa-trash" /> Retirer
                </button>
              )}
            </div>
            {teacher.mainClass ? (
              <p className="font-bold text-yellow-800">{teacher.mainClass.name} ({teacher.mainClass.level})</p>
            ) : (
              <p className="italic">Aucune</p>
            )}
          </div>

          <div>
            <h4 className="font-semibold flex items-center gap-2 mb-2"><Icon icon="fa-book" /> Matières enseignées ({teacher.subjects?.length || 0})</h4>
            <div className="flex flex-wrap gap-2">{teacher.subjects?.length ? teacher.subjects.map(s => <span key={s.id} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">{s.name}</span>) : <p className="text-gray-500">Aucune</p>}</div>
          </div>

          <div>
            <h4 className="font-semibold flex items-center gap-2 mb-2"><Icon icon="fa-chalkboard-teacher" /> Classes enseignées ({teacher.courses?.length || 0})</h4>
            <div className="flex flex-wrap gap-2">{teacher.courses?.length ? teacher.courses.map(c => <span key={c.id} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">{c.class.name} ({c.subject.name})</span>) : <p className="text-gray-500">Aucune</p>}</div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded">Fermer</button>
        </div>
      </div>
    </div>
  );
}