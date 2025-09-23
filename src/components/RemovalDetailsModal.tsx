import React, { useMemo, useState } from 'react';
import { Removal } from '../types';
import { useAuth } from '../context/AuthContext';
import ReceptorActions from './actions/ReceptorActions';
import MotoristaActions from './actions/MotoristaActions';
import FinanceiroJuniorActions from './actions/FinanceiroJuniorActions';
import FinanceiroMasterActions from './actions/FinanceiroMasterActions';
import ClinicaActions from './actions/ClinicaActions';
import OperacionalActions from './actions/OperacionalActions';
import { X, User, Dog, MapPin, DollarSign, FileText, Calendar, Clock, History, Info, MessageSquare, Download, Map, AlertCircle, CheckCircle, Edit, ThumbsUp, PawPrint, Clock4 } from 'lucide-react';
import { format } from 'date-fns';
import { downloadFile } from '../utils/downloadFile';
import { priceTable } from '../data/pricing';

interface RemovalDetailsModalProps {
  removal: Removal | null;
  onClose: () => void;
}

const DetailSection: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
  <div className="mb-6">
    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center border-b pb-2">
      <Icon className="h-5 w-5 mr-2 text-blue-600" />
      {title}
    </h3>
    <div className="space-y-2 text-sm text-gray-700">{children}</div>
  </div>
);

const DetailItem: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
  value || value === 0 ? <p><strong>{label}:</strong> {value}</p> : null
);

