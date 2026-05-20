// app/teacher/classes/page.tsx
'use client';

import { useState, useEffect, Fragment } from 'react';
import Icon from '@/components/ui/Icon';
import Bulletin from '@/components/ui/Bulletin';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  registrationNo: string;
  averages?: {
    trimestre1: number;
    trimestre2: number;
    trimestre3: number;
    annuelle: number;
  };
  _count?: { absences: number };
}

interface Course {
  id: string;
  class: { id: string; name: string; level: string };
  subject: { id: string; name: string; color: string };
  teacher?: { id: string };
}

interface ScheduleSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string | null;
  courseId: string;
}

interface BulletinRecord {
  id: string;
  studentId: string;
  period: Period;
  status: 'PENDING' | 'VERIFIED' | 'CONFIRMED';
  generalAverage?: number;
  appreciation?: string;
  generatedAt?: string;
  matieres?: any[];
  subjects?: any[];
  trimestres?: { trimestre1: number; trimestre2: number; trimestre3: number };
  annuelle?: number;
  rang?: { position: number; total: number };
  absences?: number;
  conduite?: { note: number; appreciation: string };
}

interface AbsenceRecord {
  id: string;
  date: string;
  type: string;
  isJustified: boolean;
  reason?: string;
}

type AttendanceStatus = 'present' | 'absent' | 'late' | null;
type ActiveTab = 'students' | 'attendance' | 'bulletins';
type Period = 'TRIMESTRE_1' | 'TRIMESTRE_2' | 'TRIMESTRE_3';

// ─── Constantes ───────────────────────────────────────────────────────────────
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const sc = (c?: string) => c || '#6366f1';

const getToken = () => localStorage.getItem('token') || '';
const getTeacherId = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}').teacherId || '';
  } catch {
    return '';
  }
};

const PERIOD_LABELS: Record<Period, string> = {
  TRIMESTRE_1: '1er Trimestre',
  TRIMESTRE_2: '2ème Trimestre',
  TRIMESTRE_3: '3ème Trimestre',
};

