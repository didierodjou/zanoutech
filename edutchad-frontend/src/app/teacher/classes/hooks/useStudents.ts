import { useEffect, useState } from 'react';
import { api } from '../services/api';

export function useStudents(classId: string | null, isMainClass: boolean, teacherId: string | null) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = () => {
    if (!classId) return;
    setLoading(true);
    const url =
      isMainClass && teacherId
        ? `/teachers/${teacherId}/class-students`
        : `/teachers/class/${classId}/students`;

    api.get(url)
      .then((data) => {
        const studs = Array.isArray(data)
          ? data
          : Array.isArray(data?.students)
          ? data.students
          : Array.isArray(data?.class?.students)
          ? data.class.students
          : [];
        setStudents(studs);
      })
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refetch();
  }, [classId, isMainClass, teacherId]);

  return { students, loading, refetch };
}