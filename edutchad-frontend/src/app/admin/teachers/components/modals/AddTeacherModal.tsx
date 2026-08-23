// app/teachers/components/modals/AddTeacherModal.tsx
'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';

import { useSubjects } from '../../hooks/useSubjects';
import { useActiveClasses } from '../../hooks/useActiveClasses';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface AddTeacherModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddTeacherModal({ onClose, onSuccess }: AddTeacherModalProps) {
  const { subjects, loading: subjectsLoading } = useSubjects();
  const { classes, loading: classesLoading } = useActiveClasses();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialty: '',
    photo: '',
    subjectIds: [] as string[],
    mainClassId: '',
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Gestion de l'upload de photo (base64)
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

  // Gestion des matières avec des checkboxes
  const toggleSubject = (subjectId: string) => {
    setForm((prev) => ({
      ...prev,
      subjectIds: prev.subjectIds.includes(subjectId)
        ? prev.subjectIds.filter((id) => id !== subjectId)
        : [...prev.subjectIds, subjectId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    // Validation basique
    if (!form.firstName || !form.lastName || !form.email) {
      setErrorMsg('Veuillez remplir tous les champs obligatoires (*)');
      setLoading(false);
      return;
    }

    try {

      // 1. Création du professeur
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || null,
        specialty: form.specialty || null,
        photo: form.photo || null,
        subjectIds: form.subjectIds,
      };

      const res = await fetch(`${API_URL}/teachers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setErrorMsg(data.message || 'Un email a déjà été envoyé récemment.');
        } else {
          setErrorMsg(data.message || 'Erreur lors de la création du professeur');
        }
        return;
      }

      const teacherId = data.id;

      // 2. Si une classe principale est sélectionnée, l'assigner
      if (form.mainClassId) {
        const assignRes = await fetch(`${API_URL}/teachers/${teacherId}/assign-main-class`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ classId: form.mainClassId }),
        });
        if (!assignRes.ok) {
          console.warn('Impossible d\'assigner la classe principale');
        }
      }

      setSuccessMsg('Professeur créé avec succès ! Un email a été envoyé.');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setErrorMsg('Erreur réseau. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Icon icon="fa-user-plus" className="text-blue-500" />
            Nouveau Professeur
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <Icon icon="fa-times" className="text-xl" />
          </button>
        </div>

        {/* Messages */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
            <Icon icon="fa-exclamation-circle" />
            {errorMsg}
            <button onClick={() => setErrorMsg('')} className="ml-auto">
              <Icon icon="fa-times" />
            </button>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
            <Icon icon="fa-check-circle" />
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identité */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prénom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Amadou"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: DIOP"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="professeur@ecole.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Un mot de passe généré automatiquement sera envoyé par email.
            </p>
          </div>

          {/* Téléphone & Spécialité */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input
                type="tel"
                placeholder="77 123 45 67"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Spécialité</label>
              <input
                type="text"
                placeholder="Ex: Mathématiques"
                value={form.specialty}
                onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm file:mr-4 file:py-1.5 file:px-3 file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="Aperçu"
                  className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
                />
              )}
            </div>
          </div>

          {/* Classe principale */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Classe principale (optionnelle)
            </label>
            <select
              value={form.mainClassId}
              onChange={(e) => setForm({ ...form, mainClassId: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={classesLoading}
            >
              <option value="">Aucune</option>
              {classes.map((cls: { id: string; name: string; level: string; _count?: { students?: number } }) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.level}) - {cls._count?.students || 0} élèves
                </option>
              ))}
            </select>
            {classesLoading && <p className="text-xs text-gray-400 mt-1">Chargement des classes...</p>}
          </div>

          {/* Matières */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Matières enseignées
            </label>
            {subjectsLoading ? (
              <p className="text-gray-400 text-sm">Chargement des matières...</p>
            ) : subjects.length === 0 ? (
              <p className="text-gray-400 text-sm">Aucune matière disponible</p>
            ) : (
              <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1">
                {subjects.map((subject) => (
                  <label
                    key={subject.id}
                    className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={form.subjectIds.includes(subject.id)}
                      onChange={() => toggleSubject(subject.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm">{subject.name}</span>
                    {subject.color && (
                      <span
                        className="w-3 h-3 rounded-full inline-block"
                        style={{ backgroundColor: subject.color }}
                      />
                    )}
                  </label>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {form.subjectIds.length} matière(s) sélectionnée(s)
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
            >
              {loading ? (
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
  );
}