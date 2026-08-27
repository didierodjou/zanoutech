// app/students/components/AddStudentModal.tsx
'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { studentApi } from '../services/studentApi';
import { Class, NewStudent } from '../types';

interface Props {
  classes: Class[];        // Doit inclure la relation schoolYear avec isActive
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddStudentModal({ classes, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<NewStudent>({
    firstName: '',
    lastName: '',
    sex: 'M',
    dateOfBirth: '',
    registrationNo: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    classId: '',
    email: '',
    photo: null,
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Écran de confirmation affiché après création réussie, avant fermeture définitive.
  const [createdInfo, setCreatedInfo] = useState<{ studentEmail: string; emailSent: boolean } | null>(null);

  // Filtrer les classes actives : uniquement celles de l'année scolaire en cours
  const activeClasses = classes.filter(
    (cls) => cls.schoolYear?.isActive === true
  );

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload: any = {
        firstName: form.firstName,
        lastName: form.lastName,
        sex: form.sex,
        dateOfBirth: form.dateOfBirth,
        parentName: form.parentName,
        parentPhone: form.parentPhone,
        parentEmail: form.parentEmail,
        // L'email de l'élève sert désormais d'identifiant de connexion au cabinet
        // personnel : les identifiants (mot de passe temporaire) lui sont envoyés
        // directement à cette adresse, et non plus à celle du parent.
        email: form.email,
        classId: form.classId || null,
        photo: form.photo || null,
      };
      if (form.registrationNo.trim()) payload.registrationNo = form.registrationNo;

      const created: any = await studentApi.create(payload);
      // On ne ferme pas immédiatement : on confirme d'abord que les identifiants
      // ont bien été envoyés (ou pas, en cas de panne SMTP) avant de rendre la main.
      setCreatedInfo({ studentEmail: form.email, emailSent: created?.emailSent ?? false });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        {createdInfo ? (
          // ==================== ÉCRAN DE CONFIRMATION ====================
          <div className="text-center py-4">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${
                createdInfo.emailSent ? 'bg-emerald-100' : 'bg-amber-100'
              }`}
            >
              <Icon
                icon={createdInfo.emailSent ? 'fa-check-circle' : 'fa-exclamation-triangle'}
                className={`text-2xl ${createdInfo.emailSent ? 'text-emerald-600' : 'text-amber-600'}`}
              />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Élève créé avec succès</h3>
            {createdInfo.emailSent ? (
              <p className="text-sm text-gray-600 max-w-sm mx-auto">
                Les identifiants de connexion au cabinet personnel de l'élève ont été envoyés à{' '}
                <span className="font-semibold text-gray-800">{createdInfo.studentEmail}</span>.
              </p>
            ) : (
              <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 max-w-sm mx-auto">
                L'élève a été créé, mais l'envoi automatique de l'email à{' '}
                <span className="font-semibold">{createdInfo.studentEmail}</span> a échoué. Merci de
                communiquer les identifiants de connexion manuellement à l'élève (via le module de
                réinitialisation de mot de passe par exemple).
              </div>
            )}
            <button
              onClick={handleFinish}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Terminer
            </button>
          </div>
        ) : (
        <>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">
            <Icon icon="fa-user-plus" className="text-blue-500 mr-2" /> Nouvel Élève
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <Icon icon="fa-times" className="text-xl" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input
                type="text"
                required
                placeholder="Ex: DIOP"
                className="w-full border border-gray-300 p-2.5 rounded-lg"
                value={form.lastName}
                onChange={e => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénoms *</label>
              <input
                type="text"
                required
                placeholder="Ex: Amadou"
                className="w-full border border-gray-300 p-2.5 rounded-lg"
                value={form.firstName}
                onChange={e => setForm({ ...form, firstName: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sexe *</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer flex-1">
                <input
                  type="radio"
                  name="sex"
                  value="M"
                  checked={form.sex === 'M'}
                  onChange={() => setForm({ ...form, sex: 'M' })}
                /> Masculin
              </label>
              <label className="flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer flex-1">
                <input
                  type="radio"
                  name="sex"
                  value="F"
                  checked={form.sex === 'F'}
                  onChange={() => setForm({ ...form, sex: 'F' })}
                /> Féminin
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance *</label>
              <input
                type="date"
                required
                placeholder="JJ/MM/AAAA"
                className="w-full border p-2.5 rounded-lg"
                value={form.dateOfBirth}
                onChange={e => setForm({ ...form, dateOfBirth: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Matricule (optionnel)</label>
              <input
                type="text"
                placeholder="Laissez vide pour auto-génération"
                className="w-full border p-2.5 rounded-lg"
                value={form.registrationNo}
                onChange={e => setForm({ ...form, registrationNo: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email de l'élève *</label>
            <input
              type="email"
              required
              placeholder="eleve@email.com"
              className="w-full border border-gray-300 p-2.5 rounded-lg"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1 flex items-start gap-1.5">
              <Icon icon="fa-info-circle" className="mt-0.5 flex-shrink-0" />
              <span>
                Cet email servira d'identifiant de connexion au cabinet personnel de l'élève.
                Un mot de passe temporaire y sera envoyé automatiquement.
              </span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="w-full border p-2 rounded-lg text-sm"
              placeholder="Choisir une photo"
            />
            {photoPreview && (
              <img src={photoPreview} className="mt-2 w-16 h-16 rounded-full object-cover" />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Classe</label>
            <select
              className="w-full border p-2.5 rounded-lg"
              value={form.classId}
              onChange={e => setForm({ ...form, classId: e.target.value })}
            >
              <option value="">Sélectionner une classe</option>
              {activeClasses.length === 0 ? (
                <option value="" disabled>Aucune classe active disponible</option>
              ) : (
                activeClasses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))
              )}
            </select>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Parent / Tuteur</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label>Nom parent *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: DIALLO"
                  className="w-full border p-2.5 rounded-lg"
                  value={form.parentName}
                  onChange={e => setForm({ ...form, parentName: e.target.value })}
                />
              </div>
              <div>
                <label>Téléphone *</label>
                <input
                  type="tel"
                  required
                  placeholder="Ex: 77 123 45 67"
                  className="w-full border p-2.5 rounded-lg"
                  value={form.parentPhone}
                  onChange={e => setForm({ ...form, parentPhone: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-3">
              <label>Email parent (contact, optionnel)</label>
              <input
                type="email"
                placeholder="parent@email.com"
                className="w-full border p-2.5 rounded-lg"
                value={form.parentEmail}
                onChange={e => setForm({ ...form, parentEmail: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1 flex items-start gap-1.5">
                <Icon icon="fa-info-circle" className="mt-0.5 flex-shrink-0" />
                <span>
                  Simple information de contact — n'est plus utilisé pour la connexion.
                  Les identifiants sont envoyés à l'email de l'élève ci-dessus.
                </span>
              </p>
            </div>
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Icon icon="fa-spinner" className="fa-spin" /> Création...
                </>
              ) : (
                <>
                  <Icon icon="fa-save" /> Créer
                </>
              )}
            </button>
          </div>
        </form>
        </>
        )}
      </div>
    </div>
  );
}