import React, { useState } from 'react';
import { Removal } from '../../types';
import { useRemovals } from '../../context/RemovalContext';
import { useAuth } from '../../context/AuthContext';
import { Truck, Check, Scale } from 'lucide-react';

interface MotoristaActionsProps {
  removal: Removal;
  onClose: () => void;
}

const MotoristaActions: React.FC<MotoristaActionsProps> = ({ removal, onClose }) => {
  const { updateRemoval } = useRemovals();
  const { user } = useAuth();
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [realWeight, setRealWeight] = useState('');
  const [isConfirmingWeight, setIsConfirmingWeight] = useState(false);

  const handleUpdateStatus = (newStatus: Removal['status'], actionText: string) => {
    if (!user) return;
    updateRemoval(removal.code, {
      status: newStatus,
      history: [
        ...removal.history,
        {
          date: new Date().toISOString(),
          action: `Motorista ${user.name.split(' ')[0]} ${actionText}`,
          user: user.name,
        },
      ],
    });
    onClose();
  };

  const handleFinalize = () => {
    if (!user || !realWeight) return;
    updateRemoval(removal.code, {
      status: 'concluida',
      realWeight: parseFloat(realWeight),
      history: [
        ...removal.history,
        {
          date: new Date().toISOString(),
          action: `Motorista ${user.name.split(' ')[0]} pesou o pet (${realWeight} kg) e finalizou a remoção`,
          user: user.name,
        },
      ],
    });
    onClose();
  };

  const handleConfirmWeightClick = () => {
    if (!realWeight || parseFloat(realWeight) <= 0) {
      alert('Por favor, informe um peso válido.');
      return;
    }
    setIsConfirmingWeight(true);
  };

  if (isConfirmingWeight) {
    return (
      <div className="w-full p-4 bg-yellow-50 rounded-lg border border-yellow-300">
        <h4 className="font-semibold text-yellow-900 mb-3 text-center">
          Tem certeza que deseja confirmar o peso informado de {realWeight} kg?
        </h4>
        <div className="flex gap-2">
          <button onClick={() => setIsConfirmingWeight(false)} className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">NÃO</button>
          <button onClick={handleFinalize} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">SIM</button>
        </div>
      </div>
    );
  }
  
  if (isFinalizing) {
      return (
        <div className="flex items-center gap-2">
            <input
                type="number"
                value={realWeight}
                onChange={(e) => setRealWeight(e.target.value)}
                placeholder="Peso real (kg)"
                className="px-3 py-2 border border-gray-300 rounded-md w-32"
            />
            <button onClick={handleConfirmWeightClick} className="px-4 py-2 bg-green-600 text-white rounded-md">Confirmar</button>
            <button onClick={() => setIsFinalizing(false)} className="px-4 py-2 bg-gray-300 rounded-md">Voltar</button>
        </div>
      );
  }

  return (
    <div className="flex items-center gap-2">
      {removal.status === 'em_andamento' && (
        <button
          onClick={() => handleUpdateStatus('a_caminho', 'iniciou o deslocamento')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2"
        >
          <Truck size={16} /> Iniciar Deslocamento
        </button>
      )}
      {removal.status === 'a_caminho' && (
        <button
          onClick={() => handleUpdateStatus('removido', 'removeu o pet no endereço')}
          className="px-4 py-2 bg-purple-600 text-white rounded-md flex items-center gap-2"
        >
          <Check size={16} /> Confirmar Remoção
        </button>
      )}
      {removal.status === 'removido' && (
        <button
          onClick={() => setIsFinalizing(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md flex items-center gap-2"
        >
          <Scale size={16} /> Finalizar (Pesar Pet)
        </button>
      )}
    </div>
  );
};

export default MotoristaActions;
