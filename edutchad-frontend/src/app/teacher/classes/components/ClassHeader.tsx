'use client';

import Icon from '@/components/ui/Icon';

interface ClassHeaderProps {
  uniqueClassesCount: number;
  isMainClass: boolean;
  selectedClass: { name: string } | null;
}

export function ClassHeader({ uniqueClassesCount, isMainClass, selectedClass }: ClassHeaderProps) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-3 tracking-tight text-slate-900">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 shadow-xs">
            <Icon icon="fa-chalkboard-teacher" className="text-indigo-600 text-lg" />
          </div>
          Mes Classes
        </h1>
        <p className="text-slate-500 text-sm font-medium flex items-center gap-2">
          <span>{uniqueClassesCount} classe(s) assignée(s)</span>
          {isMainClass && selectedClass && (
            <>
              <span className="text-slate-300">·</span>
              <span className="bg-amber-50 border border-amber-200 text-amber-700 text-xs px-2.5 py-0.5 rounded-full font-semibold inline-flex items-center gap-1.5">
                <Icon icon="fa-star" className="text-amber-500 text-[10px]" /> PP · {selectedClass.name}
              </span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}