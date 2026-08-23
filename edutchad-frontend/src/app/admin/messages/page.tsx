'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';

interface User {
  id: string;
  email: string;
  role: string;
  studentProfile?: { firstName: string; lastName: string };
  teacherProfile?: { firstName: string; lastName: string };
  staffProfile?: { firstName: string; lastName: string };
}

interface Message {
  id: string;
  subject: string;
  content: string;
  isUrgent: boolean;
  read: boolean;
  createdAt: string;
  sender: User;
  receiver: User;
}

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCompose, setShowCompose] = useState(false);
  const [form, setForm] = useState({
    receiverId: '',
    subject: '',
    content: '',
    isUrgent: false,
  });
  const [sending, setSending] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const apiUrl = (path: string) => {
    const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${cleanPath}`;
  };

  const fetchMessages = async (type: 'received' | 'sent') => {
    try {
      setLoading(true);
      const res = await fetch(apiUrl(`/admin/messages?type=${type}`), {
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setMessages(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erreur chargement messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await fetch(apiUrl('/admin/messages/users'), {
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      console.error('Erreur chargement utilisateurs', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchMessages(activeTab);
    fetchUsers();
  }, [activeTab]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.receiverId) {
      alert('Veuillez sélectionner un destinataire');
      return;
    }
    setSending(true);
    try {
      const res = await fetch(apiUrl('/admin/messages'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setShowCompose(false);
      setForm({ receiverId: '', subject: '', content: '', isUrgent: false });
      fetchMessages(activeTab);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l’envoi');
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const res = await fetch(apiUrl(`/admin/messages/${messageId}/read`), {
        method: 'PATCH',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      fetchMessages(activeTab);
    } catch (err: any) {
      alert(err.message || 'Erreur lors du marquage');
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm('Supprimer ce message ?')) return;
    try {
      const res = await fetch(apiUrl(`/admin/messages/${messageId}`), {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      fetchMessages(activeTab);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  const getUserDisplayName = (user: User) => {
    if (user.studentProfile) return `${user.studentProfile.firstName} ${user.studentProfile.lastName}`;
    if (user.teacherProfile) return `${user.teacherProfile.firstName} ${user.teacherProfile.lastName}`;
    if (user.staffProfile) return `${user.staffProfile.firstName} ${user.staffProfile.lastName}`;
    return user.email;
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Admin';
      case 'TEACHER': return 'Enseignant';
      case 'STUDENT': return 'Élève';
      case 'STAFF': return 'Personnel';
      default: return role;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Messages</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            <Icon icon="fa-envelope" className="mr-1.5 text-gray-400" />
            {messages.length} message{messages.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowCompose(true)}
          className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-md transition flex items-center gap-2 text-sm font-medium shadow-sm"
        >
          <Icon icon="fa-pen" />
          Nouveau message
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-center gap-3 text-sm">
          <Icon icon="fa-exclamation-circle" />
          <span>{error}</span>
          <button onClick={() => fetchMessages(activeTab)} className="ml-auto underline text-red-700 hover:text-red-900">
            Réessayer
          </button>
        </div>
      )}

      {/* Onglets */}
      <div className="bg-white rounded-md shadow-sm border border-gray-100 mb-6">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('received')}
            className={`px-5 py-3 text-sm font-medium transition ${
              activeTab === 'received'
                ? 'text-blue-700 border-b-2 border-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon icon="fa-inbox" className="mr-2" />
            Reçus
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`px-5 py-3 text-sm font-medium transition ${
              activeTab === 'sent'
                ? 'text-blue-700 border-b-2 border-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon icon="fa-paper-plane" className="mr-2" />
            Envoyés
          </button>
        </div>

        {/* Liste des messages */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Icon icon="fa-spinner" className="fa-spin text-3xl text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Icon icon="fa-envelope-open" className="text-5xl mb-4 opacity-30" />
            <p className="text-sm">Aucun message {activeTab === 'received' ? 'reçu' : 'envoyé'}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-5 hover:bg-gray-50 transition ${
                  !msg.read && activeTab === 'received' ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {msg.isUrgent && (
                        <span className="text-red-500" title="Urgent">
                          <Icon icon="fa-exclamation-circle" className="text-sm" />
                        </span>
                      )}
                      <h4 className="text-sm font-semibold text-gray-800 truncate">
                        {msg.subject}
                      </h4>
                      {!msg.read && activeTab === 'received' && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          Non lu
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{msg.content}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
                      <span>
                        <Icon icon="fa-user" className="mr-1" />
                        {activeTab === 'received'
                          ? `De: ${getUserDisplayName(msg.sender)} (${getRoleLabel(msg.sender.role)})`
                          : `À: ${getUserDisplayName(msg.receiver)} (${getRoleLabel(msg.receiver.role)})`}
                      </span>
                      <span>
                        <Icon icon="fa-calendar" className="mr-1" />
                        {formatDate(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {activeTab === 'received' && !msg.read && (
                      <button
                        onClick={() => markAsRead(msg.id)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                        title="Marquer comme lu"
                      >
                        <Icon icon="fa-check" className="text-sm" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteMessage(msg.id)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                      title="Supprimer"
                    >
                      <Icon icon="fa-trash" className="text-sm" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de composition */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Icon icon="fa-pen" className="text-blue-600" />
                Nouveau message
              </h3>
              <button onClick={() => setShowCompose(false)} className="text-gray-400 hover:text-gray-600">
                <Icon icon="fa-times" className="text-xl" />
              </button>
            </div>
            <form onSubmit={sendMessage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destinataire *</label>
                <select
                  required
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  value={form.receiverId}
                  onChange={(e) => setForm({ ...form, receiverId: e.target.value })}
                  disabled={loadingUsers}
                >
                  <option value="">Choisir un destinataire</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {getUserDisplayName(user)} ({user.email}) - {getRoleLabel(user.role)}
                    </option>
                  ))}
                </select>
                {loadingUsers && <p className="text-xs text-gray-400 mt-1">Chargement des utilisateurs...</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sujet *</label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea
                  rows={4}
                  required
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="urgent"
                  checked={form.isUrgent}
                  onChange={(e) => setForm({ ...form, isUrgent: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="urgent" className="text-sm text-gray-700">Marquer comme urgent</label>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowCompose(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition">Annuler</button>
                <button type="submit" disabled={sending || loadingUsers} className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm rounded-md transition flex items-center gap-2 disabled:opacity-50">
                  {sending ? <><Icon icon="fa-spinner" className="fa-spin" /> Envoi...</> : <><Icon icon="fa-send" /> Envoyer</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}