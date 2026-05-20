// app/teachers/components/TeacherFilters.tsx
import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { Teacher } from '../types';

interface TeacherFiltersProps {
  teachers: Teacher[];
  onFilter: (filtered: Teacher[]) => void;
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;
}

export default function TeacherFilters({ teachers, onFilter, viewMode, onViewModeChange }: TeacherFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const uniqueSpecialties = [...new Set(teachers.map(t => t.specialty).filter(Boolean))];

  const applyFilters = (search: string, specialty: string, status: string) => {
    let filtered = [...teachers];
    if (search) {
      filtered = filtered.filter(t =>
        t.firstName.toLowerCase().includes(search.toLowerCase()) ||
        t.lastName.toLowerCase().includes(search.toLowerCase()) ||
        t.specialty?.toLowerCase().includes(search.toLowerCase()) ||
        t.phone?.includes(search) ||
        t.user?.email?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (specialty) filtered = filtered.filter(t => t.specialty === specialty);
    if (status === 'principal') filtered = filtered.filter(t => t.mainClass);
    if (status === 'non-principal') filtered = filtered.filter(t => !t.mainClass);
    onFilter(filtered);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    applyFilters(val, specialtyFilter, statusFilter);
  };

  const handleSpecialtyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSpecialtyFilter(val);
    applyFilters(searchTerm, val, statusFilter);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setStatusFilter(val);
    applyFilters(searchTerm, specialtyFilter, val);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSpecialtyFilter('');
    setStatusFilter('all');
    onFilter(teachers);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-1 w-full md:w-auto relative">
          <input
            type="text"
            placeholder="Rechercher un professeur..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
          />
          <Icon icon="fa-search" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <select value={specialtyFilter} onChange={handleSpecialtyChange} className="px-4 py-3 border rounded-lg bg-white">
            <option value="">Toutes spécialités</option>
            {uniqueSpecialties.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={statusFilter} onChange={handleStatusChange} className="px-4 py-3 border rounded-lg bg-white">
            <option value="all">Tous les profs</option>
            <option value="principal">Professeurs Principaux</option>
            <option value="non-principal">Non principaux</option>
          </select>
          <button onClick={resetFilters} className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2">
            <Icon icon="fa-times" /> Réinitialiser
          </button>
          <div className="flex border rounded-lg overflow-hidden">
            <button onClick={() => onViewModeChange('grid')} className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
              <Icon icon="fa-th" />
            </button>
            <button onClick={() => onViewModeChange('table')} className={`px-3 py-2 ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
              <Icon icon="fa-list" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}