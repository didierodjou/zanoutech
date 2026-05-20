'use client';

import Icon from '@/components/ui/Icon';

interface PersonalDetailsCardProps {
  studentData: {
    sex?: string | null;
    dateOfBirth: string | Date;
    parentName: string;
    parentPhone: string;
    parentEmail?: string | null;
    paymentMethod?: string | null;
  };
}

export function PersonalDetailsCard({ studentData }: PersonalDetailsCardProps) {
  const formatDateBorn = (dateStr: string | Date) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-6">
      {/* Profil & Informations Générales */}
      <div>
        <h3 className="text-slate-800 font-bold text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
          <Icon icon="fa-user-id" className="text-indigo-500" /> Informations Personnelles
        </h3>
        
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Genre / Sexe</p>
            <p className="font-semibold text-slate-700 mt-0.5 capitalize">{studentData.sex || 'Non spécifié'}</p>
          </div>
          <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Date de naissance</p>
            <p className="font-semibold text-slate-700 mt-0.5">{formatDateBorn(studentData.dateOfBirth)}</p>
          </div>
        </div>
      </div>

      {/* bloc Parent / Tuteur */}
      <div className="pt-2">
        <h3 className="text-slate-800 font-bold text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
          <Icon icon="fa-user-friends" className="text-indigo-500" /> Parent / Tuteur Légal
        </h3>

        <div className="space-y-2.5">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/40 border border-slate-100 text-xs">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
              <Icon icon="fa-user" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 font-medium">Nom complet</p>
              <p className="font-semibold text-slate-700 truncate">{studentData.parentName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/40 border border-slate-100 text-xs">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <Icon icon="fa-phone" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 font-medium">Téléphone portable</p>
              <p className="font-semibold text-slate-700 truncate">{studentData.parentPhone}</p>
            </div>
          </div>

          {studentData.parentEmail && (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/40 border border-slate-100 text-xs">
              <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 flex-shrink-0">
                <Icon icon="fa-envelope" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-medium">Adresse Email</p>
                <p className="font-semibold text-slate-700 truncate">{studentData.parentEmail}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mode de règlement par défaut s'il existe */}
      {studentData.paymentMethod && (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="font-medium">Mode de paiement préféré :</span>
          <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg capitalize">
            {studentData.paymentMethod}
          </span>
        </div>
      )}
    </div>
  );
}