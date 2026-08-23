'use client';

import Icon from '@/components/ui/Icon';

export function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center flex flex-col items-center min-h-[300px] justify-center">
      <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-3">
        <Icon icon="fa-chalkboard" className="text-2xl text-slate-300" />
      </div>
      <p className="text-slate-500 font-medium">Sélectionnez une classe</p>
    </div>
  );
}