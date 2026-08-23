'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { api } from '../services/api';
import { avgBadge } from '../utils/helpers';
import toast from 'react-hot-toast';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  registrationNo: string;
}

interface Bulletin {
  id: string;
  studentId: string;
  period: string;
  status: 'PENDING' | 'VERIFIED' | 'CONFIRMED';
  generalAverage?: number;
  appreciation?: string;
  matieres?: any[];
  subjects?: any[];
  trimestres?: { trimestre1: number; trimestre2: number; trimestre3: number };
  annuelle?: number;
  rang?: { position: number; total: number };
  absences?: number;
  conduite?: { note: number; appreciation: string };
}

interface BulletinsTabProps {
  students: Student[];
  bulletins: {
    list: Bulletin[];
    loading: boolean;
    pendingCount: number;
    verifiedCount: number;
    confirmedCount: number;
    refetch: () => void;
  };
  classId: string;
}

const PERIOD_LABELS = {
  TRIMESTRE_1: '1er Trimestre',
  TRIMESTRE_2: '2ème Trimestre',
  TRIMESTRE_3: '3ème Trimestre',
};

const APPRECIATION_OPTIONS = [
  'Excellent',
  'Très bien',
  'Bien',
  'Assez bien',
  'Satisfaisant',
  'Peut mieux faire',
  'Insuffisant',
  'Efforts nécessaires',
];

