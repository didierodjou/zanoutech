// app/teachers/components/TeacherTable.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
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

export default function TeacherTable({
  teachers,
  onViewDetails,
  onEdit,
  onAssignMain,
  onAssignSubjects,
  onAssignClass,
  onDelete,
}: TeacherTableProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Ferme le menu au clic à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (id: string) => {
    setActiveMenuId(prev => (prev === id ? null : id));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto min-h-[350px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3.5">Professeur</th>
              <th className="px-6 py-3.5">Contact</th>
              <th className="px-6 py-3.5">Classe Principale</th>
              <th className="px-6 py-3.5 text-center">Matières</th>
              <th className="px-6 py-3.5 text-center">Classes</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {teachers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400 italic">
                  Aucun professeur trouvé.
                </td>
              </tr>
            ) : (
              teachers.map(teacher => {
                const fullName = `${teacher.firstName} ${teacher.lastName}`;
                const hasMainClass = Boolean(teacher.mainClass);
                const assignedClassesCount = teacher.distinctClassesCount ?? teacher.courses?.length ?? 0;
                const isMenuOpen = activeMenuId === teacher.id;

                return (
                  <tr key={teacher.id} className="hover:bg-gray-50/80 transition-colors">
                    {/* Professeur */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {teacher.photo ? (
                          <img
                            src={teacher.photo}
                            alt={fullName}
                            className="w-9 h-9 rounded-lg object-cover border border-gray-200"
                          />
                        ) : (
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-2xs ${
                              hasMainClass ? 'bg-amber-500' : 'bg-blue-600'
                            }`}
                          >
                            {teacher.firstName?.[0]}
                            {teacher.lastName?.[0]}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{fullName}</span>
                            {hasMainClass && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-medium rounded-full"
                                title="Professeur Principal"
                              >
                                <Icon icon="fa-crown" className="text-amber-500" /> Principal
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{teacher.specialty || 'Aucune spécialité'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                        <Icon icon="fa-phone" className="text-gray-400 text-[11px]" />
                        {teacher.phone || 'Non renseigné'}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <Icon icon="fa-envelope" className="text-gray-400 text-[11px]" />
                        {teacher.user?.email || '-'}
                      </p>
                    </td>

                    {/* Classe Principale */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {hasMainClass ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/60">
                          {teacher.mainClass?.name} ({teacher.mainClass?.level})
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Non assigné</span>
                      )}
                    </td>

                    {/* Matières */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 bg-blue-50 text-blue-700 font-semibold text-xs rounded-full">
                        {teacher.subjects?.length || 0}
                      </span>
                    </td>

                    {/* Classes */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 bg-emerald-50 text-emerald-700 font-semibold text-xs rounded-full">
                        {assignedClassesCount}
                      </span>
                    </td>

                    {/* Actions Menu */}
                    <td className="px-6 py-4 whitespace-nowrap text-right relative">
                      <div className="inline-block text-left" ref={isMenuOpen ? menuRef : null}>
                        <button
                          onClick={() => toggleMenu(teacher.id)}
                          className="w-8 h-8 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-200 text-gray-500 hover:text-gray-700 flex items-center justify-center transition"
                          title="Actions"
                        >
                          <Icon icon="fa-ellipsis-v" className="text-gray-500 w-3.5" />
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                          <div className="origin-top-right absolute right-6 mt-1 w-48 rounded-xl bg-white shadow-lg border border-gray-100 divide-y divide-gray-100 z-50 focus:outline-none animate-in fade-in zoom-in-95 duration-100">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  onViewDetails(teacher);
                                  setActiveMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition"
                              >
                                <Icon icon="fa-eye" className="text-gray-500 w-3.5" /> Voir le profil
                              </button>
                              <button
                                onClick={() => {
                                  onEdit(teacher);
                                  setActiveMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition"
                              >
                                <Icon icon="fa-edit" className="text-gray-500 w-3.5" /> Modifier les infos
                              </button>
                            </div>

                            <div className="py-1">
                              <button
                                onClick={() => {
                                  onAssignMain(teacher);
                                  setActiveMenuId(null);
                                }}
                                disabled={hasMainClass}
                                className={`w-full text-left px-4 py-2 text-xs flex items-center gap-2.5 transition ${
                                  hasMainClass
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : 'text-amber-700 hover:bg-amber-50'
                                }`}
                              >
                                <Icon icon="fa-crown" className={hasMainClass ? 'text-gray-300' : 'text-amber-500 w-3.5'} />
                                {hasMainClass ? 'Déjà prof. principal' : 'Assigner principal'}
                              </button>
                              <button
                                onClick={() => {
                                  onAssignSubjects(teacher);
                                  setActiveMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition"
                              >
                                <Icon icon="fa-book" className="text-gray-500 w-3.5" /> Gérer les matières
                              </button>
                              <button
                                onClick={() => {
                                  onAssignClass(teacher);
                                  setActiveMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition"
                              >
                                <Icon icon="fa-plus-circle" className="text-gray-500 w-3.5" /> Assigner une classe
                              </button>
                            </div>

                            <div className="py-1">
                              <button
                                onClick={() => {
                                  onDelete(teacher.id, fullName);
                                  setActiveMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition"
                              >
                                <Icon icon="fa-trash-alt" className="w-3.5" /> Supprimer
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}