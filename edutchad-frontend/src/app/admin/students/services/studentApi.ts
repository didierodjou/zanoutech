import { AbsenceData, Class, Punishment, Student, Subject } from "../types";

// app/students/services/studentApi.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function getToken() {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('token');
  }
  return null;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const studentApi = {
  // Students
  getAll: (includeDeleted = false) =>
    request<Student[]>(`/students?includeDeleted=${includeDeleted}`),
  getOne: (id: string) => request<Student>(`/students/${id}`),
  getDetails: (id: string) => request<Student>(`/students/${id}/details`),
  create: (data: any) => request<Student>('/students', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request<Student>(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  softDelete: (id: string, deletedBy?: string) =>
    request(`/students/${id}/soft?deletedBy=${deletedBy || ''}`, { method: 'DELETE' }),
  restore: (id: string) => request(`/students/${id}/restore`, { method: 'POST' }),
  getDeleted: () => request<Student[]>('/students/deleted/list'), // ✅ nouvelle méthode

  // Payments
  getPaymentStatus: (studentId: string) =>
    request<{ tuitionFee: number | null; tuitionPaid: number; tuitionStatus: string; paymentDate?: string; paymentMethod?: string; paymentReference?: string }>(
      `/students/${studentId}/payment`
    ),
  recordPayment: (studentId: string, amount: number, method: string, reference?: string) =>
    request(`/students/${studentId}/payment`, {
      method: 'POST',
      body: JSON.stringify({ amount, method, reference }),
    }),
  setTuitionFee: (studentId: string, fee: number) =>
    request(`/students/${studentId}/tuition-fee`, { method: 'PUT', body: JSON.stringify({ fee }) }),

  // Punishments
  addPunishment: (studentId: string, data: { hours: number; reason?: string; trimester: number; givenBy?: string }) =>
    request(`/students/${studentId}/punishments`, { method: 'POST', body: JSON.stringify(data) }),
  getPunishments: (studentId: string, trimester?: number) =>
    request<Punishment[]>(`/students/${studentId}/punishments${trimester ? `?trimester=${trimester}` : ''}`),
  deletePunishment: (punishmentId: string) =>
    request(`/students/punishments/${punishmentId}`, { method: 'DELETE' }),

  // Conduite
  getConduiteNote: (studentId: string, trimester: number) =>
    request<{ note: number | null; punishmentsHours: number }>(`/students/${studentId}/conduite/${trimester}`),
  setConduiteNote: (studentId: string, trimester: number, conduiteNote: number) =>
    request(`/students/${studentId}/conduite`, {
      method: 'POST',
      body: JSON.stringify({ trimester, conduiteNote }),
    }),
  resetConduiteNote: (studentId: string, trimester: number) =>
    request(`/students/${studentId}/conduite/${trimester}`, { method: 'DELETE' }),
  setConduiteForAll: (trimester: number, conduiteNote: number, classId?: string) =>
    request<{ message: string; count: number }>(`/students/conduite/apply-to-all`, {
      method: 'POST',
      body: JSON.stringify({ trimester, conduiteNote, classId }),
    }),

  // Bulletin & Report
  getBulletin: (studentId: string, trimester?: number) =>
    request<any>(`/students/${studentId}/bulletin${trimester ? `/${trimester}` : ''}`),
  getStudentReport: (studentId: string, period: string) =>
    request<any>(`/students/${studentId}/report?period=${period}`),

  // Absences
  createAbsence: (data: AbsenceData) =>
    request('/absences', { method: 'POST', body: JSON.stringify(data) }),

  // Grades
  createControl: (controlData: any) =>
    request('/controls', { method: 'POST', body: JSON.stringify(controlData) }),
  calculateGrade: (data: any) =>
    request('/grades/calculate', { method: 'POST', body: JSON.stringify(data) }),
  updateGrade: (gradeId: string, value: number, trimester: number) =>
    request(`/grades/${gradeId}`, { method: 'PUT', body: JSON.stringify({ value, trimester }) }),

  
};
export const fetchClasses = () => request<Class[]>('/classes');
export const fetchSubjects = () => request<Subject[]>('/subjects');