const STATUS_CFG = {
  PENDING: {
    label: 'En attente',
    dot: 'bg-amber-400',
    pill: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  VERIFIED: {
    label: 'Vérifié',
    dot: 'bg-blue-500',
    pill: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  CONFIRMED: {
    label: 'Confirmé',
    dot: 'bg-emerald-500',
    pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
};

const APPRECIATION_OPTIONS = [
  'Excellent',
  'Très bien',
  'Bien',
  'Assez bien',
  'Satisfaisant',
  'Peut mieux faire',
  'Insuffisant',
  'Efforts nécessaires',
];

const ATTENDANCE_CFG = {
  present: {
    label: 'Présent',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    icon: 'fa-check',
  },
  absent: {
    label: 'Absent',
    color: 'bg-red-100 text-red-700 border-red-300',
    icon: 'fa-times',
  },
  late: {
    label: 'Retard',
    color: 'bg-amber-100 text-amber-700 border-amber-300',
    icon: 'fa-clock',
  },
};

function avgStyle(v?: number | null) {
  if (!v && v !== 0) return 'text-slate-300';
  return v >= 14
    ? 'text-emerald-600 font-bold'
    : v >= 10
    ? 'text-amber-600 font-bold'
    : 'text-red-500 font-bold';
}
function avgBadge(v?: number | null) {
  if (!v && v !== 0) return 'bg-slate-100 text-slate-400';
  return v >= 14
    ? 'bg-emerald-100 text-emerald-700'
    : v >= 10
    ? 'bg-amber-100 text-amber-700'
    : 'bg-red-100 text-red-600';
}

// ─── Composant Modal Historique ───────────────────────────────────────────────
function AbsenceHistoryModal({
  student,
  onClose,
}: {
  student: Student;
  onClose: () => void;
}) {
  const [absences, setAbsences] = useState<AbsenceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${getToken()}` };
    fetch(`${API}/absences/student/${student.id}`, { headers })
      .then((r) => (r.ok ? r.json() : { absences: [] }))
      .then((data) => setAbsences(data.absences || []))
      .catch(() => setAbsences([]))
      .finally(() => setLoading(false));
  }, [student.id]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Icon icon="fa-history" />
            Historique des absences
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <Icon icon="fa-times" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <p className="text-sm text-slate-600 mb-4">
            <span className="font-medium">
              {student.lastName} {student.firstName}
            </span>{' '}
            · Matricule {student.registrationNo}
          </p>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
            </div>
          ) : absences.length === 0 ? (
            <p className="text-slate-400 text-center py-4">Aucune absence enregistrée</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-500 text-xs uppercase">
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Justifié</th>
                  <th className="px-3 py-2 text-left">Motif</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {absences.map((a) => (
                  <tr key={a.id}>
                    <td className="px-3 py-2">{new Date(a.date).toLocaleDateString('fr-FR')}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          a.type === 'ABSENCE'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {a.type === 'ABSENCE' ? 'Absence' : 'Retard'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {a.isJustified ? (
                        <span className="text-emerald-600 text-xs font-medium">Oui</span>
                      ) : (
                        <span className="text-slate-400 text-xs">Non</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{a.reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="px-6 py-3 border-t bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function ClassesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [mainClassId, setMainClassId] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<{
    id: string;
    name: string;
    level: string;
  } | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('students');

  // Présence
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [savingAtt, setSavingAtt] = useState(false);
  const [attSaved, setAttSaved] = useState(false);

  // Présence — sélection matière & créneau
  const [attCourseId, setAttCourseId] = useState<string | null>(null);
  const [attSlots, setAttSlots] = useState<ScheduleSlot[]>([]);
  const [attSlotId, setAttSlotId] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Bulletins (PP seulement)
  const [bulletins, setBulletins] = useState<BulletinRecord[]>([]);
  const [loadingBul, setLoadingBul] = useState(false);
  const [period, setPeriod] = useState<Period>('TRIMESTRE_1');
  const [appreciations, setAppreciations] = useState<Record<string, string>>({});
  const [savingBulId, setSavingBulId] = useState<string | null>(null);
  const [confirmingAll, setConfirmingAll] = useState(false);
  const [bulSaved, setBulSaved] = useState(false);

  // Aperçu bulletin
  const [bulletinView, setBulletinView] = useState<any | null>(null);
  const [loadingView, setLoadingView] = useState(false);

  // Historique absence
  const [historyStudent, setHistoryStudent] = useState<Student | null>(null);

  const headers = { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' };

  // ── Charger cours + classe principale ────────────────────────────────────
  useEffect(() => {
    const tid = getTeacherId();
    if (!tid) return;
    Promise.all([
      fetch(`${API}/teachers/${tid}/courses`, { headers }).then((r) => r.json()),
      fetch(`${API}/teachers/${tid}/main-class`, { headers })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]).then(([c, m]) => {
      setCourses(Array.isArray(c) ? c : []);
      if (m?.id) setMainClassId(m.id);
    });
  }, []);

  const uniqueClasses = Array.from(new Map(courses.map((c) => [c.class.id, c.class])).values());
  const isMainClass = selectedClass?.id === mainClassId;

  // ── Charger élèves ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedClass) return;
    const tid = getTeacherId();
    setLoadingStudents(true);
    setStudents([]);
    setAttCourseId(null);
    setAttSlotId(null);
    setAttSlots([]);
    const isMain = selectedClass.id === mainClassId;
    const url =
      isMain && tid
        ? `${API}/teachers/${tid}/class-students`
        : `${API}/teachers/class/${selectedClass.id}/students`;

    fetch(url, { headers })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        const studs: Student[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.students)
          ? data.students
          : Array.isArray(data?.class?.students)
          ? data.class.students
          : [];
        setStudents(studs);
        const init: Record<string, AttendanceStatus> = {};
        studs.forEach((s) => {
          init[s.id] = null;
        });
        setAttendance(init);
      })
      .catch(() => setStudents([]))
      .finally(() => setLoadingStudents(false));
  }, [selectedClass, mainClassId]);

  // ── Charger les créneaux quand une matière est sélectionnée pour la présence ──
  useEffect(() => {
    if (!attCourseId || !selectedClass) {
      setAttSlots([]);
      setAttSlotId(null);
      return;
    }
    setLoadingSlots(true);
    fetch(`${API}/schedule/class/${selectedClass.id}`, { headers })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: any[]) => {
        const arr = Array.isArray(data) ? data : [];
        // Filtrer les créneaux du cours sélectionné
        const filtered = arr.filter((s: any) => s.courseId === attCourseId || s.course?.id === attCourseId);
        setAttSlots(filtered);
        setAttSlotId(filtered.length === 1 ? filtered[0].id : null);
      })
      .catch(() => setAttSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [attCourseId, selectedClass]);


  useEffect(() => {
    if (!isMainClass || !selectedClass || activeTab !== 'bulletins') return;
    setLoadingBul(true);
    fetch(`${API}/bulletins/class/${selectedClass.id}?period=${period}`, { headers })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: BulletinRecord[]) => {
        const list = Array.isArray(data) ? data : [];
        setBulletins(list);
        const map: Record<string, string> = {};
        list.forEach((b) => {
          if (b.appreciation) map[b.studentId] = b.appreciation;
        });
        setAppreciations(map);
      })
      .finally(() => setLoadingBul(false));
  }, [isMainClass, selectedClass, period, activeTab]);

  // ── Présence ──────────────────────────────────────────────────────────────
  const saveAttendance = async () => {
    if (!selectedClass || !attCourseId) return;
    setSavingAtt(true);
    try {
      const selectedSlot = attSlots.find(s => s.id === attSlotId);
      const entries = Object.entries(attendance).filter(([, v]) => v !== null);
      await Promise.all(
        entries.map(([studentId, status]) =>
          fetch(`${API}/absences`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              studentId,
              classId: selectedClass.id,
              courseId: attCourseId,
              scheduleSlotId: attSlotId || undefined,
              date: attendanceDate,
              type:
                status === 'late' ? 'RETARD' : status === 'absent' ? 'ABSENCE' : 'PRESENCE',
              isJustified: false,
              ...(selectedSlot ? { startTime: selectedSlot.startTime, endTime: selectedSlot.endTime } : {}),
            }),
          })
        )
      );
      setAttSaved(true);
      setTimeout(() => setAttSaved(false), 3000);
    } catch {
      /* silently fail */
    } finally {
      setSavingAtt(false);
    }
  };

  // ── Actions bulletins ─────────────────────────────────────────────────────
  const verifyBulletin = async (b: BulletinRecord) => {
    setSavingBulId(b.id);
    try {
      await fetch(`${API}/bulletins/${b.id}/verify`, { method: 'PATCH', headers });
      if (appreciations[b.studentId]) {
        await fetch(`${API}/bulletins/${b.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ appreciation: appreciations[b.studentId] }),
        });
      }
      setBulletins((prev) =>
        prev.map((x) =>
          x.id === b.id
            ? { ...x, status: 'VERIFIED', appreciation: appreciations[b.studentId] }
            : x
        )
      );
    } finally {
      setSavingBulId(null);
    }
  };

  const confirmBulletin = async (b: BulletinRecord) => {
    setSavingBulId(b.id);
    try {
      await fetch(`${API}/bulletins/${b.id}/confirm`, { method: 'PATCH', headers });
      setBulletins((prev) =>
        prev.map((x) => (x.id === b.id ? { ...x, status: 'CONFIRMED' } : x))
      );
    } finally {
      setSavingBulId(null);
    }
  };

  const confirmAllVerified = async () => {
    setConfirmingAll(true);
    try {
      await Promise.all(
        bulletins
          .filter((b) => b.status === 'VERIFIED')
          .map((b) =>
            fetch(`${API}/bulletins/${b.id}/confirm`, { method: 'PATCH', headers })
          )
      );
      setBulletins((prev) =>
        prev.map((b) => (b.status === 'VERIFIED' ? { ...b, status: 'CONFIRMED' } : b))
      );
      setBulSaved(true);
      setTimeout(() => setBulSaved(false), 3000);
    } finally {
      setConfirmingAll(false);
    }
  };

  const openBulletinView = async (b: BulletinRecord, student: Student) => {
    setLoadingView(true);
    try {
      const res = await fetch(`${API}/bulletins/${b.id}/details`, { headers });
      const detail = res.ok ? await res.json() : null;

      // Construire la note de conduite : priorité detail > bulletin record
      const conduiteFromDetail = detail?.conduite;
      const conduiteFromRecord = b.conduite;
      const conduiteNote =
        conduiteFromDetail?.note ?? conduiteFromRecord?.note ?? null;
      const conduiteData = conduiteFromDetail ?? conduiteFromRecord ?? null;

      setBulletinView({
        student: {
          firstName: student.firstName,
          lastName: student.lastName,
          registrationNo: student.registrationNo,
          class: selectedClass,
        },
        trimester: parseInt(b.period.replace('TRIMESTRE_', '')),
        period: b.period,
        matieres: detail?.matieres || b.matieres || [],
        subjects: detail?.subjects || b.subjects || [],
        moyennes: {
          ...(detail?.moyennes || {}),
          conduite: conduiteNote,
        },
        bilans: detail?.bilans,
        trimestres: detail?.trimestres || b.trimestres,
        annuelle: detail?.annuelle || b.annuelle,
        rang: detail?.rang || b.rang,
        absences: detail?.absences ?? b.absences ?? 0,
        conduite: conduiteData
          ? { ...conduiteData, note: conduiteNote }
          : null,
        appreciation: appreciations[b.studentId] || b.appreciation || '',
        tableauHonneur: detail?.tableauHonneur || '',
        generalAverage: b.generalAverage,
        generatedAt: b.generatedAt || new Date().toISOString(),
      });
    } finally {
      setLoadingView(false);
    }
  };

  // ── Dérivés ───────────────────────────────────────────────────────────────
  const presentCount = Object.values(attendance).filter((v) => v === 'present').length;
  const absentCount = Object.values(attendance).filter((v) => v === 'absent').length;
  const lateCount = Object.values(attendance).filter((v) => v === 'late').length;
  const unmarkedCount = Object.values(attendance).filter((v) => v === null).length;

  const pendingCount = bulletins.filter((b) => b.status === 'PENDING').length;
  const verifiedCount = bulletins.filter((b) => b.status === 'VERIFIED').length;
  const confirmedCount = bulletins.filter((b) => b.status === 'CONFIRMED').length;

  const tabs: { key: ActiveTab; icon: string; label: string; badge?: number }[] = [
    { key: 'students', icon: 'fa-users', label: `Élèves (${students.length})` },
    { key: 'attendance', icon: 'fa-user-check', label: 'Présence' },
    ...(isMainClass
      ? [
          {
            key: 'bulletins' as ActiveTab,
            icon: 'fa-file-alt',
            label: 'Bulletins',
            badge: pendingCount,
          },
        ]
      : []),
  ];

  // Calcul de la moyenne annuelle corrigée
  const computeAnnualAverage = (averages?: Student['averages']) => {
    if (!averages) return null;
    const t1 = averages.trimestre1;
    const t2 = averages.trimestre2;
    const t3 = averages.trimestre3;
    if (t1 !== undefined && t2 !== undefined && t3 !== undefined) {
      return (t1 + t2 + t3) / 3;
    }
    return averages.annuelle ?? null;
  };

  // ─── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl px-6 py-5 text-white shadow-md">
        <h1 className="text-xl font-bold flex items-center gap-2.5">
          <Icon icon="fa-chalkboard-teacher" />
          Mes Classes
        </h1>
        <p className="text-teal-200 text-sm mt-0.5">
          {uniqueClasses.length} classe(s) assignée(s)
          {isMainClass && selectedClass && (
            <span className="ml-2 bg-yellow-400/20 border border-yellow-300/30 text-yellow-200 text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <Icon icon="fa-star" /> PP · {selectedClass.name}
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Sidebar classes */}
        <div className="lg:col-span-1 space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-1 mb-2">
            Classes
          </p>
          {uniqueClasses.length === 0 && (
            <p className="text-slate-400 text-sm px-1">Aucune classe assignée</p>
          )}
          {uniqueClasses.map((cls) => {
            const isMain = cls.id === mainClassId;
            const isActive = selectedClass?.id === cls.id;
            const subjects = courses
              .filter((c) => c.class.id === cls.id)
              .map((c) => c.subject);
            return (
              <button
                key={cls.id}
                onClick={() => {
                  setSelectedClass(cls);
                  setActiveTab('students');
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition relative ${
                  isActive
                    ? 'bg-teal-50 border-teal-300 shadow-sm'
                    : 'bg-white border-slate-100 hover:border-teal-200'
                }`}
              >
                {isMain && (
                  <span className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <Icon icon="fa-star" /> PP
                  </span>
                )}
                <p
                  className={`font-bold pr-8 ${
                    isActive ? 'text-teal-700' : 'text-slate-800'
                  }`}
                >
                  {cls.name}
                </p>
                <p className="text-xs text-slate-400 mb-2">{cls.level}</p>
                <div className="flex flex-wrap gap-1">
                  {subjects.map((s) => (
                    <span
                      key={s.id}
                      className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                      style={{ background: sc(s.color) }}
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Zone principale */}
        <div className="lg:col-span-3">
          {!selectedClass ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center flex flex-col items-center min-h-[300px] justify-center">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                <Icon icon="fa-chalkboard" className="text-2xl text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">Sélectionnez une classe</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Bandeau PP */}
              {isMainClass && (
                <div className="bg-amber-50 border-b border-amber-100 px-5 py-2.5 flex items-center gap-2.5">
                  <span className="w-6 h-6 bg-yellow-400 rounded-md flex items-center justify-center flex-shrink-0">
                    <Icon icon="fa-star" className="text-white text-xs" />
                  </span>
                  <p className="text-amber-800 text-sm font-semibold">
                    Professeur Principal · {selectedClass.name}
                  </p>
                </div>
              )}

              {/* Onglets */}
              <div className="flex border-b border-slate-100">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition ${
                      activeTab === tab.key
                        ? 'border-b-2 border-teal-500 text-teal-600'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon icon={tab.icon as any} />
                    {tab.label}
                    {!!tab.badge && (
                      <span className="bg-amber-500 text-white text-[11px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* ═══ ÉLÈVES ═══════════════════════════════════════════════ */}
              {activeTab === 'students' &&
                (loadingStudents ? (
                  <div className="p-10 text-center">
                    <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto" />
                  </div>
                ) : students.length === 0 ? (
                  <div className="p-10 text-center text-slate-400">
                    <Icon icon="fa-user-slash" className="text-3xl mb-2" />
                    <p>Aucun élève inscrit</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                          <th className="text-left px-5 py-3 w-8">#</th>
                          <th className="text-left px-5 py-3">Élève</th>
                          <th className="text-left px-4 py-3">Matricule</th>
                          {isMainClass && (
                            <>
                              <th className="text-center px-3 py-3">T1</th>
                              <th className="text-center px-3 py-3">T2</th>
                              <th className="text-center px-3 py-3">T3</th>
                              <th className="text-center px-3 py-3">Annuelle</th>
                            </>
                          )}
                          <th className="text-center px-4 py-3">Absences</th>
                          <th className="text-center px-4 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((s, i) => {
                          const annualAvg = isMainClass
                            ? computeAnnualAverage(s.averages)
                            : null;
                          return (
                            <tr
                              key={s.id}
                              className={`border-t border-slate-50 hover:bg-slate-50/60 ${
                                i % 2 !== 0 ? 'bg-slate-50/30' : ''
                              }`}
                            >
                              <td className="px-5 py-3 text-slate-400 text-xs">{i + 1}</td>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                    {s.firstName[0]}
                                    {s.lastName[0]}
                                  </div>
                                  <span className="font-medium text-slate-800">
                                    {s.lastName} {s.firstName}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-400">
                                {s.registrationNo}
                              </td>
                              {isMainClass && (
                                <>
                                  {(
                                    ['trimestre1', 'trimestre2', 'trimestre3'] as const
                                  ).map((k) => (
                                    <td key={k} className="px-3 py-3 text-center">
                                      <span className={`text-sm ${avgStyle(s.averages?.[k])}`}>
                                        {s.averages?.[k] != null
                                          ? s.averages[k].toFixed(2)
                                          : '—'}
                                      </span>
                                    </td>
                                  ))}
                                  <td className="px-3 py-3 text-center">
                                    <span className={`text-sm font-bold ${avgStyle(annualAvg)}`}>
                                      {annualAvg != null ? annualAvg.toFixed(2) : '—'}
                                    </span>
                                  </td>
                                </>
                              )}
                              <td className="px-4 py-3 text-center">
                                <span
                                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                    (s._count?.absences || 0) > 5
                                      ? 'bg-red-100 text-red-600'
                                      : 'bg-slate-100 text-slate-500'
                                  }`}
                                >
                                  {s._count?.absences || 0}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => setHistoryStudent(s)}
                                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1 mx-auto"
                                >
                                  <Icon icon="fa-history" />
                                  Historique
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ))}

              {/* ═══ PRÉSENCE ═════════════════════════════════════════════ */}
              {activeTab === 'attendance' && (
                <div>
                  {/* ── Étape 1 & 2 : Sélection matière + créneau ─────────── */}
                  <div className="px-5 py-4 border-b border-slate-100 space-y-3">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      1 · Sélectionner la matière
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {courses
                        .filter((c) => c.class.id === selectedClass.id)
                        .map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setAttCourseId(c.id === attCourseId ? null : c.id);
                              setAttSlotId(null);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold border transition ${
                              attCourseId === c.id
                                ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-sm'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300'
                            }`}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ background: sc(c.subject.color) }}
                            />
                            {c.subject.name}
                          </button>
                        ))}
                    </div>

                    {attCourseId && (
                      <>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide pt-1">
                          2 · Sélectionner le créneau horaire
                        </p>
                        {loadingSlots ? (
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <div className="w-4 h-4 border-2 border-teal-200 border-t-teal-500 rounded-full animate-spin" />
                            Chargement des créneaux…
                          </div>
                        ) : attSlots.length === 0 ? (
                          <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                            Aucun créneau trouvé pour cette matière. Vous pouvez quand même saisir la présence sans créneau.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {attSlots.map((slot) => {
                              const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
                              return (
                                <button
                                  key={slot.id}
                                  onClick={() => setAttSlotId(slot.id === attSlotId ? null : slot.id)}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold border transition ${
                                    attSlotId === slot.id
                                      ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-sm'
                                      : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300'
                                  }`}
                                >
                                  <Icon icon="fa-clock" className="text-xs" />
                                  {days[slot.dayOfWeek] ?? `Jour ${slot.dayOfWeek}`} · {slot.startTime}–{slot.endTime}
                                  {slot.room && (
                                    <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded-md text-slate-500">
                                      {slot.room}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}

                    {/* Date + raccourcis */}
                    <div className="flex flex-wrap gap-3 items-center pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-500 font-medium">Date :</label>
                        <input
                          type="date"
                          value={attendanceDate}
                          onChange={(e) => setAttendanceDate(e.target.value)}
                          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-teal-400"
                        />
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            const all: Record<string, AttendanceStatus> = {};
                            students.forEach((s) => { all[s.id] = 'present'; });
                            setAttendance(all);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition"
                        >
                          Tous présents
                        </button>
                        <button
                          onClick={() => {
                            const all: Record<string, AttendanceStatus> = {};
                            students.forEach((s) => { all[s.id] = null; });
                            setAttendance(all);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                        >
                          Réinitialiser
                        </button>
                      </div>
                      <div className="ml-auto flex gap-2 text-xs font-semibold flex-wrap">
                        <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
                          {presentCount} présents
                        </span>
                        <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full">
                          {absentCount} absents
                        </span>
                        <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
                          {lateCount} retards
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bandeau résumé du contexte sélectionné */}
                  {attCourseId && (
                    <div className="mx-5 mt-3 px-4 py-2.5 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-sm flex items-center gap-2 flex-wrap">
                      <Icon icon="fa-chalkboard-teacher" />
                      <span className="font-semibold">
                        {courses.find(c => c.id === attCourseId)?.subject.name}
                      </span>
                      <span className="text-teal-500">·</span>
                      <span>{selectedClass.name}</span>
                      {attSlotId && (
                        <>
                          <span className="text-teal-500">·</span>
                          <span>
                            {(() => {
                              const slot = attSlots.find(s => s.id === attSlotId);
                              const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
                              return slot ? `${days[slot.dayOfWeek]} ${slot.startTime}–${slot.endTime}` : '';
                            })()}
                          </span>
                        </>
                      )}
                      <span className="text-teal-500">·</span>
                      <span>{new Date(attendanceDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                    </div>
                  )}

                  {attSaved && (
                    <div className="mx-5 mt-3 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center gap-2">
                      <Icon icon="fa-check-circle" /> Présence enregistrée !
                    </div>
                  )}

                  {/* ── Étape 3 : Liste des élèves ─────────────────────── */}
                  {loadingStudents ? (
                    <div className="p-8 text-center">
                      <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto" />
                    </div>
                  ) : (
                    <>
                      {!attCourseId && (
                        <div className="px-5 py-6 text-center text-slate-400 text-sm">
                          <Icon icon="fa-arrow-up" className="mb-2 text-xl" />
                          <p>Sélectionnez d'abord une matière ci-dessus</p>
                        </div>
                      )}
                      {attCourseId && (
                        <>
                          <div className="divide-y divide-slate-50">
                            {students.map((s, i) => (
                              <div
                                key={s.id}
                                className={`px-5 py-3 flex items-center gap-3 ${
                                  i % 2 !== 0 ? 'bg-slate-50/40' : ''
                                }`}
                              >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                  {s.firstName[0]}
                                  {s.lastName[0]}
                                </div>
                                <span className="flex-1 font-medium text-slate-800 text-sm">
                                  {s.lastName} {s.firstName}
                                </span>
                                <span className="text-xs text-slate-400 hidden sm:inline">
                                  {s.registrationNo}
                                </span>
                                <div className="flex gap-1.5">
                                  {(
                                    Object.entries(ATTENDANCE_CFG) as [
                                      string,
                                      { label: string; color: string; icon: string },
                                    ][]
                                  ).map(([key, cfg]) => (
                                    <button
                                      key={key}
                                      onClick={() =>
                                        setAttendance((prev) => ({
                                          ...prev,
                                          [s.id]:
                                            prev[s.id] === key ? null : (key as AttendanceStatus),
                                        }))
                                      }
                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                                        attendance[s.id] === key
                                          ? cfg.color
                                          : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                                      }`}
                                    >
                                      <Icon icon={cfg.icon as any} />
                                      <span className="hidden md:inline">{cfg.label}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="p-5 border-t border-slate-100 flex justify-end">
                            <button
                              onClick={saveAttendance}
                              disabled={savingAtt || unmarkedCount === students.length}
                              className="flex items-center gap-2 bg-teal-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-teal-700 transition disabled:opacity-50"
                            >
                              {savingAtt ? (
                                <>
                                  <Icon icon="fa-spinner" className="fa-spin" /> Enregistrement...
                                </>
                              ) : (
                                <>
                                  <Icon icon="fa-save" /> Enregistrer la présence
                                </>
                              )}
                            </button>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ═══ BULLETINS (PP seulement) ═════════════════════════════ */}
              {activeTab === 'bulletins' && isMainClass && (
                <div>
                  {/* Sélecteur trimestre + compteurs */}
                  <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
                    <div className="flex gap-1.5">
                      {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(
                        ([key, label]) => (
                          <button
                            key={key}
                            onClick={() => setPeriod(key)}
                            className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition ${
                              period === key
                                ? 'bg-teal-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {label}
                          </button>
                        )
                      )}
                    </div>
                    <div className="ml-auto flex gap-2 text-xs font-semibold flex-wrap">
                      <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
                        {pendingCount} en attente
                      </span>
                      <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
                        {verifiedCount} vérifiés
                      </span>
                      <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
                        {confirmedCount} confirmés
                      </span>
                    </div>
                  </div>

                  {/* Bannière confirmer tous */}
                  {verifiedCount > 0 && (
                    <div className="mx-5 mt-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-3 flex-wrap">
                      <p className="text-sm text-blue-700 flex items-center gap-2">
                        <Icon icon="fa-info-circle" />
                        {verifiedCount} bulletin(s) vérifiés prêts à être confirmés
                      </p>
                      <button
                        onClick={confirmAllVerified}
                        disabled={confirmingAll}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition disabled:opacity-50"
                      >
                        {confirmingAll ? (
                          <Icon icon="fa-spinner" className="fa-spin" />
                        ) : (
                          <Icon icon="fa-check-double" />
                        )}
                        Confirmer tous
                      </button>
                    </div>
                  )}
                  {bulSaved && (
                    <div className="mx-5 mt-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center gap-2">
                      <Icon icon="fa-check-circle" /> Bulletins confirmés avec succès !
                    </div>
                  )}

                  {/* Liste des bulletins */}
                  {loadingBul ? (
                    <div className="p-10 text-center">
                      <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto" />
                    </div>
                  ) : students.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">Aucun élève</div>
                  ) : (
                    <div className="divide-y divide-slate-100 mt-2">
                      {students.map((s, i) => {
                        const b = bulletins.find((x) => x.studentId === s.id);
                        const status = (b?.status ?? 'PENDING') as keyof typeof STATUS_CFG;
                        const cfg = STATUS_CFG[status];
                        const busy = savingBulId === b?.id;

                        return (
                          <div
                            key={s.id}
                            className={`px-5 py-4 ${i % 2 !== 0 ? 'bg-slate-50/30' : ''}`}
                          >
                            <div className="flex items-center gap-3 flex-wrap">
                              {/* Identité */}
                              <div className="flex items-center gap-3 flex-1 min-w-[160px]">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                  {s.firstName[0]}
                                  {s.lastName[0]}
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-800 text-sm leading-tight">
                                    {s.lastName} {s.firstName}
                                  </p>
                                  <p className="text-xs text-slate-400">{s.registrationNo}</p>
                                </div>
                              </div>

                              {/* Moyenne */}
                              <div className="text-center w-20">
                                <p className="text-[10px] text-slate-400 mb-0.5">Moyenne</p>
                                <span
                                  className={`text-sm font-bold px-2 py-0.5 rounded-lg ${avgBadge(
                                    b?.generalAverage
                                  )}`}
                                >
                                  {b?.generalAverage ? b.generalAverage.toFixed(2) : '—'}
                                </span>
                              </div>

                              {/* Appréciation PP */}
                              <div className="min-w-[160px]">
                                <p className="text-[10px] text-slate-400 mb-1">
                                  Appréciation PP
                                </p>
                                <select
                                  value={appreciations[s.id] ?? ''}
                                  onChange={(e) =>
                                    setAppreciations((p) => ({
                                      ...p,
                                      [s.id]: e.target.value,
                                    }))
                                  }
                                  disabled={status === 'CONFIRMED'}
                                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-teal-400 disabled:bg-slate-50 disabled:text-slate-400"
                                >
                                  <option value="">— Choisir —</option>
                                  {APPRECIATION_OPTIONS.map((a) => (
                                    <option key={a}>{a}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Statut + boutons */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${cfg.pill}`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`}
                                  />
                                  {cfg.label}
                                </span>

                                {/* Aperçu bulletin */}
                                {b && (
                                  <button
                                    onClick={() => openBulletinView(b, s)}
                                    disabled={loadingView}
                                    className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-200 transition disabled:opacity-50"
                                  >
                                    {loadingView ? (
                                      <Icon icon="fa-spinner" className="fa-spin" />
                                    ) : (
                                      <Icon icon="fa-eye" />
                                    )}
                                    Aperçu
                                  </button>
                                )}

                                {/* Vérifier PENDING → VERIFIED */}
                                {b && status === 'PENDING' && (
                                  <button
                                    onClick={() => verifyBulletin(b)}
                                    disabled={busy}
                                    className="flex items-center gap-1.5 bg-teal-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-teal-700 transition disabled:opacity-50"
                                  >
                                    {busy ? (
                                      <Icon icon="fa-spinner" className="fa-spin" />
                                    ) : (
                                      <Icon icon="fa-check" />
                                    )}
                                    Vérifier
                                  </button>
                                )}

                                {/* Confirmer VERIFIED → CONFIRMED */}
                                {b && status === 'VERIFIED' && (
                                  <button
                                    onClick={() => confirmBulletin(b)}
                                    disabled={busy}
                                    className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition disabled:opacity-50"
                                  >
                                    {busy ? (
                                      <Icon icon="fa-spinner" className="fa-spin" />
                                    ) : (
                                      <Icon icon="fa-check-double" />
                                    )}
                                    Confirmer
                                  </button>
                                )}

                                {status === 'CONFIRMED' && (
                                  <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                                    <Icon icon="fa-lock" /> Finalisé
                                  </span>
                                )}

                                {!b && (
                                  <span className="text-xs text-slate-400 italic">
                                    Non généré
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Aperçu bulletin */}
      {bulletinView && (
        <Bulletin
          bulletinData={bulletinView}
          onClose={() => setBulletinView(null)}
          onPrint={() => window.print()}
          onDownload={() => window.print()}
        />
      )}

      {/* Modal Historique Absences */}
      {historyStudent && (
        <AbsenceHistoryModal
          student={historyStudent}
          onClose={() => setHistoryStudent(null)}
        />
      )}
    </div>
  );
}