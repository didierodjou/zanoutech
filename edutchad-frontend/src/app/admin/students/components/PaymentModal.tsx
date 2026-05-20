// app/students/components/PaymentModal.tsx
'use client';
import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { studentApi } from '../services/studentApi';
import { Student } from '../types';

interface Props {
  student: Student;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({ student, onClose, onSuccess }: Props) {
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<string>('Espèces');
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fee, setFee] = useState<number>(student.tuitionFee ?? 0);
  const [updatingFee, setUpdatingFee] = useState(false);

  const handleRecordPayment = async () => {
    if (amount <= 0) return setError('Montant invalide');
    setLoading(true);
    try {
      await studentApi.recordPayment(student.id, amount, method, reference || undefined);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetFee = async () => {
    if (fee < 0) return;
    setUpdatingFee(true);
    try {
      await studentApi.setTuitionFee(student.id, fee);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdatingFee(false);
    }
  };

  const remaining = (student.tuitionFee ?? 0) - (student.tuitionPaid ?? 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900"><Icon icon="fa-money-bill-wave" className="text-yellow-500 mr-2" />Paiement Scolarité</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><Icon icon="fa-times" /></button>
        </div>
        <div className="space-y-4">
          <p><span className="font-semibold">{student.lastName} {student.firstName}</span><br />Matricule: {student.registrationNo}</p>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p>Frais total: <strong>{student.tuitionFee ?? 0} FCFA</strong></p>
            <p>Déjà payé: <strong>{student.tuitionPaid ?? 0} FCFA</strong></p>
            <p>Reste à payer: <strong>{remaining} FCFA</strong></p>
            <p>Statut: <span className={`font-bold ${student.tuitionStatus === 'PAID' ? 'text-green-600' : student.tuitionStatus === 'PARTIAL' ? 'text-orange-600' : 'text-red-600'}`}>{student.tuitionStatus}</span></p>
          </div>

          <div className="border-t pt-4">
            <label className="block text-sm font-medium mb-1">Modifier le montant total des frais</label>
            <div className="flex gap-2">
              <input type="number" value={fee} onChange={e => setFee(parseFloat(e.target.value) || 0)} className="border rounded p-2 flex-1" />
              <button onClick={handleSetFee} disabled={updatingFee} className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700">{updatingFee ? '...' : 'Mettre à jour'}</button>
            </div>
          </div>

          <div className="border-t pt-4">
            <label className="block text-sm font-medium mb-1">Enregistrer un paiement</label>
            <input type="number" placeholder="Montant" value={amount} onChange={e => setAmount(parseFloat(e.target.value) || 0)} className="w-full border rounded p-2 mb-2" />
            <select value={method} onChange={e => setMethod(e.target.value)} className="w-full border rounded p-2 mb-2">
              <option>Espèces</option>
              <option>Virement bancaire</option>
              <option>Mobile Money</option>
              <option>Chèque</option>
            </select>
            <input type="text" placeholder="Référence (optionnel)" value={reference} onChange={e => setReference(e.target.value)} className="w-full border rounded p-2 mb-4" />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button onClick={handleRecordPayment} disabled={loading} className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 flex items-center justify-center gap-2">{loading ? <Icon icon="fa-spinner" className="fa-spin" /> : <><Icon icon="fa-save" /> Enregistrer paiement</>}</button>
          </div>
        </div>
      </div>
    </div>
  );
}