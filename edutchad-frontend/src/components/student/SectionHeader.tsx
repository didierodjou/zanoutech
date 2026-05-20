// components/student/SectionHeader.tsx
'use client';

import Icon from '@/components/ui/Icon';

interface SectionHeaderProps {
  icon: string;
  title: string;
  subtitle?: string;
}

export function SectionHeader({ icon, title, subtitle }: SectionHeaderProps) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
        <Icon icon={icon as any} className="text-indigo-600 text-sm" />
      </div>
      <div>
        <h2 className="text-slate-800 font-semibold text-base">{title}</h2>
        {subtitle && <p className="text-slate-400 text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}