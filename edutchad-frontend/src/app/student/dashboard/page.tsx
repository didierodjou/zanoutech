'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/Icon';
import { useStudentDetails } from '@/hooks/useStudentData';
import { useStudent } from '@/context/StudentContext';
import { TrimesterSelector } from '@/components/student/TrimesterSelector';
import { StatCard } from '@/components/student/StatCard';
import { SectionHeader } from '@/components/student/SectionHeader';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

// ==================== HELPERS ====================

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
}

// Palette volontairement restreinte : indigo (marque, même teinte que le menu) pour tout
// ce qui est "normal", rose uniquement pour ce qui demande vraiment l'attention (< 10/20).
function getAverageColor(avg: number) {
  if (avg < 10) return { text: 'text-rose-600', bg: 'bg-rose-100', bar: 'bg-rose-500' };
  return { text: 'text-indigo-600', bg: 'bg-indigo-100', bar: 'bg-indigo-600' };
}

function calcTrimAvg(grades: any[], trimester: number) {
  const g = grades.filter((x) => x.trimester === trimester);
  if (!g.length) return null;
  const totalPts = g.reduce((acc, x) => acc + x.value * (x.coefficient || 1), 0);
  const totalCoef = g.reduce((acc, x) => acc + (x.coefficient || 1), 0);
  return totalCoef > 0 ? Number((totalPts / totalCoef).toFixed(2)) : null;
}

function groupBySubject(grades: any[], trimester: number) {
  const g = grades.filter((x) => x.trimester === trimester);
  const map = new Map();
  g.forEach((gr) => {
    const sid = gr.subject.id;
    if (!map.has(sid)) {
      map.set(sid, {
        name: gr.subject.name,
        color: gr.subject.color,
        category: gr.subject.category,
        coef: gr.subject.coefficient,
        vals: [],
      });
    }
    map.get(sid).vals.push(gr.value);
  });
  return Array.from(map.entries()).map(([, v]) => ({
    ...v,
    average: Number((v.vals.reduce((a: any, b: any) => a + b, 0) / v.vals.length).toFixed(2)),
  }));
}

// Certains enregistrements de type "PRESENCE" peuvent exister en base (ex: synchronisation
// depuis les feuilles d'appel) sans être de véritables absences. On les exclut totalement
// de ce panneau : une présence n'est jamais "non justifiée", elle ne doit signaler rien.
const NON_ABSENCE_TYPES = new Set(['PRESENCE', 'PRESENT']);

function isRealAbsence(absence: { type: string }) {
  return !NON_ABSENCE_TYPES.has((absence.type || '').toUpperCase());
}

// Un trimestre "civil" (Sept-Nov / Déc-Fév / Mar-Juin) déduit du mois de la date.
function filterByTrimester<T extends { date: string }>(items: T[], trimester: number) {
  return items.filter((item) => {
    const m = new Date(item.date).getMonth() + 1;
    if (trimester === 1) return m >= 9 && m <= 11;
    if (trimester === 2) return m === 12 || m === 1 || m === 2;
    return m >= 3 && m <= 6;
  });
}

// ==================== PAGE ====================

