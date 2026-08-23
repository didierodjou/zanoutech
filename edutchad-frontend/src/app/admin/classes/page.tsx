'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import Bulletin from '../students/components/Bulletin';

// --- INTERFACES ---
interface Subject {
  id: string;
  name: string;
  color?: string;
  coefficient?: number;
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
}

interface Course {
  id: string;
  subjectId: string;
  subject: { id: string; name: string; color?: string };
  teacherId: string;
  teacher: { id: string; firstName: string; lastName: string };
  coefficient: number;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  registrationNo: string;
}

interface SchoolYear {
  id: string;
  name: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

interface ClassData {
  id: string;
  name: string;
  level: string;
  schoolYearId: string;
  schoolYear?: SchoolYear;
  mainTeacher?: { id: string; firstName: string; lastName: string } | null;
  _count?: { students: number };
  students?: Student[];
  courses?: Course[];
}

export default function ClassesPage() {
  // États principaux
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<ClassData[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignTeacherModal, setShowAssignTeacherModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Modal bulletin
  const [showBulletinSelectorModal, setShowBulletinSelectorModal] = useState(false);
  const [showBulletinModal, setShowBulletinModal] = useState(false);
  const [selectedStudentForBulletin, setSelectedStudentForBulletin] = useState<Student | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<'1' | '2' | '3'>('3');
  const [bulletinData, setBulletinData] = useState<any>(null);

  // Modal ajout année scolaire
  const [showAddYearModal, setShowAddYearModal] = useState(false);
  const [newYearName, setNewYearName] = useState('');
  const [newYearStart, setNewYearStart] = useState('');
  const [newYearEnd, setNewYearEnd] = useState('');

  // Formulaires
  const [newClass, setNewClass] = useState({ name: '', level: '', schoolYearId: '' });
  const [editClass, setEditClass] = useState({ id: '', name: '', level: '', schoolYearId: '' });
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [courseForm, setCourseForm] = useState({
    subjectId: '',
    teacherId: '',
    coefficient: 2,
  });

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('');

  // Affichage accordéon par année
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Helper notification
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // --- Appels API ---
  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/classes`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setClasses(data);
      setFilteredClasses(data);
    } catch {
      showToast('error', 'Impossible de charger les classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await fetch(`${API_URL}/teachers`, {
        credentials: 'include',
      });
      if (res.ok) setTeachers(await res.json());
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await fetch(`${API_URL}/subjects`, {
        credentials: 'include',
      });
      if (res.ok) setSubjects(await res.json());
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSchoolYears = async () => {
    try {
      const res = await fetch(`${API_URL}/school-years`, {
        credentials: 'include',
      });
      if (res.ok) {
        const years = await res.json();
        setSchoolYears(years);
        // Si aucune année active, on prend la première de la liste pour le formulaire
        const activeYear = years.find((y: SchoolYear) => y.isActive);
        if (activeYear && !newClass.schoolYearId) {
          setNewClass(prev => ({ ...prev, schoolYearId: activeYear.id }));
        } else if (years.length > 0 && !newClass.schoolYearId) {
          setNewClass(prev => ({ ...prev, schoolYearId: years[0].id }));
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
    fetchSubjects();
    fetchSchoolYears();
  }, []);

  // Filtrage
  useEffect(() => {
    let filtered = [...classes];
    if (searchTerm) {
      filtered = filtered.filter(
        (cls) =>
          cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cls.level.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (levelFilter) filtered = filtered.filter((cls) => cls.level === levelFilter);
    setFilteredClasses(filtered);
  }, [searchTerm, levelFilter, classes]);

  // Grouper par année (nom de l'année scolaire)
  const classesByYear = filteredClasses.reduce<Record<string, ClassData[]>>((acc, cls) => {
    const yearName = cls.schoolYear?.name || 'Année inconnue';
    if (!acc[yearName]) acc[yearName] = [];
    acc[yearName].push(cls);
    return acc;
  }, {});

  const allYears = Object.keys(classesByYear).sort((a, b) => b.localeCompare(a));

  // Ouvrir/fermer une année
  const toggleYear = (year: string) => {
    setExpandedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  };

  // --- CRUD Classes ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.schoolYearId) {
      showToast('error', 'Veuillez sélectionner une année scolaire');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newClass.name,
          level: newClass.level,
          schoolYearId: newClass.schoolYearId,
        }),
      });
      if (res.ok) {
        showToast('success', 'Classe créée');
        setShowModal(false);
        setNewClass({ name: '', level: '', schoolYearId: schoolYears.find(y => y.isActive)?.id || '' });
        fetchClasses();
      } else {
        const err = await res.text();
        showToast('error', err);
      }
    } catch {
      showToast('error', 'Erreur réseau');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/classes/${editClass.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: editClass.name,
          level: editClass.level,
          schoolYearId: editClass.schoolYearId,
        }),
      });
      if (res.ok) {
        showToast('success', 'Classe modifiée');
        setShowEditModal(false);
        fetchClasses();
      } else {
        showToast('error', 'Erreur modification');
      }
    } catch {
      showToast('error', 'Erreur réseau');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteClass = async (classId: string, className: string) => {
    if (!confirm(`Supprimer la classe ${className} ?`)) return;
    try {
      const res = await fetch(`${API_URL}/classes/${classId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        showToast('success', 'Classe supprimée');
        fetchClasses();
      } else {
        showToast('error', data.message || 'Erreur');
      }
    } catch {
      showToast('error', 'Erreur réseau');
    }
  };

