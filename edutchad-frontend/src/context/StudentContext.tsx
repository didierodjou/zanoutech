'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface StudentInfo {
  id: string;
  firstName: string;
  lastName: string;
  registrationNo: string;
  photo?: string;
  class?: { id: string; name: string; level: string };
}

interface StudentContextType {
  student: StudentInfo | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export function StudentProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchStudent = async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || user.role !== 'STUDENT') {
      router.push('/');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let studentId = user.studentId;

      if (!studentId) {
        // Fallback: recherche par userId
        const res = await fetch(`${API_BASE}/students`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Impossible de récupérer le profil');
        const list = await res.json();
        const match = list.find((s: any) => s.userId === user.id);
        if (!match) throw new Error('Profil élève introuvable');
        studentId = match.id;
        user.studentId = studentId;
        localStorage.setItem('user', JSON.stringify(user));
      }

      const res = await fetch(`${API_BASE}/students/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = await res.json();
      setStudent(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, []);

  return (
    <StudentContext.Provider value={{ student, loading, error, refetch: fetchStudent }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
}