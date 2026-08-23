'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  registrationNo: string;
}

interface Course {
  id: string;
  subject: { id: string; name: string; color: string };
  class: { id: string };
}

interface Slot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
  courseId: string;
}

type AttendanceStatus = 'present' | 'absent' | 'late';

interface AttendanceTabProps {
  students: Student[];
  courses: Course[];
  classId: string;
  teacherId: string;
  attendanceDate: string;
  setAttendanceDate: (date: string) => void;
  attendance: Record<string, AttendanceStatus | null>;
  setAttendance: (att: Record<string, AttendanceStatus | null>) => void;
  saving: boolean;
  saveAttendance: () => Promise<void>;
}

const ATTENDANCE_CFG: Record<AttendanceStatus, { label: string; activeClass: string; checkClass: string }> = {
  present: {
    label: 'Présent',
    activeClass: 'bg-emerald-50 border-emerald-300 text-emerald-800',
    checkClass: 'bg-emerald-600 border-emerald-600 text-white',
  },
  absent: {
    label: 'Absent',
    activeClass: 'bg-rose-50 border-rose-300 text-rose-800',
    checkClass: 'bg-rose-600 border-rose-600 text-white',
  },
  late: {
    label: 'Retard',
    activeClass: 'bg-amber-50 border-amber-300 text-amber-800',
    checkClass: 'bg-amber-500 border-amber-500 text-white',
  },
};

export function AttendanceTab({
  students,
  courses,
  classId,
  attendanceDate,
  setAttendanceDate,
  attendance,
  setAttendance,
  saving,
  saveAttendance,
}: AttendanceTabProps) {
  const [attCourseId, setAttCourseId] = useState<string | null>(null);
  const [attSlotId, setAttSlotId] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!attCourseId || !classId) {
      setSlots([]);
      setAttSlotId(null);
      return;
    }
    setLoadingSlots(true);
    api
      .get(`/schedule/class/${classId}`)
      .then((data) => {
        const filtered = (Array.isArray(data) ? data : []).filter(
          (s: any) => s.courseId === attCourseId || s.course?.id === attCourseId
        );
        setSlots(filtered);
        setAttSlotId(filtered.length === 1 ? filtered[0].id : null);
      })
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [attCourseId, classId]);

  const presentCount = Object.values(attendance).filter((v) => v === 'present').length;
  const absentCount = Object.values(attendance).filter((v) => v === 'absent').length;
  const lateCount = Object.values(attendance).filter((v) => v === 'late').length;

  const hasSelectedAnyStatus = Object.values(attendance).some((status) => status !== null);
  const isAttendanceDisabled = !attCourseId || loadingSlots || slots.length === 0;

  const handleSave = async () => {
    if (isAttendanceDisabled || !hasSelectedAnyStatus) return;
    await saveAttendance();
    toast.success('Présence enregistrée avec succès !');
  };

  const setAllStatus = (status: AttendanceStatus | null) => {
    if (isAttendanceDisabled) return;
    const newAtt: Record<string, AttendanceStatus | null> = {};
    students.forEach((s) => {
      newAtt[s.id] = status;
    });
    setAttendance(newAtt);
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    if (isAttendanceDisabled) return;
    const current = attendance[studentId];
    setAttendance({
      ...attendance,
      [studentId]: current === status ? null : status,
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
      {/* 1. Zone de Configuration */}
      <div className="p-5 border-b border-slate-100 space-y-4 bg-slate-50/50">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            1 · Matière
          </label>
          <div className="flex flex-wrap gap-2">
            {courses.map((c) => {
              const active = attCourseId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setAttCourseId(active ? null : c.id);
                    setAttSlotId(null);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition border ${
                    active
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-800 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: c.subject.color || '#4f46e5' }}
                  />
                  {c.subject.name}
                </button>
              );
            })}
          </div>
        </div>

        {attCourseId && (
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              2 · Créneau Horaire
            </label>
            {loadingSlots ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 py-1">
                <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                Chargement des créneaux...
              </div>
            ) : slots.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <Icon icon="fa-exclamation-triangle" className="text-amber-500" />
                <span>
                  <strong>Aucun créneau trouvé.</strong> La saisie de la présence est désactivée pour ce cours.
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => {
                  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
                  const active = attSlotId === slot.id;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setAttSlotId(active ? null : slot.id)}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition border ${
                        active
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-800 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300'
                      }`}
                    >
                      <Icon icon="fa-clock" className="text-xs opacity-70" />
                      <span>
                        {days[slot.dayOfWeek]} · {slot.startTime} – {slot.endTime}
                      </span>
                      {slot.room && (
                        <span className="text-xs px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-normal">
                          {slot.room}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Barre de contrôle globale */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-200/60">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Date :</label>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              disabled={isAttendanceDisabled}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:cursor-not-allowed bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAllStatus('present')}
              disabled={isAttendanceDisabled}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Tous présents
            </button>
            <button
              type="button"
              onClick={() => setAllStatus(null)}
              disabled={isAttendanceDisabled}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Réinitialiser
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
              {presentCount} Présents
            </span>
            <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800">
              {absentCount} Absents
            </span>
            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
              {lateCount} Retards
            </span>
          </div>
        </div>
      </div>

      {/* 2. Tableau de Saisie des Présences */}
      {!attCourseId ? (
        <div className="p-12 text-center text-slate-400">
          <Icon icon="fa-hand-pointer" className="text-3xl mb-3 text-slate-300 animate-bounce" />
          <p className="text-sm font-medium">Veuillez sélectionner une matière pour commencer l'appel.</p>
        </div>
      ) : isAttendanceDisabled ? (
        <div className="p-12 text-center text-slate-400 bg-slate-50/50">
          <Icon icon="fa-lock" className="text-3xl mb-3 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">
            Saisie indisponible : aucun créneau de cours valide trouvé.
          </p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-slate-100">
            {students.map((student, idx) => {
              const currentStatus = attendance[student.id];

              return (
                <div
                  key={student.id}
                  className={`px-5 py-3.5 flex items-center justify-between gap-4 transition hover:bg-slate-50/80 ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                  }`}
                >
                  {/* Info Étudiant */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                      {student.firstName[0]}
                      {student.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {student.lastName.toUpperCase()} {student.firstName}
                      </p>
                      <p className="text-xs text-slate-400 font-mono">{student.registrationNo}</p>
                    </div>
                  </div>

                  {/* Contrôle Checkboxes */}
                  <div className="flex items-center gap-2">
                    {(Object.keys(ATTENDANCE_CFG) as AttendanceStatus[]).map((statusKey) => {
                      const cfg = ATTENDANCE_CFG[statusKey];
                      const isChecked = currentStatus === statusKey;

                      return (
                        <label
                          key={statusKey}
                          onClick={() => handleStatusChange(student.id, statusKey)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer select-none transition ${
                            isChecked
                              ? cfg.activeClass
                              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                              isChecked ? cfg.checkClass : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isChecked && <Icon icon="fa-check" className="text-[10px]" />}
                          </div>
                          <span>{cfg.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions finales */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !hasSelectedAnyStatus}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Icon icon="fa-spinner" className="animate-spin" /> Enregistrement...
                </>
              ) : (
                <>
                  <Icon icon="fa-save" /> Enregistrer la présence
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}