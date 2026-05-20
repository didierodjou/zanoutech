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
  const { student } = useStudent();
  const [details, setDetails] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!student?.id) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/students/${student.id}/details`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Impossible de charger les données');
      const data = await res.json();
      setDetails(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [student?.id]);

  useEffect(() => {
    if (student?.id) fetchDetails();
  }, [student?.id, fetchDetails]);

  return { details, loading, error, refetch: fetchDetails };
}