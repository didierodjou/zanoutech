'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/Icon';

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  department: string;
  hiringDate: string;
  phone?: string | null;
  email?: string | null;
  user?: {
    email: string;
    isActive: boolean;
    createdAt?: string;
  };
  salaries?: Salary[];
  _count?: {
    salaries: number;
  };
}

interface Salary {
  id: string;
  month: string;
  baseAmount: number;
  bonuses: number;
  deductions: number;
  netAmount: number;
  isPaid: boolean;
  paymentDate?: string;
}

export default function StaffPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  
  // États pour les modals - un seul actif à la fois
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // États pour la recherche et les filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  // État pour le tableau réduisible
  const [showTable, setShowTable] = useState(true);
  
  // État pour la grille des cartes réduisible
  const [showCards, setShowCards] = useState(true);

  // Formulaire nouveau membre du personnel
  const [newStaff, setNewStaff] = useState({
    firstName: '',
    lastName: '',
    jobTitle: '',
    department: '',
    hiringDate: '',
    phone: '',
    email: ''
  });

  // Formulaire modification
  const [editStaff, setEditStaff] = useState({
    id: '',
    firstName: '',
    lastName: '',
    jobTitle: '',
    department: '',
    hiringDate: '',
    phone: '',
    email: ''
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Fonctions pour ouvrir/fermer les modals
  const openModal = (modalName: string) => {
    setActiveModal(modalName);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  // Charger toutes les données
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      const staffRes = await fetch(`${API_URL}/staff`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!staffRes.ok) throw new Error('Erreur chargement personnel');

      const staffData = await staffRes.json();

      console.log('Personnel chargé:', staffData);
      setStaff(staffData);
      setFilteredStaff(staffData);

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
    let filtered = [...staff];

    if (searchTerm) {
      filtered = filtered.filter(member => 
        member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (departmentFilter) {
      filtered = filtered.filter(member => 
        member.department === departmentFilter
      );
    }

    setFilteredStaff(filtered);
  }, [searchTerm, departmentFilter, staff]);

  // Créer un membre du personnel
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/staff`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newStaff)
      });
      
      if (res.ok) {
        if (confirm('✅ Membre du personnel créé avec succès !')) {
          closeModal();
          setNewStaff({
            firstName: '',
            lastName: '',
            jobTitle: '',
            department: '',
            hiringDate: '',
            phone: '',
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

  // Modifier un membre du personnel
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const res = await fetch(`${API_URL}/staff/${editStaff.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editStaff)
      });

      const responseData = await res.json();
      
      if (res.ok) {
        if (confirm('✅ Membre modifié avec succès !')) {
          closeModal();
          fetchData();
        }
      } else {
        alert(`❌ Erreur: ${responseData.message || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('Erreur modification:', error);
      alert('❌ Erreur de connexion');
    } finally {
      setActionLoading(false);
    }
  };

  // Voir les détails d'un membre
  const viewStaffDetails = async (member: Staff) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/staff/${member.id}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const details = await res.json();
        setSelectedStaff(details);
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

  // Supprimer un membre
  const deleteStaff = async (staffId: string, staffName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${staffName} ?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/staff/${staffId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        alert('✅ Membre supprimé');
        fetchData();
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
    setNewStaff({
      firstName: '',
      lastName: '',
      jobTitle: '',
      department: '',
      hiringDate: '',
      phone: '',
      email: ''
    });
    openModal('add');
  };

  const prepareEdit = (member: Staff) => {
    setEditStaff({
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      jobTitle: member.jobTitle,
      department: member.department,
      hiringDate: member.hiringDate ? member.hiringDate.split('T')[0] : '',
      phone: member.phone || '',
      email: member.user?.email || ''
    });
    openModal('edit');
  };

  // Obtenir les départements uniques pour le filtre
  const uniqueDepartments = [...new Set(staff.map(m => m.department).filter(Boolean))];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion du Personnel</h1>
          <p className="text-gray-600 mt-1">
            <Icon icon="fa-users" className="mr-2 text-gray-600" />
            {filteredStaff.length} membre{filteredStaff.length > 1 ? 's' : ''} du personnel
          </p>
        </div>
        
        <button 
          onClick={openAddModal}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-md"
        >
          <Icon icon="fa-plus" />
          Nouveau Membre
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
              <Icon icon="fa-users" className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Personnel</p>
              <p className="text-2xl font-bold text-gray-900">{staff.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
              <Icon icon="fa-building" className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Départements</p>
              <p className="text-2xl font-bold text-gray-900">{uniqueDepartments.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
              <Icon icon="fa-briefcase" className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Postes</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(staff.map(m => m.jobTitle)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
              <Icon icon="fa-calendar" className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Ancienneté moy.</p>
              <p className="text-2xl font-bold text-gray-900">2.5 ans</p>
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
                placeholder="Rechercher un membre (nom, prénom, poste, département...)"
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
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 min-w-[150px]"
            >
              <option value="">Tous les départements</option>
              {uniqueDepartments.map(dept => (
                <option key={dept} value={dept} className="text-gray-900">{dept}</option>
              ))}
            </select>

            {(searchTerm || departmentFilter) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setDepartmentFilter('');
                }}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
              >
                <Icon icon="fa-times" />
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* Résultats */}
        <div className="mt-4 text-sm text-gray-600 flex items-center gap-2">
          <Icon icon="fa-info-circle" className="text-gray-600" />
          <span>
            {filteredStaff.length} membre{filteredStaff.length > 1 ? 's' : ''} trouvé{filteredStaff.length > 1 ? 's' : ''}
            {searchTerm && ` pour "${searchTerm}"`}
            {departmentFilter && ` dans ${departmentFilter}`}
          </span>
        </div>
      </div>

      {/* TABLEAU DU PERSONNEL */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Icon icon="fa-spinner" className="fa-spin text-4xl text-blue-500 mb-4" />
            <p className="text-gray-600">Chargement du personnel...</p>
          </div>
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Icon icon="fa-users" className="text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            {staff.length === 0 ? 'Aucun membre' : 'Aucun résultat'}
          </h3>
          <p className="text-gray-500 mb-6">
            {staff.length === 0 
              ? 'Commencez par ajouter votre premier membre du personnel'
              : 'Aucun membre ne correspond à votre recherche'}
          </p>
          {staff.length === 0 ? (
            <button
              onClick={openAddModal}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
            >
              <Icon icon="fa-plus" />
              Ajouter un membre
            </button>
          ) : (
            <button
              onClick={() => {
                setSearchTerm('');
                setDepartmentFilter('');
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
            >
              <Icon icon="fa-times" />
              Effacer les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div 
            className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition"
            onClick={() => setShowTable(!showTable)}
          >
            <div className="flex items-center gap-3">
              <Icon icon={showTable ? "fa-chevron-down" : "fa-chevron-right"} className="text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-800">Liste du personnel</h2>
              <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                {filteredStaff.length}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Membre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Poste</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Département</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date d'embauche</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStaff.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {member.firstName[0]}{member.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{member.firstName} {member.lastName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{member.jobTitle}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                          {member.department}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {new Date(member.hiringDate).toLocaleDateString('fr-FR')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {member.phone && (
                          <p className="text-sm text-gray-600">{member.phone}</p>
                        )}
                        {member.user?.email && (
                          <p className="text-xs text-gray-500">{member.user.email}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => activeModal === null && viewStaffDetails(member)}
                            disabled={activeModal !== null}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition disabled:opacity-50"
                            title="Voir détails"
                          >
                            <Icon icon="fa-eye" />
                          </button>
                          <button
                            onClick={() => activeModal === null && prepareEdit(member)}
                            disabled={activeModal !== null}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition disabled:opacity-50"
                            title="Modifier"
                          >
                            <Icon icon="fa-edit" />
                          </button>
                          <button
                            onClick={() => activeModal === null && deleteStaff(member.id, `${member.firstName} ${member.lastName}`)}
                            disabled={activeModal !== null}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
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
      )}

      {/* SECTION DES CARTES (réduisible) */}
      {filteredStaff.length > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div 
            className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition"
            onClick={() => setShowCards(!showCards)}
          >
            <div className="flex items-center gap-3">
              <Icon icon={showCards ? "fa-chevron-down" : "fa-chevron-right"} className="text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-800">Vue en cartes</h2>
              <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                {filteredStaff.length}
              </span>
            </div>
            <button className="text-gray-500 hover:text-gray-700">
              <Icon icon={showCards ? "fa-compress" : "fa-expand"} />
            </button>
          </div>

          {showCards && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredStaff.map((member) => (
                  <div 
                    key={member.id} 
                    className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all overflow-hidden"
                  >
                    <div className="h-2 bg-gradient-to-r from-green-400 to-green-600"></div>
                    
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-16 h-16 bg-green-500 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-md">
                          {member.firstName[0]}{member.lastName[0]}
                        </div>
                        <span className="text-xs text-gray-500">#{member.id.slice(0, 4)}</span>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {member.firstName} {member.lastName}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{member.jobTitle}</p>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Icon icon="fa-building" className="text-gray-400 w-4" />
                          <span className="text-gray-700">{member.department}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Icon icon="fa-calendar" className="text-gray-400 w-4" />
                          <span className="text-gray-700">
                            Embauché le {new Date(member.hiringDate).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        {member.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Icon icon="fa-phone" className="text-gray-400 w-4" />
                            <span className="text-gray-700">{member.phone}</span>
                          </div>
                        )}
                        {member.user?.email && (
                          <div className="flex items-center gap-2 text-sm truncate">
                            <Icon icon="fa-envelope" className="text-gray-400 w-4" />
                            <span className="text-gray-700 truncate">{member.user.email}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => activeModal === null && viewStaffDetails(member)}
                          disabled={activeModal !== null}
                          className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition disabled:opacity-50"
                        >
                          <Icon icon="fa-eye" className="mr-1" />
                          Détails
                        </button>
                        <button
                          onClick={() => activeModal === null && prepareEdit(member)}
                          disabled={activeModal !== null}
                          className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition disabled:opacity-50"
                        >
                          <Icon icon="fa-edit" />
                        </button>
                        <button
                          onClick={() => activeModal === null && deleteStaff(member.id, `${member.firstName} ${member.lastName}`)}
                          disabled={activeModal !== null}
                          className="w-10 h-10 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                        >
                          <Icon icon="fa-trash" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL AJOUT MEMBRE */}
      {activeModal === 'add' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                <Icon icon="fa-user-plus" className="text-green-500 mr-2" />
                Nouveau Membre du Personnel
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
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
                    className="w-full border border-gray-300 p-3 rounded-lg text-gray-900"
                    value={newStaff.firstName}
                    onChange={e => setNewStaff({...newStaff, firstName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input 
                    type="text"
                    required
                    className="w-full border border-gray-300 p-3 rounded-lg text-gray-900"
                    value={newStaff.lastName}
                    onChange={e => setNewStaff({...newStaff, lastName: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Poste *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ex: Directeur, Secrétaire, Comptable..."
                    className="w-full border border-gray-300 p-3 rounded-lg text-gray-900"
                    value={newStaff.jobTitle}
                    onChange={e => setNewStaff({...newStaff, jobTitle: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Département *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ex: Administration, Comptabilité, Scolarité..."
                    className="w-full border border-gray-300 p-3 rounded-lg text-gray-900"
                    value={newStaff.department}
                    onChange={e => setNewStaff({...newStaff, department: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d'embauche *</label>
                <input 
                  type="date"
                  required
                  className="w-full border border-gray-300 p-3 rounded-lg text-gray-900"
                  value={newStaff.hiringDate}
                  onChange={e => setNewStaff({...newStaff, hiringDate: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input 
                  type="email"
                  required
                  placeholder="membre@etablissement.td"
                  className="w-full border border-gray-300 p-3 rounded-lg text-gray-900"
                  value={newStaff.email}
                  onChange={e => setNewStaff({...newStaff, email: e.target.value})}
                />
                <p className="text-xs text-gray-500 mt-1">
                  L'email servira d'identifiant de connexion (mot de passe par défaut: staff123)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone (optionnel)</label>
                <input 
                  type="tel"
                  placeholder="+235 XX XX XX XX"
                  className="w-full border border-gray-300 p-3 rounded-lg text-gray-900"
                  value={newStaff.phone}
                  onChange={e => setNewStaff({...newStaff, phone: e.target.value})}
                />
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
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
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

      {/* MODAL MODIFICATION MEMBRE */}
      {activeModal === 'edit' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                <Icon icon="fa-edit" className="text-blue-500 mr-2" />
                Modifier le membre
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <Icon icon="fa-times" className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                  <input 
                    type="text"
                    required
                    className="w-full border border-gray-300 p-3 rounded-lg text-gray-900"
                    value={editStaff.firstName}
                    onChange={e => setEditStaff({...editStaff, firstName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input 
                    type="text"
                    required
                    className="w-full border border-gray-300 p-3 rounded-lg text-gray-900"
                    value={editStaff.lastName}
                    onChange={e => setEditStaff({...editStaff, lastName: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Poste *</label>
                  <input 
                    type="text"
                    required
                    className="w-full border border-gray-300 p-3 rounded-lg text-gray-900"
                    value={editStaff.jobTitle}
                    onChange={e => setEditStaff({...editStaff, jobTitle: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Département *</label>
                  <input 
                    type="text"
                    required
                    className="w-full border border-gray-300 p-3 rounded-lg text-gray-900"
                    value={editStaff.department}
                    onChange={e => setEditStaff({...editStaff, department: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d'embauche *</label>
                <input 
                  type="date"
                  required
                  className="w-full border border-gray-300 p-3 rounded-lg text-gray-900"
                  value={editStaff.hiringDate}
                  onChange={e => setEditStaff({...editStaff, hiringDate: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email"
                  className="w-full border border-gray-300 p-3 rounded-lg text-gray-900 bg-gray-100"
                  value={editStaff.email}
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input 
                  type="tel"
                  className="w-full border border-gray-300 p-3 rounded-lg text-gray-900"
                  value={editStaff.phone}
                  onChange={e => setEditStaff({...editStaff, phone: e.target.value})}
                />
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

      {/* MODAL DÉTAILS MEMBRE */}
      {activeModal === 'details' && selectedStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-2 border-b">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {selectedStaff.firstName[0]}{selectedStaff.lastName[0]}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedStaff.firstName} {selectedStaff.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">{selectedStaff.jobTitle}</p>
                </div>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <Icon icon="fa-times" className="text-xl" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Informations générales */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                    <Icon icon="fa-building" />
                    Département
                  </p>
                  <p className="text-lg font-semibold text-gray-900">{selectedStaff.department}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                    <Icon icon="fa-calendar" />
                    Date d'embauche
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(selectedStaff.hiringDate).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>

              {/* Contact */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 flex items-center gap-2 mb-2">
                  <Icon icon="fa-address-card" />
                  Coordonnées
                </p>
                <div className="space-y-2">
                  {selectedStaff.phone && (
                    <div className="flex items-center gap-2">
                      <Icon icon="fa-phone" className="text-gray-500 w-4" />
                      <span className="text-gray-900">{selectedStaff.phone}</span>
                    </div>
                  )}
                  {selectedStaff.user?.email && (
                    <div className="flex items-center gap-2">
                      <Icon icon="fa-envelope" className="text-gray-500 w-4" />
                      <span className="text-gray-900">{selectedStaff.user.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Ancienneté */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700 flex items-center gap-2 mb-2">
                  <Icon icon="fa-clock" />
                  Ancienneté
                </p>
                <p className="text-2xl font-bold text-blue-700">
                  {Math.floor((new Date().getTime() - new Date(selectedStaff.hiringDate).getTime()) / (1000 * 60 * 60 * 24 * 365))} ans
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button 
                onClick={() => {
                  closeModal();
                  prepareEdit(selectedStaff);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Icon icon="fa-edit" className="mr-2" />
                Modifier
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