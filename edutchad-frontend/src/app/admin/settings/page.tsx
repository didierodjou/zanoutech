// app/admin/settings/page.tsx
'use client';
import { useState, useEffect } from 'react';

interface SchoolSettings {
  schoolName: string;
  schoolEmail: string | null;
  schoolPhone: string | null;
  schoolAddress: string | null;
  principalName: string | null;
  currency: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const getToken = () => localStorage.getItem('token');

  const fetchSettings = async () => {
    const token = getToken();
    if (!token) {
      setMessage({ text: 'Non authentifié', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/admin/settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Erreur ${res.status}`);
      }

      const data = await res.json();
      setSettings(data);
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Impossible de charger les paramètres', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    const token = getToken();
    if (!token) {
      setMessage({ text: 'Non authentifié', type: 'error' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_BASE}/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${res.status}`);
      }

      setMessage({ text: 'Paramètres mis à jour avec succès', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.message || 'Erreur lors de la mise à jour', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Chargement...</div>;
  }

  if (!settings) {
    return <div className="text-center py-10 text-red-600">Impossible de charger les paramètres</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Paramètres de l’école</h1>

      {message && (
        <div
          className={`p-3 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Nom de l’école *</label>
          <input
            type="text"
            required
            className="mt-1 w-full border rounded-lg p-2"
            value={settings.schoolName}
            onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Email de l’école</label>
          <input
            type="email"
            className="mt-1 w-full border rounded-lg p-2"
            value={settings.schoolEmail || ''}
            onChange={(e) => setSettings({ ...settings, schoolEmail: e.target.value || null })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Téléphone</label>
          <input
            type="text"
            className="mt-1 w-full border rounded-lg p-2"
            value={settings.schoolPhone || ''}
            onChange={(e) => setSettings({ ...settings, schoolPhone: e.target.value || null })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Adresse</label>
          <textarea
            className="mt-1 w-full border rounded-lg p-2"
            rows={2}
            value={settings.schoolAddress || ''}
            onChange={(e) => setSettings({ ...settings, schoolAddress: e.target.value || null })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Nom du proviseur/DG</label>
          <input
            type="text"
            className="mt-1 w-full border rounded-lg p-2"
            value={settings.principalName || ''}
            onChange={(e) => setSettings({ ...settings, principalName: e.target.value || null })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Devise</label>
          <input
            type="text"
            className="mt-1 w-full border rounded-lg p-2"
            value={settings.currency}
            onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
          />
        </div>
        <div className="pt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-save'}`}></i>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}