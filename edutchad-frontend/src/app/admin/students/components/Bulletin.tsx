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

/** Calcule l'année scolaire réelle basée sur la date actuelle */
const getSchoolYear = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0 = Janvier, 8 = Septembre
  
  // Si on est entre septembre et décembre, l'année scolaire est year-year+1
  // Si on est entre janvier et août, l'année scolaire est year-1-year
  if (month >= 8) { // Septembre et après
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

// ─── Composant Cachet Directeur ───────────────────────────────────────────────

const DirectorStamp = () => (
  <div className="absolute -top-8 -right-4 opacity-80 pointer-events-none transform rotate-[-12deg]">
    <svg width="140" height="140" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      {/* Cercle extérieur */}
      <circle cx="100" cy="100" r="95" fill="none" stroke="#1e40af" strokeWidth="3" strokeDasharray="4,2" opacity="0.9" />
      <circle cx="100" cy="100" r="88" fill="none" stroke="#1e40af" strokeWidth="1.5" opacity="0.7" />
      
      {/* Texte circulaire supérieur */}
      <path id="circlePathTop" d="M 30,100 A 70,70 0 0,1 170,100" fill="none" />
      <text fill="#1e40af" fontSize="14" fontWeight="bold" letterSpacing="3">
        <textPath href="#circlePathTop" startOffset="50%" textAnchor="middle">
          ZANOUTECH
        </textPath>
      </text>
      
      {/* Texte circulaire inférieur */}
      <path id="circlePathBottom" d="M 30,100 A 70,70 0 0,0 170,100" fill="none" />
      <text fill="#1e40af" fontSize="13" fontWeight="bold" letterSpacing="2">
        <textPath href="#circlePathBottom" startOffset="50%" textAnchor="middle">
          INOVATION HUB
        </textPath>
      </text>
      
      {/* Étoiles */}
      <text x="35" y="105" fill="#1e40af" fontSize="16">★</text>
      <text x="150" y="105" fill="#1e40af" fontSize="16">★</text>
      
      {/* Texte central */}
      <text x="100" y="88" fill="#1e40af" fontSize="18" fontWeight="bold" textAnchor="middle">LE</text>
      <text x="100" y="115" fill="#1e40af" fontSize="16" fontWeight="bold" textAnchor="middle">Responsable</text>
      
      {/* Ligne de signature */}
      <path d="M 60,130 Q 100,125 140,132" fill="none" stroke="#1e40af" strokeWidth="1.5" opacity="0.6" />
      <path d="M 70,135 Q 100,128 130,138" fill="none" stroke="#1e40af" strokeWidth="1" opacity="0.4" />
    </svg>
  </div>
);

// ─── Composant Principal ──────────────────────────────────────────────────────

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

    const bilanLitt: BilanSection = d.bilans?.litteraire ?? calcBilan(litteraires);
    const bilanSci: BilanSection = d.bilans?.scientifique ?? calcBilan(scientifiques);

    const conduiteNote: number | null = d.conduite?.note ?? d.moyennes?.conduite ?? null;

    const totalCoef = bilanLitt.totalCoef + bilanSci.totalCoef + 1;
    const totalPoints = Number((bilanLitt.totalPoints + bilanSci.totalPoints + (conduiteNote ?? 0)).toFixed(2));
    const noteMaxTotal = bilanLitt.noteMax + bilanSci.noteMax + 20;

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
          <Icon icon="fa-spinner" className="fa-spin text-green-700 text-2xl" />
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
  const schoolYear = getSchoolYear();

  const hasTableauHonneur = (bulletinData.tableauHonneur ?? '').toLowerCase().includes('félicitations');
  const hasEncouragement = (bulletinData.tableauHonneur ?? '').toLowerCase().includes('encouragement');

  // Calcul de la moyenne annuelle (T1+T2+T3)/3
  const getAnnualAverage = () => {
    const t1 = trimestres?.trimestre1 ?? null;
    const t2 = trimestres?.trimestre2 ?? null;
    const t3 = trimestres?.trimestre3 ?? bulletinData.moyennes?.generale ?? null;
    if (t1 !== null && t2 !== null && t3 !== null) {
      return (t1 + t2 + t3) / 3;
    }
    return annuelle ?? bulletinData.moyennes?.generale ?? null;
  };

  // ── JSX ────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 overflow-y-auto">
      <div className="bg-green-900 rounded-lg w-full max-w-5xl shadow-2xl max-h-[98vh] overflow-y-auto">

        {/* Barre de contrôle (cachée à l'impression) */}
        <div className="sticky top-0 bg-gradient-to-r from-green-800 to-green-950 p-3 flex justify-between items-center z-10 print:hidden">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Icon icon="fa-file-alt" />
            Bulletin — {student?.firstName} {student?.lastName}
          </h3>
          <div className="flex gap-2">
            <button onClick={onPrint} className="px-3 py-1.5 bg-white text-green-900 rounded-lg hover:bg-gray-100 flex items-center gap-1.5 text-sm font-medium">
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
        <div className="p-4 bg-green-900 text-[11px]" id="bulletin-print">

          {/* ── En-tête officiel ─────────────────────────────────────────── */}
          <div className="border-2 border-green-700 p-3 mb-3 bg-green-50">
            <div className="flex justify-between items-start gap-2">

              {/* Partie française */}
              <div className="flex-1 text-[10px] leading-4 text-green-950">
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
                <div className="w-20 h-20 border-2 border-green-800 rounded-full flex flex-col items-center justify-center bg-green-100">
                  <span className="text-sm font-bold leading-none text-green-900">{cycle.sup}</span>
                  <span className="text-xs font-bold text-green-800">{cycle.label}</span>
                </div>
              </div>

              {/* Partie arabe */}
              <div className="flex-1 text-[10px] leading-4 text-right text-green-950" dir="rtl">
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
            <div className="text-center border-t border-b border-green-400 py-2 my-2">
              <p className="text-sm font-bold text-green-900">«COMPLEXE SCOLAIRE IBNOU MAHADJIR»</p>
              <p className="text-[10px] italic text-green-800">" Bien former pour un meilleur résultat "</p>
              <p className="text-[10px] text-green-700">Tél : 95 91 90 10 / 99 49 14 49 / 66 21 15 78 — Quartier REPOS III. Face Bouta Cochon</p>
            </div>

            {/* Ligne titre / année */}
            <div className="flex justify-between items-center">
              <p className="text-[10px] text-green-950">Année Scolaire : <strong>{schoolYear}</strong></p>
              <h2 className="text-base font-bold text-green-900 underline underline-offset-2">
                Bulletin de Notes du {trimesterName[currentTrimester]} Trimestre
              </h2>
              <p className="text-[10px] text-green-950" dir="rtl">
                كشف الدرجات الفترة {currentTrimester === 1 ? 'الأولى' : currentTrimester === 2 ? 'الثانية' : 'الثالثة'}
              </p>
            </div>
          </div>

          {/* ── Informations élève ───────────────────────────────────────── */}
          <div className="border-2 border-green-700 p-2 mb-3 bg-green-50">
            <div className="flex gap-6">
              <div className="flex items-center gap-2 flex-1">
                <span className="font-bold w-28 shrink-0 text-green-950">Nom de l'élève :</span>
                <span className="border-b-2 border-green-800 flex-1 font-bold text-sm text-green-900 px-1">
                  {student?.lastName?.toUpperCase()} {student?.firstName}
                </span>
                <span className="text-[10px] text-green-700 ml-2" dir="rtl">اسم الطالب</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold w-20 shrink-0 text-green-950">Matricule :</span>
                <span className="border-b-2 border-green-800 font-mono px-1 text-green-900">{student?.registrationNo}</span>
              </div>
            </div>
            <div className="flex gap-6 mt-1">
              <div className="flex items-center gap-2 flex-1">
                <span className="font-bold w-28 shrink-0 text-green-950">Classe de :</span>
                <span className="border-b-2 border-green-800 flex-1 font-bold text-sm text-green-900 px-1 text-center">
                  {student?.class?.name || ''}
                </span>
                <span className="text-[10px] text-green-700 ml-2" dir="rtl">الصف</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold w-20 shrink-0 text-green-950">Effectif :</span>
                <span className="border-b-2 border-green-800 px-1 text-green-900">{rang?.total ?? '-'} élèves</span>
              </div>
            </div>
          </div>

          {/* ── Tableau des notes ────────────────────────────────────────── */}
          <div className="mb-3">
            <table className="w-full border-collapse border-2 border-green-800 text-[10px]">
              <thead>
                <tr className="bg-green-200">
                  <th className="border-2 border-green-800 p-1.5 text-left w-1/4 text-green-950">MATIÈRES</th>
                  <th className="border-2 border-green-800 p-1.5 text-center text-green-950">Note<br/>max</th>
                  <th className="border-2 border-green-800 p-1.5 text-center text-green-950">Moy.<br/>devoir</th>
                  <th className="border-2 border-green-800 p-1.5 text-center text-green-950">Moy.<br/>compo</th>
                  <th className="border-2 border-green-800 p-1.5 text-center text-green-950">Moyenne<br/>Générale</th>
                  <th className="border-2 border-green-800 p-1.5 text-center text-green-950">Coef</th>
                  <th className="border-2 border-green-800 p-1.5 text-center text-green-950">Moy.<br/>G×Coef</th>
                  <th className="border-2 border-green-800 p-1.5 text-center w-1/6 text-green-950">App. du<br/>Professeur</th>
                </tr>
              </thead>
              <tbody>

                {/* ── SECTION LITTÉRAIRE ── */}
                {litteraires.map((m: Matiere, i: number) => (
                  <tr key={`lit-${i}`} className="hover:bg-green-100 bg-green-50/50">
                    <td className="border border-green-600 p-1.5 font-medium text-green-950">{m.nom}</td>
                    <td className="border border-green-600 p-1.5 text-center text-green-900">20</td>
                    <td className="border border-green-600 p-1.5 text-center text-green-900">{fmt(m.devoir)}</td>
                    <td className="border border-green-600 p-1.5 text-center text-green-900">{fmt(m.composition)}</td>
                    <td className="border border-green-600 p-1.5 text-center font-bold text-green-800">{fmt(m.moyenne)}</td>
                    <td className="border border-green-600 p-1.5 text-center text-green-900">{m.coefficient}</td>
                    <td className="border border-green-600 p-1.5 text-center font-bold text-green-700">
                      {fmt(m.moyenne != null ? m.moyenne * m.coefficient : null)}
                    </td>
                    <td className="border border-green-600 p-1.5 text-center italic text-green-800">{m.appreciation || '-'}</td>
                  </tr>
                ))}

                {/* Bilan Littéraire */}
                <tr className="bg-green-200 font-bold">
                  <td className="border-2 border-green-800 p-1.5 pl-4 text-green-950">Bilan littéraire</td>
                  <td className="border-2 border-green-800 p-1.5 text-center text-green-900">{bilanLitt.noteMax}</td>
                  <td className="border-2 border-green-800 p-1.5 text-center text-green-900">{fmt(bilanLitt.bilanDevoir)}</td>
                  <td className="border-2 border-green-800 p-1.5 text-center text-green-900">{fmt(bilanLitt.bilanComposition)}</td>
                  <td className="border-2 border-green-800 p-1.5 text-center text-green-900">-</td>
                  <td className="border-2 border-green-800 p-1.5 text-center text-green-900">{bilanLitt.totalCoef}</td>
                  <td className="border-2 border-green-800 p-1.5 text-center text-green-800">{fmt(bilanLitt.totalPoints)}</td>
                  <td className="border-2 border-green-800 p-1.5 text-center text-green-900">-</td>
                </tr>

                {/* Moy. Littéraire */}
                <tr className="bg-green-100 font-bold">
                  <td className="border-2 border-green-800 p-1.5 pl-4 text-green-950">Moy. littéraire</td>
                  <td className="border-2 border-green-800 p-1.5 text-center text-green-900">-</td>
                  <td className="border-2 border-green-800 p-1.5 text-center text-green-900">-</td>
                  <td className="border-2 border-green-800 p-1.5 text-center text-green-900">-</td>
                  <td className="border-2 border-green-800 p-1.5 text-center text-green-800 text-sm">{fmt(moyLitt)}</td>
                  <td className="border-2 border-green-800 p-1.5 text-center text-green-900">-</td>
                  <td className="border-2 border-green-800 p-1.5 text-center text-green-900">-</td>
                  <td className="border-2 border-green-800 p-1.5 text-center text-green-900">-</td>
                </tr>

                {/* ── SECTION SCIENTIFIQUE ── */}
                {scientifiques.map((m: Matiere, i: number) => (
                  <tr key={`sci-${i}`} className="hover:bg-green-100 bg-green-50/50">
                    <td className="border border-green-600 p-1.5 font-medium text-green-950">{m.nom}</td>
                    <td className="border border-green-600 p-1.5 text-center text-green-900">20</td>
                    <td className="border border-green-600 p-1.5 text-center text-green-900">{fmt(m.devoir)}</td>
                    <td className="border border-green-600 p-1.5 text-center text-green-900">{fmt(m.composition)}</td>
                    <td className="border border-green-600 p-1.5 text-center font-bold text-green-800">{fmt(m.moyenne)}</td>
                    <td className="border border-green-600 p-1.5 text-center text-green-900">{m.coefficient}</td>
                    <td className="border border-green-600 p-1.5 text-center font-bold text-green-700">
                      {fmt(m.moyenne != null ? m.moyenne * m.coefficient : null)}
                    </td>
                    <td className="border border-green-600 p-1.5 text-center italic text-green-800">{m.appreciation || '-'}</td>
                  </tr>
                ))}

                {/* Bilan Scientifique */}
                <tr className="bg-green-200 font-bold">
                  <td className="border-2 border-green-800 p-1.5 pl-4 text-green-950">Bilan scientifique</td>
                  <td className="border-2 border-green-800 p-1.5 text-center text-green-900">{bilanSci.noteMax}</td>
                  <td className="border-2 border-green-800 p-1.5 text-center text-green-900">{fmt(bilanSci.bilanDevoir)}</td>
                  <td className="border-2 border-green-800 p-1.5 text-center text-green-900">{fmt(bilanSci.bilanComposition)}</td>
                  <td className="border-2 border-green-800 p-1.5 text-center text-green-900">-</td>
                  <td className="border-2 border-green-800 p-1.5 text-center text-green-900">{bilanSci.totalCoef}</td>
                  <td className="border-2 border-green-800 p-1.5 text-center text-green-800">{fmt(bilanSci.totalPoints)}</td>
                  <td className="border-2 border-green-800 p-1.5 text-center text-green-900">-</td>
                </tr>

                {/* Moy. Scientifique */}
                <tr className="bg-green-100 font-bold">
                  <td className="border-2 border-green-800 p-1.5 pl-4 text-green-950">Moy. scientifique</td>
                  <td className="border-2 border-green-800 p-1.5 text-center text-green-900">-</td>
                  <td className="border-2 border-green-800 p-1.5 text-center text-green-900">-</td>
                  <td className="border-2 border-green-800 p-1.5 text-center text-green-900">-</td>
                  <td className="border-2 border-green-800 p-1.5 text-center text-green-800 text-sm">{fmt(moyScient)}</td>
                  <td className="border-2 border-green-800 p-1.5 text-center text-green-900">-</td>
                  <td className="border-2 border-green-800 p-1.5 text-center text-green-900">-</td>
                  <td className="border-2 border-green-800 p-1.5 text-center text-green-900">-</td>
                </tr>

                {/* ── CONDUITE ── */}
                <tr className="hover:bg-green-100 bg-green-50/50">
                  <td className="border border-green-600 p-1.5 font-medium text-green-950">
                    Conduite
                    {conduite?.autoCalculated === false && (
                      <span className="ml-1 text-[8px] bg-green-200 text-green-800 px-1 rounded">Manuel</span>
                    )}
                  </td>
                  <td className="border border-green-600 p-1.5 text-center text-green-900">20</td>
                  <td className="border border-green-600 p-1.5 text-center text-green-900">-</td>
                  <td className="border border-green-600 p-1.5 text-center text-green-900">-</td>
                  <td className="border border-green-600 p-1.5 text-center font-bold text-green-800">
                    {conduiteNote !== null ? fmt(conduiteNote) : (
                      <span className="text-orange-600 italic">À saisir</span>
                    )}
                  </td>
                  <td className="border border-green-600 p-1.5 text-center text-green-900">1</td>
                  <td className="border border-green-600 p-1.5 text-center font-bold text-green-700">
                    {conduiteNote !== null ? fmt(conduiteNote * 1) : '-'}
                  </td>
                  <td className="border border-green-600 p-1.5 text-center italic text-green-800">
                    {conduite?.appreciation || 'Le Conseil'}
                  </td>
                </tr>

                {/* ── TOTAL ── */}
                <tr className="bg-green-300 font-bold text-sm">
                  <td className="border-2 border-green-800 p-1.5 text-green-950">TOTAL</td>
                  <td className="border-2 border-green-800 p-1.5 text-center text-green-900">{noteMaxTotal}</td>
                  <td className="border-2 border-green-800 p-1.5 text-center text-green-900">-</td>
                  <td className="border-2 border-green-800 p-1.5 text-center text-green-900">-</td>
                  <td className="border-2 border-green-800 p-1.5 text-center text-green-900">-</td>
                  <td className="border-2 border-green-800 p-1.5 text-center text-green-900">{totalCoef}</td>
                  <td className="border-2 border-green-800 p-1.5 text-center text-green-900">{fmt(totalPoints)}</td>
                  <td className="border-2 border-green-800 p-1.5 text-center text-green-900">-</td>
                </tr>

              </tbody>
            </table>
          </div>

          {/* ── Section inférieure (3 colonnes) ─────────────────────────── */}
          <div className="border-2 border-green-800 bg-green-50">
            <div className="grid grid-cols-3 divide-x-2 divide-green-800">

              {/* Col 1 : Résultats */}
              <div className="p-2 space-y-1 bg-green-50">
                <h4 className="font-bold text-green-900 border-b border-green-400 pb-1 mb-2">RÉSULTATS</h4>

                {/* 1er trimestre : toujours affiché */}
                <div className="flex justify-between text-[10px] text-green-950">
                  <span>Moy. du 1er Trimestre :</span>
                  <span className="font-bold text-green-900">
                    {trimestres?.trimestre1 ? fmt(trimestres.trimestre1) : '-'}/20
                  </span>
                </div>

                {/* 2ème trimestre : affiché à partir du T2 */}
                {currentTrimester >= 2 && (
                  <div className="flex justify-between text-[10px] text-green-950">
                    <span>Moy. du 2e Trimestre :</span>
                    <span className="font-bold text-green-900">
                      {trimestres?.trimestre2 ? fmt(trimestres.trimestre2) : '-'}/20
                    </span>
                  </div>
                )}

                {/* 3ème trimestre : affiché seulement au T3 */}
                {currentTrimester === 3 && (
                  <div className="flex justify-between text-[10px] text-green-950">
                    <span>Moy. du 3e Trimestre :</span>
                    <span className="font-bold text-green-800">
                      {trimestres?.trimestre3 ? fmt(trimestres.trimestre3) : fmt(bulletinData.moyennes?.generale)}/20
                    </span>
                  </div>
                )}

                {/* Moyenne annuelle : seulement au T3 */}
                {currentTrimester === 3 && (
                  <div className="flex justify-between text-[10px] border-t border-green-300 pt-1 mt-1">
                    <span className="font-bold text-green-900">Moyenne annuelle :</span>
                    <span className="font-bold text-green-900 text-sm">
                      {(() => {
                        const annual = getAnnualAverage();
                        return annual !== null ? fmt(annual) : '-';
                      })()}/20
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-[10px] text-green-950">
                  <span>Rang :</span>
                  <span className="font-bold text-green-900">
                    {rang?.position
                      ? <>{rang.position}<sup>e</sup> / {rang.total} élèves</>
                      : '-'
                    }
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-green-950">
                  <span>Absences :</span>
                  <span className="font-bold text-red-700">{absences || 0} jours</span>
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
                      <div className="flex justify-between text-[10px] text-green-800">
                        <span>Note conduite (Directeur) :</span>
                        <span className="font-bold">{fmt(conduite.manualNote)}/20</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Col 2 : Distinctions & Sanctions */}
              <div className="p-2 bg-green-50">
                <h4 className="font-bold text-green-800 mb-1">Distinctions Particulières</h4>
                <div className="space-y-0.5 text-[10px] mb-3 text-green-950">
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" className="w-3 h-3 border border-green-600 accent-green-700" readOnly
                           checked={hasTableauHonneur} />
                    <span>Félicitations</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" className="w-3 h-3 border border-green-600 accent-green-700" readOnly
                           checked={hasEncouragement} />
                    <span>Encouragement</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" className="w-3 h-3 border border-green-600 accent-green-700" readOnly
                           checked={hasTableauHonneur} />
                    <span>Tableau d'honneur</span>
                  </label>
                </div>

                <h4 className="font-bold text-red-700 mb-1">Sanctions :</h4>
                <div className="space-y-0.5 text-[10px] text-green-950">
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" className="w-3 h-3 border border-green-600 accent-green-700" readOnly />
                    <span>Avertissement de Travail</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" className="w-3 h-3 border border-green-600 accent-green-700" readOnly />
                    <span>Avertissement de Conduite</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" className="w-3 h-3 border border-green-600 accent-green-700" readOnly />
                    <span>Blâme de Travail</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" className="w-3 h-3 border border-green-600 accent-green-700" readOnly />
                    <span>Blâme de Conduite</span>
                  </label>
                </div>
              </div>

              {/* Col 3 : Appréciations + Signature + Cachet */}
              <div className="p-2 bg-green-50 relative">
                <h4 className="font-bold text-green-900 mb-1">Appréciations du Professeur Principal</h4>
                <div className="border border-green-400 min-h-[60px] p-1.5 bg-white mb-2 rounded text-[10px] italic text-green-950">
                  {appreciation || ''}
                </div>
                <div className="border border-green-400 min-h-[28px] p-1.5 bg-white rounded text-[10px] font-medium text-center text-green-950">
                  {appreciation?.toLowerCase().includes('baccalauréat')
                    ? 'Admis au Baccalauréat'
                    : appreciation?.toLowerCase().includes('admis')
                      ? 'Admis en classe supérieure'
                      : ''}
                </div>

                <div className="mt-2 pt-1 border-t border-green-400 text-[10px] relative">
                  <p className="text-green-800">
                    Fait à N'Djamena, le{' '}
                    <span className="font-bold text-green-950">
                      {generatedAt
                        ? new Date(generatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
                        : new Date().toLocaleDateString('fr-FR')}
                    </span>
                  </p>
                  <p className="font-bold text-center mt-2 text-green-950">Visa du Proviseur</p>
                  <div className="h-10 border-b border-green-400 mt-1 relative">
                    {/* Cachet du Directeur */}
                    <DirectorStamp />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Note de bas de page */}
          <p className="mt-2 text-center text-[9px] text-green-300 italic">
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
            background-color: #14532d !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          #bulletin-print .bg-green-900 { background-color: #14532d !important; }
          #bulletin-print .bg-green-50 { background-color: #f0fdf4 !important; }
          #bulletin-print .bg-green-100 { background-color: #dcfce7 !important; }
          #bulletin-print .bg-green-200 { background-color: #bbf7d0 !important; }
          #bulletin-print .bg-green-300 { background-color: #86efac !important; }
          #bulletin-print .text-green-950 { color: #052e16 !important; }
          #bulletin-print .text-green-900 { color: #14532d !important; }
          #bulletin-print .text-green-800 { color: #166534 !important; }
          #bulletin-print .text-green-700 { color: #15803d !important; }
          #bulletin-print .border-green-800 { border-color: #166534 !important; }
          #bulletin-print .border-green-700 { border-color: #15803d !important; }
          #bulletin-print .border-green-600 { border-color: #16a34a !important; }
          #bulletin-print .border-green-400 { border-color: #4ade80 !important; }
          #bulletin-print .border-green-300 { border-color: #86efac !important; }
        }
      `}</style>
    </div>
  );
}