'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/Icon';

interface Activity {
  id: string;
  date: string;
  activity: string;
  user: string;
  type: 'inscription' | 'paiement' | 'note' | 'autre';
}

export default function ActivitiesPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      //const token = localStorage.getItem('token');
      
      const res = await fetch(`${API_URL}/dashboard/activities?limit=50`, {
        //headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Erreur chargement activités');

      const data = await res.json();
      setActivities(data);
    } catch (error) {
      console.error('Erreur:', error);
      setError('Impossible de charger les activités');
    } finally {
      setLoading(false);
    }
  };

  // Formater la date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Toutes les Activités</h1>
          <p className="text-slate-500 mt-1">
            <Icon icon="fa-history" className="mr-2" />
            Historique complet des actions
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition flex items-center gap-2"
        >
          <Icon icon="fa-arrow-left" />
          Retour
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Icon icon="fa-spinner" className="fa-spin text-4xl text-blue-500" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Activité</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Utilisateur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {activities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(activity.date)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800">{activity.activity}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{activity.user}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                        ${activity.type === 'inscription' ? 'bg-green-100 text-green-700' : ''}
                        ${activity.type === 'paiement' ? 'bg-blue-100 text-blue-700' : ''}
                        ${activity.type === 'note' ? 'bg-purple-100 text-purple-700' : ''}
                        ${activity.type === 'autre' ? 'bg-orange-100 text-orange-700' : ''}
                      `}>
                        {activity.type === 'inscription' && 'Inscription'}
                        {activity.type === 'paiement' && 'Paiement'}
                        {activity.type === 'note' && 'Note'}
                        {activity.type === 'autre' && 'Autre'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}