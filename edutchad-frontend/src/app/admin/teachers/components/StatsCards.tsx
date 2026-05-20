// app/teachers/components/StatsCards.tsx
import Icon from '@/components/ui/Icon';
import { Teacher, Class, Subject } from '../types';

interface StatsCardsProps {
  teachers: Teacher[];
  classes: Class[];
  subjects: Subject[];
}

export default function StatsCards({ teachers, classes, subjects }: StatsCardsProps) {
  const principalsCount = teachers.filter(t => t.mainClass).length;
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
            <Icon icon="fa-user-tie" className="text-xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Professeurs</p>
            <p className="text-2xl font-bold text-gray-900">{teachers.length}</p>
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-600">
            <Icon icon="fa-crown" className="text-xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Professeurs Principaux</p>
            <p className="text-2xl font-bold text-gray-900">{principalsCount}</p>
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
            <Icon icon="fa-book" className="text-xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Matières</p>
            <p className="text-2xl font-bold text-gray-900">{subjects.length}</p>
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
            <Icon icon="fa-chalkboard-teacher" className="text-xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Classes actives</p>
            <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}