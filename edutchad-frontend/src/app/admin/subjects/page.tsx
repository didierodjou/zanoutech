'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/Icon';

interface Subject {
  id: string;
  name: string;
  color: string;
  category: string;
  _count?: {
    teachers: number;
    courses: number;
  };
  teachers?: Teacher[];
  courses?: Course[];
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string;
}

interface Course {
  id: string;
  class: {
    id: string;
    name: string;
    level: string;
  };
}

interface Class {
  id: string;
  name: string;
  level: string;
}

export default function SubjectsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  
  // États pour les modals
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // États pour la recherche et les filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // État pour le tableau réduisible
  const [showTable, setShowTable] = useState(true);
  
  // État pour la grille des cartes réduisible
  const [showCards, setShowCards] = useState(true);

  // Formulaire nouvelle matière
  const [newSubject, setNewSubject] = useState({
    name: '',
    color: '#3498db',
    category: 'LITTERAIRE'
  });

  // Formulaire modification
  const [editSubject, setEditSubject] = useState({
    id: '',
    name: '',
    color: '#3498db',
    category: 'LITTERAIRE'
  });

  // Formulaire assignation professeurs
  const [assignData, setAssignData] = useState({
    subjectId: '',
    teacherIds: [] as string[]
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Catégories disponibles
  const categories: Array<{ value: string; label: string; icon: 'fa-book' | 'fa-flask'; color: string }> = [
    { value: 'LITTERAIRE', label: 'Littéraire', icon: 'fa-book', color: 'text-purple-600 bg-purple-100' },
    { value: 'SCIENTIFIQUE', label: 'Scientifique', icon: 'fa-flask', color: 'text-blue-600 bg-blue-100' }
  ];

  // Couleurs prédéfinies pour les matières
  const colorOptions = [
    { value: '#3498db', label: 'Bleu', class: 'bg-blue-500' },
    { value: '#2ecc71', label: 'Vert', class: 'bg-green-500' },
    { value: '#e74c3c', label: 'Rouge', class: 'bg-red-500' },
    { value: '#f39c12', label: 'Orange', class: 'bg-orange-500' },
    { value: '#9b59b6', label: 'Violet', class: 'bg-purple-500' },
    { value: '#1abc9c', label: 'Turquoise', class: 'bg-teal-500' },
    { value: '#34495e', label: 'Gris foncé', class: 'bg-gray-700' },
    { value: '#e67e22', label: 'Carotte', class: 'bg-orange-600' },
    { value: '#16a085', label: 'Vert foncé', class: 'bg-green-600' },
    { value: '#c0392b', label: 'Rouge foncé', class: 'bg-red-700' },
  ];

  // Charger toutes les données
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      const [subjectsRes, teachersRes, classesRes] = await Promise.all([
        fetch(`${API_URL}/subjects`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/teachers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/classes`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!subjectsRes.ok) throw new Error('Erreur chargement matières');
      if (!teachersRes.ok) throw new Error('Erreur chargement professeurs');
      if (!classesRes.ok) throw new Error('Erreur chargement classes');

      const subjectsData = await subjectsRes.json();
      const teachersData = await teachersRes.json();
      const classesData = await classesRes.json();

      console.log('Matières chargées:', subjectsData);
      setSubjects(subjectsData);
      setFilteredSubjects(subjectsData);
      setTeachers(teachersData);
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
    let filtered = [...subjects];

    if (searchTerm) {
      filtered = filtered.filter(subject => 
        subject.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(subject => 
        subject.category === categoryFilter
      );
    }

    setFilteredSubjects(filtered);
  }, [searchTerm, categoryFilter, subjects]);

  // Créer une matière
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/subjects`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newSubject)
      });
      
      if (res.ok) {
        alert('✅ Matière créée avec succès !');
        setShowModal(false);
        setNewSubject({ name: '', color: '#3498db', category: 'LITTERAIRE' });
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

  // Modifier une matière
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/subjects/${editSubject.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editSubject.name,
          color: editSubject.color,
          category: editSubject.category
        })
      });
      
      if (res.ok) {
        alert('✅ Matière modifiée avec succès !');
        setShowEditModal(false);
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

  // Voir les détails d'une matière
  const viewSubjectDetails = async (subject: Subject) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/subjects/${subject.id}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const details = await res.json();
        setSelectedSubject(details);
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

  // Assigner des professeurs à une matière
  const assignTeachers = async () => {
    if (!assignData.subjectId || assignData.teacherIds.length === 0) {
      alert('Veuillez sélectionner au moins un professeur');
      return;
    }
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/subjects/${assignData.subjectId}/assign-teachers`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ teacherIds: assignData.teacherIds })
      });

      if (res.ok) {
        alert('✅ Professeurs assignés avec succès !');
        setShowAssignModal(false);
        setAssignData({ subjectId: '', teacherIds: [] });
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

  // Supprimer une matière
  const deleteSubject = async (subjectId: string, subjectName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la matière "${subjectName}" ?`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        alert('✅ Matière supprimée avec succès');
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
  const prepareEdit = (subject: Subject) => {
    setEditSubject({
      id: subject.id,
      name: subject.name,
      color: subject.color || '#3498db',
      category: subject.category || 'LITTERAIRE'
    });
    setShowEditModal(true);
  };

  // Gérer la sélection multiple de professeurs
  const handleTeacherSelection = (teacherId: string) => {
    setAssignData(prev => {
      const newTeacherIds = prev.teacherIds.includes(teacherId)
        ? prev.teacherIds.filter(id => id !== teacherId)
        : [...prev.teacherIds, teacherId];
      return { ...prev, teacherIds: newTeacherIds };
    });
  };

  // Préparer l'assignation
  const prepareAssign = (subject: Subject) => {
    setAssignData({ 
      subjectId: subject.id, 
      teacherIds: subject.teachers?.map(t => t.id) || [] 
    });
    setShowAssignModal(true);
  };

  // Obtenir les noms des classes pour une matière
  const getSubjectClasses = (subject: Subject) => {
    if (!subject.courses || subject.courses.length === 0) {
      return [];
    }
    
    const uniqueClasses = new Map();
    subject.courses.forEach(course => {
      if (course.class) {
        uniqueClasses.set(course.class.id, course.class);
      }
    });
    
    return Array.from(uniqueClasses.values());
  };

  // Obtenir le libellé de la catégorie
  const getCategoryLabel = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  // Obtenir la couleur de la catégorie (version améliorée avec texte blanc)
  const getCategoryColor = (category: string) => {
    if (category === 'LITTERAIRE') {
      return 'bg-purple-600 text-white'; // Fond violet, texte blanc
    } else {
      return 'bg-blue-600 text-white'; // Fond bleu, texte blanc
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen -m-4 md:-m-8 p-4 md:p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Matières</h1>
          <p className="text-gray-600 mt-1">
            <Icon icon="fa-book" className="mr-2 text-gray-600" />
            {filteredSubjects.length} matière{filteredSubjects.length > 1 ? 's' : ''}
          </p>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-md"
        >
          <Icon icon="fa-plus" />
          Nouvelle Matière
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
              <Icon icon="fa-book" className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Matières</p>
              <p className="text-2xl font-bold text-gray-900">{subjects.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
              <Icon icon="fa-book" className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Littéraires</p>
              <p className="text-2xl font-bold text-gray-900">
                {subjects.filter(s => s.category === 'LITTERAIRE').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              <Icon icon="fa-flask" className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Scientifiques</p>
              <p className="text-2xl font-bold text-gray-900">
                {subjects.filter(s => s.category === 'SCIENTIFIQUE').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
              <Icon icon="fa-user-tie" className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Professeurs</p>
              <p className="text-2xl font-bold text-gray-900">{teachers.length}</p>
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
                placeholder="Rechercher une matière..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
              <Icon icon="fa-search" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Filtre par catégorie */}
          <div className="flex gap-3 w-full md:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 min-w-[180px]"
            >
              <option value="">Toutes les catégories</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>

            {(searchTerm || categoryFilter) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('');
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

      {/* TABLEAU DES MATIÈRES */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
        <div 
          className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition"
          onClick={() => setShowTable(!showTable)}
        >
          <div className="flex items-center gap-3">
            <Icon icon={showTable ? "fa-chevron-down" : "fa-chevron-right"} className="text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-800">Liste des matières</h2>
            <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              {filteredSubjects.length}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matière</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Couleur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Professeurs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSubjects.map((subject) => {
                  const subjectClasses = getSubjectClasses(subject);
                  const categoryColor = getCategoryColor(subject.category);
                  
                  return (
                    <tr key={subject.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                            style={{ backgroundColor: subject.color || '#3498db' }}
                          >
                            {subject.name[0]}
                          </div>
                          <span className="font-medium text-gray-900">{subject.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${categoryColor}`}>
                          <Icon icon={subject.category === 'LITTERAIRE' ? 'fa-book' : 'fa-flask'} className="text-xs" />
                          {getCategoryLabel(subject.category)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: subject.color || '#3498db' }}
                          ></div>
                          <span className="text-sm text-gray-600">{subject.color || '#3498db'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">{subject._count?.teachers || 0}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {subjectClasses.length > 0 ? (
                            subjectClasses.slice(0, 2).map(cls => (
                              <span key={cls.id} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                {cls.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-400 italic">-</span>
                          )}
                          {subjectClasses.length > 2 && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                              +{subjectClasses.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => viewSubjectDetails(subject)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                            title="Voir détails"
                          >
                            <Icon icon="fa-eye" />
                          </button>
                          <button
                            onClick={() => prepareAssign(subject)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition"
                            title="Assigner des professeurs"
                          >
                            <Icon icon="fa-user-tie" />
                          </button>
                          <button
                            onClick={() => prepareEdit(subject)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                            title="Modifier"
                          >
                            <Icon icon="fa-edit" />
                          </button>
                          <button
                            onClick={() => deleteSubject(subject.id, subject.name)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition"
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

      {/* SECTION DES CARTES */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div 
          className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition"
          onClick={() => setShowCards(!showCards)}
        >
          <div className="flex items-center gap-3">
            <Icon icon={showCards ? "fa-chevron-down" : "fa-chevron-right"} className="text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-800">Vue en cartes</h2>
            <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              {filteredSubjects.length}
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
                  <p className="text-gray-600">Chargement des matières...</p>
                </div>
              </div>
            ) : filteredSubjects.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <Icon icon="fa-book" className="text-6xl text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-gray-700 mb-2">
                  {subjects.length === 0 ? 'Aucune matière' : 'Aucun résultat'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {subjects.length === 0 
                    ? 'Commencez par ajouter votre première matière'
                    : 'Aucune matière ne correspond à votre recherche'}
                </p>
                {subjects.length === 0 ? (
                  <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
                  >
                    <Icon icon="fa-plus" />
                    Ajouter une matière
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setCategoryFilter('');
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
                {filteredSubjects.map((subject) => {
                  const subjectClasses = getSubjectClasses(subject);
                  const categoryColor = getCategoryColor(subject.category);
                  
                  return (
                    <div 
                      key={subject.id} 
                      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all overflow-hidden"
                    >
                      {/* En-tête avec la couleur de la matière */}
                      <div 
                        className="h-2"
                        style={{ backgroundColor: subject.color || '#3498db' }}
                      ></div>
                      
                      <div className="p-6">
                        {/* Badge avec initiale et catégorie */}
                        <div className="flex items-start justify-between mb-4">
                          <div 
                            className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-md"
                            style={{ backgroundColor: subject.color || '#3498db' }}
                          >
                            {subject.name[0]}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${categoryColor}`}>
                            <Icon icon={subject.category === 'LITTERAIRE' ? 'fa-book' : 'fa-flask'} className="text-xs" />
                            {getCategoryLabel(subject.category)}
                          </span>
                        </div>

                        {/* Nom de la matière */}
                        <div className="mb-4">
                          <h3 className="text-xl font-bold text-gray-900">{subject.name}</h3>
                        </div>

                        {/* Classes où la matière est enseignée */}
                        <div className="mb-4">
                          <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                            <Icon icon="fa-school" className="text-gray-400" />
                            Classes: {subjectClasses.length}
                          </p>
                          <div className="flex flex-wrap gap-1 min-h-[32px]">
                            {subjectClasses.length > 0 ? (
                              subjectClasses.slice(0, 3).map(cls => (
                                <span key={cls.id} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                  {cls.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400 italic">Aucune classe</span>
                            )}
                            {subjectClasses.length > 3 && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                +{subjectClasses.length - 3}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Statistiques */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                          <div className="bg-gray-50 p-3 rounded-lg text-center">
                            <p className="text-2xl font-bold text-gray-900">{subject._count?.teachers || 0}</p>
                            <p className="text-xs text-gray-500">Professeurs</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg text-center">
                            <p className="text-2xl font-bold text-gray-900">{subjectClasses.length}</p>
                            <p className="text-xs text-gray-500">Classes</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => viewSubjectDetails(subject)}
                            className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition flex items-center justify-center gap-2"
                          >
                            <Icon icon="fa-eye" />
                            Détails
                          </button>
                          <button
                            onClick={() => prepareEdit(subject)}
                            className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition flex items-center justify-center"
                            title="Modifier"
                          >
                            <Icon icon="fa-edit" />
                          </button>
                          <button
                            onClick={() => deleteSubject(subject.id, subject.name)}
                            className="w-10 h-10 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition flex items-center justify-center"
                            title="Supprimer"
                          >
                            <Icon icon="fa-trash" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL AJOUT MATIÈRE */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                <Icon icon="fa-plus-circle" className="text-blue-500 mr-2" />
                Nouvelle Matière
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <Icon icon="fa-times" className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la matière <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  required
                  placeholder="ex: Mathématiques, Français..."
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  value={newSubject.name}
                  onChange={e => setNewSubject({...newSubject, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      className={`p-3 rounded-lg border-2 transition flex items-center justify-center gap-2 ${
                        newSubject.category === cat.value 
                          ? cat.value === 'LITTERAIRE' 
                            ? 'border-purple-600 bg-purple-600 text-white' 
                            : 'border-blue-600 bg-blue-600 text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => setNewSubject({...newSubject, category: cat.value})}
                    >
                      <Icon icon={cat.icon} className={newSubject.category === cat.value ? 'text-white' : cat.color.split(' ')[0]} />
                      <span className="font-medium">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Couleur
                </label>
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {colorOptions.map(color => (
                    <button
                      key={color.value}
                      type="button"
                      className={`w-10 h-10 rounded-lg ${color.class} hover:scale-110 transition ${
                        newSubject.color === color.value ? 'ring-4 ring-blue-300 scale-110' : ''
                      }`}
                      onClick={() => setNewSubject({...newSubject, color: color.value})}
                      title={color.label}
                    ></button>
                  ))}
                </div>
                <input 
                  type="text"
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  value={newSubject.color}
                  onChange={e => setNewSubject({...newSubject, color: e.target.value})}
                  placeholder="#3498db"
                />
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

      {/* MODAL MODIFICATION MATIÈRE */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                <Icon icon="fa-edit" className="text-blue-500 mr-2" />
                Modifier la matière
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <Icon icon="fa-times" className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la matière
                </label>
                <input 
                  type="text"
                  required
                  className="w-full border border-gray-300 p-3 rounded-lg text-gray-900"
                  value={editSubject.name}
                  onChange={e => setEditSubject({...editSubject, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      className={`p-3 rounded-lg border-2 transition flex items-center justify-center gap-2 ${
                        editSubject.category === cat.value 
                          ? cat.value === 'LITTERAIRE' 
                            ? 'border-purple-600 bg-purple-600 text-white' 
                            : 'border-blue-600 bg-blue-600 text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => setEditSubject({...editSubject, category: cat.value})}
                    >
                      <Icon icon={cat.icon} className={editSubject.category === cat.value ? 'text-white' : cat.color.split(' ')[0]} />
                      <span className="font-medium">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Couleur
                </label>
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {colorOptions.map(color => (
                    <button
                      key={color.value}
                      type="button"
                      className={`w-10 h-10 rounded-lg ${color.class} hover:scale-110 transition ${
                        editSubject.color === color.value ? 'ring-4 ring-blue-300 scale-110' : ''
                      }`}
                      onClick={() => setEditSubject({...editSubject, color: color.value})}
                      title={color.label}
                    ></button>
                  ))}
                </div>
                <input 
                  type="text"
                  className="w-full border border-gray-300 p-3 rounded-lg text-gray-900"
                  value={editSubject.color}
                  onChange={e => setEditSubject({...editSubject, color: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)} 
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

      {/* MODAL ASSIGNATION PROFESSEURS */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                <Icon icon="fa-user-tie" className="text-green-500 mr-2" />
                Assigner des professeurs
              </h3>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600">
                <Icon icon="fa-times" className="text-xl" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Sélectionnez les professeurs qui enseignent cette matière
              </p>

              <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto p-2">
                {teachers.map(teacher => (
                  <label key={teacher.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assignData.teacherIds.includes(teacher.id)}
                      onChange={() => handleTeacherSelection(teacher.id)}
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {teacher.firstName[0]}{teacher.lastName[0]}
                      </div>
                      <div>
                        <span className="text-gray-900 font-medium">{teacher.firstName} {teacher.lastName}</span>
                        <span className="text-xs text-gray-500 block">{teacher.specialty}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="text-sm text-gray-600">
                {assignData.teacherIds.length} professeur(s) sélectionné(s)
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setShowAssignModal(false)} 
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Annuler
                </button>
                <button 
                  onClick={assignTeachers}
                  disabled={assignData.teacherIds.length === 0 || actionLoading}
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
                      Assigner ({assignData.teacherIds.length})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DÉTAILS MATIÈRE */}
      {showDetailsModal && selectedSubject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-2 border-b">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl font-bold"
                  style={{ backgroundColor: selectedSubject.color || '#3498db' }}
                >
                  {selectedSubject.name[0]}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedSubject.name}</h3>
                  <p className="text-sm text-gray-500">ID: {selectedSubject.id.slice(0, 8)}...</p>
                </div>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600">
                <Icon icon="fa-times" className="text-xl" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Informations générales */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 flex items-center gap-2 mb-2">
                    <Icon icon="fa-tags" />
                    Catégorie
                  </p>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-1 ${getCategoryColor(selectedSubject.category)}`}>
                    <Icon icon={selectedSubject.category === 'LITTERAIRE' ? 'fa-book' : 'fa-flask'} className="text-xs" />
                    {getCategoryLabel(selectedSubject.category)}
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 flex items-center gap-2 mb-2">
                    <Icon icon="fa-palette" />
                    Couleur
                  </p>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg"
                      style={{ backgroundColor: selectedSubject.color || '#3498db' }}
                    ></div>
                    <span className="text-gray-900 font-mono">{selectedSubject.color || '#3498db'}</span>
                  </div>
                </div>
              </div>

              {/* Statistiques */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Icon icon="fa-user-tie" />
                    Professeurs
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{selectedSubject._count?.teachers || 0}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Icon icon="fa-school" />
                    Classes
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{getSubjectClasses(selectedSubject).length}</p>
                </div>
              </div>

              {/* Liste des professeurs */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Icon icon="fa-user-tie" />
                  Professeurs assignés ({selectedSubject.teachers?.length || 0})
                </h4>
                
                {selectedSubject.teachers && selectedSubject.teachers.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {selectedSubject.teachers.map((teacher) => (
                      <div key={teacher.id} className="bg-gray-50 p-3 rounded-lg flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {teacher.firstName[0]}{teacher.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{teacher.firstName} {teacher.lastName}</p>
                          <p className="text-xs text-gray-500">{teacher.specialty}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Icon icon="fa-user-tie" className="text-3xl text-gray-300 mb-2" />
                    <p className="text-gray-500">Aucun professeur assigné</p>
                  </div>
                )}
              </div>

              {/* Liste des classes */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Icon icon="fa-school" />
                  Classes où la matière est enseignée ({getSubjectClasses(selectedSubject).length})
                </h4>
                
                {getSubjectClasses(selectedSubject).length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {getSubjectClasses(selectedSubject).map((cls) => (
                      <div key={cls.id} className="bg-green-50 p-3 rounded-lg border border-green-100">
                        <p className="font-medium text-green-800">{cls.name}</p>
                        <p className="text-xs text-green-600">{cls.level}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Icon icon="fa-school" className="text-3xl text-gray-300 mb-2" />
                    <p className="text-gray-500">Aucune classe</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button 
                onClick={() => {
                  setShowDetailsModal(false);
                  prepareAssign(selectedSubject);
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Icon icon="fa-user-tie" className="mr-2" />
                Gérer les professeurs
              </button>
              <button 
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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