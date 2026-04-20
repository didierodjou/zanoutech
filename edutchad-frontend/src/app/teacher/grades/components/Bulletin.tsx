// src/app/admin/students/components/Bulletin.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';

interface Matiere {
  id?: string;
  nom: string;
  moyenne?: number;
  note?: number;
  coefficient?: number;
  categorie?: string;
  appreciation?: string;
  devoir?: number;
  composition?: number;
  totalPoints?: number;
}

interface BulletinData {
  student: {
    firstName: string;
    lastName: string;
    registrationNo: string;
    class?: {
      name: string;
      level: string;
    } | null;
  };
  period?: string;
  trimester?: number;
  matieres: Matiere[];
  matieresLitteraires?: Matiere[];
  matieresScientifiques?: Matiere[];
  moyennes?: {
    litteraire: number;
    scientifique: number;
    generale: number;
    conduite: number;
  };
  trimestres?: {
    trimestre1: number;
    trimestre2: number;
    trimestre3: number;
  };
  annuelle?: number;
  rang?: {
    position: number;
    total: number;
  };
  absences?: number;
  conduite?: {
    note: number;
    appreciation: string;
  };
  appreciation?: string;
  tableauHonneur?: string;
  generalAverage?: number;
  subjects?: any[];
  generatedAt: string;
}

interface BulletinProps {
  bulletinData: BulletinData;
  onClose: () => void;
  onPrint: () => void;
  onDownload: () => void;
}

