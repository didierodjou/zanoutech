'use client';
import { useState, useEffect } from 'react';

interface Absence {
  id: string;
  date: string;
  type: string;
  isJustified: boolean;
  reason: string | null;
  student: { firstName: string; lastName: string; registrationNo: string };
  course: { subject: { name: string }; teacher: { firstName: string; lastName: string } } | null;
}

export default function AttendancesPage() {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterJustified, setFilterJustified] = useState<'all' | 'true' | 'false'>('all');
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  //const getToken = () => localStorage.getItem('token');

  const fetchAbsences = async () => {
    //const token = getToken();

    try {
      let url = `${API_BASE}/admin/attendances`;
      if (filterJustified !== 'all') url += `?justified=${filterJustified}`;
      const res = await fetch(url, {
        //headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setAbsences(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erreur chargement absences');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchAbsences();
  }, [filterJustified]);

  const toggleJustified = async (id: string, current: boolean) => {
    //const token = getToken();

    setUpdatingId(id);
    try {
      const res = await fetch(`${API_BASE}/admin/attendances/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ isJustified: !current }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      await fetchAbsences(); // recharge la liste
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <div className="text-center py-10">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Gestion des Absences</h1>
        <select
          value={filterJustified}
          onChange={(e) => setFilterJustified(e.target.value as any)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">Toutes</option>
          <option value="true">Justifiées</option>
          <option value="false">Non justifiées</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg">{error}</div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Élève</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Matière</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Justifiée</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {absences.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                  Aucune absence trouvée
                </td>
              </tr>
            ) : (
              absences.map((abs) => (
                <tr key={abs.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {abs.student.firstName} {abs.student.lastName}<br />
                    <span className="text-xs text-slate-400">{abs.student.registrationNo}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(abs.date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{abs.course?.subject.name || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {abs.isJustified ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Justifiée</span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Non justifiée</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleJustified(abs.id, abs.isJustified)}
                      disabled={updatingId === abs.id}
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 disabled:opacity-50"
                    >
                      <i className="fas fa-check-circle"></i>
                      {updatingId === abs.id
                        ? 'Mise à jour...'
                        : abs.isJustified
                        ? 'Annuler justification'
                        : 'Justifier'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}