  const assignMainTeacher = async () => {
    if (!selectedClass || !selectedTeacherId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/classes/${selectedClass.id}/assign-teacher`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ teacherId: selectedTeacherId }),
      });
      if (res.ok) {
        showToast('success', 'Professeur principal assigné');
        setShowAssignTeacherModal(false);
        setSelectedTeacherId('');
        fetchClasses();
      } else {
        showToast('error', 'Erreur');
      }
    } catch {
      showToast('error', 'Erreur réseau');
    } finally {
      setActionLoading(false);
    }
  };

  const viewClassDetails = async (cls: ClassData) => {
    try {
      setActionLoading(true);
      const res = await fetch(`${API_URL}/classes/${cls.id}/details`, {
        credentials: 'include',
      });
      if (res.ok) {
        const details = await res.json();
        setSelectedClass(details);
        setShowDetailsModal(true);
      } else {
        showToast('error', 'Impossible de charger les détails');
      }
    } catch {
      showToast('error', 'Erreur réseau');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Gestion des cours ---
  const openCourseModal = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setCourseForm({
        subjectId: course.subjectId,
        teacherId: course.teacherId,
        coefficient: course.coefficient,
      });
    } else {
      setEditingCourse(null);
      setCourseForm({ subjectId: '', teacherId: '', coefficient: 2 });
    }
    setShowCourseModal(true);
  };

  const saveCourse = async () => {
    if (!selectedClass) return;
    if (!courseForm.subjectId || !courseForm.teacherId) {
      showToast('error', 'Veuillez sélectionner matière et professeur');
      return;
    }
    setActionLoading(true);
    try {
      let url, method;
      if (editingCourse) {
        url = `${API_URL}/classes/courses/${editingCourse.id}`;
        method = 'PUT';
      } else {
        url = `${API_URL}/classes/${selectedClass.id}/courses`;
        method = 'POST';
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(courseForm),
      });
      if (res.ok) {
        showToast('success', editingCourse ? 'Cours modifié' : 'Cours ajouté');
        setShowCourseModal(false);
        viewClassDetails(selectedClass);
      } else {
        const err = await res.text();
        showToast('error', err);
      }
    } catch {
      showToast('error', 'Erreur réseau');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteCourse = async (courseId: string) => {
    if (!confirm('Supprimer cette matière de la classe ?')) return;
    try {
      const res = await fetch(`${API_URL}/classes/courses/${courseId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        showToast('success', 'Matière supprimée');
        if (selectedClass) viewClassDetails(selectedClass);
      } else {
        showToast('error', 'Erreur');
      }
    } catch {
      showToast('error', 'Erreur réseau');
    }
  };

