import React, { useState, useMemo } from 'react';
import { Removal } from '../../types';
import { useRemovals } from '../../context/RemovalContext';
import { useAuth } from '../../context/AuthContext';
import { Edit, Save, Send, X, Flame, CheckCircle } from 'lucide-react';

interface OperacionalActionsProps {
    removal: Removal;
    onClose: () => void;
}

const OperacionalActions: React.FC<OperacionalActionsProps> = ({ removal, onClose }) => {
    const { updateRemoval } = useRemovals();
    const { user } = useAuth();
    
    // Existing states
    const [isEditing, setIsEditing] = useState(false);
    const [petCondition, setPetCondition] = useState(removal.petCondition || '');
    const [farewellInfo, setFarewellInfo] = useState(removal.farewellSchedulingInfo || '');

    // New states for additional items finalization
    const [isFinalizingAdditionals, setIsFinalizingAdditionals] = useState(false);
    const [additionalConfirmation, setAdditionalConfirmation] = useState<Record<string, 'sim' | 'nao'>>({});

    const uniqueAdditionals = useMemo(() => {
        const allAdditionals: { name: string, quantity: number }[] = [
            ...(removal.additionals || []).map(ad => ({ name: ad.type.replace(/_/g, ' '), quantity: ad.quantity })),
            ...(removal.customAdditionals || []).map(ad => ({ name: ad.name, quantity: 1 }))
        ];

        const grouped = allAdditionals.reduce((acc, item) => {
            const capitalizedName = item.name.charAt(0).toUpperCase() + item.name.slice(1);
            if (!acc[capitalizedName]) {
                acc[capitalizedName] = 0;
            }
            acc[capitalizedName] += item.quantity;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(grouped);
    }, [removal.additionals, removal.customAdditionals]);

    const handleFinalizeAdditionalsClick = () => {
        const initialConfirmation = uniqueAdditionals.reduce((acc, [name]) => {
            acc[name] = 'sim';
            return acc;
        }, {} as Record<string, 'sim' | 'nao'>);
        setAdditionalConfirmation(initialConfirmation);
        setIsFinalizingAdditionals(true);
    };

    const handleConfirmationChange = (name: string, status: 'sim' | 'nao') => {
        setAdditionalConfirmation(prev => ({ ...prev, [name]: status }));
    };

    const handleConfirmProcess = () => {
        if (!user) return;
        
        const confirmationSummary = uniqueAdditionals.map(([name, quantity]) => 
            `${quantity}x ${name} (${additionalConfirmation[name].toUpperCase()})`
        ).join(', ');

        const historyEntry = {
            date: new Date().toISOString(),
            action: `Processo de adicionais finalizado por ${user.name.split(' ')[0]}: ${confirmationSummary}`,
            user: user.name,
        };

        updateRemoval(removal.code, {
            status: 'finalizada',
            history: [...removal.history, historyEntry],
        });

        onClose();
    };

    // Existing Handlers
    const handleSave = () => {
        if (!user || !user.name) return;
        const userName = user.name.split(' ')[0];
        updateRemoval(removal.code, {
            petCondition,
            farewellSchedulingInfo: farewellInfo,
            history: [
                ...removal.history,
                { date: new Date().toISOString(), action: `Operacional ${userName} atualizou informações do pet e despedida`, user: user.name }
            ]
        });
        setIsEditing(false);
    };

    const handleForwardToFinance = () => {
        if (!user || !user.name) return;
        const userName = user.name.split(' ')[0];
        updateRemoval(removal.code, {
            status: 'aguardando_financeiro_junior',
            history: [
                ...removal.history,
                { date: new Date().toISOString(), action: `Encaminhado para o Financeiro Junior por ${userName}`, user: user.name }
            ]
        });
        onClose();
    };

    const handleReleaseForCremation = () => {
        if (!user || !user.name) return;
        const userName = user.name.split(' ')[0];
        updateRemoval(removal.code, {
            status: 'finalizada',
            history: [
                ...removal.history,
                { 
                    date: new Date().toISOString(), 
                    action: `Liberado para cremação pelo Operacional ${userName}`, 
                    user: user.name 
                }
            ]
        });
        onClose();
    };

    const handleMarkAsCremated = () => {
        if (!user) return;
        if (!removal.cremationCompany) {
            alert('Empresa de cremação não definida. Não é possível marcar como cremado.');
            return;
        }
        updateRemoval(removal.code, {
            status: 'cremado',
            history: [
                ...removal.history,
                {
                    date: new Date().toISOString(),
                    action: `Marcado como cremado por ${user.name.split(' ')[0]} na empresa ${removal.cremationCompany}.`,
                    user: user.name,
                },
            ],
        });
        onClose();
    };

    // JSX Logic
    if (removal.status === 'concluida') {
        const isIndividual = removal.modality.includes('individual');

        if (isEditing && isIndividual) {
            return (
                <div className="w-full space-y-4 p-4 bg-gray-100 rounded-lg">
                    <h4 className="font-semibold text-gray-800">Editar Informações Operacionais</h4>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-medium text-gray-600">Condição do Pet</label>
                            <textarea 
                                value={petCondition}
                                onChange={e => setPetCondition(e.target.value)}
                                placeholder="Descreva a condição em que o pet foi recebido..."
                                rows={3}
                                className="w-full px-2 py-1 border rounded-md text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-600">Informações para Agendamento de Despedida</label>
                            <select
                                value={farewellInfo}
                                onChange={e => setFarewellInfo(e.target.value)}
                                className="w-full px-2 py-1 border rounded-md text-sm"
                            >
                                <option value="">Selecione uma opção</option>
                                <option value="LIVRE">LIVRE</option>
                                <option value="11:00">11:00</option>
                                <option value="14:00">14:00</option>
                                <option value="16:00">16:00</option>
                                <option value="11:00 ou 16:00">11:00 ou 16:00</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md text-sm flex items-center gap-1">
                          <X size={14} /> Cancelar
                      </button>
                      <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm flex items-center gap-1">
                          <Save size={14} /> Salvar Informações
                      </button>
                  </div>
                </div>
            );
        }

        return (
            <div className="flex items-center gap-2">
                {isIndividual && (
                    <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 flex items-center gap-2">
                        <Edit size={16} /> Editar Infos de Despedida
                    </button>
                )}
                <button onClick={handleForwardToFinance} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2">
                    <Send size={16} /> Encaminhar para Financeiro
                </button>
            </div>
        );
    }

    if (removal.status === 'aguardando_baixa_master') {
        const isColetivoAdicional = removal.modality === 'coletivo' && 
                                    ((removal.customAdditionals && removal.customAdditionals.length > 0) || (removal.additionals && removal.additionals.length > 0));

        if (isColetivoAdicional) {
            if (isFinalizingAdditionals) {
                return (
                    <div className="w-full space-y-4 p-4 bg-gray-100 rounded-lg">
                        <h4 className="font-semibold text-gray-800">Confirmar Produção de Adicionais</h4>
                        <div className="space-y-3">
                            {uniqueAdditionals.map(([name, quantity]) => (
                                <div key={name} className="flex justify-between items-center p-3 bg-white border rounded-md">
                                    <div>
                                        <p className="font-medium">{name}</p>
                                        <p className="text-sm text-gray-500">Quantidade: {quantity}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm font-medium">Foi feito?</span>
                                        <div className="flex gap-3">
                                            <label className="flex items-center gap-1 cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    name={`confirm-${name}`} 
                                                    value="sim" 
                                                    checked={additionalConfirmation[name] === 'sim'}
                                                    onChange={() => handleConfirmationChange(name, 'sim')}
                                                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                                                />
                                                Sim
                                            </label>
                                            <label className="flex items-center gap-1 cursor-pointer">
                                                <input 
                                                    type="radio" 
                                                    name={`confirm-${name}`} 
                                                    value="nao" 
                                                    checked={additionalConfirmation[name] === 'nao'}
                                                    onChange={() => handleConfirmationChange(name, 'nao')}
                                                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                                                />
                                                Não
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setIsFinalizingAdditionals(false)} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md text-sm flex items-center gap-1">
                                <X size={14} /> Cancelar
                            </button>
                            <button onClick={handleConfirmProcess} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm flex items-center gap-1">
                                <Save size={14} /> Confirmar Finalização
                            </button>
                        </div>
                    </div>
                );
            }

            return (
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleFinalizeAdditionalsClick}
                        className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 flex items-center gap-2"
                    >
                        <CheckCircle size={16} /> Processo Finalizado
                    </button>
                </div>
            );
        }

        // This is the individual logic
        return (
            <div className="flex items-center gap-2">
                <button 
                    onClick={handleReleaseForCremation} 
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                >
                    <Flame size={16} /> Liberar / Cremar
                </button>
            </div>
        );
    }

    if (removal.status === 'finalizada' && removal.modality.includes('individual')) {
        return (
            <div className="flex items-center gap-2">
                <button 
                    onClick={handleMarkAsCremated} 
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center gap-2"
                >
                    <Flame size={16} /> Marcar como Cremado
                </button>
            </div>
        );
    }

    return null;
};

export default OperacionalActions;
