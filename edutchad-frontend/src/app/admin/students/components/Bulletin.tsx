// src/app/admin/students/components/Bulletin.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Matiere {
  id?: string;
  nom: string;
  moyenne?: number | null;
  coefficient: number;
  categorie?: string;
  appreciation?: string;
  devoir?: number | null;
  composition?: number | null;
  totalPoints?: number;
}

interface BilanSection {
  noteMax: number;
  bilanDevoir: number | null;
  bilanComposition: number | null;
  totalCoef: number;
  totalPoints: number;
  moyenne: number;
}

interface BulletinData {
  student: {
    firstName: string;
    lastName: string;
    registrationNo: string;
    class?: { name: string; level: string } | null;
  };
  period?: string;
  trimester?: number;
  matieres: Matiere[];
  bilans?: {
    litteraire: BilanSection;
    scientifique: BilanSection;
  };
  moyennes?: {
    litteraire: number;
    scientifique: number;
    generale: number;
    conduite: number | null;
  };
  total?: {
    noteMax: number;
    totalCoef: number;
    totalPoints: number;
  };
  trimestres?: {
    trimestre1: number | null;
    trimestre2: number | null;
    trimestre3: number | null;
  };
  annuelle?: number | null;
  rang?: { position: number; total: number };
  absences?: number;
  conduite?: {
    note: number | null;
    appreciation: string;
    punitions?: { id: string; hours: number; reason?: string | null; date: string }[];
    totalHeuresColle?: number;
    noteAutoCalculee?: number | null;
    autoCalculated?: boolean;
    manualNote?: number | null;
  };
  appreciation?: string;
  tableauHonneur?: string;
  generalAverage?: number;
  generatedAt: string;
}

