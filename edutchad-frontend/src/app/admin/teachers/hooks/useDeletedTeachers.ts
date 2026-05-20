// app/teachers/hooks/useDeletedTeachers.ts
import { useState, useEffect, useCallback } from 'react';
import { Teacher } from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface UseDeletedTeachersReturn {
  deletedTeachers: Teacher[];
  loading: boolean;
  error: string | null;
  fetchDeleted: () => Promise<void>;
  restoreTeacher: (id: string, name: string) => Promise<boolean>;
  hardDeleteTeacher: (id: string, name: string) => Promise<boolean>;
}

/**
 * Hook dédié à la gestion des professeurs en corbeille.
 *
 * Expose :
 *  - deletedTeachers  : liste des professeurs avec isDeleted = true
 *  - loading / error  : état de chargement
 *  - fetchDeleted     : re-fetch manuel
 *  - restoreTeacher   : restaure un professeur (isDeleted → false)
 *  - hardDeleteTeacher: supprime définitivement un professeur (admin uniquement)
 */
export function useDeletedTeachers(): UseDeletedTeachersReturn {
  const [deletedTeachers, setDeletedTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const parseErrorMessage = async (res: Response): Promise<string> => {
    try {
      const body = await res.json();
      return body?.message || body?.error || `Erreur ${res.status}`;
    } catch {
      return `Erreur ${res.status}`;
    }
  };

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchDeleted = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/teachers/deleted`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const msg = await parseErrorMessage(res);
        throw new Error(msg);
      }
      const data: Teacher[] = await res.json();
      setDeletedTeachers(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Impossible de charger les professeurs supprimés';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Restore ───────────────────────────────────────────────────────────────

  const restoreTeacher = async (id: string, name: string): Promise<boolean> => {
    if (!confirm(`Restaurer le professeur ${name} ?\nSon compte sera réactivé.`)) {
      return false;
    }
    try {
      const res = await fetch(`${API_URL}/teachers/${id}/restore`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const msg = await parseErrorMessage(res);
        alert(`Erreur lors de la restauration : ${msg}`);
        return false;
      }
      // Mise à jour locale optimiste : retirer immédiatement de la liste
      setDeletedTeachers((prev) => prev.filter((t) => t.id !== id));
      return true;
    } catch {
      alert('Erreur réseau. Veuillez réessayer.');
      return false;
    }
  };

  // ── Hard Delete ───────────────────────────────────────────────────────────

  const hardDeleteTeacher = async (id: string, name: string): Promise<boolean> => {
    const confirmed = confirm(
      `⚠️  SUPPRESSION DÉFINITIVE\n\nVous êtes sur le point de supprimer définitivement le professeur "${name}".\n\nCette action est IRRÉVERSIBLE. Toutes ses données seront perdues.\n\nConfirmer ?`,
    );
    if (!confirmed) return false;

    try {
      const res = await fetch(`${API_URL}/teachers/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const msg = await parseErrorMessage(res);
        alert(`Erreur lors de la suppression : ${msg}`);
        return false;
      }
      // Retrait immédiat de la liste locale
      setDeletedTeachers((prev) => prev.filter((t) => t.id !== id));
      return true;
    } catch {
      alert('Erreur réseau. Veuillez réessayer.');
      return false;
    }
  };

  // ── Initial load ──────────────────────────────────────────────────────────

  useEffect(() => {
    fetchDeleted();
  }, [fetchDeleted]);

  return {
    deletedTeachers,
    loading,
    error,
    fetchDeleted,
    restoreTeacher,
    hardDeleteTeacher,
  };
}