'use client';

import { motion } from 'framer-motion';
import Icon from '@/components/ui/Icon';

interface Props {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  iconBg: string;
  valueColor?: string;
  delay?: number;
}

export function StatCard({ icon, label, value, sub, iconBg, valueColor, delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-start gap-4"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon icon={icon as any} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-slate-500 text-xs font-medium">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 leading-none ${valueColor ?? 'text-slate-800'}`}>{value}</p>
        {sub && <p className="text-slate-400 text-xs mt-1">{sub}</p>}
      </div>
    </motion.div>
  );
}