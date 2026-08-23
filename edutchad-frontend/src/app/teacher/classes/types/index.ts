export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone?: string;
  specialty?: string;
  photo?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Class {
  id: string;
  name: string;
  level: string;
  schoolYearId: string;
  mainTeacherId?: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  registrationNo: string;
  classId: string;
  user: { email: string };
  averages?: {
    trimestre1: number;
    trimestre2: number;
    trimestre3: number;
  };
  _count?: { absences: number };
}

export interface Course {
  id: string;
  teacherId: string;
  classId: string;
  subjectId: string;
  coefficient: number;
  class: Class;
  subject: Subject;
}

export interface Subject {
  id: string;
  name: string;
  color?: string;
}

export interface Bulletin {
  id: string;
  studentId: string;
  period: 'TRIMESTRE_1' | 'TRIMESTRE_2' | 'TRIMESTRE_3';
  status: 'PENDING' | 'VERIFIED' | 'CONFIRMED';
  generalAverage?: number;
  appreciation?: string;
  generatedAt?: string;
}