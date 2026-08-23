import { useEffect, useState } from 'react';
import { api } from '../services/api';

export function useTeacher() {
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/teachers/profile')
      .then((data) => {
        setTeacher(data);
        setTeacherId(data.id);
      })
      .catch(() => {
        setTeacher(null);
        setTeacherId(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return { teacherId, teacher, loading };
}