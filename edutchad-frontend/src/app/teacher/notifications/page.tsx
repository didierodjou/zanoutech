'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/Icon';

type NotificationItem = {
  id: string;
  type: 'message' | 'meeting';
  title: string;
  description: string;
  date: string;
  read: boolean;
  link: string;
};

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function relativeDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (Math.abs(diffMin) < 1) return "à l'instant";
  if (Math.abs(diffMin) < 60) return diffMin > 0 ? `dans ${diffMin} min` : `il y a ${-diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (Math.abs(diffH) < 24) return diffH > 0 ? `dans ${diffH} h` : `il y a ${-diffH} h`;
  const diffD = Math.round(diffH / 24);
  return diffD > 0 ? `dans ${diffD} j` : `il y a ${-diffD} j`;
}

export default function TeacherNotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'message' | 'meeting'>('all');

  useEffect(() => {
    fetch(`${baseUrl}/notifications`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const handleOpen = async (item: NotificationItem) => {
    if (item.type === 'message' && !item.read) {
      const messageId = item.id.replace('message-', '');
      try {
        await fetch(`${baseUrl}/teacher/messages/${messageId}/read`, {
          method: 'PATCH',
          credentials: 'include',
        });
        setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
      } catch (e) {
        console.error('Erreur marquage lu', e);
      }
    }
    router.push(item.link);
  };

  const filtered = items.filter((n) => filter === 'all' || n.type === filter);
  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {unreadCount > 0 ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}` : 'Vous êtes à jour'}
        </p>
      </div>

      <div className="flex gap-2 mb-4 bg-slate-100 p-1 rounded-xl w-fit">
        {[
          { key: 'all', label: 'Tout' },
          { key: 'message', label: 'Messages' },
          { key: 'meeting', label: 'Réunions' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as any)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              filter === f.key ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">
          <Icon icon="fa-spinner" className="fa-spin text-2xl mb-2" />
          <p className="text-sm">Chargement...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <Icon icon="fa-bell-slash" className="text-3xl text-slate-300 mb-2" />
          <p className="text-sm text-slate-400">Aucune notification</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => (
            <button
              key={n.id}
              onClick={() => handleOpen(n)}
              className={`w-full text-left flex items-start gap-3 bg-white rounded-xl p-4 border transition shadow-xs hover:shadow-sm ${
                !n.read ? 'border-blue-200 bg-blue-50/40' : 'border-slate-100'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  n.type === 'message' ? 'bg-blue-50 text-blue-600' : 'bg-violet-50 text-violet-600'
                }`}
              >
                <Icon icon={n.type === 'message' ? 'fa-envelope' : 'fa-users'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-slate-800 truncate">{n.title}</p>
                  <span className="text-[10px] text-slate-400 flex-shrink-0">{relativeDate(n.date)}</span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{n.description}</p>
              </div>
              {!n.read && <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}