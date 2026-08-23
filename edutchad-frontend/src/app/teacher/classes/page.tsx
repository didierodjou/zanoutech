'use client';

import { useState, useCallback } from 'react';
import { useTeacher } from './hooks/useTeacher';
import { useClasses } from './hooks/useClasses';
import { useStudents } from './hooks/useStudents';
import { useAttendance } from './hooks/useAttendance';
import { useBulletins } from './hooks/useBulletins';
import { ClassHeader } from './components/ClassHeader';
import { ClassesSidebar } from './components/ClassesSidebar';
import { StudentsTab } from './components/StudentsTab';
import { AttendanceTab } from './components/AttendanceTab';
import { BulletinsTab } from './components/BulletinsTab';
import { EmptyState } from './components/EmptyState';
import { TabButton } from './components/TabButton';
import { Toaster, toast } from 'react-hot-toast';

export default function ClassesPage() {
  // 1. Récupérer l'enseignant connecté
  const { teacherId, teacher, loading: loadingTeacher } = useTeacher();

  // 2. Récupérer les cours et la classe principale
  const { courses, mainClassId, uniqueClasses, loading: loadingClasses } = useClasses(teacherId);

  // 3. État local
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'students' | 'attendance' | 'bulletins'>('students');

  // 4. Gérer les élèves
  const isMainClass = selectedClass?.id === mainClassId;
  const {
    students,
    loading: loadingStudents,
    refetch: refetchStudents,
  } = useStudents(selectedClass?.id, isMainClass, teacherId);

  // 5. Gérer la présence
  const attendance = useAttendance({
    classId: selectedClass?.id,
    students,
    courses,
    teacherId,
  });

  // 6. Gérer les bulletins (seulement si professeur principal)
  const bulletins = useBulletins({
    classId: selectedClass?.id,
    enabled: isMainClass && activeTab === 'bulletins',
  });

  // 7. Callbacks
  const handleSelectClass = useCallback((cls: any) => {
    setSelectedClass(cls);
    setActiveTab('students');
  }, []);

  const handleTabChange = useCallback((tab: 'students' | 'attendance' | 'bulletins') => {
    setActiveTab(tab);
  }, []);

  // 8. Rendu
  if (loadingTeacher || loadingClasses) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-4 border-teal-200 border-t-teal-600 animate-spin" />
      </div>
    );
  }

  if (!teacherId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-slate-600">Impossible de charger vos informations.</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-xl">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="space-y-5">
        <ClassHeader
          uniqueClassesCount={uniqueClasses.length}
          isMainClass={isMainClass}
          selectedClass={selectedClass}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Sidebar */}
          <ClassesSidebar
            classes={uniqueClasses}
            selectedClass={selectedClass}
            mainClassId={mainClassId}
            onSelect={handleSelectClass}
          />

          {/* Contenu principal */}
          <div className="lg:col-span-3">
            {!selectedClass ? (
              <EmptyState />
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-slate-100">
                  <TabButton
                    label="Élèves"
                    icon="fa-users"
                    active={activeTab === 'students'}
                    onClick={() => handleTabChange('students')}
                    badge={students.length}
                  />
                  <TabButton
                    label="Présence"
                    icon="fa-user-check"
                    active={activeTab === 'attendance'}
                    onClick={() => handleTabChange('attendance')}
                  />
                  {isMainClass && (
                    <TabButton
                      label="Bulletins"
                      icon="fa-file-alt"
                      active={activeTab === 'bulletins'}
                      onClick={() => handleTabChange('bulletins')}
                      badge={bulletins.pendingCount}
                    />
                  )}
                </div>

                {/* Onglets */}
                {activeTab === 'students' && (
                  <StudentsTab students={students} loading={loadingStudents} isMainClass={isMainClass} />
                )}
                {activeTab === 'attendance' && (
                  <AttendanceTab
                    students={students}
                    courses={courses.filter((c) => c.class.id === selectedClass.id)}
                    classId={selectedClass.id}
                    teacherId={teacherId}
                    {...attendance}
                  />
                )}
                {activeTab === 'bulletins' && isMainClass && (
                  <BulletinsTab
                    students={students}
                    bulletins={bulletins}
                    classId={selectedClass.id}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}