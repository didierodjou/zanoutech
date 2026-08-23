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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
      {teachers.map(teacher => {
        const fullName = `${teacher.firstName} ${teacher.lastName}`;
        const hasMainClass = Boolean(teacher.mainClass);

        return (
          <div
            key={teacher.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
          >
            {/* Ligne d'accentuation en haut */}
            <div className={`h-1.5 w-full ${hasMainClass ? 'bg-amber-500' : 'bg-blue-600'}`} />

            <div className="p-5 flex-1 flex flex-col justify-between space-y-5">
              
              {/* En-tête : Badge + Profil */}
              <div>
                <div className="flex items-center justify-between min-h-[28px] mb-3">
                  {hasMainClass ? (
                    <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                      <Icon icon="fa-crown" className="text-amber-500 text-[11px]" /> Professeur Principal
                    </span>
                  ) : <div />}
                </div>

                <div className="flex items-center gap-4">
                  {teacher.photo ? (
                    <img
                      src={teacher.photo}
                      alt={fullName}
                      className="w-14 h-14 rounded-xl object-cover shadow-sm border border-gray-100 shrink-0"
                    />
                  ) : (
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-sm shrink-0 ${hasMainClass ? 'bg-amber-500' : 'bg-blue-600'}`}>
                      {teacher.firstName?.[0]}{teacher.lastName?.[0]}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 truncate" title={fullName}>{fullName}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5 truncate">
                      <Icon icon="fa-briefcase" className="text-gray-400 shrink-0" />
                      <span className="truncate">{teacher.specialty || 'Aucune spécialité'}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Téléphone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg truncate">
                  <Icon icon="fa-phone" className="text-gray-400 shrink-0" />
                  <span className="truncate">{teacher.phone || 'Non renseigné'}</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg truncate" title={teacher.user?.email || '-'}>
                  <Icon icon="fa-envelope" className="text-gray-400 shrink-0" />
                  <span className="truncate">{teacher.user?.email || '-'}</span>
                </div>
              </div>

              {/* Section Classe Principale */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                    <Icon icon="fa-school" className="text-gray-400" /> Classe principale
                  </span>
                  {hasMainClass && (
                    <button
                      onClick={() => onRemoveMainClass(teacher.id, fullName)}
                      className="text-[11px] text-red-600 hover:text-red-800 font-medium transition"
                    >
                      Retirer
                    </button>
                  )}
                </div>
                {hasMainClass ? (
                  <div className="bg-amber-50/60 border border-amber-200/80 p-2.5 rounded-lg text-xs font-medium text-amber-900 flex items-center justify-between">
                    <span>{teacher.mainClass?.name} ({teacher.mainClass?.level})</span>
                  </div>
                ) : (
                  <div className="text-gray-400 italic bg-gray-50 p-2.5 rounded-lg text-xs text-center border border-dashed border-gray-200">
                    Aucune classe principale
                  </div>
                )}
              </div>

              {/* Section Matières Enseignées */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                    <Icon icon="fa-book" className="text-gray-400" /> Matières enseignées
                  </span>
                  <button
                    onClick={() => onAssignSubjects(teacher)}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Gérer
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                  {teacher.subjects?.length ? (
                    teacher.subjects.map(s => (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md font-medium border border-black/5"
                        style={{
                          backgroundColor: s.color ? `${s.color}15` : '#eff6ff',
                          color: s.color || '#2563eb'
                        }}
                      >
                        {s.name}
                        <button
                          onClick={() => onRemoveSubject(teacher.id, s.id, s.name)}
                          className="hover:opacity-75 transition ml-0.5"
                          title={`Retirer ${s.name}`}
                        >
                          <Icon icon="fa-times" className="text-[10px]" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 italic text-xs">Aucune matière assignée</span>
                  )}
                </div>
              </div>

              {/* Section Classes Enseignées */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                    <Icon icon="fa-chalkboard-teacher" className="text-gray-400" /> Classes enseignées
                  </span>
                  <button
                    onClick={() => onAssignClass(teacher)}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Ajouter
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                  {teacher.courses?.length ? (
                    teacher.courses.map(course => (
                      <span
                        key={course.id}
                        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/60 rounded-md font-medium"
                      >
                        {course.class.name} <span className="text-emerald-600 text-[10px]">({course.subject.name})</span>
                        <button
                          onClick={() => onRemoveClass(teacher.id, course.class.id, course.subject.id, course.class.name, course.subject.name)}
                          className="text-emerald-700 hover:text-red-600 transition"
                          title="Retirer cette classe"
                        >
                          <Icon icon="fa-times" className="text-[10px]" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 italic text-xs">Aucune classe assignée</span>
                  )}
                </div>
              </div>

              {/* Statut KPIs Bas de carte */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-gray-50 p-2.5 rounded-lg text-center border border-gray-100">
                  <p className="text-lg font-bold text-gray-900">{teacher.subjects?.length || 0}</p>
                  <p className="text-[11px] text-gray-500">Matières</p>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-lg text-center border border-gray-100">
                  <p className="text-lg font-bold text-gray-900">{teacher.distinctClassesCount ?? teacher.courses?.length ?? 0}</p>
                  <p className="text-[11px] text-gray-500">Classes</p>
                </div>
              </div>

            </div>

            {/* Actions Pied de carte */}
            <div className="bg-gray-50/80 px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-2">
              <button
                onClick={() => onViewDetails(teacher)}
                className="flex-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Icon icon="fa-eye" className="text-gray-500" /> Détails
              </button>

              <button
                onClick={() => onAssignMain(teacher)}
                disabled={hasMainClass}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition flex items-center justify-center gap-1.5 ${
                  hasMainClass
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                }`}
              >
                <Icon icon="fa-crown" className={hasMainClass ? 'text-gray-400' : 'text-amber-600'} />
                {hasMainClass ? 'Principal' : 'Assigner'}
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEdit(teacher)}
                  className="w-8 h-8 bg-white hover:bg-blue-50 text-gray-600 hover:text-blue-600 border border-gray-300 rounded-lg flex items-center justify-center transition"
                  title="Modifier"
                >
                  <Icon icon="fa-edit" className="text-xs" />
                </button>
                <button
                  onClick={() => onDelete(teacher.id, fullName)}
                  className="w-8 h-8 bg-white hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-300 rounded-lg flex items-center justify-center transition"
                  title="Supprimer"
                >
                  <Icon icon="fa-trash" className="text-xs" />
                </button>
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
}