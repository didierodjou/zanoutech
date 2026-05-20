// app/students/components/StudentTable.tsx
'use client';
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
  return sortDir === 'asc' ? <Icon icon="fa-sort-up" className="ml-1 text-blue-500" /> : <Icon icon="fa-sort-down" className="ml-1 text-blue-500" />;
}

export default function StudentTable({
  students, loading, showTable, setShowTable, sortField, sortDir, onSort,
  onViewDetails, onEdit, onDelete, onAddAbsence, onAddGrade, onAddPunishment, onPayment, onBulletin
}: StudentTableProps) {
  if (loading) return <div className="flex justify-center py-12"><Icon icon="fa-spinner" className="fa-spin text-3xl text-blue-500" /><span className="ml-2">Chargement...</span></div>;
  if (students.length === 0) return <div className="text-center py-12 bg-white rounded-xl border">Aucun élève trouvé</div>;

  const displayName = (s: Student) => `${s.lastName.toUpperCase()} ${s.firstName}`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 sm:px-6 py-3 bg-gray-50 border-b flex justify-between items-center cursor-pointer hover:bg-gray-100" onClick={() => setShowTable(!showTable)}>
        <div className="flex items-center gap-2"><Icon icon={showTable ? "fa-chevron-down" : "fa-chevron-right"} /><h2 className="font-semibold">Liste des élèves</h2><span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{students.length}</span></div>
        <Icon icon={showTable ? "fa-compress" : "fa-expand"} />
      </div>
      {showTable && (
        <div className="overflow-x-auto">
          <table className="min-w-[600px] w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 sm:px-6 py-2.5 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => onSort('name')}><span className="flex items-center">Élève <SortIcon field="name" sortField={sortField} sortDir={sortDir} /></span></th>
                <th className="px-3 sm:px-6 py-2.5 text-left hidden sm:table-cell">Sexe</th>
                <th className="px-3 sm:px-6 py-2.5 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => onSort('registrationNo')}><span className="flex items-center">Matricule <SortIcon field="registrationNo" sortField={sortField} sortDir={sortDir} /></span></th>
                <th className="px-3 sm:px-6 py-2.5 text-left hidden md:table-cell cursor-pointer" onClick={() => onSort('class')}><span className="flex items-center">Classe <SortIcon field="class" sortField={sortField} sortDir={sortDir} /></span></th>
                <th className="px-3 sm:px-6 py-2.5 text-left hidden lg:table-cell">Parent</th>
                <th className="px-3 sm:px-6 py-2.5 text-left hidden xl:table-cell">Contact</th>
                <th className="px-3 sm:px-6 py-2.5 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {students.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-3">
                    <div className="flex items-center gap-2">
                      {s.photo ? <img src={s.photo} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">{s.lastName[0]}{s.firstName[0]}</div>}
                      <div><p className="font-medium text-gray-900 text-sm">{displayName(s)}</p><p className="text-xs text-gray-500">Né(e) : {new Date(s.dateOfBirth).toLocaleDateString('fr-FR')}</p></div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 hidden sm:table-cell">{s.sex === 'M' ? <><Icon icon="fa-mars" className="text-blue-500" /> M</> : s.sex === 'F' ? <><Icon icon="fa-venus" className="text-pink-500" /> F</> : '-'}</td>
                  <td className="px-3 sm:px-6 py-3"><span className="text-xs font-mono">{s.registrationNo}</span></td>
                  <td className="px-3 sm:px-6 py-3 hidden md:table-cell">{s.class ? <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">{s.class.name}</span> : <span className="text-xs italic">Non assigné</span>}</td>
                  <td className="px-3 sm:px-6 py-3 hidden lg:table-cell">{s.parentName}</td>
                  <td className="px-3 sm:px-6 py-3 hidden xl:table-cell">{s.parentPhone}</td>
                  <td className="px-3 sm:px-6 py-3">
                    <div className="flex flex-wrap gap-1">
                      <button onClick={() => onViewDetails(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Détails"><Icon icon="fa-eye" /></button>
                      <button onClick={() => onBulletin(s)} className="p-2 text-purple-600 hover:bg-purple-50 rounded hidden sm:inline-block" title="Bulletin"><Icon icon="fa-file-alt" /></button>
                      <button onClick={() => onAddPunishment(s)} className="p-2 text-red-600 hover:bg-red-50 rounded hidden sm:inline-block" title="Punition"><Icon icon="fa-gavel" /></button>
                      <button onClick={() => onAddAbsence(s)} className="p-2 text-orange-600 hover:bg-orange-50 rounded" title="Absence"><Icon icon="fa-clock" /></button>
                      <button onClick={() => onAddGrade(s)} className="p-2 text-green-600 hover:bg-green-50 rounded" title="Notes"><Icon icon="fa-star" /></button>
                      <button onClick={() => onPayment(s)} className="p-2 text-yellow-600 hover:bg-yellow-50 rounded" title="Paiement"><Icon icon="fa-money-bill-wave" /></button>
                      <button onClick={() => onEdit(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Icon icon="fa-edit" /></button>
                      <button onClick={() => onDelete(s.id, displayName(s))} className="p-2 text-red-600 hover:bg-red-50 rounded"><Icon icon="fa-trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}