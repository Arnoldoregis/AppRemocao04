import React, { useState } from 'react';
import { Removal } from '../../types';
import { useRemovals } from '../../context/RemovalContext';
import { useAuth } from '../../context/AuthContext';
import { Send, Undo, XCircle } from 'lucide-react';
import { mockDrivers } from '../../data/mock';

interface ReceptorActionsProps {
  removal: Removal;
  onClose: () => void;
}

const ReceptorActions: React.FC<ReceptorActionsProps> = ({ removal, onClose }) => {
  const { updateRemoval } = useRemovals();
  const { user } = useAuth();
  const [isDirecting, setIsDirecting] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmingRevert, setIsConfirmingRevert] = useState(false);

  const executeDirect = () => {
    if (!selectedDriverId || !user) return;

    const selectedDriver = mockDrivers.find(d => d.id === selectedDriverId);
    if (!selectedDriver) return;

    updateRemoval(removal.code, {
      status: 'em_andamento',
      assignedDriver: selectedDriver,
      history: [
        ...removal.history,
        {
          date: new Date().toISOString(),
          action: `Receptor ${user.name.split(' ')[0]} encaminhou para o motorista ${selectedDriver.name}`,
          user: user.name,
        },
      ],
    });

    if (selectedDriver.phone) {
        const message = encodeURIComponent('Uma nova remoção foi atribuida a voce, dirija-se ao local.');
        const whatsappUrl = `https://wa.me/55${selectedDriver.phone}?text=${message}`;
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }

    onClose();
  };

  const handleConfirmClick = () => {
    if (!selectedDriverId) {
      alert('Por favor, selecione um motorista.');
      return;
    }
    setIsConfirming(true);
  };

  const handleRevert = () => {
    if (!user) return;
    updateRemoval(removal.code, {
      status: 'solicitada',
      assignedDriver: undefined,
      history: [
        ...removal.history,
        {
          date: new Date().toISOString(),
          action: 'Direcionamento revertido para análise',
          user: user.name,
        },
      ],
    });
    onClose();
  };

  const handleCancel = () => {
    if (!user) return;
    const reason = prompt('Por favor, insira o motivo do cancelamento:');
    if (reason) {
      updateRemoval(removal.code, {
        status: 'cancelada',
        cancellationReason: reason,
        history: [
          ...removal.history,
          {
            date: new Date().toISOString(),
            action: 'Remoção Cancelada',
            user: user.name,
            reason: reason,
          },
        ],
      });
      onClose();
    }
  };

  if (isConfirming) {
    const selectedDriver = mockDrivers.find(d => d.id === selectedDriverId);
    return (
      <div className="w-full p-4 bg-yellow-50 rounded-lg border border-yellow-300">
        <h4 className="font-semibold text-yellow-900 mb-3 text-center">
          Tem certeza que quer atribuir remoção ao motorista {selectedDriver?.name}?
        </h4>
        <div className="flex gap-2">
          <button onClick={() => setIsConfirming(false)} className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">NÃO</button>
          <button onClick={executeDirect} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">SIM</button>
        </div>
      </div>
    );
  }

  if (isConfirmingRevert) {
    return (
      <div className="w-full p-4 bg-yellow-50 rounded-lg border border-yellow-300">
        <h4 className="font-semibold text-yellow-900 mb-3 text-center">
          Tem certeza que deseja retornar a remoção e direcioná-la para outro motorista?
        </h4>
        <div className="flex gap-2">
          <button onClick={() => setIsConfirmingRevert(false)} className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">NÃO</button>
          <button onClick={handleRevert} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">SIM</button>
        </div>
      </div>
    );
  }

  if (isDirecting) {
    return (
      <div className="flex items-center gap-2">
        <select
          value={selectedDriverId}
          onChange={(e) => setSelectedDriverId(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Selecione um motorista</option>
          {mockDrivers.map(driver => (
            <option key={driver.id} value={driver.id}>{driver.name}</option>
          ))}
        </select>
        <button onClick={handleConfirmClick} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Confirmar</button>
        <button onClick={() => setIsDirecting(false)} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">Voltar</button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {removal.status === 'solicitada' && (
        <button
          onClick={() => setIsDirecting(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Send size={16} /> Direcionar
        </button>
      )}
      {removal.status === 'em_andamento' && (
        <button
          onClick={() => setIsConfirmingRevert(true)}
          className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 flex items-center gap-2"
        >
          <Undo size={16} /> Retornar p/ Análise
        </button>
      )}
      {(removal.status === 'solicitada' || removal.status === 'em_andamento') && (
        <button
          onClick={handleCancel}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
        >
          <XCircle size={16} /> Cancelar Remoção
        </button>
      )}
    </div>
  );
};

export default ReceptorActions;
