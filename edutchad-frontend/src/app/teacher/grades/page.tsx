// app/teacher/grades/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  registrationNo: string;
}

interface Subject {
  id: string;
  name: string;
  color: string;
}

interface Course {
  id: string;
  class: { id: string; name: string };
  subject: Subject;
  coefficient?: number;
}

interface Control {
  id: string;
  studentId: string;
  subjectId: string;
  type: 'DEVOIR' | 'INTERROGATION';
  value: number;
  trimester: number;
  date?: string;
}

interface Grade {
  id: string;
  studentId: string;
  subjectId: string;
  trimester: number;
  value: number;
  coefficient: number;
}

interface StudentGradeData {
  student: Student;
  devoir?: Control;
  interrogations: Control[];
  moyenne?: Grade;
}

const TRIMESTERS = [1, 2, 3];
const API = 'http://localhost:3001';

const getToken = () => localStorage.getItem('token') || '';
const getTeacherId = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}').teacherId || '';
  } catch {
    return '';
  }
};

const sc = (c?: string) => c || '#6366f1';

// Calcul de la moyenne pondérée : Devoir (coef 2) + Moyenne des interrogations (coef 1)
const calculateAverage = (devoir: number, interrogations: number[]): number => {
  const validInterros = interrogations.filter(v => v > 0);
  
  if (validInterros.length === 0 && devoir === 0) return 0;
  
  let totalPoints = 0;
  let totalCoef = 0;

  if (devoir > 0) {
    totalPoints += devoir * 2;
    totalCoef += 2;
  }
  
  if (validInterros.length > 0) {
    const interroAvg = validInterros.reduce((a, b) => a + b, 0) / validInterros.length;
    totalPoints += interroAvg * 1;
    totalCoef += 1;
  }

  if (totalCoef === 0) return 0;
  return Number((totalPoints / totalCoef).toFixed(2));
};

// Fonction utilitaire pour limiter une note à 20
const clampTo20 = (value: number): number => Math.min(Math.max(value, 0), 20);

