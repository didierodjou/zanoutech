// app/teachers/components/modals/EditTeacherModal.tsx
'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { Teacher } from '../../types';
import { useSubjects } from '../../hooks/useSubjects';
import { useActiveClasses } from '../../hooks/useActiveClasses';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface EditTeacherModalProps {
  teacher: Teacher;
  onClose: () => void;
  onSuccess: () => void;
}

type TabType = 'identity' | 'subjects' | 'class';

export default function EditTeacherModal({ teacher, onClose, onSuccess }: EditTeacherModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('identity');

  // États pour les données de base
  const [form, setForm] = useState({
    firstName: teacher.firstName || '',
    lastName: teacher.lastName || '',
    phone: teacher.phone || '',
    specialty: teacher.specialty || '',
    photo: teacher.photo || '',
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(teacher.photo || null);
  const [loading, setLoading] = useState(false);
  const [savingSection, setSavingSection] = useState<TabType | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Hook pour les matières et classes
  const { subjects, loading: subjectsLoading } = useSubjects();
  const { classes, loading: classesLoading } = useActiveClasses();

  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [mainClassId, setMainClassId] = useState<string>('');

  useEffect(() => {
    if (teacher.subjects) {
      setSelectedSubjectIds(teacher.subjects.map((s: any) => s.id));
    }
    if (teacher.mainClass) {
      setMainClassId(teacher.mainClass.id);
    }
  }, [teacher]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setForm({ ...form, photo: base64 });
        setPhotoPreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId]
    );
  };

  // 1. Sauvegarde section par section
  const handleSaveSection = async (section: TabType) => {
    setSavingSection(section);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // const token = localStorage.getItem('token');
      let res;

      if (section === 'identity') {
        res = await fetch(`${API_URL}/teachers/${teacher.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(form),
        });
      } else if (section === 'subjects') {
        res = await fetch(`${API_URL}/teachers/${teacher.id}/assign-subjects`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ subjectIds: selectedSubjectIds }),
        });
      } else if (section === 'class') {
        res = mainClassId
          ? await fetch(`${API_URL}/teachers/${teacher.id}/assign-main-class`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ classId: mainClassId }),
            })
          : await fetch(`${API_URL}/teachers/${teacher.id}/remove-main-class`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
            });
      }

      if (!res?.ok) {
        const data = await res?.json();
        throw new Error(data?.message || 'Erreur lors de la mise à jour');
      }

      setSuccessMsg('Modifications enregistrées');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur réseau');
    } finally {
      setSavingSection(null);
    }
  };

  // 2. Sauvegarder tout et fermer
  const handleSaveAndClose = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      //const token = localStorage.getItem('token');

      const resIdentity = await fetch(`${API_URL}/teachers/${teacher.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      if (!resIdentity.ok) throw new Error('Erreur sur les informations de base');

      const resSubjects = await fetch(`${API_URL}/teachers/${teacher.id}/assign-subjects`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subjectIds: selectedSubjectIds }),
      });
      if (!resSubjects.ok) throw new Error('Erreur sur la mise à jour des matières');

      const resClass = mainClassId
        ? await fetch(`${API_URL}/teachers/${teacher.id}/assign-main-class`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ classId: mainClassId }),
          })
        : await fetch(`${API_URL}/teachers/${teacher.id}/remove-main-class`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });
      if (!resClass.ok) throw new Error('Erreur sur la classe principale');

      setSuccessMsg('Enregistrement global réussi');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la sauvegarde globale');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* En-tête */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Édition du profil enseignant
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {teacher.firstName} {teacher.lastName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition"
          >
            <Icon icon="fa-times" className="text-sm" />
          </button>
        </div>

        {/* Barre d'onglets (Navigation épurée) */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 px-6 pt-2 gap-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab('identity')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'identity'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon icon="fa-user-gear" /> Identité & Contact
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'subjects'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon icon="fa-book" /> Matières ({selectedSubjectIds.length})
          </button>
          <button
            onClick={() => setActiveTab('class')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'class'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon icon="fa-graduation-cap" /> Classe Principale
          </button>
        </div>

        {/* Retours visuels (Alertes) */}
        <div className="px-6 pt-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-lg text-rose-700 text-xs flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Icon icon="fa-circle-exclamation" /> {errorMsg}
              </span>
              <button onClick={() => setErrorMsg('')} className="hover:text-rose-900">
                <Icon icon="fa-times" />
              </button>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-lg text-emerald-700 text-xs flex items-center gap-2">
              <Icon icon="fa-circle-check" /> {successMsg}
            </div>
          )}
        </div>

        {/* Corps des onglets */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          {/* ONGLET 1 : Identité */}
          {activeTab === 'identity' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Spécialité</label>
                  <input
                    type="text"
                    value={form.specialty}
                    onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Adresse Email</label>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-500 font-mono">
                  {teacher.user?.email || 'Non rattaché'}
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Photo de profil</label>
                <div className="flex items-center gap-4">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Aperçu"
                      className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-semibold">
                      {form.firstName?.[0]}
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="w-full border border-slate-200 rounded-lg p-1.5 text-slate-600 file:mr-3 file:py-1 file:px-2.5 file:border-0 file:rounded-md file:bg-slate-100 file:text-slate-700 file:font-medium hover:file:bg-slate-200 transition"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ONGLET 2 : Matières */}
          {activeTab === 'subjects' && (
            <div className="space-y-3">
              <p className="text-slate-500">
                Cochez les disciplines dispensées par cet enseignant dans l'établissement.
              </p>
              {subjectsLoading ? (
                <div className="py-8 text-center text-slate-400">Chargement des matières...</div>
              ) : (
                <div className="border border-slate-200 rounded-xl p-2 max-h-56 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1 bg-slate-50/50">
                  {subjects.map((subject) => {
                    const isChecked = selectedSubjectIds.includes(subject.id);
                    return (
                      <label
                        key={subject.id}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition border ${
                          isChecked
                            ? 'bg-white border-indigo-200 shadow-2xs'
                            : 'border-transparent hover:bg-slate-100/70'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSubject(subject.id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="font-medium text-slate-800">{subject.name}</span>
                        </div>
                        {subject.color && (
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: subject.color }}
                          />
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ONGLET 3 : Classe Principale */}
          {activeTab === 'class' && (
            <div className="space-y-3">
              <p className="text-slate-500">
                Définir la classe dont l'enseignant est le Professeur Principal.
              </p>
              <select
                value={mainClassId}
                onChange={(e) => setMainClassId(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition bg-white"
                disabled={classesLoading}
              >
                <option value="">Aucune (Aucune responsabilité principale)</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.level}) — {cls._count?.students || 0} élèves
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Pied de page et actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={() => handleSaveSection(activeTab)}
            disabled={savingSection !== null}
            className="px-3.5 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-lg font-medium text-xs transition disabled:opacity-50 flex items-center gap-1.5 shadow-2xs"
          >
            {savingSection === activeTab ? (
              <>
                <Icon icon="fa-spinner" className="animate-spin text-slate-400" /> Sauvegarde...
              </>
            ) : (
              <>
                <Icon icon="fa-check" className="text-slate-400" /> Enregistrer cet onglet
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 rounded-lg transition text-xs font-medium"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSaveAndClose}
              disabled={loading}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition disabled:opacity-50 flex items-center gap-2 shadow-2xs"
            >
              {loading ? (
                <>
                  <Icon icon="fa-spinner" className="animate-spin" /> Enregistrement...
                </>
              ) : (
                'Tout sauvegarder'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}