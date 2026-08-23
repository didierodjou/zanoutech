'use client';

import { useState, useEffect, useMemo } from 'react';
import Icon from '@/components/ui/Icon';

type Contact = {
  id: string;
  email: string;
  role: string;
  studentProfile?: { firstName: string; lastName: string } | null;
  teacherProfile?: { firstName: string; lastName: string } | null;
  staffProfile?: { firstName: string; lastName: string } | null;
};

type MessageItem = {
  id: string;
  subject: string;
  content: string;
  isUrgent: boolean;
  read: boolean;
  createdAt: string;
  sender: Contact;
  receiver: Contact | null;
};

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function displayName(c?: Contact | null) {
  if (!c) return 'Inconnu';
  const p = c.teacherProfile || c.staffProfile || c.studentProfile;
  return p ? `${p.firstName} ${p.lastName}` : c.email;
}

export default function TeacherMessagesPage() {
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MessageItem | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Formulaire de composition
  const [receiverId, setReceiverId] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  const fetchMessages = async (type: 'received' | 'sent') => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/teacher/messages?type=${type}`, {
        credentials: 'include',
      });
      if (res.ok) setMessages(await res.json());
    } catch (e) {
      console.error('Erreur chargement messages', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(tab);
  }, [tab]);

  useEffect(() => {
    fetch(`${baseUrl}/teacher/messages/contacts`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then(setContacts)
      .catch(() => setContacts([]));
  }, []);

  const unreadCount = useMemo(
    () => messages.filter((m) => tab === 'received' && !m.read).length,
    [messages, tab],
  );

  const openMessage = async (msg: MessageItem) => {
    setSelected(msg);
    if (tab === 'received' && !msg.read) {
      try {
        await fetch(`${baseUrl}/teacher/messages/${msg.id}/read`, {
          method: 'PATCH',
          credentials: 'include',
        });
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, read: true } : m)));
      } catch (e) {
        console.error('Erreur marquage lu', e);
      }
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm('Supprimer ce message ?')) return;
    try {
      await fetch(`${baseUrl}/teacher/messages/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (e) {
      console.error('Erreur suppression', e);
    }
  };

  const sendMessage = async () => {
    if (!receiverId || !subject.trim() || !content.trim()) {
      setError('Destinataire, objet et contenu sont requis.');
      return;
    }
    setSending(true);
    setError('');
    try {
      const res = await fetch(`${baseUrl}/teacher/messages`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId, subject, content, isUrgent }),
      });
      if (!res.ok) throw new Error('Échec envoi');
      setShowCompose(false);
      setReceiverId('');
      setSubject('');
      setContent('');
      setIsUrgent(false);
      if (tab === 'sent') fetchMessages('sent');
    } catch (e) {
      setError("Impossible d'envoyer le message. Réessayez.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Messages</h1>
          <p className="text-sm text-slate-500 mt-0.5">Échangez avec l'administration, les parents et vos collègues.</p>
        </div>
        <button
          onClick={() => setShowCompose(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition"
        >
          <Icon icon="fa-plus" />
          Nouveau message
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => {
            setTab('received');
            setSelected(null);
          }}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
            tab === 'received' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Reçus {unreadCount > 0 && <span className="ml-1 text-rose-500">({unreadCount})</span>}
        </button>
        <button
          onClick={() => {
            setTab('sent');
            setSelected(null);
          }}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
            tab === 'sent' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Envoyés
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Liste */}
        <div className={`lg:col-span-2 space-y-2 ${selected ? 'hidden lg:block' : ''}`}>
          {loading ? (
            <div className="text-center py-12 text-slate-400">
              <Icon icon="fa-spinner" className="fa-spin text-2xl mb-2" />
              <p className="text-sm">Chargement...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <Icon icon="fa-inbox" className="text-3xl text-slate-300 mb-2" />
              <p className="text-sm text-slate-400">Aucun message</p>
            </div>
          ) : (
            messages.map((m) => (
              <button
                key={m.id}
                onClick={() => openMessage(m)}
                className={`w-full text-left bg-white rounded-xl p-4 border transition shadow-xs hover:shadow-sm ${
                  selected?.id === m.id ? 'border-blue-400 ring-1 ring-blue-200' : 'border-slate-100'
                } ${tab === 'received' && !m.read ? 'bg-blue-50/40' : ''}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {tab === 'received' ? displayName(m.sender) : displayName(m.receiver)}
                  </span>
                  <span className="text-[10px] text-slate-400 flex-shrink-0">
                    {new Date(m.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {m.isUrgent && <Icon icon="fa-exclamation-circle" className="text-rose-500 text-xs" />}
                  {tab === 'received' && !m.read && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0" />
                  )}
                  <p className="text-xs font-semibold text-slate-700 truncate">{m.subject}</p>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{m.content}</p>
              </button>
            ))
          )}
        </div>

        {/* Détail */}
        <div className={`lg:col-span-3 ${!selected ? 'hidden lg:block' : ''}`}>
          {selected ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
              <button
                onClick={() => setSelected(null)}
                className="lg:hidden text-xs text-slate-500 mb-4 inline-flex items-center gap-1"
              >
                <Icon icon="fa-arrow-left" /> Retour
              </button>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    {selected.isUrgent && <Icon icon="fa-exclamation-circle" className="text-rose-500" />}
                    {selected.subject}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {tab === 'received' ? 'De ' : 'À '}
                    <span className="font-semibold text-slate-700">
                      {displayName(tab === 'received' ? selected.sender : selected.receiver)}
                    </span>{' '}
                    · {new Date(selected.createdAt).toLocaleString('fr-FR')}
                  </p>
                </div>
                <button
                  onClick={() => deleteMessage(selected.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Supprimer"
                >
                  <Icon icon="fa-trash" />
                </button>
              </div>
              <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed border-t border-slate-100 pt-4">
                {selected.content}
              </div>
            </div>
          ) : (
            <div className="hidden lg:flex flex-col items-center justify-center h-full py-24 text-slate-300">
              <Icon icon="fa-envelope-open-text" className="text-4xl mb-2" />
              <p className="text-sm">Sélectionnez un message</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal composition */}
      {showCompose && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Nouveau message</h3>
              <button onClick={() => setShowCompose(false)} className="text-slate-400 hover:text-slate-600">
                <Icon icon="fa-times" />
              </button>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-lg px-3 py-2 mb-3">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Destinataire</label>
                <select
                  value={receiverId}
                  onChange={(e) => setReceiverId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Sélectionner...</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {displayName(c)} · {c.role}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Objet</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Objet du message"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Message</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                  placeholder="Votre message..."
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <input type="checkbox" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} />
                Marquer comme urgent
              </label>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCompose(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={sendMessage}
                disabled={sending}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-xs font-semibold shadow-sm disabled:opacity-50"
              >
                {sending ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}