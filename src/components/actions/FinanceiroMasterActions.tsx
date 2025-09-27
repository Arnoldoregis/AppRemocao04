import React, { useState } from 'react';
import { Removal } from '../../types';
import { useRemovals } from '../../context/RemovalContext';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, Download } from 'lucide-react';
import { downloadFile } from '../../utils/downloadFile';

interface FinanceiroMasterActionsProps {
  removal: Removal;
  onClose: () => void;
}

const FinanceiroMasterActions: React.FC<FinanceiroMasterActionsProps> = ({ removal, onClose }) => {
  const { updateRemoval } = useRemovals();
  const { user } = useAuth();
  const [isConfirmingFinalization, setIsConfirmingFinalization] = useState(false);

  const handleFinalize = () => {
    if (!user) return;
    updateRemoval(removal.code, {
      status: 'finalizada',
      history: [
        ...removal.history,
        {
          date: new Date().toISOString(),
          action: `Ciclo finalizado pelo Financeiro Master`,
          user: user.name,
        },
      ],
    });
    onClose();
  };
  
  const handleDownloadProofs = () => {
    const downloadWithParsing = (proof: string) => {
        const parts = proof.split('||');
        if (parts.length === 2) {
            downloadFile(parts[0], parts[1]);
        } else {
            downloadFile(proof, proof);
        }
    };

    if (removal.paymentProof) {
      downloadWithParsing(removal.paymentProof);
    }
    removal.customAdditionals?.forEach(ad => {
      if (ad.paymentProof) {
        downloadWithParsing(ad.paymentProof);
      }
    });
  };

  const hasProofs = removal.paymentProof || removal.customAdditionals?.some(ad => ad.paymentProof);

  if (isConfirmingFinalization) {
    return (
      <div className="w-full p-4 bg-yellow-50 rounded-lg border border-yellow-300">
        <h4 className="font-semibold text-yellow-900 mb-3 text-center">
          Tem certeza de que quer finalizar a remoção?
        </h4>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsConfirmingFinalization(false)} 
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
          >
            NÃO
          </button>
          <button 
            onClick={handleFinalize} 
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            SIM
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {hasProofs && (
        <button
          onClick={handleDownloadProofs}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Download size={16} /> Baixar Comprovantes
        </button>
      )}
      <button
        onClick={() => setIsConfirmingFinalization(true)}
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
      >
        <CheckCircle size={16} /> Finalizar Ciclo
      </button>
    </div>
  );
};

export default FinanceiroMasterActions;
