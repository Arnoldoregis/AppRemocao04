import React, { useState, useEffect, useMemo } from 'react';
import { Removal, CustomAdditional, StockItem } from '../../types';
import { useRemovals } from '../../context/RemovalContext';
import { useAuth } from '../../context/AuthContext';
import { useAgenda } from '../../context/AgendaContext';
import { usePricing } from '../../context/PricingContext';
import { useStock } from '../../context/StockContext';
import { CheckCircle, Edit, Upload, Trash2, Save, Flame, Undo, Building, Award, MessageSquare, Send, Search, Plus, Minus } from 'lucide-react';
import CertificateModal from '../modals/CertificateModal';
import CremationDataModal from '../modals/CremationDataModal';

interface EditableProduct extends Omit<CustomAdditional, 'id'> {
  productId: string;
  quantity: number;
}

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
  const { priceTable } = usePricing();
  const { stock } = useStock();
  
  // States
  const [items, setItems] = useState<EditableProduct[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'receber' | 'devolver'>('receber');
  const [adjustmentValue, setAdjustmentValue] = useState('');
  const [adjustmentProof, setAdjustmentProof] = useState<File | null>(null);
  const [newModality, setNewModality] = useState<Removal['modality']>(removal.modality);
  const [modalityDifference, setModalityDifference] = useState(0);
  const [modalityProof, setModalityProof] = useState<File | null>(null);
  const [cremationCompany, setCremationCompany] = useState<Removal['cremationCompany'] | undefined>(undefined);
  const [cremationDate, setCremationDate] = useState('');
  const [certificateObs, setCertificateObs] = useState('');
  const [isConfirmingFinalization, setIsConfirmingFinalization] = useState(false);
  const [isConfirmingDeliveryFinalization, setIsConfirmingDeliveryFinalization] = useState(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [isCremationDataModalOpen, setIsCremationDataModalOpen] = useState(false);

  const searchResults = useMemo(() => {
    if (!productSearchTerm.trim()) return [];
    const lower = productSearchTerm.toLowerCase();
    return stock.filter(item =>
        item.category === 'material_venda' &&
        (item.name.toLowerCase().includes(lower) || item.trackingCode.toLowerCase().includes(lower))
    );
  }, [productSearchTerm, stock]);

  useEffect(() => {
    if (isEditing) {
      const groupedItems = (removal.customAdditionals || []).reduce((acc, current) => {
          const key = `${current.name}|${current.value}`;
          const existing = acc.get(key);
          if (existing) {
              existing.quantity += 1;
          } else {
              acc.set(key, {
                  productId: key,
                  name: current.name,
                  value: current.value,
                  quantity: 1,
              });
          }
          return acc;
      }, new Map<string, EditableProduct>());

      setItems(Array.from(groupedItems.values()));
      setNewModality(removal.modality);
      setCremationCompany(removal.cremationCompany);
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
  }, [newModality, activeEditTab, removal, priceTable]);

  const resetAndCloseEdit = () => {
    setIsEditing(false);
    setItems([]);
    setProductSearchTerm(''); setSelectedFile(null);
    setAdjustmentValue(''); setAdjustmentProof(null);
    setNewModality(removal.modality); setModalityDifference(0); setModalityProof(null);
    setCremationCompany(undefined); setCremationDate(''); setCertificateObs('');
  };

  const handleConfirmFinalization = () => {
    if (!user) return;
    if (!removal.cremationCompany) {
      alert('Por favor, defina a empresa de cremação (PETCÈU ou SQP) na aba "Dados Cremação" antes de finalizar.');
      setIsConfirmingFinalization(false);
      return;
    }
    const isScheduled = Object.values(schedule).some(scheduledRemoval => scheduledRemoval.code === removal.code);
    const farewellText = isScheduled ? `com despedida agendada` : `sem despedida agendada`;
    updateRemoval(removal.code, {
      status: 'aguardando_baixa_master',
      history: [...removal.history, { date: new Date().toISOString(), action: `Financeiro Junior ${user.name.split(' ')[0]} finalizou e enviou para o Financeiro Master (${removal.cremationCompany}) ${farewellText}`, user: user.name }],
    });
    onClose();
  };

  const handleFinalizeDeliveryForMaster = () => {
    if (!user) return;
    updateRemoval(removal.code, {
        status: 'aguardando_baixa_master',
        history: [
            ...removal.history,
            {
                date: new Date().toISOString(),
                action: `Pronto para entrega. Finalizado para Master por ${user.name.split(' ')[0]}.`,
                user: user.name,
            },
        ],
    });
    onClose();
  };

  const handleReturnToOperational = () => {
    if (!user) return;
    updateRemoval(removal.code, {
      status: 'aguardando_baixa_master',
      history: [...removal.history, { date: new Date().toISOString(), action: `Financeiro Junior ${user.name.split(' ')[0]} retornou a remoção para o Operacional.`, user: user.name }],
    });
    onClose();
  };

  const handleSendToRelease = () => {
    if (!user) return;
    updateRemoval(removal.code, {
      status: 'aguardando_baixa_master',
      history: [
        ...removal.history,
        {
          date: new Date().toISOString(),
          action: `Enviado para liberação de cremação sem despedida pelo Fin. Junior ${user.name.split(' ')[0]}`,
          user: user.name,
        },
      ],
    });
    onClose();
  };

  const handleAddProductFromSearch = (product: StockItem) => {
    setItems(prev => {
        const existingItemIndex = prev.findIndex(item => item.productId === product.id);
        if (existingItemIndex > -1) {
            const newItems = [...prev];
            newItems[existingItemIndex].quantity += 1;
            return newItems;
        } else {
            return [...prev, {
                productId: product.id,
                name: product.name,
                value: product.sellingPrice,
                quantity: 1
            }];
        }
    });
    setProductSearchTerm('');
  };

  const handleQuantityChange = (productId: string, change: number) => {
    setItems(prev => 
        prev.map(item => 
            item.productId === productId
                ? { ...item, quantity: item.quantity + change }
                : item
        ).filter(item => item.quantity > 0)
    );
  };

  const handleRemoveItem = (productId: string) => {
    setItems(prev => prev.filter(item => item.productId !== productId));
  };

  const handleSaveItems = async () => {
    if (!user) return;
    let proofString: string | undefined = undefined;
    
    if (selectedFile) {
        proofString = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(`${e.target?.result as string}||${selectedFile.name}`);
            reader.readAsDataURL(selectedFile);
        });
    }

    const newCustomAdditionals: CustomAdditional[] = items.flatMap(item => 
        Array.from({ length: item.quantity }, (_, i) => ({
            id: `${item.productId}_${Date.now()}_${i}`,
            name: item.name,
            value: item.value,
            paymentProof: proofString 
        }))
    );

    const newAdditionalsValue = newCustomAdditionals.reduce((sum, item) => sum + item.value, 0);
    const oldAdditionalsValue = (removal.customAdditionals || []).reduce((sum, item) => sum + item.value, 0);
    const valueDiff = newAdditionalsValue - oldAdditionalsValue;

    const itemsSummary = items.map(item => `${item.quantity}x ${item.name}`).join(', ');
    const historyAction = `Financeiro Junior ${user.name.split(' ')[0]} atualizou os produtos adicionais para: ${itemsSummary || 'nenhum'}.`;

    updateRemoval(removal.code, {
        customAdditionals: newCustomAdditionals,
        value: removal.value + valueDiff,
        history: [...removal.history, { date: new Date().toISOString(), action: historyAction, user: user.name }],
    });
    
    resetAndCloseEdit();
  };
  
  const handleSaveAdjustment = () => {
    if (!user || !adjustmentValue) return;
    const value = parseFloat(adjustmentValue);
    const actionText = adjustmentType === 'receber' ? `recebeu um valor de R$ ${value.toFixed(2)}` : `devolveu um valor de R$ ${value.toFixed(2)}`;
    updateRemoval(removal.code, {
      value: adjustmentType === 'receber' ? removal.value + value : removal.value - value,
      adjustmentConfirmed: true,
      history: [...removal.history, { date: new Date().toISOString(), action: `Financeiro Junior ${user.name.split(' ')[0]} ${actionText}.`, user: user.name, proofUrl: adjustmentProof ? adjustmentProof.name : undefined }],
    });
    resetAndCloseEdit();
  };

  const handleSaveModality = () => {
    if (!user || modalityDifference === 0) return;
    const actionText = `alterou a modalidade de ${removal.modality.replace(/_/g, ' ')} para ${newModality.replace(/_/g, ' ')}, com um ajuste de R$ ${modalityDifference.toFixed(2)}`;
    updateRemoval(removal.code, {
      modality: newModality, value: removal.value + modalityDifference,
      history: [...removal.history, { date: new Date().toISOString(), action: `Financeiro Junior ${user.name.split(' ')[0]} ${actionText}.`, user: user.name, proofUrl: modalityProof ? modalityProof.name : undefined }],
    });
    resetAndCloseEdit();
  };

  const handleSaveCremationData = () => {
    if (!user) return;
    const companyChanged = cremationCompany !== (removal.cremationCompany || undefined);
    const dateChanged = cremationDate !== (removal.cremationDate || '');
    const obsChanged = certificateObs !== (removal.certificateObservations || '');
    if (!companyChanged && !dateChanged && !obsChanged) { resetAndCloseEdit(); return; }
    const actionParts: string[] = [];
    if (companyChanged && cremationCompany) actionParts.push(`definiu a empresa de cremação para ${cremationCompany}`);
    if (dateChanged && cremationDate) {
        const [year, month, day] = cremationDate.split('-');
        actionParts.push(`definiu a data de cremação para ${day}/${month}/${year}`);
    }
    if (obsChanged) actionParts.push(certificateObs ? `adicionou a observação ao certificado: "${certificateObs}"` : `removeu as observações do certificado`);
    if (actionParts.join(' e ')) {
        updateRemoval(removal.code, {
            cremationCompany, cremationDate, certificateObservations: certificateObs,
            history: [...removal.history, { date: new Date().toISOString(), action: `Financeiro Junior ${user.name.split(' ')[0]} ${actionParts.join(' e ')}.`, user: user.name }],
        });
    }
    resetAndCloseEdit();
  };

  const handleNotifyTutor = () => {
    if (!user || !removal.tutor.phone) {
        alert('Número de contato do tutor não encontrado.');
        return;
    }

    const tutorName = removal.tutor.name;
    const message = `Olá ${tutorName}, seu anjinho ja esta pronto para retirada ou entrega. Nosso horario de atendimento para retirada é de segunda a sexta as 9hs até as 17hs e sabado das 8:30hs até as 11:30hs, a unidade de retirada fica na Rua Santa Helena 51 Centro Pinhais Cep 83.324-220. Se quiser optar por entrega via motoboy, term um custo de 30,00 reais para a entrega. Favor nos acionar respondento a qual opção é melhor. Lembrando que para a entrega temos agendamento, verificar disponibilidade.`;

    const cleanedPhone = removal.tutor.phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/55${cleanedPhone}?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

    updateRemoval(removal.code, {
        history: [
            ...removal.history,
            {
                date: new Date().toISOString(),
                action: `Financeiro Junior ${user.name.split(' ')[0]} notificou o tutor sobre a retirada via WhatsApp.`,
                user: user.name,
            },
        ],
    });
  };

  const handleGenerateCertificate = () => {
    if (!removal.cremationDate || !removal.cremationCompany) {
      setIsCremationDataModalOpen(true);
    } else {
      setIsCertificateModalOpen(true);
    }
  };

  const handleConfirmCremationData = (data: { date: string; company: 'PETCÈU' | 'SQP' }) => {
    if (!user) return;
    const [year, month, day] = data.date.split('-');
    const formattedDate = `${day}/${month}/${year}`;

    const updates: Partial<Removal> = {};
    const historyActions: string[] = [];

    if (!removal.cremationDate && data.date) {
        updates.cremationDate = data.date;
        historyActions.push(`data de cremação definida para ${formattedDate}`);
    }
    if (!removal.cremationCompany && data.company) {
        updates.cremationCompany = data.company;
        historyActions.push(`empresa de cremação definida para ${data.company}`);
    }

    if (historyActions.length > 0) {
        updateRemoval(removal.code, {
          ...updates,
          history: [
            ...removal.history,
            {
              date: new Date().toISOString(),
              action: `Financeiro Junior ${user.name.split(' ')[0]} atualizou dados para certificado: ${historyActions.join(' e ')}.`,
              user: user.name,
            },
          ],
        });
    }
    
    setIsCremationDataModalOpen(false);
    setTimeout(() => {
        setIsCertificateModalOpen(true);
    }, 100);
  };

  // Handle 'Pronto para Entrega' tab
  if (removal.status === 'pronto_para_entrega') {
    const tutorNotified = removal.history.some(h => h.action.includes('notificou o tutor'));

    if (isConfirmingDeliveryFinalization) {
        return (
            <div className="w-full p-4 bg-yellow-50 rounded-lg border border-yellow-300">
                <h4 className="font-semibold text-yellow-900 mb-3 text-center">Tem certeza que deseja finalizar e enviar para o Master?</h4>
                <div className="flex gap-2">
                    <button onClick={() => setIsConfirmingDeliveryFinalization(false)} className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">NÃO</button>
                    <button onClick={handleFinalizeDeliveryForMaster} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">SIM</button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex items-center gap-2">
                <button
                    onClick={handleGenerateCertificate}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2"
                >
                    <Award size={16} /> Gerar Certificado
                </button>
                <button
                    onClick={handleNotifyTutor}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                    <MessageSquare size={16} /> Avisar Tutor
                </button>
                {tutorNotified && (
                    <button
                        onClick={() => setIsConfirmingDeliveryFinalization(true)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                    >
                        <Send size={16} /> Finalizar para Master
                    </button>
                )}
            </div>
            <CremationDataModal
                isOpen={isCremationDataModalOpen}
                onClose={() => setIsCremationDataModalOpen(false)}
                onConfirm={handleConfirmCremationData}
                removal={removal}
            />
            <CertificateModal
                isOpen={isCertificateModalOpen}
                onClose={() => setIsCertificateModalOpen(false)}
                removal={removal}
            />
        </>
    );
  }

  // Handle 'Finalizadas' tab (status: aguardando_baixa_master)
  if (removal.status === 'aguardando_baixa_master') {
    return (
        <>
            <button
                onClick={handleGenerateCertificate}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2"
            >
                <Award size={16} /> Gerar Certificado
            </button>
            <CremationDataModal
                isOpen={isCremationDataModalOpen}
                onClose={() => setIsCremationDataModalOpen(false)}
                onConfirm={handleConfirmCremationData}
                removal={removal}
            />
            <CertificateModal
                isOpen={isCertificateModalOpen}
                onClose={() => setIsCertificateModalOpen(false)}
                removal={removal}
            />
        </>
    );
  }

  // Handle 'Pendentes' tabs (status: aguardando_financeiro_junior)
  if (removal.status === 'aguardando_financeiro_junior') {
    const isCollective = removal.modality === 'coletivo';
    if (isEditing) {
      return (
        <div className="w-full h-full flex flex-col">
          <div className="flex-shrink-0 border-b">
            <button onClick={() => setActiveEditTab('add')} className={`px-4 py-2 text-sm font-medium ${activeEditTab === 'add' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-600'}`}>Adicionar Produtos</button>
            <button onClick={() => setActiveEditTab('adjust')} className={`px-4 py-2 text-sm font-medium ${activeEditTab === 'adjust' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-600'}`}>Abater Valores</button>
            <button onClick={() => setActiveEditTab('change_modality')} className={`px-4 py-2 text-sm font-medium ${activeEditTab === 'change_modality' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-600'}`}>Alterar Modalidade</button>
            <button onClick={() => setActiveEditTab('cremation')} className={`px-4 py-2 text-sm font-medium ${activeEditTab === 'cremation' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-600'}`}>Dados Cremação</button>
          </div>
          <div className="flex-grow overflow-y-auto p-4">
            {activeEditTab === 'add' && (
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">Buscar Produto de Venda</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={productSearchTerm}
                                onChange={e => setProductSearchTerm(e.target.value)}
                                placeholder="Buscar por nome ou código..."
                                className="w-full pl-9 pr-3 py-2 border rounded-md text-sm"
                            />
                            {searchResults.length > 0 && (
                                <div className="absolute w-full bg-white border mt-1 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                                    {searchResults.map(product => (
                                        <button
                                            key={product.id}
                                            type="button"
                                            onClick={() => handleAddProductFromSearch(product)}
                                            className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                                        >
                                            <p className="font-semibold">{product.name}</p>
                                            <p className="text-xs text-gray-500">
                                                Código: {product.trackingCode} - R$ {product.sellingPrice.toFixed(2)}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-800">Itens Adicionados:</h4>
                        {items.length > 0 ? (
                            <ul className="space-y-2">
                                {items.map(item => (
                                    <li key={item.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border">
                                        <div>
                                            <p className="font-medium">{item.name}</p>
                                            <p className="text-sm text-gray-500">R$ {item.value.toFixed(2)} / un.</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2 border rounded-full p-1 bg-white">
                                                <button type="button" onClick={() => handleQuantityChange(item.productId, -1)} className="p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200"><Minus size={12} /></button>
                                                <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                                                <button type="button" onClick={() => handleQuantityChange(item.productId, 1)} className="p-1 rounded-full bg-green-100 text-green-600 hover:bg-green-200"><Plus size={12} /></button>
                                            </div>
                                            <p className="w-24 text-right font-semibold text-gray-700">R$ {(item.value * item.quantity).toFixed(2)}</p>
                                            <button onClick={() => handleRemoveItem(item.productId)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16} /></button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-4">Nenhum item adicionado.</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            <Upload className="inline h-4 w-4 mr-1" />
                            Anexar Comprovante (opcional, para todos os itens)
                        </label>
                        <input
                            id="custom-product-file-input"
                            type="file"
                            accept=".jpg,.jpeg,.pdf"
                            onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                    </div>
                </div>
            )}
            {activeEditTab === 'adjust' && <div className="space-y-4 p-1"><div className="flex gap-4"><label className="flex items-center gap-2"><input type="radio" name="adjustmentType" value="receber" checked={adjustmentType === 'receber'} onChange={() => setAdjustmentType('receber')} />Receber</label><label className="flex items-center gap-2"><input type="radio" name="adjustmentType" value="devolver" checked={adjustmentType === 'devolver'} onChange={() => setAdjustmentType('devolver')} />Devolver</label></div><div><label className="text-xs font-medium text-gray-600">Valor (R$)</label><input type="number" value={adjustmentValue} onChange={e => setAdjustmentValue(e.target.value)} placeholder="Valor do ajuste" className="w-full px-2 py-1 border rounded-md text-sm" /></div><div><label className="block text-xs font-medium text-gray-600 mb-1"><Upload className="inline h-4 w-4 mr-1" />Anexar Comprovante</label><input type="file" accept=".jpg,.jpeg,.pdf" onChange={e => setAdjustmentProof(e.target.files ? e.target.files[0] : null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" /></div></div>}
            {activeEditTab === 'change_modality' && <div className="space-y-4 p-1"><div><label className="text-xs font-medium text-gray-600">Nova Modalidade</label><select value={newModality} onChange={e => setNewModality(e.target.value as Removal['modality'])} className="w-full px-2 py-1 border rounded-md text-sm"><option value="coletivo">Coletivo</option><option value="individual_prata">Individual Prata</option><option value="individual_ouro">Individual Ouro</option></select></div>{modalityDifference !== 0 && <div className={`p-3 rounded-md text-sm ${modalityDifference > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{modalityDifference > 0 ? `Valor a cobrar: R$ ${modalityDifference.toFixed(2)}` : `Valor a devolver: R$ ${Math.abs(modalityDifference).toFixed(2)}`}</div>}<div><label className="block text-xs font-medium text-gray-600 mb-1"><Upload className="inline h-4 w-4 mr-1" />Anexar Comprovante</label><input type="file" accept=".jpg,.jpeg,.pdf" onChange={e => setModalityProof(e.target.files ? e.target.files[0] : null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" /></div></div>}
            {activeEditTab === 'cremation' && <div className="space-y-4 p-1"><div><label className="text-xs font-medium text-gray-600 flex items-center mb-2"><Building className="h-4 w-4 mr-2"/>Empresa de Cremação</label><div className="flex gap-4"><label className="flex items-center gap-2"><input type="radio" name="cremationCompany" value="PETCÈU" checked={cremationCompany === 'PETCÈU'} onChange={() => setCremationCompany('PETCÈU')} />PETCÈU</label><label className="flex items-center gap-2"><input type="radio" name="cremationCompany" value="SQP" checked={cremationCompany === 'SQP'} onChange={() => setCremationCompany('SQP')} />SQP</label></div></div><div><label className="text-xs font-medium text-gray-600">Data da Cremação</label><input type="date" value={cremationDate} onChange={e => setCremationDate(e.target.value)} className="w-full px-2 py-1 border rounded-md text-sm" /></div><div><label className="text-xs font-medium text-gray-600">Observações para o Certificado</label><textarea value={certificateObs} onChange={e => setCertificateObs(e.target.value)} placeholder="Ex: Adicionar nome do tutor no certificado" rows={3} className="w-full px-2 py-1 border rounded-md text-sm" /></div></div>}
          </div>
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
    if (isConfirmingFinalization) {
      return (
          <div className="w-full p-4 bg-yellow-50 rounded-lg border border-yellow-300">
              <h4 className="font-semibold text-yellow-900 mb-3 text-center">Tem certeza que deseja finalizar para Master?</h4>
              <div className="flex gap-2">
                  <button onClick={() => setIsConfirmingFinalization(false)} className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">NÃO</button>
                  <button onClick={handleConfirmFinalization} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">SIM</button>
              </div>
          </div>
      );
    }

    const isScheduled = Object.values(schedule).some(scheduledRemoval => scheduledRemoval.code === removal.code);

    return (
      <div className="flex items-center gap-2">
        <button onClick={() => { setActiveEditTab('add'); setIsEditing(true); }} className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 flex items-center gap-2"><Edit size={16} /> Adicionar/Editar</button>
        
        {!isCollective && !isScheduled && (
          <button
            onClick={handleSendToRelease}
            className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 flex items-center gap-2"
          >
            <Send size={16} /> Enviar p/ Liberação
          </button>
        )}

        {isCollective && <button onClick={handleReturnToOperational} className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 flex items-center gap-2"><Undo size={16} /> Retornar / Operacional</button>}
        
        <button onClick={() => setIsConfirmingFinalization(true)} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"><CheckCircle size={16} /> Finalizar para Master</button>
      </div>
    );
  }

  return null;
};

export default FinanceiroJuniorActions;
