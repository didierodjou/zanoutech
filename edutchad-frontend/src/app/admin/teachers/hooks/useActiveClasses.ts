// app/teachers/hooks/useActiveClasses.ts
import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Class {
  id: string;
  name: string;
  level: string;
  _count?: { students: number };
}

export function useActiveClasses() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        // const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/teachers/classes/active`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Erreur lors du chargement des classes');
        const data = await res.json();
        setClasses(data);
      } catch (err: any) {
        setError(err.message || 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  return { classes, loading, error };
}