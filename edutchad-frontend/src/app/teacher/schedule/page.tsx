'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';

interface ScheduleSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
  course: {
    subject: { id: string; name: string; color: string };
    class:   { id: string; name: string };
  };
}

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const HOURS = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];
const API = 'http://localhost:3001';
const sc = (c?: string) => c || '#6366f1';

function getToken()     { return localStorage.getItem('token') || ''; }
function getTeacherId() {
  try { return JSON.parse(localStorage.getItem('user') || '{}').teacherId || ''; }
  catch { return ''; }
}

// Convertit "08:30" → minutes depuis minuit
const toMin = (t: string) => { const [h,m] = t.split(':').map(Number); return h*60+m; };
// Hauteur d'une heure en px
const PX_PER_HOUR = 80;

export default function SchedulePage() {
  const [slots, setSlots]   = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView]     = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const tid = getTeacherId();
    if (!tid) return;
    fetch(`${API}/schedule/teacher/${tid}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setSlots(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Regrouper par jour
  const byDay = (day: number) => slots.filter(s => s.dayOfWeek === day);
  const today = new Date().getDay(); // 0=dim, 1=lun…

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Icon icon="fa-calendar-alt" /> Emploi du temps
          </h1>
          <p className="text-violet-200 text-sm mt-1">{slots.length} créneaux cette semaine</p>
        </div>
        <div className="flex gap-2">
          {(['grid','list'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${view === v ? 'bg-white text-violet-700' : 'bg-white/10 text-white hover:bg-white/20'}`}>
              <Icon icon={v === 'grid' ? 'fa-th' : 'fa-list'} className="mr-1" />
              {v === 'grid' ? 'Grille' : 'Liste'}
            </button>
          ))}
        </div>
      </div>

      {slots.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
          <Icon icon="fa-calendar-times" className="text-5xl text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">Aucun créneau dans votre emploi du temps</p>
          <p className="text-slate-400 text-sm mt-1">Contactez l'administration</p>
        </div>
      ) : view === 'list' ? (
        /* ── Vue liste ──────────────────────────────────────────────────── */
        <div className="space-y-4">
          {DAYS.map((day, i) => {
            const daySlots = byDay(i + 1).sort((a,b) => toMin(a.startTime) - toMin(b.startTime));
            if (daySlots.length === 0) return null;
            const isToday = (i + 1) === today;
            return (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className={`px-5 py-3 flex items-center gap-2 ${isToday ? 'bg-violet-50 border-b border-violet-100' : 'border-b border-slate-100'}`}>
                  <span className={`font-bold ${isToday ? 'text-violet-700' : 'text-slate-700'}`}>{day}</span>
                  {isToday && <span className="text-xs bg-violet-600 text-white px-2 py-0.5 rounded-full">Aujourd'hui</span>}
                  <span className="text-xs text-slate-400 ml-auto">{daySlots.length} cours</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {daySlots.map(slot => (
                    <div key={slot.id} className="px-5 py-3 flex items-center gap-4">
                      <div className="text-center w-20 flex-shrink-0">
                        <p className="text-sm font-bold text-slate-700">{slot.startTime}</p>
                        <p className="text-xs text-slate-400">{slot.endTime}</p>
                      </div>
                      <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: sc(slot.course.subject?.color) }} />
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800 text-sm">{slot.course.subject?.name}</p>
                        <p className="text-xs text-slate-400">Classe {slot.course.class?.name}
                          {slot.room && <span> · Salle {slot.room}</span>}
                        </p>
                      </div>
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-lg">
                        {Math.round((toMin(slot.endTime) - toMin(slot.startTime)) / 60 * 10) / 10}h
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Vue grille ─────────────────────────────────────────────────── */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Header jours */}
              <div className="grid border-b border-slate-100" style={{ gridTemplateColumns: '60px repeat(6, 1fr)' }}>
                <div className="p-3" />
                {DAYS.map((d, i) => {
                  const isToday = (i + 1) === today;
                  return (
                    <div key={i} className={`p-3 text-center border-l border-slate-50 ${isToday ? 'bg-violet-50' : ''}`}>
                      <p className={`text-sm font-bold ${isToday ? 'text-violet-700' : 'text-slate-600'}`}>{d}</p>
                      {isToday && <span className="text-xs bg-violet-600 text-white px-1.5 py-0.5 rounded-full">Auj.</span>}
                    </div>
                  );
                })}
              </div>

              {/* Corps grille */}
              <div className="relative grid" style={{ gridTemplateColumns: '60px repeat(6, 1fr)' }}>
                {/* Colonne heures */}
                <div>
                  {HOURS.map(h => (
                    <div key={h} style={{ height: PX_PER_HOUR }} className="border-b border-slate-50 flex items-start justify-end pr-2 pt-1">
                      <span className="text-xs text-slate-300 font-medium">{h}</span>
                    </div>
                  ))}
                </div>

                {/* Colonnes jours */}
                {DAYS.map((_, di) => {
                  const isToday = (di + 1) === today;
                  const daySlots = byDay(di + 1);
                  const startHour = toMin(HOURS[0]);
                  return (
                    <div key={di} className={`relative border-l border-slate-50 ${isToday ? 'bg-violet-50/30' : ''}`}
                         style={{ height: HOURS.length * PX_PER_HOUR }}>
                      {/* Lignes horizontales */}
                      {HOURS.map((_, hi) => (
                        <div key={hi} className="absolute w-full border-b border-slate-50" style={{ top: hi * PX_PER_HOUR }} />
                      ))}
                      {/* Créneaux */}
                      {daySlots.map(slot => {
                        const top  = ((toMin(slot.startTime) - startHour) / 60) * PX_PER_HOUR;
                        const h    = ((toMin(slot.endTime) - toMin(slot.startTime)) / 60) * PX_PER_HOUR;
                        return (
                          <div
                            key={slot.id}
                            className="absolute left-1 right-1 rounded-lg p-2 overflow-hidden shadow-sm"
                            style={{ top: top + 2, height: h - 4, background: sc(slot.course.subject?.color) + '22', borderLeft: `3px solid ${sc(slot.course.subject?.color)}` }}
                          >
                            <p className="text-xs font-bold truncate" style={{ color: sc(slot.course.subject?.color) }}>
                              {slot.course.subject?.name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{slot.course.class?.name}</p>
                            {slot.room && <p className="text-xs text-slate-400">{slot.room}</p>}
                            <p className="text-xs text-slate-400">{slot.startTime}–{slot.endTime}</p>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}