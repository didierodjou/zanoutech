'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/Icon';
import Bulletin from './components/Bulletin';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  sex: 'M' | 'F' | 'AUTRE';
  dateOfBirth: string;
  registrationNo: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string | null;
  class?: {
    id: string;
    name: string;
    level: string;
  } | null;
  user?: {
    email: string;
    isActive: boolean;
    createdAt?: string;
  };
  grades?: Grade[];
  absences?: Absence[];
  bulletins?: BulletinType[];
  averages?: {
    trimestre1: number;
    trimestre2: number;
    trimestre3: number;
    annuelle: number;
  };
  _count?: {
    grades: number;
    absences: number;
    bulletins: number;
  };
}

interface Grade {
  id: string;
  value: number;
  type: string;
  coefficient: number;
  comment?: string;
  appreciation?: string;
  date: string;
  period: string;
  trimester: number;
  studentId: string;
  subjectId: string;
  subject: {
    id: string;
    name: string;
    color?: string;
  };
}

interface Absence {
  id: string;
  date: string;
  type: string;
  isJustified: boolean;
  reason?: string;
}

interface BulletinType {
  id: string;
  period: string;
  generalAverage: number;
  status: string;
  appreciation?: string;
  generatedAt: string;
}

interface Class {
  id: string;
  name: string;
  level: string;
  _count?: {
    students: number;
  };
}

interface Subject {
  id: string;
  name: string;
  coefficient?: number;
}

interface NewStudent {
  firstName: string;
  lastName: string;
  sex: 'M' | 'F' | 'AUTRE';
  dateOfBirth: string;
  registrationNo: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  classId: string;
  email: string;
}

interface EditStudent extends NewStudent {
  id: string;
}

interface AbsenceData {
  studentId: string;
  date: string;
  type: string;
  isJustified: boolean;
  reason: string;
}

interface GradeData {
  studentId: string;
  subjectId: string;
  trimester: number;
  devoir: number;
  interrogations: number[];
}

interface AttendanceData {
  studentId: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  isJustified: boolean;
  reason: string;
}

interface PunishmentData {
  studentId: string;
  hours: number;
  reason: string;
  trimester: number;
  givenBy: string;
  selectedReason?: string;
  customReason?: string;
}

// Liste des motifs de punition suggérés
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

