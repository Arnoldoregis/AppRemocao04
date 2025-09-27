import React, { useState } from 'react';
import { usePricing } from '../../context/PricingContext';
import { Edit, Save, X, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import AddWeightRangeModal from '../modals/AddWeightRangeModal';

const PricingManagement: React.FC = () => {
    const { priceTable, modalities, updatePrice, toggleModalityStatus, removeWeightRange } = usePricing();
    const [editingCell, setEditingCell] = useState<{ range: string; mod: string } | null>(null);
    const [editValue, setEditValue] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const weightRanges = Object.keys(priceTable);

    const handleEditClick = (range: string, modKey: string, currentValue: number) => {
        setEditingCell({ range, mod: modKey });
        setEditValue(currentValue.toString());
    };

    const handleCancelEdit = () => {
        setEditingCell(null);
        setEditValue('');
    };

    const handleSaveEdit = () => {
        if (editingCell) {
            const newPrice = parseFloat(editValue);
            if (!isNaN(newPrice)) {
                updatePrice(editingCell.range, editingCell.mod, newPrice);
            }
            handleCancelEdit();
        }
    };
    
    const handleRemoveRange = (range: string) => {
        if(window.confirm(`Tem certeza que deseja remover a faixa de peso "${range}"?`)) {
            removeWeightRange(range);
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Gerenciamento de Planos e Preços</h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Adicionar Faixa de Peso
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faixa de Peso</th>
                                {modalities.map(mod => (
                                    <th key={mod.key} className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <div className="flex items-center justify-end gap-2">
                                            <span>{mod.label}</span>
                                            <button onClick={() => toggleModalityStatus(mod.key)} title={mod.active ? 'Suspender modalidade' : 'Ativar modalidade'}>
                                                {mod.active ? <Eye size={16} className="text-green-600"/> : <EyeOff size={16} className="text-red-600"/>}
                                            </button>
                                        </div>
                                    </th>
                                ))}
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {weightRanges.map(range => (
                                <tr key={range} className="hover:bg-gray-50 group">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{range}</td>
                                    {modalities.map(mod => {
                                        const isEditing = editingCell?.range === range && editingCell?.mod === mod.key;
                                        return (
                                            <td key={mod.key} className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                                                {isEditing ? (
                                                    <div className="flex items-center justify-end gap-1">
                                                        <input
                                                            type="number"
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            className="w-24 px-2 py-1 border rounded-md text-right"
                                                            autoFocus
                                                        />
                                                        <button onClick={handleSaveEdit} className="p-1 text-green-600"><Save size={16}/></button>
                                                        <button onClick={handleCancelEdit} className="p-1 text-red-600"><X size={16}/></button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span>R$ {priceTable[range]?.[mod.key]?.toFixed(2) || 'N/A'}</span>
                                                        <button onClick={() => handleEditClick(range, mod.key, priceTable[range]?.[mod.key] || 0)} className="p-1 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100"><Edit size={14}/></button>
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <button onClick={() => handleRemoveRange(range)} className="text-red-500 hover:text-red-700" title="Remover faixa de peso">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {isModalOpen && <AddWeightRangeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};

export default PricingManagement;
