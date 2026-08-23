'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/Icon';

interface Salary {
  id: string;
  month: string;
  baseAmount: number;
  bonuses: number;
  deductions: number;
  netAmount: number;
  isPaid: boolean;
  paymentDate: string;
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
    specialty: string;
  };
  staff?: {
    id: string;
    firstName: string;
    lastName: string;
    jobTitle: string;
    department:string;
  };
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string;
}

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  department: string;
}

export default function SalariesPage() {
  const router = useRouter();
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [filteredSalaries, setFilteredSalaries] = useState<Salary[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  
  // États pour les modals - un seul actif à la fois
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedSalary, setSelectedSalary] = useState<Salary | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // États pour la recherche et les filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'paid', 'pending'
  const [beneficiaryType, setBeneficiaryType] = useState('all'); // 'all', 'teacher', 'staff'

  // État pour le tableau réduisible
  const [showTable, setShowTable] = useState(true);

  // Formulaire de paiement
  const [formData, setFormData] = useState({
    beneficiaryType: 'teacher', // 'teacher' ou 'staff'
    beneficiaryId: '',
    month: new Date().toISOString().slice(0, 7), // YYYY-MM
    baseAmount: 0,
    bonuses: 0,
    deductions: 0
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
      //const token = localStorage.getItem('token');

      const [salariesRes, teachersRes, staffRes] = await Promise.all([
        fetch(`${API_URL}/salaries`, {
          //headers: { 'Authorization': `Bearer ${token}` }
          credentials: 'include'
        }),
        fetch(`${API_URL}/teachers`, {
          //headers: { 'Authorization': `Bearer ${token}` }
          credentials: 'include'
        }),
        fetch(`${API_URL}/staff`, {
          //headers: { 'Authorization': `Bearer ${token}` }
          credentials: 'include'
        })
      ]);

      if (!salariesRes.ok) throw new Error('Erreur chargement salaires');
      if (!teachersRes.ok) throw new Error('Erreur chargement professeurs');
      if (!staffRes.ok) throw new Error('Erreur chargement personnel');

      const salariesData = await salariesRes.json();
      const teachersData = await teachersRes.json();
      const staffData = await staffRes.json();

      console.log('Salaires chargés:', salariesData);
      setSalaries(salariesData);
      setFilteredSalaries(salariesData);
      setTeachers(teachersData);
      setStaff(staffData);

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
    let filtered = [...salaries];

    if (searchTerm) {
      filtered = filtered.filter(salary => {
        const teacherName = salary.teacher ? 
          `${salary.teacher.firstName} ${salary.teacher.lastName}`.toLowerCase() : '';
        const staffName = salary.staff ? 
          `${salary.staff.firstName} ${salary.staff.lastName}`.toLowerCase() : '';
        return teacherName.includes(searchTerm.toLowerCase()) || 
               staffName.includes(searchTerm.toLowerCase());
      });
    }

    if (statusFilter === 'paid') {
      filtered = filtered.filter(s => s.isPaid);
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter(s => !s.isPaid);
    }

    if (beneficiaryType === 'teacher') {
      filtered = filtered.filter(s => s.teacher);
    } else if (beneficiaryType === 'staff') {
      filtered = filtered.filter(s => s.staff);
    }

    // Trier par date (plus récent d'abord)
    filtered.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

    setFilteredSalaries(filtered);
  }, [searchTerm, statusFilter, beneficiaryType, salaries]);

  // Envoyer le paiement
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    
    try {
      //const token = localStorage.getItem('token');
      
      const payload = {
        ...formData,
        paymentDate: new Date().toISOString()
      };

      const res = await fetch(`${API_URL}/salaries`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        if (confirm('Paiement enregistré avec succès !')) {
          closeModal();
          setFormData({
            beneficiaryType: 'teacher',
            beneficiaryId: '',
            month: new Date().toISOString().slice(0, 7),
            baseAmount: 0,
            bonuses: 0,
            deductions: 0
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

  // Marquer comme payé
  const markAsPaid = async (salaryId: string) => {
    if (!confirm('Marquer ce salaire comme payé ?')) return;
    
    setActionLoading(true);
    try {
      //const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/salaries/${salaryId}/pay`, {
        method: 'PUT',
        headers: {
          // 'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (res.ok) {
        alert('✅ Salaire marqué comme payé');
        fetchData();
      } else {
        alert('❌ Erreur');
      }
    } catch (error) {
      alert('❌ Erreur réseau');
    } finally {
      setActionLoading(false);
    }
  };

  // Supprimer un salaire
  const deleteSalary = async (salaryId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) return;
    
    try {
      //const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/salaries/${salaryId}`, {
        method: 'DELETE',
        headers: {
          // 'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (res.ok) {
        alert('✅ Paiement supprimé');
        fetchData();
      } else {
        alert('❌ Erreur');
      }
    } catch (error) {
      alert('❌ Erreur réseau');
    }
  };

  // Voir les détails
  const viewSalaryDetails = (salary: Salary) => {
    setSelectedSalary(salary);
    openModal('details');
  };

  // Calcul des statistiques
  const totalPaid = salaries
    .filter(s => s.isPaid)
    .reduce((acc, s) => acc + s.netAmount, 0);

  const totalPending = salaries
    .filter(s => !s.isPaid)
    .reduce((acc, s) => acc + s.netAmount, 0);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthTotal = salaries
    .filter(s => s.month === currentMonth && s.isPaid)
    .reduce((acc, s) => acc + s.netAmount, 0);

  // Calcul dynamique pour l'aperçu
  const netToPay = Number(formData.baseAmount) + Number(formData.bonuses) - Number(formData.deductions);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Salaires</h1>
          <p className="text-gray-600 mt-1">
            <Icon icon="fa-money-bill-wave" className="mr-2 text-gray-600" />
            {filteredSalaries.length} paiement{filteredSalaries.length > 1 ? 's' : ''}
          </p>
        </div>
        
        <button 
          onClick={() => openModal('add')}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition flex items-center gap-2 shadow-md"
        >
          <Icon icon="fa-plus" />
          Nouveau Paiement
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

      {/* Cartes Résumé */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
              <Icon icon="fa-check-circle" className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Versé</p>
              <p className="text-2xl font-bold text-gray-900">{totalPaid.toLocaleString()} FCFA</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-600">
              <Icon icon="fa-clock" className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">En attente</p>
              <p className="text-2xl font-bold text-gray-900">{totalPending.toLocaleString()} FCFA</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              <Icon icon="fa-calendar" className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Mois en cours</p>
              <p className="text-2xl font-bold text-gray-900">{currentMonthTotal.toLocaleString()} FCFA</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
              <Icon icon="fa-users" className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Bénéficiaires</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set([...salaries.map(s => s.teacher?.id), ...salaries.map(s => s.staff?.id)]).size}
              </p>
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
                placeholder="Rechercher un bénéficiaire..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
              />
              <Icon icon="fa-search" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Filtres */}
          <div className="flex gap-3 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900 min-w-[120px]"
            >
              <option value="all">Tous les statuts</option>
              <option value="paid">Payés</option>
              <option value="pending">En attente</option>
            </select>

            <select
              value={beneficiaryType}
              onChange={(e) => setBeneficiaryType(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900 min-w-[150px]"
            >
              <option value="all">Tous les bénéf.</option>
              <option value="teacher">Professeurs</option>
              <option value="staff">Personnel</option>
            </select>

            {(searchTerm || statusFilter !== 'all' || beneficiaryType !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setBeneficiaryType('all');
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
            {filteredSalaries.length} paiement{filteredSalaries.length > 1 ? 's' : ''} trouvé{filteredSalaries.length > 1 ? 's' : ''}
            {searchTerm && ` pour "${searchTerm}"`}
            {statusFilter !== 'all' && ` (${statusFilter === 'paid' ? 'payés' : 'en attente'})`}
            {beneficiaryType !== 'all' && ` - ${beneficiaryType === 'teacher' ? 'professeurs' : 'personnel'}`}
          </span>
        </div>
      </div>

      {/* TABLEAU DES SALAIRES */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Icon icon="fa-spinner" className="fa-spin text-4xl text-green-500 mb-4" />
            <p className="text-gray-600">Chargement des salaires...</p>
          </div>
        </div>
      ) : filteredSalaries.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Icon icon="fa-money-bill-wave" className="text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            {salaries.length === 0 ? 'Aucun paiement' : 'Aucun résultat'}
          </h3>
          <p className="text-gray-500 mb-6">
            {salaries.length === 0 
              ? 'Commencez par enregistrer votre premier paiement'
              : 'Aucun paiement ne correspond à votre recherche'}
          </p>
          {salaries.length === 0 ? (
            <button
              onClick={() => openModal('add')}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 inline-flex items-center gap-2"
            >
              <Icon icon="fa-plus" />
              Nouveau Paiement
            </button>
          ) : (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setBeneficiaryType('all');
              }}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 inline-flex items-center gap-2"
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
              <h2 className="text-lg font-semibold text-gray-800">Historique des paiements</h2>
              <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full">
                {filteredSalaries.length}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bénéficiaire</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mois</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Base</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Primes</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Retenues</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSalaries.map((salary) => (
                    <tr key={salary.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {new Date(salary.paymentDate).toLocaleDateString('fr-FR')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {salary.teacher ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {salary.teacher.firstName[0]}{salary.teacher.lastName[0]}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {salary.teacher.firstName} {salary.teacher.lastName}
                              </p>
                              <p className="text-xs text-gray-500">{salary.teacher.specialty}</p>
                            </div>
                          </div>
                        ) : salary.staff ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {salary.staff.firstName[0]}{salary.staff.lastName[0]}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {salary.staff.firstName} {salary.staff.lastName}
                              </p>
                              <p className="text-xs text-gray-500">{salary.staff.jobTitle}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Inconnu</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {new Date(salary.month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono">
                        {salary.baseAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-green-600">
                        +{salary.bonuses.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-red-600">
                        -{salary.deductions.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-bold font-mono text-gray-900">
                        {salary.netAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {salary.isPaid ? (
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                            Payé
                          </span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full font-medium">
                            En attente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => activeModal === null && viewSalaryDetails(salary)}
                            disabled={activeModal !== null}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition disabled:opacity-50"
                            title="Voir détails"
                          >
                            <Icon icon="fa-eye" />
                          </button>
                          {!salary.isPaid && (
                            <button
                              onClick={() => activeModal === null && markAsPaid(salary.id)}
                              disabled={activeModal !== null}
                              className="p-1 text-green-600 hover:bg-green-50 rounded transition disabled:opacity-50"
                              title="Marquer comme payé"
                            >
                              <Icon icon="fa-check" />
                            </button>
                          )}
                          <button
                            onClick={() => activeModal === null && deleteSalary(salary.id)}
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

      {/* MODAL AJOUT PAIEMENT */}
      {activeModal === 'add' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                <Icon icon="fa-money-bill-wave" className="text-green-500 mr-2" />
                Nouveau Paiement
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <Icon icon="fa-times" className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Type de bénéficiaire */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type de bénéficiaire</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 flex-1">
                    <input
                      type="radio"
                      name="beneficiaryType"
                      value="teacher"
                      checked={formData.beneficiaryType === 'teacher'}
                      onChange={() => setFormData({...formData, beneficiaryType: 'teacher', beneficiaryId: ''})}
                      className="w-4 h-4 text-green-600"
                    />
                    <Icon icon="fa-user-tie" className="text-blue-500" />
                    <span className="text-gray-900">Professeur</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 flex-1">
                    <input
                      type="radio"
                      name="beneficiaryType"
                      value="staff"
                      checked={formData.beneficiaryType === 'staff'}
                      onChange={() => setFormData({...formData, beneficiaryType: 'staff', beneficiaryId: ''})}
                      className="w-4 h-4 text-green-600"
                    />
                    <Icon icon="fa-users" className="text-green-500" />
                    <span className="text-gray-900">Personnel</span>
                  </label>
                </div>
              </div>

              {/* Sélection du bénéficiaire */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.beneficiaryType === 'teacher' ? 'Professeur' : 'Membre du personnel'}
                </label>
                <select 
                  required
                  className="w-full border border-gray-300 p-3 rounded-lg text-gray-900"
                  value={formData.beneficiaryId}
                  onChange={e => setFormData({...formData, beneficiaryId: e.target.value})}
                >
                  <option value="">Sélectionner...</option>
                  {formData.beneficiaryType === 'teacher' ? (
                    teachers.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.firstName} {t.lastName} - {t.specialty}
                      </option>
                    ))
                  ) : (
                    staff.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} - {s.jobTitle} ({s.department})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Mois et année */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mois concerné</label>
                <input 
                  type="month"
                  required
                  className="w-full border border-gray-300 p-3 rounded-lg text-gray-900"
                  value={formData.month}
                  onChange={e => setFormData({...formData, month: e.target.value})}
                />
              </div>

              {/* Montants */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salaire de base (FCFA)</label>
                  <input 
                    type="number"
                    required
                    min="0"
                    className="w-full border border-gray-300 p-3 rounded-lg text-gray-900"
                    value={formData.baseAmount || ''}
                    onChange={e => setFormData({...formData, baseAmount: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primes (FCFA)</label>
                  <input 
                    type="number"
                    min="0"
                    className="w-full border border-gray-300 p-3 rounded-lg text-gray-900"
                    value={formData.bonuses || ''}
                    onChange={e => setFormData({...formData, bonuses: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Retenues (FCFA)</label>
                <input 
                  type="number"
                  min="0"
                  className="w-full border border-gray-300 p-3 rounded-lg text-gray-900"
                  value={formData.deductions || ''}
                  onChange={e => setFormData({...formData, deductions: parseInt(e.target.value) || 0})}
                />
              </div>

              {/* Résumé */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Net à payer :</span>
                  <span className="text-2xl font-bold text-green-700">{netToPay.toLocaleString()} FCFA</span>
                </div>
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
                  disabled={!formData.beneficiaryId || actionLoading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <Icon icon="fa-spinner" className="fa-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <Icon icon="fa-check" />
                      Enregistrer le paiement
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DÉTAILS PAIEMENT */}
      {activeModal === 'details' && selectedSalary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                <Icon icon="fa-file-invoice" className="text-blue-500 mr-2" />
                Détails du paiement
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <Icon icon="fa-times" className="text-xl" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Bénéficiaire</p>
                {selectedSalary.teacher ? (
                  <div>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedSalary.teacher.firstName} {selectedSalary.teacher.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{selectedSalary.teacher.specialty}</p>
                  </div>
                ) : selectedSalary.staff ? (
                  <div>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedSalary.staff.firstName} {selectedSalary.staff.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{selectedSalary.staff.jobTitle} - {selectedSalary.staff.department}</p>
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">Date de paiement</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(selectedSalary.paymentDate).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">Mois concerné</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(selectedSalary.month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Salaire de base</span>
                  <span className="font-medium">{selectedSalary.baseAmount.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Primes</span>
                  <span className="font-medium text-green-600">+{selectedSalary.bonuses.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Retenues</span>
                  <span className="font-medium text-red-600">-{selectedSalary.deductions.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between py-2 border-t border-gray-200 mt-2 pt-2">
                  <span className="font-bold text-gray-900">Net</span>
                  <span className="font-bold text-green-700 text-lg">{selectedSalary.netAmount.toLocaleString()} FCFA</span>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-1">Statut</p>
                {selectedSalary.isPaid ? (
                  <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-medium">
                    Payé le {new Date(selectedSalary.paymentDate).toLocaleDateString('fr-FR')}
                  </span>
                ) : (
                  <span className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full font-medium">
                    En attente de paiement
                  </span>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                {!selectedSalary.isPaid && (
                  <button 
                    onClick={() => {
                      closeModal();
                      markAsPaid(selectedSalary.id);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Marquer comme payé
                  </button>
                )}
                <button 
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}