export default function GradesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [trimester, setTrimester] = useState(1);
  const [students, setStudents] = useState<Student[]>([]);
  const [controls, setControls] = useState<Control[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingControls, setEditingControls] = useState<{
    devoir?: Control;
    interrogations: Control[];
    grade?: Grade;
  } | null>(null);
  
  const [gradeInput, setGradeInput] = useState<{
    devoir: number;
    interrogations: number[];
  }>({
    devoir: 0,
    interrogations: [],
  });
  
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const headers = {
    Authorization: `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Charger les cours de l'enseignant
  useEffect(() => {
    const tid = getTeacherId();
    if (!tid) return;
    fetch(`${API}/teachers/${tid}/courses`, { headers })
      .then(res => res.json())
      .then(data => {
        setCourses(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Charger élèves + contrôles + grades pour le cours et trimestre sélectionnés
  useEffect(() => {
    if (!selectedCourse) return;
    setLoadingStudents(true);
    setStudents([]);
    setControls([]);
    setGrades([]);

    const studentsUrl = `${API}/teachers/class/${selectedCourse.class.id}/students`;
    const controlsUrl = `${API}/controls/subject/${selectedCourse.subject.id}`;
    const gradesUrl = `${API}/grades/by-class?classId=${selectedCourse.class.id}&subjectId=${selectedCourse.subject.id}&trimester=${trimester}`;

    Promise.all([
      fetch(studentsUrl, { headers }).then(res => (res.ok ? res.json() : [])),
      fetch(controlsUrl, { headers }).then(res => (res.ok ? res.json() : [])),
      fetch(gradesUrl, { headers }).then(res => (res.ok ? res.json() : [])),
    ])
      .then(([studentsData, controlsData, gradesData]) => {
        const studs: Student[] = Array.isArray(studentsData)
          ? studentsData
          : Array.isArray(studentsData?.students)
          ? studentsData.students
          : [];
        setStudents(studs);
        
        // Filtrer les contrôles par trimestre côté client (car le backend ne filtre pas)
        const allControls: Control[] = Array.isArray(controlsData) ? controlsData : [];
        const filteredControls = allControls.filter((c: Control) => 
          c.trimester === trimester && 
          c.subjectId === selectedCourse.subject.id
        );
        setControls(filteredControls);
        
        // Les grades devraient déjà être filtrés par le backend
        setGrades(Array.isArray(gradesData) ? gradesData : []);
      })
      .catch((err) => {
        console.error('Erreur chargement:', err);
        setError('Erreur chargement des données');
      })
      .finally(() => setLoadingStudents(false));
  }, [selectedCourse, trimester]);

  // Rafraîchir les données
  const refreshData = () => {
    if (!selectedCourse) return;
    
    const controlsUrl = `${API}/controls/subject/${selectedCourse.subject.id}`;
    const gradesUrl = `${API}/grades/by-class?classId=${selectedCourse.class.id}&subjectId=${selectedCourse.subject.id}&trimester=${trimester}`;

    Promise.all([
      fetch(controlsUrl, { headers }).then(res => (res.ok ? res.json() : [])),
      fetch(gradesUrl, { headers }).then(res => (res.ok ? res.json() : [])),
    ]).then(([controlsData, gradesData]) => {
      // Filtrer les contrôles par trimestre
      const allControls: Control[] = Array.isArray(controlsData) ? controlsData : [];
      const filteredControls = allControls.filter((c: Control) => 
        c.trimester === trimester && 
        c.subjectId === selectedCourse.subject.id
      );
      setControls(filteredControls);
      setGrades(Array.isArray(gradesData) ? gradesData : []);
    });
  };

  // Ouvrir le modal de saisie pour un élève
  const openModal = (student: Student) => {
    if (!selectedCourse) return;
    
    // Trouver les contrôles existants pour CET élève et CE trimestre
    const studentControls = controls.filter(c => 
      c.studentId === student.id && 
      c.trimester === trimester
    );
    const devoir = studentControls.find(c => c.type === 'DEVOIR');
    const interrogations = studentControls.filter(c => c.type === 'INTERROGATION');
    
    // Trouver la moyenne pour CET élève et CE trimestre
    const grade = grades.find(g => 
      g.studentId === student.id && 
      g.trimester === trimester
    );

    setSelectedStudent(student);
    setEditingControls({ devoir, interrogations, grade });
    
    setGradeInput({
      devoir: devoir?.value || 0,
      interrogations: interrogations.map(i => i.value) || [],
    });
    
    setModalError('');
    setModalOpen(true);
  };

  // Sauvegarder les notes (devoir, interrogations et moyenne)
  const saveGrades = async () => {
    if (!selectedCourse || !selectedStudent) return;
    
    // Limiter les notes à 20 avant validation
    const clampedDevoir = clampTo20(gradeInput.devoir);
    const clampedInterrogations = gradeInput.interrogations.map(i => clampTo20(i));
    
    const hasValidNote =
      clampedDevoir > 0 || clampedInterrogations.some(v => v > 0);
    if (!hasValidNote) {
      setModalError('Veuillez saisir au moins une note (devoir ou interrogation)');
      return;
    }

    setSaving(true);
    setModalError('');
    
    try {
      const moyenneCalculee = calculateAverage(clampedDevoir, clampedInterrogations);
      
      // Utiliser l'API unifiée saveGrade qui gère tout en une requête
      const payload = {
        studentId: selectedStudent.id,
        subjectId: selectedCourse.subject.id,
        trimester,
        value: moyenneCalculee,
        coefficient: selectedCourse.coefficient ?? 1,
        devoir: clampedDevoir > 0 ? clampedDevoir : undefined,
        interrogations: clampedInterrogations.filter(v => v > 0),
      };

      const res = await fetch(`${API}/grades`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showSuccess(`✅ Notes de ${selectedStudent.firstName} ${selectedStudent.lastName} enregistrées (T${trimester})`);
        setModalOpen(false);
        refreshData();
      } else {
        const err = await res.text();
        setModalError(`❌ Erreur: ${err}`);
      }
    } catch (err) {
      setModalError(`❌ Erreur de connexion`);
    } finally {
      setSaving(false);
    }
  };

  // Préparer les données pour l'affichage - FILTRÉ PAR TRIMESTRE
  const getStudentData = (student: Student): StudentGradeData => {
    // Filtrer explicitement par trimestre pour éviter les mélanges
    const studentControls = controls.filter(c => 
      c.studentId === student.id && 
      c.trimester === trimester
    );
    const devoir = studentControls.find(c => c.type === 'DEVOIR');
    const interrogations = studentControls.filter(c => c.type === 'INTERROGATION');
    const moyenne = grades.find(g => 
      g.studentId === student.id && 
      g.trimester === trimester
    );

    return {
      student,
      devoir,
      interrogations,
      moyenne,
    };
  };

  // Statistiques - UNIQUEMENT pour le trimestre actif
  const studentsData = students.map(getStudentData);
  const gradeCount = studentsData.filter(d => d.moyenne !== undefined).length;
  const avgClass =
    gradeCount > 0
      ? (studentsData.reduce((a, d) => a + (d.moyenne?.value ?? 0), 0) / gradeCount).toFixed(2)
      : '—';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Icon icon="fa-clipboard-list" /> Saisie des notes
        </h1>
        <p className="text-indigo-200 text-sm mt-1">
          Sélectionnez un cours et un trimestre, puis saisissez les notes par élève
        </p>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 flex items-center gap-3">
          <Icon icon="fa-check-circle" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
          <Icon icon="fa-exclamation-triangle" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-sm underline">
            Fermer
          </button>
        </div>
      )}

      {/* Sélecteurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Liste des cours */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 block">
            <Icon icon="fa-book" className="mr-1" /> Cours / Matière
          </label>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {courses.length === 0 && (
              <p className="text-slate-400 text-sm">Aucun cours assigné</p>
            )}
            {courses.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCourse(c)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition ${
                  selectedCourse?.id === c.id
                    ? 'bg-indigo-50 border-2 border-indigo-400'
                    : 'border border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: sc(c.subject?.color) }}
                />
                <div>
                  <p className="font-semibold text-sm text-slate-800">{c.subject?.name}</p>
                  <p className="text-xs text-slate-400">Classe {c.class?.name}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Trimestre + résumé */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 block">
            <Icon icon="fa-calendar" className="mr-1" /> Trimestre
          </label>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {TRIMESTERS.map(t => (
              <button
                key={t}
                onClick={() => setTrimester(t)}
                className={`py-4 rounded-xl font-bold text-lg transition ${
                  trimester === t
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                T{t}
              </button>
            ))}
          </div>
          {selectedCourse && (
            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1">
              <p>
                <span className="font-semibold">Matière :</span> {selectedCourse.subject.name}
              </p>
              <p>
                <span className="font-semibold">Classe :</span> {selectedCourse.class.name}
              </p>
              <p>
                <span className="font-semibold">Notes saisies :</span> {gradeCount}/{students.length} (T{trimester})
              </p>
              <p>
                <span className="font-semibold">Moyenne classe :</span> {avgClass}/20
              </p>
            </div>
          )}
          <div className="mt-3 p-3 bg-indigo-50 rounded-xl text-xs text-indigo-700 space-y-0.5">
            <p className="font-semibold mb-1">Formule de calcul :</p>
            <p>• Devoir Surveillé × 2</p>
            <p>• Moy. Interrogations × 1</p>
            <p className="text-indigo-500 mt-1">Moyenne = (DS×2 + Moy.Int×1) / 3</p>
          </div>
        </div>
      </div>

      {/* Liste des élèves */}
      {selectedCourse ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-3">
            <span
              className="w-4 h-4 rounded-full"
              style={{ background: sc(selectedCourse.subject?.color) }}
            />
            <h3 className="font-bold text-slate-800">
              {selectedCourse.subject.name} — {selectedCourse.class.name} — Trimestre {trimester}
            </h3>
          </div>

          {loadingStudents ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Chargement...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Icon icon="fa-users" className="text-4xl mb-2" />
              <p>Aucun élève dans cette classe</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                    <th className="text-left px-6 py-3">Élève</th>
                    <th className="text-center px-4 py-3">Devoir (T{trimester})</th>
                    <th className="text-center px-4 py-3">Interrogations (T{trimester})</th>
                    <th className="text-center px-4 py-3">Moyenne (T{trimester})</th>
                    <th className="text-center px-4 py-3">Statut</th>
                    <th className="text-center px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsData.map((data, idx) => {
                    const { student, devoir, interrogations, moyenne } = data;
                    
                    return (
                      <tr
                        key={student.id}
                        className={`border-t border-slate-50 ${idx % 2 === 0 ? '' : 'bg-slate-50/40'}`}
                      >
                        {/* Élève */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {student.firstName[0]}
                              {student.lastName[0]}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800 text-sm">
                                {student.lastName} {student.firstName}
                              </p>
                              <p className="text-xs text-slate-400">{student.registrationNo}</p>
                            </div>
                          </div>
                        </td>
                        {/* Devoir */}
                        <td className="px-4 py-4 text-center">
                          {devoir ? (
                            <span className="text-sm font-bold text-slate-700">
                              {devoir.value}/20
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        {/* Interrogations */}
                        <td className="px-4 py-4 text-center">
                          {interrogations.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                {interrogations.length} note(s)
                              </span>
                              <span className="text-xs text-slate-400">
                                Moy: {(interrogations.reduce((a, i) => a + i.value, 0) / interrogations.length).toFixed(1)}/20
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        {/* Moyenne */}
                        <td className="px-4 py-4 text-center">
                          {moyenne ? (
                            <span
                              className={`text-lg font-bold ${
                                moyenne.value < 10 ? 'text-red-600' : 'text-green-600'
                              }`}
                            >
                              {moyenne.value}/20
                            </span>
                          ) : (
                            <span className="text-slate-300 text-lg">—</span>
                          )}
                        </td>
                        {/* Statut */}
                        <td className="px-4 py-4 text-center">
                          {!moyenne ? (
                            <span className="text-xs text-slate-400">Non saisi</span>
                          ) : moyenne.value >= 14 ? (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                              Bien
                            </span>
                          ) : moyenne.value >= 10 ? (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                              Passable
                            </span>
                          ) : (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                              Insuffisant
                            </span>
                          )}
                        </td>
                        {/* Action */}
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => openModal(student)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2 mx-auto ${
                              moyenne
                                ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                : 'bg-green-50 text-green-700 hover:bg-green-100'
                            }`}
                          >
                            <Icon icon={moyenne ? 'fa-edit' : 'fa-plus'} />
                            {moyenne ? 'Modifier' : 'Saisir'}
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
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
          <Icon icon="fa-arrow-left" className="text-4xl text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">
            Sélectionnez un cours pour commencer la saisie
          </p>
        </div>
      )}

      {/* MODAL DE SAISIE DES NOTES */}
      {modalOpen && selectedStudent && selectedCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl p-8 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                <Icon icon="fa-star" className="text-green-500 mr-2" />
                Notes — {selectedStudent.firstName} {selectedStudent.lastName}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Icon icon="fa-times" className="text-2xl" />
              </button>
            </div>

            {/* Badges */}
            <div className="flex gap-3 mb-6 flex-wrap">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
                {selectedCourse.subject.name}
              </span>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm">
                {selectedCourse.class.name}
              </span>
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-bold">
                Trimestre {trimester}
              </span>
            </div>

            <div className="border rounded-lg p-5 bg-gray-50">
              <h4 className="font-semibold text-gray-700 mb-1">Contrôles - Trimestre {trimester}</h4>
              <p className="text-xs text-gray-500 mb-5">
                Formule : <span className="font-mono">(Devoir×2 + Moy.Interrogations×1) / 3</span>
              </p>

              {/* Devoir Surveillé */}
              <div className="p-4 bg-white rounded-lg mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Devoir Surveillé (/20)
                  <span className="ml-2 text-xs text-indigo-600 font-semibold">(Coef 2)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  className="w-full border border-gray-300 p-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={gradeInput.devoir || ''}
                  onChange={e => {
                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                    setGradeInput({
                      ...gradeInput,
                      devoir: clampTo20(val),
                    });
                  }}
                  onBlur={e => {
                    // Limiter à 20 quand on quitte le champ
                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                    setGradeInput({
                      ...gradeInput,
                      devoir: clampTo20(val),
                    });
                  }}
                  placeholder="0.0 - 20"
                />
                {gradeInput.devoir > 20 && (
                  <p className="text-xs text-red-500 mt-1">La note maximale est 20</p>
                )}
              </div>

              {/* Interrogations */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Interrogations
                    <span className="ml-2 text-xs text-indigo-600 font-semibold">
                      (Coef 1 chacune, max 20)
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setGradeInput({
                        ...gradeInput,
                        interrogations: [...gradeInput.interrogations, 0],
                      })
                    }
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    + Ajouter une interrogation
                  </button>
                </div>

                {gradeInput.interrogations.map((note, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <div className="flex-1">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.5"
                        className="w-full border border-gray-300 p-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={note || ''}
                        onChange={e => {
                          const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          const newInterros = [...gradeInput.interrogations];
                          newInterros[index] = clampTo20(val);
                          setGradeInput({ ...gradeInput, interrogations: newInterros });
                        }}
                        onBlur={e => {
                          const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          const newInterros = [...gradeInput.interrogations];
                          newInterros[index] = clampTo20(val);
                          setGradeInput({ ...gradeInput, interrogations: newInterros });
                        }}
                        placeholder={`Interrogation ${index + 1} (max 20)`}
                      />
                      {note > 20 && (
                        <p className="text-xs text-red-500 mt-0.5">Max: 20</p>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        setGradeInput({
                          ...gradeInput,
                          interrogations: gradeInput.interrogations.filter((_, i) => i !== index),
                        })
                      }
                      className="px-3 text-red-600 hover:bg-red-50 rounded-lg transition self-start mt-1"
                    >
                      <Icon icon="fa-trash" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Aperçu moyenne */}
              {(gradeInput.devoir > 0 || gradeInput.interrogations.some(v => v > 0)) && (
                <div className="mt-5 p-4 bg-blue-50 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Moyenne pondérée calculée (T{trimester})</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {calculateAverage(gradeInput.devoir, gradeInput.interrogations)} / 20
                    </p>
                  </div>
                  <div className="text-right text-xs text-gray-500 space-y-0.5">
                    {gradeInput.devoir > 0 && <p>Devoir : {clampTo20(gradeInput.devoir)} × 2</p>}
                    {gradeInput.interrogations.filter(v => v > 0).length > 0 && (
                      <p>
                        Interros : {gradeInput.interrogations.filter(v => v > 0).length} note(s) × 1
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {modalError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {modalError}
              </div>
            )}

            <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
              <button
                onClick={() => setModalOpen(false)}
                className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Annuler
              </button>
              <button
                onClick={saveGrades}
                disabled={
                  saving ||
                  (gradeInput.devoir === 0 && gradeInput.interrogations.every(v => v === 0))
                }
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 transition"
              >
                {saving ? (
                  <>
                    <Icon icon="fa-spinner" className="fa-spin" /> Enregistrement...
                  </>
                ) : (
                  <>
                    <Icon icon="fa-save" /> Enregistrer (T{trimester})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}