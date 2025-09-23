import React, { useState, useMemo } from 'react';
import { Removal } from '../../types';
import { useRemovals } from '../../context/RemovalContext';
import { useAgenda } from '../../context/AgendaContext';
import { X, Search } from 'lucide-react';

interface IncluirRemocaoModalProps {
  slotKey: string;
  onClose: () => void;
}

const IncluirRemocaoModal: React.FC<IncluirRemocaoModalProps> = ({ slotKey, onClose }) => {
  const { removals } = useRemovals();
  const { scheduleFarewell, schedule } = useAgenda();
  const [searchTerm, setSearchTerm] = useState('');

  const availableRemovals = useMemo(() => {
    const scheduledCodes = Object.values(schedule).map(r => r.code);
    return removals.filter(r =>
      (r.modality === 'individual_ouro' || r.modality === 'individual_prata') &&
      r.status === 'concluida' &&
      !scheduledCodes.includes(r.code) &&
      (
        r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.tutor.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [removals, schedule, searchTerm]);

  const handleSelectRemoval = (removal: Removal) => {
    scheduleFarewell(slotKey, removal);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-gray-900">Selecionar Remoção Individual</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
        </div>
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código, pet ou tutor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
        </div>
        <div className="overflow-y-auto">
          {availableRemovals.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {availableRemovals.map(removal => (
                <li key={removal.code} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{removal.pet.name} <span className="font-normal text-gray-600">(Tutor: {removal.tutor.name})</span></p>
                    <p className="text-sm text-gray-500">Código: {removal.code} | Modalidade: {removal.modality.replace(/_/g, ' ')}</p>
                  </div>
                  <button
                    onClick={() => handleSelectRemoval(removal)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700"
                  >
                    Agendar
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center p-8 text-gray-500">
              Nenhuma remoção individual disponível para agendamento de despedida.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IncluirRemocaoModal;
