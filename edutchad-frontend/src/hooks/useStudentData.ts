import { useState, useEffect, useCallback } from 'react';
import { useStudent } from '@/context/StudentContext';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Grade {
  id: string;
  value: number;
  coefficient: number;
  trimester: number;
  subject: { id: string; name: string; color?: string; category: string; coefficient: number };
}

export interface Absence {
  id: string;
  date: string;
  type: string;
  isJustified: boolean;
  reason?: string;
}

export interface Bulletin {
  id: string;
  trimester: number;
  period: string;
  status: 'PENDING' | 'VERIFIED' | 'CONFIRMED';
  generalAverage?: number;
  conduiteNote?: number;
  appreciation?: string;
}

export interface Punishment {
  id: string;
  hours: number;
  reason?: string;
  date: string;
  trimester: number;
}

export interface StudentDetails {
  id: string;
  firstName: string;
  lastName: string;
  registrationNo: string;
  sex?: string;
  dateOfBirth: string;
  photo?: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  tuitionFee?: number;
  tuitionPaid: number;
  tuitionStatus: 'PAID' | 'UNPAID' | 'PARTIAL';
  class?: { id: string; name: string; level: string };
  grades: Grade[];
  absences: Absence[];
  bulletins: Bulletin[];
  punishments: Punishment[];
}

export function useStudentDetails() {
  // `studentLoading` : le StudentContext lui-même est en train de résoudre le profil
  // (ex: appel à GET /students/profile). Sans ça, si `student` reste `null` (utilisateur
  // non authentifié, erreur silencieuse dans le contexte...), `loading` restait bloqué
  // à `true` pour toujours car fetchDetails n'était jamais déclenché.
  const { student, loading: studentLoading } = useStudent();
  const [details, setDetails] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!student?.id) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/students/${student.id}/details`, {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error(
          res.status === 404
            ? 'Profil élève introuvable.'
            : res.status === 401
              ? 'Session expirée, veuillez vous reconnecter.'
              : 'Impossible de charger les données'
        );
      }
      const data = await res.json();
      setDetails(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [student?.id]);

  useEffect(() => {
    if (studentLoading) {
      // Le contexte élève est encore en train de charger : on attend, pas d'appel API.
      return;
    }
    if (!student?.id) {
      // Le contexte a fini de charger mais aucun élève n'est disponible.
      setLoading(false);
      setError("Impossible d'identifier l'élève connecté. Veuillez vous reconnecter.");
      return;
    }
    fetchDetails();
  }, [studentLoading, student?.id, fetchDetails]);

  return { details, loading, error, refetch: fetchDetails };
}