  // --- Ajout d'une année scolaire personnalisée ---
  const addSchoolYear = async () => {
    if (!newYearName || !newYearStart || !newYearEnd) {
      showToast('error', 'Tous les champs sont requis');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/school-years`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newYearName,
          startDate: newYearStart,
          endDate: newYearEnd,
        }),
      });
      if (res.ok) {
        showToast('success', 'Année scolaire ajoutée');
        setShowAddYearModal(false);
        setNewYearName('');
        setNewYearStart('');
        setNewYearEnd('');
        fetchSchoolYears();
      } else {
        const err = await res.text();
        showToast('error', err);
      }
    } catch {
      showToast('error', 'Erreur réseau');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Bulletin ---
  const openSemesterSelector = (student: Student) => {
    setSelectedStudentForBulletin(student);
    setSelectedSemester('3');
    setShowBulletinSelectorModal(true);
  };

  const generateBulletin = async () => {
    if (!selectedStudentForBulletin) return;
    try {
      setActionLoading(true);
      const res = await fetch(`${API_URL}/students/${selectedStudentForBulletin.id}/bulletin/${selectedSemester}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const fallbackRes = await fetch(
          `${API_URL}/students/${selectedStudentForBulletin.id}/report?period=TRIMESTRE_${selectedSemester}`,
          { credentials: 'include' }
        );
        if (!fallbackRes.ok) throw new Error('Erreur de chargement du bulletin');
        const data = await fallbackRes.json();
        setBulletinData(data);
      } else {
        const data = await res.json();
        setBulletinData(data);
      }
      setShowBulletinSelectorModal(false);
      setShowBulletinModal(true);
    } catch (error) {
      console.error('Erreur:', error);
      showToast('error', 'Erreur de chargement du bulletin');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const uniqueLevels = [...new Set(classes.map((c) => c.level))];

  // Rendu
  return (
    <div className="p-6 md:p-8 relative bg-gray-50 min-h-screen text-gray-900">
      {/* Toast ... identique à l'original */}

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Classes</h1>
          <p className="text-gray-700 mt-1 flex items-center gap-2">
            <Icon icon="fa-chalkboard-teacher" className="text-gray-600" />
            <span>Gérez les classes, les matières et les professeurs</span>
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-md"
        >
          <Icon icon="fa-plus" /> Nouvelle Classe
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Icon icon="fa-school" className="text-xl text-blue-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Classes</p>
              <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Icon icon="fa-user-graduate" className="text-xl text-green-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Élèves</p>
              <p className="text-2xl font-bold text-gray-900">
                {classes.reduce((acc, c) => acc + (c._count?.students || 0), 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Icon icon="fa-chalkboard" className="text-xl text-purple-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Niveaux</p>
              <p className="text-2xl font-bold text-gray-900">{uniqueLevels.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Icon icon="fa-crown" className="text-xl text-orange-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Avec principal</p>
              <p className="text-2xl font-bold text-gray-900">{classes.filter((c) => c.mainTeacher).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Rechercher une classe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
            <Icon icon="fa-search" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          </div>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-4 py-3 border rounded-lg bg-white min-w-[180px] text-gray-900"
          >
            <option value="">Tous les niveaux</option>
            {uniqueLevels.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
          {(searchTerm || levelFilter) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setLevelFilter('');
              }}
              className="px-4 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-gray-800"
            >
              <Icon icon="fa-times" /> Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Liste des classes par année */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Icon icon="fa-spinner" className="fa-spin text-4xl text-blue-600" />
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <Icon icon="fa-chalkboard-teacher" className="text-6xl text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-800 mb-2">Aucune classe</h3>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2"
          >
            <Icon icon="fa-plus" /> Créer une classe
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {allYears.map((yearName) => {
            const yearClasses = classesByYear[yearName];
            const isCurrentYear = schoolYears.find(y => y.name === yearName)?.isActive || false;
            const isExpanded = expandedYears.has(yearName);
            return (
              <div key={yearName} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <button
                  onClick={() => toggleYear(yearName)}
                  className={`w-full flex items-center justify-between px-6 py-4 text-left transition-colors ${
                    isCurrentYear
                      ? 'bg-blue-100 hover:bg-blue-200 text-gray-900'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon icon={isCurrentYear ? 'fa-calendar-check' : 'fa-archive'} className="text-lg" />
                    <div>
                      <span className="text-lg font-bold">Année scolaire {yearName}</span>
                      {isCurrentYear && (
                        <span className="ml-3 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                          Année en cours
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-sm text-gray-700">{yearClasses.length} classe{yearClasses.length !== 1 ? 's' : ''}</span>
                      <span className="mx-2 text-gray-500">·</span>
                      <span className="text-sm text-gray-700">
                        {yearClasses.reduce((acc, c) => acc + (c._count?.students || 0), 0)} élève{yearClasses.reduce((acc, c) => acc + (c._count?.students || 0), 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <Icon icon={isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} className="text-sm text-gray-700" />
                  </div>
                </button>
                {isExpanded && (
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {yearClasses.map((cls) => (
                        <div key={cls.id} className="bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition overflow-hidden">
                          <div className={`h-2 ${isCurrentYear ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-gray-400 to-gray-500'}`} />
                          <div className="p-5">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-xl font-bold text-gray-900">{cls.name}</h3>
                                <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                  <Icon icon="fa-layer-group" className="text-xs" /> Niveau {cls.level}
                                </span>
                                {!isCurrentYear && (
                                  <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs">
                                    <Icon icon="fa-archive" className="text-xs" /> Archivée
                                  </span>
                                )}
                              </div>
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700">
                                <Icon icon="fa-chalkboard-teacher" className="text-xl" />
                              </div>
                            </div>
                            <div className="space-y-3 bg-white p-4 rounded-lg border border-gray-100">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-700 flex items-center gap-2"><Icon icon="fa-users" /> Effectif</span>
                                <span className="font-bold text-gray-900">{cls._count?.students || 0} élève(s)</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-700 flex items-center gap-2"><Icon icon="fa-crown" className="text-yellow-600" /> Principal</span>
                                {cls.mainTeacher ? (
                                  <span className="font-medium text-blue-800 text-sm">{cls.mainTeacher.firstName} {cls.mainTeacher.lastName}</span>
                                ) : (
                                  <span className="text-gray-500 italic text-sm">Non assigné</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="px-5 py-3 bg-white border-t border-gray-100 flex gap-2">
                            <button onClick={() => viewClassDetails(cls)} className="flex-1 bg-blue-50 border border-blue-200 text-blue-800 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 flex items-center justify-center gap-2">
                              <Icon icon="fa-eye" /> Détails
                            </button>
                            {isCurrentYear && !cls.mainTeacher && (
                              <button onClick={() => { setSelectedClass(cls); setShowAssignTeacherModal(true); }} className="w-9 h-9 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200 hover:bg-yellow-100 flex items-center justify-center" title="Assigner prof principal">
                                <Icon icon="fa-crown" />
                              </button>
                            )}
                            {isCurrentYear && (
                              <>
                                <button onClick={() => { setEditClass({ id: cls.id, name: cls.name, level: cls.level, schoolYearId: cls.schoolYearId }); setShowEditModal(true); }} className="w-9 h-9 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 flex items-center justify-center" title="Modifier">
                                  <Icon icon="fa-edit" />
                                </button>
                                <button onClick={() => deleteClass(cls.id, cls.name)} className="w-9 h-9 bg-red-50 text-red-700 rounded-lg border border-red-200 hover:bg-red-100 flex items-center justify-center" title="Supprimer">
                                  <Icon icon="fa-trash" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL AJOUT CLASSE */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900"><Icon icon="fa-plus-circle" className="text-blue-600" /> Nouvelle Classe</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700"><Icon icon="fa-times" className="text-xl" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Nom *</label>
                <input required type="text" placeholder="ex: 6ème A" className="w-full border p-3 rounded-lg text-gray-900" value={newClass.name} onChange={(e) => setNewClass({ ...newClass, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Niveau *</label>
                <select required className="w-full border p-3 rounded-lg bg-white text-gray-900" value={newClass.level} onChange={(e) => setNewClass({ ...newClass, level: e.target.value })}>
                  <option value="">Sélectionner</option>
                  {['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Terminale'].map((l) => (<option key={l}>{l}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Année scolaire *</label>
                <div className="flex gap-2">
                  <select required className="flex-1 border p-3 rounded-lg bg-white text-gray-900" value={newClass.schoolYearId} onChange={(e) => setNewClass({ ...newClass, schoolYearId: e.target.value })}>
                    <option value="">-- Sélectionner --</option>
                    {schoolYears.map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.name} {y.isActive ? '(en cours)' : ''}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setShowAddYearModal(true)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 flex items-center gap-1">
                    <Icon icon="fa-plus" /> Année
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Annuler</button>
                <button type="submit" disabled={actionLoading} className="px-6 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
                  {actionLoading ? <Icon icon="fa-spinner" className="fa-spin" /> : <Icon icon="fa-save" />} Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ÉDITION CLASSE */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900"><Icon icon="fa-edit" className="text-blue-600" /> Modifier la classe</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700"><Icon icon="fa-times" className="text-xl" /></button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Nom *</label>
                <input required type="text" className="w-full border p-3 rounded-lg text-gray-900" value={editClass.name} onChange={(e) => setEditClass({ ...editClass, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Niveau *</label>
                <select required className="w-full border p-3 rounded-lg bg-white text-gray-900" value={editClass.level} onChange={(e) => setEditClass({ ...editClass, level: e.target.value })}>
                  {['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Terminale'].map((l) => (<option key={l}>{l}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Année scolaire *</label>
                <div className="flex gap-2">
                  <select required className="flex-1 border p-3 rounded-lg bg-white text-gray-900" value={editClass.schoolYearId} onChange={(e) => setEditClass({ ...editClass, schoolYearId: e.target.value })}>
                    {schoolYears.map((y) => (
                      <option key={y.id} value={y.id}>{y.name} {y.isActive ? '(en cours)' : ''}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setShowAddYearModal(true)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 flex items-center gap-1">
                    <Icon icon="fa-plus" /> Année
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Annuler</button>
                <button type="submit" disabled={actionLoading} className="px-6 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
                  {actionLoading ? <Icon icon="fa-spinner" className="fa-spin" /> : <Icon icon="fa-save" />} Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL AJOUT ANNÉE SCOLAIRE */}
      {showAddYearModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Icon icon="fa-calendar-plus" className="text-blue-600" /> Ajouter une année scolaire</h3>
              <button onClick={() => setShowAddYearModal(false)} className="text-gray-500 hover:text-gray-700"><Icon icon="fa-times" className="text-xl" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Nom (ex: 2025-2026) *</label>
                <input type="text" placeholder="2025-2026" value={newYearName} onChange={(e) => setNewYearName(e.target.value)} className="w-full border p-3 rounded-lg text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Date de début *</label>
                <input type="date" value={newYearStart} onChange={(e) => setNewYearStart(e.target.value)} className="w-full border p-3 rounded-lg text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Date de fin *</label>
                <input type="date" value={newYearEnd} onChange={(e) => setNewYearEnd(e.target.value)} className="w-full border p-3 rounded-lg text-gray-900" />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => setShowAddYearModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Annuler</button>
                <button onClick={addSchoolYear} disabled={actionLoading} className="px-6 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
                  {actionLoading ? <Icon icon="fa-spinner" className="fa-spin" /> : <Icon icon="fa-save" />} Ajouter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ASSIGNATION PROFESSEUR PRINCIPAL */}
      {showAssignTeacherModal && selectedClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900"><Icon icon="fa-crown" className="text-yellow-600" /> Assigner un professeur principal</h3>
              <button onClick={() => setShowAssignTeacherModal(false)} className="text-gray-500 hover:text-gray-700"><Icon icon="fa-times" className="text-xl" /></button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-800">Classe : <span className="font-semibold">{selectedClass.name}</span></p>
              <select className="w-full border p-3 rounded-lg text-gray-900 bg-white" value={selectedTeacherId} onChange={(e) => setSelectedTeacherId(e.target.value)}>
                <option value="">-- Choisir un professeur --</option>
                {teachers.map((t) => (<option key={t.id} value={t.id}>{t.lastName} {t.firstName}</option>))}
              </select>
              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => setShowAssignTeacherModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Annuler</button>
                <button onClick={assignMainTeacher} disabled={!selectedTeacherId || actionLoading} className="px-6 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50">
                  {actionLoading ? <Icon icon="fa-spinner" className="fa-spin" /> : <Icon icon="fa-check" />} Assigner
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DÉTAILS CLASSE (identique à l’original mais utilise selectedClass.schoolYear?.name) */}
      {showDetailsModal && selectedClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="bg-blue-700 p-6 rounded-t-xl flex-shrink-0">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2"><Icon icon="fa-chalkboard" /> Classe {selectedClass.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-blue-100">Niveau {selectedClass.level}</p>
                    {selectedClass.schoolYear && (
                      <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full"><Icon icon="fa-calendar" className="mr-1" /> {selectedClass.schoolYear.name}</span>
                    )}
                  </div>
                </div>
                <button onClick={() => setShowDetailsModal(false)} className="text-white hover:text-gray-200 text-xl"><Icon icon="fa-times" /></button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              {/* ... contenu exactement comme dans l'original ... */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-5 rounded-xl"><p className="text-sm font-semibold text-blue-800 uppercase flex items-center gap-2"><Icon icon="fa-users" /> Effectif Total</p><p className="text-4xl font-bold text-blue-900">{selectedClass.students?.length ?? 0}</p></div>
                <div className="bg-orange-50 p-5 rounded-xl"><p className="text-sm font-semibold text-orange-800 uppercase flex items-center gap-2"><Icon icon="fa-crown" /> Professeur Principal</p>{selectedClass.mainTeacher ? <p className="text-2xl font-bold text-orange-900">{selectedClass.mainTeacher.firstName} {selectedClass.mainTeacher.lastName}</p> : <p className="text-orange-600 italic">Non assigné</p>}</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                  <h4 className="font-bold text-gray-800 flex items-center gap-2"><Icon icon="fa-book" className="text-green-600" /> Matières et coefficients</h4>
                  <button onClick={() => openCourseModal()} className="bg-green-600 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1 hover:bg-green-700"><Icon icon="fa-plus" /> Ajouter</button>
                </div>
                {selectedClass.courses && selectedClass.courses.length > 0 ? (
                  <div className="divide-y">
                    {selectedClass.courses.map((course) => (
                      <div key={course.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                        <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="font-medium text-gray-900">{course.subject.name}</span><span className="text-sm text-gray-600">(coef {course.coefficient})</span></div>
                        <div className="flex items-center gap-4"><span className="text-sm text-gray-700 flex items-center gap-1"><Icon icon="fa-user-tie" /> {course.teacher.firstName} {course.teacher.lastName}</span><button onClick={() => openCourseModal(course)} className="text-blue-700 hover:bg-blue-50 p-1 rounded"><Icon icon="fa-edit" /></button><button onClick={() => deleteCourse(course.id)} className="text-red-700 hover:bg-red-50 p-1 rounded"><Icon icon="fa-trash" /></button></div>
                      </div>
                    ))}
                  </div>
                ) : <div className="text-center py-8 text-gray-600">Aucune matière assignée</div>}
              </div>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                  <h4 className="font-bold text-gray-800 flex items-center gap-2"><Icon icon="fa-user-graduate" className="text-blue-600" /> Liste des Élèves ({selectedClass.students?.length || 0})</h4>
                </div>
                {selectedClass.students && selectedClass.students.length > 0 ? (
                  <div className="divide-y">
                    {selectedClass.students.map((student, idx) => (
                      <div key={student.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3"><span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-bold">{idx + 1}</span><div><p className="font-medium text-gray-900">{student.lastName.toUpperCase()} {student.firstName}</p><p className="text-xs text-gray-500 font-mono">{student.registrationNo}</p></div></div>
                        <button onClick={() => openSemesterSelector(student)} className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-800 border border-purple-200 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors"><Icon icon="fa-file-alt" className="text-purple-700" /><span className="hidden sm:inline">Bulletin</span></button>
                      </div>
                    ))}
                  </div>
                ) : <div className="text-center py-8 text-gray-500"><Icon icon="fa-user-slash" className="text-4xl mb-2 text-gray-400" /><p>Aucun élève inscrit dans cette classe</p></div>}
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end flex-shrink-0"><button onClick={() => setShowDetailsModal(false)} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Fermer</button></div>
          </div>
        </div>
      )}

      {/* MODAL AJOUT/MODIFICATION MATIÈRE */}
      {showCourseModal && selectedClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900"><Icon icon="fa-book" className="text-green-600" /> {editingCourse ? 'Modifier la matière' : 'Ajouter une matière'}</h3>
              <button onClick={() => setShowCourseModal(false)} className="text-gray-500 hover:text-gray-700"><Icon icon="fa-times" className="text-xl" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-800 mb-1">Matière *</label><select className="w-full border p-3 rounded-lg bg-white text-gray-900" value={courseForm.subjectId} onChange={(e) => setCourseForm({ ...courseForm, subjectId: e.target.value })}><option value="">Choisir une matière</option>{subjects.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}</select></div>
              <div><label className="block text-sm font-medium text-gray-800 mb-1">Professeur *</label><select className="w-full border p-3 rounded-lg bg-white text-gray-900" value={courseForm.teacherId} onChange={(e) => setCourseForm({ ...courseForm, teacherId: e.target.value })}><option value="">Choisir un professeur</option>{teachers.map((t) => (<option key={t.id} value={t.id}>{t.lastName} {t.firstName}</option>))}</select></div>
              <div><label className="block text-sm font-medium text-gray-800 mb-1">Coefficient *</label><input type="number" min="1" max="5" step="1" className="w-full border p-3 rounded-lg text-gray-900" value={courseForm.coefficient} onChange={(e) => setCourseForm({ ...courseForm, coefficient: parseInt(e.target.value) })} /></div>
              <div className="flex justify-end gap-2 pt-4"><button onClick={() => setShowCourseModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Annuler</button><button onClick={saveCourse} disabled={actionLoading} className="px-6 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2">{actionLoading ? <Icon icon="fa-spinner" className="fa-spin" /> : <Icon icon="fa-save" />} Enregistrer</button></div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SÉLECTION TRIMESTRE & BULLETIN (inchangés) */}
      {showBulletinSelectorModal && selectedStudentForBulletin && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Icon icon="fa-calendar-alt" className="text-purple-600" /> Générer le bulletin</h3><button onClick={() => setShowBulletinSelectorModal(false)} className="text-gray-500 hover:text-gray-700 p-1"><Icon icon="fa-times" className="text-xl" /></button></div>
            <div className="space-y-5">
              <div className="bg-gray-50 rounded-lg p-3"><p className="text-sm text-gray-600 mb-0.5">Élève</p><p className="font-semibold text-gray-900">{selectedStudentForBulletin.lastName.toUpperCase()} {selectedStudentForBulletin.firstName}</p><p className="text-xs text-gray-500 font-mono">{selectedStudentForBulletin.registrationNo}</p></div>
              <div><label className="block text-sm font-semibold text-gray-800 mb-2">Sélectionner le trimestre</label><div className="grid grid-cols-3 gap-3">{(['1', '2', '3'] as const).map((t) => (<button key={t} onClick={() => setSelectedSemester(t)} className={`p-4 rounded-lg border-2 transition text-center ${selectedSemester === t ? 'border-purple-600 bg-purple-50 text-purple-800' : 'border-gray-200 hover:border-purple-300 text-gray-800'}`}><span className="text-2xl font-bold block">{t}</span><span className="text-xs font-medium">Trimestre {t}</span></button>))}</div></div>
              <div className="flex justify-end gap-3 pt-2"><button onClick={() => setShowBulletinSelectorModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm">Annuler</button><button onClick={generateBulletin} disabled={actionLoading} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 text-sm">{actionLoading ? <><Icon icon="fa-spinner" className="fa-spin" /> Génération...</> : <><Icon icon="fa-file-alt" /> Générer</>}</button></div>
            </div>
          </div>
        </div>
      )}

      {showBulletinModal && selectedStudentForBulletin && bulletinData && (
        <Bulletin bulletinData={bulletinData} onClose={() => { setShowBulletinModal(false); setBulletinData(null); setSelectedStudentForBulletin(null); }} onPrint={handlePrint} onDownload={() => alert('Téléchargement PDF - À implémenter')} />
      )}
    </div>
  );
}