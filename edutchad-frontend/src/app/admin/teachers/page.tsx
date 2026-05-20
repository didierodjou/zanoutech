// app/teachers/page.tsx
'use client';

import { useState } from 'react';
import { useTeachers } from './hooks/useTeachers';
import { useDeletedTeachers } from './hooks/useDeletedTeachers';
import { useActiveClasses } from './hooks/useClasses';
import { useSubjects } from './hooks/useSubjects';
import StatsCards from './components/StatsCards';
import TeacherFilters from './components/TeacherFilters';
import TeacherTable from './components/TeacherTable';
import TeacherCardGrid from './components/TeacherCardGrid';
import DeletedTeachersList from './components/DeletedTeachersList';
import AddTeacherModal from './components/modals/AddTeacherModal';
import EditTeacherModal from './components/modals/EditTeacherModal';
import ChangePasswordModal from './components/modals/ChangePasswordModal';
import AssignMainClassModal from './components/modals/AssignMainClassModal';
import AssignSubjectsModal from './components/modals/AssignSubjectsModal';
import AssignClassModal from './components/modals/AssignClassModal';
import TeacherDetailsModal from './components/modals/TeacherDetailsModal';
import Icon from '@/components/ui/Icon';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function TeachersPage() {
  const {
    teachers,
    filteredTeachers,
    setFilteredTeachers,
    loading,
    error,
    fetchTeachers,
    softDeleteTeacher,
  } = useTeachers();

  const {
    deletedTeachers,
    loading: deletedLoading,
    error: deletedError,
    fetchDeleted,
    restoreTeacher,
    hardDeleteTeacher,
  } = useDeletedTeachers();

  const { classes } = useActiveClasses();
  const { subjects } = useSubjects();

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showDeleted, setShowDeleted] = useState(false);

  // ── Modal helpers ────────────────────────────────────────────────────────

  const openModal = (name: string, teacher?: any) => {
    if (teacher) setSelectedTeacher(teacher);
    setActiveModal(name);
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedTeacher(null);
  };

  // ── Mutation handlers ────────────────────────────────────────────────────

  /** Retire le rôle de professeur principal via API */
  const handleRemoveMainClass = async (teacherId: string, teacherName: string) => {
    if (
      !confirm(
        `Êtes-vous sûr de vouloir retirer le rôle de professeur principal à ${teacherName} ?`,
      )
    ) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/teachers/${teacherId}/remove-main-class`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchTeachers();
      } else {
        const body = await res.json().catch(() => null);
        alert(`Erreur : ${body?.message ?? res.statusText}`);
      }
    } catch {
      alert('Erreur réseau. Veuillez réessayer.');
    }
  };

  /** Retire une matière spécifique */
  const handleRemoveSubject = async (
    teacherId: string,
    subjectId: string,
    subjectName: string,
  ) => {
    if (!confirm(`Retirer la matière "${subjectName}" ?`)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/teachers/${teacherId}/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchTeachers();
      } else {
        const body = await res.json().catch(() => null);
        alert(`Erreur : ${body?.message ?? res.statusText}`);
      }
    } catch {
      alert('Erreur réseau. Veuillez réessayer.');
    }
  };

  /** Retire une classe (cours) spécifique */
  const handleRemoveClass = async (
    teacherId: string,
    classId: string,
    subjectId: string,
    className: string,
    subjectName: string,
  ) => {
    if (
      !confirm(`Retirer la classe "${className}" pour la matière "${subjectName}" ?`)
    ) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${API_URL}/teachers/${teacherId}/classes/${classId}/subjects/${subjectId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        fetchTeachers();
      } else {
        const body = await res.json().catch(() => null);
        alert(`Erreur : ${body?.message ?? res.statusText}`);
      }
    } catch {
      alert('Erreur réseau. Veuillez réessayer.');
    }
  };

  /** Rafraîchit les deux listes après toute modification */
  const refreshAll = () => {
    fetchTeachers();
    fetchDeleted();
  };

  // ── Restore with cross-list refresh ─────────────────────────────────────

  const handleRestore = async (id: string, name: string): Promise<boolean> => {
    const ok = await restoreTeacher(id, name);
    if (ok) fetchTeachers(); // re-sync liste active
    return ok;
  };

  const handleHardDelete = async (id: string, name: string): Promise<boolean> => {
    return hardDeleteTeacher(id, name);
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-8 bg-gray-50 min-h-screen">

      {/* Page header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Professeurs</h1>
          <p className="text-gray-600 mt-1">
            {!showDeleted ? (
              <>
                {filteredTeachers.length} professeur
                {filteredTeachers.length > 1 ? 's' : ''} actif(s) ·{' '}
                {teachers.filter((t) => t.mainClass).length} principal(aux)
              </>
            ) : (
              <>
                {deletedTeachers.length} professeur
                {deletedTeachers.length > 1 ? 's' : ''} en corbeille
              </>
            )}
          </p>
        </div>

        <div className="flex gap-3">
          {/* Corbeille toggle */}
          <button
            onClick={() => setShowDeleted(!showDeleted)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition font-medium text-sm ${
              showDeleted
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            <Icon icon={showDeleted ? 'fa-arrow-left' : 'fa-trash-alt'} />
            {showDeleted ? 'Voir les actifs' : 'Corbeille'}
            {!showDeleted && deletedTeachers.length > 0 && (
              <span className="ml-1 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                {deletedTeachers.length}
              </span>
            )}
          </button>

          {/* New teacher button – hidden in trash view */}
          {!showDeleted && (
            <button
              onClick={() => openModal('add')}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium transition"
            >
              <span className="text-lg leading-none">+</span> Nouveau Professeur
            </button>
          )}
        </div>
      </div>

      {/* Active teachers error banner */}
      {!showDeleted && error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-3">
          <Icon icon="fa-exclamation-circle" />
          <span>Erreur : {error}</span>
          <button onClick={fetchTeachers} className="ml-auto underline text-sm hover:text-red-900">
            Réessayer
          </button>
        </div>
      )}

      {/* Active teachers view */}
      {!showDeleted && (
        <>
          <StatsCards teachers={teachers} classes={classes} subjects={subjects} />
          <TeacherFilters
            teachers={teachers}
            onFilter={setFilteredTeachers}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </>
      )}

      {/* Conditional content */}
      {showDeleted ? (
        <DeletedTeachersList
          teachers={deletedTeachers}
          onRestore={handleRestore}
          onHardDelete={handleHardDelete}
          loading={deletedLoading}
          error={deletedError}
          onRetry={fetchDeleted}
        />
      ) : loading ? (
        <div className="flex justify-center items-center py-20 gap-3 text-gray-500">
          <Icon icon="fa-spinner fa-spin" className="text-2xl text-blue-500" />
          <span>Chargement des professeurs…</span>
        </div>
      ) : viewMode === 'table' ? (
        <TeacherTable
          teachers={filteredTeachers}
          onViewDetails={(t) => openModal('details', t)}
          onEdit={(t) => openModal('edit', t)}
          onAssignMain={(t) => openModal('assign-main', t)}
          onAssignSubjects={(t) => openModal('subjects', t)}
          onAssignClass={(t) => openModal('assign-class', t)}
          onDelete={softDeleteTeacher}
        />
      ) : (
        <TeacherCardGrid
          teachers={filteredTeachers}
          onViewDetails={(t) => openModal('details', t)}
          onEdit={(t) => openModal('edit', t)}
          onAssignMain={(t) => openModal('assign-main', t)}
          onAssignSubjects={(t) => openModal('subjects', t)}
          onAssignClass={(t) => openModal('assign-class', t)}
          onDelete={softDeleteTeacher}
          onRemoveMainClass={handleRemoveMainClass}
          onRemoveSubject={handleRemoveSubject}
          onRemoveClass={handleRemoveClass}
        />
      )}

      {/* Modals */}
      {activeModal === 'add' && (
        <AddTeacherModal onClose={closeModal} onSuccess={refreshAll} />
      )}
      {activeModal === 'edit' && selectedTeacher && (
        <EditTeacherModal
          teacher={selectedTeacher}
          onClose={closeModal}
          onSuccess={refreshAll}
        />
      )}
      {activeModal === 'details' && selectedTeacher && (
        <TeacherDetailsModal
          teacher={selectedTeacher}
          onClose={closeModal}
          onRemoveMainClass={handleRemoveMainClass}
        />
      )}
      {activeModal === 'assign-main' && selectedTeacher && (
        <AssignMainClassModal
          teacher={selectedTeacher}
          classes={classes}
          onClose={closeModal}
          onSuccess={refreshAll}
        />
      )}
      {activeModal === 'subjects' && selectedTeacher && (
        <AssignSubjectsModal
          teacher={selectedTeacher}
          subjects={subjects}
          onClose={closeModal}
          onSuccess={refreshAll}
        />
      )}
      {activeModal === 'assign-class' && selectedTeacher && (
        <AssignClassModal
          teacher={selectedTeacher}
          classes={classes}
          subjects={subjects}
          onClose={closeModal}
          onSuccess={refreshAll}
        />
      )}
      {activeModal === 'password' && selectedTeacher && (
        <ChangePasswordModal teacher={selectedTeacher} onClose={closeModal} />
      )}
    </div>
  );
}