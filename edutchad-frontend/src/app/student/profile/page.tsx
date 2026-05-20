'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Icon from '@/components/ui/Icon';
import { useStudent } from '@/context/StudentContext';
import { useStudentDetails } from '@/hooks/useStudentData';
import { ErrorState } from '@/components/student/ErrorState';
import { LoadingSpinner } from '@/components/student/LoadingSpinner';


export default function ProfilePage() {
  const { student: basicInfo, loading: basicLoading, error: basicError } = useStudent();
  const { details, loading: detailsLoading, error: detailsError, refetch } = useStudentDetails();

  const loading = basicLoading || detailsLoading;
  const error = basicError || detailsError;

  if (loading) return <LoadingSpinner />;
  if (error || !basicInfo || !details) return <ErrorState error={error} onRetry={refetch} />;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mon profil</h1>
        <p className="text-slate-500 text-sm">Informations personnelles et coordonnées</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-6 py-6 text-white">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
              {basicInfo.photo ? (
                <Image src={basicInfo.photo} alt={basicInfo.firstName} fill className="object-cover" />
              ) : (
                <span className="text-3xl font-bold">{basicInfo.firstName[0]}{basicInfo.lastName[0]}</span>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{basicInfo.firstName} {basicInfo.lastName}</h2>
              <p className="text-indigo-200">{basicInfo.registrationNo}</p>
              <p className="text-indigo-200 text-sm mt-1">{details.class?.name || 'Classe non assignée'}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
                <Icon icon="fa-user" className="text-indigo-500" /> Informations personnelles
              </h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-slate-500">Nom complet :</span> {basicInfo.firstName} {basicInfo.lastName}</p>
                <p><span className="text-slate-500">Sexe :</span> {details.sex || 'Non renseigné'}</p>
                <p><span className="text-slate-500">Date de naissance :</span> {formatDate(details.dateOfBirth)}</p>
                <p><span className="text-slate-500">Matricule :</span> {basicInfo.registrationNo}</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
                <Icon icon="fa-address-card" className="text-indigo-500" /> Contact parent / tuteur
              </h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-slate-500">Nom :</span> {details.parentName}</p>
                <p><span className="text-slate-500">Téléphone :</span> {details.parentPhone}</p>
                {details.parentEmail && <p><span className="text-slate-500">Email :</span> {details.parentEmail}</p>}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
              <Icon icon="fa-graduation-cap" className="text-indigo-500" /> Parcours scolaire
            </h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-slate-500">Classe actuelle :</span> {details.class?.name || 'Non assignée'}</p>
              <p><span className="text-slate-500">Niveau :</span> {details.class?.level || '—'}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}