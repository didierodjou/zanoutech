// app/teacher/students/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';

interface Punishment {
  id: string;
  hours: number;
  reason: string | null;
  trimester: number;
  givenBy: string;
  date: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  registrationNo: string;
  sex: string | null;
  dateOfBirth: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string | null;
  punishments: Punishment[];
}

interface ClassInfo {
  id: string;
  name: string;
  level: string;
  studentCount: number;
  students: Student[];
}

const PUNISHMENT_REASONS = [
  "Retards répétés",
  "Absence injustifiée",
  "Comportement perturbateur en classe",
  "Non-respect du règlement intérieur",
  "Devoir non rendu",
  "Insolence envers un professeur",
  "Tricherie lors d'un contrôle",
  "Utilisation du téléphone en cours",
  "Bruit excessif",
  "Dégradation de matériel"
];

export default function TeacherStudentsPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [mainClassId, setMainClassId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedClassIds, setExpandedClassIds] = useState<Set<string>>(new Set());
  const [selectedTrimester, setSelectedTrimester] = useState<number>(1);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [punishmentModalOpen, setPunishmentModalOpen] = useState(false);
  const [punishmentData, setPunishmentData] = useState({
    hours: 2,
    reason: '',
    trimester: 1,
    givenBy: '',
    selectedReason: '',
    customReason: ''
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [punishmentDetails, setPunishmentDetails] = useState<{ student: Student; punishments: Punishment[] } | null>(null);

  // Nom du professeur connecté (initialisé après chargement)
  const [teacherName, setTeacherName] = useState<string>('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const safeParseJSON = async (res: Response) => {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  // Récupérer les infos du professeur à partir de son ID
  const fetchTeacherName = async (teacherId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/teachers/${teacherId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Adapter selon la structure de votre API
        if (data.firstName && data.lastName) {
          setTeacherName(`${data.firstName} ${data.lastName}`);
        } else if (data.name) {
          setTeacherName(data.name);
        } else if (data.user?.firstName && data.user?.lastName) {
          setTeacherName(`${data.user.firstName} ${data.user.lastName}`);
        } else {
          setTeacherName('Professeur');
        }
      } else {
        setTeacherName('Professeur');
      }
    } catch (err) {
      console.error("Erreur chargement nom prof", err);
      setTeacherName('Professeur');
    }
  };

  const fetchStudentPunishments = async (studentId: string): Promise<Punishment[]> => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/students/${studentId}/punishments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error("Erreur chargement punitions", err);
    }
    return [];
  };

  const refreshData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (!token || !storedUser) {
      router.push('/');
      return;
    }
    const userData = JSON.parse(storedUser);
    const teacherId = userData.teacherId;
    if (!teacherId) {
      setError("Identifiant enseignant introuvable.");
      setLoading(false);
      return;
    }

    // Récupérer le nom du professeur une fois (si ce n'est pas déjà fait)
    if (!teacherName) {
      await fetchTeacherName(teacherId);
    }

    const headers = { Authorization: `Bearer ${token}` };
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    try {
      const coursesRes = await fetch(`${API_BASE}/teachers/${teacherId}/courses`, { headers });
      const courses = coursesRes.ok ? await coursesRes.json() : [];
      const coursesList = Array.isArray(courses) ? courses : [];

      const classesMap = new Map<string, any>();
      coursesList.forEach((course: any) => {
        if (course.class && !classesMap.has(course.class.id)) {
          classesMap.set(course.class.id, {
            ...course.class,
            studentCount: 0,
            students: [],
          });
        }
      });

      const classesArray = Array.from(classesMap.values());

      const mainClassRes = await fetch(`${API_BASE}/teachers/${teacherId}/main-class`, { headers });
      const mainClassData = await safeParseJSON(mainClassRes);
      if (mainClassData?.id) {
        setMainClassId(mainClassData.id);
      }

      const updatedClasses = await Promise.all(
        classesArray.map(async (cls) => {
          try {
            const studentsRes = await fetch(`${API_BASE}/teachers/class/${cls.id}/students`, { headers });
            const studentsData = await safeParseJSON(studentsRes);
            let studentsList = Array.isArray(studentsData)
              ? studentsData
              : Array.isArray(studentsData?.students)
              ? studentsData.students
              : Array.isArray(studentsData?.class?.students)
              ? studentsData.class.students
              : [];

            const studentsWithPunishments = await Promise.all(
              studentsList.map(async (student: any) => {
                const punishments = await fetchStudentPunishments(student.id);
                return { ...student, punishments };
              })
            );

            return {
              ...cls,
              students: studentsWithPunishments,
              studentCount: studentsWithPunishments.length,
            };
          } catch (err) {
            console.error(`Erreur chargement élèves classe ${cls.id}`, err);
            return { ...cls, students: [], studentCount: 0 };
          }
        })
      );

      setClasses(updatedClasses);
      if (mainClassId) {
        setExpandedClassIds(new Set([mainClassId]));
      }
    } catch (err) {
      // console.error(err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [router]);

  const toggleClass = (classId: string) => {
    setExpandedClassIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(classId)) newSet.delete(classId);
      else newSet.add(classId);
      return newSet;
    });
  };

  const openPunishmentModal = (student: Student) => {
    setSelectedStudent(student);
    setPunishmentData({
      hours: 2,
      reason: '',
      trimester: selectedTrimester,
      givenBy: teacherName || 'Professeur', // utilise le nom réel du prof
      selectedReason: '',
      customReason: ''
    });
    setPunishmentModalOpen(true);
  };

  const closePunishmentModal = () => {
    setPunishmentModalOpen(false);
    setSelectedStudent(null);
    setActionLoading(false);
  };

  const addPunishment = async () => {
    if (!selectedStudent) return;
    if (punishmentData.hours <= 0) {
      setError("Veuillez entrer un nombre d'heures valide");
      setTimeout(() => setError(''), 3000);
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/students/${selectedStudent.id}/punishments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          hours: punishmentData.hours,
          reason: punishmentData.reason,
          trimester: punishmentData.trimester,
          givenBy: punishmentData.givenBy || teacherName || 'Professeur'
        })
      });

      if (res.ok) {
        setSuccessMessage(`✅ Punition ajoutée pour ${selectedStudent.firstName} ${selectedStudent.lastName}`);
        setTimeout(() => setSuccessMessage(null), 3000);
        closePunishmentModal();
        await refreshData();
      } else {
        const errorText = await res.text();
        setError(`❌ Erreur: ${errorText}`);
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      setError('❌ Erreur réseau');
      setTimeout(() => setError(''), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  // Supprimer une punition
  const deletePunishment = async (punishmentId: string, studentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette punition ?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/students/${studentId}/punishments/${punishmentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setSuccessMessage('✅ Punition supprimée');
        setTimeout(() => setSuccessMessage(null), 3000);
        await refreshData();
        // Fermer la modale des détails si elle est ouverte
        if (punishmentDetails) {
          const updatedStudent = classes
            .flatMap(c => c.students)
            .find(s => s.id === studentId);
          if (updatedStudent) {
            const updatedPunishments = updatedStudent.punishments.filter(p => p.id !== punishmentId);
            setPunishmentDetails({
              student: updatedStudent,
              punishments: updatedPunishments.filter(p => p.trimester === selectedTrimester)
            });
          }
        }
      } else {
        const err = await res.text();
        setError(`❌ Erreur: ${err}`);
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      setError('❌ Erreur réseau');
      setTimeout(() => setError(''), 3000);
    }
  };

  const showPunishmentDetails = (student: Student) => {
    const punishmentsForTrimester = student.punishments.filter(p => p.trimester === selectedTrimester);
    if (punishmentsForTrimester.length === 0) return;
    setPunishmentDetails({ student, punishments: punishmentsForTrimester });
  };

  const closePunishmentDetails = () => {
    setPunishmentDetails(null);
  };

  const totalStudents = classes.reduce((sum, cls) => sum + cls.studentCount, 0);

  const getTotalPunishmentHours = (student: Student, trimester: number) => {
    if (!student.punishments) return 0;
    return student.punishments
      .filter(p => p.trimester === trimester)
      .reduce((sum, p) => sum + p.hours, 0);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
        <p className="text-slate-500">Chargement des classes et élèves...</p>
      </div>
    );
  }

  if (error && !successMessage) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <Icon icon="fa-exclamation-triangle" className="text-red-500 text-2xl" />
        </div>
        <p className="text-slate-600 font-medium">{error}</p>
        <Link href="/teacher/dashboard" className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">
          Retour au tableau de bord
        </Link>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
          <Icon icon="fa-chalkboard" className="text-yellow-600 text-2xl" />
        </div>
        <p className="text-slate-600 font-medium">Vous n'avez aucune classe assignée.</p>
        <p className="text-slate-400 text-sm">Contactez l'administration pour être assigné à des cours.</p>
        <Link href="/teacher/dashboard" className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">
          Retour
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm flex items-center gap-2">
          <Icon icon="fa-check-circle" />
          {successMessage}
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-700 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-wrap justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Icon icon="fa-user-graduate" />
              Mes Élèves
            </h1>
            <p className="text-blue-200 text-sm mt-1">
              {classes.length} classe(s) · {totalStudents} élève(s)
            </p>
          </div>
          <div className="mt-2 sm:mt-0">
            <label className="text-sm text-blue-200 mr-2">Trimestre :</label>
            <select
              value={selectedTrimester}
              onChange={(e) => setSelectedTrimester(parseInt(e.target.value))}
              className="px-3 py-1 rounded-lg text-gray-800 text-sm font-medium"
            >
              <option value={1}>Trimestre 1</option>
              <option value={2}>Trimestre 2</option>
              <option value={3}>Trimestre 3</option>
            </select>
          </div>
        </div>
        <p className="text-blue-100 text-xs mt-3">
          ℹ️ Les heures de colle affichées correspondent au trimestre sélectionné.
        </p>
      </div>

      <div className="space-y-4">
        {classes.map((cls) => {
          const isMain = cls.id === mainClassId;
          const isExpanded = expandedClassIds.has(cls.id);
          return (
            <div key={cls.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <button
                onClick={() => toggleClass(cls.id)}
                className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg ${isMain ? 'bg-yellow-500' : 'bg-blue-500'}`}>
                    <Icon icon={isMain ? 'fa-star' : 'fa-users'} />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-slate-800">{cls.name}</h2>
                      {isMain && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Icon icon="fa-star" className="text-xs" />
                          Professeur principal
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{cls.level} · {cls.studentCount} élève(s)</p>
                  </div>
                </div>
                <Icon icon="fa-chevron-down" className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
              </button>

              {isExpanded && (
                <div className="border-t border-slate-100">
                  {cls.students.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      <Icon icon="fa-user-slash" className="text-3xl mb-2" />
                      <p>Aucun élève inscrit dans cette classe</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                            <th className="text-left px-6 py-3">Élève</th>
                            <th className="text-left px-6 py-3">Matricule</th>
                            <th className="text-left px-6 py-3">Sexe</th>
                            <th className="text-left px-6 py-3">Date de naissance</th>
                            <th className="text-left px-6 py-3">Heures de colle (T{selectedTrimester})</th>
                            <th className="text-center px-6 py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cls.students.map((student, idx) => {
                            const totalHours = getTotalPunishmentHours(student, selectedTrimester);
                            const hasPunishments = totalHours > 0;
                            return (
                              <tr key={student.id} className={`border-t border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                                      {student.firstName[0]}{student.lastName[0]}
                                    </div>
                                    <span className="font-medium text-slate-800">
                                      {student.lastName} {student.firstName}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">{student.registrationNo}</td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                  {student.sex === 'M' ? 'Masculin' : student.sex === 'F' ? 'Féminin' : '—'}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                  {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('fr-FR') : '—'}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                  {hasPunishments ? (
                                    <button
                                      onClick={() => showPunishmentDetails(student)}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium hover:bg-red-200 transition cursor-pointer"
                                      title="Cliquer pour voir les détails"
                                    >
                                      <Icon icon="fa-gavel" className="text-xs" />
                                      {totalHours} h
                                    </button>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <button
                                    onClick={() => openPunishmentModal(student)}
                                    className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-medium"
                                    title="Ajouter une punition"
                                  >
                                    <Icon icon="fa-gavel" />
                                    Punition
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-start">
        <Link href="/teacher/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition text-sm font-medium">
          <Icon icon="fa-arrow-left" />
          Retour au tableau de bord
        </Link>
      </div>

      {/* MODAL AJOUT PUNITION */}
      {punishmentModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                <Icon icon="fa-gavel" className="text-red-500 mr-2" />
                Ajouter une punition
              </h3>
              <button onClick={closePunishmentModal} className="text-gray-400 hover:text-gray-600">
                <Icon icon="fa-times" className="text-xl" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Élève: <span className="font-semibold">{selectedStudent.firstName} {selectedStudent.lastName}</span>
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trimestre</label>
                <select
                  className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg text-gray-900"
                  value={punishmentData.trimester}
                  onChange={(e) => setPunishmentData({...punishmentData, trimester: parseInt(e.target.value)})}
                >
                  <option value={1}>Trimestre 1</option>
                  <option value={2}>Trimestre 2</option>
                  <option value={3}>Trimestre 3</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre d'heures de colle *</label>
                <input
                  type="number"
                  min="0.5"
                  max="40"
                  step="0.5"
                  className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg text-gray-900"
                  value={punishmentData.hours}
                  onChange={(e) => setPunishmentData({...punishmentData, hours: parseFloat(e.target.value) || 0})}
                  placeholder="Ex: 2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Motif</label>
                <select
                  className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg text-gray-900 mb-2"
                  value={punishmentData.selectedReason || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPunishmentData({
                      ...punishmentData,
                      selectedReason: val,
                      reason: val === 'AUTRE' ? punishmentData.customReason || '' : val,
                      customReason: val === 'AUTRE' ? punishmentData.customReason : ''
                    });
                  }}
                >
                  <option value="">-- Choisir un motif suggéré --</option>
                  {PUNISHMENT_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                  <option value="AUTRE">Autre (saisie libre)</option>
                </select>
                {punishmentData.selectedReason === 'AUTRE' && (
                  <input
                    type="text"
                    className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg text-gray-900"
                    placeholder="Saisissez le motif..."
                    value={punishmentData.customReason || ''}
                    onChange={(e) => {
                      setPunishmentData({
                        ...punishmentData,
                        customReason: e.target.value,
                        reason: e.target.value
                      });
                    }}
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Donné par</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg text-gray-900 bg-gray-50"
                  value={punishmentData.givenBy}
                  onChange={(e) => setPunishmentData({...punishmentData, givenBy: e.target.value})}
                  placeholder="Votre nom..."
                  readOnly={!!teacherName && teacherName !== 'Professeur'} // readonly si le nom a été trouvé
                />
                {teacherName && teacherName !== 'Professeur' && (
                  <p className="text-xs text-gray-500 mt-1">Ce champ a été pré-rempli avec votre nom.</p>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={closePunishmentModal} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  Annuler
                </button>
                <button onClick={addPunishment} disabled={actionLoading} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
                  {actionLoading ? <><Icon icon="fa-spinner" className="fa-spin" /> Enregistrement...</> : <><Icon icon="fa-gavel" /> Enregistrer</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DÉTAILS PUNITIONS AVEC SUPPRESSION */}
      {punishmentDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-4 sm:p-6 shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                <Icon icon="fa-gavel" className="text-red-500 mr-2" />
                Détail des punitions
              </h3>
              <button onClick={closePunishmentDetails} className="text-gray-400 hover:text-gray-600">
                <Icon icon="fa-times" className="text-xl" />
              </button>
            </div>
            <div className="mb-4 pb-2 border-b">
              <p className="text-sm text-gray-600">
                Élève: <span className="font-semibold">{punishmentDetails.student.firstName} {punishmentDetails.student.lastName}</span>
              </p>
              <p className="text-xs text-gray-500">Trimestre {selectedTrimester}</p>
            </div>
            {punishmentDetails.punishments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Aucune punition enregistrée pour ce trimestre</p>
            ) : (
              <div className="space-y-3">
                {punishmentDetails.punishments.map((p) => (
                  <div key={p.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-red-700">{p.hours} heure(s) de colle</p>
                        <p className="text-sm text-gray-700 mt-1"><span className="font-medium">Motif :</span> {p.reason || 'Non spécifié'}</p>
                        <p className="text-xs text-gray-500 mt-1"><span className="font-medium">Donné par :</span> {p.givenBy || 'Inconnu'}</p>
                        <p className="text-xs text-gray-400 mt-1"><span className="font-medium">Date :</span> {new Date(p.date).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <button
                        onClick={() => deletePunishment(p.id, punishmentDetails.student.id)}
                        className="ml-3 p-1 text-red-500 hover:bg-red-50 rounded transition"
                        title="Supprimer cette punition"
                      >
                        <Icon icon="fa-trash" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="mt-3 pt-2 border-t text-right">
                  <p className="text-sm font-medium">
                    Total : {punishmentDetails.punishments.reduce((sum, p) => sum + p.hours, 0)} heures
                  </p>
                </div>
              </div>
            )}
            <div className="flex justify-end mt-6">
              <button onClick={closePunishmentDetails} className="px-5 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}