export default function Bulletin({ 
  bulletinData, 
  onClose, 
  onPrint, 
  onDownload
}: BulletinProps) {
  
  const [loading, setLoading] = useState(true);
  const [processedData, setProcessedData] = useState<any>(null);

  useEffect(() => {
    if (bulletinData) {
      processBulletinData();
      setLoading(false);
    }
  }, [bulletinData]);

  const processBulletinData = () => {
    // Traiter les données pour les adapter au format du tableau
    const matieresList: Matiere[] = [];
    
    // Si on a des matières dans bulletinData
    if (bulletinData.matieres && bulletinData.matieres.length > 0) {
      bulletinData.matieres.forEach((m: any) => {
        matieresList.push({
          id: m.subjectId || m.id,
          nom: m.subject || m.nom || m.name || 'Matière inconnue',
          moyenne: m.average || m.moyenne || m.value || 0,
          coefficient: m.coefficient || 2,
          categorie: m.category || m.categorie || 'LITTERAIRE',
          appreciation: m.appreciation || '',
          devoir: m.devoir || m.note || 0,
          composition: m.composition || 0,
          totalPoints: (m.average || m.moyenne || 0) * (m.coefficient || 2)
        });
      });
    }

    // Si on a des subjects dans le format alternatif
    if (bulletinData.subjects && bulletinData.subjects.length > 0) {
      bulletinData.subjects.forEach((s: any) => {
        const existing = matieresList.find(m => m.nom === (s.subject || s.name));
        if (!existing) {
          matieresList.push({
            id: s.subjectId,
            nom: s.subject || s.name || 'Matière inconnue',
            moyenne: s.average || s.value || 0,
            coefficient: s.coefficient || 2,
            categorie: s.category || 'LITTERAIRE',
            appreciation: s.appreciation || '',
            totalPoints: (s.average || 0) * (s.coefficient || 2)
          });
        }
      });
    }

    // Organiser par catégorie
    const litteraires = matieresList.filter(m => 
      m.categorie === 'LITTERAIRE' || 
      ['Français', 'Histoire', 'Philosophie', 'Anglais', 'Arabe'].includes(m.nom)
    );
    
    const scientifiques = matieresList.filter(m => 
      m.categorie === 'SCIENTIFIQUE' || 
      ['Mathématiques', 'SVT', 'Physique et Chimie', 'Géographie', 'Physique', 'Chimie'].includes(m.nom)
    );

    // Calculer les moyennes si non fournies
    const calcMoyenne = (matieres: Matiere[]) => {
      if (matieres.length === 0) return 0;
      const total = matieres.reduce((acc, m) => acc + (m.moyenne || 0), 0);
      return Number((total / matieres.length).toFixed(2));
    };

    const moyLitteraire = bulletinData.moyennes?.litteraire || calcMoyenne(litteraires);
    const moyScientifique = bulletinData.moyennes?.scientifique || calcMoyenne(scientifiques);
    const moyGenerale = bulletinData.moyennes?.generale || 
                       bulletinData.generalAverage || 
                       Number(((moyLitteraire + moyScientifique) / 2).toFixed(2));

    setProcessedData({
      matieres: matieresList,
      litteraires,
      scientifiques,
      moyLitteraire,
      moyScientifique,
      moyGenerale,
      totalCoefficients: matieresList.reduce((acc, m) => acc + (m.coefficient || 2), 0),
      totalPoints: matieresList.reduce((acc, m) => acc + ((m.moyenne || 0) * (m.coefficient || 2)), 0)
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-xl flex items-center gap-3">
          <Icon icon="fa-spinner" className="fa-spin text-blue-600 text-2xl" />
          <span className="text-gray-700">Chargement du bulletin...</span>
        </div>
      </div>
    );
  }

  if (!bulletinData || !processedData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-xl">
          <p className="text-red-600">Erreur: Données du bulletin non disponibles</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-600 text-white rounded">
            Fermer
          </button>
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
    period
  } = bulletinData;

  // Déterminer le trimestre actuel
  const currentTrimester = bulletinData.trimester || 3;
  const trimesterNames: { [key: number]: string } = {
    1: '1er',
    2: '2e', 
    3: '3e'
  };

  // Formater les nombres avec virgule pour l'affichage français
  const formatFrenchNumber = (num: number | undefined): string => {
    if (num === undefined || num === null || isNaN(num)) return '-';
    return num.toFixed(2).replace('.', ',');
  };

  // Matières par défaut si aucune donnée
  const getDefaultMatieres = (): Matiere[] => [
    { nom: 'Français', coefficient: 2, categorie: 'LITTERAIRE' },
    { nom: 'Histoire-Géographie', coefficient: 2, categorie: 'LITTERAIRE' },
    { nom: 'Philosophie', coefficient: 2, categorie: 'LITTERAIRE' },
    { nom: 'Anglais', coefficient: 2, categorie: 'LITTERAIRE' },
    { nom: 'Arabe', coefficient: 2, categorie: 'LITTERAIRE' },
    { nom: 'Mathématiques', coefficient: 5, categorie: 'SCIENTIFIQUE' },
    { nom: 'SVT', coefficient: 5, categorie: 'SCIENTIFIQUE' },
    { nom: 'Physique-Chimie', coefficient: 4, categorie: 'SCIENTIFIQUE' },
    { nom: 'Conduite', coefficient: 1, categorie: 'AUTRE' },
  ];

  const displayMatieres = processedData.matieres.length > 0 ? processedData.matieres : getDefaultMatieres();

  // Séparer littéraires et scientifiques
  const matieresLitteraires = displayMatieres.filter((m: Matiere) => m.categorie === 'LITTERAIRE');
  const matieresScientifiques = displayMatieres.filter((m: Matiere) => m.categorie === 'SCIENTIFIQUE');
  const conduiteMatiere = displayMatieres.find((m: Matiere) => m.nom.toLowerCase().includes('conduite'));

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-6xl shadow-2xl max-h-[95vh] overflow-y-auto">
        {/* En-tête avec boutons - caché à l'impression */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-700 to-blue-900 p-4 flex justify-between items-center z-10 print:hidden">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Icon icon="fa-file-alt" />
            Bulletin de Notes - {student?.firstName} {student?.lastName}
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={onPrint} 
              className="px-4 py-2 bg-white text-blue-900 rounded-lg hover:bg-gray-100 flex items-center gap-2 font-medium transition"
            >
              <Icon icon="fa-print" /> Imprimer
            </button>
            <button 
              onClick={onDownload} 
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium transition"
            >
              <Icon icon="fa-download" /> PDF
            </button>
            <button 
              onClick={onClose} 
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition"
            >
              <Icon icon="fa-times" /> Fermer
            </button>
          </div>
        </div>

        {/* Contenu du bulletin - Style PDF officiel */}
        <div className="p-6 bg-white bulletin-content" id="bulletin-print">
          {/* En-tête officiel */}
          <div className="border-2 border-gray-800 p-4 mb-4">
            <div className="flex justify-between items-start">
              {/* Partie française */}
              <div className="text-left flex-1">
                <p className="text-xs font-bold text-gray-900 uppercase tracking-wide">République du Tchad</p>
                <p className="text-xs text-gray-800 font-medium">Unité-Travail-Progrès</p>
                <p className="text-xs font-bold text-gray-900 mt-2">Ministère de l'Education Nationale</p>
                <p className="text-xs text-gray-800">et de la Promotion Civique</p>
                <p className="text-xs text-gray-800">Direction de l'Enseignement Privé</p>
                <p className="text-xs text-gray-800">Inspection Départementale de l'Education Nationale</p>
                <p className="text-xs text-gray-800">Pour la Commune de N'Djamena IV (IDEN-CN)</p>
              </div>

              {/* Logo central */}
              <div className="text-center px-4">
                <div className="w-24 h-24 border-2 border-gray-800 rounded-full flex flex-col items-center justify-center bg-gray-50">
                  <span className="text-xs font-bold text-gray-900">2<sup>nde</sup></span>
                  <span className="text-xs font-bold text-gray-900">CYCLE</span>
                </div>
              </div>

              {/* Partie arabe */}
              <div className="text-right flex-1 font-arabic" dir="rtl">
                <p className="text-xs font-bold text-gray-900">جمهورية تشاد</p>
                <p className="text-xs text-gray-800">وحدة - عمل - تقدم</p>
                <p className="text-xs font-bold text-gray-900 mt-2">وزارة التربية الوطنية</p>
                <p className="text-xs text-gray-800">وتطوير التربية المدنية</p>
                <p className="text-xs text-gray-800">إدارة التعليم الأهلي</p>
                <p className="text-xs text-gray-800">المفتشية الإقليمية للتربية الوطنية</p>
                <p className="text-xs text-gray-800">(م) ت و - ب) 4 لبلدية أنجمينا</p>
              </div>
            </div>

            {/* Nom de l'école */}
            <div className="text-center my-4 border-t border-b border-gray-400 py-3">
              <h1 className="text-lg font-bold text-blue-900">«COMPLEXE SCOLAIRE IBNOU MAHADJIR»</h1>
              <p className="text-sm italic text-gray-700">" Bien former pour un meilleur résultat "</p>
              <p className="text-xs text-gray-600 mt-1">Tél : 95 91 90 10 / 99 49 14 49 / 66 21 15 78</p>
              <p className="text-xs text-gray-600">Quartier REPOS III. Face Bouta Cochon</p>
            </div>

            {/* Titre du bulletin */}
            <div className="flex justify-between items-center">
              <div className="text-left">
                <p className="text-sm text-gray-800">Année Scolaire : <span className="font-bold">2023-2024</span></p>
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-blue-900 border-b-2 border-blue-900 pb-1">
                  Bulletin de Notes du {trimesterNames[currentTrimester]} Trimestre
                </h2>
              </div>
              <div className="text-right font-arabic" dir="rtl">
                <p className="text-sm text-gray-800">كشف الدرجات الفترة {currentTrimester === 1 ? 'الأولى' : currentTrimester === 2 ? 'الثانية' : 'الثالثة'}</p>
              </div>
            </div>
          </div>

          {/* Informations élève */}
          <div className="mb-4 border-2 border-gray-800 p-3 bg-gray-50">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <span className="font-bold text-gray-800 text-sm w-32">Nom de l'élève :</span>
                <span className="border-b-2 border-gray-800 px-2 font-bold text-lg text-blue-900 flex-1">
                  {student?.lastName?.toUpperCase()} {student?.firstName}
                </span>
                <span className="font-arabic text-sm text-gray-600 mr-2" dir="rtl">اسم الطالب</span>
              </div>
              <div className="flex items-center">
                <span className="font-bold text-gray-800 text-sm w-24">Matricule :</span>
                <span className="border-b-2 border-gray-800 px-2 font-mono text-sm flex-1">
                  {student?.registrationNo}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex items-center">
                <span className="font-bold text-gray-800 text-sm w-32">Classe de :</span>
                <span className="border-b-2 border-gray-800 px-2 font-bold text-lg text-blue-900 flex-1 text-center">
                  {student?.class?.name || 'Terminale D'}
                </span>
                <span className="font-arabic text-sm text-gray-600 mr-2" dir="rtl">الصف</span>
              </div>
              <div className="flex items-center">
                <span className="font-bold text-gray-800 text-sm w-24">Effectif :</span>
                <span className="border-b-2 border-gray-800 px-2 text-sm flex-1">
                  {rang?.total || '-'} élèves
                </span>
              </div>
            </div>
          </div>

          {/* Tableau des notes */}
          <div className="mb-4">
            <table className="w-full border-collapse border-2 border-gray-800 text-xs">
              <thead>
                <tr className="bg-blue-100">
                  <th className="border-2 border-gray-800 p-2 text-left font-bold text-gray-900 w-1/4">MATIÈRES</th>
                  <th className="border-2 border-gray-800 p-2 text-center font-bold text-gray-900">Note<br/>max</th>
                  <th className="border-2 border-gray-800 p-2 text-center font-bold text-gray-900">Moy.<br/>devoir</th>
                  <th className="border-2 border-gray-800 p-2 text-center font-bold text-gray-900">Moy.<br/>compo</th>
                  <th className="border-2 border-gray-800 p-2 text-center font-bold text-gray-900">Moyenne<br/>Générale</th>
                  <th className="border-2 border-gray-800 p-2 text-center font-bold text-gray-900">Coef</th>
                  <th className="border-2 border-gray-800 p-2 text-center font-bold text-gray-900">Moy.<br/>G×Coef</th>
                  <th className="border-2 border-gray-800 p-2 text-center font-bold text-gray-900 w-1/6">Appréciation</th>
                </tr>
              </thead>
              <tbody>
                {/* Section Littéraire */}
                {matieresLitteraires.length > 0 && (
                  <>
                    {matieresLitteraires.map((matiere: Matiere, index: number) => (
                      <tr key={`lit-${index}`} className="hover:bg-yellow-50">
                        <td className="border border-gray-600 p-2 font-medium text-gray-900">
                          {matiere.nom}
                        </td>
                        <td className="border border-gray-600 p-2 text-center font-medium">20</td>
                        <td className="border border-gray-600 p-2 text-center">
                          {matiere.devoir ? formatFrenchNumber(matiere.devoir) : '-'}
                        </td>
                        <td className="border border-gray-600 p-2 text-center">
                          {matiere.composition ? formatFrenchNumber(matiere.composition) : '-'}
                        </td>
                        <td className="border border-gray-600 p-2 text-center font-bold text-blue-700">
                          {matiere.moyenne ? formatFrenchNumber(matiere.moyenne) : '-'}
                        </td>
                        <td className="border border-gray-600 p-2 text-center font-medium">
                          {matiere.coefficient || 2}
                        </td>
                        <td className="border border-gray-600 p-2 text-center font-bold text-green-700">
                          {matiere.totalPoints ? formatFrenchNumber(matiere.totalPoints) : 
                           matiere.moyenne ? formatFrenchNumber(matiere.moyenne * (matiere.coefficient || 2)) : '-'}
                        </td>
                        <td className="border border-gray-600 p-2 text-center text-xs italic text-gray-600">
                          {matiere.appreciation || '-'}
                        </td>
                      </tr>
                    ))}
                    {/* Bilan Littéraire */}
                    <tr className="bg-yellow-100 font-bold">
                      <td className="border-2 border-gray-800 p-2 pl-6">Bilan Littéraire</td>
                      <td className="border-2 border-gray-800 p-2 text-center">100</td>
                      <td className="border-2 border-gray-800 p-2 text-center">-</td>
                      <td className="border-2 border-gray-800 p-2 text-center">-</td>
                      <td className="border-2 border-gray-800 p-2 text-center">-</td>
                      <td className="border-2 border-gray-800 p-2 text-center">10</td>
                      <td className="border-2 border-gray-800 p-2 text-center text-blue-800">
                        {formatFrenchNumber(processedData.totalPoints * 0.6)}
                      </td>
                      <td className="border-2 border-gray-800 p-2 text-center">-</td>
                    </tr>
                    <tr className="bg-yellow-50 font-bold">
                      <td className="border-2 border-gray-800 p-2 pl-6">Moy. Littéraire</td>
                      <td className="border-2 border-gray-800 p-2 text-center">-</td>
                      <td className="border-2 border-gray-800 p-2 text-center">-</td>
                      <td className="border-2 border-gray-800 p-2 text-center">-</td>
                      <td className="border-2 border-gray-800 p-2 text-center text-blue-800 text-lg">
                        {formatFrenchNumber(processedData.moyLitteraire)}
                      </td>
                      <td className="border-2 border-gray-800 p-2 text-center">-</td>
                      <td className="border-2 border-gray-800 p-2 text-center">-</td>
                      <td className="border-2 border-gray-800 p-2 text-center">-</td>
                    </tr>
                  </>
                )}

                {/* Section Scientifique */}
                {matieresScientifiques.length > 0 && (
                  <>
                    {matieresScientifiques.map((matiere: Matiere, index: number) => (
                      <tr key={`sci-${index}`} className="hover:bg-green-50">
                        <td className="border border-gray-600 p-2 font-medium text-gray-900">
                          {matiere.nom}
                        </td>
                        <td className="border border-gray-600 p-2 text-center font-medium">20</td>
                        <td className="border border-gray-600 p-2 text-center">
                          {matiere.devoir ? formatFrenchNumber(matiere.devoir) : '-'}
                        </td>
                        <td className="border border-gray-600 p-2 text-center">
                          {matiere.composition ? formatFrenchNumber(matiere.composition) : '-'}
                        </td>
                        <td className="border border-gray-600 p-2 text-center font-bold text-blue-700">
                          {matiere.moyenne ? formatFrenchNumber(matiere.moyenne) : '-'}
                        </td>
                        <td className="border border-gray-600 p-2 text-center font-medium">
                          {matiere.coefficient || (matiere.nom.includes('Math') || matiere.nom.includes('SVT') ? 5 : 
                                                   matiere.nom.includes('Physique') ? 4 : 2)}
                        </td>
                        <td className="border border-gray-600 p-2 text-center font-bold text-green-700">
                          {matiere.totalPoints ? formatFrenchNumber(matiere.totalPoints) : 
                           matiere.moyenne ? formatFrenchNumber(matiere.moyenne * (matiere.coefficient || 2)) : '-'}
                        </td>
                        <td className="border border-gray-600 p-2 text-center text-xs italic text-gray-600">
                          {matiere.appreciation || '-'}
                        </td>
                      </tr>
                    ))}
                    {/* Bilan Scientifique */}
                    <tr className="bg-green-100 font-bold">
                      <td className="border-2 border-gray-800 p-2 pl-6">Bilan Scientifique</td>
                      <td className="border-2 border-gray-800 p-2 text-center">80</td>
                      <td className="border-2 border-gray-800 p-2 text-center">-</td>
                      <td className="border-2 border-gray-800 p-2 text-center">-</td>
                      <td className="border-2 border-gray-800 p-2 text-center">-</td>
                      <td className="border-2 border-gray-800 p-2 text-center">16</td>
                      <td className="border-2 border-gray-800 p-2 text-center text-blue-800">
                        {formatFrenchNumber(processedData.totalPoints * 0.4)}
                      </td>
                      <td className="border-2 border-gray-800 p-2 text-center">-</td>
                    </tr>
                    <tr className="bg-green-50 font-bold">
                      <td className="border-2 border-gray-800 p-2 pl-6">Moy. Scientifique</td>
                      <td className="border-2 border-gray-800 p-2 text-center">-</td>
                      <td className="border-2 border-gray-800 p-2 text-center">-</td>
                      <td className="border-2 border-gray-800 p-2 text-center">-</td>
                      <td className="border-2 border-gray-800 p-2 text-center text-blue-800 text-lg">
                        {formatFrenchNumber(processedData.moyScientifique)}
                      </td>
                      <td className="border-2 border-gray-800 p-2 text-center">-</td>
                      <td className="border-2 border-gray-800 p-2 text-center">-</td>
                      <td className="border-2 border-gray-800 p-2 text-center">-</td>
                    </tr>
                  </>
                )}

                {/* Conduite */}
                <tr className="hover:bg-purple-50">
                  <td className="border border-gray-600 p-2 font-medium text-gray-900">Conduite</td>
                  <td className="border border-gray-600 p-2 text-center font-medium">20</td>
                  <td className="border border-gray-600 p-2 text-center">-</td>
                  <td className="border border-gray-600 p-2 text-center">-</td>
                  <td className="border border-gray-600 p-2 text-center font-bold text-blue-700">
                    {conduite?.note || conduiteMatiere?.moyenne || '-'}
                  </td>
                  <td className="border border-gray-600 p-2 text-center font-medium">1</td>
                  <td className="border border-gray-600 p-2 text-center font-bold text-green-700">
                    {conduite?.note ? formatFrenchNumber(conduite.note) : 
                     conduiteMatiere?.moyenne ? formatFrenchNumber(conduiteMatiere.moyenne) : '-'}
                  </td>
                  <td className="border border-gray-600 p-2 text-center text-xs">
                    {conduite?.appreciation || conduiteMatiere?.appreciation || 'Le Conseil'}
                  </td>
                </tr>

                {/* TOTAL */}
                <tr className="bg-blue-200 font-bold text-base">
                  <td className="border-2 border-gray-800 p-2">TOTAL</td>
                  <td className="border-2 border-gray-800 p-2 text-center">200</td>
                  <td className="border-2 border-gray-800 p-2 text-center">-</td>
                  <td className="border-2 border-gray-800 p-2 text-center">-</td>
                  <td className="border-2 border-gray-800 p-2 text-center">-</td>
                  <td className="border-2 border-gray-800 p-2 text-center text-lg">
                    {processedData.totalCoefficients + 1}
                  </td>
                  <td className="border-2 border-gray-800 p-2 text-center text-lg text-blue-900">
                    {formatFrenchNumber(processedData.totalPoints + (conduite?.note || 0))}
                  </td>
                  <td className="border-2 border-gray-800 p-2 text-center">-</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section inférieure */}
          <div className="border-2 border-gray-800">
            <div className="grid grid-cols-3 divide-x-2 divide-gray-800">
              {/* Colonne 1: Moyennes */}
              <div className="p-3 space-y-2 bg-gray-50">
                <h4 className="font-bold text-sm text-blue-900 mb-3 border-b border-gray-400 pb-1">RÉSULTATS</h4>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">Moy. 1er Trimestre :</span>
                  <span className="font-bold">
                    {trimestres?.trimestre1 ? formatFrenchNumber(trimestres.trimestre1) : '-'}/20
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">Moy. 2e Trimestre :</span>
                  <span className="font-bold">
                    {trimestres?.trimestre2 ? formatFrenchNumber(trimestres.trimestre2) : '-'}/20
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">Moy. 3e Trimestre :</span>
                  <span className="font-bold text-blue-700">
                    {trimestres?.trimestre3 ? formatFrenchNumber(trimestres.trimestre3) : 
                     processedData.moyGenerale ? formatFrenchNumber(processedData.moyGenerale) : '-'}/20
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-sm border-t border-gray-300 pt-2 mt-2">
                  <span className="font-bold text-purple-700">Moyenne Annuelle :</span>
                  <span className="font-bold text-lg text-purple-700">
                    {annuelle ? formatFrenchNumber(annuelle) : 
                     processedData.moyGenerale ? formatFrenchNumber(processedData.moyGenerale) : '-'}/20
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">Rang :</span>
                  <span className="font-bold">
                    {rang?.position ? <span className="text-lg">{rang.position}<sup>e</sup></span> : '-'} 
                    <span className="text-gray-600 text-xs"> / {rang?.total || '-'} élèves</span>
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">Absences :</span>
                  <span className="font-bold text-red-600">{absences || 0} jours</span>
                </div>
              </div>

              {/* Colonne 2: Distinctions et Sanctions */}
              <div className="p-3 bg-white">
                <h4 className="font-bold text-sm text-green-700 mb-2">DISTINCTIONS</h4>
                <div className="space-y-1 text-xs mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 border-2 border-gray-600" readOnly 
                           checked={appreciation?.includes('Félicitations')} />
                    <span>Félicitations</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 border-2 border-gray-600" readOnly
                           checked={appreciation?.includes('Encouragement')} />
                    <span>Encouragement</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 border-2 border-gray-600" readOnly
                           checked={appreciation?.includes('Tableau')} />
                    <span>Tableau d'honneur</span>
                  </label>
                </div>

                <h4 className="font-bold text-sm text-red-700 mb-2">SANCTIONS</h4>
                <div className="space-y-1 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 border-2 border-gray-600" readOnly />
                    <span>Avertissement Travail</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 border-2 border-gray-600" readOnly />
                    <span>Avertissement Conduite</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 border-2 border-gray-600" readOnly />
                    <span>Blâme Travail</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 border-2 border-gray-600" readOnly />
                    <span>Blâme Conduite</span>
                  </label>
                </div>
              </div>

              {/* Colonne 3: Appréciations */}
              <div className="p-3 bg-gray-50">
                <h4 className="font-bold text-sm text-blue-900 mb-2">APPRÉCIATIONS DU PROFESSEUR PRINCIPAL</h4>
                <div className="border-2 border-gray-400 min-h-[80px] p-2 bg-white mb-3 rounded">
                  <p className="text-sm text-gray-800 italic">
                    {appreciation || 'Assez bon travail.'}
                  </p>
                </div>
                
                <div className="border-2 border-gray-400 min-h-[40px] p-2 bg-white rounded">
                  <p className="text-sm text-gray-800 font-medium text-center">
                    {appreciation?.includes('Admis') ? 'Admis au Baccalauréat' : 'Admis en classe supérieure'}
                  </p>
                </div>

                <div className="mt-4 pt-2 border-t border-gray-400">
                  <p className="text-xs text-gray-600">Fait à N'Djamena, le</p>
                  <p className="font-bold text-sm">
                    {generatedAt ? new Date(generatedAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    }) : new Date().toLocaleDateString('fr-FR')}
                  </p>
                  <p className="text-xs font-bold text-center mt-2 text-gray-700">Le Proviseur</p>
                  <div className="h-12 border-b border-gray-400 mt-1"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Note de bas de page */}
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-600 italic font-medium">
              N.B : toute rature ou modification annule ce bulletin
            </p>
          </div>
        </div>
      </div>

      {/* Styles pour l'impression */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #bulletin-print, #bulletin-print * {
            visibility: visible;
          }
          #bulletin-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 10px;
          }
          .bulletin-content {
            box-shadow: none !important;
            max-height: none !important;
          }
        }
      `}</style>
    </div>
  );
}