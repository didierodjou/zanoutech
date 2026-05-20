// app/teachers/components/TeacherTable.tsx
import Icon from '@/components/ui/Icon';
import { Teacher } from '../types';

interface TeacherTableProps {
  teachers: Teacher[];
  onViewDetails: (teacher: Teacher) => void;
  onEdit: (teacher: Teacher) => void;
  onAssignMain: (teacher: Teacher) => void;
  onAssignSubjects: (teacher: Teacher) => void;
  onAssignClass: (teacher: Teacher) => void;
  onDelete: (id: string, name: string) => Promise<boolean>;
}

export default function TeacherTable({ teachers, onViewDetails, onEdit, onAssignMain, onAssignSubjects, onAssignClass, onDelete }: TeacherTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Professeur</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Classe Principale</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matières</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Classes</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {teachers.map(teacher => {
              // ✅ Utilisation du champ distinctClassesCount (nombre de classes distinctes)
              const assignedClassesCount = teacher.distinctClassesCount ?? teacher.courses?.length ?? 0;
              return (
                <tr key={teacher.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold ${teacher.mainClass ? 'bg-yellow-500' : 'bg-blue-500'}`}>
                        {teacher.firstName[0]}{teacher.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium">{teacher.firstName} {teacher.lastName}</p>
                        {teacher.mainClass && <span className="text-xs text-yellow-600 flex items-center gap-1"><Icon icon="fa-crown" className="text-xs" /> Principal</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600">{teacher.phone || '-'}</p>
                    <p className="text-xs text-gray-500">{teacher.user?.email || '-'}</p>
                  </td>
                  <td className="px-6 py-4">{teacher.mainClass ? teacher.mainClass.name : <span className="italic text-gray-400">-</span>}</td>
                  <td className="px-6 py-4">{teacher.subjects?.length || 0}</td>
                  <td className="px-6 py-4">{assignedClassesCount}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => onViewDetails(teacher)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Détails"><Icon icon="fa-eye" /></button>
                      <button onClick={() => onAssignMain(teacher)} disabled={!!teacher.mainClass} className={`p-1 rounded ${teacher.mainClass ? 'text-gray-400' : 'text-yellow-600 hover:bg-yellow-50'}`} title="Assigner principal"><Icon icon="fa-crown" /></button>
                      <button onClick={() => onAssignSubjects(teacher)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Matières"><Icon icon="fa-book" /></button>
                      <button onClick={() => onEdit(teacher)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Modifier"><Icon icon="fa-edit" /></button>
                      <button onClick={() => onAssignClass(teacher)} className="p-1 text-purple-600 hover:bg-purple-50 rounded" title="Assigner une classe"><Icon icon="fa-plus-circle" /></button>
                      <button onClick={() => onDelete(teacher.id, `${teacher.firstName} ${teacher.lastName}`)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Supprimer"><Icon icon="fa-trash" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}