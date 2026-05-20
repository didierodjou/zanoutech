// app/teacher/classes/components/AttendanceBySubject.tsx
'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';

interface Subject {
  id: string;
  name: string;
  color: string;
}

interface ScheduleSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  registrationNo: string;
}

interface AttendanceRecord {
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

interface AttendanceBySubjectProps {
  classId: string;
  className: string;
  teacherId: string;
  onClose: () => void;
}

export default function AttendanceBySubject({ classId, className, teacherId, onClose }: AttendanceBySubjectProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendances, setAttendances] = useState<Record<string, AttendanceRecord>>({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [courseId, setCourseId] = useState<string | null>(null);

  const headers = { Authorization: `Bearer ${localStorage.getItem('token') || ''}` };

  // Charger les matières enseignées dans cette classe
  useEffect(() => {
    const fetchSubjects = async () => {
      const res = await fetch(`${API}/teachers/${teacherId}/courses`, { headers });
      const courses = await res.json();
      const classSubjects = courses
        .filter((c: any) => c.class.id === classId)
        .map((c: any) => c.subject);
      setSubjects(classSubjects);
    };
    fetchSubjects();
  }, [classId, teacherId]);

  // Charger les créneaux horaires quand la matière est sélectionnée
  useEffect(() => {
    if (!selectedSubject) {
      setScheduleSlots([]);
      setSelectedSlot(null);
      setCourseId(null);
      return;
    }

    const fetchSlots = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API}/attendance/teacher/${teacherId}/slots?classId=${classId}&subjectId=${selectedSubject.id}`,
          { headers }
        );
        const data = await res.json();
        setScheduleSlots(data.scheduleSlots || []);
        setCourseId(data.courseId);
      } catch (error) {
        console.error('Erreur chargement créneaux:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSlots();
  }, [selectedSubject, classId, teacherId]);

  // Charger les élèves de la classe
  useEffect(() => {
    const fetchStudents = async () => {
      const res = await fetch(`${API}/attendance/class/${classId}/students`, { headers });
      const data = await res.json();
      setStudents(data);
      // Initialiser les présences
      const initial: Record<string, AttendanceRecord> = {};
      data.forEach((s: Student) => {
        initial[s.id] = { studentId: s.id, status: 'PRESENT' };
      });
      setAttendances(initial);
    };
    fetchStudents();
  }, [classId]);

  // Charger les présences existantes pour ce cours et cette date
  useEffect(() => {
    if (!courseId || !selectedSlot) return;

    const fetchExisting = async () => {
      const res = await fetch(`${API}/attendance/course/${courseId}?date=${date}`, { headers });
      if (res.ok) {
        const existing = await res.json();
        const newAttendances = { ...attendances };
        existing.forEach((a: any) => {
          newAttendances[a.studentId] = {
            studentId: a.studentId,
            status: a.status
          };
        });
        setAttendances(newAttendances);
      }
    };
    fetchExisting();
  }, [courseId, selectedSlot, date]);

  const updateAttendanceStatus = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setAttendances(prev => ({
      ...prev,
      [studentId]: { studentId, status }
    }));
  };

  const saveAttendance = async () => {
    if (!courseId || !selectedSlot) {
      alert('Veuillez sélectionner une matière et un créneau horaire');
      return;
    }

    setSaving(true);
    try {
      const attendanceList = Object.values(attendances).map(a => ({
        studentId: a.studentId,
        status: a.status
      }));

      const res = await fetch(`${API}/attendance/save`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          date,
          attendances: attendanceList,
          scheduleSlotId: selectedSlot.id
        })
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const error = await res.json();
        alert(`Erreur: ${error.message}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      alert('Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  const stats = {
    present: Object.values(attendances).filter(a => a.status === 'PRESENT').length,
    absent: Object.values(attendances).filter(a => a.status === 'ABSENT').length,
    late: Object.values(attendances).filter(a => a.status === 'LATE').length,
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl">
        {/* En-tête */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-t-2xl flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Icon icon="fa-user-check" />
              Saisie des présences
            </h2>
            <p className="text-teal-200 text-sm mt-0.5">
              Classe: {className}
            </p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <Icon icon="fa-times" className="text-xl" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Sélection de la matière */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Matière
            </label>
            <div className="flex gap-2 flex-wrap">
              {subjects.map(subject => (
                <button
                  key={subject.id}
                  onClick={() => setSelectedSubject(subject)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedSubject?.id === subject.id
                      ? 'text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  style={selectedSubject?.id === subject.id ? { backgroundColor: subject.color || '#14b8a6' } : {}}
                >
                  {subject.name}
                </button>
              ))}
            </div>
          </div>

          {/* Sélection du créneau horaire */}
          {selectedSubject && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Créneau horaire
              </label>
              {loading ? (
                <div className="flex items-center gap-2 text-slate-400">
                  <Icon icon="fa-spinner" className="fa-spin" />
                  Chargement des créneaux...
                </div>
              ) : scheduleSlots.length === 0 ? (
                <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
                  Aucun créneau horaire défini pour cette matière. Veuillez d'abord configurer l'emploi du temps.
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {scheduleSlots.map(slot => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-3 rounded-lg border-2 text-left transition ${
                        selectedSlot?.id === slot.id
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-slate-200 hover:border-teal-300'
                      }`}
                    >
                      <p className="font-semibold text-slate-800">
                        {DAYS[slot.dayOfWeek - 1]}
                      </p>
                      <p className="text-sm text-slate-500">
                        {slot.startTime} - {slot.endTime}
                      </p>
                      {slot.room && (
                        <p className="text-xs text-slate-400">Salle: {slot.room}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sélection de la date */}
          {selectedSlot && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Date du cours
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border border-slate-300 rounded-lg px-4 py-2 text-sm focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
          )}

          {/* Tableau des présences */}
          {selectedSlot && students.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-800">Liste des élèves</h3>
                <div className="flex gap-3 text-sm">
                  <span className="text-emerald-600">✅ Présents: {stats.present}</span>
                  <span className="text-red-600">❌ Absents: {stats.absent}</span>
                  <span className="text-amber-600">⏰ Retards: {stats.late}</span>
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-slate-600 font-semibold">#</th>
                      <th className="px-4 py-3 text-left text-slate-600 font-semibold">Élève</th>
                      <th className="px-4 py-3 text-left text-slate-600 font-semibold">Matricule</th>
                      <th className="px-4 py-3 text-center text-slate-600 font-semibold w-48">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((student, index) => (
                      <tr key={student.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-400">{index + 1}</td>
                        <td className="px-4 py-3 font-medium text-slate-700">
                          {student.lastName} {student.firstName}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {student.registrationNo}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => updateAttendanceStatus(student.id, 'PRESENT')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                                attendances[student.id]?.status === 'PRESENT'
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-700'
                              }`}
                            >
                              <Icon icon="fa-check" />
                              Présent
                            </button>
                            <button
                              onClick={() => updateAttendanceStatus(student.id, 'ABSENT')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                                attendances[student.id]?.status === 'ABSENT'
                                  ? 'bg-red-500 text-white'
                                  : 'bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-700'
                              }`}
                            >
                              <Icon icon="fa-times" />
                              Absent
                            </button>
                            <button
                              onClick={() => updateAttendanceStatus(student.id, 'LATE')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                                attendances[student.id]?.status === 'LATE'
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-slate-100 text-slate-500 hover:bg-amber-100 hover:text-amber-700'
                              }`}
                            >
                              <Icon icon="fa-clock" />
                              Retard
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Message de confirmation */}
          {saved && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-700 text-sm flex items-center gap-2">
              <Icon icon="fa-check-circle" />
              Présences enregistrées avec succès !
            </div>
          )}

          {/* Bouton d'enregistrement */}
          {selectedSlot && (
            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={saveAttendance}
                disabled={saving}
                className="flex items-center gap-2 bg-teal-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-teal-700 transition disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Icon icon="fa-spinner" className="fa-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Icon icon="fa-save" />
                    Enregistrer les présences
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}