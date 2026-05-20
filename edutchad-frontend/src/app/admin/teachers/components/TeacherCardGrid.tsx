// app/teachers/components/TeacherCardGrid.tsx
import Icon from '@/components/ui/Icon';
import { Teacher } from '../types';

interface TeacherCardGridProps {
  teachers: Teacher[];
  onViewDetails: (teacher: Teacher) => void;
  onEdit: (teacher: Teacher) => void;
  onAssignMain: (teacher: Teacher) => void;
  onAssignSubjects: (teacher: Teacher) => void;
  onAssignClass: (teacher: Teacher) => void;
  onDelete: (id: string, name: string) => Promise<boolean>;
  onRemoveMainClass: (id: string, name: string) => void;
  onRemoveSubject: (teacherId: string, subjectId: string, subjectName: string) => void;
  onRemoveClass: (teacherId: string, classId: string, subjectId: string, className: string, subjectName: string) => void;
}

export default function TeacherCardGrid({
  teachers,
  onViewDetails,
  onEdit,
  onAssignMain,
  onAssignSubjects,
  onAssignClass,
  onDelete,
  onRemoveMainClass,
  onRemoveSubject,
  onRemoveClass
}: TeacherCardGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {teachers.map(teacher => (
        <div key={teacher.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition overflow-hidden">
          <div className={`h-2 ${teacher.mainClass ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 'bg-gradient-to-r from-blue-400 to-blue-600'}`} />
          <div className="p-6">
            {teacher.mainClass && (
              <div className="flex justify-end -mt-2 mb-2">
                <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                  <Icon icon="fa-crown" /> Professeur Principal
                </span>
              </div>
            )}
            <div className="flex items-start gap-4 mb-6">
              {teacher.photo ? (
                <img src={teacher.photo} alt="photo" className="w-20 h-20 rounded-xl object-cover shadow-md" />
              ) : (
                <div className={`w-20 h-20 rounded-xl flex items-center justify-center text-white text-3xl font-bold shadow-md ${teacher.mainClass ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'}`}>
                  {teacher.firstName[0]}{teacher.lastName[0]}
                </div>
              )}
              <div>
                <h3 className="text-2xl font-bold">{teacher.firstName} {teacher.lastName}</h3>
                <p className="text-gray-600 flex items-center gap-2"><Icon icon="fa-briefcase" /> {teacher.specialty || 'Aucune spécialité'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-3 rounded-lg"><Icon icon="fa-phone" /> <span>{teacher.phone || 'Non renseigné'}</span></div>
              <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-3 rounded-lg"><Icon icon="fa-envelope" /> <span className="truncate">{teacher.user?.email || '-'}</span></div>
            </div>

            {/* Classe principale avec bouton de retrait */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium flex items-center gap-2"><Icon icon="fa-school" /> Classe principale</span>
                {teacher.mainClass && (
                  <button
                    onClick={() => onRemoveMainClass(teacher.id, `${teacher.firstName} ${teacher.lastName}`)}
                    className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                  >
                    <Icon icon="fa-trash" /> Retirer
                  </button>
                )}
              </div>
              {teacher.mainClass ? (
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 font-semibold text-yellow-800">
                  {teacher.mainClass.name} ({teacher.mainClass.level})
                </div>
              ) : (
                <div className="text-gray-400 italic bg-gray-50 p-3 rounded-lg text-center">Aucune classe principale</div>
              )}
            </div>

            {/* Matières enseignées avec croix de retrait */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium flex items-center gap-2"><Icon icon="fa-book" /> Matières enseignées</span>
                <button onClick={() => onAssignSubjects(teacher)} className="text-xs text-green-600">Gérer</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {teacher.subjects?.length ? teacher.subjects.map(s => (
                  <div key={s.id} className="relative group">
                    <span className="text-xs px-3 py-1.5 rounded-full font-medium pr-8" style={{ backgroundColor: s.color ? `${s.color}20` : '#e6f0ff', color: s.color || '#2563eb' }}>
                      {s.name}
                    </span>
                    <button
                      onClick={() => onRemoveSubject(teacher.id, s.id, s.name)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 text-red-500 opacity-0 group-hover:opacity-100 transition hover:text-red-700"
                      title={`Retirer ${s.name}`}
                    >
                      <Icon icon="fa-times" className="text-xs" />
                    </button>
                  </div>
                )) : <span className="text-gray-400 italic text-sm">Aucune matière</span>}
              </div>
            </div>

            {/* Classes enseignées (via courses) avec croix de retrait */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium flex items-center gap-2"><Icon icon="fa-chalkboard-teacher" /> Classes enseignées</span>
                <button onClick={() => onAssignClass(teacher)} className="text-xs text-green-600">Ajouter</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {teacher.courses?.length ? teacher.courses.map(course => (
                  <div key={course.id} className="relative group bg-green-100 text-green-700 text-xs px-3 py-1.5 rounded-full font-medium pr-8">
                    {course.class.name} ({course.subject.name})
                    <button
                      onClick={() => onRemoveClass(teacher.id, course.class.id, course.subject.id, course.class.name, course.subject.name)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 text-red-500 opacity-0 group-hover:opacity-100"
                      title="Retirer cette classe"
                    >
                      <Icon icon="fa-times" className="text-xs" />
                    </button>
                  </div>
                )) : <span className="text-gray-400 italic text-sm">Aucune classe</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold">{teacher.subjects?.length || 0}</p>
                <p className="text-xs">Matières</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                {/* ✅ Utilisation du nouveau champ distinctClassesCount */}
                <p className="text-2xl font-bold">{teacher.distinctClassesCount ?? teacher.courses?.length ?? 0}</p>
                <p className="text-xs">Classes</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => onViewDetails(teacher)} className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 flex items-center justify-center gap-2"><Icon icon="fa-eye" /> Détails</button>
              <button onClick={() => onAssignMain(teacher)} disabled={!!teacher.mainClass} className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${teacher.mainClass ? 'bg-gray-100 text-gray-400' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'}`}>
                <Icon icon="fa-crown" /> {teacher.mainClass ? 'Principal' : 'Assigner'}
              </button>
              <button onClick={() => onEdit(teacher)} className="w-12 h-10 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center justify-center"><Icon icon="fa-edit" /></button>
              <button onClick={() => onDelete(teacher.id, `${teacher.firstName} ${teacher.lastName}`)} className="w-12 h-10 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center justify-center"><Icon icon="fa-trash" /></button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}