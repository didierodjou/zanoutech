// app/teachers/hooks/useTeachers.ts
import { useState, useEffect, useCallback } from 'react';
import { Teacher } from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function useTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/teachers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur chargement professeurs');
      const data = await res.json();
      setTeachers(data);
      setFilteredTeachers(data);
      setError(null);
    } catch (err) {
      setError('Impossible de charger les professeurs');
    } finally {
      setLoading(false);
    }
  }, []);

  const softDeleteTeacher = async (id: string, name: string): Promise<boolean> => {
    if (!confirm(`Supprimer ${name} ? (peut être restauré ultérieurement)`)) return false;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/teachers/${id}/soft`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchTeachers();
        return true;
      }
      const error = await res.text();
      alert(`Erreur: ${error}`);
      return false;
    } catch {
      alert('Erreur réseau');
      return false;
    }
  };

  const restoreTeacher = async (id: string): Promise<boolean> => {
    if (!confirm('Restaurer ce professeur ?')) return false;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/teachers/${id}/restore`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchTeachers();
        return true;
      }
      const error = await res.text();
      alert(`Erreur: ${error}`);
      return false;
    } catch {
      alert('Erreur réseau');
      return false;
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  return {
    teachers,
    filteredTeachers,
    setFilteredTeachers,
    loading,
    error,
    fetchTeachers,
    softDeleteTeacher,
    restoreTeacher,
  };
}