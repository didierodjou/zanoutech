// app/admin/messages/page.tsx
'use client';
import { useState, useEffect } from 'react';

interface Message {
  id: string;
  subject: string;
  content: string;
  isUrgent: boolean;
  read: boolean;
  createdAt: string;
  sender?: { email: string; role: string };
  receiver?: { email: string; role: string };
}

interface User {
  id: string;
  email: string;
  role: string;
}

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [messages, setMessages] = useState<Message[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [form, setForm] = useState({ receiverId: '', subject: '', content: '', isUrgent: false });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const getToken = () => localStorage.getItem('token');

  const fetchMessages = async () => {
    const token = getToken();
    if (!token) {
      setError('Non authentifié');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/admin/messages?type=${activeTab}`, {
        headers: { Authorization: `Bearer ${token}` },
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
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 404) {
        setUsersError("Endpoint /admin/users non trouvé – impossible de charger la liste des utilisateurs");
        setUsers([]);
        return;
      }
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setUsers(data);
      setUsersError(null);
    } catch (err: any) {
      console.error('Erreur chargement utilisateurs', err);
      setUsersError(err.message || 'Impossible de charger les utilisateurs');
      setUsers([]);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchMessages();
    fetchUsers();
  }, [activeTab]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) {
      setError('Non authentifié');
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/admin/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setShowCompose(false);
      setForm({ receiverId: '', subject: '', content: '', isUrgent: false });
      fetchMessages(); // recharge la liste après envoi
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l’envoi');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Chargement des messages...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Messages</h1>
        <button
          onClick={() => setShowCompose(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <i className="fas fa-pen"></i> Nouveau message
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg">{error}</div>
      )}

      <div className="border-b border-slate-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('received')}
            className={`py-2 px-1 ${
              activeTab === 'received'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-slate-500'
            }`}
          >
            Reçus
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`py-2 px-1 ${
              activeTab === 'sent'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-slate-500'
            }`}
          >
            Envoyés
          </button>
        </nav>
      </div>

      <div className="space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-slate-400 py-8">
            Aucun message {activeTab === 'received' ? 'reçu' : 'envoyé'}
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`bg-white rounded-lg shadow p-4 border-l-4 ${
                msg.isUrgent ? 'border-red-500' : 'border-blue-500'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{msg.subject}</h3>
                  <p className="text-sm text-slate-600 mt-1">{msg.content}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {activeTab === 'received'
                      ? `De: ${msg.sender?.email}`
                      : `À: ${msg.receiver?.email}`}{' '}
                    • {new Date(msg.createdAt).toLocaleString()}
                  </p>
                </div>
                {!msg.read && activeTab === 'received' && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    Nouveau
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showCompose && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nouveau message</h2>
            {usersError && (
              <div className="bg-yellow-100 text-yellow-800 p-2 rounded mb-3 text-sm">
                {usersError}
              </div>
            )}
            <form onSubmit={sendMessage} className="space-y-3">
              <select
                className="w-full border rounded p-2"
                value={form.receiverId}
                onChange={(e) => setForm({ ...form, receiverId: e.target.value })}
                required
                disabled={users.length === 0}
              >
                <option value="">
                  {users.length === 0
                    ? 'Aucun utilisateur disponible'
                    : 'Choisir destinataire'}
                </option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email} ({u.role})
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Sujet"
                className="w-full border rounded p-2"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                required
              />
              <textarea
                placeholder="Contenu"
                rows={4}
                className="w-full border rounded p-2"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                required
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isUrgent}
                  onChange={(e) => setForm({ ...form, isUrgent: e.target.checked })}
                />{' '}
                Urgent
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompose(false)}
                  className="px-4 py-2 border rounded"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={sending || users.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                >
                  {sending ? 'Envoi...' : 'Envoyer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}