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
    setLoading(true);
    setError(null);

    try {
      // Le cookie httpOnly part automatiquement, pas besoin de token en JS
      const res = await fetch(`${API_BASE}/students/profile`, {
        credentials: 'include',
      });

      if (!res.ok) {
        router.push('/login');
        return;
      }

      const data = await res.json();
      setStudent(data);
    } catch (err: any) {
      setError(err.message);
      router.push('/login');
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