const STATUS_CFG = {
  PENDING: { label: 'En attente', dot: 'bg-amber-400', pill: 'bg-amber-50 text-amber-700 border-amber-200' },
  VERIFIED: { label: 'Vérifié', dot: 'bg-blue-500', pill: 'bg-blue-50 text-blue-700 border-blue-200' },
  CONFIRMED: { label: 'Confirmé', dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

export function BulletinsTab({ students, bulletins, classId }: BulletinsTabProps) {
  const [period, setPeriod] = useState<'TRIMESTRE_1' | 'TRIMESTRE_2' | 'TRIMESTRE_3'>('TRIMESTRE_1');
  const [appreciations, setAppreciations] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [confirmingAll, setConfirmingAll] = useState(false);

  useEffect(() => {
    bulletins.refetch();
  }, [period]);

  useEffect(() => {
    const map: Record<string, string> = {};
    bulletins.list.forEach((b) => {
      if (b.appreciation) map[b.studentId] = b.appreciation;
    });
    setAppreciations(map);
  }, [bulletins.list]);

  const handleVerify = async (b: Bulletin) => {
    setSavingId(b.id);
    try {
      await api.patch(`/bulletins/${b.id}/verify`);
      if (appreciations[b.studentId]) {
        await api.patch(`/bulletins/${b.id}`, { appreciation: appreciations[b.studentId] });
      }
      toast.success('Bulletin vérifié');
      bulletins.refetch();
    } catch {
      toast.error('Erreur lors de la vérification');
    } finally {
      setSavingId(null);
    }
  };

  const handleConfirm = async (b: Bulletin) => {
    setSavingId(b.id);
    try {
      await api.patch(`/bulletins/${b.id}/confirm`);
      toast.success('Bulletin confirmé');
      bulletins.refetch();
    } catch {
      toast.error('Erreur lors de la confirmation');
    } finally {
      setSavingId(null);
    }
  };

  const handleConfirmAll = async () => {
    const toConfirm = bulletins.list.filter((b) => b.status === 'VERIFIED');
    if (toConfirm.length === 0) return;
    setConfirmingAll(true);
    try {
      await Promise.all(toConfirm.map((b) => api.patch(`/bulletins/${b.id}/confirm`)));
      toast.success('Tous les bulletins vérifiés ont été confirmés');
      bulletins.refetch();
    } catch {
      toast.error('Erreur lors de la confirmation groupée');
    } finally {
      setConfirmingAll(false);
    }
  };

  const updateAppreciation = (studentId: string, value: string) => {
    setAppreciations((prev) => ({ ...prev, [studentId]: value }));
  };

  const { list, loading, pendingCount, verifiedCount, confirmedCount } = bulletins;

  if (loading) {
    return (
      <div className="p-10 text-center">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (students.length === 0) {
    return <div className="p-8 text-center text-slate-400">Aucun élève</div>;
  }

  return (
    <div>
      {/* Sélecteur trimestre + compteurs */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {(Object.entries(PERIOD_LABELS) as [string, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPeriod(key as typeof period)}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition ${
                period === key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2 text-xs font-semibold flex-wrap">
          <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
            {pendingCount} en attente
          </span>
          <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
            {verifiedCount} vérifiés
          </span>
          <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
            {confirmedCount} confirmés
          </span>
        </div>
      </div>

      {/* Confirmation groupée */}
      {verifiedCount > 0 && (
        <div className="mx-5 mt-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-blue-700 flex items-center gap-2">
            <Icon icon="fa-info-circle" />
            {verifiedCount} bulletin(s) vérifié(s) prêt(s) à être confirmés
          </p>
          <button
            onClick={handleConfirmAll}
            disabled={confirmingAll}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {confirmingAll ? <Icon icon="fa-spinner" className="fa-spin" /> : <Icon icon="fa-check-double" />}
            Confirmer tous
          </button>
        </div>
      )}

      {/* Liste des bulletins */}
      <div className="divide-y divide-slate-100 mt-2">
        {students.map((s, i) => {
          const b = list.find((x) => x.studentId === s.id);
          const status = b?.status ?? 'PENDING';
          const cfg = STATUS_CFG[status];
          const busy = savingId === b?.id;

          return (
            <div key={s.id} className={`px-5 py-4 ${i % 2 !== 0 ? 'bg-slate-50/30' : ''}`}>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-3 flex-1 min-w-[160px]">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {s.firstName[0]}
                    {s.lastName[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm leading-tight">
                      {s.lastName} {s.firstName}
                    </p>
                    <p className="text-xs text-slate-400">{s.registrationNo}</p>
                  </div>
                </div>

                <div className="text-center w-20">
                  <p className="text-[10px] text-slate-400 mb-0.5">Moyenne</p>
                  <span className={`text-sm font-bold px-2 py-0.5 rounded-lg ${avgBadge(b?.generalAverage)}`}>
                    {b?.generalAverage != null ? b.generalAverage.toFixed(2) : '—'}
                  </span>
                </div>

                <div className="min-w-[160px]">
                  <p className="text-[10px] text-slate-400 mb-1">Appréciation PP</p>
                  <select
                    value={appreciations[s.id] ?? ''}
                    onChange={(e) => updateAppreciation(s.id, e.target.value)}
                    disabled={status === 'CONFIRMED'}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">— Choisir —</option>
                    {APPRECIATION_OPTIONS.map((a) => (
                      <option key={a}>{a}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${cfg.pill}`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    {cfg.label}
                  </span>

                  {b && (
                    <button
                      onClick={() => {/* TODO: ouvrir aperçu */}}
                      className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-200 transition"
                    >
                      <Icon icon="fa-eye" /> Aperçu
                    </button>
                  )}

                  {b && status === 'PENDING' && (
                    <button
                      onClick={() => handleVerify(b)}
                      disabled={busy}
                      className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                      {busy ? <Icon icon="fa-spinner" className="fa-spin" /> : <Icon icon="fa-check" />}
                      Vérifier
                    </button>
                  )}

                  {b && status === 'VERIFIED' && (
                    <button
                      onClick={() => handleConfirm(b)}
                      disabled={busy}
                      className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                      {busy ? <Icon icon="fa-spinner" className="fa-spin" /> : <Icon icon="fa-check-double" />}
                      Confirmer
                    </button>
                  )}

                  {status === 'CONFIRMED' && (
                    <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                      <Icon icon="fa-lock" /> Finalisé
                    </span>
                  )}

                  {!b && <span className="text-xs text-slate-400 italic">Non généré</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}