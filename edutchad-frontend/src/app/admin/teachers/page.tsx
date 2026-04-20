'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/Icon';

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  specialty: string;
  photo?: string | null;
  user?: {
    email: string;
    isActive: boolean;
    createdAt?: string;
  };
  mainClass?: {
    id: string;
    name: string;
    level: string;
    _count?: {
      students: number;
    };
  } | null;
  subjects?: Subject[];
  courses?: Course[];
  _count?: {
    subjects?: number;
    courses?: number;
  };
}

interface Subject {
  id: string;
  name: string;
  color?: string;
}

interface Course {
  id: string;
  class: {
    id: string;
    name: string;
    level: string;
  };
  subject: {
    id: string;
    name: string;
  };
  coefficient: number;
}

interface Class {
  id: string;
  name: string;
  level: string;
  mainTeacher?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  _count?: {
    students: number;
  };
}

export default function TeachersPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  // États pour les modals - un seul actif à la fois
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // États pour la recherche et les filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // État pour le tableau réduisible
  const [showTable, setShowTable] = useState(true);

  // Formulaire nouveau professeur
  const [newTeacher, setNewTeacher] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    specialty: '',
    email: '',
    photo: '',
    subjectIds: [] as string[]
  });

  // Formulaire modification
  const [editTeacher, setEditTeacher] = useState({
    id: '',
    firstName: '',
    lastName: '',
    phone: '',
    specialty: '',
    photo: '',
    email: ''
  });

  // Formulaire changement de mot de passe
  const [passwordData, setPasswordData] = useState({
    teacherId: '',
    newPassword: '',
    confirmPassword: '',
    showPassword: false
  });

  // Formulaire assignation classe principale
  const [assignData, setAssignData] = useState({
    teacherId: '',
    classId: ''
  });

  // Formulaire assignation matières (multi-sélection)
  const [subjectsData, setSubjectsData] = useState({
    teacherId: '',
    subjectIds: [] as string[]
  });

  // Formulaire assignation de classe (pour les cours)
  const [assignClassData, setAssignClassData] = useState({
    teacherId: '',
    classId: '',
    subjectId: '',
    coefficient: 1
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Fonctions pour ouvrir/fermer les modals
  const openModal = (modalName: string) => {
    setActiveModal(modalName);
  };

  const closeModal = () => {
    setActiveModal(null);
    // Réinitialiser les données du modal après fermeture
    setPasswordData({
      teacherId: '',
      newPassword: '',
      confirmPassword: '',
      showPassword: false
    });
  };

  // Charger toutes les données
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      const [teachersRes, classesRes, subjectsRes] = await Promise.all([
        fetch(`${API_URL}/teachers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/classes`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/subjects`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!teachersRes.ok) throw new Error('Erreur chargement professeurs');
      if (!classesRes.ok) throw new Error('Erreur chargement classes');
      if (!subjectsRes.ok) throw new Error('Erreur chargement matières');

      const teachersData = await teachersRes.json();
      const classesData = await classesRes.json();
      const subjectsData = await subjectsRes.json();

      console.log('Professeurs chargés:', teachersData);
      setTeachers(teachersData);
      setFilteredTeachers(teachersData);
      setClasses(classesData);
      setSubjects(subjectsData);

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
    let filtered = [...teachers];

    if (searchTerm) {
      filtered = filtered.filter(teacher => 
        teacher.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.phone?.includes(searchTerm) ||
        teacher.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (specialtyFilter) {
      filtered = filtered.filter(teacher => 
        teacher.specialty === specialtyFilter
      );
    }

    if (statusFilter === 'principal') {
      filtered = filtered.filter(teacher => teacher.mainClass);
    } else if (statusFilter === 'non-principal') {
      filtered = filtered.filter(teacher => !teacher.mainClass);
    }

    setFilteredTeachers(filtered);
  }, [searchTerm, specialtyFilter, statusFilter, teachers]);

  // Créer un professeur
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/teachers`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTeacher)
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(`✅ Professeur créé avec succès !\nUn email a été envoyé à ${data.user?.email || newTeacher.email}`);
        closeModal();
        setNewTeacher({ 
          firstName: '', 
          lastName: '', 
          phone: '', 
          specialty: '', 
          email: '',
          photo: '',
          subjectIds: [] 
        });
        fetchData();
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

  // Modifier un professeur
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/teachers/${editTeacher.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName: editTeacher.firstName,
          lastName: editTeacher.lastName,
          phone: editTeacher.phone,
          specialty: editTeacher.specialty,
          photo: editTeacher.photo
        })
      });
      
      if (res.ok) {
        alert('✅ Professeur modifié avec succès !');
        closeModal();
        fetchData();
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

  // Changer le mot de passe
  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('❌ Les mots de passe ne correspondent pas');
      return;
    }

    if (passwordData.newPassword && passwordData.newPassword.length < 6) {
      alert('❌ Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/teachers/${passwordData.teacherId}/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          newPassword: passwordData.newPassword || undefined 
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.generatedPassword) {
          alert(`✅ Mot de passe modifié avec succès !\nNouveau mot de passe: ${data.generatedPassword}\nUn email a été envoyé au professeur.`);
        } else {
          alert('✅ Mot de passe modifié avec succès ! Un email a été envoyé au professeur.');
        }
        closeModal();
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

  // Réinitialiser le mot de passe (génération automatique)
  const handleResetPassword = async (teacher: Teacher) => {
    if (!confirm(`Voulez-vous réinitialiser le mot de passe de ${teacher.firstName} ${teacher.lastName} ? Un nouveau mot de passe sera généré et envoyé par email.`)) {
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/teachers/${teacher.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        alert(`✅ Mot de passe réinitialisé avec succès !\nNouveau mot de passe: ${data.generatedPassword}\nUn email a été envoyé à ${teacher.user?.email}`);
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

  // Voir les détails d'un professeur
  const viewTeacherDetails = async (teacher: Teacher) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/teachers/${teacher.id}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const details = await res.json();
        setSelectedTeacher(details);
        openModal('details');
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

  // Assigner une classe principale
  const assignMainClass = async () => {
    if (!assignData.teacherId || !assignData.classId) return;
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/teachers/${assignData.teacherId}/assign-main-class`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ classId: assignData.classId })
      });

      if (res.ok) {
        alert('✅ Classe principale assignée avec succès !');
        closeModal();
        setAssignData({ teacherId: '', classId: '' });
        fetchData();
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

  // Retirer le rôle de professeur principal
  const removeMainClass = async (teacherId: string, teacherName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir retirer le rôle de professeur principal à ${teacherName} ?`)) {
      return;
    }
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/teachers/${teacherId}/remove-main-class`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        alert('✅ Rôle de professeur principal retiré avec succès !');
        fetchData();
        if (selectedTeacher && selectedTeacher.id === teacherId) {
          setSelectedTeacher(null);
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

  // Assigner plusieurs matières
  const assignSubjects = async () => {
    if (!subjectsData.teacherId) return;
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/teachers/${subjectsData.teacherId}/assign-subjects`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subjectIds: subjectsData.subjectIds })
      });

      if (res.ok) {
        alert('✅ Matières assignées avec succès !');
        closeModal();
        setSubjectsData({ teacherId: '', subjectIds: [] });
        fetchData();
      } else {
        const error = await res.text();
        alert(`❌ Erreur: ${error}`);
      }
    } catch (error) {
      console.error('Erreur assignation matières:', error);
      alert('❌ Erreur de connexion au serveur');
    } finally {
      setActionLoading(false);
    }
  };

  // Retirer une matière spécifique
  const removeSubject = async (teacherId: string, subjectId: string, subjectName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir retirer la matière "${subjectName}" ?`)) {
      return;
    }
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/teachers/${teacherId}/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        alert('✅ Matière retirée avec succès !');
        if (selectedTeacher && selectedTeacher.id === teacherId) {
          viewTeacherDetails(selectedTeacher);
        }
        fetchData();
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

  // Assigner une classe (créer un cours)
  const assignClass = async () => {
    if (!assignClassData.teacherId || !assignClassData.classId || !assignClassData.subjectId) {
      alert('Veuillez remplir tous les champs');
      return;
    }
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/teachers/${assignClassData.teacherId}/assign-class`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          classId: assignClassData.classId,
          subjectId: assignClassData.subjectId,
          coefficient: assignClassData.coefficient
        })
      });

      if (res.ok) {
        alert('✅ Classe assignée avec succès !');
        closeModal();
        setAssignClassData({ teacherId: '', classId: '', subjectId: '', coefficient: 1 });
        if (selectedTeacher) {
          viewTeacherDetails(selectedTeacher);
        }
        fetchData();
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

  // Retirer une classe spécifique
  const removeClass = async (teacherId: string, classId: string, subjectId: string, className: string, subjectName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir retirer la classe "${className}" pour la matière "${subjectName}" ?`)) {
      return;
    }
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/teachers/${teacherId}/classes/${classId}/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        alert('✅ Classe retirée avec succès !');
        if (selectedTeacher && selectedTeacher.id === teacherId) {
          viewTeacherDetails(selectedTeacher);
        }
        fetchData();
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

  // Retirer toutes les classes d'un professeur
  const removeAllClasses = async (teacherId: string, teacherName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir retirer TOUTES les classes de ${teacherName} ? Cette action est irréversible.`)) {
      return;
    }
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/teachers/${teacherId}/classes`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        alert('✅ Toutes les classes ont été retirées avec succès !');
        if (selectedTeacher && selectedTeacher.id === teacherId) {
          viewTeacherDetails(selectedTeacher);
        }
        fetchData();
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

  // Supprimer un professeur
  const deleteTeacher = async (teacherId: string, teacherName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le professeur ${teacherName} ? Cette action est irréversible.`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/teachers/${teacherId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        alert('✅ Professeur supprimé avec succès');
        fetchData();
        if (selectedTeacher && selectedTeacher.id === teacherId) {
          setSelectedTeacher(null);
        }
      } else {
        const error = await res.text();
        alert(`❌ Erreur: ${error}`);
      }
    } catch (error) {
      alert('❌ Erreur réseau');
    }
  };

  // Préparer l'ouverture des modals
  const openAddModal = () => {
    setNewTeacher({
      firstName: '',
      lastName: '',
      phone: '',
      specialty: '',
      email: '',
      photo: '',
      subjectIds: []
    });
    openModal('add');
  };

  const prepareEdit = (teacher: Teacher) => {
    setEditTeacher({
      id: teacher.id,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      phone: teacher.phone || '',
      specialty: teacher.specialty || '',
      photo: teacher.photo || '',
      email: teacher.user?.email || ''
    });
    openModal('edit');
  };

  const preparePasswordChange = (teacher: Teacher) => {
    setPasswordData({
      teacherId: teacher.id,
      newPassword: '',
      confirmPassword: '',
      showPassword: false
    });
    setSelectedTeacher(teacher);
    openModal('password');
  };

  const prepareSubjectsAssign = (teacher: Teacher) => {
    setSubjectsData({ 
      teacherId: teacher.id, 
      subjectIds: teacher.subjects?.map(s => s.id) || [] 
    });
    setSelectedTeacher(teacher);
    openModal('subjects');
  };

  const prepareClassAssign = (teacher: Teacher) => {
    setAssignClassData({ 
      teacherId: teacher.id, 
      classId: '', 
      subjectId: '',
      coefficient: 1 
    });
    setSelectedTeacher(teacher);
    openModal('assign-class');
  };

  // Obtenir les spécialités uniques pour le filtre
  const uniqueSpecialties = [...new Set(teachers.map(t => t.specialty).filter(Boolean))];

  // Gérer la sélection multiple de matières
  const handleSubjectSelection = (subjectId: string) => {
    setSubjectsData(prev => {
      const newSubjectIds = prev.subjectIds.includes(subjectId)
        ? prev.subjectIds.filter(id => id !== subjectId)
        : [...prev.subjectIds, subjectId];
      return { ...prev, subjectIds: newSubjectIds };
    });
  };

  // Obtenir toutes les classes assignées à un professeur (via ses cours)
  const getTeacherClasses = (teacher: Teacher) => {
    if (!teacher.courses || teacher.courses.length === 0) return [];
    
    const classMap = new Map();
    teacher.courses.forEach(course => {
      if (course.class && course.subject) {
        const key = `${course.class.id}-${course.subject.id}`;
        classMap.set(key, {
          ...course.class,
          courseId: course.id,
          subject: course.subject,
          coefficient: course.coefficient
        });
      }
    });
    
    return Array.from(classMap.values());
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Professeurs</h1>
          <p className="text-gray-600 mt-1">
            <Icon icon="fa-user-tie" className="mr-2 text-gray-600" />
            {filteredTeachers.length} professeur{filteredTeachers.length > 1 ? 's' : ''} • {teachers.filter(t => t.mainClass).length} principal(aux)
          </p>
        </div>
        
        <button 
          onClick={openAddModal}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-md"
        >
          <Icon icon="fa-plus" />
          Nouveau Professeur
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
              <Icon icon="fa-user-tie" className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Professeurs</p>
              <p className="text-2xl font-bold text-gray-900">{teachers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-600">
              <Icon icon="fa-crown" className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Professeurs Principaux</p>
              <p className="text-2xl font-bold text-gray-900">
                {teachers.filter(t => t.mainClass).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
              <Icon icon="fa-book" className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Matières</p>
              <p className="text-2xl font-bold text-gray-900">{subjects.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
              <Icon icon="fa-chalkboard-teacher" className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Classes</p>
              <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
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
                placeholder="Rechercher un professeur (nom, prénom, spécialité, email)..."
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
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 min-w-[150px]"
            >
              <option value="">Toutes spécialités</option>
              {uniqueSpecialties.map(specialty => (
                <option key={specialty} value={specialty} className="text-gray-900">{specialty}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 min-w-[150px]"
            >
              <option value="all" className="text-gray-900">Tous les profs</option>
              <option value="principal" className="text-gray-900">Professeurs Principaux</option>
              <option value="non-principal" className="text-gray-900">Non principaux</option>
            </select>

            {(searchTerm || specialtyFilter || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSpecialtyFilter('');
                  setStatusFilter('all');
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

      {/* TABLEAU DES PROFESSEURS (réduisible) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
        <div 
          className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition"
          onClick={() => setShowTable(!showTable)}
        >
          <div className="flex items-center gap-3">
            <Icon icon={showTable ? "fa-chevron-down" : "fa-chevron-right"} className="text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-800">Liste des professeurs</h2>
            <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              {filteredTeachers.length}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Professeur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classe Principale</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matières</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTeachers.map((teacher) => {
                  const assignedClasses = getTeacherClasses(teacher);
                  
                  return (
                    <tr key={teacher.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
                            teacher.mainClass ? 'bg-yellow-500' : 'bg-blue-500'
                          }`}>
                            {teacher.firstName[0]}{teacher.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{teacher.firstName} {teacher.lastName}</p>
                            {teacher.mainClass && (
                              <span className="text-xs text-yellow-600 flex items-center gap-1">
                                <Icon icon="fa-crown" className="text-xs" />
                                Principal
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">{teacher.phone || '-'}</p>
                        <p className="text-xs text-gray-500">{teacher.user?.email || '-'}</p>
                      </td>
                      <td className="px-6 py-4">
                        {teacher.mainClass ? (
                          <span className="text-sm font-medium text-gray-900">{teacher.mainClass.name}</span>
                        ) : (
                          <span className="text-sm text-gray-400 italic">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">{teacher.subjects?.length || 0}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">{assignedClasses.length}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => activeModal === null && viewTeacherDetails(teacher)}
                            disabled={activeModal !== null}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition disabled:opacity-50"
                            title="Voir détails"
                          >
                            <Icon icon="fa-eye" />
                          </button>
                          <button
                            onClick={() => {
                              setAssignData({ teacherId: teacher.id, classId: '' });
                              openModal('assign');
                            }}
                            className={`p-1 ${
                              teacher.mainClass 
                                ? 'text-gray-400 cursor-not-allowed' 
                                : 'text-yellow-600 hover:bg-yellow-50'
                            } rounded transition disabled:opacity-50`}
                            disabled={!!teacher.mainClass || activeModal !== null}
                            title={teacher.mainClass ? 'Déjà principal' : 'Assigner comme principal'}
                          >
                            <Icon icon="fa-crown" />
                          </button>
                          <button
                            onClick={() => activeModal === null && prepareSubjectsAssign(teacher)}
                            disabled={activeModal !== null}
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition disabled:opacity-50"
                            title="Gérer les matières"
                          >
                            <Icon icon="fa-book" />
                          </button>
                          <button
                            onClick={() => activeModal === null && prepareEdit(teacher)}
                            disabled={activeModal !== null}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition disabled:opacity-50"
                            title="Modifier"
                          >
                            <Icon icon="fa-edit" />
                          </button>
                          {/* <button
                            onClick={() => activeModal === null && preparePasswordChange(teacher)}
                            disabled={activeModal !== null}
                            className="p-1 text-orange-600 hover:bg-orange-50 rounded transition disabled:opacity-50"
                            title="Changer mot de passe"
                          >
                            <Icon icon="fa-key" />
                          </button>
                          <button
                            onClick={() => activeModal === null && handleResetPassword(teacher)}
                            disabled={activeModal !== null}
                            className="p-1 text-purple-600 hover:bg-purple-50 rounded transition disabled:opacity-50"
                            title="Réinitialiser mot de passe"
                          >
                            <Icon icon="fa-sync" />
                          </button> */}
                          <button
                            onClick={() => activeModal === null && deleteTeacher(teacher.id, `${teacher.firstName} ${teacher.lastName}`)}
                            disabled={activeModal !== null}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
                            title="Supprimer"
                          >
                            <Icon icon="fa-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* GRILLE DES PROFESSEURS */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Icon icon="fa-spinner" className="fa-spin text-4xl text-blue-500 mb-4" />
            <p className="text-gray-600">Chargement des professeurs...</p>
          </div>
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Icon icon="fa-user-tie" className="text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            {teachers.length === 0 ? 'Aucun professeur' : 'Aucun résultat'}
          </h3>
          <p className="text-gray-500 mb-6">
            {teachers.length === 0 
              ? 'Commencez par ajouter votre premier professeur'
              : 'Aucun professeur ne correspond à votre recherche'}
          </p>
          {teachers.length === 0 ? (
            <button
              onClick={openAddModal}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
            >
              <Icon icon="fa-plus" />
              Ajouter un professeur
            </button>
          ) : (
            <button
              onClick={() => {
                setSearchTerm('');
                setSpecialtyFilter('');
                setStatusFilter('all');
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
            >
              <Icon icon="fa-times" />
              Effacer les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTeachers.map((teacher) => {
            const assignedClasses = getTeacherClasses(teacher);
            
            return (
              <div 
                key={teacher.id} 
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all overflow-hidden"
              >
                {/* En-tête avec dégradé */}
                <div className={`h-2 ${
                  teacher.mainClass 
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' 
                    : 'bg-gradient-to-r from-blue-400 to-blue-600'
                }`}></div>
                
                <div className="p-6">
                  {/* Badge Principal */}
                  {teacher.mainClass && (
                    <div className="flex justify-end -mt-2 mb-2">
                      <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                        <Icon icon="fa-crown" className="text-yellow-500" />
                        Professeur Principal
                      </span>
                    </div>
                  )}

                  {/* En-tête avec photo/initiales */}
                  <div className="flex items-start gap-4 mb-6">
                    {teacher.photo ? (
                      <img 
                        src={teacher.photo} 
                        alt={`${teacher.firstName} ${teacher.lastName}`}
                        className="w-20 h-20 rounded-xl object-cover shadow-md"
                      />
                    ) : (
                      <div className={`w-20 h-20 rounded-xl flex items-center justify-center text-white text-3xl font-bold shadow-md ${
                        teacher.mainClass 
                          ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' 
                          : 'bg-gradient-to-br from-blue-500 to-blue-600'
                      }`}>
                        {teacher.firstName[0]}{teacher.lastName[0]}
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900">
                        {teacher.firstName} {teacher.lastName}
                      </h3>
                      <p className="text-gray-600 mt-1 flex items-center gap-2">
                        <Icon icon="fa-briefcase" className="text-gray-400" />
                        {teacher.specialty || 'Aucune spécialité'}
                      </p>
                    </div>
                  </div>

                  {/* Informations de contact */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-3 rounded-lg">
                      <Icon icon="fa-phone" className="text-gray-500" />
                      <span className="text-sm truncate">{teacher.phone || 'Non renseigné'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-3 rounded-lg">
                      <Icon icon="fa-envelope" className="text-gray-500" />
                      <span className="text-sm truncate">{teacher.user?.email || 'Non renseigné'}</span>
                    </div>
                  </div>

                  {/* Classe principale */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 text-gray-700 mb-2">
                      <Icon icon="fa-school" className="text-gray-500" />
                      <span className="font-medium">Classe principale</span>
                    </div>
                    {teacher.mainClass ? (
                      <div className="flex items-center justify-between bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                        <span className="font-semibold text-yellow-800">{teacher.mainClass.name}</span>
                        <button
                          onClick={() => removeMainClass(teacher.id, `${teacher.firstName} ${teacher.lastName}`)}
                          className="text-red-500 hover:text-red-700 p-1 hover:bg-red-100 rounded-full"
                          title="Retirer le rôle de professeur principal"
                        >
                          <Icon icon="fa-times" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-gray-400 italic bg-gray-50 p-3 rounded-lg text-center">
                        Aucune classe principale assignée
                      </div>
                    )}
                  </div>

                  {/* Matières enseignées */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <Icon icon="fa-book" className="text-gray-500" />
                        <span className="font-medium">Matières enseignées</span>
                      </div>
                      {teacher.subjects && teacher.subjects.length > 0 && (
                        <button
                          onClick={() => prepareSubjectsAssign(teacher)}
                          className="text-xs text-green-600 hover:text-green-800"
                        >
                          Gérer
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 min-h-[40px]">
                      {teacher.subjects && teacher.subjects.length > 0 ? (
                        teacher.subjects.map(subject => (
                          <div 
                            key={subject.id} 
                            className="relative group"
                          >
                            <span 
                              className="text-xs px-3 py-1.5 rounded-full font-medium pr-8"
                              style={{ 
                                backgroundColor: subject.color ? `${subject.color}20` : '#e6f0ff',
                                color: subject.color ? subject.color : '#2563eb'
                              }}
                            >
                              {subject.name}
                            </span>
                            <button
                              onClick={() => removeSubject(teacher.id, subject.id, subject.name)}
                              className="absolute right-1 top-1/2 -translate-y-1/2 text-red-500 opacity-0 group-hover:opacity-100 transition hover:text-red-700"
                              title={`Retirer ${subject.name}`}
                            >
                              <Icon icon="fa-times" className="text-xs" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-400 italic text-sm">Aucune matière assignée</span>
                      )}
                    </div>
                  </div>

                  {/* Classes assignées */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <Icon icon="fa-chalkboard-teacher" className="text-gray-500" />
                        <span className="font-medium">Classes où il enseigne</span>
                      </div>
                      {assignedClasses.length > 0 && (
                        <button
                          onClick={() => removeAllClasses(teacher.id, `${teacher.firstName} ${teacher.lastName}`)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Tout retirer
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 min-h-[40px]">
                      {assignedClasses.length > 0 ? (
                        assignedClasses.map((cls: any) => (
                          <div 
                            key={`${cls.id}-${cls.subject?.id}`} 
                            className="relative group"
                          >
                            <span 
                              className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-full font-medium flex items-center gap-1 pr-8"
                            >
                              <Icon icon="fa-users" className="text-xs" />
                              {cls.name} ({cls.subject?.name})
                            </span>
                            <button
                              onClick={() => removeClass(teacher.id, cls.id, cls.subject?.id, cls.name, cls.subject?.name)}
                              className="absolute right-1 top-1/2 -translate-y-1/2 text-red-500 opacity-0 group-hover:opacity-100 transition hover:text-red-700"
                              title={`Retirer ${cls.name}`}
                            >
                              <Icon icon="fa-times" className="text-xs" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-400 italic text-sm">Aucune classe assignée</span>
                      )}
                    </div>
                  </div>

                  {/* Statistiques */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-gray-900">{teacher.subjects?.length || 0}</p>
                      <p className="text-xs text-gray-500">Matières</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-gray-900">{assignedClasses.length}</p>
                      <p className="text-xs text-gray-500">Classes</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => viewTeacherDetails(teacher)}
                      className="flex-1 bg-blue-50 text-blue-600 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-100 transition flex items-center justify-center gap-2"
                    >
                      <Icon icon="fa-eye" />
                      Détails
                    </button>

                    <button
                      onClick={() => {
                        setAssignData({ teacherId: teacher.id, classId: '' });
                        openModal('assign');
                      }}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
                        teacher.mainClass 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                      }`}
                      disabled={!!teacher.mainClass}
                    >
                      <Icon icon="fa-crown" />
                      {teacher.mainClass ? 'Principal' : 'Assigner'}
                    </button>

                    <button
                      onClick={() => prepareClassAssign(teacher)}
                      className="w-12 h-10 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition flex items-center justify-center"
                      title="Assigner une classe"
                    >
                      <Icon icon="fa-plus" />
                    </button>

                    <button
                      onClick={() => prepareEdit(teacher)}
                      className="w-12 h-10 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition flex items-center justify-center"
                    >
                      <Icon icon="fa-edit" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL AJOUT PROFESSEUR */}
      {activeModal === 'add' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-2">
              <h3 className="text-xl font-bold text-gray-900">
                <Icon icon="fa-user-plus" className="text-blue-500 mr-2" />
                Nouveau Professeur
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <Icon icon="fa-times" className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                  <input 
                    type="text"
                    required
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    value={newTeacher.firstName}
                    onChange={e => setNewTeacher({...newTeacher, firstName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input 
                    type="text"
                    required
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    value={newTeacher.lastName}
                    onChange={e => setNewTeacher({...newTeacher, lastName: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Spécialité</label>
                <input 
                  type="text"
                  placeholder="ex: Mathématiques, Français..."
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  value={newTeacher.specialty}
                  onChange={e => setNewTeacher({...newTeacher, specialty: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input 
                  type="email"
                  required
                  placeholder="professeur@email.com"
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  value={newTeacher.email}
                  onChange={e => setNewTeacher({...newTeacher, email: e.target.value})}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Un email sera envoyé avec le mot de passe généré automatiquement
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Photo (URL)</label>
                <input 
                  type="url"
                  placeholder="https://exemple.com/photo.jpg"
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  value={newTeacher.photo}
                  onChange={e => setNewTeacher({...newTeacher, photo: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input 
                  type="tel"
                  placeholder="+235 XX XX XX XX"
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  value={newTeacher.phone}
                  onChange={e => setNewTeacher({...newTeacher, phone: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Matières (optionnel)</label>
                <select
                  multiple
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 min-h-[120px]"
                  value={newTeacher.subjectIds}
                  onChange={(e) => {
                    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                    setNewTeacher({...newTeacher, subjectIds: selectedOptions});
                  }}
                >
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id} className="text-gray-900">
                      {subject.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Maintenez Ctrl pour sélectionner plusieurs matières</p>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button 
                  type="button" 
                  onClick={closeModal} 
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

      {/* MODAL MODIFICATION PROFESSEUR */}
      {activeModal === 'edit' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                <Icon icon="fa-edit" className="text-blue-500 mr-2" />
                Modifier le Professeur
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <Icon icon="fa-times" className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                  <input 
                    type="text"
                    required
                    className="w-full border border-gray-300 p-3 rounded-lg text-gray-900"
                    value={editTeacher.firstName}
                    onChange={e => setEditTeacher({...editTeacher, firstName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input 
                    type="text"
                    required
                    className="w-full border border-gray-300 p-3 rounded-lg text-gray-900"
                    value={editTeacher.lastName}
                    onChange={e => setEditTeacher({...editTeacher, lastName: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Spécialité</label>
                <input 
                  type="text"
                  required
                  className="w-full border border-gray-300 p-3 rounded-lg text-gray-900"
                  value={editTeacher.specialty}
                  onChange={e => setEditTeacher({...editTeacher, specialty: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Photo (URL)</label>
                <input 
                  type="url"
                  className="w-full border border-gray-300 p-3 rounded-lg text-gray-900"
                  value={editTeacher.photo}
                  onChange={e => setEditTeacher({...editTeacher, photo: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input 
                  type="tel"
                  className="w-full border border-gray-300 p-3 rounded-lg text-gray-900"
                  value={editTeacher.phone}
                  onChange={e => setEditTeacher({...editTeacher, phone: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email"
                  className="w-full border border-gray-300 p-3 rounded-lg text-gray-900 bg-gray-100"
                  value={editTeacher.email}
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={closeModal} 
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
                      Modification...
                    </>
                  ) : (
                    <>
                      <Icon icon="fa-save" />
                      Enregistrer
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHANGEMENT MOT DE PASSE */}
      {activeModal === 'password' && selectedTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                <Icon icon="fa-key" className="text-orange-500 mr-2" />
                Changer le mot de passe
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <Icon icon="fa-times" className="text-xl" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Professeur: <span className="font-semibold">{selectedTeacher.firstName} {selectedTeacher.lastName}</span>
              <br />
              Email: <span className="font-semibold">{selectedTeacher.user?.email}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <input 
                    type={passwordData.showPassword ? "text" : "password"}
                    className="w-full border border-gray-300 p-3 rounded-lg text-gray-900 pr-10"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    placeholder="Laisser vide pour générer automatiquement"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordData({...passwordData, showPassword: !passwordData.showPassword})}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    <Icon icon={passwordData.showPassword ? "fa-eye-slash" : "fa-eye"} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le mot de passe
                </label>
                <input 
                  type={passwordData.showPassword ? "text" : "password"}
                  className="w-full border border-gray-300 p-3 rounded-lg text-gray-900"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  placeholder="Confirmer"
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
                <Icon icon="fa-info-circle" className="mr-1" />
                Si vous laissez le champ vide, un mot de passe sécurisé sera généré automatiquement.
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={closeModal} 
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleChangePassword}
                  // disabled={actionLoading || (passwordData.newPassword && passwordData.newPassword !== passwordData.confirmPassword)}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <Icon icon="fa-spinner" className="fa-spin" />
                      Modification...
                    </>
                  ) : (
                    <>
                      <Icon icon="fa-check" />
                      Changer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ASSIGNATION MATIÈRES */}
      {activeModal === 'subjects' && selectedTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                <Icon icon="fa-book" className="text-green-500 mr-2" />
                Gérer les matières
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <Icon icon="fa-times" className="text-xl" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Professeur: <span className="font-semibold">{selectedTeacher.firstName} {selectedTeacher.lastName}</span>
              </p>

              <p className="text-sm text-gray-600">
                Sélectionnez les matières enseignées par ce professeur
              </p>

              <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto p-2">
                {subjects.map(subject => (
                  <label key={subject.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={subjectsData.subjectIds.includes(subject.id)}
                      onChange={() => handleSubjectSelection(subject.id)}
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <span className="text-gray-900">{subject.name}</span>
                  </label>
                ))}
              </div>

              <div className="text-sm text-gray-600">
                {subjectsData.subjectIds.length} matière(s) sélectionnée(s)
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={closeModal} 
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Annuler
                </button>
                <button 
                  onClick={assignSubjects}
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

      {/* MODAL ASSIGNATION CLASSE PRINCIPALE */}
      {activeModal === 'assign' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                <Icon icon="fa-crown" className="text-yellow-500 mr-2" />
                Assigner une classe principale
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <Icon icon="fa-times" className="text-xl" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Classe
                </label>
                <select 
                  className="w-full border border-gray-300 p-3 rounded-lg text-gray-900"
                  value={assignData.classId}
                  onChange={(e) => setAssignData({...assignData, classId: e.target.value})}
                >
                  <option value="" className="text-gray-900">Sélectionner une classe...</option>
                  {classes
                    .filter(c => !c.mainTeacher || c.mainTeacher.id === assignData.teacherId)
                    .map(cls => (
                      <option key={cls.id} value={cls.id} className="text-gray-900">
                        {cls.name} ({cls.level}) - {cls._count?.students || 0} élèves
                      </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Le professeur deviendra responsable de cette classe
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={closeModal} 
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Annuler
                </button>
                <button 
                  onClick={assignMainClass}
                  disabled={!assignData.classId || actionLoading}
                  className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <Icon icon="fa-spinner" className="fa-spin" />
                      Assignation...
                    </>
                  ) : (
                    <>
                      <Icon icon="fa-check" />
                      Assigner
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ASSIGNATION CLASSE (COURS) */}
      {activeModal === 'assign-class' && selectedTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                <Icon icon="fa-chalkboard-teacher" className="text-green-500 mr-2" />
                Assigner une classe
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <Icon icon="fa-times" className="text-xl" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Professeur: <span className="font-semibold">{selectedTeacher.firstName} {selectedTeacher.lastName}</span>
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Classe
                </label>
                <select 
                  className="w-full border border-gray-300 p-3 rounded-lg text-gray-900"
                  value={assignClassData.classId}
                  onChange={(e) => setAssignClassData({...assignClassData, classId: e.target.value})}
                >
                  <option value="" className="text-gray-900">Sélectionner une classe...</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id} className="text-gray-900">
                      {cls.name} ({cls.level}) - {cls._count?.students || 0} élèves
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Matière
                </label>
                <select 
                  className="w-full border border-gray-300 p-3 rounded-lg text-gray-900"
                  value={assignClassData.subjectId}
                  onChange={(e) => setAssignClassData({...assignClassData, subjectId: e.target.value})}
                >
                  <option value="" className="text-gray-900">Sélectionner une matière...</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id} className="text-gray-900">
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coefficient
                </label>
                <input 
                  type="number"
                  min="1"
                  max="10"
                  className="w-full border border-gray-300 p-3 rounded-lg text-gray-900"
                  value={assignClassData.coefficient}
                  onChange={(e) => setAssignClassData({...assignClassData, coefficient: parseInt(e.target.value) || 1})}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={closeModal} 
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Annuler
                </button>
                <button 
                  onClick={assignClass}
                  disabled={!assignClassData.classId || !assignClassData.subjectId || actionLoading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <Icon icon="fa-spinner" className="fa-spin" />
                      Assignation...
                    </>
                  ) : (
                    <>
                      <Icon icon="fa-check" />
                      Assigner
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DÉTAILS PROFESSEUR */}
      {activeModal === 'details' && selectedTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-2 border-b z-10">
              <div className="flex items-center gap-3">
                {selectedTeacher.photo ? (
                  <img 
                    src={selectedTeacher.photo} 
                    alt={`${selectedTeacher.firstName} ${selectedTeacher.lastName}`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {selectedTeacher.firstName[0]}{selectedTeacher.lastName[0]}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedTeacher.firstName} {selectedTeacher.lastName}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedTeacher.specialty || 'Aucune spécialité'}</p>
                </div>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <Icon icon="fa-times" className="text-xl" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Informations de contact */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                    <Icon icon="fa-phone" className="text-gray-600" />
                    Téléphone
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedTeacher.phone || 'Non renseigné'}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                    <Icon icon="fa-envelope" className="text-gray-600" />
                    Email
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedTeacher.user?.email || 'Non renseigné'}
                  </p>
                </div>
              </div>

              {/* Classe principale avec bouton de retrait */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-yellow-700 flex items-center gap-2">
                    <Icon icon="fa-crown" />
                    Classe principale
                  </p>
                  {selectedTeacher.mainClass && (
                    <button
                      onClick={() => {
                        closeModal();
                        removeMainClass(selectedTeacher.id, `${selectedTeacher.firstName} ${selectedTeacher.lastName}`);
                      }}
                      className="text-red-500 hover:text-red-700 transition p-1 hover:bg-red-50 rounded-full"
                      title="Retirer le rôle de professeur principal"
                    >
                      <Icon icon="fa-times" />
                    </button>
                  )}
                </div>
                {selectedTeacher.mainClass ? (
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-yellow-800">{selectedTeacher.mainClass.name}</span>
                    <span className="text-sm bg-yellow-100 px-3 py-1 rounded-full text-yellow-800">
                      {selectedTeacher.mainClass.level} • {selectedTeacher.mainClass._count?.students || 0} élèves
                    </span>
                  </div>
                ) : (
                  <p className="text-yellow-600 italic">Aucune classe principale assignée</p>
                )}
              </div>

              {/* Matières enseignées */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                    <Icon icon="fa-book" />
                    Matières enseignées ({selectedTeacher.subjects?.length || 0})
                  </h4>
                  <button
                    onClick={() => {
                      closeModal();
                      prepareSubjectsAssign(selectedTeacher);
                    }}
                    className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm hover:bg-green-100 transition flex items-center gap-2"
                  >
                    <Icon icon="fa-plus" />
                    Gérer
                  </button>
                </div>
                
                {selectedTeacher.subjects && selectedTeacher.subjects.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedTeacher.subjects.map((subject) => (
                      <div 
                        key={subject.id} 
                        className="relative group px-3 py-2 rounded-lg flex items-center gap-2 pr-8"
                        style={{ 
                          backgroundColor: subject.color ? `${subject.color}20` : '#e6f0ff',
                          color: subject.color ? subject.color : '#2563eb'
                        }}
                      >
                        <span className="font-medium">{subject.name}</span>
                        <button
                          onClick={() => removeSubject(selectedTeacher.id, subject.id, subject.name)}
                          className="absolute right-1 top-1/2 -translate-y-1/2 text-red-500 opacity-0 group-hover:opacity-100 transition hover:text-red-700"
                          title={`Retirer ${subject.name}`}
                        >
                          <Icon icon="fa-times" className="text-sm" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Icon icon="fa-book" className="text-3xl text-gray-300 mb-2" />
                    <p className="text-gray-500">Aucune matière assignée</p>
                  </div>
                )}
              </div>

              {/* Classes assignées */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                    <Icon icon="fa-chalkboard-teacher" />
                    Classes où il enseigne ({getTeacherClasses(selectedTeacher).length})
                  </h4>
                  <div className="flex gap-2">
                    {getTeacherClasses(selectedTeacher).length > 0 && (
                      <button
                        onClick={() => removeAllClasses(selectedTeacher.id, `${selectedTeacher.firstName} ${selectedTeacher.lastName}`)}
                        className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm hover:bg-red-100 transition flex items-center gap-2"
                      >
                        <Icon icon="fa-trash" />
                        Tout retirer
                      </button>
                    )}
                    <button
                      onClick={() => {
                        closeModal();
                        prepareClassAssign(selectedTeacher);
                      }}
                      className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm hover:bg-green-100 transition flex items-center gap-2"
                    >
                      <Icon icon="fa-plus" />
                      Ajouter
                    </button>
                  </div>
                </div>

                {getTeacherClasses(selectedTeacher).length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {getTeacherClasses(selectedTeacher).map((cls: any) => (
                      <div key={`${cls.id}-${cls.subject?.id}`} className="bg-green-50 p-3 rounded-lg border border-green-100 relative group">
                        <button
                          onClick={() => removeClass(selectedTeacher.id, cls.id, cls.subject?.id, cls.name, cls.subject?.name)}
                          className="absolute top-1 right-1 text-red-500 opacity-0 group-hover:opacity-100 transition hover:text-red-700"
                          title="Retirer cette classe"
                        >
                          <Icon icon="fa-times" className="text-sm" />
                        </button>
                        <p className="font-medium text-green-800">{cls.name}</p>
                        <p className="text-xs text-green-600">{cls.level}</p>
                        <p className="text-xs text-green-600 mt-1">Matière: {cls.subject?.name}</p>
                        <p className="text-xs text-green-600">Coefficient: {cls.coefficient || 1}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Icon icon="fa-school" className="text-3xl text-gray-300 mb-2" />
                    <p className="text-gray-500">Aucune classe assignée</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button 
                onClick={() => {
                  closeModal();
                  prepareEdit(selectedTeacher);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Icon icon="fa-edit" />
                Modifier
              </button>
              <button 
                onClick={() => {
                  closeModal();
                  preparePasswordChange(selectedTeacher);
                }}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
              >
                <Icon icon="fa-key" />
                Mot de passe
              </button>
              <button 
                onClick={closeModal}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}