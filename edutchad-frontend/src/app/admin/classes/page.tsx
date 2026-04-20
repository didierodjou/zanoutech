'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';

// --- INTERFACES ---
interface Course {
  id: string;
  subject: {
    id: string;
    name: string;
    color?: string;
  };
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  registrationNo: string;
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
}

interface ClassData {
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
  students?: Student[];
  courses?: Course[];
}

// --- COMPOSANT PRINCIPAL ---
export default function ClassesPage() {
  // États de données
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<ClassData[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  
  // États des Modals
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignTeacherModal, setShowAssignTeacherModal] = useState(false);
  
  // États de sélection et chargement
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // États de recherche et filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('');

  // États des formulaires
  const [newClass, setNewClass] = useState({ name: '', level: '' });
  const [editClass, setEditClass] = useState({ id: '', name: '', level: '' });
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  // Système de notification
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Fonction utilitaire pour afficher les notifications
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // --- CHARGEMENT DES DONNÉES ---
  const fetchClasses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/classes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Erreur chargement classes');
      
      const data = await res.json();
      setClasses(data);
      setFilteredClasses(data);
    } catch (error) {
      showToast('error', 'Impossible de charger les classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/teachers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setTeachers(await res.json());
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  // Filtrage dynamique
  useEffect(() => {
    let filtered = [...classes];
    if (searchTerm) {
      filtered = filtered.filter(cls => 
        cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.level.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (levelFilter) {
      filtered = filtered.filter(cls => cls.level === levelFilter);
    }
    setFilteredClasses(filtered);
  }, [searchTerm, levelFilter, classes]);

  // --- ACTIONS (CRUD) ---

  // 1. Créer
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/classes`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newClass)
      });
      
      if (res.ok) {
        showToast('success', 'Classe créée avec succès !');
        setShowModal(false);
        setNewClass({ name: '', level: '' });
        fetchClasses();
      } else {
        const errorText = await res.text();
        try {
            const jsonError = JSON.parse(errorText);
            showToast('error', jsonError.message || errorText);
        } catch {
            showToast('error', errorText);
        }
      }
    } catch (error) {
      showToast('error', 'Erreur de connexion serveur');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Modifier
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/classes/${editClass.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: editClass.name, level: editClass.level })
      });
      
      if (res.ok) {
        showToast('success', 'Classe modifiée avec succès');
        setShowEditModal(false);
        fetchClasses();
      } else {
        showToast('error', 'Erreur lors de la modification');
      }
    } catch (error) {
      showToast('error', 'Erreur de connexion');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Supprimer
  const deleteClass = async (classId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette classe ?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/classes/${classId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();

      if (res.ok) {
        showToast('success', 'Classe supprimée avec succès');
        fetchClasses();
      } else {
        const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
        showToast('error', msg || 'Erreur lors de la suppression');
      }
    } catch (error) {
      showToast('error', 'Erreur de connexion serveur');
    }
  };

  // 4. Assigner Prof Principal
  const assignMainTeacher = async () => {
    if (!selectedClass || !selectedTeacherId) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/classes/${selectedClass.id}/assign-teacher`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ teacherId: selectedTeacherId })
      });

      if (res.ok) {
        showToast('success', 'Professeur principal assigné !');
        setShowAssignTeacherModal(false);
        setSelectedTeacherId('');
        fetchClasses();
      } else {
        showToast('error', "Erreur lors de l'assignation");
      }
    } catch (error) {
      showToast('error', 'Erreur réseau');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Voir Détails
  const viewClassDetails = async (cls: ClassData) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/classes/${cls.id}/details`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const details = await res.json();
        setSelectedClass(details);
        setShowDetailsModal(true);
      } else {
        showToast('error', 'Impossible de charger les détails');
      }
    } catch (error) {
      showToast('error', 'Erreur réseau');
    } finally {
      setActionLoading(false);
    }
  };

  const prepareEdit = (cls: ClassData) => {
    setEditClass({ id: cls.id, name: cls.name, level: cls.level });
    setShowEditModal(true);
  };

  const uniqueLevels = [...new Set(classes.map(c => c.level))];

  // --- RENDER ---
  return (
    <div className="p-8 relative bg-gray-50 min-h-screen">
      
      {/* --- COMPOSANT TOAST (Notification) --- */}
      {toast && (
        <div className={`fixed top-24 right-8 z-50 px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-slide-in text-white ${
          toast.type === 'success' ? 'bg-gradient-to-r from-green-600 to-green-700' : 'bg-gradient-to-r from-red-600 to-red-700'
        }`}>
          <Icon icon={toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} className="text-xl text-white" />
          <div>
            <h4 className="font-bold text-sm text-white">{toast.type === 'success' ? 'Succès' : 'Erreur'}</h4>
            <p className="text-sm text-white opacity-90">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="ml-4 hover:opacity-75 text-white">
            <Icon icon="fa-times" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Classes</h1>
          <p className="text-gray-600 mt-1 flex items-center gap-2">
            <Icon icon="fa-chalkboard-teacher" className="text-gray-500" />
            <span>Gérez les classes, les effectifs et les professeurs principaux</span>
          </p>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-md"
        >
          <Icon icon="fa-plus" className="text-white" />
          <span className="font-medium">Nouvelle Classe</span>
        </button>
      </div>

      {/* Stats rapides - Version améliorée avec meilleure lisibilité */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Icon icon="fa-school" className="text-xl text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Classes</p>
              <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Icon icon="fa-user-graduate" className="text-xl text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Élèves</p>
              <p className="text-2xl font-bold text-gray-900">
                {classes.reduce((acc, c) => acc + (c._count?.students || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Icon icon="fa-chalkboard" className="text-xl text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Niveaux</p>
              <p className="text-2xl font-bold text-gray-900">{uniqueLevels.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Icon icon="fa-crown" className="text-xl text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Avec principal</p>
              <p className="text-2xl font-bold text-gray-900">
                {classes.filter(c => c.mainTeacher).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres - Version améliorée */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Rechercher une classe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
            />
            <Icon icon="fa-search" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 min-w-[180px]"
          >
            <option value="" className="text-gray-500">Tous les niveaux</option>
            {uniqueLevels.map(lvl => (
              <option key={lvl} value={lvl} className="text-gray-900">{lvl}</option>
            ))}
          </select>
          {(searchTerm || levelFilter) && (
            <button
              onClick={() => { setSearchTerm(''); setLevelFilter(''); }}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
            >
              <Icon icon="fa-times" />
              <span>Réinitialiser</span>
            </button>
          )}
        </div>
      </div>

      {/* Grille des Classes - Version améliorée */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Icon icon="fa-spinner" className="fa-spin text-4xl text-blue-500 mb-4" />
            <p className="text-gray-600">Chargement des classes...</p>
          </div>
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Icon icon="fa-chalkboard-teacher" className="text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">Aucune classe trouvée</h3>
          <p className="text-gray-500 mb-6">Commencez par créer votre première classe</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
          >
            <Icon icon="fa-plus" />
            Créer une classe
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cls) => (
            <div key={cls.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all overflow-hidden">
              {/* En-tête coloré */}
              <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600"></div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{cls.name}</h3>
                    <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                      <Icon icon="fa-layer-group" className="text-xs" />
                      Niveau {cls.level}
                    </span>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <Icon icon="fa-chalkboard-teacher" className="text-xl" />
                  </div>
                </div>
                
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Icon icon="fa-users" className="text-gray-400" />
                      Effectif
                    </span>
                    <span className="font-bold text-gray-900">{cls._count?.students || 0} élève{cls._count?.students !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Icon icon="fa-crown" className="text-yellow-500" />
                      Principal
                    </span>
                    {cls.mainTeacher ? (
                      <span className="font-medium text-blue-600">
                        {cls.mainTeacher.firstName} {cls.mainTeacher.lastName}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">Non assigné</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-2">
                <button 
                  onClick={() => viewClassDetails(cls)} 
                  className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition flex items-center justify-center gap-2"
                >
                  <Icon icon="fa-eye" className="text-blue-500" />
                  Détails
                </button>
                
                {!cls.mainTeacher && (
                  <button 
                    onClick={() => { setSelectedClass(cls); setShowAssignTeacherModal(true); }} 
                    className="w-10 h-10 bg-green-50 text-green-600 rounded-lg border border-green-200 hover:bg-green-100 transition flex items-center justify-center"
                    title="Assigner un professeur principal"
                  >
                    <Icon icon="fa-crown" />
                  </button>
                )}
                
                <button 
                  onClick={() => prepareEdit(cls)} 
                  className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 hover:bg-blue-100 transition flex items-center justify-center"
                  title="Modifier"
                >
                  <Icon icon="fa-edit" />
                </button>
                
                <button 
                  onClick={() => deleteClass(cls.id)} 
                  className="w-10 h-10 bg-red-50 text-red-600 rounded-lg border border-red-200 hover:bg-red-100 transition flex items-center justify-center"
                  title="Supprimer"
                >
                  <Icon icon="fa-trash" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODALS AMÉLIORÉES --- */}

      {/* Modal Ajout */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Icon icon="fa-plus-circle" className="text-blue-500" />
                Nouvelle Classe
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <Icon icon="fa-times" className="text-xl" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la classe *</label>
                <input 
                  required 
                  type="text" 
                  placeholder="ex: 6ème A" 
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                  value={newClass.name} 
                  onChange={e => setNewClass({...newClass, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Niveau *</label>
                <select 
                  required 
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  value={newClass.level} 
                  onChange={e => setNewClass({...newClass, level: e.target.value})}
                >
                  <option value="" className="text-gray-500">Sélectionner un niveau</option>
                  {['6ème','5ème','4ème','3ème','2nde','1ère','Terminale'].map(l => (
                    <option key={l} value={l} className="text-gray-900">{l}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  Annuler
                </button>
                <button type="submit" disabled={actionLoading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                  {actionLoading ? <Icon icon="fa-spinner" className="fa-spin" /> : <Icon icon="fa-save" />}
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edition */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Icon icon="fa-edit" className="text-blue-500" />
                Modifier la classe
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <Icon icon="fa-times" className="text-xl" />
              </button>
            </div>
            
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la classe *</label>
                <input 
                  required 
                  type="text" 
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  value={editClass.name} 
                  onChange={e => setEditClass({...editClass, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Niveau *</label>
                <select 
                  required 
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  value={editClass.level} 
                  onChange={e => setEditClass({...editClass, level: e.target.value})}
                >
                  {['6ème','5ème','4ème','3ème','2nde','1ère','Terminale'].map(l => (
                    <option key={l} value={l} className="text-gray-900">{l}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  Annuler
                </button>
                <button type="submit" disabled={actionLoading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                  {actionLoading ? <Icon icon="fa-spinner" className="fa-spin" /> : <Icon icon="fa-save" />}
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Assignation */}
      {showAssignTeacherModal && selectedClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Icon icon="fa-crown" className="text-yellow-500" />
                Assigner un professeur principal
              </h3>
              <button onClick={() => setShowAssignTeacherModal(false)} className="text-gray-400 hover:text-gray-600">
                <Icon icon="fa-times" className="text-xl" />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Classe: <span className="font-semibold text-gray-900">{selectedClass.name}</span>
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Professeur principal *</label>
                <select 
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                  value={selectedTeacherId} 
                  onChange={e => setSelectedTeacherId(e.target.value)}
                >
                  <option value="" className="text-gray-500">-- Choisir un professeur --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id} className="text-gray-900">
                      {t.lastName} {t.firstName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => setShowAssignTeacherModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  Annuler
                </button>
                <button 
                  onClick={assignMainTeacher} 
                  disabled={!selectedTeacherId || actionLoading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading ? <Icon icon="fa-spinner" className="fa-spin" /> : <Icon icon="fa-check" />}
                  Assigner
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Détails - Version améliorée */}
      {showDetailsModal && selectedClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Header Modal avec dégradé */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-xl">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Icon icon="fa-chalkboard" className="text-white" />
                    Classe {selectedClass.name}
                  </h3>
                  <p className="text-blue-100 mt-1">Niveau {selectedClass.level}</p>
                </div>
                <button onClick={() => setShowDetailsModal(false)} className="text-white hover:text-gray-200 text-xl">
                  <Icon icon="fa-times"/>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-8">
                
              {/* Section Infos avec cartes améliorées */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200">
                  <p className="text-sm font-semibold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Icon icon="fa-users" className="text-blue-600" />
                    Effectif Total
                  </p>
                  <p className="text-4xl font-bold text-blue-800">
                    {selectedClass.students?.length ?? selectedClass._count?.students ?? 0}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">élève{selectedClass.students?.length !== 1 ? 's' : ''}</p>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-5 rounded-xl border border-orange-200">
                  <p className="text-sm font-semibold text-orange-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Icon icon="fa-crown" className="text-orange-600" />
                    Professeur Principal
                  </p>
                  {selectedClass.mainTeacher ? (
                    <>
                      <p className="text-2xl font-bold text-orange-800">
                        {selectedClass.mainTeacher.firstName} {selectedClass.mainTeacher.lastName}
                      </p>
                      <p className="text-sm text-orange-600 mt-1">Professeur titulaire</p>
                    </>
                  ) : (
                    <p className="text-lg text-orange-400 italic">Non assigné</p>
                  )}
                </div>
              </div>

              {/* Section Liste Élèves avec design amélioré */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h4 className="font-bold text-gray-700 flex items-center gap-2">
                    <Icon icon="fa-user-graduate" className="text-blue-500" />
                    Liste des Élèves ({selectedClass.students?.length || 0})
                  </h4>
                </div>
                
                {selectedClass.students && selectedClass.students.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
                    {selectedClass.students.map((student, idx) => (
                      <div key={student.id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg hover:bg-blue-50 transition">
                        <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{student.lastName} {student.firstName}</p>
                          <p className="text-xs text-gray-500 font-mono">{student.registrationNo}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Icon icon="fa-user-graduate" className="text-5xl text-gray-300 mb-3" />
                    <p className="text-gray-500">Aucun élève inscrit dans cette classe</p>
                  </div>
                )}
              </div>

              {/* Section Cours avec design amélioré */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h4 className="font-bold text-gray-700 flex items-center gap-2">
                    <Icon icon="fa-book" className="text-green-500" />
                    Cours & Matières ({selectedClass.courses?.length || 0})
                  </h4>
                </div>
                
                {selectedClass.courses && selectedClass.courses.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {selectedClass.courses.map((course) => (
                      <div key={course.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: course.subject.color || '#3498db' }}
                          ></div>
                          <span className="font-medium text-gray-900">{course.subject.name}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="flex items-center gap-2">
                            <Icon icon="fa-user-tie" className="text-gray-400" />
                            M. {course.teacher.lastName} {course.teacher.firstName}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Icon icon="fa-book" className="text-5xl text-gray-300 mb-3" />
                    <p className="text-gray-500">Aucun cours programmé pour cette classe</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end">
              <button 
                onClick={() => setShowDetailsModal(false)} 
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <Icon icon="fa-check" />
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}