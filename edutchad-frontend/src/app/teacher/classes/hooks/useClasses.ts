import { useEffect, useState } from 'react';
import { api } from '../services/api';

export function useClasses(teacherId: string | null) {
  const [courses, setCourses] = useState<any[]>([]);
  const [mainClassId, setMainClassId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teacherId) {
      setLoading(false);
      return;
    }
    Promise.all([
      api.get(`/teachers/${teacherId}/courses`),
      api.get(`/teachers/${teacherId}/main-class`).catch(() => null),
    ])
      .then(([coursesData, mainClass]) => {
        setCourses(Array.isArray(coursesData) ? coursesData : []);
        if (mainClass?.id) setMainClassId(mainClass.id);
      })
      .finally(() => setLoading(false));
  }, [teacherId]);

  const uniqueClasses = Array.from(
    new Map(courses.map((c) => [c.class.id, c.class])).values()
  );

  return { courses, mainClassId, uniqueClasses, loading };
}