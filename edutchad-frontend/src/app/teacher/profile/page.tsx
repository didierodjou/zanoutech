'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';

interface Teacher {
  id: string; firstName: string; lastName: string;
  phone?: string; specialty?: string; photo?: string;
  mainClass?: { id: string; name: string; level: string } | null;
  subjects?: { id: string; name: string; color: string }[];
  user?: { email: string; createdAt: string; isActive: boolean };
  _count?: { courses: number; subjects: number };
}

const API = 'http://localhost:3001';
const getToken     = () => localStorage.getItem('token') || '';
const getTeacherId = () => { try { return JSON.parse(localStorage.getItem('user') || '{}').teacherId || ''; } catch { return ''; } };
const sc = (c?: string) => c || '#6366f1';

export default function ProfilePage() {
  const [teacher, setTeacher]   = useState<Teacher | null>(null);
  const [editing, setEditing]   = useState(false);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');

  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', specialty: '', photo: '' });
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [changingPw, setChangingPw] = useState(false);
  const [pwError, setPwError]       = useState('');
  const [pwSaved, setPwSaved]       = useState(false);

  const headers = { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    const tid = getTeacherId();
    if (!tid) return;
    fetch(`${API}/teachers/${tid}`, { headers })
      .then(r => r.json())
      .then(data => {
        setTeacher(data);
        setForm({ firstName: data.firstName || '', lastName: data.lastName || '', phone: data.phone || '', specialty: data.specialty || '', photo: data.photo || '' });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const tid = getTeacherId();
    if (!tid) return;
    setSaving(true); setError('');
    try {
      const res = await fetch(`${API}/teachers/profile/${tid}`, {
        method: 'PUT', headers,
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Erreur sauvegarde');
      const updated = await res.json();
      setTeacher(prev => ({ ...prev!, ...updated }));
      setSaved(true); setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch { setError('Erreur lors de la sauvegarde'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (pwForm.newPw !== pwForm.confirm) { setPwError('Les mots de passe ne correspondent pas'); return; }
    if (pwForm.newPw.length < 6) { setPwError('Le mot de passe doit faire au moins 6 caractères'); return; }
    const tid = getTeacherId();
    setChangingPw(true); setPwError('');
    try {
      const res = await fetch(`${API}/teachers/${tid}/change-password`, {
        method: 'PUT', headers,
        body: JSON.stringify({ newPassword: pwForm.newPw }),
      });
      if (!res.ok) throw new Error();
      setPwSaved(true); setPwForm({ current: '', newPw: '', confirm: '' });
      setTimeout(() => setPwSaved(false), 3000);
    } catch { setPwError('Erreur lors du changement de mot de passe'); }
    finally { setChangingPw(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 rounded-full border-4 border-orange-200 border-t-orange-600 animate-spin" />
    </div>
  );

  if (!teacher) return null;

  const displayName = `${teacher.firstName} ${teacher.lastName}`;
  const initials    = [teacher.firstName[0], teacher.lastName[0]].join('').toUpperCase();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* En-tête profil */}
      <div className="bg-gradient-to-r from-orange-500 to-rose-500 rounded-2xl p-6 text-white shadow-lg flex items-center gap-6 flex-wrap">
        <div className="relative">
          {teacher.photo ? (
            <img src={teacher.photo} alt={displayName} className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white/30" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-bold ring-4 ring-white/30">{initials}</div>
          )}
          {teacher.user?.isActive && (
            <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white" />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{displayName}</h1>
          <p className="text-orange-200 text-sm mt-0.5">{teacher.user?.email}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {teacher.specialty && (
              <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full">{teacher.specialty}</span>
            )}
            {teacher.mainClass && (
              <span className="text-xs bg-yellow-400/30 text-yellow-200 border border-yellow-400/40 px-3 py-1 rounded-full flex items-center gap-1">
                <Icon icon="fa-star" /> Prof. principal — {teacher.mainClass.name}
              </span>
            )}
          </div>
        </div>
        <div className="ml-auto flex gap-4 text-center">
          <div><p className="text-2xl font-bold">{teacher._count?.courses ?? 0}</p><p className="text-orange-200 text-xs">Cours</p></div>
          <div><p className="text-2xl font-bold">{teacher._count?.subjects ?? 0}</p><p className="text-orange-200 text-xs">Matières</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ── Informations personnelles ────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-800 flex items-center gap-2"><Icon icon="fa-id-card" className="text-orange-500" /> Informations</h2>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-800 font-medium">
                <Icon icon="fa-pen" /> Modifier
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1 rounded-lg hover:bg-slate-100">Annuler</button>
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-1 text-sm bg-orange-600 text-white px-3 py-1.5 rounded-lg hover:bg-orange-700 transition disabled:opacity-50">
                  {saving ? <Icon icon="fa-spinner" className="fa-spin" /> : <Icon icon="fa-save" />} Sauvegarder
                </button>
              </div>
            )}
          </div>

          {saved && <div className="text-green-600 text-sm flex items-center gap-1"><Icon icon="fa-check-circle" /> Profil mis à jour !</div>}
          {error && <div className="text-red-500 text-sm">{error}</div>}

          <div className="space-y-4">
            {editing ? (
              <>
                {[
                  { label: 'Prénom', key: 'firstName', icon: 'fa-user' },
                  { label: 'Nom',    key: 'lastName',  icon: 'fa-user' },
                  { label: 'Téléphone', key: 'phone',  icon: 'fa-phone' },
                  { label: 'Spécialité', key: 'specialty', icon: 'fa-graduation-cap' },
                  { label: 'URL Photo', key: 'photo', icon: 'fa-image' },
                ].map(({ label, key, icon }) => (
                  <div key={key}>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">{label}</label>
                    <div className="relative">
                      <Icon icon={icon as any} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                      <input
                        type="text"
                        value={(form as any)[key]}
                        onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-orange-400 text-slate-800"
                      />
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="space-y-3">
                {[
                  { label: 'Prénom',     val: teacher.firstName,  icon: 'fa-user' },
                  { label: 'Nom',        val: teacher.lastName,   icon: 'fa-user' },
                  { label: 'Email',      val: teacher.user?.email, icon: 'fa-envelope' },
                  { label: 'Téléphone', val: teacher.phone || '—', icon: 'fa-phone' },
                  { label: 'Spécialité',val: teacher.specialty || '—', icon: 'fa-graduation-cap' },
                  { label: 'Membre depuis', val: teacher.user?.createdAt ? new Date(teacher.user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : '—', icon: 'fa-calendar' },
                ].map(({ label, val, icon }) => (
                  <div key={label} className="flex items-center gap-3 text-sm">
                    <Icon icon={icon as any} className="text-slate-400 w-4 text-center" />
                    <span className="text-slate-500 w-28 flex-shrink-0">{label}</span>
                    <span className="font-medium text-slate-800">{val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* ── Matières ─────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><Icon icon="fa-atom" className="text-indigo-500" /> Mes matières</h2>
            {!teacher.subjects?.length ? (
              <p className="text-slate-400 text-sm">Aucune matière assignée</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {teacher.subjects.map(s => (
                  <span key={s.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-white shadow-sm"
                    style={{ background: sc(s.color) }}>
                    <span className="w-1.5 h-1.5 bg-white/60 rounded-full" />{s.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Classe principale ─────────────────────────────────────────── */}
          {teacher.mainClass && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
              <h2 className="font-bold text-yellow-800 flex items-center gap-2 mb-3"><Icon icon="fa-star" className="text-yellow-500" /> Classe principale</h2>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center">
                  <Icon icon="fa-chalkboard-teacher" className="text-white text-lg" />
                </div>
                <div>
                  <p className="font-bold text-yellow-900 text-lg">{teacher.mainClass.name}</p>
                  <p className="text-yellow-700 text-sm">{teacher.mainClass.level}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Changer mot de passe ──────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><Icon icon="fa-lock" className="text-slate-500" /> Mot de passe</h2>
            <div className="space-y-3">
              {[
                { label: 'Nouveau mot de passe', key: 'newPw' },
                { label: 'Confirmer',            key: 'confirm' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">{label}</label>
                  <input
                    type="password"
                    value={(pwForm as any)[key]}
                    onChange={e => setPwForm(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-orange-400"
                  />
                </div>
              ))}
              {pwError && <p className="text-red-500 text-xs">{pwError}</p>}
              {pwSaved && <p className="text-green-600 text-xs flex items-center gap-1"><Icon icon="fa-check-circle" /> Mot de passe modifié !</p>}
              <button onClick={handleChangePassword} disabled={changingPw || !pwForm.newPw || !pwForm.confirm}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-700 transition disabled:opacity-40">
                {changingPw ? <Icon icon="fa-spinner" className="fa-spin" /> : <Icon icon="fa-key" />}
                Changer le mot de passe
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}