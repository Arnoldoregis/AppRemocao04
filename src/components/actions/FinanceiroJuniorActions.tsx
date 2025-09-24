import React, { useState, useEffect } from 'react';
import { Removal, CustomAdditional } from '../../types';
import { useRemovals } from '../../context/RemovalContext';
import { useAuth } from '../../context/AuthContext';
import { useAgenda } from '../../context/AgendaContext';
import { CheckCircle, Edit, Upload, Plus, Trash2, Save, Flame } from 'lucide-react';
import { priceTable } from '../../data/pricing';

interface FinanceiroJuniorActionsProps {
  removal: Removal;
  onClose: () => void;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  activeEditTab: 'add' | 'adjust' | 'change_modality' | 'cremation';
  setActiveEditTab: (tab: 'add' | 'adjust' | 'change_modality' | 'cremation') => void;
}

const FinanceiroJuniorActions: React.FC<FinanceiroJuniorActionsProps> = ({ 
  removal, 
  onClose,
  isEditing,
  setIsEditing,
  activeEditTab,
  setActiveEditTab,
}) => {
  const { updateRemoval } = useRemovals();
  const { user } = useAuth();
  const { schedule } = useAgenda();
  
  // State for "Adicionar" tab
  const [items, setItems] = useState<CustomAdditional[]>([]);
  const [productName, setProductName] = useState('');
  const [productValue, setProductValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // State for "Abater" tab
  const [adjustmentType, setAdjustmentType] = useState<'receber' | 'devolver'>('receber');
  const [adjustmentValue, setAdjustmentValue] = useState('');
  const [adjustmentProof, setAdjustmentProof] = useState<File | null>(null);

  // State for "Alterar Modalidade" tab
  const [newModality, setNewModality] = useState<Removal['modality']>(removal.modality);
  const [modalityDifference, setModalityDifference] = useState(0);
  const [modalityProof, setModalityProof] = useState<File | null>(null);

  // State for "Dados Cremação" tab
  const [cremationDate, setCremationDate] = useState('');
  const [certificateObs, setCertificateObs] = useState('');

  useEffect(() => {
    if (isEditing) {
      setItems(removal.customAdditionals || []);
      setNewModality(removal.modality);
      setCremationDate(removal.cremationDate || '');
      setCertificateObs(removal.certificateObservations || '');
    }
  }, [isEditing, removal]);

  const getWeightKeyFromRealWeight = (weight: number): keyof typeof priceTable | null => {
    if (weight <= 5) return '0-5kg';
    if (weight <= 10) return '6-10kg';
    if (weight <= 20) return '11-20kg';
    if (weight <= 40) return '21-40kg';
    if (weight <= 50) return '41-50kg';
    if (weight <= 60) return '51-60kg';
    if (weight <= 80) return '61-80kg';
    return null;
  };

  useEffect(() => {
    if (activeEditTab === 'change_modality' && newModality && newModality !== removal.modality) {
      const weightKey = removal.realWeight 
        ? getWeightKeyFromRealWeight(removal.realWeight) 
        : removal.pet.weight as keyof typeof priceTable;
      
      if (weightKey) {
        const oldPrice = priceTable[weightKey]?.[removal.modality] || 0;
        const newPrice = priceTable[weightKey]?.[newModality] || 0;
        setModalityDifference(newPrice - oldPrice);
      }
    } else {
      setModalityDifference(0);
    }
  }, [newModality, activeEditTab, removal]);

  const resetAndCloseEdit = () => {
    setIsEditing(false);
    setProductName('');
    setProductValue('');
    setSelectedFile(null);
    setAdjustmentValue('');
    setAdjustmentProof(null);
    setNewModality(removal.modality);
    setModalityDifference(0);
    setModalityProof(null);
    setCremationDate('');
    setCertificateObs('');
  };

  const handleFinalizeForMaster = () => {
    if (!user) return;

    const isScheduled = Object.values(schedule).some(scheduledRemoval => scheduledRemoval.code === removal.code);
    const actionText = isScheduled
      ? `finalizou e enviou para o Financeiro Master com despedida agendada`
      : `finalizou e enviou para o Financeiro Master sem despedida agendada`;

    updateRemoval(removal.code, {
      status: 'aguardando_baixa_master',
      history: [
        ...removal.history,
        {
          date: new Date().toISOString(),
          action: `Financeiro Junior ${user.name.split(' ')[0]} ${actionText}`,
          user: user.name,
        },
      ],
    });
    onClose();
  };

  const handleAddItem = () => {
    if (productName && productValue && items.length < 10) {
      const processAndAddItem = (proofString?: string) => {
        const newItem: CustomAdditional = {
          id: new Date().toISOString(),
          name: productName,
          value: parseFloat(productValue),
          paymentProof: proofString,
        };
        setItems([...items, newItem]);
        setProductName('');
        setProductValue('');
        setSelectedFile(null);
        const fileInput = document.getElementById('custom-product-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      };
  
      if (selectedFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          // Concatenamos a data URL e o nome do arquivo para uso posterior
          const proofString = `${dataUrl}||${selectedFile.name}`;
          processAndAddItem(proofString);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        processAndAddItem();
      }
    }
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleSaveItems = () => {
    if (!user) return;
    const originalItems = removal.customAdditionals || [];
    const addedItems = items.filter(i => !originalItems.some(oi => oi.id === i.id));
    const removedItems = originalItems.filter(oi => !items.some(i => i.id === oi.id));
    
    let historyActions: string[] = [];

    if (addedItems.length > 0) {
      const itemsSummary = addedItems.map(i => 
        `${i.name} (R$ ${i.value.toFixed(2)})${i.paymentProof ? ` [comprovante anexado]` : ''}`
      ).join(', ');
      historyActions.push(`adicionou: ${itemsSummary}`);
    }

    if (removedItems.length > 0) {
      const itemsSummary = removedItems.map(i => `${i.name} (R$ ${i.value.toFixed(2)})`).join(', ');
      historyActions.push(`removeu: ${itemsSummary}`);
    }

    if (historyActions.length > 0) {
      const totalOriginalValue = originalItems.reduce((acc, item) => acc + item.value, 0);
      const totalNewValue = items.reduce((acc, item) => acc + item.value, 0);
      const diff = totalNewValue - totalOriginalValue;
      
      updateRemoval(removal.code, {
        customAdditionals: items, 
        value: removal.value + diff,
        history: [...removal.history, { 
          date: new Date().toISOString(), 
          action: `Financeiro Junior ${user.name.split(' ')[0]} ${historyActions.join(' e ')}.`, 
          user: user.name 
        }],
      });
    }
    resetAndCloseEdit();
  };
  
  const handleSaveAdjustment = () => {
    if (!user || !adjustmentValue) return;
    const value = parseFloat(adjustmentValue);
    const newValue = adjustmentType === 'receber' ? removal.value + value : removal.value - value;
    const actionText = adjustmentType === 'receber' ? `recebeu um valor de R$ ${value.toFixed(2)}` : `devolveu um valor de R$ ${value.toFixed(2)}`;
    updateRemoval(removal.code, {
      value: newValue,
      adjustmentConfirmed: true,
      history: [...removal.history, { date: new Date().toISOString(), action: `Financeiro Junior ${user.name.split(' ')[0]} ${actionText}.`, user: user.name, proofUrl: adjustmentProof ? adjustmentProof.name : undefined }],
    });
    resetAndCloseEdit();
  };

  const handleSaveModality = () => {
    if (!user || modalityDifference === 0) return;
    const newValue = removal.value + modalityDifference;
    const actionText = `alterou a modalidade de ${removal.modality.replace(/_/g, ' ')} para ${newModality.replace(/_/g, ' ')}, com um ajuste de R$ ${modalityDifference.toFixed(2)}`;
    updateRemoval(removal.code, {
      modality: newModality, value: newValue,
      history: [...removal.history, { date: new Date().toISOString(), action: `Financeiro Junior ${user.name.split(' ')[0]} ${actionText}.`, user: user.name, proofUrl: modalityProof ? modalityProof.name : undefined }],
    });
    resetAndCloseEdit();
  };

  const handleSaveCremationData = () => {
    if (!user) return;
    const dateChanged = cremationDate !== (removal.cremationDate || '');
    const obsChanged = certificateObs !== (removal.certificateObservations || '');

    if (!dateChanged && !obsChanged) {
      resetAndCloseEdit();
      return;
    }

    const actionParts: string[] = [];

    if (dateChanged && cremationDate) {
        const [year, month, day] = cremationDate.split('-');
        const formattedDate = `${day}/${month}/${year}`;
        actionParts.push(`definiu a data de cremação para ${formattedDate}`);
    }

    if (obsChanged) {
        if (certificateObs) {
            actionParts.push(`adicionou a observação ao certificado: "${certificateObs}"`);
        } else {
            actionParts.push(`removeu as observações do certificado`);
        }
    }

    const actionText = actionParts.join(' e ');

    if (actionText) {
        updateRemoval(removal.code, {
            cremationDate,
            certificateObservations: certificateObs,
            history: [...removal.history, { 
                date: new Date().toISOString(), 
                action: `Financeiro Junior ${user.name.split(' ')[0]} ${actionText}.`, 
                user: user.name 
            }],
        });
    }

    resetAndCloseEdit();
  };

  if (removal.status !== 'aguardando_financeiro_junior') return null;

  if (isEditing) {
    return (
      <div className="w-full h-full flex flex-col">
        {/* TABS */}
        <div className="flex-shrink-0 border-b">
          <button onClick={() => setActiveEditTab('add')} className={`px-4 py-2 text-sm font-medium ${activeEditTab === 'add' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-600'}`}>Adicionar Produtos</button>
          <button onClick={() => setActiveEditTab('adjust')} className={`px-4 py-2 text-sm font-medium ${activeEditTab === 'adjust' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-600'}`}>Abater Valores</button>
          <button onClick={() => setActiveEditTab('change_modality')} className={`px-4 py-2 text-sm font-medium ${activeEditTab === 'change_modality' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-600'}`}>Alterar Modalidade</button>
          <button onClick={() => setActiveEditTab('cremation')} className={`px-4 py-2 text-sm font-medium ${activeEditTab === 'cremation' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-600'}`}>Dados Cremação</button>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-grow overflow-y-auto p-4">
          {activeEditTab === 'add' && (
            <div className="space-y-4">
              <div className="space-y-3 p-3 bg-gray-50 rounded-md border">
                <div className="flex gap-2 items-end">
                  <div className="flex-grow"><label className="text-xs font-medium text-gray-600">Produto</label><input type="text" value={productName} onChange={e => setProductName(e.target.value)} placeholder="Nome do produto" className="w-full px-2 py-1 border rounded-md text-sm" /></div>
                  <div className="w-24"><label className="text-xs font-medium text-gray-600">Valor (R$)</label><input type="number" value={productValue} onChange={e => setProductValue(e.target.value)} placeholder="Valor" className="w-full px-2 py-1 border rounded-md text-sm" /></div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1"><Upload className="inline h-4 w-4 mr-1" />Anexar Comprovante (opcional)</label>
                  <input id="custom-product-file-input" type="file" accept=".jpg,.jpeg,.pdf" onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                </div>
                <button onClick={handleAddItem} disabled={items.length >= 10 || !productName || !productValue} className="w-full px-3 py-1.5 bg-blue-500 text-white rounded-md text-sm flex items-center justify-center gap-1 disabled:opacity-50"><Plus size={16} /> Adicionar Item</button>
              </div>
              {items.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Itens Adicionados:</p>
                  <ul className="list-disc list-inside text-sm bg-gray-100 p-3 rounded-md border">
                    {items.map(item => (<li key={item.id} className="flex justify-between items-center py-1"><span>{item.name} - R$ {item.value.toFixed(2)}</span><button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button></li>))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {activeEditTab === 'adjust' && (
            <div className="space-y-4 p-1">
              <div className="flex gap-4"><label className="flex items-center gap-2"><input type="radio" name="adjustmentType" value="receber" checked={adjustmentType === 'receber'} onChange={() => setAdjustmentType('receber')} />Receber</label><label className="flex items-center gap-2"><input type="radio" name="adjustmentType" value="devolver" checked={adjustmentType === 'devolver'} onChange={() => setAdjustmentType('devolver')} />Devolver</label></div>
              <div><label className="text-xs font-medium text-gray-600">Valor (R$)</label><input type="number" value={adjustmentValue} onChange={e => setAdjustmentValue(e.target.value)} placeholder="Valor do ajuste" className="w-full px-2 py-1 border rounded-md text-sm" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1"><Upload className="inline h-4 w-4 mr-1" />Anexar Comprovante (opcional)</label><input type="file" accept=".jpg,.jpeg,.pdf" onChange={e => setAdjustmentProof(e.target.files ? e.target.files[0] : null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" /></div>
            </div>
          )}
          {activeEditTab === 'change_modality' && (
            <div className="space-y-4 p-1">
              <div>
                <label className="text-xs font-medium text-gray-600">Nova Modalidade</label>
                <select value={newModality} onChange={e => setNewModality(e.target.value as Removal['modality'])} className="w-full px-2 py-1 border rounded-md text-sm">
                  <option value="coletivo">Coletivo</option>
                  <option value="individual_prata">Individual Prata</option>
                  <option value="individual_ouro">Individual Ouro</option>
                </select>
              </div>
              {modalityDifference !== 0 && (
                <div className={`p-3 rounded-md text-sm ${modalityDifference > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {modalityDifference > 0 ? `Valor a cobrar: R$ ${modalityDifference.toFixed(2)}` : `Valor a devolver: R$ ${Math.abs(modalityDifference).toFixed(2)}`}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1"><Upload className="inline h-4 w-4 mr-1" />Anexar Comprovante do Ajuste</label>
                <input type="file" accept=".jpg,.jpeg,.pdf" onChange={e => setModalityProof(e.target.files ? e.target.files[0] : null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              </div>
            </div>
          )}
          {activeEditTab === 'cremation' && (
            <div className="space-y-4 p-1">
              <div>
                <label className="text-xs font-medium text-gray-600">Data da Cremação</label>
                <input type="date" value={cremationDate} onChange={e => setCremationDate(e.target.value)} className="w-full px-2 py-1 border rounded-md text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Observações para o Certificado</label>
                <textarea value={certificateObs} onChange={e => setCertificateObs(e.target.value)} placeholder="Ex: Adicionar nome do tutor no certificado" rows={3} className="w-full px-2 py-1 border rounded-md text-sm" />
              </div>
            </div>
          )}
        </div>

        {/* FIXED BUTTONS */}
        <div className="flex-shrink-0 p-3 border-t bg-gray-50 flex justify-end gap-2">
          <button onClick={resetAndCloseEdit} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md text-sm">Cancelar</button>
          
          {activeEditTab === 'add' && <button onClick={handleSaveItems} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm flex items-center gap-1"><Save size={14} /> Salvar Produtos</button>}
          {activeEditTab === 'adjust' && <button onClick={handleSaveAdjustment} disabled={!adjustmentValue} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm flex items-center gap-1 disabled:opacity-50"><Save size={14} /> Salvar Abatimento</button>}
          {activeEditTab === 'change_modality' && <button onClick={handleSaveModality} disabled={modalityDifference === 0} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm flex items-center gap-1 disabled:opacity-50"><Save size={14} /> Salvar Alteração</button>}
          {activeEditTab === 'cremation' && <button onClick={handleSaveCremationData} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm flex items-center gap-1"><Flame size={14} /> Salvar Dados</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => { setActiveEditTab('add'); setIsEditing(true); }} className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 flex items-center gap-2"><Edit size={16} /> Adicionar/Editar</button>
      <button onClick={handleFinalizeForMaster} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"><CheckCircle size={16} /> Finalizar para Master</button>
    </div>
  );
};

export default FinanceiroJuniorActions;
