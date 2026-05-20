// app/teachers/types.ts

export interface Teacher {
  distinctClassesCount: number | undefined;
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  specialty: string | null;
  photo?: string | null;

  // Champs d'audit
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  deletedAt?: string | Date | null;
  deletedBy?: string | null;
  isDeleted?: boolean;

  // Relations
  user?: {
    id?: string;
    email: string;
    isActive: boolean;
    createdAt?: string | Date | null;
  };
  mainClass?: {
    id: string;
    name: string;
    level: string;
    _count?: { students: number };
  } | null;
  subjects?: Subject[];
  courses?: Course[];

  // Compteurs Prisma _count
  _count?: {
    subjects?: number;
    courses?: number;
    salaries?: number;
  };
}

export interface Subject {
  id: string;
  name: string;
  color?: string | null;
}

export interface Course {
  id: string;
  class: {
    id: string;
    name: string;
    level: string;
  };
  subject: {
    id: string;
    name: string;
    color?: string | null;
  };
  coefficient: number;
}

export interface Class {
  id: string;
  name: string;
  level: string;
  mainTeacher?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  _count?: {
    students: number;
  };
}