const RemovalDetailsModal: React.FC<RemovalDetailsModalProps> = ({ removal, onClose }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeEditTab, setActiveEditTab] = useState<'add' | 'adjust' | 'change_modality'>('add');

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

  const financialBreakdown = useMemo(() => {
    if (user?.role !== 'financeiro_junior' || !removal) {
      return null;
    }

    // 1. Valor Solicitado é apenas o valor base da modalidade/peso informado inicialmente.
    const informedWeightKey = removal.pet.weight as keyof typeof priceTable;
    const informedBasePrice = priceTable[informedWeightKey]?.[removal.modality] || 0;
    const valorSolicitado = informedBasePrice;

    // Valor dos adicionais iniciais (da solicitação original)
    const initialAdditionalsValue = removal.additionals?.reduce((sum, ad) => sum + ad.value * ad.quantity, 0) || 0;

    // 2. Valor Divergente é a diferença entre o preço do peso real e o preço do peso informado.
    let valorDivergente = 0;
    if (removal.realWeight) {
      const correctWeightKey = getWeightKeyFromRealWeight(removal.realWeight);
      if (correctWeightKey && correctWeightKey !== informedWeightKey) {
        const correctBasePrice = priceTable[correctWeightKey]?.[removal.modality] || 0;
        valorDivergente = correctBasePrice - informedBasePrice;
      }
    }

    // 3. Valor Adicional agora agrupa os adicionais da solicitação e os adicionados pelo financeiro.
    const customAdditionalsValue = removal.customAdditionals?.reduce((sum, ad) => sum + ad.value, 0) || 0;
    const valorAdicional = customAdditionalsValue + initialAdditionalsValue;
    
    // 4. Sub Total é o valor final atual da remoção.
    const subTotal = removal.value;

    // Mostra o detalhamento apenas se houver diferença de peso ou se produtos foram adicionados pelo financeiro.
    if (valorDivergente !== 0 || customAdditionalsValue > 0) {
        return {
            valorSolicitado,
            valorDivergente,
            valorAdicional,
            subTotal,
        };
    }

    return null;
  }, [user, removal]);


  if (!removal) return null;

  const handleWhatsAppClick = (phone: string) => {
    const phoneNumber = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${phoneNumber}`, '_blank', 'noopener,noreferrer');
  };

  const handleGpsClick = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank', 'noopener,noreferrer');
  };

  const renderActions = () => {
    if (user?.userType === 'clinica') {
        return <ClinicaActions removal={removal} onClose={onClose} />;
    }

    switch (user?.role) {
      case 'receptor':
        return <ReceptorActions removal={removal} onClose={onClose} />;
      case 'motorista':
        return <MotoristaActions removal={removal} onClose={onClose} />;
      case 'operacional':
        return <OperacionalActions removal={removal} onClose={onClose} />;
      case 'financeiro_junior':
        return <FinanceiroJuniorActions 
                  removal={removal} 
                  onClose={onClose} 
                  isEditing={isEditing}
                  setIsEditing={setIsEditing}
                  activeEditTab={activeEditTab}
                  setActiveEditTab={setActiveEditTab}
                />;
      case 'financeiro_master':
        if (removal.status === 'aguardando_baixa_master' && removal.paymentMethod !== 'faturado') {
          return <FinanceiroMasterActions removal={removal} onClose={onClose} />;
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-gray-900">Detalhes da Remoção - {removal.code}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
        </div>

        <div className="overflow-y-auto p-6">
          <DetailSection title="Informações Gerais" icon={Info}>
            <DetailItem label="Status" value={removal.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} />
            <div className="flex items-center justify-between">
                <DetailItem label="Modalidade" value={removal.modality.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} />
                {user?.role === 'financeiro_junior' && removal.status === 'aguardando_financeiro_junior' && (
                  <button
                    onClick={() => {
                      setActiveEditTab('change_modality');
                      setIsEditing(true);
                    }}
                    className="flex items-center gap-2 px-3 py-1 bg-yellow-500 text-white text-xs font-semibold rounded-full hover:bg-yellow-600 transition-colors"
                  >
                    <Edit size={14} />
                    Alterar Modalidade
                  </button>
                )}
            </div>
            <DetailItem label="Data da Solicitação" value={format(new Date(removal.createdAt), 'dd/MM/yyyy HH:mm')} />
            <DetailItem label="Motorista Atribuído" value={removal.assignedDriver?.name} />
          </DetailSection>

          <DetailSection title="Dados do Tutor" icon={User}>
            <DetailItem label="Nome" value={removal.tutor.name} />
            <DetailItem label="CPF/CNPJ" value={removal.tutor.cpfOrCnpj} />
            <div className="flex items-center justify-between">
                <DetailItem label="Contato" value={removal.tutor.phone} />
                {user?.userType === 'funcionario' && removal.tutor.phone && (
                    <button
                        onClick={() => handleWhatsAppClick(removal.tutor.phone)}
                        className="flex items-center gap-2 px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full hover:bg-green-600 transition-colors"
                    >
                        <MessageSquare size={14} />
                        Entrar em contato
                    </button>
                )}
            </div>
            <DetailItem label="Email" value={removal.tutor.email} />
          </DetailSection>

          <DetailSection title="Dados do Pet" icon={Dog}>
            <DetailItem label="Nome" value={removal.pet.name} />
            <DetailItem label="Espécie" value={removal.pet.species} />
            <DetailItem label="Raça" value={removal.pet.breed} />
            <DetailItem label="Sexo" value={removal.pet.gender} />
            <DetailItem label="Peso (solicitado)" value={removal.pet.weight} />
            <DetailItem label="Peso (real)" value={removal.realWeight ? `${removal.realWeight} kg` : 'N/A'} />
            <DetailItem label="Causa da Morte" value={removal.pet.causeOfDeath} />
          </DetailSection>

          {(removal.petCondition || removal.farewellSchedulingInfo) && (
            <DetailSection title="Detalhes Operacionais" icon={Info}>
              <DetailItem label="Condição do Pet" value={removal.petCondition} />
              <DetailItem label="Agendamento de Despedida" value={removal.farewellSchedulingInfo} />
            </DetailSection>
          )}

          <DetailSection title="Dados da Remoção" icon={MapPin}>
            <div className="flex items-start justify-between">
                <p><strong>Endereço:</strong> {`${removal.removalAddress.street}, ${removal.removalAddress.number} - ${removal.removalAddress.neighborhood}, ${removal.removalAddress.city} - ${removal.removalAddress.state}`}</p>
                {user?.role === 'motorista' && (
                    <button
                        onClick={() => handleGpsClick(`${removal.removalAddress.street}, ${removal.removalAddress.number}, ${removal.removalAddress.city}`)}
                        className="flex-shrink-0 ml-4 flex items-center gap-2 px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full hover:bg-blue-600 transition-colors"
                    >
                        <Map size={14} />
                        Ir até o local
                    </button>
                )}
            </div>
          </DetailSection>

          {removal.requestType === 'agendar' && (
            <DetailSection title="Agendamento" icon={Calendar}>
                <DetailItem label="Data Agendada" value={removal.scheduledDate ? format(new Date(removal.scheduledDate), 'dd/MM/yyyy') : 'N/A'} />
                <DetailItem label="Horário Agendado" value={removal.scheduledTime} />
                <DetailItem label="Motivo" value={removal.schedulingReason} />
            </DetailSection>
          )}

          <DetailSection title="Financeiro" icon={DollarSign}>
            <DetailItem label="Forma de Pagamento" value={removal.paymentMethod.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} />
            
            {removal.paymentMethod === 'plano_preventivo' && (
              <DetailItem label="Número do Contrato" value={removal.contractNumber} />
            )}

            {(removal.paymentMethod === 'pix' || removal.paymentMethod === 'link_pagamento') && removal.paymentProof && (
              <div className="mt-2">
                <button
                  onClick={() => downloadFile(removal.paymentProof!, removal.paymentProof!)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-semibold rounded-md hover:bg-blue-200 transition-colors"
                >
                  <Download size={14} />
                  Baixar Comprovante ({removal.paymentMethod.toUpperCase()})
                </button>
              </div>
            )}
            
            {financialBreakdown ? (
                <div className="mt-4 pt-4 border-t">
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <span>Valor Solicitado</span>
                            <span>R$ {financialBreakdown.valorSolicitado.toFixed(2)}</span>
                        </div>
                        {financialBreakdown.valorDivergente !== 0 && (
                            <div className="flex justify-between items-center">
                                <span className="flex items-center">
                                Valor Divergente
                                <span className="text-xs text-gray-500 ml-1">(diferença de peso)</span>
                                {removal.adjustmentConfirmed && (
                                    <ThumbsUp className="h-4 w-4 ml-2 text-green-500" title="Valor divergente confirmado" />
                                )}
                                </span>
                                <span className={financialBreakdown.valorDivergente > 0 ? 'text-green-600' : 'text-red-600'}>
                                {financialBreakdown.valorDivergente > 0 ? '+' : '-'} R$ {Math.abs(financialBreakdown.valorDivergente).toFixed(2)}
                                </span>
                            </div>
                        )}
                        {financialBreakdown.valorAdicional > 0 && (
                            <>
                                <div className="flex justify-between">
                                    <span>Valor Adicional</span>
                                    <span>+ R$ {financialBreakdown.valorAdicional.toFixed(2)}</span>
                                </div>
                                {(removal.additionals.length > 0 || (removal.customAdditionals && removal.customAdditionals.length > 0)) && (
                                    <ul className="text-xs text-gray-600 pl-5">
                                        {removal.additionals.map(ad => (
                                            <li key={ad.type} className="flex justify-between">
                                                <span>- {ad.quantity}x {ad.type.replace(/_/g, ' ')}</span>
                                                <span>R$ {(ad.value * ad.quantity).toFixed(2)}</span>
                                            </li>
                                        ))}
                                        {removal.customAdditionals?.map(ad => {
                                            const proofParts = ad.paymentProof?.split('||');
                                            const proofUrl = proofParts?.[0];
                                            const proofName = proofParts?.[1];

                                            return (
                                                <li key={ad.id} className="flex justify-between items-center">
                                                    <span>- {ad.name}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span>R$ {ad.value.toFixed(2)}</span>
                                                        {proofUrl && proofName && (
                                                            <button
                                                                onClick={() => downloadFile(proofUrl, proofName)}
                                                                className="text-blue-500 hover:text-blue-700"
                                                                title={`Baixar comprovante: ${proofName}`}
                                                            >
                                                                <Download size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </>
                        )}
                    </div>
                    <div className="mt-3 pt-3 border-t font-bold flex justify-between text-lg">
                        <span>Sub Total</span>
                        <span>R$ {financialBreakdown.subTotal.toFixed(2)}</span>
                    </div>
                </div>
            ) : (
              <>
                {removal.additionals.length > 0 && (
                  <div className="mt-2">
                    <strong>Adicionais (solicitação):</strong>
                    <ul className="list-disc list-inside ml-4">
                      {removal.additionals.map(ad => (
                        <li key={ad.type}>{ad.quantity}x {ad.type.replace(/_/g, ' ')} (R$ {(ad.value * ad.quantity).toFixed(2)})</li>
                      ))}
                    </ul>
                  </div>
                )}
                {removal.customAdditionals && removal.customAdditionals.length > 0 && (
                  <div className="mt-2">
                    <strong>Adicionais (pós-remoção):</strong>
                    <ul className="list-disc list-inside ml-4">
                      {removal.customAdditionals.map(ad => (
                        <li key={ad.id} className="flex items-center justify-between">
                          <span>{ad.name} (R$ {ad.value.toFixed(2)})</span>
                          {ad.paymentProof && (
                            <button
                              onClick={() => downloadFile(ad.paymentProof!, ad.paymentProof!)}
                              className="ml-4 text-xs text-blue-500 hover:underline flex items-center gap-1"
                            >
                              <Download size={12} />
                              Baixar Comprovante
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="font-bold mt-4">Valor Total: R$ {removal.value.toFixed(2)}</p>
              </>
            )}

          </DetailSection>
          
          <DetailSection title="Outras Informações" icon={FileText}>
             <DetailItem label="Observações" value={removal.observations} />
             <DetailItem label="Motivo do Cancelamento" value={removal.cancellationReason} />
          </DetailSection>

          <DetailSection title="Histórico de Alterações" icon={History}>
            <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {removal.history.map((item, index) => (
                <li key={index} className="flex items-start">
                  <Clock className="h-4 w-4 mr-2 text-gray-500 mt-1 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">{item.action}</span> em {format(new Date(item.date), 'dd/MM/yyyy HH:mm')}
                    {item.reason && <p className="text-xs text-gray-500 pl-1">Motivo: {item.reason}</p>}
                    {item.proofUrl && (
                        <button
                            onClick={() => downloadFile(item.proofUrl!, item.proofUrl!)}
                            className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1"
                        >
                            <Download size={12} />
                            Baixar Comprovante Associado
                        </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </DetailSection>
        </div>
        
        <div className={`sticky bottom-0 bg-gray-50 border-t ${isEditing && user?.role === 'financeiro_junior' ? 'h-96' : 'p-4 flex justify-end items-center gap-4'}`}>
            {renderActions()}
            {!(isEditing && user?.role === 'financeiro_junior') && <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Fechar</button>}
        </div>
      </div>
    </div>
  );
};

export default RemovalDetailsModal;