interface BulletinProps {
  bulletinData: BulletinData;
  onClose: () => void;
  onPrint: () => void;
  onDownload: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Formate un nombre avec virgule (style français), ex: 13,50 */
const fmt = (n: number | null | undefined): string => {
  if (n === null || n === undefined || isNaN(n as number)) return '-';
  return (n as number).toFixed(2).replace('.', ',');
};

/**
 * Détermine le cycle à afficher dans le logo selon le niveau de la classe :
 *   6e, 5e, 4e, 3e  →  "1er CYCLE"
 *   2nde, 1ère, Terminale  →  "2nde CYCLE"
 */
const getCycle = (level?: string | null): { label: string; sup: string } => {
  if (!level) return { label: 'CYCLE', sup: '2nde' };
  const l = level.toLowerCase();
  if (l.includes('6') || l.includes('5') || l.includes('4') || l.includes('troisième') || l.includes('3e') || l.includes('3ème')) {
    return { label: 'CYCLE', sup: '1er' };
  }
  return { label: 'CYCLE', sup: '2nde' };
};

// ─── Composant ────────────────────────────────────────────────────────────────

export default function Bulletin({ bulletinData, onClose, onPrint, onDownload }: BulletinProps) {
  const [loading, setLoading] = useState(true);
  const [computed, setComputed] = useState<any>(null);

  useEffect(() => {
    if (bulletinData) {
      setComputed(buildComputedData(bulletinData));
      setLoading(false);
    }
  }, [bulletinData]);

  // ── Calculs principaux ─────────────────────────────────────────────────────
  function buildComputedData(d: BulletinData) {
    // ── Organiser les matières ─────────────────────────────────────────────
    const rawMatieres: Matiere[] = (d.matieres || []).map(m => ({
      id: m.id,
      nom: m.nom || (m as any).name || 'Matière inconnue',
      moyenne: m.moyenne ?? (m as any).average ?? null,
      coefficient: m.coefficient || 2,
      categorie: m.categorie || (m as any).category || 'LITTERAIRE',
      appreciation: m.appreciation || '',
      devoir: m.devoir ?? null,
      composition: m.composition ?? null,
      totalPoints: m.totalPoints ?? (m.moyenne != null ? m.moyenne * (m.coefficient || 2) : 0)
    }));

    const litteraires = rawMatieres.filter(m =>
      m.categorie === 'LITTERAIRE' ||
      ['français', 'histoire', 'philosophie', 'anglais', 'arabe'].some(k =>
        (m.nom || '').toLowerCase().includes(k)
      )
    );

    const scientifiques = rawMatieres.filter(m =>
      m.categorie === 'SCIENTIFIQUE' ||
      ['mathématiques', 'math', 'svt', 'physique', 'chimie', 'géographie', 'geographie'].some(k =>
        (m.nom || '').toLowerCase().includes(k)
      )
    );

    // ── Bilan littéraire ────────────────────────────────────────────────────
    const bilanLitt: BilanSection = d.bilans?.litteraire ?? calcBilan(litteraires);
    // ── Bilan scientifique ──────────────────────────────────────────────────
    const bilanSci: BilanSection = d.bilans?.scientifique ?? calcBilan(scientifiques);

    // ── Note de conduite ────────────────────────────────────────────────────
    const conduiteNote: number | null = d.conduite?.note ?? d.moyennes?.conduite ?? null;

    // ── Total général ───────────────────────────────────────────────────────
    const totalCoef = bilanLitt.totalCoef + bilanSci.totalCoef + 1; // +1 conduite
    const totalPoints = Number((bilanLitt.totalPoints + bilanSci.totalPoints + (conduiteNote ?? 0)).toFixed(2));
    const noteMaxTotal = bilanLitt.noteMax + bilanSci.noteMax + 20;

    // ── Moyennes de section ─────────────────────────────────────────────────
    const moyLitt = bilanLitt.moyenne;
    const moyScient = bilanSci.moyenne;

    return {
      litteraires,
      scientifiques,
      bilanLitt,
      bilanSci,
      moyLitt,
      moyScient,
      conduiteNote,
      totalCoef,
      totalPoints,
      noteMaxTotal,
    };
  }

  /** Calcul de bilan depuis une liste de matières (fallback si le backend ne le fournit pas) */
  function calcBilan(matieres: Matiere[]): BilanSection {
    if (matieres.length === 0) {
      return { noteMax: 0, bilanDevoir: null, bilanComposition: null, totalCoef: 0, totalPoints: 0, moyenne: 0 };
    }
    const noteMax = matieres.length * 20;
    const totalCoef = matieres.reduce((acc, m) => acc + m.coefficient, 0);
    const totalPoints = Number(matieres.reduce((acc, m) => acc + (m.totalPoints ?? (m.moyenne ?? 0) * m.coefficient), 0).toFixed(2));

    const devoirsValides = matieres.filter(m => m.devoir !== null && m.devoir !== undefined);
    const compoValides = matieres.filter(m => m.composition !== null && m.composition !== undefined);

    const bilanDevoir = devoirsValides.length > 0
      ? Number(devoirsValides.reduce((acc, m) => acc + (m.devoir as number), 0).toFixed(2))
      : null;
    const bilanComposition = compoValides.length > 0
      ? Number(compoValides.reduce((acc, m) => acc + (m.composition as number), 0).toFixed(2))
      : null;

    const moyenne = totalCoef > 0 ? Number((totalPoints / totalCoef).toFixed(2)) : 0;
    return { noteMax, bilanDevoir, bilanComposition, totalCoef, totalPoints, moyenne };
  }

  // ── Rendu conditionnel ─────────────────────────────────────────────────────
  if (loading || !computed) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-xl flex items-center gap-3">
          <Icon icon="fa-spinner" className="fa-spin text-blue-600 text-2xl" />
          <span className="text-gray-700">Chargement du bulletin...</span>
        </div>
      </div>
    );
  }

  const {
    student,
    trimestres,
    annuelle,
    rang,
    absences = 0,
    conduite,
    appreciation,
    generatedAt,
  } = bulletinData;

  const {
    litteraires, scientifiques,
    bilanLitt, bilanSci,
    moyLitt, moyScient,
    conduiteNote, totalCoef, totalPoints, noteMaxTotal,
  } = computed;

  const currentTrimester = bulletinData.trimester || 3;
  const trimesterName: Record<number, string> = { 1: '1er', 2: '2e', 3: '3e' };
  const cycle = getCycle(student?.class?.level);

  const hasTableauHonneur = (bulletinData.tableauHonneur ?? '').toLowerCase().includes('félicitations');
  const hasEncouragement = (bulletinData.tableauHonneur ?? '').toLowerCase().includes('encouragement');

  // ── JSX ────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-5xl shadow-2xl max-h-[98vh] overflow-y-auto">

        {/* Barre de contrôle (cachée à l'impression) */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-700 to-blue-900 p-3 flex justify-between items-center z-10 print:hidden">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Icon icon="fa-file-alt" />
            Bulletin — {student?.firstName} {student?.lastName}
          </h3>
          <div className="flex gap-2">
            <button onClick={onPrint} className="px-3 py-1.5 bg-white text-blue-900 rounded-lg hover:bg-gray-100 flex items-center gap-1.5 text-sm font-medium">
              <Icon icon="fa-print" /> Imprimer
            </button>
            <button onClick={onDownload} className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1.5 text-sm font-medium">
              <Icon icon="fa-download" /> PDF
            </button>
            <button onClick={onClose} className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">
              <Icon icon="fa-times" /> Fermer
            </button>
          </div>
        </div>

        {/* ══ CONTENU DU BULLETIN ══════════════════════════════════════════════ */}
        <div className="p-4 bg-white text-[11px]" id="bulletin-print">

          {/* ── En-tête officiel ─────────────────────────────────────────── */}
          <div className="border-2 border-gray-800 p-3 mb-3">
            <div className="flex justify-between items-start gap-2">

              {/* Partie française */}
              <div className="flex-1 text-[10px] leading-4">
                <p className="font-bold uppercase tracking-wide">République du Tchad</p>
                <p className="font-semibold">Unité - Travail - Progrès</p>
                <p className="font-bold mt-1">Ministère de l'Education Nationale</p>
                <p>et de la Promotion Civique</p>
                <p>Direction de l'Enseignement Privé</p>
                <p>Inspection Départementale de l'Education Nationale</p>
                <p>Pour la Commune de N'Djamena IV (IDEN-CN)</p>
              </div>

              {/* Logo cycle */}
              <div className="flex flex-col items-center justify-center px-4">
                <div className="w-20 h-20 border-2 border-gray-800 rounded-full flex flex-col items-center justify-center bg-gray-50">
                  <span className="text-sm font-bold leading-none">{cycle.sup}</span>
                  <span className="text-xs font-bold">{cycle.label}</span>
                </div>
              </div>

              {/* Partie arabe */}
              <div className="flex-1 text-[10px] leading-4 text-right" dir="rtl">
                <p className="font-bold">جمهورية تشاد</p>
                <p>وحدة - عمل - تقدم</p>
                <p className="font-bold mt-1">وزارة التربية الوطنية</p>
                <p>وتطوير التربية المدنية</p>
                <p>إدارة التعليم الأهلي</p>
                <p>المفتشية الإقليمية للتربية الوطنية</p>
                <p>(م ا ت و - ب أ) 4 لبلدية أنجمينا</p>
              </div>
            </div>

            {/* Nom de l'école */}
            <div className="text-center border-t border-b border-gray-400 py-2 my-2">
              <p className="text-sm font-bold text-blue-900">«COMPLEXE SCOLAIRE IBNOU MAHADJIR»</p>
              <p className="text-[10px] italic text-gray-700">" Bien former pour un meilleur résultat "</p>
              <p className="text-[10px] text-gray-600">Tél : 95 91 90 10 / 99 49 14 49 / 66 21 15 78 — Quartier REPOS III. Face Bouta Cochon</p>
            </div>

            {/* Ligne titre / année */}
            <div className="flex justify-between items-center">
              <p className="text-[10px]">Année Scolaire : <strong>2024-2025</strong></p>
              <h2 className="text-base font-bold text-blue-900 underline underline-offset-2">
                Bulletin de Notes du {trimesterName[currentTrimester]} Trimestre
              </h2>
              <p className="text-[10px]" dir="rtl">
                كشف الدرجات الفترة {currentTrimester === 1 ? 'الأولى' : currentTrimester === 2 ? 'الثانية' : 'الثالثة'}
              </p>
            </div>
          </div>

          {/* ── Informations élève ───────────────────────────────────────── */}
          <div className="border-2 border-gray-800 p-2 mb-3 bg-gray-50">
            <div className="flex gap-6">
              <div className="flex items-center gap-2 flex-1">
                <span className="font-bold w-28 shrink-0">Nom de l'élève :</span>
                <span className="border-b-2 border-gray-800 flex-1 font-bold text-sm text-blue-900 px-1">
                  {student?.lastName?.toUpperCase()} {student?.firstName}
                </span>
                <span className="text-[10px] text-gray-500 ml-2" dir="rtl">اسم الطالب</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold w-20 shrink-0">Matricule :</span>
                <span className="border-b-2 border-gray-800 font-mono px-1">{student?.registrationNo}</span>
              </div>
            </div>
            <div className="flex gap-6 mt-1">
              <div className="flex items-center gap-2 flex-1">
                <span className="font-bold w-28 shrink-0">Classe de :</span>
                <span className="border-b-2 border-gray-800 flex-1 font-bold text-sm text-blue-900 px-1 text-center">
                  {student?.class?.name || ''}
                </span>
                <span className="text-[10px] text-gray-500 ml-2" dir="rtl">الصف</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold w-20 shrink-0">Effectif :</span>
                <span className="border-b-2 border-gray-800 px-1">{rang?.total ?? '-'} élèves</span>
              </div>
            </div>
          </div>

          {/* ── Tableau des notes ────────────────────────────────────────── */}
          <div className="mb-3">
            <table className="w-full border-collapse border-2 border-gray-800 text-[10px]">
              <thead>
                <tr className="bg-blue-100">
                  <th className="border-2 border-gray-800 p-1.5 text-left w-1/4">MATIÈRES</th>
                  <th className="border-2 border-gray-800 p-1.5 text-center">Note<br/>max</th>
                  <th className="border-2 border-gray-800 p-1.5 text-center">Moy.<br/>devoir</th>
                  <th className="border-2 border-gray-800 p-1.5 text-center">Moy.<br/>compo</th>
                  <th className="border-2 border-gray-800 p-1.5 text-center">Moyenne<br/>Générale</th>
                  <th className="border-2 border-gray-800 p-1.5 text-center">Coef</th>
                  <th className="border-2 border-gray-800 p-1.5 text-center">Moy.<br/>G×Coef</th>
                  <th className="border-2 border-gray-800 p-1.5 text-center w-1/6">App. du<br/>Professeur</th>
                </tr>
              </thead>
              <tbody>

                {/* ── SECTION LITTÉRAIRE ── */}
                {litteraires.map((m: Matiere, i: number) => (
                  <tr key={`lit-${i}`} className="hover:bg-yellow-50">
                    <td className="border border-gray-500 p-1.5 font-medium">{m.nom}</td>
                    <td className="border border-gray-500 p-1.5 text-center">20</td>
                    <td className="border border-gray-500 p-1.5 text-center">{fmt(m.devoir)}</td>
                    <td className="border border-gray-500 p-1.5 text-center">{fmt(m.composition)}</td>
                    <td className="border border-gray-500 p-1.5 text-center font-bold text-blue-700">{fmt(m.moyenne)}</td>
                    <td className="border border-gray-500 p-1.5 text-center">{m.coefficient}</td>
                    <td className="border border-gray-500 p-1.5 text-center font-bold text-green-700">
                      {fmt(m.moyenne != null ? m.moyenne * m.coefficient : null)}
                    </td>
                    <td className="border border-gray-500 p-1.5 text-center italic text-gray-600">{m.appreciation || '-'}</td>
                  </tr>
                ))}

                {/* Bilan Littéraire */}
                <tr className="bg-yellow-100 font-bold">
                  <td className="border-2 border-gray-800 p-1.5 pl-4">Bilan littéraire</td>
                  <td className="border-2 border-gray-800 p-1.5 text-center">{bilanLitt.noteMax}</td>
                  <td className="border-2 border-gray-800 p-1.5 text-center">{fmt(bilanLitt.bilanDevoir)}</td>
                  <td className="border-2 border-gray-800 p-1.5 text-center">{fmt(bilanLitt.bilanComposition)}</td>
                  <td className="border-2 border-gray-800 p-1.5 text-center">-</td>
                  <td className="border-2 border-gray-800 p-1.5 text-center">{bilanLitt.totalCoef}</td>
                  <td className="border-2 border-gray-800 p-1.5 text-center text-blue-800">{fmt(bilanLitt.totalPoints)}</td>
                  <td className="border-2 border-gray-800 p-1.5 text-center">-</td>
                </tr>

                {/* Moy. Littéraire */}
                <tr className="bg-yellow-50 font-bold">
                  <td className="border-2 border-gray-800 p-1.5 pl-4">Moy. littéraire</td>
                  <td className="border-2 border-gray-800 p-1.5 text-center">-</td>
                  <td className="border-2 border-gray-800 p-1.5 text-center">-</td>
                  <td className="border-2 border-gray-800 p-1.5 text-center">-</td>
                  <td className="border-2 border-gray-800 p-1.5 text-center text-blue-800 text-sm">{fmt(moyLitt)}</td>
                  <td className="border-2 border-gray-800 p-1.5 text-center">-</td>
                  <td className="border-2 border-gray-800 p-1.5 text-center">-</td>
                  <td className="border-2 border-gray-800 p-1.5 text-center">-</td>
                </tr>

                {/* ── SECTION SCIENTIFIQUE ── */}
                {scientifiques.map((m: Matiere, i: number) => (
                  <tr key={`sci-${i}`} className="hover:bg-green-50">
                    <td className="border border-gray-500 p-1.5 font-medium">{m.nom}</td>
                    <td className="border border-gray-500 p-1.5 text-center">20</td>
                    <td className="border border-gray-500 p-1.5 text-center">{fmt(m.devoir)}</td>
                    <td className="border border-gray-500 p-1.5 text-center">{fmt(m.composition)}</td>
                    <td className="border border-gray-500 p-1.5 text-center font-bold text-blue-700">{fmt(m.moyenne)}</td>
                    <td className="border border-gray-500 p-1.5 text-center">{m.coefficient}</td>
                    <td className="border border-gray-500 p-1.5 text-center font-bold text-green-700">
                      {fmt(m.moyenne != null ? m.moyenne * m.coefficient : null)}
                    </td>
                    <td className="border border-gray-500 p-1.5 text-center italic text-gray-600">{m.appreciation || '-'}</td>
                  </tr>
                ))}

                {/* Bilan Scientifique */}
                <tr className="bg-green-100 font-bold">
                  <td className="border-2 border-gray-800 p-1.5 pl-4">Bilan scientifique</td>
                  <td className="border-2 border-gray-800 p-1.5 text-center">{bilanSci.noteMax}</td>
                  <td className="border-2 border-gray-800 p-1.5 text-center">{fmt(bilanSci.bilanDevoir)}</td>
                  <td className="border-2 border-gray-800 p-1.5 text-center">{fmt(bilanSci.bilanComposition)}</td>
                  <td className="border-2 border-gray-800 p-1.5 text-center">-</td>
                  <td className="border-2 border-gray-800 p-1.5 text-center">{bilanSci.totalCoef}</td>
                  <td className="border-2 border-gray-800 p-1.5 text-center text-blue-800">{fmt(bilanSci.totalPoints)}</td>
                  <td className="border-2 border-gray-800 p-1.5 text-center">-</td>
                </tr>

                {/* Moy. Scientifique */}
                <tr className="bg-green-50 font-bold">
                  <td className="border-2 border-gray-800 p-1.5 pl-4">Moy. scientifique</td>
                  <td className="border-2 border-gray-800 p-1.5 text-center">-</td>
                  <td className="border-2 border-gray-800 p-1.5 text-center">-</td>
                  <td className="border-2 border-gray-800 p-1.5 text-center">-</td>
                  <td className="border-2 border-gray-800 p-1.5 text-center text-blue-800 text-sm">{fmt(moyScient)}</td>
                  <td className="border-2 border-gray-800 p-1.5 text-center">-</td>
                  <td className="border-2 border-gray-800 p-1.5 text-center">-</td>
                  <td className="border-2 border-gray-800 p-1.5 text-center">-</td>
                </tr>

                {/* ── CONDUITE ── */}
                <tr className="hover:bg-purple-50">
                  <td className="border border-gray-500 p-1.5 font-medium">
                    Conduite
                    {conduite?.autoCalculated === false && (
                      <span className="ml-1 text-[8px] bg-blue-100 text-blue-700 px-1 rounded">Manuel</span>
                    )}
                  </td>
                  <td className="border border-gray-500 p-1.5 text-center">20</td>
                  <td className="border border-gray-500 p-1.5 text-center">-</td>
                  <td className="border border-gray-500 p-1.5 text-center">-</td>
                  <td className="border border-gray-500 p-1.5 text-center font-bold text-blue-700">
                    {conduiteNote !== null ? fmt(conduiteNote) : (
                      <span className="text-orange-500 italic">À saisir</span>
                    )}
                  </td>
                  <td className="border border-gray-500 p-1.5 text-center">1</td>
                  <td className="border border-gray-500 p-1.5 text-center font-bold text-green-700">
                    {conduiteNote !== null ? fmt(conduiteNote * 1) : '-'}
                  </td>
                  <td className="border border-gray-500 p-1.5 text-center italic text-gray-600">
                    {conduite?.appreciation || 'Le Conseil'}
                  </td>
                </tr>

                {/* ── TOTAL ── */}
                <tr className="bg-blue-200 font-bold text-sm">
                  <td className="border-2 border-gray-800 p-1.5">TOTAL</td>
                  <td className="border-2 border-gray-800 p-1.5 text-center">{noteMaxTotal}</td>
                  <td className="border-2 border-gray-800 p-1.5 text-center">-</td>
                  <td className="border-2 border-gray-800 p-1.5 text-center">-</td>
                  <td className="border-2 border-gray-800 p-1.5 text-center">-</td>
                  <td className="border-2 border-gray-800 p-1.5 text-center">{totalCoef}</td>
                  <td className="border-2 border-gray-800 p-1.5 text-center text-blue-900">{fmt(totalPoints)}</td>
                  <td className="border-2 border-gray-800 p-1.5 text-center">-</td>
                </tr>

              </tbody>
            </table>
          </div>

          {/* ── Section inférieure (3 colonnes) ─────────────────────────── */}
          <div className="border-2 border-gray-800">
            <div className="grid grid-cols-3 divide-x-2 divide-gray-800">

              {/* Col 1 : Résultats */}
              <div className="p-2 space-y-1 bg-gray-50">
                <h4 className="font-bold text-blue-900 border-b border-gray-400 pb-1 mb-2">RÉSULTATS</h4>

                <div className="flex justify-between text-[10px]">
                  <span>Moy. du 1er Trimestre :</span>
                  <span className="font-bold">
                    {trimestres?.trimestre1 ? fmt(trimestres.trimestre1) : '-'}/20
                  </span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Moy. du 2e Trimestre :</span>
                  <span className="font-bold">
                    {trimestres?.trimestre2 ? fmt(trimestres.trimestre2) : '-'}/20
                  </span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Moy. du 3e Trimestre :</span>
                  <span className="font-bold text-blue-700">
                    {trimestres?.trimestre3 ? fmt(trimestres.trimestre3) : fmt(bulletinData.moyennes?.generale)}/20
                  </span>
                </div>
                <div className="flex justify-between text-[10px] border-t border-gray-300 pt-1 mt-1">
                  <span className="font-bold text-purple-700">Moyenne annuelle :</span>
                  <span className="font-bold text-purple-700 text-sm">
                    {annuelle ? fmt(annuelle) : fmt(bulletinData.moyennes?.generale)}/20
                  </span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Rang :</span>
                  <span className="font-bold">
                    {rang?.position
                      ? <>{rang.position}<sup>e</sup> / {rang.total} élèves</>
                      : '-'
                    }
                  </span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Absences :</span>
                  <span className="font-bold text-red-600">{absences || 0} jours</span>
                </div>

                {/* Info punitions et conduite */}
                {(conduite?.totalHeuresColle ?? 0) > 0 && (
                  <div className="mt-1 pt-1 border-t border-orange-200">
                    <div className="flex justify-between text-[10px] text-orange-700">
                      <span>Heures de colle :</span>
                      <span className="font-bold">{conduite!.totalHeuresColle}h</span>
                    </div>
                    {conduite?.noteAutoCalculee !== null && conduite?.noteAutoCalculee !== undefined && (
                      <div className="flex justify-between text-[10px] text-orange-700">
                        <span>Note conduite (auto) :</span>
                        <span className="font-bold">{fmt(conduite.noteAutoCalculee)}/20</span>
                      </div>
                    )}
                    {conduite?.manualNote !== null && conduite?.manualNote !== undefined && (
                      <div className="flex justify-between text-[10px] text-blue-700">
                        <span>Note conduite (Directeur) :</span>
                        <span className="font-bold">{fmt(conduite.manualNote)}/20</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Col 2 : Distinctions & Sanctions */}
              <div className="p-2 bg-white">
                <h4 className="font-bold text-green-700 mb-1">Distinctions Particulières</h4>
                <div className="space-y-0.5 text-[10px] mb-3">
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" className="w-3 h-3 border border-gray-600" readOnly
                           checked={hasTableauHonneur} />
                    <span>Félicitations</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" className="w-3 h-3 border border-gray-600" readOnly
                           checked={hasEncouragement} />
                    <span>Encouragement</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" className="w-3 h-3 border border-gray-600" readOnly
                           checked={hasTableauHonneur} />
                    <span>Tableau d'honneur</span>
                  </label>
                </div>

                <h4 className="font-bold text-red-700 mb-1">Sanctions :</h4>
                <div className="space-y-0.5 text-[10px]">
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" className="w-3 h-3 border border-gray-600" readOnly />
                    <span>Avertissement de Travail</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" className="w-3 h-3 border border-gray-600" readOnly />
                    <span>Avertissement de Conduite</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" className="w-3 h-3 border border-gray-600" readOnly />
                    <span>Blâme de Travail</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" className="w-3 h-3 border border-gray-600" readOnly />
                    <span>Blâme de Conduite</span>
                  </label>
                </div>
              </div>

              {/* Col 3 : Appréciations + Signature */}
              <div className="p-2 bg-gray-50">
                <h4 className="font-bold text-blue-900 mb-1">Appréciations du Professeur Principal</h4>
                <div className="border border-gray-400 min-h-[60px] p-1.5 bg-white mb-2 rounded text-[10px] italic text-gray-800">
                  {appreciation || ''}
                </div>
                <div className="border border-gray-400 min-h-[28px] p-1.5 bg-white rounded text-[10px] font-medium text-center text-gray-800">
                  {appreciation?.toLowerCase().includes('baccalauréat')
                    ? 'Admis au Baccalauréat'
                    : appreciation?.toLowerCase().includes('admis')
                      ? 'Admis en classe supérieure'
                      : ''}
                </div>

                <div className="mt-2 pt-1 border-t border-gray-400 text-[10px]">
                  <p className="text-gray-600">
                    Fait à N'Djamena, le{' '}
                    <span className="font-bold">
                      {generatedAt
                        ? new Date(generatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
                        : new Date().toLocaleDateString('fr-FR')}
                    </span>
                  </p>
                  <p className="font-bold text-center mt-2">Visa du Proviseur</p>
                  <div className="h-10 border-b border-gray-400 mt-1"></div>
                </div>
              </div>

            </div>
          </div>

          {/* Note de bas de page */}
          <p className="mt-2 text-center text-[9px] text-gray-500 italic">
            N.B : toute rature ou modification annule ce bulletin
          </p>
        </div>
        {/* ── FIN CONTENU ── */}

      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #bulletin-print, #bulletin-print * { visibility: visible; }
          #bulletin-print {
            position: absolute; left: 0; top: 0;
            width: 100%; padding: 8px; font-size: 10px;
          }
        }
      `}</style>
    </div>
  );
}