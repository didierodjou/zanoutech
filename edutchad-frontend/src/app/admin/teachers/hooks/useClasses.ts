// app/teachers/hooks/useClasses.ts
import { useState, useEffect } from 'react';
import { Class } from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function useActiveClasses() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        //const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/teachers/classes/active`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setClasses(data);
      } catch (error) {
        console.error('Erreur chargement classes actives', error);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  return { classes, loading };
}