'use client';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/components/ui/Icon';
import { Student } from '../types';

interface StudentTableProps {
  students: Student[];
  loading: boolean;
  showTable: boolean;
  setShowTable: (show: boolean) => void;
  sortField: 'name' | 'registrationNo' | 'class';
  sortDir: 'asc' | 'desc';
  onSort: (field: 'name' | 'registrationNo' | 'class') => void;
  onViewDetails: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete: (id: string, name: string) => void;
  onAddAbsence: (student: Student) => void;
  onAddGrade: (student: Student) => void;
  onAddPunishment: (student: Student) => void;
  onPayment: (student: Student) => void;
  onBulletin: (student: Student) => void;
}

function SortIcon({ field, sortField, sortDir }: { field: string; sortField: string; sortDir: string }) {
  if (sortField !== field) return <Icon icon="fa-sort" className="ml-1 text-gray-300 text-xs" />;
  return sortDir === 'asc' ? <Icon icon="fa-sort-up" className="ml-1 text-blue-600" /> : <Icon icon="fa-sort-down" className="ml-1 text-blue-600" />;
}

// Menu contextuel d'actions par élève
function ActionMenu({ student, displayName, onViewDetails, onEdit, onDelete, onAddAbsence, onAddGrade, onAddPunishment, onPayment, onBulletin }: {
  student: Student;
  displayName: string;
  onViewDetails: (s: Student) => void;
  onEdit: (s: Student) => void;
  onDelete: (id: string, name: string) => void;
  onAddAbsence: (s: Student) => void;
  onAddGrade: (s: Student) => void;
  onAddPunishment: (s: Student) => void;
  onPayment: (s: Student) => void;
  onBulletin: (s: Student) => void;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; openUp: boolean } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const MENU_WIDTH = 192; // w-48
  const MENU_HEIGHT_ESTIMATE = 340; // hauteur approx du menu complet

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
          className="rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-[9999] py-1 divide-y divide-gray-100 focus:outline-none"
        >
          <div className="py-1">
            <button onClick={() => { onViewDetails(student); setOpen(false); }} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <Icon icon="fa-eye" className="text-gray-400 w-4" /> Voir profil
            </button>
            <button onClick={() => { onEdit(student); setOpen(false); }} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <Icon icon="fa-edit" className="text-gray-400 w-4" /> Modifier
            </button>
          </div>
          <div className="py-1">
            <button onClick={() => { onAddGrade(student); setOpen(false); }} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <Icon icon="fa-star" className="text-gray-400 w-4" /> Ajouter note
            </button>
            <button onClick={() => { onAddAbsence(student); setOpen(false); }} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <Icon icon="fa-clock" className="text-gray-400 w-4" /> Signaler absence
            </button>
            <button onClick={() => { onPayment(student); setOpen(false); }} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <Icon icon="fa-money-bill-wave" className="text-gray-400 w-4" /> Règlement
            </button>
            <button onClick={() => { onBulletin(student); setOpen(false); }} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <Icon icon="fa-file-alt" className="text-gray-400 w-4" /> Bulletin
            </button>
            <button onClick={() => { onAddPunishment(student); setOpen(false); }} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <Icon icon="fa-gavel" className="text-gray-400 w-4" /> Discipline
            </button>
          </div>
          <div className="py-1">
            <button onClick={() => { onDelete(student.id, displayName); setOpen(false); }} className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2">
              <Icon icon="fa-trash" className="text-red-500 w-4" /> Supprimer
            </button>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div className="relative inline-block text-left">
      <button
        ref={buttonRef}
        onClick={toggleOpen}
        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none"
        title="Actions"
      >
        <Icon icon="fa-ellipsis-v" />
      </button>
      {menu}
    </div>
  );
}

export default function StudentTable({
  students, loading, showTable, setShowTable, sortField, sortDir, onSort,
  onViewDetails, onEdit, onDelete, onAddAbsence, onAddGrade, onAddPunishment, onPayment, onBulletin
}: StudentTableProps) {
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  if (loading) return <div className="flex justify-center items-center py-12"><Icon icon="fa-spinner" className="fa-spin text-2xl text-blue-600" /><span className="ml-2 text-sm text-gray-600">Chargement...</span></div>;
  if (students.length === 0) return <div className="text-center py-12 bg-white rounded-xl border text-gray-500 text-sm">Aucun élève trouvé</div>;

  const displayName = (s: Student) => `${s.lastName.toUpperCase()} ${s.firstName}`;

  const handleImageError = (id: string) => {
    setImgErrors(prev => ({ ...prev, [id]: true }));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 sm:px-6 py-3.5 bg-gray-50 border-b flex justify-between items-center cursor-pointer hover:bg-gray-100/80 transition-colors" onClick={() => setShowTable(!showTable)}>
        <div className="flex items-center gap-2">
          <Icon icon={showTable ? "fa-chevron-down" : "fa-chevron-right"} className="text-gray-400 text-xs" />
          <h2 className="font-semibold text-gray-800 text-sm">Liste des élèves</h2>
          <span className="text-xs bg-blue-100 text-blue-700 font-medium px-2 py-0.5 rounded-full">{students.length}</span>
        </div>
        <Icon icon={showTable ? "fa-compress" : "fa-expand"} className="text-gray-400 text-xs" />
      </div>

      {showTable && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => onSort('name')}>
                  <span className="flex items-center">Élève <SortIcon field="name" sortField={sortField} sortDir={sortDir} /></span>
                </th>
                <th className="px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Sexe</th>
                <th className="px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => onSort('registrationNo')}>
                  <span className="flex items-center">Matricule <SortIcon field="registrationNo" sortField={sortField} sortDir={sortDir} /></span>
                </th>
                <th className="px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell cursor-pointer" onClick={() => onSort('class')}>
                  <span className="flex items-center">Classe <SortIcon field="class" sortField={sortField} sortDir={sortDir} /></span>
                </th>
                <th className="px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Parent</th>
                <th className="px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell">Contact</th>
                <th className="px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {students.map(s => {
                const name = displayName(s);
                const hasPhoto = s.photo && !imgErrors[s.id];

                return (
                  <tr key={s.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {hasPhoto ? (
                          <img
                            src={s.photo as any}
                            alt={name}
                            onError={() => handleImageError(s.id)}
                            className="w-8 h-8 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold border border-blue-200">
                            {s.lastName?.[0]}{s.firstName?.[0]}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{name}</p>
                          <p className="text-xs text-gray-400">Né(e) : {new Date(s.dateOfBirth).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-xs text-gray-600 hidden sm:table-cell">
                      {s.sex === 'M' ? 'M' : s.sex === 'F' ? 'F' : '-'}
                    </td>
                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                      <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{s.registrationNo}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap hidden md:table-cell">
                      {s.class ? (
                        <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">{s.class.name}</span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Non assigné</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-xs text-gray-700 hidden lg:table-cell">{s.parentName || '-'}</td>
                    <td className="px-4 sm:px-6 py-3 text-xs text-gray-600 font-mono hidden xl:table-cell">{s.parentPhone || '-'}</td>
                    <td className="px-4 sm:px-6 py-3 text-right whitespace-nowrap">
                      <ActionMenu
                        student={s}
                        displayName={name}
                        onViewDetails={onViewDetails}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onAddAbsence={onAddAbsence}
                        onAddGrade={onAddGrade}
                        onAddPunishment={onAddPunishment}
                        onPayment={onPayment}
                        onBulletin={onBulletin}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}