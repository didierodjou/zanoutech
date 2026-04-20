'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/Icon';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  registrationNo: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string | null;
  class?: {
    id: string;
    name: string;
    level: string;
  } | null;
  user?: {
    email: string;
    isActive: boolean;
    createdAt?: string;
  };
  grades?: Grade[];
  absences?: Absence[];
  bulletins?: Bulletin[];
  _count?: {
    grades: number;
    absences: number;
    bulletins: number;
  };
}

interface Grade {
  id: string;
  value: number;
  type: string;
  subject: {
    id: string;
    name: string;
  };
}

interface Absence {
  id: string;
  date: string;
  type: string;
  isJustified: boolean;
  reason?: string;
}

interface Bulletin {
  id: string;
  period: string;
  generalAverage: number;
  status: string;
}

interface Class {
  id: string;
  name: string;
  level: string;
  _count?: {
    students: number;
  };
}

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  
  // États pour les modals
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // États pour la recherche et les filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');

  // État pour le tableau réduisible
  const [showTable, setShowTable] = useState(true);
  
  // État pour la grille des cartes réduisible
  const [showCards, setShowCards] = useState(true);

  // Formulaire nouvel élève
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    registrationNo: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    classId: '',
    email: ''
  });

  // Formulaire modification
  const [editStudent, setEditStudent] = useState({
    id: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    registrationNo: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    classId: '',
    email: ''
  });

  // Formulaire absence
  const [absenceData, setAbsenceData] = useState({
    studentId: '',
    date: new Date().toISOString().split('T')[0],
    type: 'ABSENCE',
    isJustified: false,
    reason: ''
  });

  // Formulaire note
  const [gradeData, setGradeData] = useState({
    studentId: '',
    subjectId: '',
    value: 0,
    type: 'DEVOIR',
    coefficient: 1,
    comment: ''
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Charger toutes les données
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      const [studentsRes, classesRes] = await Promise.all([
        fetch(`${API_URL}/students`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/classes`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!studentsRes.ok) throw new Error('Erreur chargement élèves');
      if (!classesRes.ok) throw new Error('Erreur chargement classes');

      const studentsData = await studentsRes.json();
      const classesData = await classesRes.json();

      console.log('Élèves chargés:', studentsData); // Debug
      setStudents(studentsData);
      setFilteredStudents(studentsData);
      setClasses(classesData);

    } catch (error) {
      console.error('Erreur chargement données:', error);
      setError('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Effet de filtrage
  useEffect(() => {
    let filtered = [...students];

    if (searchTerm) {
      filtered = filtered.filter(student => 
        student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.registrationNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (classFilter) {
      filtered = filtered.filter(student => 
        student.class?.id === classFilter
      );
    }

    setFilteredStudents(filtered);
  }, [searchTerm, classFilter, students]);

  // Créer un élève
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/students`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newStudent)
      });
      
      if (res.ok) {
        if (confirm('✅ Élève créé avec succès !')) {
          setShowModal(false);
          setNewStudent({
            firstName: '',
            lastName: '',
            dateOfBirth: '',
            registrationNo: '',
            parentName: '',
            parentPhone: '',
            parentEmail: '',
            classId: '',
            email: ''
          });
          fetchData();
        }
      } else {
        const error = await res.text();
        alert(`❌ Erreur: ${error}`);
      }
    } catch (error) {
      alert('❌ Erreur de connexion');
    } finally {
      setActionLoading(false);
    }
  };

  // Modifier un élève
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/students/${editStudent.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editStudent)
      });
      
      if (res.ok) {
        if (confirm('✅ Élève modifié avec succès !')) {
          setShowEditModal(false);
          fetchData();
        }
      } else {
        const error = await res.text();
        alert(`❌ Erreur: ${error}`);
      }
    } catch (error) {
      alert('❌ Erreur de connexion');
    } finally {
      setActionLoading(false);
    }
  };

  // Voir les détails d'un élève
  const viewStudentDetails = async (student: Student) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/students/${student.id}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const details = await res.json();
        console.log('Détails élève:', details); // Debug
        setSelectedStudent(details);
        setShowDetailsModal(true);
      } else {
        alert('❌ Erreur chargement détails');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur de connexion');
    } finally {
      setActionLoading(false);
    }
  };

  // Ajouter une absence
  const addAbsence = async () => {
    if (!absenceData.studentId || !absenceData.date) return;
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/absences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(absenceData)
      });

      if (res.ok) {
        if (confirm('✅ Absence enregistrée avec succès !')) {
          setShowAbsenceModal(false);
          if (selectedStudent) {
            viewStudentDetails(selectedStudent);
          }
          fetchData();
        }
      } else {
        const error = await res.text();
        alert(`❌ Erreur: ${error}`);
      }
    } catch (error) {
      alert('❌ Erreur réseau');
    } finally {
      setActionLoading(false);
    }
  };

  // Ajouter une note
  const addGrade = async () => {
    if (!gradeData.studentId || !gradeData.subjectId || !gradeData.value) return;
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/grades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(gradeData)
      });

      if (res.ok) {
        if (confirm('✅ Note enregistrée avec succès !')) {
          setShowGradeModal(false);
          if (selectedStudent) {
            viewStudentDetails(selectedStudent);
          }
          fetchData();
        }
      } else {
        const error = await res.text();
        alert(`❌ Erreur: ${error}`);
      }
    } catch (error) {
      alert('❌ Erreur réseau');
    } finally {
      setActionLoading(false);
    }
  };

  // Supprimer un élève
  const deleteStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'élève ${studentName} ?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/students/${studentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        alert('✅ Élève supprimé');
        fetchData();
      } else {
        const error = await res.text();
        alert(`❌ Erreur: ${error}`);
      }
    } catch (error) {
      alert('❌ Erreur réseau');
    }
  };

  // Préparer la modification
  const prepareEdit = (student: Student) => {
    setEditStudent({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '',
      registrationNo: student.registrationNo,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      parentEmail: student.parentEmail || '',
      classId: student.class?.id || '',
      email: student.user?.email || ''
    });
    setShowEditModal(true);
  };

  // Préparer l'absence
  const prepareAbsence = (student: Student) => {
    setAbsenceData({
      studentId: student.id,
      date: new Date().toISOString().split('T')[0],
      type: 'ABSENCE',
      isJustified: false,
      reason: ''
    });
    setShowAbsenceModal(true);
  };

  // Préparer la note
  const prepareGrade = (student: Student) => {
    setGradeData({
      studentId: student.id,
      subjectId: '',
      value: 0,
      type: 'DEVOIR',
      coefficient: 1,
      comment: ''
    });
    setShowGradeModal(true);
  };

  // Obtenir les classes uniques pour le filtre
  const uniqueClasses = classes.map(c => ({ id: c.id, name: c.name }));

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Élèves</h1>
          <p className="text-gray-600 mt-1">
            <Icon icon="fa-user-graduate" className="mr-2 text-gray-600" />
            {filteredStudents.length} élève{filteredStudents.length > 1 ? 's' : ''}
          </p>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-md"
        >
          <Icon icon="fa-plus" />
          Nouvel Élève
        </button>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-3">
          <Icon icon="fa-exclamation-triangle" className="text-red-700" />
          <span>{error}</span>
          <button onClick={fetchData} className="ml-auto text-sm underline text-red-700">
            Réessayer
          </button>
        </div>
      )}

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              <Icon icon="fa-user-graduate" className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Élèves</p>
              <p className="text-2xl font-bold text-gray-900">{students.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
              <Icon icon="fa-school" className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Classes</p>
              <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
              <Icon icon="fa-chart-line" className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Moyenne générale</p>
              <p className="text-2xl font-bold text-gray-900">
                {students.length > 0 ? '12.5/20' : '0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
              <Icon icon="fa-clock" className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Taux de présence</p>
              <p className="text-2xl font-bold text-gray-900">94%</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION RECHERCHE ET FILTRES */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Recherche */}
          <div className="flex-1 w-full md:w-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher un élève (nom, prénom, matricule, parent...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
              <Icon icon="fa-search" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Filtres */}
          <div className="flex gap-3 w-full md:w-auto">
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 min-w-[150px]"
            >
              <option value="">Toutes les classes</option>
              {uniqueClasses.map(cls => (
                <option key={cls.id} value={cls.id} className="text-gray-900">{cls.name}</option>
              ))}
            </select>

            {(searchTerm || classFilter) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setClassFilter('');
                }}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
              >
                <Icon icon="fa-times" />
                Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TABLEAU DES ÉLÈVES (réduisible) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
        <div 
          className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition"
          onClick={() => setShowTable(!showTable)}
        >
          <div className="flex items-center gap-3">
            <Icon icon={showTable ? "fa-chevron-down" : "fa-chevron-right"} className="text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-800">Liste des élèves</h2>
            <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              {filteredStudents.length}
            </span>
          </div>
          <button className="text-gray-500 hover:text-gray-700">
            <Icon icon={showTable ? "fa-compress" : "fa-expand"} />
          </button>
        </div>

        {showTable && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Élève</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matricule</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classe</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Absences</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{student.firstName} {student.lastName}</p>
                          <p className="text-xs text-gray-500">Né(e) le: {new Date(student.dateOfBirth).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-gray-600">{student.registrationNo}</span>
                    </td>
                    <td className="px-6 py-4">
                      {student.class ? (
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                          {student.class.name}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Non assigné</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{student.parentName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{student.parentPhone}</p>
                      {student.parentEmail && (
                        <p className="text-xs text-gray-500">{student.parentEmail}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{student._count?.grades || 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{student._count?.absences || 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewStudentDetails(student)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Voir détails"
                        >
                          <Icon icon="fa-eye" />
                        </button>
                        <button
                          onClick={() => prepareAbsence(student)}
                          className="p-1 text-orange-600 hover:bg-orange-50 rounded transition"
                          title="Ajouter une absence"
                        >
                          <Icon icon="fa-clock" />
                        </button>
                        <button
                          onClick={() => prepareGrade(student)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded transition"
                          title="Ajouter une note"
                        >
                          <Icon icon="fa-star" />
                        </button>
                        <button
                          onClick={() => prepareEdit(student)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Modifier"
                        >
                          <Icon icon="fa-edit" />
                        </button>
                        <button
                          onClick={() => deleteStudent(student.id, `${student.firstName} ${student.lastName}`)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                          title="Supprimer"
                        >
                          <Icon icon="fa-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION DES CARTES (réduisible) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div 
          className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition"
          onClick={() => setShowCards(!showCards)}
        >
          <div className="flex items-center gap-3">
            <Icon icon={showCards ? "fa-chevron-down" : "fa-chevron-right"} className="text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-800">Vue en cartes</h2>
            <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              {filteredStudents.length}
            </span>
          </div>
          <button className="text-gray-500 hover:text-gray-700">
            <Icon icon={showCards ? "fa-compress" : "fa-expand"} />
          </button>
        </div>

        {showCards && (
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-center">
                  <Icon icon="fa-spinner" className="fa-spin text-4xl text-blue-500 mb-4" />
                  <p className="text-gray-600">Chargement des élèves...</p>
                </div>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <Icon icon="fa-user-graduate" className="text-6xl text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-gray-700 mb-2">
                  {students.length === 0 ? 'Aucun élève' : 'Aucun résultat'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {students.length === 0 
                    ? 'Commencez par inscrire votre premier élève'
                    : 'Aucun élève ne correspond à votre recherche'}
                </p>
                {students.length === 0 ? (
                  <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
                  >
                    <Icon icon="fa-plus" />
                    Ajouter un élève
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setClassFilter('');
                    }}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
                  >
                    <Icon icon="fa-times" />
                    Effacer les filtres
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredStudents.map((student) => (
                  <div 
                    key={student.id} 
                    className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all overflow-hidden"
                  >
                    {/* En-tête avec classe */}
                    <div className="h-2 bg-gradient-to-r from-blue-400 to-blue-600"></div>
                    
                    <div className="p-6">
                      {/* Badge matricule */}
                      <div className="flex justify-end mb-2">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-mono">
                          {student.registrationNo}
                        </span>
                      </div>

                      {/* Avatar et nom */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md">
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900">
                            {student.firstName} {student.lastName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {new Date(student.dateOfBirth).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>

                      {/* Classe */}
                      <div className="mb-3">
                        {student.class ? (
                          <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                            {student.class.name}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400 italic">Non assigné</span>
                        )}
                      </div>

                      {/* Contact parent */}
                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-gray-700">
                          <Icon icon="fa-user" className="inline mr-2 text-gray-400" />
                          {student.parentName}
                        </p>
                        <p className="text-sm text-gray-700">
                          <Icon icon="fa-phone" className="inline mr-2 text-gray-400" />
                          {student.parentPhone}
                        </p>
                        {student.parentEmail && (
                          <p className="text-sm text-gray-700 truncate">
                            <Icon icon="fa-envelope" className="inline mr-2 text-gray-400" />
                            {student.parentEmail}
                          </p>
                        )}
                      </div>

                      {/* Statistiques */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-gray-50 p-2 rounded-lg text-center">
                          <p className="text-lg font-bold text-gray-900">{student._count?.grades || 0}</p>
                          <p className="text-xs text-gray-500">Notes</p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-lg text-center">
                          <p className="text-lg font-bold text-gray-900">{student._count?.absences || 0}</p>
                          <p className="text-xs text-gray-500">Absences</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewStudentDetails(student)}
                          className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition flex items-center justify-center gap-2"
                        >
                          <Icon icon="fa-eye" />
                          Détails
                        </button>
                        <button
                          onClick={() => prepareEdit(student)}
                          className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition flex items-center justify-center"
                        >
                          <Icon icon="fa-edit" />
                        </button>
                        <button
                          onClick={() => deleteStudent(student.id, `${student.firstName} ${student.lastName}`)}
                          className="w-10 h-10 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition flex items-center justify-center"
                        >
                          <Icon icon="fa-trash" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL AJOUT ÉLÈVE */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                <Icon icon="fa-user-plus" className="text-blue-500 mr-2" />
                Nouvel Élève
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <Icon icon="fa-times" className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                  <input 
                    type="text"
                    required
                    className="w-full border border-gray-300 p-3 rounded-lg"
                    value={newStudent.firstName}
                    onChange={e => setNewStudent({...newStudent, firstName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input 
                    type="text"
                    required
                    className="w-full border border-gray-300 p-3 rounded-lg"
                    value={newStudent.lastName}
                    onChange={e => setNewStudent({...newStudent, lastName: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance *</label>
                  <input 
                    type="date"
                    required
                    className="w-full border border-gray-300 p-3 rounded-lg"
                    value={newStudent.dateOfBirth}
                    onChange={e => setNewStudent({...newStudent, dateOfBirth: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Matricule *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ex: MAT001"
                    className="w-full border border-gray-300 p-3 rounded-lg"
                    value={newStudent.registrationNo}
                    onChange={e => setNewStudent({...newStudent, registrationNo: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email de connexion *</label>
                <input 
                  type="email"
                  required
                  placeholder="eleve@email.com"
                  className="w-full border border-gray-300 p-3 rounded-lg"
                  value={newStudent.email}
                  onChange={e => setNewStudent({...newStudent, email: e.target.value})}
                />
                <p className="text-xs text-gray-500 mt-1">
                  L'email servira d'identifiant de connexion (mot de passe par défaut: student123)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Classe</label>
                <select
                  className="w-full border border-gray-300 p-3 rounded-lg"
                  value={newStudent.classId}
                  onChange={e => setNewStudent({...newStudent, classId: e.target.value})}
                >
                  <option value="">Sélectionner une classe</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.level})
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Informations parent / tuteur</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom du parent *</label>
                    <input 
                      type="text"
                      required
                      className="w-full border border-gray-300 p-3 rounded-lg"
                      value={newStudent.parentName}
                      onChange={e => setNewStudent({...newStudent, parentName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                    <input 
                      type="tel"
                      required
                      placeholder="+235 XX XX XX XX"
                      className="w-full border border-gray-300 p-3 rounded-lg"
                      value={newStudent.parentPhone}
                      onChange={e => setNewStudent({...newStudent, parentPhone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email parent</label>
                  <input 
                    type="email"
                    placeholder="parent@email.com"
                    className="w-full border border-gray-300 p-3 rounded-lg"
                    value={newStudent.parentEmail}
                    onChange={e => setNewStudent({...newStudent, parentEmail: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={actionLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <Icon icon="fa-spinner" className="fa-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Icon icon="fa-save" />
                      Créer
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DÉTAILS ÉLÈVE */}
      {showDetailsModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-3xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-2 border-b">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">{selectedStudent.registrationNo}</p>
                </div>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600">
                <Icon icon="fa-times" className="text-xl" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Informations personnelles */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                    <Icon icon="fa-calendar" />
                    Date de naissance
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(selectedStudent.dateOfBirth).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                    <Icon icon="fa-school" />
                    Classe
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedStudent.class?.name || 'Non assigné'}
                  </p>
                </div>
              </div>

              {/* Contact parent */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 flex items-center gap-2 mb-2">
                  <Icon icon="fa-users" />
                  Parent / Tuteur
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Nom</p>
                    <p className="font-medium text-gray-900">{selectedStudent.parentName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Téléphone</p>
                    <p className="font-medium text-gray-900">{selectedStudent.parentPhone}</p>
                  </div>
                  {selectedStudent.parentEmail && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{selectedStudent.parentEmail}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes récentes */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                    <Icon icon="fa-star" />
                    Notes récentes ({selectedStudent.grades?.length || 0})
                  </h4>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      prepareGrade(selectedStudent);
                    }}
                    className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm hover:bg-green-100 transition flex items-center gap-2"
                  >
                    <Icon icon="fa-plus" />
                    Ajouter
                  </button>
                </div>
                
                {selectedStudent.grades && selectedStudent.grades.length > 0 ? (
                  <div className="border rounded-lg divide-y">
                    {selectedStudent.grades.slice(0, 5).map((grade) => (
                      <div key={grade.id} className="flex items-center justify-between p-3">
                        <div>
                          <p className="font-medium text-gray-900">{grade.subject?.name || 'Matière inconnue'}</p>
                          <p className="text-xs text-gray-500">{grade.type} • Coef {grade.coefficient}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-blue-600">{grade.value}/20</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Icon icon="fa-star" className="text-3xl text-gray-300 mb-2" />
                    <p className="text-gray-500">Aucune note</p>
                  </div>
                )}
              </div>

              {/* Absences récentes */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                    <Icon icon="fa-clock" />
                    Absences récentes ({selectedStudent.absences?.length || 0})
                  </h4>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      prepareAbsence(selectedStudent);
                    }}
                    className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-sm hover:bg-orange-100 transition flex items-center gap-2"
                  >
                    <Icon icon="fa-plus" />
                    Ajouter
                  </button>
                </div>
                
                {selectedStudent.absences && selectedStudent.absences.length > 0 ? (
                  <div className="border rounded-lg divide-y">
                    {selectedStudent.absences.slice(0, 5).map((absence) => (
                      <div key={absence.id} className="flex items-center justify-between p-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {new Date(absence.date).toLocaleDateString('fr-FR')}
                          </p>
                          <p className="text-xs text-gray-500">{absence.type}</p>
                        </div>
                        <div>
                          {absence.isJustified ? (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              Justifiée
                            </span>
                          ) : (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                              Non justifiée
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Icon icon="fa-clock" className="text-3xl text-gray-300 mb-2" />
                    <p className="text-gray-500">Aucune absence</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button 
                onClick={() => {
                  setShowDetailsModal(false);
                  prepareEdit(selectedStudent);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Icon icon="fa-edit" className="mr-2" />
                Modifier
              </button>
              <button 
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AJOUT ABSENCE */}
      {showAbsenceModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                <Icon icon="fa-clock" className="text-orange-500 mr-2" />
                Ajouter une absence
              </h3>
              <button onClick={() => setShowAbsenceModal(false)} className="text-gray-400 hover:text-gray-600">
                <Icon icon="fa-times" className="text-xl" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Élève: <span className="font-semibold">{selectedStudent.firstName} {selectedStudent.lastName}</span>
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input 
                  type="date"
                  className="w-full border border-gray-300 p-3 rounded-lg"
                  value={absenceData.date}
                  onChange={(e) => setAbsenceData({...absenceData, date: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select 
                  className="w-full border border-gray-300 p-3 rounded-lg"
                  value={absenceData.type}
                  onChange={(e) => setAbsenceData({...absenceData, type: e.target.value})}
                >
                  <option value="ABSENCE">Absence</option>
                  <option value="RETARD">Retard</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={absenceData.isJustified}
                    onChange={(e) => setAbsenceData({...absenceData, isJustified: e.target.checked})}
                    className="w-4 h-4 text-orange-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Absence justifiée</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Motif (optionnel)</label>
                <textarea 
                  className="w-full border border-gray-300 p-3 rounded-lg"
                  rows={3}
                  value={absenceData.reason}
                  onChange={(e) => setAbsenceData({...absenceData, reason: e.target.value})}
                  placeholder="Raison de l'absence..."
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setShowAbsenceModal(false)} 
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Annuler
                </button>
                <button 
                  onClick={addAbsence}
                  disabled={actionLoading}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <Icon icon="fa-spinner" className="fa-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Icon icon="fa-check" />
                      Enregistrer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AJOUT NOTE */}
      {showGradeModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                <Icon icon="fa-star" className="text-green-500 mr-2" />
                Ajouter une note
              </h3>
              <button onClick={() => setShowGradeModal(false)} className="text-gray-400 hover:text-gray-600">
                <Icon icon="fa-times" className="text-xl" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Élève: <span className="font-semibold">{selectedStudent.firstName} {selectedStudent.lastName}</span>
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Matière</label>
                <select 
                  className="w-full border border-gray-300 p-3 rounded-lg"
                  value={gradeData.subjectId}
                  onChange={(e) => setGradeData({...gradeData, subjectId: e.target.value})}
                >
                  <option value="">Sélectionner une matière</option>
                  {/* À remplacer par la liste des matières */}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Note /20</label>
                  <input 
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    className="w-full border border-gray-300 p-3 rounded-lg"
                    value={gradeData.value}
                    onChange={(e) => setGradeData({...gradeData, value: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Coefficient</label>
                  <input 
                    type="number"
                    min="1"
                    max="10"
                    className="w-full border border-gray-300 p-3 rounded-lg"
                    value={gradeData.coefficient}
                    onChange={(e) => setGradeData({...gradeData, coefficient: parseInt(e.target.value) || 1})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select 
                  className="w-full border border-gray-300 p-3 rounded-lg"
                  value={gradeData.type}
                  onChange={(e) => setGradeData({...gradeData, type: e.target.value})}
                >
                  <option value="DEVOIR">Devoir</option>
                  <option value="COMPO">Composition</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Commentaire (optionnel)</label>
                <textarea 
                  className="w-full border border-gray-300 p-3 rounded-lg"
                  rows={3}
                  value={gradeData.comment}
                  onChange={(e) => setGradeData({...gradeData, comment: e.target.value})}
                  placeholder="Appréciation..."
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setShowGradeModal(false)} 
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Annuler
                </button>
                <button 
                  onClick={addGrade}
                  disabled={actionLoading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <Icon icon="fa-spinner" className="fa-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Icon icon="fa-check" />
                      Enregistrer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}