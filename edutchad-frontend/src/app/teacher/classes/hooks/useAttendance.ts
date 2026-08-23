import { useState, useEffect } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

type AttendanceStatus = 'present' | 'absent' | 'late' | null;

interface UseAttendanceParams {
  classId: string | null;
  students: any[];
  courses: any[];
  teacherId: string | null;
}

export function useAttendance({ classId, students, courses, teacherId }: UseAttendanceParams) {
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [saving, setSaving] = useState(false);

  // Réinitialiser la présence quand la classe change
  useEffect(() => {
    const init: Record<string, AttendanceStatus> = {};
    students.forEach((s) => { init[s.id] = null; });
    setAttendance(init);
  }, [students]);

  const saveAttendance = async () => {
    if (!classId) return;
    const entries = Object.entries(attendance).filter(([, v]) => v !== null);
    if (entries.length === 0) {
      toast.error('Aucune présence à enregistrer');
      return;
    }
    setSaving(true);
    try {
      // Pour l'exemple, on envoie chaque absence en POST. On pourrait améliorer avec un batch.
      await Promise.all(
        entries.map(([studentId, status]) =>
          api.post('/absences', {
            studentId,
            classId,
            date: attendanceDate,
            type: status === 'late' ? 'RETARD' : status === 'absent' ? 'ABSENCE' : 'PRESENCE',
            isJustified: false,
          })
        )
      );
      toast.success('Présence enregistrée');
    } catch {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  return {
    attendanceDate,
    setAttendanceDate,
    attendance,
    setAttendance,
    saving,
    saveAttendance,
  };
}