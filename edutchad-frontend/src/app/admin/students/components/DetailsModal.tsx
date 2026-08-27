// app/students/components/DetailsModal.tsx
'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { Student } from '../types';
import { studentApi } from '../services/studentApi';

interface Props {
  student: Student;
  onClose: () => void;
  onEdit: () => void;
  onAddAbsence: () => void;
  onAddGrade: () => void;
  onAddPunishment: () => void;
  onPayment: () => void;
}

export default function DetailsModal({
  student,
  onClose,
  onEdit,
  onAddAbsence,
  onAddGrade,
  onAddPunishment,
  onPayment,
}: Props) {
  const [editingGrade, setEditingGrade] = useState<{ id: string; value: number; trimester: number } | null>(null);
  const [editValue, setEditValue] = useState(0);
  const [activeTab, setActiveTab] = useState<'info' | 'grades' | 'absences' | 'punishments' | 'bulletins'>('info');

  const saveEditedGrade = async (gradeId: string, trimester: number) => {
    try {
      await studentApi.updateGrade(gradeId, editValue, trimester);
      window.location.reload(); // simple refresh; could refetch details
    } catch (err) {
      alert('Erreur mise à jour note');
    }
  };

  // Calcul des moyennes par trimestre
  const grades = student.grades || [];
  const trimestre1Grades = grades.filter((g) => g.trimester === 1);
  const trimestre2Grades = grades.filter((g) => g.trimester === 2);
  const trimestre3Grades = grades.filter((g) => g.trimester === 3);

  const calcAverage = (grades: any[]) => {
    if (grades.length === 0) return 0;
    const total = grades.reduce((acc, g) => acc + g.value * (g.coefficient || 1), 0);
    const coefTotal = grades.reduce((acc, g) => acc + (g.coefficient || 1), 0);
    return coefTotal > 0 ? Number((total / coefTotal).toFixed(2)) : 0;
  };

  const avg1 = calcAverage(trimestre1Grades);
  const avg2 = calcAverage(trimestre2Grades);
  const avg3 = calcAverage(trimestre3Grades);
  const annualAvg = grades.length > 0 ? Number(((avg1 + avg2 + avg3) / 3).toFixed(2)) : 0;

  // Grouper les notes par matière pour affichage
  const groupGradesBySubject = (grades: any[]) => {
    const map = new Map();
    grades.forEach((g) => {
      const subjectId = g.subject?.id;
      if (!subjectId) return;
      if (!map.has(subjectId)) {
        map.set(subjectId, {
          subjectName: g.subject.name,
          subjectColor: g.subject.color || '#3498db',
          grades: [],
          total: 0,
          count: 0,
        });
      }
      const entry = map.get(subjectId);
      entry.grades.push(g);
      entry.total += g.value * (g.coefficient || 1);
      entry.count += g.coefficient || 1;
    });
    return Array.from(map.values()).map((entry) => ({
      ...entry,
      average: entry.count > 0 ? Number((entry.total / entry.count).toFixed(2)) : 0,
    }));
  };

  const subjectAverages = groupGradesBySubject(grades);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-5xl p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="flex justify-between items-start mb-4 border-b pb-3">
          <div className="flex items-center gap-4">
            {student.photo ? (
              <img src={student.photo} className="w-14 h-14 rounded-full object-cover border-2 border-blue-500" />
            ) : (
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {student.lastName?.[0]}{student.firstName?.[0]}
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {student.lastName?.toUpperCase()} {student.firstName}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                  <Icon icon="fa-id-card" className="mr-1" />
                  {student.registrationNo}
                </span>
                <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                  <Icon icon="fa-envelope" className="mr-1" />
                  {student.user?.email || 'Email non défini'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    student.user?.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {student.user?.isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <Icon icon="fa-times" className="text-xl" />
          </button>
        </div>

        {/* Onglets */}
        <div className="flex flex-wrap gap-1 border-b mb-4">
          {[
            { key: 'info', label: 'Infos', icon: 'fa-user' },
            { key: 'grades', label: 'Notes', icon: 'fa-star' },
            { key: 'absences', label: 'Absences', icon: 'fa-clock' },
            { key: 'punishments', label: 'Punitions', icon: 'fa-gavel' },
            { key: 'bulletins', label: 'Bulletins', icon: 'fa-file-alt' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon icon={tab.icon as any} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenu des onglets */}
        <div className="min-h-[300px]">
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Icon icon="fa-calendar" /> Date de naissance
                  </p>
                  <p className="font-medium">
                    {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('fr-FR') : 'Non renseignée'}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Icon icon={student.sex === 'M' ? 'fa-mars' : 'fa-venus'} /> Sexe
                  </p>
                  <p className="font-medium">{student.sex === 'M' ? 'Masculin' : 'Féminin'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Icon icon="fa-school" /> Classe
                  </p>
                  <p className="font-medium">{student.class?.name || 'Non assigné'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Icon icon="fa-calendar-plus" /> Inscription
                  </p>
                  <p className="font-medium">
                    {student.createdAt ? new Date(student.createdAt).toLocaleDateString('fr-FR') : 'Inconnue'}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Icon icon="fa-users" /> Parent / Tuteur
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Nom</p>
                    <p className="font-medium">{student.parentName || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Téléphone</p>
                    <p className="font-medium">{student.parentPhone || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium">{student.parentEmail || 'Non renseigné'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex flex-wrap justify-between items-center">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Icon icon="fa-money-bill-wave" /> Scolarité
                  </h4>
                  <button
                    onClick={onPayment}
                    className="px-4 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg transition"
                  >
                    <Icon icon="fa-plus" /> Payer
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  <div>
                    <p className="text-xs text-gray-600">Total dû</p>
                    <p className="font-semibold">{student.tuitionFee ?? 0} FCFA</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Payé</p>
                    <p className="font-semibold">{student.tuitionPaid ?? 0} FCFA</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Reste</p>
                    <p className="font-semibold">
                      {(student.tuitionFee ?? 0) - (student.tuitionPaid ?? 0)} FCFA
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Statut</p>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        student.tuitionStatus === 'PAID'
                          ? 'bg-green-100 text-green-700'
                          : student.tuitionStatus === 'PARTIAL'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {student.tuitionStatus === 'PAID'
                        ? 'Payé'
                        : student.tuitionStatus === 'PARTIAL'
                        ? 'Partiel'
                        : 'Non payé'}
                    </span>
                  </div>
                </div>
                {student.paymentDate && (
                  <p className="text-xs text-gray-500 mt-2">
                    Dernier paiement : {new Date(student.paymentDate).toLocaleDateString('fr-FR')}
                    {student.paymentMethod && ` - ${student.paymentMethod}`}
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'grades' && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Icon icon="fa-star" /> Notes ({grades.length})
                </h4>
                <button
                  onClick={onAddGrade}
                  className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-sm transition flex items-center gap-1"
                >
                  <Icon icon="fa-plus" /> Ajouter
                </button>
              </div>

              {/* Résumé des moyennes */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="bg-blue-50 p-2 rounded-lg text-center">
                  <p className="text-xs text-gray-500">T1</p>
                  <p className="font-bold text-blue-600">{avg1}/20</p>
                </div>
                <div className="bg-blue-50 p-2 rounded-lg text-center">
                  <p className="text-xs text-gray-500">T2</p>
                  <p className="font-bold text-blue-600">{avg2}/20</p>
                </div>
                <div className="bg-blue-50 p-2 rounded-lg text-center">
                  <p className="text-xs text-gray-500">T3</p>
                  <p className="font-bold text-blue-600">{avg3}/20</p>
                </div>
                <div className="bg-green-50 p-2 rounded-lg text-center">
                  <p className="text-xs text-gray-500">Annuelle</p>
                  <p className="font-bold text-green-600">{annualAvg}/20</p>
                </div>
              </div>

              {/* Notes par matière */}
              {subjectAverages.length > 0 ? (
                <div className="border rounded-lg divide-y">
                  {subjectAverages.map((subj) => (
                    <div key={subj.subjectName} className="p-3 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: subj.subjectColor }}
                        />
                        <span className="font-medium">{subj.subjectName}</span>
                        <span className="text-xs text-gray-500">
                          ({subj.grades.length} notes)
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-blue-600">{subj.average}/20</span>
                        <button
                          onClick={() => {
                            // Pour simplifier, on édite la première note de la matière
                            const first = subj.grades[0];
                            if (first) {
                              setEditingGrade({ id: first.id, value: first.value, trimester: first.trimester });
                              setEditValue(first.value);
                            }
                          }}
                          className="text-gray-400 hover:text-blue-600 text-sm"
                        >
                          <Icon icon="fa-edit" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg text-gray-500">
                  Aucune note enregistrée
                </div>
              )}

              {/* Édition en ligne simplifiée */}
              {editingGrade && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg border flex items-center gap-3">
                  <span className="text-sm">Modifier la note :</span>
                  <input
                    type="number"
                    step="0.5"
                    className="w-20 border rounded p-1"
                    value={editValue}
                    onChange={(e) => setEditValue(parseFloat(e.target.value))}
                  />
                  <button
                    onClick={() => saveEditedGrade(editingGrade.id, editingGrade.trimester)}
                    className="text-green-600 hover:text-green-800"
                  >
                    <Icon icon="fa-check" />
                  </button>
                  <button onClick={() => setEditingGrade(null)} className="text-gray-500 hover:text-gray-700">
                    <Icon icon="fa-times" />
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'absences' && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Icon icon="fa-clock" className="text-orange-500" /> Absences ({student.absences?.length || 0})
                </h4>
                <button
                  onClick={onAddAbsence}
                  className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-sm transition flex items-center gap-1"
                >
                  <Icon icon="fa-plus" /> Ajouter
                </button>
              </div>
              {student.absences && student.absences.length > 0 ? (
                <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                  {student.absences.map((a) => (
                    <div key={a.id} className="p-3 flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {new Date(a.date).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              a.type === 'RETARD'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {a.type === 'RETARD' ? 'Retard' : 'Absence'}
                          </span>
                          {a.reason && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                              {a.reason}
                            </span>
                          )}
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              a.isJustified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {a.isJustified ? 'Justifiée' : 'Non justifiée'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg text-gray-500">
                  Aucune absence enregistrée
                </div>
              )}
            </div>
          )}

          {activeTab === 'punishments' && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Icon icon="fa-gavel" className="text-red-500" /> Punitions ({student.punishments?.length || 0})
                </h4>
                <button
                  onClick={onAddPunishment}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm transition flex items-center gap-1"
                >
                  <Icon icon="fa-plus" /> Ajouter
                </button>
              </div>
              {student.punishments && student.punishments.length > 0 ? (
                <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                  {student.punishments.map((p) => (
                    <div key={p.id} className="p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium">
                          {new Date(p.date).toLocaleDateString('fr-FR')} - Trimestre {p.trimester}
                        </p>
                        <p className="text-sm text-gray-600">
                          {p.reason || 'Aucune raison'} — {p.hours} heure(s)
                          {p.givenBy && ` (donnée par ${p.givenBy})`}
                        </p>
                      </div>
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                        {p.hours}h
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg text-gray-500">
                  Aucune punition
                </div>
              )}
            </div>
          )}

          {activeTab === 'bulletins' && (
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-3">
                <Icon icon="fa-file-alt" /> Bulletins
              </h4>
              {student.bulletins && student.bulletins.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {student.bulletins.map((b) => (
                    <div key={b.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">Trimestre {b.trimester}</p>
                          <p className="text-sm text-gray-600">
                            Période : {b.period.replace('_', ' ')}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            b.status === 'CONFIRMED'
                              ? 'bg-green-100 text-green-700'
                              : b.status === 'VERIFIED'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Moyenne générale</span>
                          <p className="font-medium">{b.generalAverage ?? 'Non calculée'}/20</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Note de conduite</span>
                          <p className="font-medium">{b.conduiteNote ?? 'Non définie'}/20</p>
                        </div>
                      </div>
                      {b.appreciation && (
                        <p className="text-sm text-gray-700 mt-2 italic">
                          « {b.appreciation} »
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Généré le {new Date(b.generatedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg text-gray-500">
                  Aucun bulletin disponible
                </div>
              )}
            </div>
          )}
        </div>


      </div>
    </div>
  );
}