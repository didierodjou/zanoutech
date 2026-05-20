// app/students/page.tsx
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
import DeletedStudentsModal from './components/DeletedStudentsModal'; // ✅ nouveau

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
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
        studentApi.getAll(), // n'inclut pas les supprimés
        fetchClasses(),
        fetchSubjects(),
      ]);
      setStudents(studentsData);
      setFilteredStudents(studentsData);
      setClasses(classesData);
      setSubjects(subjectsData);
    } catch (err: any) {
      setError(err.message || 'Erreur chargement données');
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
      filtered = filtered.filter(s =>
        s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.registrationNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
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
    showSuccess('✅ Élève créé avec succès');
    fetchData();
  };

  const handleStudentUpdated = () => {
    showSuccess('✅ Élève modifié');
    fetchData();
  };

  const handleStudentDeleted = async (id: string, name: string) => {
    if (confirm(`Supprimer ${name} ?`)) {
      try {
        await studentApi.softDelete(id);
        showSuccess('✅ Élève supprimé (soft delete)');
        fetchData();
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const handlePaymentRecorded = () => {
    showSuccess('✅ Paiement enregistré');
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

  return (
    <div className="bg-gray-50 min-h-screen -m-4 md:-m-8 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Gestion des Élèves</h1>
          <p className="text-sm text-gray-700 mt-1">
            <Icon icon="fa-user-graduate" className="mr-2 text-gray-700" />
            {filteredStudents.length} élève{filteredStudents.length > 1 ? 's' : ''}
          </p>
        </div>
        {/* Mobile menu */}
        <div className="w-full sm:w-auto">
          <div className="sm:hidden">
            <button onClick={() => setMobileSubmenuOpen(v => !v)} className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg flex items-center justify-between gap-2 shadow-md">
              <span className="flex items-center gap-2"><Icon icon="fa-user-graduate" /> Élèves</span>
              <Icon icon={mobileSubmenuOpen ? "fa-chevron-up" : "fa-chevron-down"} />
            </button>
            {mobileSubmenuOpen && (
              <div className="mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                <button onClick={() => { openModal('add'); setMobileSubmenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-gray-800 hover:bg-blue-50 border-b"> <Icon icon="fa-user-plus" className="text-blue-500" /> Nouvel Élève </button>
                <button onClick={() => { setShowTable(true); setMobileSubmenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-gray-800 hover:bg-blue-50 border-b"> <Icon icon="fa-list" className="text-green-500" /> Liste des élèves </button>
                <button onClick={() => { openModal('conduiteGlobal'); setMobileSubmenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-gray-800 hover:bg-orange-50 border-b"> <Icon icon="fa-star" className="text-orange-500" /> Noter Conduite </button>
                <button onClick={() => { openModal('deleted'); setMobileSubmenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-gray-800 hover:bg-red-50"> <Icon icon="fa-trash-restore" className="text-red-500" /> Élèves supprimés </button>
              </div>
            )}
          </div>
          <div className="hidden sm:flex gap-2">
            <button onClick={() => openModal('conduiteGlobal')} className="bg-orange-600 text-white px-4 py-2.5 rounded-lg hover:bg-orange-700 flex items-center gap-2 shadow-md"> <Icon icon="fa-star" /> Noter Conduite </button>
            <button onClick={() => openModal('add')} className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-md"> <Icon icon="fa-user-plus" /> Nouvel Élève </button>
            <button onClick={() => openModal('deleted')} className="bg-gray-600 text-white px-4 py-2.5 rounded-lg hover:bg-gray-700 flex items-center gap-2 shadow-md"> <Icon icon="fa-trash-restore" /> Élèves supprimés </button>
          </div>
        </div>
      </div>

      {successMessage && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 flex items-center gap-3"><Icon icon="fa-check-circle" />{successMessage}</div>}
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-center gap-3"><Icon icon="fa-exclamation-triangle" />{error}<button onClick={() => setError(null)} className="ml-auto underline">Fermer</button></div>}

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-5 sm:mb-8">
        <div className="bg-white p-3 rounded-xl shadow-sm border"><div className="flex items-center gap-2"><div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600"><Icon icon="fa-user-graduate" /></div><div><p className="text-xs text-gray-600">Total Élèves</p><p className="text-lg font-bold text-gray-900">{students.length}</p></div></div></div>
        <div className="bg-white p-3 rounded-xl shadow-sm border"><div className="flex items-center gap-2"><div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center text-green-600"><Icon icon="fa-school" /></div><div><p className="text-xs text-gray-600">Classes</p><p className="text-lg font-bold text-gray-900">{classes.length}</p></div></div></div>
        <div className="bg-white p-3 rounded-xl shadow-sm border"><div className="flex items-center gap-2"><div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600"><Icon icon="fa-chart-line" /></div><div><p className="text-xs text-gray-600">Moy. générale</p><p className="text-lg font-bold text-gray-900">{students.length ? (students.reduce((a,s)=> a + (s.averages?.annuelle || 0),0)/students.length).toFixed(3) : '0.00'}/20</p></div></div></div>
      </div>

      {/* Search & filters */}
      <div className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border mb-5">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex-1 relative">
            <input type="text" placeholder="Rechercher un élève..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm" />
            <Icon icon="fa-search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          </div>
          <div className="flex gap-2">
            <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="flex-1 sm:flex-none px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm">
              <option value="">Toutes les classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {(searchTerm || classFilter) && <button onClick={() => { setSearchTerm(''); setClassFilter(''); }} className="px-3 py-2.5 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 flex items-center gap-1 text-sm"><Icon icon="fa-times" /><span className="hidden sm:inline">Réinitialiser</span></button>}
          </div>
        </div>
      </div>

      {/* Student table */}
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

      {/* Modals */}
      {activeModal === 'add' && <AddStudentModal classes={classes} onClose={closeModal} onSuccess={handleStudentCreated} />}
      {activeModal === 'edit' && selectedStudent && <EditStudentModal student={selectedStudent} classes={classes} onClose={closeModal} onSuccess={handleStudentUpdated} />}
      {activeModal === 'details' && selectedStudent && <DetailsModal student={selectedStudent} onClose={closeModal} onEdit={() => { closeModal(); setSelectedStudent(selectedStudent); openModal('edit'); }} onAddAbsence={() => { closeModal(); setSelectedStudent(selectedStudent); openModal('absence'); }} onAddGrade={() => { closeModal(); setSelectedStudent(selectedStudent); openModal('grade'); }} onAddPunishment={() => { closeModal(); setSelectedStudent(selectedStudent); openModal('punishment'); }} onPayment={() => { closeModal(); setSelectedStudent(selectedStudent); openModal('payment'); }} />}
      {activeModal === 'payment' && selectedStudent && <PaymentModal student={selectedStudent} onClose={closeModal} onSuccess={handlePaymentRecorded} />}
      {activeModal === 'conduiteGlobal' && <ConduiteGlobalModal classes={classes} onClose={closeModal} onSuccess={() => { showSuccess('Conduite appliquée'); fetchData(); }} />}
      {activeModal === 'punishment' && selectedStudent && <PunishmentModal student={selectedStudent} defaultTrimester={parseInt(selectedSemester)} onClose={closeModal} onSuccess={() => { showSuccess('Punition ajoutée'); fetchData(); }} />}
      {activeModal === 'absence' && selectedStudent && <AbsenceModal student={selectedStudent} onClose={closeModal} onSuccess={() => { showSuccess('Absence enregistrée'); fetchData(); if (selectedStudent) viewStudentDetails(selectedStudent); }} />}
      {activeModal === 'grade' && selectedStudent && <GradeModal student={selectedStudent} subjects={subjects} onClose={closeModal} onSuccess={() => { showSuccess('Notes enregistrées'); fetchData(); if (selectedStudent) viewStudentDetails(selectedStudent); }} />}
      {activeModal === 'semesterSelector' && selectedStudent && <SemesterSelectorModal student={selectedStudent} selectedSemester={selectedSemester} setSelectedSemester={setSelectedSemester} onGenerate={generateBulletin} onClose={closeModal} loading={false} />}
      {activeModal === 'bulletin' && selectedStudent && bulletinData && <BulletinModal bulletinData={bulletinData} student={selectedStudent} onClose={closeModal} />}
      {activeModal === 'deleted' && <DeletedStudentsModal onClose={closeModal} onRestore={() => { fetchData(); closeModal(); }} />}
    </div>
  );
}