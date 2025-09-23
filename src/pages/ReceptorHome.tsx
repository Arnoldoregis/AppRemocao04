import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRemovals } from '../context/RemovalContext';
import Layout from '../components/Layout';
import { CalendarDays, Download, Search } from 'lucide-react';
import { Removal, RemovalStatus } from '../types';
import RemovalCard from '../components/RemovalCard';
import RemovalDetailsModal from '../components/RemovalDetailsModal';
import { exportToExcel } from '../utils/exportToExcel';

const ReceptorHome: React.FC = () => {
  const { removals } = useRemovals();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<RemovalStatus>('solicitada');
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
    let tabFiltered = removals.filter(r => r.status === activeTab);
    
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      tabFiltered = tabFiltered.filter(r => 
        r.tutor.name.toLowerCase().includes(lowerCaseSearch) ||
        r.pet.name.toLowerCase().includes(lowerCaseSearch) ||
        r.tutor.cpfOrCnpj?.toLowerCase().includes(lowerCaseSearch) ||
        r.modality.toLowerCase().includes(lowerCaseSearch)
      );
    }
    
    return tabFiltered;
  }, [activeTab, removals, searchTerm]);

  const handleDownload = () => {
    exportToExcel(filteredRemovals, `historico_receptor_${activeTab}`);
  };

  const tabs: { id: RemovalStatus; label: string }[] = [
    { id: 'solicitada', label: 'Remoções Recebidas' },
    { id: 'em_andamento', label: 'Remoções Direcionadas' },
    { id: 'a_caminho', label: 'Em Andamento' },
    { id: 'concluida', label: 'Remoções Concluídas' },
    { id: 'cancelada', label: 'Remoções Canceladas' },
  ];

  return (
    <Layout title="Dashboard do Receptor">
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <div className="relative w-full max-w-md">
          <input 
            type="text" 
            placeholder="Pesquisar por tutor, pet, CPF, modalidade..." 
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
            >
              <Download className="h-5 w-5 mr-2" />
              Baixar Histórico (Excel)
            </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b">
          <nav className="flex flex-wrap -mb-px">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
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
            <p className="text-center text-gray-500 py-12">Nenhuma remoção encontrada nesta categoria.</p>
          )}
        </div>
      </div>
      <RemovalDetailsModal removal={selectedRemoval} onClose={() => setSelectedRemoval(null)} />
    </Layout>
  );
};

export default ReceptorHome;
