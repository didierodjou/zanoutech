// app/teachers/hooks/useSubjects.ts
import { useState, useEffect } from 'react';
import { Subject } from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/subjects`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setSubjects(data);
      } catch (error) {
        console.error('Erreur chargement matières', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  return { subjects, loading };
}