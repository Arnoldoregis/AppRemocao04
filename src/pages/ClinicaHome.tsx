import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRemovals } from '../context/RemovalContext';
import Layout from '../components/Layout';
import { Plus, List, Clock, CheckCircle, FileDown, FileCheck, XCircle, Files, Download } from 'lucide-react';
import { Removal, RemovalStatus, LoteFaturamento } from '../types';
import RemovalCard from '../components/RemovalCard';
import RemovalDetailsModal from '../components/RemovalDetailsModal';
import FaturamentoCard from '../components/cards/FaturamentoCard';
import FaturamentoModal from '../components/modals/FaturamentoModal';
import { exportToExcel } from '../utils/exportToExcel';

const ClinicaHome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { removals, getRemovalsByOwner } = useRemovals();
  const [activeTab, setActiveTab] = useState<RemovalStatus | 'todas' | 'boleto_recebido'>('solicitada');
  const [selectedRemoval, setSelectedRemoval] = useState<Removal | null>(null);
  const [selectedLote, setSelectedLote] = useState<LoteFaturamento | null>(null);

  useEffect(() => {
    if (selectedRemoval) {
      const updatedVersion = removals.find(r => r.code === selectedRemoval.code);
      if (updatedVersion) {
        setSelectedRemoval(updatedVersion);
      }
    }
  }, [removals, selectedRemoval?.code]);

  const clinicRemovals = useMemo(() => {
    if (user) {
      return getRemovalsByOwner(user.id);
    }
    return [];
  }, [user, getRemovalsByOwner, removals]);

  const faturamentoLotes = useMemo(() => {
      const lotes: { [key: string]: LoteFaturamento } = {};
      const removalsToGroup = clinicRemovals.filter(r => r.paymentMethod === 'faturado' && r.status === 'aguardando_boleto');
      
      if (removalsToGroup.length > 0) {
          const loteId = `${user?.id}-faturamento`;
          lotes[loteId] = {
              id: loteId,
              clinicId: user!.id,
              clinicName: user!.name,
              removals: removalsToGroup,
              totalValue: removalsToGroup.reduce((acc, r) => acc + r.value, 0),
              status: 'aguardando_pagamento_clinica',
              boletoUrl: removalsToGroup[0].boletoUrl,
          };
      }
      return Object.values(lotes);
  }, [clinicRemovals, user]);

  const filteredRemovals = useMemo(() => {
    if (activeTab === 'todas') return clinicRemovals;
    if (activeTab === 'boleto_recebido') return []; // Handled by faturamentoLotes
    return clinicRemovals.filter(r => r.status === activeTab);
  }, [activeTab, clinicRemovals]);

  const handleDownload = () => {
    if (activeTab === 'boleto_recebido') {
        const removalsInLotes = faturamentoLotes.flatMap(lote => lote.removals);
        exportToExcel(removalsInLotes, `historico_clinica_${activeTab}`);
    } else {
        exportToExcel(filteredRemovals, `historico_clinica_${activeTab}`);
    }
  };

  const tabs: { id: RemovalStatus | 'todas' | 'boleto_recebido'; label: string; icon: React.ElementType }[] = [
    { id: 'solicitada', label: 'Solicitadas', icon: List },
    { id: 'agendada', label: 'Agendadas', icon: Clock },
    { id: 'concluida', label: 'Concluídas', icon: CheckCircle },
    { id: 'boleto_recebido', label: 'Boleto Recebido', icon: FileDown },
    { id: 'pagamento_concluido', label: 'Pagamento Concluído', icon: FileCheck },
    { id: 'cancelada', label: 'Canceladas', icon: XCircle },
    { id: 'todas', label: 'Todas', icon: Files }
  ];

  return (
    <Layout title={`Dashboard - ${user?.name || 'Clínica'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-lg p-6 text-white mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Gerenciamento de Remoções</h1>
            <p className="mb-4">Visualize e gerencie todas as solicitações de remoção.</p>
            <button
                onClick={() => navigate('/solicitar-remocao-clinica')}
                className="bg-white text-green-600 px-6 py-2 rounded-lg font-semibold text-md hover:bg-gray-100 transition-colors flex items-center"
            >
                <Plus className="h-5 w-5 mr-2" />
                Nova Solicitação de Remoção
            </button>
          </div>
          <button
            onClick={handleDownload}
            className="bg-white/20 text-white px-4 py-2 rounded-lg font-semibold hover:bg-white/30 transition-colors flex items-center"
          >
            <Download className="h-5 w-5 mr-2" />
            Baixar Histórico (Excel)
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex flex-wrap -mb-px">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'boleto_recebido' && faturamentoLotes.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {faturamentoLotes.map(lote => (
                        <FaturamentoCard key={lote.id} lote={lote} onGerenciar={() => setSelectedLote(lote)} />
                    ))}
                </div>
            )}
            {filteredRemovals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRemovals.map(removal => (
                  <RemovalCard key={removal.code} removal={removal} onClick={() => setSelectedRemoval(removal)} />
                ))}
              </div>
            ) : (activeTab !== 'boleto_recebido' &&
              <div className="text-center py-12 text-gray-500">
                <p>Nenhuma remoção encontrada nesta categoria.</p>
              </div>
            )}
            {activeTab === 'boleto_recebido' && faturamentoLotes.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <p>Nenhum boleto recebido para pagamento.</p>
                </div>
            )}
          </div>
        </div>
      </div>
      <RemovalDetailsModal removal={selectedRemoval} onClose={() => setSelectedRemoval(null)} />
      <FaturamentoModal lote={selectedLote} onClose={() => setSelectedLote(null)} />
    </Layout>
  );
};

export default ClinicaHome;
