'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/Icon';
import { useStudent } from '@/context/StudentContext';
import { LoadingSpinner, ErrorState } from '@/components/student';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ScheduleSlot {
  id: string;
  dayOfWeek: number; // 1 = Lundi, 7 = Dimanche
  startTime: string;
  endTime: string;
  room?: string;
  course: {
    subject: { name: string; color?: string };
    teacher: { firstName: string; lastName: string };
  };
}

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default function SchedulePage() {
  const { student, loading: studentLoading } = useStudent();
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Vérifier que l'étudiant et sa classe existent
    if (!student?.class?.id) return;

    const fetchSchedule = async () => {
      const token = localStorage.getItem('token');
      try {
        // Utiliser la bonne route du backend : /schedule/class/:classId
        const res = await fetch(`${API_BASE}/schedule/class/${student.class!.id}`, {
          credentials: 'include'
        });
        if (!res.ok) throw new Error('Impossible de charger l\'emploi du temps');
        const data = await res.json();
        setSchedule(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [student]);

  if (studentLoading || loading) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} />;

  const scheduleByDay = DAYS.map((day, idx) => ({
    day,
    slots: schedule.filter(s => s.dayOfWeek === idx + 1).sort((a, b) => a.startTime.localeCompare(b.startTime)),
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Emploi du temps</h1>
        <p className="text-slate-500 text-sm">
          {student?.class?.name || 'Classe non définie'} – Semaine du {new Date().toLocaleDateString('fr-FR')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scheduleByDay.map(({ day, slots }) => (
          <motion.div
            key={day}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
          >
            <div className="bg-indigo-50 px-4 py-2 border-b border-indigo-100">
              <h3 className="font-semibold text-indigo-800">{day}</h3>
            </div>
            <div className="p-3 space-y-2">
              {slots.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Aucun cours</p>
              ) : (
                slots.map(slot => (
                  <div key={slot.id} className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {slot.course.subject.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {slot.course.teacher.firstName} {slot.course.teacher.lastName}
                        </p>
                      </div>
                      {slot.room && (
                        <span className="text-xs bg-white px-2 py-0.5 rounded-full text-slate-600">
                          {slot.room}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-indigo-600 mt-1">
                      {slot.startTime} – {slot.endTime}
                    </p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}