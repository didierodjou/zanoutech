'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  specialty?: string;
  photo?: string;
  mainClass?: { id: string; name: string; level: string } | null;
  subjects?: { id: string; name: string; color: string }[];
  user?: { email: string; createdAt: string; isActive: boolean };
  _count?: { courses: number; subjects: number };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ProfilePage() {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', specialty: '', photo: '' });
  const [pwForm, setPwForm] = useState({ currentPw: '', newPw: '', confirmPw: '' });
  const [changingPw, setChangingPw] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSaved, setPwSaved] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/teachers/profile`, { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error(res.status === 401 ? 'Session expirée' : 'Erreur de chargement');
        return res.json();
      })
      .then((data) => {
        setTeacher(data);
        setForm({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phone: data.phone || '',
          specialty: data.specialty || '',
          photo: data.photo || '',
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!teacher) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/teachers/${teacher.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Échec de la mise à jour');
      const updated = await res.json();
      setTeacher((prev) => (prev ? { ...prev, ...updated } : null));
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Impossible de sauvegarder les modifications');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwForm.currentPw) return setPwError('L\'ancien mot de passe est requis');
    if (pwForm.newPw.length < 8) return setPwError('8 caractères minimum requis');
    if (pwForm.newPw !== pwForm.confirmPw) return setPwError('Les mots de passe ne correspondent pas');

    setChangingPw(true);
    setPwError('');
    try {
      const res = await fetch(`${API_URL}/teachers/${teacher?.id}/change-password`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwForm.currentPw, newPassword: pwForm.newPw }),
      });
      if (!res.ok) throw new Error();
      setPwSaved(true);
      setPwForm({ currentPw: '', newPw: '', confirmPw: '' });
      setTimeout(() => setPwSaved(false), 3000);
    } catch {
      setPwError('Ancien mot de passe incorrect ou erreur serveur');
    } finally {
      setChangingPw(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !teacher) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white border border-slate-200 rounded-xl text-center shadow-sm">
        <Icon icon="fa-exclamation-triangle" className="text-3xl text-rose-500 mb-3" />
        <p className="text-slate-700 font-medium mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition">
          Réessayer
        </button>
      </div>
    );
  }

  if (!teacher) return null;

  const displayName = `${teacher.firstName} ${teacher.lastName}`;
  const initials = `${teacher.firstName[0] || ''}${teacher.lastName[0] || ''}`.toUpperCase();

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 sm:p-6">
      {/* Profil Header Banner - harmonisé avec le layout */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            {teacher.photo ? (
              <img src={teacher.photo} alt={displayName} className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-indigo-100 border border-indigo-200 text-indigo-700 flex items-center justify-center text-2xl font-bold">
                {initials}
              </div>
            )}
            <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${teacher.user?.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">{displayName}</h1>
              {teacher.specialty && (
                <span className="text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-md">
                  {teacher.specialty}
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm">{teacher.user?.email}</p>
            {teacher.mainClass && (
              <div className="pt-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-md">
                  <Icon icon="fa-star" className="text-amber-500" /> Prof. principal — {teacher.mainClass.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Key Stats */}
        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-8 w-full md:w-auto">
          <div>
            <p className="text-2xl font-bold text-slate-900">{teacher._count?.courses ?? 0}</p>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Cours</p>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div>
            <p className="text-2xl font-bold text-slate-900">{teacher._count?.subjects ?? 0}</p>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Matières</p>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Personal Info (2 Cols wide on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Informations personnelles</h2>
                <p className="text-xs text-slate-500">Gérez vos identifiants et coordonnées</p>
              </div>
              {!editing ? (
                <button onClick={() => setEditing(true)} className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center gap-1.5">
                  <Icon icon="fa-pen" /> Éditer
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition">
                    Annuler
                  </button>
                  <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition flex items-center gap-1.5 disabled:opacity-50">
                    {saving && <Icon icon="fa-spinner" className="fa-spin" />} Enregistrer
                  </button>
                </div>
              )}
            </div>

            {saved && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2"><Icon icon="fa-check-circle" /> Profil mis à jour avec succès.</div>}
            {error && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">{error}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">Prénom</label>
                {editing ? (
                  <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none" />
                ) : (
                  <p className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">{teacher.firstName}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">Nom</label>
                {editing ? (
                  <input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none" />
                ) : (
                  <p className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">{teacher.lastName}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">Téléphone</label>
                {editing ? (
                  <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none" />
                ) : (
                  <p className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">{teacher.phone || 'Non renseigné'}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">Spécialité</label>
                {editing ? (
                  <input type="text" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none" />
                ) : (
                  <p className="text-sm font-medium text-slate-900 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">{teacher.specialty || 'Non renseignée'}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">Adresse Email <span className="text-slate-400 font-normal">(Non modifiable)</span></label>
                <p className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200/60 cursor-not-allowed">{teacher.user?.email}</p>
              </div>
            </div>
          </div>

          {/* Subjects Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Matières enseignées</h2>
            {!teacher.subjects?.length ? (
              <p className="text-xs text-slate-500 italic">Aucune matière n'est attribuée à ce compte.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {teacher.subjects.map((sub) => (
                  <span key={sub.id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-200">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sub.color || '#6366f1' }} />
                    {sub.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Security & Password */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 mb-1">Sécurité</h2>
            <p className="text-xs text-slate-500 mb-4">Mise à jour du mot de passe</p>

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Mot de passe actuel</label>
                <input type="password" value={pwForm.currentPw} onChange={(e) => setPwForm({ ...pwForm, currentPw: e.target.value })} placeholder="••••••••" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Nouveau mot de passe</label>
                <input type="password" value={pwForm.newPw} onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })} placeholder="••••••••" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Confirmation</label>
                <input type="password" value={pwForm.confirmPw} onChange={(e) => setPwForm({ ...pwForm, confirmPw: e.target.value })} placeholder="••••••••" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none" />
              </div>

              {pwError && <p className="text-xs text-rose-600">{pwError}</p>}
              {pwSaved && <p className="text-xs text-emerald-600 flex items-center gap-1"><Icon icon="fa-check-circle" /> Mot de passe mis à jour !</p>}

              <button type="submit" disabled={changingPw || !pwForm.currentPw || !pwForm.newPw} className="w-full mt-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition disabled:opacity-40 flex items-center justify-center gap-2">
                {changingPw && <Icon icon="fa-spinner" className="fa-spin" />} Mettre à jour
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}