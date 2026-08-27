'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/Icon';

interface SchoolSettings {
  id?: string;
  schoolName: string;
  schoolEmail: string | null;
  schoolPhone: string | null;
  schoolAddress: string | null;
  principalName: string | null;
  currency: string;
  logo?: string | null;
}

interface AdminUser {
  id: string;
  email: string;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}

function generateTemporaryPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  const bytes = new Uint32Array(14);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Changement de mot de passe
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });

  // Gestion des administrateurs
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(true);
  const [newAdminForm, setNewAdminForm] = useState({ email: '', temporaryPassword: '' });
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [adminMessage, setAdminMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [createdAdminInfo, setCreatedAdminInfo] = useState<{ email: string; temporaryPassword: string } | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const apiUrl = (path: string) => {
    const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${cleanPath}`;
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch(apiUrl('/admin/settings'), { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error(`Erreur ${res.status}`);
      }
      const data = await res.json();
      setSettings(data);
      setLogoPreview(data.logo || null);
    } catch (err: any) {
      console.error(err);
      setMessage({ text: 'Impossible de charger les paramètres', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setAdminsLoading(true);
      const res = await fetch(apiUrl('/admin/settings/admins'), { credentials: 'include' });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setAdmins(data);
    } catch (err) {
      console.error(err);
    } finally {
      setAdminsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (passwordForm.newPassword.length < 8) {
      setPasswordMessage({ text: 'Le nouveau mot de passe doit contenir au moins 8 caractères', type: 'error' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ text: 'Les mots de passe ne correspondent pas', type: 'error' });
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch(apiUrl('/admin/settings/password'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${res.status}`);
      }

      setPasswordMessage({ text: 'Mot de passe mis à jour avec succès', type: 'success' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordMessage(null), 4000);
    } catch (err: any) {
      setPasswordMessage({ text: err.message || 'Erreur lors du changement de mot de passe', type: 'error' });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminMessage(null);
    setCreatedAdminInfo(null);

    if (!newAdminForm.email.trim()) {
      setAdminMessage({ text: "L'email est requis", type: 'error' });
      return;
    }
    if (newAdminForm.temporaryPassword.length < 8) {
      setAdminMessage({ text: 'Le mot de passe temporaire doit contenir au moins 8 caractères', type: 'error' });
      return;
    }

    setCreatingAdmin(true);
    try {
      const res = await fetch(apiUrl('/admin/settings/admins'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newAdminForm),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${res.status}`);
      }

      setAdminMessage({ text: 'Administrateur créé avec succès', type: 'success' });
      setCreatedAdminInfo({ email: newAdminForm.email, temporaryPassword: newAdminForm.temporaryPassword });
      setNewAdminForm({ email: '', temporaryPassword: '' });
      fetchAdmins();
    } catch (err: any) {
      setAdminMessage({ text: err.message || "Erreur lors de la création de l'administrateur", type: 'error' });
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoPreview(base64);
        setSettings((prev) => prev ? { ...prev, logo: base64 } : null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(apiUrl('/admin/settings'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${res.status}`);
      }

      const updated = await res.json();
      setSettings(updated);
      setMessage({ text: 'Paramètres mis à jour avec succès', type: 'success' });
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.message || 'Erreur lors de la mise à jour', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Icon icon="fa-spinner" className="fa-spin text-3xl text-blue-500 mb-3" />
          <p className="text-sm text-gray-500">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-10 text-red-600 flex flex-col items-center gap-3">
        <Icon icon="fa-exclamation-triangle" className="text-3xl" />
        <p>Impossible de charger les paramètres</p>
        <button onClick={fetchSettings} className="text-sm underline">Réessayer</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Paramètres de l'école</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gérez les informations générales de l'établissement</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSettings}
            disabled={loading}
            className="px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-600 hover:bg-gray-50 transition flex items-center gap-1.5"
          >
            <Icon icon="fa-sync-alt" className={loading ? 'fa-spin' : ''} />
            Rafraîchir
          </button>
        </div>
      </div>

      {/* Message de notification */}
      {message && (
        <div
          className={`p-4 rounded-md border flex items-center gap-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <Icon icon={message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} className="text-lg flex-shrink-0" />
          <span className="flex-1">{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-gray-600">
            <Icon icon="fa-times" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {/* Section : Informations générales */}
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
            <Icon icon="fa-university" className="text-blue-500" />
            Informations générales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'école *</label>
              <input
                type="text"
                required
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                value={settings.schoolName}
                onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email de l'école</label>
              <input
                type="email"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                value={settings.schoolEmail || ''}
                onChange={(e) => setSettings({ ...settings, schoolEmail: e.target.value || null })}
                placeholder="contact@ecole.td"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                value={settings.schoolPhone || ''}
                onChange={(e) => setSettings({ ...settings, schoolPhone: e.target.value || null })}
                placeholder="+235 XX XX XX XX"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <textarea
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                rows={2}
                value={settings.schoolAddress || ''}
                onChange={(e) => setSettings({ ...settings, schoolAddress: e.target.value || null })}
                placeholder="Quartier, rue, ville..."
              />
            </div>
          </div>
        </div>

        {/* Section : Administration */}
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
            <Icon icon="fa-user-tie" className="text-green-500" />
            Administration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proviseur / Directeur</label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                value={settings.principalName || ''}
                onChange={(e) => setSettings({ ...settings, principalName: e.target.value || null })}
                placeholder="Nom du responsable"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Section : Logo */}
        <div className="p-5">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
            <Icon icon="fa-image" className="text-purple-500" />
            Logo de l'établissement
          </h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm file:mr-3 file:py-1.5 file:px-3 file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:rounded-md"
              />
              <p className="text-xs text-gray-400 mt-1">Formats acceptés : JPG, PNG, GIF. Taille max : 2 Mo</p>
            </div>
            {logoPreview && (
              <div className="flex-shrink-0">
                <img
                  src={logoPreview}
                  alt="Logo"
                  className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                />
              </div>
            )}
          </div>
        </div>

        {/* Boutons */}
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-400">Les champs avec * sont obligatoires</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => fetchSettings()}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition"
            >
              Réinitialiser
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm rounded-md transition flex items-center gap-2 disabled:opacity-50 shadow-sm"
            >
              {saving ? (
                <>
                  <Icon icon="fa-spinner" className="fa-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Icon icon="fa-save" />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* ==================== SÉCURITÉ — CHANGER MON MOT DE PASSE ==================== */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-1">
            <Icon icon="fa-lock" className="text-rose-500" />
            Sécurité — Mon mot de passe
          </h2>
          <p className="text-xs text-gray-400 mb-4">Utilisé pour se connecter à votre compte administrateur</p>

          {passwordMessage && (
            <div
              className={`mb-4 p-3 rounded-md border flex items-center gap-2 text-sm ${
                passwordMessage.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              <Icon
                icon={passwordMessage.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}
                className="flex-shrink-0"
              />
              <span className="flex-1">{passwordMessage.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe actuel *</label>
              <div className="relative">
                <input
                  type={showPassword.current ? 'text' : 'password'}
                  required
                  className="w-full border border-gray-200 rounded-md px-3 py-2 pr-10 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => ({ ...p, current: !p.current }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Icon icon={showPassword.current ? 'fa-eye-slash' : 'fa-eye'} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe *</label>
              <div className="relative">
                <input
                  type={showPassword.new ? 'text' : 'password'}
                  required
                  minLength={8}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 pr-10 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => ({ ...p, new: !p.new }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Icon icon={showPassword.new ? 'fa-eye-slash' : 'fa-eye'} />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">8 caractères minimum</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le nouveau mot de passe *</label>
              <div className="relative">
                <input
                  type={showPassword.confirm ? 'text' : 'password'}
                  required
                  minLength={8}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 pr-10 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => ({ ...p, confirm: !p.confirm }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Icon icon={showPassword.confirm ? 'fa-eye-slash' : 'fa-eye'} />
                </button>
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={changingPassword}
                className="px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm rounded-md transition flex items-center gap-2 disabled:opacity-50 shadow-sm"
              >
                {changingPassword ? (
                  <>
                    <Icon icon="fa-spinner" className="fa-spin" />
                    Mise à jour...
                  </>
                ) : (
                  <>
                    <Icon icon="fa-key" />
                    Changer le mot de passe
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ==================== GESTION DES ADMINISTRATEURS ==================== */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-1">
            <Icon icon="fa-users-cog" className="text-indigo-500" />
            Administrateurs
          </h2>
          <p className="text-xs text-gray-400 mb-4">Comptes ayant accès à l'administration de l'établissement</p>

          {adminsLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-3">
              <Icon icon="fa-spinner" className="fa-spin" />
              Chargement des administrateurs...
            </div>
          ) : admins.length === 0 ? (
            <p className="text-sm text-gray-400 py-3">Aucun administrateur trouvé</p>
          ) : (
            <div className="space-y-2">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-md bg-gray-50 border border-gray-100"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Icon icon="fa-user-shield" className="text-indigo-600 text-xs" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{admin.email}</p>
                      <p className="text-xs text-gray-400">
                        Ajouté le {new Date(admin.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {admin.mustChangePassword && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        Doit changer son mot de passe
                      </span>
                    )}
                    {!admin.isActive && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                        Inactif
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Ajouter un administrateur</h3>

          {adminMessage && (
            <div
              className={`mb-4 p-3 rounded-md border flex items-center gap-2 text-sm ${
                adminMessage.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              <Icon
                icon={adminMessage.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}
                className="flex-shrink-0"
              />
              <span className="flex-1">{adminMessage.text}</span>
            </div>
          )}

          {createdAdminInfo && (
            <div className="mb-4 p-4 rounded-md border border-indigo-200 bg-indigo-50 text-sm">
              <p className="text-indigo-800 font-medium mb-2 flex items-center gap-2">
                <Icon icon="fa-info-circle" />
                Communiquez ces identifiants au nouvel administrateur — ils ne seront plus affichés ensuite.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
                <div className="bg-white rounded px-2 py-1.5 border border-indigo-100">{createdAdminInfo.email}</div>
                <div className="bg-white rounded px-2 py-1.5 border border-indigo-100">
                  {createdAdminInfo.temporaryPassword}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                required
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                value={newAdminForm.email}
                onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                placeholder="nouvel.admin@ecole.td"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe temporaire *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  minLength={8}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm font-mono focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  value={newAdminForm.temporaryPassword}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, temporaryPassword: e.target.value })}
                  placeholder="8 caractères min."
                />
                <button
                  type="button"
                  onClick={() => setNewAdminForm((f) => ({ ...f, temporaryPassword: generateTemporaryPassword() }))}
                  className="px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-600 hover:bg-gray-50 transition flex-shrink-0"
                  title="Générer un mot de passe temporaire"
                >
                  <Icon icon="fa-dice" />
                </button>
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={creatingAdmin}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-md transition flex items-center gap-2 disabled:opacity-50 shadow-sm"
              >
                {creatingAdmin ? (
                  <>
                    <Icon icon="fa-spinner" className="fa-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Icon icon="fa-user-plus" />
                    Ajouter l'administrateur
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}