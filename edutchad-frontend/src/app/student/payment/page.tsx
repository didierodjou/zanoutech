'use client';

import { motion } from 'framer-motion';
import Icon from '@/components/ui/Icon';
import { useStudentDetails } from '@/hooks/useStudentData';
import { SectionHeader, LoadingSpinner, ErrorState } from '@/components/student';

export default function PaymentPage() {
  const { details, loading, error, refetch } = useStudentDetails();

  if (loading) return <LoadingSpinner />;
  if (error || !details) return <ErrorState error={error} onRetry={refetch} />;

  const { tuitionFee, tuitionPaid, tuitionStatus } = details;
  const remaining = tuitionFee ? tuitionFee - (tuitionPaid ?? 0) : 0;
  const percent = tuitionFee ? Math.min(100, Math.round(((tuitionPaid ?? 0) / tuitionFee) * 100)) : 0;

  const statusConfig = {
    PAID: { label: 'Payé', color: 'text-emerald-600 bg-emerald-100', icon: 'fa-check-circle' },
    PARTIAL: { label: 'Partiel', color: 'text-amber-600 bg-amber-100', icon: 'fa-clock' },
    UNPAID: { label: 'Non payé', color: 'text-rose-600 bg-rose-100', icon: 'fa-exclamation-circle' },
  };
  const status = statusConfig[tuitionStatus as keyof typeof statusConfig] ?? statusConfig.UNPAID;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Scolarité</h1>
        <p className="text-slate-500 text-sm">Suivi des frais et paiements</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-slate-300 text-xs">Frais de scolarité</p>
              <p className="text-2xl font-bold">{tuitionFee ? `${tuitionFee.toLocaleString()} FCFA` : 'Non défini'}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${status.color}`}>{status.label}</div>
          </div>
        </div>
        <div className="p-6 space-y-5">
          {tuitionFee ? (
            <>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Progression du paiement</span>
                  <span className="font-semibold">{percent}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${percent === 100 ? 'bg-emerald-500' : percent >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${percent}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500">Montant versé</p>
                  <p className="text-xl font-bold text-slate-800">{(tuitionPaid ?? 0).toLocaleString()} FCFA</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500">Reste à payer</p>
                  <p className={`text-xl font-bold ${remaining > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {remaining > 0 ? `${remaining.toLocaleString()} FCFA` : 'Soldé'}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Icon icon="fa-credit-card" className="text-4xl mb-2" />
              <p>Aucun montant de scolarité renseigné</p>
              <p className="text-xs mt-1">Veuillez contacter l'administration</p>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <SectionHeader icon="fa-history" title="Historique des transactions" />
        <div className="text-center py-8 text-slate-400">
          <Icon icon="fa-inbox" className="text-3xl mb-2" />
          <p className="text-sm">Aucune transaction récente</p>
          <p className="text-xs mt-1">Les reçus seront disponibles prochainement</p>
        </div>
      </motion.div>

      <div className="bg-indigo-50 rounded-xl p-4 text-indigo-800 text-sm flex items-start gap-3">
        <Icon icon="fa-info-circle" className="text-indigo-500 mt-0.5" />
        <p>Pour toute question relative à la scolarité, veuillez contacter le bureau des finances ou envoyer un message au secrétariat.</p>
      </div>
    </div>
  );
}