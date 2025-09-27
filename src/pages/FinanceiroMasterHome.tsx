import React, { useState, useMemo, useEffect } from 'react';
import { useRemovals } from '../context/RemovalContext';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { Download, Search } from 'lucide-react';
import { Removal, LoteFaturamento } from '../types';
import RemovalCard from '../components/RemovalCard';
import RemovalDetailsModal from '../components/RemovalDetailsModal';
import FaturamentoCard from '../components/cards/FaturamentoCard';
import FaturamentoModal from '../components/modals/FaturamentoModal';
import { exportToExcel } from '../utils/exportToExcel';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import MonthlyBatchCard from '../components/cards/MonthlyBatchCard';
import StockManagement from '../components/master/StockManagement';
import PricingManagement from '../components/master/PricingManagement';

type MasterTab = 'dar_baixa' | 'faturado_mensal' | 'pagamento_concluido' | 'finalizada' | 'estoque' | 'planos';

const FinanceiroMasterHome: React.FC = () => {
  const { removals } = useRemovals();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<MasterTab>('dar_baixa');
  const [selectedRemoval, setSelectedRemoval] = useState<Removal | null>(null);
  const [selectedLote, setSelectedLote] = useState<LoteFaturamento | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (selectedRemoval) {
      const updatedVersion = removals.find(r => r.code === selectedRemoval.code);
      if (updatedVersion) setSelectedRemoval(updatedVersion);
    }
  }, [removals, selectedRemoval?.code]);

  const faturamentoLotes = useMemo(() => {
    if (!user) return [];
    const lotes: { [key: string]: LoteFaturamento } = {};
    const removalsToGroup = removals.filter(r => 
      r.paymentMethod === 'faturado' && 
      r.status === 'aguardando_baixa_master' &&
      r.assignedFinanceiroMaster?.id === user.id
    );

    removalsToGroup.forEach(r => {
      if (r.clinicName) {
        if (!lotes[r.clinicName]) {
          lotes[r.clinicName] = {
            id: r.createdById,
            clinicId: r.createdById,
            clinicName: r.clinicName,
            removals: [],
            totalValue: 0,
            status: 'aguardando_geracao_boleto'
          };
        }
        lotes[r.clinicName].removals.push(r);
        lotes[r.clinicName].totalValue += r.value;
      }
    });
    return Object.values(lotes);
  }, [removals, user]);

  const pagamentosConcluidosLotes = useMemo(() => {
    if (!user) return [];
    const lotes: { [key: string]: LoteFaturamento } = {};
    const removalsToGroup = removals.filter(r => 
      r.status === 'pagamento_concluido' &&
      r.assignedFinanceiroMaster?.id === user.id
    );
    
    removalsToGroup.forEach(r => {
        if (r.clinicName) {
            if (!lotes[r.clinicName]) {
                lotes[r.clinicName] = {
                    id: r.createdById,
                    clinicId: r.createdById,
                    clinicName: r.clinicName,
                    removals: [],
                    totalValue: 0,
                    status: 'pagamento_em_confirmacao',
                };
            }
            lotes[r.clinicName].removals.push(r);
            lotes[r.clinicName].totalValue += r.value;
        }
    });
    return Object.values(lotes);
  }, [removals, user]);

  const filteredRemovals = useMemo(() => {
    if (!user) return [];
    let baseRemovals: Removal[] = [];
    switch(activeTab) {
      case 'dar_baixa':
        baseRemovals = removals.filter(r => 
          r.status === 'aguardando_baixa_master' && 
          r.paymentMethod !== 'faturado' &&
          r.assignedFinanceiroMaster?.id === user.id
        );
        break;
      case 'finalizada':
        baseRemovals = removals.filter(r => 
          r.status === 'finalizada' &&
          r.assignedFinanceiroMaster?.id === user.id
        );
        break;
      default:
        baseRemovals = [];
    }

    if (searchTerm) {
        const lowerCaseSearch = searchTerm.toLowerCase();
        return baseRemovals.filter(r =>
            r.tutor.name.toLowerCase().includes(lowerCaseSearch) ||
            r.pet.name.toLowerCase().includes(lowerCaseSearch) ||
            r.code.toLowerCase().includes(lowerCaseSearch)
        );
    }
    return baseRemovals;

  }, [activeTab, removals, searchTerm, user]);
  
  const finalizadasGroupedByMonth = useMemo(() => {
    if (activeTab !== 'finalizada') return null;

    const grouped = filteredRemovals.reduce((acc, removal) => {
        const monthYear = format(new Date(removal.createdAt), 'MMMM yyyy', { locale: ptBR });
        const capitalizedMonthYear = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
        if (!acc[capitalizedMonthYear]) {
            acc[capitalizedMonthYear] = [];
        }
        acc[capitalizedMonthYear].push(removal);
        return acc;
    }, {} as { [key: string]: Removal[] });

    return Object.entries(grouped).sort(([monthA], [monthB]) => {
        const dateA = new Date(grouped[monthA][0].createdAt);
        const dateB = new Date(grouped[monthB][0].createdAt);
        return dateB.getTime() - dateA.getTime();
    });
  }, [activeTab, filteredRemovals]);

  const handleDownload = () => {
    if (activeTab === 'faturado_mensal') {
        const removalsInLotes = faturamentoLotes.flatMap(lote => lote.removals);
        exportToExcel(removalsInLotes, `historico_master_${activeTab}`);
    } else if (activeTab === 'pagamento_concluido') {
        const removalsInLotes = pagamentosConcluidosLotes.flatMap(lote => lote.removals);
        exportToExcel(removalsInLotes, `historico_master_${activeTab}`);
    } else {
        exportToExcel(filteredRemovals, `historico_master_${activeTab}`);
    }
  };

  const tabs: { id: MasterTab; label: string }[] = [
    { id: 'dar_baixa', label: 'Dar Baixa' },
    { id: 'faturado_mensal', label: 'Faturado Mensal' },
    { id: 'pagamento_concluido', label: 'Pagamento Faturado Concluído' },
    { id: 'finalizada', label: 'Remoções Finalizadas' },
    { id: 'estoque', label: 'Estoque' },
    { id: 'planos', label: 'Planos' },
  ];

  return (
    <Layout title="Dashboard do Financeiro Master">
       <div className="flex justify-between items-center mb-6">
        <div className="relative w-full max-w-xs">
          <input 
            type="text" 
            placeholder="Pesquisar..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg" />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
        <button 
            onClick={handleDownload}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
        >
            <Download className="h-5 w-5 mr-2" />Baixar Histórico
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b">
          <nav className="flex flex-wrap -mb-px">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-3 font-medium text-sm border-b-2 ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-6">
          {activeTab === 'faturado_mensal' && (
            faturamentoLotes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {faturamentoLotes.map(lote => <FaturamentoCard key={lote.id} lote={lote} onGerenciar={() => setSelectedLote(lote)} />)}
              </div>
            ) : <p className="text-center text-gray-500 py-12">Nenhuma remoção faturada aguardando geração de boleto.</p>
          )}

          {activeTab === 'pagamento_concluido' && (
            pagamentosConcluidosLotes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pagamentosConcluidosLotes.map(lote => <FaturamentoCard key={lote.id} lote={lote} onGerenciar={() => setSelectedLote(lote)} />)}
              </div>
            ) : <p className="text-center text-gray-500 py-12">Nenhum pagamento de faturamento para confirmar.</p>
          )}

          {activeTab === 'dar_baixa' && (
            filteredRemovals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRemovals.map(removal => <RemovalCard key={removal.code} removal={removal} onClick={() => setSelectedRemoval(removal)} />)}
              </div>
            ) : <p className="text-center text-gray-500 py-12">Nenhuma remoção nesta categoria.</p>
          )}
          
          {activeTab === 'finalizada' && (
            finalizadasGroupedByMonth && finalizadasGroupedByMonth.length > 0 ? (
              <div className="space-y-6">
                {finalizadasGroupedByMonth.map(([month, monthRemovals]) => (
                    <MonthlyBatchCard 
                        key={month} 
                        month={month} 
                        removals={monthRemovals} 
                        onSelectRemoval={setSelectedRemoval}
                    />
                ))}
              </div>
            ) : <p className="text-center text-gray-500 py-12">Nenhuma remoção nesta categoria.</p>
          )}

          {activeTab === 'estoque' && (
            <StockManagement />
          )}

          {activeTab === 'planos' && (
            <PricingManagement />
          )}
        </div>
      </div>
      <RemovalDetailsModal removal={selectedRemoval} onClose={() => setSelectedRemoval(null)} />
      <FaturamentoModal lote={selectedLote} onClose={() => setSelectedLote(null)} />
    </Layout>
  );
};

export default FinanceiroMasterHome;
