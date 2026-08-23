import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

interface UseBulletinsParams {
  classId: string | null;
  enabled: boolean;
}

export function useBulletins({ classId, enabled }: UseBulletinsParams) {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBulletins = useCallback(async () => {
    if (!classId || !enabled) {
      setList([]);
      return;
    }
    setLoading(true);
    try {
      const data = await api.get(`/bulletins/class/${classId}?period=TRIMESTRE_1`);
      setList(Array.isArray(data) ? data : []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [classId, enabled]);

  useEffect(() => {
    fetchBulletins();
  }, [fetchBulletins]);

  const pendingCount = list.filter((b) => b.status === 'PENDING').length;
  const verifiedCount = list.filter((b) => b.status === 'VERIFIED').length;
  const confirmedCount = list.filter((b) => b.status === 'CONFIRMED').length;

  return {
    list,
    loading,
    pendingCount,
    verifiedCount,
    confirmedCount,
    refetch: fetchBulletins,
  };
}