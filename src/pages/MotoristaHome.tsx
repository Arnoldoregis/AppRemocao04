import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRemovals } from '../context/RemovalContext';
import Layout from '../components/Layout';
import { Download, Search } from 'lucide-react';
import { Removal, RemovalStatus } from '../types';
import RemovalCard from '../components/RemovalCard';
import RemovalDetailsModal from '../components/RemovalDetailsModal';
import { exportToExcel } from '../utils/exportToExcel';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import MonthlyBatchCard from '../components/cards/MonthlyBatchCard';

const MotoristaHome: React.FC = () => {
  const { user } = useAuth();
  const { removals } = useRemovals();
  const [activeTab, setActiveTab] = useState<RemovalStatus | 'concluidas'>('em_andamento');
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

  const driverRemovals = useMemo(() => {
    if (!user) return [];
    return removals.filter(r => r.assignedDriver?.id === user.id);
  }, [removals, user]);

  const filteredRemovals = useMemo(() => {
    if (activeTab === 'concluidas') return []; // Handled by concluidasGroupedByMonth

    let tabFiltered = driverRemovals.filter(r => r.status === activeTab);
    
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      tabFiltered = tabFiltered.filter(r => 
        r.tutor.name.toLowerCase().includes(lowerCaseSearch) ||
        r.pet.name.toLowerCase().includes(lowerCaseSearch) ||
        r.tutor.cpfOrCnpj?.toLowerCase().includes(lowerCaseSearch) ||
        r.code.toLowerCase().includes(lowerCaseSearch)
      );
    }
    
    return tabFiltered;
  }, [activeTab, driverRemovals, searchTerm]);

  const concluidasGroupedByMonth = useMemo(() => {
    if (activeTab !== 'concluidas') return null;

    const completedStatuses: RemovalStatus[] = [
        'aguardando_financeiro_junior', 
        'aguardando_baixa_master', 
        'finalizada', 
        'cremado', 
        'pronto_para_entrega',
        'concluida'
    ];

    let completedRemovals = driverRemovals.filter(r => completedStatuses.includes(r.status));
    
    if (searchTerm) {
        const lowerCaseSearch = searchTerm.toLowerCase();
        completedRemovals = completedRemovals.filter(r => 
            r.tutor.name.toLowerCase().includes(lowerCaseSearch) ||
            r.pet.name.toLowerCase().includes(lowerCaseSearch) ||
            r.code.toLowerCase().includes(lowerCaseSearch)
        );
    }

    const grouped = completedRemovals.reduce((acc, removal) => {
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
  }, [activeTab, driverRemovals, searchTerm]);


  const handleDownload = () => {
    if (activeTab === 'concluidas' && concluidasGroupedByMonth) {
      const removalsToExport = concluidasGroupedByMonth.flatMap(([, monthRemovals]) => monthRemovals);
      exportToExcel(removalsToExport, `historico_motorista_concluidas`);
    } else {
      exportToExcel(filteredRemovals, `historico_motorista_${activeTab}`);
    }
  };

  const tabs: { id: RemovalStatus | 'concluidas'; label: string }[] = [
    { id: 'em_andamento', label: 'Solicitações Recebidas' },
    { id: 'a_caminho', label: 'A Caminho' },
    { id: 'removido', label: 'Removidas' },
    { id: 'concluidas', label: 'Concluídas' },
  ];

  return (
    <Layout title="Dashboard do Motorista">
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <div className="relative w-full max-w-md">
          <input 
            type="text" 
            placeholder="Pesquisar por tutor, pet, código..." 
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
        <button 
            onClick={handleDownload}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <Download className="h-5 w-5 mr-2" />
          Baixar Histórico
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
          {activeTab !== 'concluidas' && (
            filteredRemovals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRemovals.map(removal => <RemovalCard key={removal.code} removal={removal} onClick={() => setSelectedRemoval(removal)} />)}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-12">Nenhuma solicitação nesta categoria.</p>
            )
          )}
          {activeTab === 'concluidas' && (
            concluidasGroupedByMonth && concluidasGroupedByMonth.length > 0 ? (
              <div className="space-y-6">
                {concluidasGroupedByMonth.map(([month, monthRemovals]) => (
                    <MonthlyBatchCard 
                        key={month} 
                        month={month} 
                        removals={monthRemovals} 
                        onSelectRemoval={setSelectedRemoval}
                    />
                ))}
              </div>
            ) : <p className="text-center text-gray-500 py-12">Nenhuma remoção concluída encontrada.</p>
          )}
        </div>
      </div>
      <RemovalDetailsModal removal={selectedRemoval} onClose={() => setSelectedRemoval(null)} />
    </Layout>
  );
};

export default MotoristaHome;