// Fonction pour calculer la moyenne pondérée
const calculateWeightedAverage = (devoir: number, interrogations: number[]): number => {
  if (!devoir && (!interrogations || interrogations.length === 0)) return 0;
  
  const interroAvg = interrogations?.length > 0 
    ? interrogations.reduce((a, b) => a + b, 0) / interrogations.length 
    : 0;
  
  if (devoir && interrogations?.length > 0) {
    return Number(((devoir * 2 + interroAvg) / 3).toFixed(2));
  } else if (devoir) {
    return Number(devoir.toFixed(2));
  } else {
    return Number(interroAvg.toFixed(2));
  }
};

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [classFilter, setClassFilter] = useState<string>('');
  const [showTable, setShowTable] = useState<boolean>(true);
  const [selectedSemester, setSelectedSemester] = useState<'1' | '2' | '3'>('3');

  const [newStudent, setNewStudent] = useState<NewStudent>({
    firstName: '',
    lastName: '',
    sex: 'M',
    dateOfBirth: '',
    registrationNo: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    classId: '',
    email: ''
  });

  const [editStudent, setEditStudent] = useState<EditStudent>({
    id: '',
    firstName: '',
    lastName: '',
    sex: 'M',
    dateOfBirth: '',
    registrationNo: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    classId: '',
    email: ''
  });

  const [absenceData, setAbsenceData] = useState<AbsenceData>({
    studentId: '',
    date: new Date().toISOString().split('T')[0],
    type: 'ABSENCE',
    isJustified: false,
    reason: ''
  });

  const [gradeData, setGradeData] = useState<GradeData>({
    studentId: '',
    subjectId: '',
    trimester: 1,
    devoir: 0,
    interrogations: []
  });

  const [bulletinData, setBulletinData] = useState<any>(null);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [editGradeValue, setEditGradeValue] = useState<number>(0);

  const [attendanceData, setAttendanceData] = useState<AttendanceData>({
    studentId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'PRESENT',
    isJustified: false,
    reason: ''
  });

  const [punishmentData, setPunishmentData] = useState<PunishmentData>({
    studentId: '',
    hours: 2,
    reason: '',
    trimester: 3,
    givenBy: '',
    selectedReason: '',
    customReason: ''
  });

  // État pour la notation globale de conduite
  const [globalConduiteData, setGlobalConduiteData] = useState({
    trimester: 3,
    conduiteNote: 10,
    classId: ''
  });
  const [applyingConduite, setApplyingConduite] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const openModal = (modalName: string): void => {
    setActiveModal(modalName);
  };

  const closeModal = (): void => {
    setActiveModal(null);
    setSelectedStudent(null);
    setSuccessMessage(null);
    setError(null);
    setEditingGrade(null);
  };

  const showSuccess = (message: string): void => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      const [studentsRes, classesRes, subjectsRes] = await Promise.all([
        fetch(`${API_URL}/students`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/classes`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/subjects`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!studentsRes.ok) throw new Error('Erreur chargement élèves');
      if (!classesRes.ok) throw new Error('Erreur chargement classes');
      if (!subjectsRes.ok) throw new Error('Erreur chargement matières');

      const studentsData = await studentsRes.json();
      const classesData = await classesRes.json();
      const subjectsData = await subjectsRes.json();

      setStudents(studentsData);
      setFilteredStudents(studentsData);
      setClasses(classesData);
      setSubjects(subjectsData);

    } catch (error) {
      console.error('Erreur chargement données:', error);
      setError('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...students];

    if (searchTerm) {
      filtered = filtered.filter(student => 
        student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.registrationNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (classFilter) {
      filtered = filtered.filter(student => 
        student.class?.id === classFilter
      );
    }

    setFilteredStudents(filtered);
  }, [searchTerm, classFilter, students]);

  // ==================== CRUD ÉLÈVES ====================

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setActionLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const studentData: any = {
        firstName: newStudent.firstName,
        lastName: newStudent.lastName,
        sex: newStudent.sex,
        dateOfBirth: newStudent.dateOfBirth,
        parentName: newStudent.parentName,
        parentPhone: newStudent.parentPhone,
        parentEmail: newStudent.parentEmail,
        classId: newStudent.classId,
        email: newStudent.email
      };
      
      if (newStudent.registrationNo && newStudent.registrationNo.trim() !== '') {
        studentData.registrationNo = newStudent.registrationNo;
      }

      const res = await fetch(`${API_URL}/students`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(studentData)
      });
      
      if (res.ok) {
        const createdStudent = await res.json();
        showSuccess(`✅ Élève créé avec succès ! Matricule: ${createdStudent.registrationNo}`);
        closeModal();
        setNewStudent({
          firstName: '',
          lastName: '',
          sex: 'M',
          dateOfBirth: '',
          registrationNo: '',
          parentName: '',
          parentPhone: '',
          parentEmail: '',
          classId: '',
          email: ''
        });
        fetchData();
      } else {
        const error = await res.text();
        setError(`❌ Erreur: ${error}`);
      }
    } catch (error) {
      setError('❌ Erreur de connexion');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setActionLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const res = await fetch(`${API_URL}/students/${editStudent.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editStudent)
      });

      const responseData = await res.json();
      
      if (res.ok) {
        showSuccess('✅ Élève modifié avec succès !');
        closeModal();
        fetchData();
      } else {
        setError(`❌ Erreur: ${responseData.message || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('Erreur modification:', error);
      setError('❌ Erreur de connexion');
    } finally {
      setActionLoading(false);
    }
  };

  const viewStudentDetails = async (student: Student): Promise<void> => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/students/${student.id}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const details = await res.json();
        setSelectedStudent(details);
        openModal('details');
      } else {
        setError('❌ Erreur chargement détails');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('❌ Erreur de connexion');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteStudent = async (studentId: string, studentName: string): Promise<void> => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'élève ${studentName} ?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/students/${studentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        showSuccess('✅ Élève supprimé');
        fetchData();
      } else {
        const error = await res.text();
        setError(`❌ Erreur: ${error}`);
      }
    } catch (error) {
      setError('❌ Erreur réseau');
    }
  };

  // ==================== GESTION DES NOTES ====================

  const startEditingGrade = (grade: Grade) => {
    setEditingGrade(grade);
    setEditGradeValue(grade.value);
  };

  const saveEditedGrade = async (): Promise<void> => {
    if (!editingGrade || !selectedStudent) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      
      const res = await fetch(`${API_URL}/grades/${editingGrade.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          value: editGradeValue,
          trimester: editingGrade.trimester
        })
      });

      if (res.ok) {
        showSuccess('✅ Note modifiée avec succès !');
        setEditingGrade(null);
        viewStudentDetails(selectedStudent);
      } else {
        const error = await res.text();
        setError(`❌ Erreur: ${error}`);
      }
    } catch (error) {
      setError('❌ Erreur de connexion');
    } finally {
      setActionLoading(false);
    }
  };

  // ==================== GESTION DES ABSENCES ====================

  const addAbsence = async (): Promise<void> => {
    if (!absenceData.studentId || !absenceData.date) return;
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/absences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(absenceData)
      });

      if (res.ok) {
        showSuccess('✅ Absence enregistrée avec succès !');
        closeModal();
        if (selectedStudent) {
          viewStudentDetails(selectedStudent);
        }
        fetchData();
      } else {
        const error = await res.text();
        setError(`❌ Erreur: ${error}`);
      }
    } catch (error) {
      setError('❌ Erreur réseau');
    } finally {
      setActionLoading(false);
    }
  };

  const addAttendance = async (): Promise<void> => {
    if (!attendanceData.studentId || !attendanceData.date) return;
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (attendanceData.status === 'ABSENT') {
        const res = await fetch(`${API_URL}/absences`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            studentId: attendanceData.studentId,
            date: attendanceData.date,
            type: 'ABSENCE',
            isJustified: attendanceData.isJustified,
            reason: attendanceData.reason
          })
        });

        if (res.ok) {
          showSuccess('✅ Participation enregistrée avec succès !');
          closeModal();
          if (selectedStudent) {
            viewStudentDetails(selectedStudent);
          }
          fetchData();
        } else {
          const error = await res.text();
          setError(`❌ Erreur: ${error}`);
        }
      } else {
        showSuccess('✅ Présence enregistrée !');
        closeModal();
      }
    } catch (error) {
      setError('❌ Erreur réseau');
    } finally {
      setActionLoading(false);
    }
  };

  // ==================== GESTION DES NOTES (SAUVEGARDE) ====================

  const saveGrades = async (): Promise<void> => {
    if (!gradeData.subjectId || !gradeData.trimester || gradeData.devoir === undefined) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      await fetch(`${API_URL}/controls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: selectedStudent?.id,
          subjectId: gradeData.subjectId,
          trimester: gradeData.trimester,
          type: 'DEVOIR',
          value: gradeData.devoir,
          coefficient: 2
        })
      });

      if (gradeData.interrogations && gradeData.interrogations.length > 0) {
        for (const note of gradeData.interrogations) {
          if (note > 0) {
            await fetch(`${API_URL}/controls`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                studentId: selectedStudent?.id,
                subjectId: gradeData.subjectId,
                trimester: gradeData.trimester,
                type: 'INTERROGATION',
                value: note,
                coefficient: 1
              })
            });
          }
        }
      }

      const average = calculateWeightedAverage(gradeData.devoir, gradeData.interrogations);
      
      const gradeRes = await fetch(`${API_URL}/grades/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: selectedStudent?.id,
          subjectId: gradeData.subjectId,
          trimester: gradeData.trimester,
          value: average
        })
      });

      if (gradeRes.ok) {
        showSuccess('✅ Notes enregistrées avec succès !');
        closeModal();
        
        if (selectedStudent) {
          viewStudentDetails(selectedStudent);
        }
        fetchData();
      } else {
        const error = await gradeRes.text();
        setError(`❌ Erreur: ${error}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('❌ Erreur lors de l\'enregistrement');
    } finally {
      setActionLoading(false);
    }
  };

  // ==================== GESTION DES PUNITIONS ====================

  const addPunishment = async (): Promise<void> => {
    if (!punishmentData.studentId || !punishmentData.hours || punishmentData.hours <= 0) {
      setError('Veuillez entrer un nombre d\'heures valide');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/students/${punishmentData.studentId}/punishments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          hours: punishmentData.hours,
          reason: punishmentData.reason,
          trimester: punishmentData.trimester,
          givenBy: punishmentData.givenBy || 'Professeur'
        })
      });

      if (res.ok) {
        showSuccess(`✅ Punition ajoutée !`);
        closeModal();
        fetchData();
      } else {
        const error = await res.text();
        setError(`❌ Erreur: ${error}`);
      }
    } catch (error) {
      setError('❌ Erreur réseau');
    } finally {
      setActionLoading(false);
    }
  };

  // ==================== GESTION CONDUITE (MANUELLE) ====================

  const applyConduiteToAll = async (): Promise<void> => {
    const message = globalConduiteData.classId
      ? `Appliquer la note ${globalConduiteData.conduiteNote}/20 à tous les élèves de la classe sélectionnée ?`
      : `Appliquer la note ${globalConduiteData.conduiteNote}/20 à TOUS les élèves ?`;
    if (!confirm(message)) return;

    setApplyingConduite(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/students/conduite/apply-to-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          trimester: globalConduiteData.trimester,
          conduiteNote: globalConduiteData.conduiteNote,
          classId: globalConduiteData.classId || undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        showSuccess(`✅ Note de conduite appliquée à ${data.count} élèves`);
        closeModal();
        fetchData();
      } else {
        const error = await res.text();
        setError(`❌ Erreur: ${error}`);
      }
    } catch (error) {
      setError('❌ Erreur réseau');
    } finally {
      setApplyingConduite(false);
    }
  };

  // ==================== GESTION DU BULLETIN ====================

  const openSemesterSelector = (student: Student): void => {
    setSelectedStudent(student);
    setSelectedSemester('3');
    openModal('semesterSelector');
  };

  const generateBulletin = async (): Promise<void> => {
    if (!selectedStudent) return;
    
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      
      const res = await fetch(`${API_URL}/students/${selectedStudent.id}/bulletin/${selectedSemester}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const fallbackRes = await fetch(`${API_URL}/students/${selectedStudent.id}/report?period=TRIMESTRE_${selectedSemester}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!fallbackRes.ok) throw new Error('Erreur de chargement du bulletin');
        const data = await fallbackRes.json();
        setBulletinData(data);
      } else {
        const data = await res.json();
        setBulletinData(data);
      }
      
      openModal('bulletin');
    } catch (error) {
      console.error('Erreur:', error);
      setError('❌ Erreur de chargement du bulletin');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // ==================== PRÉPARATION DES MODALS ====================

  const openAddModal = (): void => {
    setNewStudent({
      firstName: '',
      lastName: '',
      sex: 'M',
      dateOfBirth: '',
      registrationNo: '',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      classId: '',
      email: ''
    });
    openModal('add');
  };

  const prepareEdit = (student: Student): void => {
    setEditStudent({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      sex: student.sex || 'M',
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '',
      registrationNo: student.registrationNo,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      parentEmail: student.parentEmail || '',
      classId: student.class?.id || '',
      email: student.user?.email || ''
    });
    openModal('edit');
  };

  const prepareAbsence = (student: Student): void => {
    setAbsenceData({
      studentId: student.id,
      date: new Date().toISOString().split('T')[0],
      type: 'ABSENCE',
      isJustified: false,
      reason: ''
    });
    setSelectedStudent(student);
    openModal('absence');
  };

  const prepareGrade = (student: Student): void => {
    setGradeData({
      studentId: student.id,
      subjectId: '',
      trimester: 1,
      devoir: 0,
      interrogations: []
    });
    setSelectedStudent(student);
    openModal('grade');
  };

  const prepareAttendance = (student: Student): void => {
    setAttendanceData({
      studentId: student.id,
      date: new Date().toISOString().split('T')[0],
      status: 'PRESENT',
      isJustified: false,
      reason: ''
    });
    setSelectedStudent(student);
    openModal('attendance');
  };

  const preparePunishment = (student: Student): void => {
    setPunishmentData({
      studentId: student.id,
      hours: 2,
      reason: '',
      trimester: parseInt(selectedSemester),
      givenBy: '',
      selectedReason: '',
      customReason: ''
    });
    setSelectedStudent(student);
    openModal('punishment');
  };

  const uniqueClasses = classes.map(c => ({ id: c.id, name: c.name }));

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestion des Élèves</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            <Icon icon="fa-user-graduate" className="mr-2 text-gray-600" />
            {filteredStudents.length} élève{filteredStudents.length > 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={() => openModal('conduiteGlobal')}
            className="flex-1 sm:flex-none bg-orange-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-orange-700 transition flex items-center justify-center gap-2 shadow-md text-sm sm:text-base"
            title="Noter la conduite (manuellement)"
          >
            <Icon icon="fa-star" />
            <span className="hidden sm:inline">Noter Conduite</span>
            <span className="sm:hidden">Conduite</span>
          </button>

          <button 
            onClick={openAddModal}
            className="flex-1 sm:flex-none bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-md text-sm sm:text-base"
          >
            <Icon icon="fa-plus" />
            <span className="hidden sm:inline">Nouvel Élève</span>
            <span className="sm:hidden">Ajouter</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-3 text-sm sm:text-base">
          <Icon icon="fa-check-circle" className="text-green-700" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-3 text-sm sm:text-base">
          <Icon icon="fa-exclamation-triangle" className="text-red-700" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-sm underline text-red-700">
            Fermer
          </button>
        </div>
      )}

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              <Icon icon="fa-user-graduate" className="text-base sm:text-xl" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Total Élèves</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{students.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
              <Icon icon="fa-school" className="text-base sm:text-xl" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Classes</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{classes.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
              <Icon icon="fa-chart-line" className="text-base sm:text-xl" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Moyenne générale</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {students.length > 0 
                  ? (students.reduce((acc, s) => acc + (s.averages?.annuelle || 0), 0) / students.length).toFixed(2)
                  : '0.00'}/20
              </p>
            </div>
          </div>
        </div>

        {/* Espace réservé pour une 4ème carte si besoin */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
              <Icon icon="fa-gavel" className="text-base sm:text-xl" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Punitions (T{selectedSemester})</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">-</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION RECHERCHE ET FILTRES */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher un élève..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm sm:text-base"
              />
              <Icon icon="fa-search" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm sm:text-base"
            >
              <option value="">Toutes les classes</option>
              {uniqueClasses.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>

            {(searchTerm || classFilter) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setClassFilter('');
                }}
                className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2 text-sm"
              >
                <Icon icon="fa-times" />
                <span className="hidden sm:inline">Réinitialiser</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TABLEAU DES ÉLÈVES */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Icon icon="fa-spinner" className="fa-spin text-3xl sm:text-4xl text-blue-500 mb-4" />
            <p className="text-gray-600">Chargement des élèves...</p>
          </div>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-white rounded-xl border border-gray-200">
          <Icon icon="fa-user-graduate" className="text-5xl sm:text-6xl text-gray-300 mb-4" />
          <h3 className="text-lg sm:text-xl font-medium text-gray-700 mb-2">
            {students.length === 0 ? 'Aucun élève' : 'Aucun résultat'}
          </h3>
          <p className="text-sm sm:text-base text-gray-500 mb-6">
            {students.length === 0 
              ? 'Commencez par inscrire votre premier élève'
              : 'Aucun élève ne correspond à votre recherche'}
          </p>
          {students.length === 0 ? (
            <button
              onClick={openAddModal}
              className="bg-blue-600 text-white px-5 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2 text-sm sm:text-base"
            >
              <Icon icon="fa-plus" />
              Ajouter un élève
            </button>
          ) : (
            <button
              onClick={() => {
                setSearchTerm('');
                setClassFilter('');
              }}
              className="bg-blue-600 text-white px-5 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2 text-sm sm:text-base"
            >
              <Icon icon="fa-times" />
              Effacer les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div 
            className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition"
            onClick={() => setShowTable(!showTable)}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <Icon icon={showTable ? "fa-chevron-down" : "fa-chevron-right"} className="text-gray-500 text-sm" />
              <h2 className="text-base sm:text-lg font-semibold text-gray-800">Liste des élèves</h2>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 sm:py-1 rounded-full">
                {filteredStudents.length}
              </span>
            </div>
            <button className="text-gray-500 hover:text-gray-700">
              <Icon icon={showTable ? "fa-compress" : "fa-expand"} />
            </button>
          </div>

          {showTable && (
            <div className="overflow-x-auto">
              <table className="min-w-[800px] sm:min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Élève</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Sexe</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matricule</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Classe</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Parent</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">Contact</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition">
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold">
                            {student.firstName[0]}{student.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm sm:text-base">{student.firstName} {student.lastName}</p>
                            <p className="text-xs text-gray-500">Né(e) le: {new Date(student.dateOfBirth).toLocaleDateString('fr-FR')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                        {student.sex === 'M' ? (
                          <div className="flex items-center gap-2">
                            <Icon icon="fa-mars" className="text-blue-500" />
                            <span className="text-sm text-gray-900">M</span>
                          </div>
                        ) : student.sex === 'F' ? (
                          <div className="flex items-center gap-2">
                            <Icon icon="fa-venus" className="text-pink-500" />
                            <span className="text-sm text-gray-900">F</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <span className="text-xs sm:text-sm font-mono text-gray-600">{student.registrationNo}</span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                        {student.class ? (
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                            {student.class.name}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Non assigné</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 hidden lg:table-cell">
                        <p className="text-sm text-gray-900">{student.parentName}</p>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 hidden xl:table-cell">
                        <p className="text-sm text-gray-600">{student.parentPhone}</p>
                        {student.parentEmail && (
                          <p className="text-xs text-gray-500 truncate max-w-[150px]">{student.parentEmail}</p>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                          <button
                            onClick={() => activeModal === null && viewStudentDetails(student)}
                            disabled={activeModal !== null}
                            className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded transition disabled:opacity-50"
                            title="Voir détails"
                          >
                            <Icon icon="fa-eye" />
                          </button>
                          <button
                            onClick={() => activeModal === null && openSemesterSelector(student)}
                            disabled={activeModal !== null}
                            className="px-2 py-1.5 sm:px-3 sm:py-2 text-purple-600 hover:bg-purple-50 rounded transition flex items-center gap-1 text-xs sm:text-sm"
                            title="Générer le bulletin"
                          >
                            <Icon icon="fa-file-alt" />
                            <span className="hidden sm:inline">Bulletin</span>
                          </button>
                          <button
                            onClick={() => activeModal === null && preparePunishment(student)}
                            disabled={activeModal !== null}
                            className="px-2 py-1.5 sm:px-3 sm:py-2 text-red-600 hover:bg-red-50 rounded transition flex items-center gap-1 text-xs sm:text-sm"
                            title="Ajouter une punition"
                          >
                            <Icon icon="fa-gavel" />
                            <span className="hidden sm:inline">Punition</span>
                          </button>
                          <button
                            onClick={() => activeModal === null && prepareAbsence(student)}
                            disabled={activeModal !== null}
                            className="p-1.5 sm:p-2 text-orange-600 hover:bg-orange-50 rounded transition"
                            title="Ajouter une absence"
                          >
                            <Icon icon="fa-clock" />
                          </button>
                          <button
                            onClick={() => activeModal === null && prepareAttendance(student)}
                            disabled={activeModal !== null}
                            className="p-1.5 sm:p-2 text-teal-600 hover:bg-teal-50 rounded transition"
                            title="Participation"
                          >
                            <Icon icon="fa-calendar-check" />
                          </button>
                          <button
                            onClick={() => activeModal === null && prepareGrade(student)}
                            disabled={activeModal !== null}
                            className="p-1.5 sm:p-2 text-green-600 hover:bg-green-50 rounded transition"
                            title="Ajouter des notes"
                          >
                            <Icon icon="fa-star" />
                          </button>
                          <button
                            onClick={() => activeModal === null && prepareEdit(student)}
                            disabled={activeModal !== null}
                            className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                            title="Modifier"
                          >
                            <Icon icon="fa-edit" />
                          </button>
                          <button
                            onClick={() => activeModal === null && deleteStudent(student.id, `${student.firstName} ${student.lastName}`)}
                            disabled={activeModal !== null}
                            className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded transition"
                            title="Supprimer"
                          >
                            <Icon icon="fa-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================== MODALS ==================== */}

      {/* MODAL NOTATION CONDUITE (MANUELLE) */}
      {activeModal === 'conduiteGlobal' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                <Icon icon="fa-star" className="text-orange-500 mr-2" />
                Notation manuelle de la conduite
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <Icon icon="fa-times" className="text-xl" />
              </button>
            </div>

            <div className="space-y-4 sm:space-y-5">
              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
                <Icon icon="fa-info-circle" className="mr-1" />
                La note de conduite est saisie manuellement par l'administration.
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trimestre</label>
                <select
                  value={globalConduiteData.trimester}
                  onChange={(e) => setGlobalConduiteData({...globalConduiteData, trimester: parseInt(e.target.value)})}
                  className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg"
                >
                  <option value="1">Trimestre 1</option>
                  <option value="2">Trimestre 2</option>
                  <option value="3">Trimestre 3</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Note de conduite (0 à 20)</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  value={globalConduiteData.conduiteNote}
                  onChange={(e) => setGlobalConduiteData({...globalConduiteData, conduiteNote: parseFloat(e.target.value) || 0})}
                  className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Appliquer à</label>
                <select
                  value={globalConduiteData.classId}
                  onChange={(e) => setGlobalConduiteData({...globalConduiteData, classId: e.target.value})}
                  className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg"
                >
                  <option value="">Tous les élèves</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button onClick={closeModal} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  Annuler
                </button>
                <button
                  onClick={applyConduiteToAll}
                  disabled={applyingConduite}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {applyingConduite ? (
                    <><Icon icon="fa-spinner" className="fa-spin" /> Application...</>
                  ) : (
                    <><Icon icon="fa-save" /> Appliquer</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PUNITION AVEC SUGGESTIONS */}
      {activeModal === 'punishment' && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                <Icon icon="fa-gavel" className="text-red-500 mr-2" />
                Ajouter une punition
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
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
                  <option value="1">Trimestre 1</option>
                  <option value="2">Trimestre 2</option>
                  <option value="3">Trimestre 3</option>
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
                  value={punishmentData.hours || ''}
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
                  className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg text-gray-900"
                  value={punishmentData.givenBy}
                  onChange={(e) => setPunishmentData({...punishmentData, givenBy: e.target.value})}
                  placeholder="Nom du professeur..."
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={closeModal} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  Annuler
                </button>
                <button onClick={addPunishment} disabled={actionLoading} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
                  {actionLoading ? (
                    <><Icon icon="fa-spinner" className="fa-spin" /> Enregistrement...</>
                  ) : (
                    <><Icon icon="fa-gavel" /> Enregistrer</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AJOUT ÉLÈVE */}
      {activeModal === 'add' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                <Icon icon="fa-user-plus" className="text-blue-500 mr-2" />
                Nouvel Élève
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <Icon icon="fa-times" className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                  <input 
                    type="text"
                    required
                    className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg text-gray-900"
                    value={newStudent.firstName}
                    onChange={e => setNewStudent({...newStudent, firstName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input 
                    type="text"
                    required
                    className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg text-gray-900"
                    value={newStudent.lastName}
                    onChange={e => setNewStudent({...newStudent, lastName: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sexe *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 p-2 sm:p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 flex-1">
                    <input
                      type="radio"
                      name="sex"
                      value="M"
                      checked={newStudent.sex === 'M'}
                      onChange={e => setNewStudent({...newStudent, sex: e.target.value as 'M' | 'F' | 'AUTRE'})}
                      className="w-4 h-4 text-blue-600"
                      required
                    />
                    <span className="text-gray-900">Masculin</span>
                    <Icon icon="fa-mars" className="text-blue-500 ml-auto" />
                  </label>
                  <label className="flex items-center gap-2 p-2 sm:p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 flex-1">
                    <input
                      type="radio"
                      name="sex"
                      value="F"
                      checked={newStudent.sex === 'F'}
                      onChange={e => setNewStudent({...newStudent, sex: e.target.value as 'M' | 'F' | 'AUTRE'})}
                      className="w-4 h-4 text-pink-600"
                      required
                    />
                    <span className="text-gray-900">Féminin</span>
                    <Icon icon="fa-venus" className="text-pink-500 ml-auto" />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance *</label>
                  <input 
                    type="date"
                    required
                    className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg text-gray-900"
                    value={newStudent.dateOfBirth}
                    onChange={e => setNewStudent({...newStudent, dateOfBirth: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Matricule (optionnel)</label>
                  <input 
                    type="text"
                    placeholder="Laissez vide"
                    className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg text-gray-900"
                    value={newStudent.registrationNo}
                    onChange={e => setNewStudent({...newStudent, registrationNo: e.target.value})}
                  />
                  <p className="text-xs text-gray-500 mt-1">Génération auto si vide</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email de l'élève (optionnel)</label>
                <input 
                  type="email"
                  placeholder="eleve@email.com"
                  className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg text-gray-900"
                  value={newStudent.email}
                  onChange={e => setNewStudent({...newStudent, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Classe</label>
                <select
                  className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg text-gray-900"
                  value={newStudent.classId}
                  onChange={e => setNewStudent({...newStudent, classId: e.target.value})}
                >
                  <option value="">Sélectionner une classe</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.level})
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Informations parent / tuteur</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom du parent *</label>
                    <input 
                      type="text"
                      required
                      className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg text-gray-900"
                      value={newStudent.parentName}
                      onChange={e => setNewStudent({...newStudent, parentName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                    <input 
                      type="tel"
                      required
                      placeholder="+235 XX XX XX XX"
                      className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg text-gray-900"
                      value={newStudent.parentPhone}
                      onChange={e => setNewStudent({...newStudent, parentPhone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email parent</label>
                  <input 
                    type="email"
                    placeholder="parent@email.com"
                    className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg text-gray-900"
                    value={newStudent.parentEmail}
                    onChange={e => setNewStudent({...newStudent, parentEmail: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  Annuler
                </button>
                <button type="submit" disabled={actionLoading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                  {actionLoading ? (
                    <><Icon icon="fa-spinner" className="fa-spin" /> Création...</>
                  ) : (
                    <><Icon icon="fa-save" /> Créer</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MODIFICATION ÉLÈVE */}
      {activeModal === 'edit' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                <Icon icon="fa-edit" className="text-blue-500 mr-2" />
                Modifier l'élève
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <Icon icon="fa-times" className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleEdit} className="space-y-4">
              {/* Même structure que le modal add, avec valeurs pré-remplies */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                  <input 
                    type="text"
                    required
                    className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg text-gray-900"
                    value={editStudent.firstName}
                    onChange={e => setEditStudent({...editStudent, firstName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input 
                    type="text"
                    required
                    className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg text-gray-900"
                    value={editStudent.lastName}
                    onChange={e => setEditStudent({...editStudent, lastName: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sexe *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 p-2 sm:p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 flex-1">
                    <input
                      type="radio"
                      name="editSex"
                      value="M"
                      checked={editStudent.sex === 'M'}
                      onChange={e => setEditStudent({...editStudent, sex: e.target.value as 'M' | 'F' | 'AUTRE'})}
                      className="w-4 h-4 text-blue-600"
                      required
                    />
                    <span className="text-gray-900">Masculin</span>
                    <Icon icon="fa-mars" className="text-blue-500 ml-auto" />
                  </label>
                  <label className="flex items-center gap-2 p-2 sm:p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 flex-1">
                    <input
                      type="radio"
                      name="editSex"
                      value="F"
                      checked={editStudent.sex === 'F'}
                      onChange={e => setEditStudent({...editStudent, sex: e.target.value as 'M' | 'F' | 'AUTRE'})}
                      className="w-4 h-4 text-pink-600"
                      required
                    />
                    <span className="text-gray-900">Féminin</span>
                    <Icon icon="fa-venus" className="text-pink-500 ml-auto" />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance *</label>
                  <input 
                    type="date"
                    required
                    className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg text-gray-900"
                    value={editStudent.dateOfBirth}
                    onChange={e => setEditStudent({...editStudent, dateOfBirth: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Matricule</label>
                  <input 
                    type="text"
                    className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg text-gray-900 bg-gray-100"
                    value={editStudent.registrationNo}
                    disabled
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email de l'élève</label>
                <input 
                  type="email"
                  className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg text-gray-900 bg-gray-100"
                  value={editStudent.email}
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Classe</label>
                <select
                  className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg text-gray-900"
                  value={editStudent.classId}
                  onChange={e => setEditStudent({...editStudent, classId: e.target.value})}
                >
                  <option value="">Sélectionner une classe</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.level})
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Informations parent / tuteur</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom du parent *</label>
                    <input 
                      type="text"
                      required
                      className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg text-gray-900"
                      value={editStudent.parentName}
                      onChange={e => setEditStudent({...editStudent, parentName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                    <input 
                      type="tel"
                      required
                      className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg text-gray-900"
                      value={editStudent.parentPhone}
                      onChange={e => setEditStudent({...editStudent, parentPhone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email parent</label>
                  <input 
                    type="email"
                    className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg text-gray-900"
                    value={editStudent.parentEmail}
                    onChange={e => setEditStudent({...editStudent, parentEmail: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  Annuler
                </button>
                <button type="submit" disabled={actionLoading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                  {actionLoading ? (
                    <><Icon icon="fa-spinner" className="fa-spin" /> Modification...</>
                  ) : (
                    <><Icon icon="fa-save" /> Enregistrer</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DÉTAILS ÉLÈVE */}
      {activeModal === 'details' && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-2 border-b flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-base sm:text-xl font-bold">
                  {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
                </div>
                <div>
                  <h3 className="text-base sm:text-xl font-bold text-gray-900">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500">{selectedStudent.registrationNo}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handlePrint}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                >
                  <Icon icon="fa-print" />
                  <span className="hidden sm:inline">Imprimer</span>
                </button>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <Icon icon="fa-times" className="text-xl" />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-2 mb-1">
                    <Icon icon="fa-calendar" />
                    Date de naissance
                  </p>
                  <p className="text-sm sm:text-lg font-semibold text-gray-900">
                    {new Date(selectedStudent.dateOfBirth).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-2 mb-1">
                    <Icon icon={selectedStudent.sex === 'M' ? 'fa-mars' : 'fa-venus'} 
                          className={selectedStudent.sex === 'M' ? 'text-blue-500' : 'text-pink-500'} />
                    Sexe
                  </p>
                  <p className="text-sm sm:text-lg font-semibold text-gray-900">
                    {selectedStudent.sex === 'M' ? 'Masculin' : 'Féminin'}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-2 mb-1">
                    <Icon icon="fa-school" />
                    Classe
                  </p>
                  <p className="text-sm sm:text-lg font-semibold text-gray-900">
                    {selectedStudent.class?.name || 'Non assigné'}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-2 mb-2">
                  <Icon icon="fa-users" />
                  Parent / Tuteur
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Nom</p>
                    <p className="font-medium text-gray-900 text-sm sm:text-base">{selectedStudent.parentName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Téléphone</p>
                    <p className="font-medium text-gray-900 text-sm sm:text-base">{selectedStudent.parentPhone}</p>
                  </div>
                  {selectedStudent.parentEmail && (
                    <div className="col-span-1 sm:col-span-2">
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-medium text-gray-900 text-sm sm:text-base break-all">{selectedStudent.parentEmail}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION NOTES */}
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                  <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                    <Icon icon="fa-star" />
                    Notes ({selectedStudent.grades?.length || 0})
                  </h4>
                  <button
                    onClick={() => {
                      closeModal();
                      prepareGrade(selectedStudent);
                    }}
                    className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm hover:bg-green-100 transition flex items-center gap-2"
                  >
                    <Icon icon="fa-plus" />
                    Ajouter
                  </button>
                </div>
                
                {selectedStudent.grades && selectedStudent.grades.length > 0 ? (
                  <div className="border rounded-lg divide-y">
                    {selectedStudent.grades.slice(0, 10).map((grade) => (
                      <div key={grade.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 gap-2">
                        <div className="flex-1 w-full">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900">
                              {grade.subject?.name || 'Matière inconnue'}
                            </p>
                            {editingGrade?.id === grade.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  max="20"
                                  step="0.5"
                                  value={editGradeValue}
                                  onChange={(e) => setEditGradeValue(parseFloat(e.target.value))}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                                  autoFocus
                                />
                                <button onClick={saveEditedGrade} className="text-green-600 hover:text-green-800">
                                  <Icon icon="fa-check" />
                                </button>
                                <button onClick={() => setEditingGrade(null)} className="text-red-600 hover:text-red-800">
                                  <Icon icon="fa-times" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-base sm:text-lg font-bold text-blue-600">{grade.value}/20</span>
                                <button onClick={() => startEditingGrade(grade)} className="text-gray-400 hover:text-blue-600">
                                  <Icon icon="fa-edit" />
                                </button>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Trimestre {grade.trimester} • Coef {grade.coefficient || 1}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Icon icon="fa-star" className="text-3xl text-gray-300 mb-2" />
                    <p className="text-gray-500">Aucune note</p>
                  </div>
                )}
              </div>

              {/* SECTION PARTICIPATION */}
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                  <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                    <Icon icon="fa-calendar-check" />
                    Participation aux cours
                  </h4>
                  <button
                    onClick={() => prepareAttendance(selectedStudent)}
                    className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg text-sm hover:bg-teal-100 transition flex items-center gap-2"
                  >
                    <Icon icon="fa-plus" />
                    Ajouter
                  </button>
                </div>
                
                {selectedStudent.absences && selectedStudent.absences.length > 0 ? (
                  <div className="border rounded-lg divide-y">
                    {selectedStudent.absences.slice(0, 5).map((absence) => (
                      <div key={absence.id} className="flex justify-between items-center p-3">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {new Date(absence.date).toLocaleDateString('fr-FR')}
                          </p>
                          <p className="text-xs text-gray-500">{absence.type}</p>
                        </div>
                        <div>
                          {absence.isJustified ? (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Justifiée</span>
                          ) : (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Non justifiée</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Icon icon="fa-calendar-check" className="text-3xl text-gray-300 mb-2" />
                    <p className="text-gray-500">Aucune absence enregistrée</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button 
                onClick={() => {
                  closeModal();
                  prepareEdit(selectedStudent);
                }}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base"
              >
                <Icon icon="fa-edit" className="mr-2" />
                Modifier
              </button>
              <button onClick={closeModal} className="px-5 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm sm:text-base">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AJOUT ABSENCE */}
      {activeModal === 'absence' && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-4 sm:p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                <Icon icon="fa-clock" className="text-orange-500 mr-2" />
                Ajouter une absence
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <Icon icon="fa-times" className="text-xl" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Élève: <span className="font-semibold">{selectedStudent.firstName} {selectedStudent.lastName}</span>
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input 
                  type="date"
                  className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg text-gray-900"
                  value={absenceData.date}
                  onChange={(e) => setAbsenceData({...absenceData, date: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select 
                  className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg text-gray-900"
                  value={absenceData.type}
                  onChange={(e) => setAbsenceData({...absenceData, type: e.target.value})}
                >
                  <option value="ABSENCE">Absence</option>
                  <option value="RETARD">Retard</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={absenceData.isJustified}
                    onChange={(e) => setAbsenceData({...absenceData, isJustified: e.target.checked})}
                    className="w-4 h-4 text-orange-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Absence justifiée</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Motif (optionnel)</label>
                <textarea 
                  className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg text-gray-900"
                  rows={3}
                  value={absenceData.reason}
                  onChange={(e) => setAbsenceData({...absenceData, reason: e.target.value})}
                  placeholder="Raison de l'absence..."
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={closeModal} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  Annuler
                </button>
                <button onClick={addAbsence} disabled={actionLoading} className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2">
                  {actionLoading ? <><Icon icon="fa-spinner" className="fa-spin" /> Enregistrement...</> : <><Icon icon="fa-check" /> Enregistrer</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARTICIPATION */}
      {activeModal === 'attendance' && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-4 sm:p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                <Icon icon="fa-calendar-check" className="text-teal-500 mr-2" />
                Participation aux cours
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <Icon icon="fa-times" className="text-xl" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Élève: <span className="font-semibold">{selectedStudent.firstName} {selectedStudent.lastName}</span>
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input 
                  type="date"
                  className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg text-gray-900"
                  value={attendanceData.date}
                  onChange={(e) => setAttendanceData({...attendanceData, date: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAttendanceData({...attendanceData, status: 'PRESENT'})}
                    className={`p-2 sm:p-3 rounded-lg border-2 transition text-center ${
                      attendanceData.status === 'PRESENT'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <Icon icon="fa-check-circle" className="mb-1" />
                    <p className="text-xs sm:text-sm font-medium">Présent</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceData({...attendanceData, status: 'ABSENT'})}
                    className={`p-2 sm:p-3 rounded-lg border-2 transition text-center ${
                      attendanceData.status === 'ABSENT'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 hover:border-red-300'
                    }`}
                  >
                    <Icon icon="fa-times-circle" className="mb-1" />
                    <p className="text-xs sm:text-sm font-medium">Absent</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceData({...attendanceData, status: 'LATE'})}
                    className={`p-2 sm:p-3 rounded-lg border-2 transition text-center ${
                      attendanceData.status === 'LATE'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <Icon icon="fa-clock" className="mb-1" />
                    <p className="text-xs sm:text-sm font-medium">Retard</p>
                  </button>
                </div>
              </div>

              {attendanceData.status === 'ABSENT' && (
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={attendanceData.isJustified}
                      onChange={(e) => setAttendanceData({...attendanceData, isJustified: e.target.checked})}
                      className="w-4 h-4 text-teal-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Absence justifiée</span>
                  </label>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Motif (optionnel)</label>
                <textarea 
                  className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg text-gray-900"
                  rows={3}
                  value={attendanceData.reason}
                  onChange={(e) => setAttendanceData({...attendanceData, reason: e.target.value})}
                  placeholder="Raison..."
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={closeModal} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  Annuler
                </button>
                <button onClick={addAttendance} disabled={actionLoading} className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2">
                  {actionLoading ? <><Icon icon="fa-spinner" className="fa-spin" /> Enregistrement...</> : <><Icon icon="fa-check" /> Enregistrer</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AJOUT NOTE */}
      {activeModal === 'grade' && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl p-4 sm:p-8 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg sm:text-2xl font-bold text-gray-900">
                <Icon icon="fa-star" className="text-green-500 mr-2" />
                Saisir les notes - {selectedStudent.firstName} {selectedStudent.lastName}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <Icon icon="fa-times" className="text-2xl" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Matière *</label>
                  <select 
                    className="w-full border border-gray-300 p-3 sm:p-4 rounded-lg text-gray-900"
                    value={gradeData.subjectId}
                    onChange={(e) => setGradeData({...gradeData, subjectId: e.target.value})}
                  >
                    <option value="">Sélectionner une matière</option>
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trimestre *</label>
                  <select 
                    className="w-full border border-gray-300 p-3 sm:p-4 rounded-lg text-gray-900"
                    value={gradeData.trimester}
                    onChange={(e) => setGradeData({...gradeData, trimester: parseInt(e.target.value)})}
                  >
                    <option value="1">Trimestre 1</option>
                    <option value="2">Trimestre 2</option>
                    <option value="3">Trimestre 3</option>
                  </select>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold text-gray-700 mb-4">Contrôles et Interrogations</h4>
                
                <div className="mb-4 p-3 bg-white rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note du Devoir Surveillé (/20) * <span className="ml-2 text-xs text-gray-500">(Coefficient 2)</span>
                  </label>
                  <input 
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    className="w-full border border-gray-300 p-2 sm:p-3 rounded-lg text-gray-900"
                    value={gradeData.devoir || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                      setGradeData({...gradeData, devoir: value});
                    }}
                    placeholder="0.0"
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Interrogations (optionnel) <span className="text-xs text-gray-500">(Coefficient 1)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setGradeData({
                        ...gradeData,
                        interrogations: [...(gradeData.interrogations || []), 0]
                      })}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Ajouter
                    </button>
                  </div>
                  
                  {gradeData.interrogations?.map((note, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input 
                        type="number"
                        min="0"
                        max="20"
                        step="0.5"
                        className="flex-1 border border-gray-300 p-2 sm:p-3 rounded-lg text-gray-900"
                        value={note || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          const newInterros = [...gradeData.interrogations];
                          newInterros[index] = value;
                          setGradeData({...gradeData, interrogations: newInterros});
                        }}
                        placeholder={`Interro ${index + 1}`}
                      />
                      <button
                        onClick={() => {
                          const newInterros = gradeData.interrogations.filter((_, i) => i !== index);
                          setGradeData({...gradeData, interrogations: newInterros});
                        }}
                        className="px-3 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Icon icon="fa-trash" />
                      </button>
                    </div>
                  ))}
                </div>

                {gradeData.subjectId && gradeData.trimester && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Moyenne pondérée calculée</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-700">
                      {calculateWeightedAverage(gradeData.devoir, gradeData.interrogations)} / 20
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4 mt-8 pt-4 border-t">
                <button onClick={closeModal} className="px-5 py-2 sm:px-6 sm:py-3 text-gray-700 hover:bg-gray-100 rounded-lg">
                  Annuler
                </button>
                <button 
                  onClick={saveGrades}
                  disabled={!gradeData.subjectId || !gradeData.trimester || gradeData.devoir === undefined || actionLoading}
                  className="px-6 py-2 sm:px-8 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading ? (
                    <><Icon icon="fa-spinner" className="fa-spin" /> Enregistrement...</>
                  ) : (
                    <><Icon icon="fa-save" /> Enregistrer</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SÉLECTION SEMESTRE */}
      {activeModal === 'semesterSelector' && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-4 sm:p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                <Icon icon="fa-calendar-alt" className="text-purple-500" />
                Générer le bulletin
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <Icon icon="fa-times" className="text-xl" />
              </button>
            </div>

            <div className="space-y-5">
              <p className="text-sm text-gray-600">
                Élève : <span className="font-semibold">{selectedStudent.firstName} {selectedStudent.lastName}</span>
              </p>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Trimestre</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['1', '2', '3'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setSelectedSemester(t)}
                      className={`p-3 sm:p-4 rounded-lg border-2 transition text-center ${
                        selectedSemester === t
                          ? 'border-purple-600 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <span className="text-xl sm:text-2xl font-bold block">{t}</span>
                      <span className="text-xs sm:text-sm font-medium">Trimestre {t}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={closeModal} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  Annuler
                </button>
                <button
                  onClick={generateBulletin}
                  disabled={actionLoading}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading ? (
                    <><Icon icon="fa-spinner" className="fa-spin" /> Génération...</>
                  ) : (
                    <><Icon icon="fa-file-alt" /> Générer</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BULLETIN */}
      {activeModal === 'bulletin' && selectedStudent && bulletinData && (
        <Bulletin
          bulletinData={bulletinData}
          onClose={closeModal}
          onPrint={handlePrint}
          onDownload={() => alert('Téléchargement PDF - À implémenter')}
        />
      )}
    </div>
  );
}