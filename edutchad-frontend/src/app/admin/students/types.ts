// app/students/types.ts
export interface Subject {
  id: string;
  name: string;
  color?: string;
  coefficient?: number;
  category?: string;
}

export interface Grade {
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
  subject: Subject;
}

export interface Absence {
  id: string;
  date: string;
  type: string;
  isJustified: boolean;
  reason?: string;
  courseId?: string;
}

export interface Punishment {
  id: string;
  hours: number;
  reason?: string;
  trimester: number;
  givenBy: string;
  date: string;
}

export interface Bulletin {
  id: string;
  period: string;
  generalAverage: number;
  status: string;
  appreciation?: string;
  generatedAt: string;
  conduiteNote?: number;
}

export interface StudentClass {
  id: string;
  name: string;
  level: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  sex: 'M' | 'F' | 'AUTRE';
  dateOfBirth: string;
  registrationNo: string;
  photo?: string | null;
  parentName: string;
  parentPhone: string;
  parentEmail: string | null;
  classId?: string | null;
  class?: StudentClass | null;
  user?: {
    deletedAt: string | number | Date;
    email: string;
    isActive: boolean;
    createdAt?: string;
  };
  grades?: Grade[];
  absences?: Absence[];
  punishments?: Punishment[];
  bulletins?: Bulletin[];
  averages?: {
    trimestre1: number;
    trimestre2: number;
    trimestre3: number;
    annuelle: number;
  };
  tuitionFee?: number | null;
  tuitionPaid?: number;
  tuitionStatus?: string;
  paymentDate?: string | null;
  paymentMethod?: string | null;
  paymentReference?: string | null;
  _count?: {
    grades: number;
    absences: number;
    bulletins: number;
  };
}

export interface Class {
  id: string;
  name: string;
  level: string;
  _count?: { students: number };
}

export interface NewStudent {
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
  photo?: string | null;
}

export interface EditStudent extends NewStudent {
  id: string;
}

export interface AbsenceData {
  studentId: string;
  date: string;
  type: string;
  isJustified: boolean;
  reason: string;
}

export interface GradeData {
  studentId: string;
  subjectId: string;
  trimester: number;
  devoir: number;
  interrogations: number[];
}

export interface PunishmentData {
  studentId: string;
  hours: number;
  reason: string;
  trimester: number;
  givenBy: string;
  selectedReason?: string;
  customReason?: string;
}