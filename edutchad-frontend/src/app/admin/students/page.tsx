'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { studentApi, fetchClasses, fetchSubjects } from './services/studentApi';
import { Student, Class, Subject } from './types';
import StudentTable from './components/StudentTable';
import AddStudentModal from './components/AddStudentModal';
import EditStudentModal from './components/EditStudentModal';
import DetailsModal from './components/DetailsModal';
import PaymentModal from './components/PaymentModal';
import ConduiteGlobalModal from './components/ConduiteGlobalModal';
import PunishmentModal from './components/PunishmentModal';
import AbsenceModal from './components/AbsenceModal';
import GradeModal from './components/GradeModal';
import SemesterSelectorModal from './components/SemesterSelectorModal';
import BulletinModal from './components/BulletinModal';
import DeletedStudentsModal from './components/DeletedStudentsModal';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [activeClasses, setActiveClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [showTable, setShowTable] = useState(true);
  const [mobileSubmenuOpen, setMobileSubmenuOpen] = useState(false);

  // Modal state
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<'1' | '2' | '3'>('3');
  const [bulletinData, setBulletinData] = useState<any>(null);

  // Sorting
  type SortField = 'name' | 'registrationNo' | 'class';
  type SortDir = 'asc' | 'desc';
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsData, classesData, subjectsData] = await Promise.all([
        studentApi.getAll(),
        fetchClasses(),
        fetchSubjects(),
      ]);
      setStudents(studentsData);
      setClasses(classesData);
      const active = classesData.filter((cls: Class) => cls.schoolYear?.isActive === true);
      setActiveClasses(active);
      setSubjects(subjectsData);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtering + Sorting
  useEffect(() => {
    let filtered = [...students];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.firstName.toLowerCase().includes(term) ||
        s.lastName.toLowerCase().includes(term) ||
        s.registrationNo.toLowerCase().includes(term) ||
        s.parentName?.toLowerCase().includes(term) ||
        s.user?.email?.toLowerCase().includes(term)
      );
    }
    if (classFilter) {
      filtered = filtered.filter(s => s.class?.id === classFilter);
    }
    filtered.sort((a, b) => {
      let valA = '', valB = '';
      if (sortField === 'name') {
        valA = `${a.lastName} ${a.firstName}`.toLowerCase();
        valB = `${b.lastName} ${b.firstName}`.toLowerCase();
      } else if (sortField === 'registrationNo') {
        valA = a.registrationNo.toLowerCase();
        valB = b.registrationNo.toLowerCase();
      } else if (sortField === 'class') {
        valA = (a.class?.name || '').toLowerCase();
        valB = (b.class?.name || '').toLowerCase();
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    setFilteredStudents(filtered);
  }, [searchTerm, classFilter, students, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const openModal = (modalName: string) => setActiveModal(modalName);
  const closeModal = () => {
    setActiveModal(null);
    setSelectedStudent(null);
    setSuccessMessage(null);
    setError(null);
    setBulletinData(null);
  };

  const handleStudentCreated = () => {
    showSuccess('Élève créé avec succès');
    fetchData();
  };

  const handleStudentUpdated = () => {
    showSuccess('Informations mises à jour');
    fetchData();
  };

  const handleStudentDeleted = async (id: string, name: string) => {
    if (confirm(`Supprimer l'élève ${name} ?`)) {
      try {
        await studentApi.softDelete(id);
        showSuccess('Élève déplacé vers la corbeille');
        fetchData();
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const handlePaymentRecorded = () => {
    showSuccess('Paiement enregistré');
    fetchData();
    if (selectedStudent) viewStudentDetails(selectedStudent);
  };

  const viewStudentDetails = async (student: Student) => {
    try {
      const details = await studentApi.getDetails(student.id);
      setSelectedStudent(details);
      openModal('details');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const generateBulletin = async () => {
    if (!selectedStudent) return;
    try {
      const data = await studentApi.getBulletin(selectedStudent.id, parseInt(selectedSemester));
      setBulletinData(data);
      openModal('bulletin');
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Calcul de la moyenne globale formatée
  const calculateAverage = () => {
    if (!students.length) return '0.00';
    const total = students.reduce((acc, s) => acc + (s.averages?.annuelle || 0), 0);
    return (total / students.length).toFixed(2);
  };

  return (
    <div className="space-y-6">
      {/* En-tête principal */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Gestion des Élèves</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            <Icon icon="fa-user-graduate" className="text-gray-400" />
            <span>{filteredStudents.length} élève{filteredStudents.length > 1 ? 's' : ''} répertorié{filteredStudents.length > 1 ? 's' : ''}</span>
          </p>
        </div>

        {/* Action principal et sous-actions */}
        <div className="w-full sm:w-auto flex items-center gap-2">
          {/* Menu mobile */}
          <div className="sm:hidden w-full">
            <button
              onClick={() => setMobileSubmenuOpen(v => !v)}
              className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg flex items-center justify-between font-medium shadow-sm"
            >
              <span className="flex items-center gap-2"><Icon icon="fa-user-plus" /> Action rapide</span>
              <Icon icon={mobileSubmenuOpen ? "fa-chevron-up" : "fa-chevron-down"} />
            </button>
            {mobileSubmenuOpen && (
              <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden divide-y divide-gray-100">
                <button onClick={() => { openModal('add'); setMobileSubmenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
                  <Icon icon="fa-user-plus" className="text-blue-600" /> Nouvel Élève
                </button>
                <button onClick={() => { openModal('conduiteGlobal'); setMobileSubmenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
                  <Icon icon="fa-star" className="text-amber-500" /> Noter Conduite
                </button>
                <button onClick={() => { openModal('deleted'); setMobileSubmenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
                  <Icon icon="fa-trash-alt" className="text-gray-500" /> Élèves supprimés
                </button>
              </div>
            )}
          </div>

          {/* Desktop header buttons */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => openModal('add')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm shadow-sm transition-colors"
            >
              <Icon icon="fa-user-plus" /> Nouvel Élève
            </button>
            <button
              onClick={() => openModal('conduiteGlobal')}
              className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-4 py-2.5 rounded-lg border border-gray-300 flex items-center gap-2 text-sm shadow-sm transition-colors"
            >
              <Icon icon="fa-star" className="text-amber-500" /> Noter Conduite
            </button>
            <button
              onClick={() => openModal('deleted')}
              className="bg-white hover:bg-gray-50 text-gray-700 font-medium p-2.5 rounded-lg border border-gray-300 flex items-center justify-center text-sm shadow-sm transition-colors"
              title="Élèves supprimés"
            >
              <Icon icon="fa-trash-alt" className="text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-3">
          <Icon icon="fa-check-circle" className="text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Icon icon="fa-exclamation-circle" className="text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-xs text-rose-600 hover:underline font-medium">Fermer</button>
        </div>
      )}

      {/* Cartes KPI (Statistiques rapides) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-blue-600">
            <Icon icon="fa-user-graduate" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Total Élèves</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{students.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
            <Icon icon="fa-school" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Classes actives</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{activeClasses.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-purple-50 border border-purple-100 rounded-lg flex items-center justify-center text-purple-600">
            <Icon icon="fa-chart-line" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Moy. générale</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{calculateAverage()} <span className="text-xs font-normal text-gray-400">/ 20</span></p>
          </div>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Rechercher par nom, matricule, parent..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 focus:bg-white border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-gray-900 text-sm transition-all outline-none"
            />
            <Icon icon="fa-search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={classFilter}
              onChange={e => setClassFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white text-gray-700 text-sm outline-none cursor-pointer"
            >
              <option value="">Toutes les classes actives</option>
              {activeClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            {(searchTerm || classFilter) && (
              <button
                onClick={() => { setSearchTerm(''); setClassFilter(''); }}
                className="px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Icon icon="fa-times" />
                <span className="hidden sm:inline">Réinitialiser</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tableau des élèves */}
      <StudentTable
        students={filteredStudents}
        loading={loading}
        showTable={showTable}
        setShowTable={setShowTable}
        sortField={sortField}
        sortDir={sortDir}
        onSort={handleSort}
        onViewDetails={viewStudentDetails}
        onEdit={(student) => { setSelectedStudent(student); openModal('edit'); }}
        onDelete={handleStudentDeleted}
        onAddAbsence={(student) => { setSelectedStudent(student); openModal('absence'); }}
        onAddGrade={(student) => { setSelectedStudent(student); openModal('grade'); }}
        onAddPunishment={(student) => { setSelectedStudent(student); openModal('punishment'); }}
        onPayment={(student) => { setSelectedStudent(student); openModal('payment'); }}
        onBulletin={(student) => { setSelectedStudent(student); openModal('semesterSelector'); }}
      />

      {/* Modales */}
      {activeModal === 'add' && <AddStudentModal classes={activeClasses} onClose={closeModal} onSuccess={handleStudentCreated} />}
      {activeModal === 'edit' && selectedStudent && <EditStudentModal student={selectedStudent} classes={activeClasses} onClose={closeModal} onSuccess={handleStudentUpdated} />}
      {activeModal === 'details' && selectedStudent && <DetailsModal student={selectedStudent} onClose={closeModal} onEdit={() => { closeModal(); setSelectedStudent(selectedStudent); openModal('edit'); }} onAddAbsence={() => { closeModal(); setSelectedStudent(selectedStudent); openModal('absence'); }} onAddGrade={() => { closeModal(); setSelectedStudent(selectedStudent); openModal('grade'); }} onAddPunishment={() => { closeModal(); setSelectedStudent(selectedStudent); openModal('punishment'); }} onPayment={() => { closeModal(); setSelectedStudent(selectedStudent); openModal('payment'); }} />}
      {activeModal === 'payment' && selectedStudent && <PaymentModal student={selectedStudent} onClose={closeModal} onSuccess={handlePaymentRecorded} />}
      {activeModal === 'conduiteGlobal' && <ConduiteGlobalModal classes={activeClasses} onClose={closeModal} onSuccess={() => { showSuccess('Conduite appliquée'); fetchData(); }} />}
      {activeModal === 'punishment' && selectedStudent && <PunishmentModal student={selectedStudent} defaultTrimester={parseInt(selectedSemester)} onClose={closeModal} onSuccess={() => { showSuccess('Punition ajoutée'); fetchData(); }} />}
      {activeModal === 'absence' && selectedStudent && <AbsenceModal student={selectedStudent} onClose={closeModal} onSuccess={() => { showSuccess('Absence enregistrée'); fetchData(); if (selectedStudent) viewStudentDetails(selectedStudent); }} />}
      {activeModal === 'grade' && selectedStudent && <GradeModal student={selectedStudent} subjects={subjects} onClose={closeModal} onSuccess={() => { showSuccess('Notes enregistrées'); fetchData(); if (selectedStudent) viewStudentDetails(selectedStudent); }} />}
      {activeModal === 'semesterSelector' && selectedStudent && <SemesterSelectorModal student={selectedStudent} selectedSemester={selectedSemester} setSelectedSemester={setSelectedSemester} onGenerate={generateBulletin} onClose={closeModal} loading={false} />}
      {activeModal === 'bulletin' && selectedStudent && bulletinData && <BulletinModal bulletinData={bulletinData} student={selectedStudent} onClose={closeModal} />}
      {activeModal === 'deleted' && <DeletedStudentsModal onClose={closeModal} onRestore={() => { fetchData(); closeModal(); }} />}
    </div>
  );
}