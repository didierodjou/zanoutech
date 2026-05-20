// app/teachers/components/modals/ChangePasswordModal.tsx
'use client';
import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { Teacher } from '../../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ChangePasswordModalProps {
  teacher: Teacher;
  onClose: () => void;
}

export default function ChangePasswordModal({ teacher, onClose }: ChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (newPassword && newPassword !== confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }
    if (newPassword && newPassword.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/teachers/${teacher.id}/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newPassword: newPassword || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.generatedPassword ? `Nouveau mot de passe: ${data.generatedPassword}\nUn email a été envoyé.` : 'Mot de passe modifié avec succès. Un email a été envoyé.');
        onClose();
      } else {
        alert(data.message || 'Erreur');
      }
    } catch {
      alert('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold"><Icon icon="fa-key" className="text-orange-500 mr-2" /> Changer le mot de passe</h3>
          <button onClick={onClose}><Icon icon="fa-times" /></button>
        </div>
        <p className="text-sm text-gray-600 mb-4">Professeur: <span className="font-semibold">{teacher.firstName} {teacher.lastName}</span><br />Email: {teacher.user?.email}</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nouveau mot de passe</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full border p-2 rounded pr-10" placeholder="Laisser vide pour génération auto" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2"><Icon icon={showPassword ? 'fa-eye-slash' : 'fa-eye'} /></button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirmer</label>
            <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full border p-2 rounded" />
          </div>
          <div className="bg-blue-50 p-3 rounded text-sm text-blue-700"><Icon icon="fa-info-circle" /> Si vide, un mot de passe sécurisé sera généré et envoyé par email.</div>
          <div className="flex justify-end gap-3 pt-4">
            <button onClick={onClose} className="px-4 py-2 text-gray-700">Annuler</button>
            <button onClick={handleSubmit} disabled={loading} className="px-6 py-2 bg-orange-600 text-white rounded flex items-center gap-2">
              {loading ? <><Icon icon="fa-spinner" className="fa-spin" /> Modification...</> : <><Icon icon="fa-check" /> Changer</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}