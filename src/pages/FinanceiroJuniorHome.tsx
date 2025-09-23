import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRemovals } from '../context/RemovalContext';
import Layout from '../components/Layout';
import { CalendarDays, Download, Search } from 'lucide-react';
import { Removal } from '../types';
import RemovalCard from '../components/RemovalCard';
import RemovalDetailsModal from '../components/RemovalDetailsModal';
import { exportToExcel } from '../utils/exportToExcel';

const FinanceiroJuniorHome: React.FC = () => {
  const { removals } = useRemovals();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('coletivo_pago');
  const [selectedRemoval, setSelectedRemoval] = useState<Removal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (selectedRemoval) {
      const updatedVersion = removals.find(r => r.code === selectedRemoval.code);
      if (updatedVersion) {
        setSelectedRemoval(updatedVersion);
      }
    }
  }, [removals, selectedRemoval?.code]);

  const filteredRemovals = useMemo(() => {
    let baseFiltered: Removal[] = [];
    switch (activeTab) {
        case 'coletivo_pago':
          baseFiltered = removals.filter(r => r.status === 'aguardando_financeiro_junior' && r.modality === 'coletivo' && r.paymentMethod !== 'faturado');
          break;
        case 'coletivo_faturado':
          baseFiltered = removals.filter(r => r.status === 'aguardando_financeiro_junior' && r.modality === 'coletivo' && r.paymentMethod === 'faturado');
          break;
        case 'individual_pago':
          baseFiltered = removals.filter(r => r.status === 'aguardando_financeiro_junior' && r.modality !== 'coletivo' && r.paymentMethod !== 'faturado');
          break;
        case 'individual_faturado':
          baseFiltered = removals.filter(r => r.status === 'aguardando_financeiro_junior' && r.modality !== 'coletivo' && r.paymentMethod === 'faturado');
          break;
        case 'finalizadas_pago':
          baseFiltered = removals.filter(r => r.status === 'aguardando_baixa_master' && r.paymentMethod !== 'faturado');
          break;
        case 'finalizadas_faturado':
          baseFiltered = removals.filter(r => r.status === 'aguardando_baixa_master' && r.paymentMethod === 'faturado');
          break;
        default:
          baseFiltered = [];
    }

    if (searchTerm) {
        const lowerCaseSearch = searchTerm.toLowerCase();
        return baseFiltered.filter(r =>
            r.tutor.name.toLowerCase().includes(lowerCaseSearch) ||
            r.pet.name.toLowerCase().includes(lowerCaseSearch) ||
            r.code.toLowerCase().includes(lowerCaseSearch)
        );
    }

    return baseFiltered;
  }, [activeTab, removals, searchTerm]);

  const handleDownload = () => {
    exportToExcel(filteredRemovals, `historico_fin_junior_${activeTab}`);
  };

  const tabs = [
    { id: 'coletivo_pago', label: 'Remoção Coletivo' },
    { id: 'coletivo_faturado', label: 'Remoção Coletivo Faturado' },
    { id: 'individual_pago', label: 'Remoção Individual' },
    { id: 'individual_faturado', label: 'Remoção Individual Faturado' },
    { id: 'finalizadas_pago', label: 'Finalizadas' },
    { id: 'finalizadas_faturado', label: 'Finalizadas Faturado Mensal' },
  ];

  return (
    <Layout title="Dashboard do Financeiro Junior">
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
        <div className="flex items-center gap-2">
            <button 
                onClick={() => navigate('/agenda-despedida')}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-purple-700 transition-colors"
            >
                <CalendarDays className="h-5 w-5 mr-2" />
                Agenda de Despedida
            </button>
            <button 
                onClick={handleDownload}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
            >
                <Download className="h-5 w-5 mr-2" />
                Baixar Histórico
            </button>
        </div>
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
          {filteredRemovals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRemovals.map(removal => <RemovalCard key={removal.code} removal={removal} onClick={() => setSelectedRemoval(removal)} />)}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-12">Nenhuma remoção nesta categoria.</p>
          )}
        </div>
      </div>
      <RemovalDetailsModal removal={selectedRemoval} onClose={() => setSelectedRemoval(null)} />
    </Layout>
  );
};

export default FinanceiroJuniorHome;
