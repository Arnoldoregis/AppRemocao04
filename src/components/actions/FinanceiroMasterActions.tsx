import React from 'react';
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
    if (removal.paymentProof) {
      downloadFile(removal.paymentProof);
    }
    removal.customAdditionals?.forEach(ad => {
      if (ad.paymentProof) {
        downloadFile(ad.paymentProof);
      }
    });
  };

  const hasProofs = removal.paymentProof || removal.customAdditionals?.some(ad => ad.paymentProof);

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
        onClick={handleFinalize}
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
      >
        <CheckCircle size={16} /> Finalizar Ciclo
      </button>
    </div>
  );
};

export default FinanceiroMasterActions;