export default function StudentDashboard() {
  const { student } = useStudent();
  const { details, loading, error, refetch } = useStudentDetails();
  const [trimester, setTrimester] = useState(1);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [classCourses, setClassCourses] = useState<any[]>([]);
  const [classLoading, setClassLoading] = useState(false);
  const [classError, setClassError] = useState<string | null>(null);

  useEffect(() => {
    const classId = details?.class?.id;
    if (!classId) return;

    const fetchClassData = async () => {
      setClassLoading(true);
      setClassError(null);
      try {
        const [studentsRes, coursesRes] = await Promise.all([
          fetch(`${API_BASE}/classes/${classId}/students`, { credentials: 'include' }),
          fetch(`${API_BASE}/classes/${classId}/courses`, { credentials: 'include' }),
        ]);

        setClassStudents(studentsRes.ok ? await studentsRes.json() : []);
        setClassCourses(coursesRes.ok ? await coursesRes.json() : []);
      } catch (err) {
        console.error('Erreur chargement infos classe:', err);
        setClassError("Impossible de charger les informations de la classe.");
      } finally {
        setClassLoading(false);
      }
    };
    fetchClassData();
  }, [details?.class?.id]);

  // ---------- États de chargement / erreur ----------

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
          <p className="mt-3 text-slate-500 text-sm">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-6 max-w-md w-full text-center">
          <Icon icon="fa-exclamation-triangle" className="text-4xl text-rose-500 mx-auto mb-3" />
          <p className="text-slate-700 font-semibold">Erreur de chargement</p>
          <p className="text-slate-500 text-sm mt-1">{error || 'Données introuvables.'}</p>
          <button
            onClick={() => refetch()}
            className="mt-5 px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition text-sm font-medium"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // ---------- Dérivés ----------

  const trimAvg = calcTrimAvg(details.grades, trimester);
  const subjectRows = groupBySubject(details.grades, trimester);
  const avgColor = trimAvg !== null ? getAverageColor(trimAvg) : null;

  const realAbsences = details.absences.filter(isRealAbsence);
  const trimAbsences = filterByTrimester(realAbsences, trimester);
  const trimUnjustified = trimAbsences.filter((a) => !a.isJustified).length;
  const hasUnjustifiedAlert = trimUnjustified > 0;

  const recentAbsences = [...realAbsences]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  const currentBulletin = details.bulletins.find((b) => b.trimester === trimester);

  const pct = details.tuitionFee
    ? Math.min(100, Math.round(((details.tuitionPaid ?? 0) / details.tuitionFee) * 100))
    : 0;
  const payStatusMap = {
    PAID: { label: 'Payé', cls: 'bg-emerald-100 text-emerald-700' },
    PARTIAL: { label: 'Partiel', cls: 'bg-amber-100 text-amber-700' },
    UNPAID: { label: 'Non payé', cls: 'bg-rose-100 text-rose-700' },
  };
  const payInfo = payStatusMap[details.tuitionStatus as keyof typeof payStatusMap] ?? payStatusMap.UNPAID;

  const initials = `${details.firstName?.[0] ?? ''}${details.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto pb-6">
      {/* ==================== HEADER ==================== */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
            {initials || <Icon icon="fa-user" />}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 truncate">
              Bonjour, {details.firstName}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5 truncate">
              {details.class?.name || 'Classe non assignée'} · {details.registrationNo}
            </p>
          </div>
        </div>
        <div className="flex-shrink-0 self-start sm:self-auto">
          <TrimesterSelector trimester={trimester as 1 | 2 | 3} onChange={setTrimester} />
        </div>
      </motion.div>

      {/* ==================== ALERTE ABSENCES NON JUSTIFIÉES ==================== */}
      {/* N'apparaît QUE si au moins une absence non justifiée existe pour le trimestre. Sinon, aucun signal. */}
      {hasUnjustifiedAlert && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start sm:items-center gap-3 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3"
        >
          <span className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
            <Icon icon="fa-exclamation-circle" className="text-rose-600 text-sm" />
          </span>
          <p className="text-sm text-rose-700">
            <span className="font-semibold">
              {trimUnjustified} absence{trimUnjustified > 1 ? 's' : ''} non justifiée{trimUnjustified > 1 ? 's' : ''}
            </span>{' '}
            pour le trimestre {trimester}. Merci de régulariser la situation auprès du secrétariat.
          </p>
        </motion.div>
      )}

      {/* ==================== STAT CARDS ==================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          icon="fa-star"
          label={`Moyenne T${trimester}`}
          value={trimAvg !== null ? `${trimAvg}/20` : '—'}
          sub={trimAvg !== null ? (trimAvg >= 10 ? 'Satisfaisant' : 'À améliorer') : 'Aucune note'}
          iconBg={trimAvg !== null && trimAvg < 10 ? 'bg-rose-500' : 'bg-indigo-600'}
          valueColor={trimAvg !== null && trimAvg < 10 ? 'text-rose-600' : undefined}
        />
        <StatCard
          icon="fa-calendar-times"
          label={`Absences T${trimester}`}
          value={String(trimAbsences.length)}
          sub={
            hasUnjustifiedAlert
              ? `${trimUnjustified} non justifiée(s)`
              : trimAbsences.length > 0
                ? 'Toutes justifiées'
                : 'Aucun signalement'
          }
          iconBg={hasUnjustifiedAlert ? 'bg-rose-500' : 'bg-indigo-600'}
          valueColor={hasUnjustifiedAlert ? 'text-rose-600' : undefined}
        />
        <StatCard
          icon="fa-file-alt"
          label="Bulletin"
          value={
            currentBulletin?.status === 'CONFIRMED'
              ? 'Disponible'
              : currentBulletin?.status === 'VERIFIED'
                ? 'Vérifié'
                : '—'
          }
          sub={currentBulletin ? `Moy. ${currentBulletin.generalAverage ?? '—'}/20` : 'Non généré'}
          iconBg="bg-indigo-600"
        />
        <StatCard
          icon="fa-credit-card"
          label="Scolarité"
          value={payInfo.label}
          sub={
            details.tuitionFee
              ? `${(details.tuitionPaid ?? 0).toLocaleString()} / ${details.tuitionFee.toLocaleString()} FCFA`
              : 'Non renseigné'
          }
          iconBg={details.tuitionStatus === 'UNPAID' ? 'bg-rose-500' : 'bg-indigo-600'}
          valueColor={details.tuitionStatus === 'UNPAID' ? 'text-rose-600' : undefined}
        />
      </div>

      {/* ==================== NOTES + PANNEAU LATÉRAL ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Notes par matière */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5"
        >
          <SectionHeader icon="fa-chart-bar" title={`Notes par matière — T${trimester}`} />
          {subjectRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <Icon icon="fa-inbox" className="text-3xl mb-2" />
              <p className="text-sm">Aucune note enregistrée</p>
            </div>
          ) : (
            <div className="space-y-3">
              {subjectRows
                .sort((a, b) => b.average - a.average)
                .map((subj) => {
                  const c = getAverageColor(subj.average);
                  return (
                    <div key={subj.name} className="group">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {subj.color && (
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: subj.color }}
                            />
                          )}
                          <span className="text-xs sm:text-sm text-slate-700 font-medium truncate">
                            {subj.name}
                          </span>
                          <span className="text-[10px] text-slate-400 hidden group-hover:inline flex-shrink-0">
                            (coef {subj.coef})
                          </span>
                        </div>
                        <span className={`text-sm font-bold flex-shrink-0 ${c.text}`}>{subj.average}/20</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${c.bar}`}
                          style={{ width: `${(subj.average / 20) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
          {trimAvg !== null && (
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm text-slate-500 font-medium">Moyenne générale</span>
              <span className={`text-lg font-bold ${getAverageColor(trimAvg).text}`}>{trimAvg}/20</span>
            </div>
          )}
        </motion.div>

        {/* Colonne latérale : scolarité + bulletin */}
        <div className="space-y-4 md:space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5"
          >
            <SectionHeader icon="fa-credit-card" title="Scolarité" />
            {details.tuitionFee ? (
              <>
                <div className="flex justify-between text-xs text-slate-500 mb-2">
                  <span>{(details.tuitionPaid ?? 0).toLocaleString()} FCFA versés</span>
                  <span>{details.tuitionFee.toLocaleString()} FCFA total</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      pct === 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${payInfo.cls}`}>
                    {payInfo.label}
                  </span>
                  <span className="text-lg font-bold text-slate-800">{pct}%</span>
                </div>
                {details.tuitionFee - (details.tuitionPaid ?? 0) > 0 && (
                  <p className="text-xs text-slate-400 mt-2">
                    Reste à payer :{' '}
                    <span className="font-semibold text-rose-600">
                      {(details.tuitionFee - (details.tuitionPaid ?? 0)).toLocaleString()} FCFA
                    </span>
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">Montant non défini</p>
            )}
          </motion.div>

          {currentBulletin && (
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5"
            >
              <SectionHeader icon="fa-file-alt" title={`Bulletin T${trimester}`} />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Moyenne générale</span>
                  <span className="font-bold text-slate-800">{currentBulletin.generalAverage ?? '—'}/20</span>
                </div>
                {currentBulletin.conduiteNote !== undefined && currentBulletin.conduiteNote !== null && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Conduite</span>
                    <span className={`font-bold ${getAverageColor(currentBulletin.conduiteNote).text}`}>
                      {currentBulletin.conduiteNote}/20
                    </span>
                  </div>
                )}
                {currentBulletin.appreciation && (
                  <div className="mt-3 p-3 bg-indigo-50 rounded-xl">
                    <p className="text-xs text-indigo-700 italic">« {currentBulletin.appreciation} »</p>
                  </div>
                )}
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Statut</span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      currentBulletin.status === 'CONFIRMED'
                        ? 'bg-emerald-100 text-emerald-700'
                        : currentBulletin.status === 'VERIFIED'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {currentBulletin.status === 'CONFIRMED'
                      ? 'Confirmé'
                      : currentBulletin.status === 'VERIFIED'
                        ? 'Vérifié'
                        : 'En attente'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ==================== ABSENCES & PUNITIONS ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Absences récentes — le badge d'alerte ne s'affiche que s'il y a une absence non justifiée */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5"
        >
          <div className="flex items-center justify-between mb-4 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <Icon icon="fa-calendar-times" className="text-indigo-600 text-xs" />
              </span>
              <h2 className="text-slate-800 font-semibold text-sm truncate">Absences récentes</h2>
            </div>
            {hasUnjustifiedAlert && (
              <span className="text-xs font-semibold px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full flex-shrink-0">
                {trimUnjustified} non justifiée(s)
              </span>
            )}
          </div>
          {recentAbsences.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-slate-400">
              <Icon icon="fa-check-circle" className="text-3xl text-emerald-400 mb-2" />
              <p className="text-sm">Aucune absence enregistrée</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentAbsences.map((absence) => (
                <div
                  key={absence.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition"
                >
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      absence.isJustified ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 font-medium truncate">{absence.type || 'Absence'}</p>
                    {absence.reason && <p className="text-xs text-slate-400 truncate">{absence.reason}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-slate-500">{formatDate(absence.date)}</p>
                    <p
                      className={`text-xs font-semibold ${
                        absence.isJustified ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {absence.isJustified ? 'Justifiée' : 'Non justifiée'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Punitions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5"
        >
          <SectionHeader icon="fa-gavel" title={`Punitions — T${trimester}`} />
          {(() => {
            const trimPunishments = details.punishments.filter((p) => p.trimester === trimester);
            const totalHours = trimPunishments.reduce((acc, p) => acc + p.hours, 0);
            if (trimPunishments.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                  <Icon icon="fa-smile" className="text-3xl text-emerald-400 mb-2" />
                  <p className="text-sm">Aucune punition ce trimestre</p>
                </div>
              );
            }
            return (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs text-slate-500">{trimPunishments.length} punition(s)</span>
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                    {totalHours}h total
                  </span>
                </div>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {trimPunishments
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((p) => (
                      <div key={p.id} className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-amber-700 font-bold text-xs">{p.hours}h</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700 truncate">{p.reason || 'Punition'}</p>
                          <p className="text-xs text-slate-400">{formatDate(p.date)}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </>
            );
          })()}
        </motion.div>
      </div>

      {/* ==================== APERÇU ANNUEL ==================== */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-gradient-to-br from-indigo-950 to-slate-900 rounded-2xl p-4 md:p-6 shadow-lg"
      >
        <h2 className="text-white font-semibold text-sm mb-5 flex items-center gap-2">
          <Icon icon="fa-chart-line" className="text-indigo-300" />
          Vue d'ensemble annuelle
        </h2>
        <div className="grid grid-cols-4 gap-2 md:gap-4">
          {[1, 2, 3].map((t) => {
            const avg = calcTrimAvg(details.grades, t);
            // Fond sombre : on garde le blanc par défaut et on ne réserve le rose
            // (peu lisible sur fond blanc classique) qu'aux moyennes faibles.
            const textColor = avg === null ? 'text-slate-500' : avg < 10 ? 'text-rose-400' : 'text-white';
            return (
              <div key={t} className="text-center">
                <p className="text-indigo-400 text-[10px] md:text-xs mb-1">T{t}</p>
                <p className={`text-lg md:text-2xl font-bold ${textColor}`}>{avg !== null ? avg : '—'}</p>
              </div>
            );
          })}
          <div className="text-center border-l border-white/10 pl-2 md:pl-4">
            <p className="text-indigo-400 text-[10px] md:text-xs mb-1">Annuelle</p>
            <p className="text-lg md:text-2xl font-bold text-white">
              {(() => {
                const avgs = [1, 2, 3]
                  .map((t) => calcTrimAvg(details.grades, t))
                  .filter((v): v is number => v !== null);
                return avgs.length ? (avgs.reduce((a, b) => a + b, 0) / avgs.length).toFixed(2) : '—';
              })()}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ==================== CONTACT PARENT ==================== */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5"
      >
        <SectionHeader icon="fa-user-friends" title="Contact parent / tuteur" />
        <div className="flex flex-col sm:flex-row flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Icon icon="fa-user" className="text-indigo-600 text-sm" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500">Nom</p>
              <p className="text-sm font-semibold text-slate-800 truncate">{details.parentName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Icon icon="fa-phone" className="text-indigo-600 text-sm" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500">Téléphone</p>
              <p className="text-sm font-semibold text-slate-800 truncate">{details.parentPhone}</p>
            </div>
          </div>
          {details.parentEmail && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Icon icon="fa-envelope" className="text-indigo-600 text-sm" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500">Email</p>
                <p className="text-sm font-semibold text-slate-800 truncate">{details.parentEmail}</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ==================== MA CLASSE ==================== */}
      {details.class?.id && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
        >
          <div className="border-b border-slate-100 bg-slate-50/50 px-4 md:px-5 py-3">
            <SectionHeader icon="fa-users" title="Ma classe" />
          </div>

          {classLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : classError ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <Icon icon="fa-exclamation-triangle" className="text-2xl text-amber-400 mb-2" />
              <p className="text-sm">{classError}</p>
            </div>
          ) : (
            <div className="p-4 md:p-5 space-y-6 md:space-y-8">
              {/* Liste des élèves */}
              <div>
                <h3 className="text-md font-semibold text-slate-800 flex items-center gap-2 mb-3">
                  <Icon icon="fa-user-graduate" className="text-indigo-500" />
                  Élèves de la classe ({classStudents.length})
                </h3>
                {classStudents.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">Aucun élève trouvé</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {classStudents.map((studentItem) => (
                      <div
                        key={studentItem.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                      >
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs flex-shrink-0">
                          {studentItem.firstName?.[0]}
                          {studentItem.lastName?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">
                            {studentItem.firstName} {studentItem.lastName}
                          </p>
                          <p className="text-xs text-slate-400">{studentItem.registrationNo}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Matières et professeurs */}
              <div>
                <h3 className="text-md font-semibold text-slate-800 flex items-center gap-2 mb-3">
                  <Icon icon="fa-book-open" className="text-indigo-500" />
                  Matières et enseignants
                </h3>
                {classCourses.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">Aucune matière enregistrée</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {classCourses.map((course) => (
                      <div
                        key={course.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {course.subject?.color && (
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: course.subject.color }}
                            />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{course.subject?.name}</p>
                            <p className="text-xs text-slate-500 truncate">
                              {course.teacher?.firstName} {course.teacher?.lastName}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 bg-white px-2 py-0.5 rounded-full flex-shrink-0">
                          coef {course.coefficient}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}