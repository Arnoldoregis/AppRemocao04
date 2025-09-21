import React, { useState } from 'react';
import { LoteFaturamento, Removal } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useRemovals } from '../../context/RemovalContext';
import { X, Building2, DollarSign, FileText, Download, Upload, CheckCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';
import RemovalDetailsModal from '../RemovalDetailsModal';
import { downloadFile } from '../../utils/downloadFile';

interface FaturamentoModalProps {
  lote: LoteFaturamento | null;
  onClose: () => void;
}

const FaturamentoModal: React.FC<FaturamentoModalProps> = ({ lote, onClose }) => {
  const { user } = useAuth();
  const { updateMultipleRemovals } = useRemovals();
  const [detailedRemoval, setDetailedRemoval] = useState<Removal | null>(null);

  // States for Master
  const [isUploadingBoleto, setIsUploadingBoleto] = useState(false);
  const [selectedBoleto, setSelectedBoleto] = useState<File | null>(null);

  // States for Clinic
  const [selectedComprovante, setSelectedComprovante] = useState<File | null>(null);

  if (!lote) return null;

  const handleConfirmBoletoUpload = () => {
    if (!user || !selectedBoleto || lote.removals.length === 0) return;
    const removalCodes = lote.removals.map(r => r.code);
    updateMultipleRemovals(removalCodes, {
      status: 'aguardando_boleto',
      boletoUrl: selectedBoleto.name,
      history: [
        ...(lote.removals[0].history || []),
        { date: new Date().toISOString(), action: `Boleto unificado (${selectedBoleto.name}) anexado pelo Financeiro Master`, user: user.name }
      ]
    }, lote.removals[0]);
    alert('Boleto anexado e enviado para a clínica!');
    onClose();
  };

  const handleConcluirPagamento = () => {
    if (!user || !selectedComprovante || lote.removals.length === 0) return;
    const removalCodes = lote.removals.map(r => r.code);
    updateMultipleRemovals(removalCodes, {
      status: 'pagamento_concluido',
      comprovanteFaturaUrl: selectedComprovante.name,
      history: [
        ...(lote.removals[0].history || []),
        { date: new Date().toISOString(), action: `Comprovante de pagamento (${selectedComprovante.name}) do faturamento anexado pela clínica`, user: user.name }
      ]
    }, lote.removals[0]);
    alert('Comprovante enviado para confirmação!');
    onClose();
  };

  const handleFinalizarCicloFaturamento = () => {
    if (!user || lote.removals.length === 0) return;
    const removalCodes = lote.removals.map(r => r.code);
    updateMultipleRemovals(removalCodes, {
      status: 'finalizada',
      history: [
        ...(lote.removals[0].history || []),
        { date: new Date().toISOString(), action: `Ciclo de faturamento finalizado pelo Financeiro Master`, user: user.name }
      ]
    }, lote.removals[0]);
    alert('Ciclo de faturamento finalizado!');
    onClose();
  };

  const renderMasterActions = () => {
    if (lote.status === 'aguardando_geracao_boleto') {
      if (isUploadingBoleto) {
        return (
          <div className="w-full flex flex-col sm:flex-row items-center gap-2">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setSelectedBoleto(e.target.files ? e.target.files[0] : null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <div className="flex-shrink-0 flex gap-2">
              <button onClick={handleConfirmBoletoUpload} disabled={!selectedBoleto} className="px-4 py-2 bg-green-600 text-white rounded-md flex items-center gap-2 disabled:opacity-50">
                <Upload size={16} /> Confirmar
              </button>
              <button onClick={() => setIsUploadingBoleto(false)} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md">
                Cancelar
              </button>
            </div>
          </div>
        );
      }
      return <button onClick={() => setIsUploadingBoleto(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2"><Upload size={16} /> Anexar Boleto Unificado</button>;
    }
    if (lote.status === 'pagamento_em_confirmacao') {
      return (
        <div className="flex gap-2">
          <button onClick={() => downloadFile(lote.removals[0].comprovanteFaturaUrl!)} className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2"><Download size={16} /> Baixar Comprovante</button>
          <button onClick={handleFinalizarCicloFaturamento} className="px-4 py-2 bg-green-600 text-white rounded-md flex items-center gap-2"><CheckCircle size={16} /> Finalizar Ciclo de Faturamento</button>
        </div>
      );
    }
    return null;
  };

  const renderClinicActions = () => {
    if (user?.userType === 'clinica' && lote.status === 'aguardando_pagamento_clinica') {
      return (
        <div className="w-full flex flex-col sm:flex-row items-center gap-4">
          <button onClick={() => downloadFile(lote.removals[0].boletoUrl!)} className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2 w-full sm:w-auto justify-center">
            <Download size={16} /> Baixar Boleto
          </button>
          <div className="flex-grow w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Anexar Comprovante</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setSelectedComprovante(e.target.files ? e.target.files[0] : null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 border rounded-lg"
            />
          </div>
          <button onClick={handleConcluirPagamento} disabled={!selectedComprovante} className="px-4 py-2 bg-green-600 text-white rounded-md flex items-center gap-2 disabled:opacity-50 w-full sm:w-auto justify-center">
            <CheckCircle size={16} /> Concluir Pagamento
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center z-10">
            <h2 className="text-xl font-bold text-gray-900">Gerenciar Faturamento Mensal</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
          </div>
          <div className="overflow-y-auto p-6">
            <div className="bg-gray-50 p-4 rounded-lg border mb-6">
              <div className="flex justify-between items-center">
                  <div>
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center"><Building2 className="h-5 w-5 mr-2 text-gray-600" />{lote.clinicName}</h3>
                  </div>
                  <div className="text-right">
                      <p className="flex items-center justify-end gap-2"><FileText size={16} /> {lote.removals.length} Remoções</p>
                      <p className="flex items-center justify-end gap-2 font-bold text-lg"><DollarSign size={18} /> R$ {lote.totalValue.toFixed(2)}</p>
                  </div>
              </div>
            </div>
            
            <h4 className="font-semibold mb-3">Remoções Incluídas no Lote:</h4>
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Código</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Pet</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Data</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Valor</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lote.removals.map((r: Removal) => (
                    <tr key={r.code}>
                      <td className="px-4 py-2 text-sm text-gray-800">{r.code}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{r.pet.name}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{format(new Date(r.createdAt), 'dd/MM/yyyy')}</td>
                      <td className="px-4 py-2 text-sm text-gray-800 font-medium text-right">R$ {r.value.toFixed(2)}</td>
                      <td className="px-4 py-2 text-center">
                        <button 
                          onClick={() => setDetailedRemoval(r)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Ver detalhes da remoção"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="sticky bottom-0 bg-gray-50 p-4 border-t flex justify-end items-center gap-4">
            {user?.role === 'financeiro_master' && renderMasterActions()}
            {renderClinicActions()}
            <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Fechar</button>
          </div>
        </div>
      </div>
      <RemovalDetailsModal removal={detailedRemoval} onClose={() => setDetailedRemoval(null)} />
    </>
  );
};

export default FaturamentoModal;
