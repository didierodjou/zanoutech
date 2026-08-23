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

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  const [showTable, setShowTable] = useState(true);
  const [showCards, setShowCards] = useState(true);

  const [newStaff, setNewStaff] = useState({
    firstName: '',
    lastName: '',
    jobTitle: '',
    department: '',
    hiringDate: '',
    phone: '',
    email: ''
  });

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

  const openModal = (modalName: string) => setActiveModal(modalName);
  const closeModal = () => setActiveModal(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/staff`, { credentials: 'include' });
      if (!res.ok) throw new Error('Erreur chargement personnel');
      const data = await res.json();
      setStaff(data);
      setFilteredStaff(data);
    } catch (err) {
      setError('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...staff];
    if (searchTerm) {
      filtered = filtered.filter(m =>
        m.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (departmentFilter) {
      filtered = filtered.filter(m => m.department === departmentFilter);
    }
    setFilteredStaff(filtered);
  }, [searchTerm, departmentFilter, staff]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newStaff)
      });
      if (res.ok) {
        closeModal();
        setNewStaff({ firstName: '', lastName: '', jobTitle: '', department: '', hiringDate: '', phone: '', email: '' });
        fetchData();
      } else {
        const error = await res.text();
        alert(`Erreur: ${error}`);
      }
    } catch {
      alert('Erreur de connexion');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/staff/${editStaff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editStaff)
      });
      if (res.ok) {
        closeModal();
        fetchData();
      } else {
        const err = await res.json();
        alert(`Erreur: ${err.message || 'Inconnue'}`);
      }
    } catch {
      alert('Erreur de connexion');
    } finally {
      setActionLoading(false);
    }
  };

  const viewStaffDetails = async (member: Staff) => {
    try {
      setActionLoading(true);
      const res = await fetch(`${API_URL}/staff/${member.id}/details`, { credentials: 'include' });
      if (res.ok) {
        const details = await res.json();
        setSelectedStaff(details);
        openModal('details');
      }
    } catch {
      alert('Erreur chargement détails');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteStaff = async (staffId: string, staffName: string) => {
    if (!confirm(`Supprimer ${staffName} ?`)) return;
    try {
      const res = await fetch(`${API_URL}/staff/${staffId}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        fetchData();
      } else {
        alert('Erreur suppression');
      }
    } catch {
      alert('Erreur réseau');
    }
  };

  const openAddModal = () => {
    setNewStaff({ firstName: '', lastName: '', jobTitle: '', department: '', hiringDate: '', phone: '', email: '' });
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

  const uniqueDepartments = [...new Set(staff.map(m => m.department).filter(Boolean))];

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Personnel</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            <Icon icon="fa-users" className="mr-1.5 text-gray-400" />
            {filteredStaff.length} membre{filteredStaff.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-md transition flex items-center gap-2 text-sm font-medium shadow-sm"
        >
          <Icon icon="fa-plus" />
          Nouveau
        </button>
      </div>

      {/* Erreur */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-center gap-3 text-sm">
          <Icon icon="fa-exclamation-circle" />
          <span>{error}</span>
          <button onClick={fetchData} className="ml-auto underline text-red-700 hover:text-red-900">Réessayer</button>
        </div>
      )}

      {/* Statistiques épurées */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-700">
              <Icon icon="fa-users" className="text-lg" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Total</p>
              <p className="text-xl font-semibold text-gray-800">{staff.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
              <Icon icon="fa-building" className="text-lg" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Départements</p>
              <p className="text-xl font-semibold text-gray-800">{uniqueDepartments.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
              <Icon icon="fa-briefcase" className="text-lg" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Postes</p>
              <p className="text-xl font-semibold text-gray-800">{new Set(staff.map(m => m.jobTitle)).size}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
              <Icon icon="fa-calendar" className="text-lg" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Ancienneté moy.</p>
              <p className="text-xl font-semibold text-gray-800">2.5 ans</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recherche & filtres */}
      <div className="bg-white p-5 rounded-md shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Rechercher (nom, prénom, poste, département, email...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
            <Icon icon="fa-search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          </div>
          <div className="flex gap-3">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-md text-sm bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition min-w-[160px]"
            >
              <option value="">Tous les départements</option>
              {uniqueDepartments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            {(searchTerm || departmentFilter) && (
              <button
                onClick={() => { setSearchTerm(''); setDepartmentFilter(''); }}
                className="px-4 py-2.5 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition text-sm flex items-center gap-1.5 border border-gray-200"
              >
                <Icon icon="fa-times" />
                Réinitialiser
              </button>
            )}
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-400 flex items-center gap-1.5">
          <Icon icon="fa-info-circle" className="text-gray-300" />
          <span>{filteredStaff.length} résultat{filteredStaff.length > 1 ? 's' : ''}</span>
          {searchTerm && <span>pour "{searchTerm}"</span>}
          {departmentFilter && <span>dans {departmentFilter}</span>}
        </div>
      </div>

      {/* Contenu principal */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Icon icon="fa-spinner" className="fa-spin text-3xl text-gray-400 mb-3" />
            <p className="text-gray-500 text-sm">Chargement...</p>
          </div>
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-md border border-gray-100">
          <Icon icon="fa-users" className="text-5xl text-gray-200 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-1">
            {staff.length === 0 ? 'Aucun membre' : 'Aucun résultat'}
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            {staff.length === 0
              ? 'Ajoutez votre premier membre du personnel'
              : 'Ajustez vos filtres pour élargir la recherche'}
          </p>
          {staff.length === 0 ? (
            <button onClick={openAddModal} className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-md text-sm transition flex items-center gap-2 mx-auto">
              <Icon icon="fa-plus" /> Ajouter
            </button>
          ) : (
            <button onClick={() => { setSearchTerm(''); setDepartmentFilter(''); }} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-2.5 rounded-md text-sm transition mx-auto">
              Effacer les filtres
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Tableau */}
          <div className="bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div
              className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition"
              onClick={() => setShowTable(!showTable)}
            >
              <div className="flex items-center gap-2">
                <Icon icon={showTable ? "fa-chevron-down" : "fa-chevron-right"} className="text-gray-400 text-sm" />
                <h2 className="text-sm font-medium text-gray-700">Liste du personnel</h2>
                <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full ml-1">{filteredStaff.length}</span>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <Icon icon={showTable ? "fa-compress" : "fa-expand"} className="text-sm" />
              </button>
            </div>

            {showTable && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Membre</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Poste</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Département</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Embauche</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredStaff.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 text-xs font-medium">
                              {member.firstName[0]}{member.lastName[0]}
                            </div>
                            <span className="font-medium text-gray-800">{member.firstName} {member.lastName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{member.jobTitle}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">{member.department}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {new Date(member.hiringDate).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-3">
                          {member.phone && <div className="text-xs text-gray-500">{member.phone}</div>}
                          {member.user?.email && <div className="text-xs text-gray-400 truncate max-w-[120px]">{member.user.email}</div>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => viewStaffDetails(member)}
                              disabled={activeModal !== null}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition disabled:opacity-40"
                              title="Détails"
                            >
                              <Icon icon="fa-eye" className="text-sm" />
                            </button>
                            <button
                              onClick={() => prepareEdit(member)}
                              disabled={activeModal !== null}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition disabled:opacity-40"
                              title="Modifier"
                            >
                              <Icon icon="fa-edit" className="text-sm" />
                            </button>
                            <button
                              onClick={() => deleteStaff(member.id, `${member.firstName} ${member.lastName}`)}
                              disabled={activeModal !== null}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition disabled:opacity-40"
                              title="Supprimer"
                            >
                              <Icon icon="fa-trash" className="text-sm" />
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

          {/* Cartes */}
          <div className="bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden">
            <div
              className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition"
              onClick={() => setShowCards(!showCards)}
            >
              <div className="flex items-center gap-2">
                <Icon icon={showCards ? "fa-chevron-down" : "fa-chevron-right"} className="text-gray-400 text-sm" />
                <h2 className="text-sm font-medium text-gray-700">Vue cartes</h2>
                <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full ml-1">{filteredStaff.length}</span>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <Icon icon={showCards ? "fa-compress" : "fa-expand"} className="text-sm" />
              </button>
            </div>

            {showCards && (
              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredStaff.map((member) => (
                    <div key={member.id} className="bg-white border border-gray-100 rounded-md shadow-sm hover:shadow-md transition overflow-hidden">
                      <div className="h-1 bg-blue-600"></div>
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 text-lg font-medium">
                            {member.firstName[0]}{member.lastName[0]}
                          </div>
                          <span className="text-xs text-gray-400">#{member.id.slice(0,5)}</span>
                        </div>
                        <div className="mt-3">
                          <h4 className="font-semibold text-gray-800">{member.firstName} {member.lastName}</h4>
                          <p className="text-sm text-gray-500">{member.jobTitle}</p>
                        </div>
                        <div className="mt-3 space-y-1.5 text-xs text-gray-600">
                          <div className="flex items-center gap-2">
                            <Icon icon="fa-building" className="text-gray-400 w-3.5" />
                            <span>{member.department}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Icon icon="fa-calendar" className="text-gray-400 w-3.5" />
                            <span>Embauché le {new Date(member.hiringDate).toLocaleDateString('fr-FR')}</span>
                          </div>
                          {member.phone && (
                            <div className="flex items-center gap-2">
                              <Icon icon="fa-phone" className="text-gray-400 w-3.5" />
                              <span>{member.phone}</span>
                            </div>
                          )}
                          {member.user?.email && (
                            <div className="flex items-center gap-2 truncate">
                              <Icon icon="fa-envelope" className="text-gray-400 w-3.5 shrink-0" />
                              <span className="truncate">{member.user.email}</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-4 flex gap-1.5">
                          <button
                            onClick={() => viewStaffDetails(member)}
                            disabled={activeModal !== null}
                            className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-1.5 rounded text-xs font-medium transition disabled:opacity-40 flex items-center justify-center gap-1"
                          >
                            <Icon icon="fa-eye" className="text-sm" /> Détails
                          </button>
                          <button
                            onClick={() => prepareEdit(member)}
                            disabled={activeModal !== null}
                            className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded text-xs font-medium transition disabled:opacity-40"
                          >
                            <Icon icon="fa-edit" />
                          </button>
                          <button
                            onClick={() => deleteStaff(member.id, `${member.firstName} ${member.lastName}`)}
                            disabled={activeModal !== null}
                            className="px-3 py-1.5 bg-gray-50 hover:bg-red-50 text-gray-700 hover:text-red-600 rounded text-xs font-medium transition disabled:opacity-40"
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
        </>
      )}

      {/* MODAL AJOUT */}
      {activeModal === 'add' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Icon icon="fa-user-plus" className="text-blue-600" />
                Nouveau membre
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <Icon icon="fa-times" className="text-xl" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                  <input type="text" required className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none" value={newStaff.firstName} onChange={e => setNewStaff({...newStaff, firstName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input type="text" required className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none" value={newStaff.lastName} onChange={e => setNewStaff({...newStaff, lastName: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Poste *</label>
                  <input type="text" required className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" value={newStaff.jobTitle} onChange={e => setNewStaff({...newStaff, jobTitle: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Département *</label>
                  <input type="text" required className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" value={newStaff.department} onChange={e => setNewStaff({...newStaff, department: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d'embauche *</label>
                <input type="date" required className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" value={newStaff.hiringDate} onChange={e => setNewStaff({...newStaff, hiringDate: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" required className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} />
                <p className="text-xs text-gray-400 mt-1">Mot de passe généré automatiquement</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input type="tel" className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" value={newStaff.phone} onChange={e => setNewStaff({...newStaff, phone: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition">Annuler</button>
                <button type="submit" disabled={actionLoading} className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm rounded-md transition disabled:opacity-50 flex items-center gap-2">
                  {actionLoading ? <><Icon icon="fa-spinner" className="fa-spin" /> Création...</> : <><Icon icon="fa-save" /> Créer</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MODIFICATION */}
      {activeModal === 'edit' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Icon icon="fa-edit" className="text-blue-600" />
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
                  <input type="text" required className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" value={editStaff.firstName} onChange={e => setEditStaff({...editStaff, firstName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input type="text" required className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" value={editStaff.lastName} onChange={e => setEditStaff({...editStaff, lastName: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Poste *</label>
                  <input type="text" required className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" value={editStaff.jobTitle} onChange={e => setEditStaff({...editStaff, jobTitle: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Département *</label>
                  <input type="text" required className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" value={editStaff.department} onChange={e => setEditStaff({...editStaff, department: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d'embauche *</label>
                <input type="date" required className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" value={editStaff.hiringDate} onChange={e => setEditStaff({...editStaff, hiringDate: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500" value={editStaff.email} disabled />
                <p className="text-xs text-gray-400 mt-1">Email non modifiable</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input type="tel" className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" value={editStaff.phone} onChange={e => setEditStaff({...editStaff, phone: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition">Annuler</button>
                <button type="submit" disabled={actionLoading} className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm rounded-md transition disabled:opacity-50 flex items-center gap-2">
                  {actionLoading ? <><Icon icon="fa-spinner" className="fa-spin" /> Enregistrement...</> : <><Icon icon="fa-save" /> Enregistrer</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DÉTAILS */}
      {activeModal === 'details' && selectedStaff && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 text-lg font-medium">
                  {selectedStaff.firstName[0]}{selectedStaff.lastName[0]}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{selectedStaff.firstName} {selectedStaff.lastName}</h3>
                  <p className="text-sm text-gray-500">{selectedStaff.jobTitle}</p>
                </div>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <Icon icon="fa-times" className="text-xl" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Département</p>
                  <p className="font-medium text-gray-800">{selectedStaff.department}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Embauche</p>
                  <p className="font-medium text-gray-800">{new Date(selectedStaff.hiringDate).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Coordonnées</p>
                {selectedStaff.phone && <p className="text-gray-700"><Icon icon="fa-phone" className="mr-2 text-gray-400" />{selectedStaff.phone}</p>}
                {selectedStaff.user?.email && <p className="text-gray-700"><Icon icon="fa-envelope" className="mr-2 text-gray-400" />{selectedStaff.user.email}</p>}
              </div>

              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Ancienneté</p>
                <p className="text-lg font-semibold text-gray-800">
                  {Math.floor((new Date().getTime() - new Date(selectedStaff.hiringDate).getTime()) / (1000 * 60 * 60 * 24 * 365))} ans
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button onClick={() => { closeModal(); prepareEdit(selectedStaff); }} className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm rounded-md transition flex items-center gap-2">
                <Icon icon="fa-edit" /> Modifier
              </button>
              <button onClick={closeModal} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm rounded-md transition">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}