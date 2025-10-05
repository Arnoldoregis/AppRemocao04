import React, { useState, useMemo } from 'react';
import { Removal, Address } from '../../types';
import { useRemovals } from '../../context/RemovalContext';
import { useAuth } from '../../context/AuthContext';
import { X, Search, UserCheck, CalendarClock, ArrowLeft, Calendar, AlertTriangle, Dog, User, Hash, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface ScheduleDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ScheduleDeliveryModal: React.FC<ScheduleDeliveryModalProps> = ({ isOpen, onClose }) => {
  const { removals, updateRemoval } = useRemovals();
  const { user } = useAuth();
  
  // State for each step of the modal
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRemoval, setSelectedRemoval] = useState<Removal | null>(null);
  const [isSchedulingDateFor, setIsSchedulingDateFor] = useState<Removal | null>(null);
  const [confirmingDelivery, setConfirmingDelivery] = useState<Removal | null>(null);
  
  // State for data being collected
  const [deliveryDate, setDeliveryDate] = useState('');
  const [editableAddress, setEditableAddress] = useState<Address | null>(null);

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
    setConfirmingDelivery(null);
    setDeliveryDate('');
    setEditableAddress(null);
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

  const handleDateSelection = () => {
    if (!isSchedulingDateFor || !deliveryDate || isDayFull) return;
    setConfirmingDelivery(isSchedulingDateFor);
    setEditableAddress(isSchedulingDateFor.deliveryAddress || isSchedulingDateFor.removalAddress);
    setIsSchedulingDateFor(null);
  };

  const handleFinalizeSchedule = () => {
    if (!confirmingDelivery || !deliveryDate || !user || !editableAddress) return;
    const displayDate = format(new Date(deliveryDate + 'T00:00:00'), 'dd/MM/yyyy');
    updateRemoval(confirmingDelivery.code, {
      status: 'entrega_agendada',
      scheduledDeliveryDate: deliveryDate,
      deliveryAddress: editableAddress,
      history: [
        ...confirmingDelivery.history,
        {
          date: new Date().toISOString(),
          action: `Entrega agendada para ${displayDate} por ${user.name.split(' ')[0]}.`,
          user: user.name,
        },
      ],
    });
    resetAndClose();
  };
  
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editableAddress) return;
    const { name, value } = e.target;
    setEditableAddress({ ...editableAddress, [name]: value });
  };
  
  const searchCEP = async () => {
    if (!editableAddress) return;
    const cep = editableAddress.cep.replace(/\D/g, '');
    if (cep.length === 8) {
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            if (!data.erro) {
                setEditableAddress(prev => ({
                    ...(prev as Address),
                    street: data.logradouro,
                    neighborhood: data.bairro,
                    city: data.localidade,
                    state: data.uf,
                }));
            } else {
                alert('CEP não encontrado.');
            }
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
            alert('Erro ao buscar CEP. Verifique sua conexão.');
        }
    } else {
        alert('Por favor, digite um CEP válido.');
    }
  };

  if (!isOpen) return null;

  // Final Confirmation View
  if (confirmingDelivery && editableAddress) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Confirme os Dados do Agendamento</h2>
            <button onClick={resetAndClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                <p className="flex items-center gap-2"><strong>Data:</strong> {format(new Date(deliveryDate + 'T00:00:00'), 'dd/MM/yyyy')}</p>
                <p className="flex items-center gap-2"><Dog size={16} /><strong>Pet:</strong> {confirmingDelivery.pet.name}</p>
                <p className="flex items-center gap-2"><User size={16} /><strong>Tutor:</strong> {confirmingDelivery.tutor.name}</p>
                <p className="flex items-center gap-2"><Hash size={16} /><strong>Código:</strong> {confirmingDelivery.code}</p>
            </div>
            
            <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2"><MapPin size={16}/>Endereço de Entrega (editável)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="relative">
                        <input 
                            type="text" 
                            name="cep" 
                            value={editableAddress.cep} 
                            onChange={handleAddressChange} 
                            placeholder="CEP" 
                            className="w-full px-2 py-1.5 border rounded-md text-sm pr-8" 
                        />
                        <button 
                            type="button" 
                            onClick={searchCEP} 
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
                            title="Buscar CEP"
                        >
                            <Search size={16} />
                        </button>
                    </div>
                    <div className="md:col-span-2">
                        <input 
                            type="text" 
                            name="street" 
                            value={editableAddress.street} 
                            onChange={handleAddressChange} 
                            placeholder="Rua" 
                            className="w-full px-2 py-1.5 border rounded-md text-sm" 
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input type="text" name="number" value={editableAddress.number} onChange={handleAddressChange} placeholder="Número" className="w-full px-2 py-1.5 border rounded-md text-sm" />
                    <input type="text" name="neighborhood" value={editableAddress.neighborhood} onChange={handleAddressChange} placeholder="Bairro" className="w-full px-2 py-1.5 border rounded-md text-sm" />
                    <input type="text" name="city" value={editableAddress.city} onChange={handleAddressChange} placeholder="Cidade" className="w-full px-2 py-1.5 border rounded-md text-sm" />
                </div>
            </div>
          </div>
          <div className="bg-gray-50 p-4 border-t flex justify-end items-center gap-4">
            <button onClick={() => { setConfirmingDelivery(null); setIsSchedulingDateFor(confirmingDelivery); }} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md flex items-center gap-2"><ArrowLeft size={16}/> Voltar</button>
            <button onClick={handleFinalizeSchedule} className="px-4 py-2 bg-green-600 text-white rounded-md flex items-center gap-2"><Calendar size={16}/> Confirmar Entrega</button>
          </div>
        </div>
      </div>
    );
  }

  // Date Selection View
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
            <button onClick={handleDateSelection} disabled={!deliveryDate || isDayFull} className="px-4 py-2 bg-purple-600 text-white rounded-md flex items-center gap-2 disabled:opacity-50"><Calendar size={16}/> Confirmar Agendamento</button>
          </div>
        </div>
      </div>
    );
  }

  // Main List View
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full h-[80vh] flex flex-col">
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-gray-900">Agendar Entrega / Retirada</h2>
          <button onClick={resetAndClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
        </div>
        
        <div className="flex-grow flex overflow-hidden">
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
