'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/Icon';

interface ScheduleSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
  course: {
    id: string;
    subject: {
      id: string;
      name: string;
      color: string | null;
    };
    teacher: {
      id: string;
      firstName: string;
      lastName: string;
    };
    class: {
      id: string;
      name: string;
      level: string;
    };
  };
}

interface Class {
  id: string;
  name: string;
  level: string;
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string;
}

interface Subject {
  id: string;
  name: string;
  color: string | null;
}

interface Course {
  id: string;
  subject: {
    id: string;
    name: string;
    color: string | null;
  };
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
  };
  class: {
    id: string;
    name: string;
    level: string;
  };
  coefficient: number;
}

const DAYS = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi'
];

const HOURS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00'
];

export default function SchedulePage() {
  const router = useRouter();
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  
  // États pour les modals - un seul actif à la fois
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // États pour les filtres
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());

  // Formulaire pour nouveau créneau
  const [formData, setFormData] = useState({
    classId: '',
    courseId: '',
    dayOfWeek: 1,
    startTime: '08:00',
    endTime: '09:00',
    room: ''
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Fonctions pour ouvrir/fermer les modals
  const openModal = (modalName: string) => {
    setActiveModal(modalName);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  // Charger toutes les données
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      const [scheduleRes, classesRes, teachersRes, subjectsRes, coursesRes] = await Promise.all([
        fetch(`${API_URL}/schedule`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/classes`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/teachers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/subjects`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/courses`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!scheduleRes.ok) throw new Error('Erreur chargement emploi du temps');
      if (!classesRes.ok) throw new Error('Erreur chargement classes');
      if (!teachersRes.ok) throw new Error('Erreur chargement professeurs');
      if (!subjectsRes.ok) throw new Error('Erreur chargement matières');
      if (!coursesRes.ok) throw new Error('Erreur chargement cours');

      const scheduleData = await scheduleRes.json();
      const classesData = await classesRes.json();
      const teachersData = await teachersRes.json();
      const subjectsData = await subjectsRes.json();
      const coursesData = await coursesRes.json();

      console.log('Emploi du temps chargé:', scheduleData);
      setSchedule(scheduleData);
      setClasses(classesData);
      setTeachers(teachersData);
      setSubjects(subjectsData);
      setCourses(coursesData);

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

  // Filtrer l'emploi du temps par classe
  const filteredSchedule = selectedClass
    ? schedule.filter(slot => slot.course.class.id === selectedClass)
    : schedule;

  // Obtenir un créneau pour un jour et une heure donnés
  const getSlotAt = (day: number, time: string) => {
    return filteredSchedule.find(slot => 
      slot.dayOfWeek === day && slot.startTime === time
    );
  };

  // Créer un nouveau créneau
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const res = await fetch(`${API_URL}/schedule`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        if (confirm('✅ Créneau ajouté avec succès !')) {
          closeModal();
          setFormData({
            classId: '',
            courseId: '',
            dayOfWeek: 1,
            startTime: '08:00',
            endTime: '09:00',
            room: ''
          });
          fetchData();
        }
      } else {
        const error = await res.text();
        alert(`❌ Erreur: ${error}`);
      }
    } catch (error) {
      alert('❌ Erreur de connexion');
    } finally {
      setActionLoading(false);
    }
  };

  // Supprimer un créneau
  const deleteSlot = async (slotId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce créneau ?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/schedule/${slotId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        alert('✅ Créneau supprimé');
        fetchData();
      } else {
        alert('❌ Erreur');
      }
    } catch (error) {
      alert('❌ Erreur réseau');
    }
  };

  // Voir les détails d'un créneau
  const viewSlotDetails = (slot: ScheduleSlot) => {
    setSelectedSlot(slot);
    openModal('details');
  };

  // Navigation entre les semaines
  const previousWeek = () => {
    const newDate = new Date(selectedWeek);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedWeek(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(selectedWeek);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedWeek(newDate);
  };

  const currentWeek = () => {
    setSelectedWeek(new Date());
  };

  // Format de la semaine
  const weekStart = new Date(selectedWeek);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 4);

  const weekRange = `${weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} - ${weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  // Obtenir la couleur pour une matière
  const getSubjectColor = (color: string | null) => {
    return color || '#3498db';
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Emploi du Temps</h1>
          <p className="text-gray-600 mt-1">
            <Icon icon="fa-calendar-alt" className="mr-2 text-gray-600" />
            Gérez les horaires des cours
          </p>
        </div>
        
        <button 
          onClick={() => openModal('add')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-md"
        >
          <Icon icon="fa-plus" />
          Nouveau Créneau
        </button>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-3">
          <Icon icon="fa-exclamation-triangle" className="text-red-700" />
          <span>{error}</span>
          <button onClick={fetchData} className="ml-auto text-sm underline text-red-700">
            Réessayer
          </button>
        </div>
      )}

      {/* Contrôles de l'emploi du temps */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Sélecteur de classe */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Classe :</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 min-w-[200px]"
            >
              <option value="">Toutes les classes</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.level})
                </option>
              ))}
            </select>
          </div>

          {/* Navigation semaine */}
          <div className="flex items-center gap-3">
            <button
              onClick={previousWeek}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Semaine précédente"
            >
              <Icon icon="fa-chevron-left" className="text-gray-600" />
            </button>
            <span className="text-sm font-medium text-gray-700 min-w-[200px] text-center">
              {weekRange}
            </span>
            <button
              onClick={nextWeek}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Semaine suivante"
            >
              <Icon icon="fa-chevron-right" className="text-gray-600" />
            </button>
            <button
              onClick={currentWeek}
              className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
            >
              Cette semaine
            </button>
          </div>
        </div>
      </div>

      {/* Emploi du temps */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Icon icon="fa-spinner" className="fa-spin text-4xl text-blue-500 mb-4" />
            <p className="text-gray-600">Chargement de l'emploi du temps...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Horaire
                  </th>
                  {DAYS.map((day, index) => (
                    <th key={day} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {HOURS.map((time, timeIndex) => (
                  <tr key={time} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-700">
                      {time}
                    </td>
                    {DAYS.map((_, dayIndex) => {
                      const slot = getSlotAt(dayIndex + 1, time);
                      return (
                        <td key={`${dayIndex}-${time}`} className="px-4 py-2 border-l border-gray-100">
                          {slot ? (
                            <div 
                              className="p-2 rounded-lg cursor-pointer hover:shadow-md transition relative group"
                              style={{ 
                                backgroundColor: `${getSubjectColor(slot.course.subject.color)}20`,
                                borderLeft: `4px solid ${getSubjectColor(slot.course.subject.color)}`
                              }}
                              onClick={() => activeModal === null && viewSlotDetails(slot)}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-sm text-gray-900">
                                    {slot.course.subject.name}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {slot.course.teacher.firstName} {slot.course.teacher.lastName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Salle {slot.room}
                                  </p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteSlot(slot.id);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition"
                                >
                                  <Icon icon="fa-times" className="text-xs" />
                                </button>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {slot.startTime} - {slot.endTime}
                              </p>
                            </div>
                          ) : (
                            <div className="h-20 flex items-center justify-center text-gray-300 text-xs">
                              -
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL AJOUT CRÉNEAU */}
      {activeModal === 'add' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                <Icon icon="fa-plus-circle" className="text-blue-500 mr-2" />
                Nouveau Créneau
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <Icon icon="fa-times" className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Sélection de la classe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Classe <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full border border-gray-300 p-3 rounded-lg text-gray-900"
                  value={formData.classId}
                  onChange={(e) => {
                    setFormData({...formData, classId: e.target.value, courseId: ''});
                  }}
                >
                  <option value="">Sélectionner une classe</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.level})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sélection du cours */}
              {formData.classId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cours <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full border border-gray-300 p-3 rounded-lg text-gray-900"
                    value={formData.courseId}
                    onChange={(e) => setFormData({...formData, courseId: e.target.value})}
                  >
                    <option value="">Sélectionner un cours</option>
                    {courses
                      .filter(c => c.class.id === formData.classId)
                      .map(course => (
                        <option key={course.id} value={course.id}>
                          {course.subject.name} - {course.teacher.firstName} {course.teacher.lastName}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Jour */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jour <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full border border-gray-300 p-3 rounded-lg text-gray-900"
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData({...formData, dayOfWeek: parseInt(e.target.value)})}
                >
                  {DAYS.map((day, index) => (
                    <option key={day} value={index + 1}>{day}</option>
                  ))}
                </select>
              </div>

              {/* Horaires */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Début <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full border border-gray-300 p-3 rounded-lg text-gray-900"
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                  >
                    {HOURS.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fin <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full border border-gray-300 p-3 rounded-lg text-gray-900"
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                  >
                    {HOURS.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Salle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salle <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Salle 101, Labo 3..."
                  className="w-full border border-gray-300 p-3 rounded-lg text-gray-900"
                  value={formData.room}
                  onChange={(e) => setFormData({...formData, room: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={closeModal} 
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={!formData.classId || !formData.courseId || actionLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <Icon icon="fa-spinner" className="fa-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Icon icon="fa-save" />
                      Créer le créneau
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DÉTAILS CRÉNEAU */}
      {activeModal === 'details' && selectedSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                <Icon icon="fa-info-circle" className="text-blue-500 mr-2" />
                Détails du cours
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <Icon icon="fa-times" className="text-xl" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Matière */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Matière</p>
                <p className="text-lg font-bold text-gray-900">
                  {selectedSlot.course.subject.name}
                </p>
              </div>

              {/* Professeur */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Professeur</p>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedSlot.course.teacher.firstName} {selectedSlot.course.teacher.lastName}
                </p>
              </div>

              {/* Classe */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Classe</p>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedSlot.course.class.name} ({selectedSlot.course.class.level})
                </p>
              </div>

              {/* Horaire */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Horaire</p>
                <p className="text-lg font-semibold text-gray-900">
                  {DAYS[selectedSlot.dayOfWeek - 1]} {selectedSlot.startTime} - {selectedSlot.endTime}
                </p>
              </div>

              {/* Salle */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Salle</p>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedSlot.room}
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => {
                    closeModal();
                    deleteSlot(selectedSlot.id);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Supprimer
                </button>
                <button 
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}