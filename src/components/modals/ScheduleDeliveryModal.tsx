import React, { useState, useMemo } from 'react';
import { Removal } from '../../types';
import { useRemovals } from '../../context/RemovalContext';
import { useAuth } from '../../context/AuthContext';
import { X, Search, UserCheck, CalendarClock, ArrowLeft, Calendar, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface ScheduleDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ScheduleDeliveryModal: React.FC<ScheduleDeliveryModalProps> = ({ isOpen, onClose }) => {
  const { removals, updateRemoval } = useRemovals();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRemoval, setSelectedRemoval] = useState<Removal | null>(null);
  const [isSchedulingDateFor, setIsSchedulingDateFor] = useState<Removal | null>(null);
  const [deliveryDate, setDeliveryDate] = useState('');

  const availableRemovals = useMemo(() => {
    return removals.filter(r =>
      r.status === 'pronto_para_entrega' &&
      (
        r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.tutor.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [removals, searchTerm]);

  const deliveriesOnSelectedDate = useMemo(() => {
    if (!deliveryDate) return 0;
    return removals.filter(r => 
        r.status === 'entrega_agendada' && 
        r.scheduledDeliveryDate === deliveryDate
    ).length;
  }, [deliveryDate, removals]);

  const isDayFull = deliveriesOnSelectedDate >= 6;

  const resetAndClose = () => {
    setSearchTerm('');
    setSelectedRemoval(null);
    setIsSchedulingDateFor(null);
    setDeliveryDate('');
    onClose();
  };

  const handleUpdateStatus = (newStatus: 'aguardando_retirada') => {
    if (!selectedRemoval || !user) return;

    const actionText = 'marcou que o tutor virá buscar.';

    updateRemoval(selectedRemoval.code, {
      status: newStatus,
      history: [
        ...selectedRemoval.history,
        {
          date: new Date().toISOString(),
          action: `${user.role?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} ${user.name.split(' ')[0]} ${actionText}`,
          user: user.name,
        },
      ],
    });
    resetAndClose();
  };

  const handleConfirmScheduledDelivery = () => {
    if (!isSchedulingDateFor || !deliveryDate || !user || isDayFull) return;

    // FIX: Parse date as local to prevent timezone shift in history message
    const displayDate = format(new Date(deliveryDate + 'T00:00:00'), 'dd/MM/yyyy');

    updateRemoval(isSchedulingDateFor.code, {
      status: 'entrega_agendada',
      scheduledDeliveryDate: deliveryDate,
      history: [
        ...isSchedulingDateFor.history,
        {
          date: new Date().toISOString(),
          action: `Entrega agendada para ${displayDate} por ${user.name.split(' ')[0]}.`,
          user: user.name,
        },
      ],
    });
    resetAndClose();
  };

  if (!isOpen) return null;

  if (isSchedulingDateFor) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Agendar Entrega</h2>
            <button onClick={resetAndClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
          </div>
          <div className="p-6 space-y-4">
            <p>Selecione a data de entrega para <strong>{isSchedulingDateFor.pet.name}</strong>.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data da Entrega</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={e => setDeliveryDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            {isDayFull && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
                    <AlertTriangle size={20} />
                    <p className="text-sm">
                        Este dia já atingiu o limite de 6 entregas. Por favor, escolha outra data.
                    </p>
                </div>
            )}
          </div>
          <div className="bg-gray-50 p-4 border-t flex justify-end items-center gap-4">
            <button onClick={() => setIsSchedulingDateFor(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md flex items-center gap-2"><ArrowLeft size={16}/> Voltar</button>
            <button onClick={handleConfirmScheduledDelivery} disabled={!deliveryDate || isDayFull} className="px-4 py-2 bg-purple-600 text-white rounded-md flex items-center gap-2 disabled:opacity-50"><Calendar size={16}/> Confirmar Agendamento</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full h-[80vh] flex flex-col">
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-gray-900">Agendar Entrega / Retirada</h2>
          <button onClick={resetAndClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
        </div>
        
        <div className="flex-grow flex overflow-hidden">
          {/* Left Panel: List */}
          <div className="w-1/2 border-r flex flex-col">
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
                    <li 
                      key={removal.code} 
                      onClick={() => setSelectedRemoval(removal)}
                      className={`p-4 cursor-pointer ${selectedRemoval?.code === removal.code ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    >
                      <p className="font-semibold">{removal.pet.name} <span className="font-normal text-gray-600">(Tutor: {removal.tutor.name})</span></p>
                      <p className="text-sm text-gray-500">Código: {removal.code}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center p-8 text-gray-500">Nenhuma remoção pronta para entrega.</div>
              )}
            </div>
          </div>

          {/* Right Panel: Actions */}
          <div className="w-1/2 p-6 flex flex-col justify-center items-center bg-gray-50">
            {selectedRemoval ? (
              <div className="text-center space-y-6">
                <h3 className="text-lg font-semibold">Ações para: <span className="text-blue-600">{selectedRemoval.pet.name}</span></h3>
                <p className="text-sm text-gray-600">Código: {selectedRemoval.code}</p>
                <div className="flex flex-col gap-4 w-full max-w-xs">
                  <button
                    onClick={() => handleUpdateStatus('aguardando_retirada')}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <UserCheck size={20} />
                    Tutor Virá Buscar
                  </button>
                  <button
                    onClick={() => setIsSchedulingDateFor(selectedRemoval)}
                    className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CalendarClock size={20} />
                    Agendar Entrega
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <p>Selecione uma remoção da lista para definir o próximo passo.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleDeliveryModal;
