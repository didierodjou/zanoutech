// app/teachers/components/TeacherTable.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

// Menu contextuel d'actions par professeur, rendu en portal (fixed) pour ne pas
// être clippé par les conteneurs overflow-x-auto / overflow-hidden du tableau.
function ActionMenu({
  teacher,
  fullName,
  hasMainClass,
  onViewDetails,
  onEdit,
  onAssignMain,
  onAssignSubjects,
  onAssignClass,
  onDelete,
}: {
  teacher: Teacher;
  fullName: string;
  hasMainClass: boolean;
  onViewDetails: (teacher: Teacher) => void;
  onEdit: (teacher: Teacher) => void;
  onAssignMain: (teacher: Teacher) => void;
  onAssignSubjects: (teacher: Teacher) => void;
  onAssignClass: (teacher: Teacher) => void;
  onDelete: (id: string, name: string) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; openUp: boolean } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const MENU_WIDTH = 192; // w-48
  const MENU_HEIGHT_ESTIMATE = 300;

  const computeCoords = () => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < MENU_HEIGHT_ESTIMATE && rect.top > spaceBelow;
    setCoords({
      top: openUp ? rect.top : rect.bottom,
      left: Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8),
      openUp,
    });
  };

  const toggleOpen = () => {
    if (!open) computeCoords();
    setOpen(o => !o);
  };

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current && !menuRef.current.contains(target) &&
        buttonRef.current && !buttonRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    const handleReposition = () => computeCoords();

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [open]);

  const menu = open && coords && typeof document !== 'undefined'
    ? createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: coords.openUp ? undefined : coords.top + 4,
            bottom: coords.openUp ? window.innerHeight - coords.top + 4 : undefined,
            left: Math.max(8, coords.left),
            width: MENU_WIDTH,
          }}
          className="rounded-xl bg-white shadow-lg border border-gray-100 divide-y divide-gray-100 z-[9999] focus:outline-none animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="py-1">
            <button
              onClick={() => { onViewDetails(teacher); setOpen(false); }}
              className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition"
            >
              <Icon icon="fa-eye" className="text-gray-500 w-3.5" /> Voir le profil
            </button>
            <button
              onClick={() => { onEdit(teacher); setOpen(false); }}
              className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition"
            >
              <Icon icon="fa-edit" className="text-gray-500 w-3.5" /> Modifier les infos
            </button>
          </div>

          <div className="py-1">
            <button
              onClick={() => { onAssignMain(teacher); setOpen(false); }}
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
              onClick={() => { onAssignSubjects(teacher); setOpen(false); }}
              className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition"
            >
              <Icon icon="fa-book" className="text-gray-500 w-3.5" /> Gérer les matières
            </button>
            <button
              onClick={() => { onAssignClass(teacher); setOpen(false); }}
              className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition"
            >
              <Icon icon="fa-plus-circle" className="text-gray-500 w-3.5" /> Assigner une classe
            </button>
          </div>

          <div className="py-1">
            <button
              onClick={() => { onDelete(teacher.id, fullName); setOpen(false); }}
              className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition"
            >
              <Icon icon="fa-trash-alt" className="w-3.5" /> Supprimer
            </button>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div className="inline-block text-left">
      <button
        ref={buttonRef}
        onClick={toggleOpen}
        className="w-8 h-8 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-200 text-gray-500 hover:text-gray-700 flex items-center justify-center transition"
        title="Actions"
      >
        <Icon icon="fa-ellipsis-v" className="text-gray-500 w-3.5" />
      </button>
      {menu}
    </div>
  );
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
                      <ActionMenu
                        teacher={teacher}
                        fullName={fullName}
                        hasMainClass={hasMainClass}
                        onViewDetails={onViewDetails}
                        onEdit={onEdit}
                        onAssignMain={onAssignMain}
                        onAssignSubjects={onAssignSubjects}
                        onAssignClass={onAssignClass}
                        onDelete={onDelete}
                      />
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