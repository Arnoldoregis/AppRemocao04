import React from 'react';
import { Removal } from '../../types';
import { X, Calendar, Package, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DayDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    day: Date;
    removals: Removal[];
    onCancelDelivery: (removalCode: string) => void;
}

const DayDetailsModal: React.FC<DayDetailsModalProps> = ({ isOpen, onClose, day, removals, onCancelDelivery }) => {
    if (!isOpen) return null;

    const handleCancelClick = (removalCode: string) => {
        if (window.confirm('Tem certeza que deseja excluir este agendamento? A remoção voltará para a aba "Pronto p/ Entrega".')) {
            onCancelDelivery(removalCode);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Calendar className="text-blue-600" />
                        Entregas para {format(day, 'dd/MM/yyyy', { locale: ptBR })}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X /></button>
                </div>
                <div className="overflow-y-auto p-6">
                    {removals.length > 0 ? (
                        <div className="space-y-4">
                            {removals.map(removal => (
                                <div key={removal.code} className="p-4 border rounded-lg bg-gray-50 flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-gray-800">Pet: {removal.pet.name}</p>
                                        <p className="text-sm text-gray-600">Tutor: {removal.tutor.name}</p>
                                        <p className="text-xs text-gray-500 font-mono mt-1">Código: {removal.code}</p>
                                    </div>
                                    <button
                                        onClick={() => handleCancelClick(removal.code)}
                                        className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100"
                                        title="Excluir agendamento"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-12">
                            <Package size={40} className="mx-auto text-gray-400 mb-2" />
                            <p>Nenhuma entrega agendada para este dia.</p>
                        </div>
                    )}
                </div>
                <div className="bg-gray-50 p-4 border-t flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Fechar</button>
                </div>
            </div>
        </div>
    );
};

export default DayDetailsModal;
