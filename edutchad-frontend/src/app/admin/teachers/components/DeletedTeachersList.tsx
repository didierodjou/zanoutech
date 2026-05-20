// app/teachers/components/DeletedTeachersList.tsx
'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { Teacher } from '../types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface DeletedTeachersListProps {
  teachers: Teacher[];
  onRestore: (id: string, name: string) => Promise<boolean>;
  onHardDelete: (id: string, name: string) => Promise<boolean>;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (date: string | Date | null | undefined, withTime = false): string => {
  if (!date) return '—';
  return new Date(date).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
};

const getInitials = (firstName: string, lastName: string): string =>
  `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();

// ─── Sub-component: Subject badge ─────────────────────────────────────────────

function SubjectBadge({ name, color }: { name: string; color?: string | null }) {
  const bg = color ? `${color}22` : '#f3f4f6';
  const text = color ?? '#374151';
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: bg, color: text }}
    >
      {name}
    </span>
  );
}

// ─── Sub-component: Info row ──────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: string; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon icon={icon as any} className="text-gray-400 mt-0.5 w-4 shrink-0" />
      <span className="text-gray-500 min-w-[130px] shrink-0">{label}</span>
      <span className="text-gray-800 font-medium break-all">{value}</span>
    </div>
  );
}

// ─── Sub-component: Expanded detail panel ────────────────────────────────────

function TeacherDetailPanel({ teacher }: { teacher: Teacher }) {
  const courses = teacher.courses ?? [];
  const subjects = teacher.subjects ?? [];
  const counts = teacher._count;

  return (
    <tr>
      <td colSpan={6} className="bg-red-50 border-b border-red-100 px-6 py-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Informations personnelles */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-3">
              Informations personnelles
            </h4>
            <InfoRow icon="fa-user" label="Nom complet" value={`${teacher.firstName} ${teacher.lastName}`} />
            <InfoRow icon="fa-phone" label="Téléphone" value={teacher.phone || '—'} />
            <InfoRow icon="fa-envelope" label="Email" value={teacher.user?.email || '—'} />
            <InfoRow icon="fa-graduation-cap" label="Spécialité" value={teacher.specialty || '—'} />
            <InfoRow icon="fa-id-badge" label="ID" value={<span className="font-mono text-xs text-gray-500">{teacher.id}</span>} />
          </div>

          {/* Dates & historique */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-3">
              Historique
            </h4>
            <InfoRow
              icon="fa-calendar-plus"
              label="Créé le"
              value={formatDate(teacher.createdAt, true)}
            />
            <InfoRow
              icon="fa-calendar-check"
              label="Modifié le"
              value={formatDate(teacher.updatedAt, true)}
            />
            <InfoRow
              icon="fa-trash-alt"
              label="Supprimé le"
              value={
                <span className="text-red-600">{formatDate(teacher.deletedAt, true)}</span>
              }
            />
            <InfoRow
              icon="fa-user-shield"
              label="Supprimé par"
              value={
                teacher.deletedBy ? (
                  <span className="font-mono text-xs text-gray-500">{teacher.deletedBy}</span>
                ) : (
                  '—'
                )
              }
            />
          </div>

          {/* Matières & cours */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-3">
              Enseignements ({counts?.courses ?? courses.length} cours · {counts?.subjects ?? subjects.length} matière{subjects.length > 1 ? 's' : ''})
            </h4>

            {subjects.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {subjects.map((s) => (
                  <SubjectBadge key={s.id} name={s.name} color={s.color} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">Aucune matière assignée</p>
            )}

            {courses.length > 0 && (
              <div className="mt-2 space-y-1 max-h-32 overflow-y-auto pr-1">
                {courses.map((course: any) => (
                  <div
                    key={course.id}
                    className="flex items-center gap-2 text-xs text-gray-600 bg-white rounded px-2 py-1 border border-gray-100"
                  >
                    <Icon icon="fa-chalkboard" className="text-gray-400 shrink-0" />
                    <span className="font-medium">{course.class?.name ?? '—'}</span>
                    <span className="text-gray-400">·</span>
                    <span>{course.subject?.name ?? '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DeletedTeachersList({
  teachers,
  onRestore,
  onHardDelete,
  loading,
  error,
  onRetry,
}: DeletedTeachersListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const toggleExpand = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const handleRestore = async (id: string, name: string) => {
    setProcessingId(id);
    await onRestore(id, name);
    setProcessingId(null);
    if (expandedId === id) setExpandedId(null);
  };

  const handleHardDelete = async (id: string, name: string) => {
    setProcessingId(id);
    await onHardDelete(id, name);
    setProcessingId(null);
    if (expandedId === id) setExpandedId(null);
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500">
        <Icon icon="fa-spinner fa-spin" className="text-3xl text-red-400" />
        <span>Chargement de la corbeille…</span>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Icon icon="fa-exclamation-triangle" className="text-4xl text-red-400" />
        <p className="text-red-600 font-medium">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center gap-2"
          >
            <Icon icon="fa-redo" /> Réessayer
          </button>
        )}
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (teachers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 gap-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
          <Icon icon="fa-trash-restore" className="text-3xl text-gray-400" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-700">Corbeille vide</h3>
          <p className="text-sm text-gray-500 mt-1">
            Les professeurs supprimés apparaîtront ici et pourront être restaurés.
          </p>
        </div>
      </div>
    );
  }

  // ── Table ──────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

      {/* Header summary */}
      <div className="flex items-center gap-3 px-6 py-4 bg-red-50 border-b border-red-100">
        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
          <Icon icon="fa-trash-alt" className="text-red-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-red-800">
            {teachers.length} professeur{teachers.length > 1 ? 's' : ''} en corbeille
          </p>
          <p className="text-xs text-red-600">
            Cliquez sur une ligne pour afficher tous les détails · La restauration réactive le compte
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-8" />
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Professeur
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Matières
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Supprimé le
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {teachers.map((teacher: Teacher) => {
              const isExpanded = expandedId === teacher.id;
              const isProcessing = processingId === teacher.id;
              const fullName = `${teacher.firstName} ${teacher.lastName}`;
              const subjects = teacher.subjects ?? [];

              return (
                <React.Fragment key={teacher.id}>
                  {/* Main row */}
                  <tr
                    className={`transition-colors cursor-pointer ${
                      isExpanded ? 'bg-red-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => toggleExpand(teacher.id)}
                  >
                    {/* Expand toggle */}
                    <td className="pl-4 pr-2 py-4">
                      <Icon
                        icon={isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'}
                        className="text-gray-400 text-xs transition-transform"
                      />
                    </td>

                    {/* Identity */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {teacher.photo ? (
                          <img
                            src={teacher.photo}
                            alt={fullName}
                            className="w-9 h-9 rounded-lg object-cover border border-red-200 opacity-70"
                          />
                        ) : (
                          <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center text-red-600 text-sm font-bold shrink-0">
                            {getInitials(teacher.firstName, teacher.lastName)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{fullName}</p>
                          <p className="text-xs text-gray-500">
                            {teacher.specialty || (
                              <span className="italic text-gray-400">Aucune spécialité</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">
                        {teacher.user?.email || <span className="text-gray-400">—</span>}
                      </p>
                      <p className="text-xs text-gray-500">
                        {teacher.phone || <span className="italic text-gray-400">—</span>}
                      </p>
                    </td>

                    {/* Subjects preview */}
                    <td className="px-6 py-4">
                      {subjects.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {subjects.slice(0, 3).map((s) => (
                            <SubjectBadge key={s.id} name={s.name} color={s.color} />
                          ))}
                          {subjects.length > 3 && (
                            <span className="text-xs text-gray-500 self-center">
                              +{subjects.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">—</span>
                      )}
                    </td>

                    {/* Deleted at */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-red-600 font-medium">
                          {formatDate(teacher.deletedAt, false)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Créé le {formatDate(teacher.createdAt)}
                        </p>
                      </div>
                    </td>

                    {/* Actions – stop propagation to avoid row toggle */}
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        {/* Restore */}
                        <button
                          onClick={() => handleRestore(teacher.id, fullName)}
                          disabled={isProcessing}
                          title="Restaurer ce professeur"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          {isProcessing ? (
                            <Icon icon="fa-spinner fa-spin" />
                          ) : (
                            <Icon icon="fa-trash-restore" />
                          )}
                          Restaurer
                        </button>

                        {/* Hard delete */}
                        <button
                          onClick={() => handleHardDelete(teacher.id, fullName)}
                          disabled={isProcessing}
                          title="Supprimer définitivement (irréversible)"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-red-600 border border-red-300 rounded-lg text-xs font-medium hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          <Icon icon="fa-times-circle" />
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded detail panel */}
                  {isExpanded && <TeacherDetailPanel teacher={teacher} />}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 flex items-center gap-2">
        <Icon icon="fa-info-circle" />
        Les données ci-dessus sont conservées à titre d'audit. La suppression définitive est irréversible.
      </div>
    </div>
  );
}