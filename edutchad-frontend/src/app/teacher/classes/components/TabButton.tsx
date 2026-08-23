'use client';

import Icon from '@/components/ui/Icon';

interface TabButtonProps {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}

export function TabButton({ label, icon, active, onClick, badge }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition ${
        active
          ? 'border-b-2 border-indigo-600 text-indigo-600'
          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
      }`}
    >
      <Icon icon={icon as any} />
      {label}
      {badge != null && badge > 0 && (
        <span className="bg-amber-500 text-white text-[11px] font-bold rounded-full px-1.5 py-0.5 leading-none">
          {badge}
        </span>
      )}
    </button>
  );
}