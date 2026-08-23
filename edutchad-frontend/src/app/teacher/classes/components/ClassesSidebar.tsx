'use client';

import Icon from '@/components/ui/Icon';

interface Class {
  id: string;
  name: string;
  level: string;
}

interface ClassesSidebarProps {
  classes: Class[];
  selectedClass: Class | null;
  mainClassId: string | null;
  onSelect: (cls: Class) => void;
}

export function ClassesSidebar({ classes, selectedClass, mainClassId, onSelect }: ClassesSidebarProps) {
  if (classes.length === 0) {
    return (
      <div className="lg:col-span-1 space-y-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-1 mb-2">Classes</p>
        <p className="text-slate-400 text-sm px-1">Aucune classe assignée</p>
      </div>
    );
  }

  return (
    <div className="lg:col-span-1 space-y-2">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-1 mb-2">Classes</p>
      {classes.map((cls) => {
        const isMain = cls.id === mainClassId;
        const isActive = selectedClass?.id === cls.id;
        return (
          <button
            key={cls.id}
            onClick={() => onSelect(cls)}
            className={`w-full text-left p-3.5 rounded-xl border transition relative ${
              isActive
                ? 'bg-indigo-50 border-indigo-300 shadow-sm'
                : 'bg-white border-slate-100 hover:border-indigo-200'
            }`}
          >
            {isMain && (
              <span className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Icon icon="fa-star" /> PP
              </span>
            )}
            <p className={`font-bold pr-8 ${isActive ? 'text-indigo-700' : 'text-slate-800'}`}>
              {cls.name}
            </p>
            <p className="text-xs text-slate-400">{cls.level}</p>
          </button>
        );
      })}
    </div>
  );
}