// app/students/components/BulletinModal.tsx
'use client';

import Icon from '@/components/ui/Icon';
import Bulletin from './Bulletin';
import { Student } from '../types';

interface Props {
  bulletinData: any;
  student: Student;
  onClose: () => void;
}

export default function BulletinModal({ bulletinData, student, onClose }: Props) {
  const handlePrint = () => window.print();
  const handleDownload = () => alert('Téléchargement PDF - à implémenter');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-4xl p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-end gap-2 mb-4 print:hidden">
          <button onClick={handlePrint} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2"><Icon icon="fa-print" /> Imprimer</button>
          <button onClick={handleDownload} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm flex items-center gap-2"><Icon icon="fa-download" /> PDF</button>
          <button onClick={onClose} className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-sm">Fermer</button>
        </div>
        <Bulletin bulletinData={bulletinData} onPrint={handlePrint} onDownload={handleDownload} onClose={onClose} />
      </div>
    </div>
  );
}