import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRemovals } from '../context/RemovalContext';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { CalendarDays, Download, Search, Plus, Filter, UserCheck, CalendarClock, CheckCircle } from 'lucide-react';
import { Removal, RemovalStatus } from '../types';
import RemovalCard from '../components/RemovalCard';
import RemovalDetailsModal from '../components/RemovalDetailsModal';
import { exportToExcel } from '../utils/exportToExcel';
import RequestTypeModal from '../components/modals/RequestTypeModal';
import ScheduleDeliveryModal from '../components/modals/ScheduleDeliveryModal';
import ScheduledDeliveryList from '../components/shared/ScheduledDeliveryList';

const ReceptorHome: React.FC = () => {
  const { removals, updateRemoval } = useRemovals();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<RemovalStatus | 'agenda_entrega'>('solicitada');
  const [selectedRemoval, setSelectedRemoval] = useState<Removal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isScheduleDeliveryModalOpen, setIsScheduleDeliveryModalOpen] = useState(false);
  const [deliveryFilter, setDeliveryFilter] = useState<'todos' | 'aguardando_retirada' | 'entrega_agendada' | 'entregue_retirado'>('entrega_agendada');

  useEffect(() => {
    if (selectedRemoval) {
      const updatedVersion = removals.find(r => r.code === selectedRemoval.code);
      if (updatedVersion) {
        setSelectedRemoval(updatedVersion);
      }
    }
  }, [removals, selectedRemoval?.code]);

  useEffect(() => {
    if (activeTab === 'agenda_entrega') {
      setDeliveryFilter('entrega_agendada');
    }
  }, [activeTab]);

  const handleCancelDelivery = (removalCode: string) => {
    if (!user) return;
    if (window.confirm('Tem certeza que deseja cancelar este agendamento? A remoção voltará para "Pronto p/ Entrega".')) {
        const removalToUpdate = removals.find(r => r.code === removalCode);
        if (!removalToUpdate) return;

        updateRemoval(removalCode, {
            status: 'pronto_para_entrega',
            scheduledDeliveryDate: undefined,
            history: [
                ...removalToUpdate.history,
                {
                    date: new Date().toISOString(),
                    action: `Agendamento de entrega cancelado por ${user.name.split(' ')[0]}.`,
                    user: user.name,
                },
            ],
        });
    }
  };

  const handleMarkAsDelivered = (removalCode: string, deliveryPerson: string) => {
    if (!user) return;
    const removalToUpdate = removals.find(r => r.code === removalCode);
    if (!removalToUpdate) return;

    updateRemoval(removalCode, {
        status: 'finalizada',
        history: [
            ...removalToUpdate.history,
            {
                date: new Date().toISOString(),
                action: `Entrega finalizada por ${user.name.split(' ')[0]}. Entregue por: ${deliveryPerson}.`,
                user: user.name,
            },
        ],
    });
  };

  const filteredRemovals = useMemo(() => {
    let tabFiltered: Removal[];

    if (activeTab === 'agenda_entrega') {
        if (deliveryFilter === 'entregue_retirado') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            tabFiltered = removals.filter(r => {
                if (r.status !== 'finalizada') return false;
                
                const finalizationEntry = [...r.history].reverse().find(h => 
                    h.action.includes('Entrega finalizada por') || 
                    h.action.includes('confirmou a retirada das cinzas')
                );

                if (!finalizationEntry) return false;
                
                const finalizationDate = new Date(finalizationEntry.date);
                return finalizationDate >= thirtyDaysAgo;
            });
        } else if (deliveryFilter === 'todos') {
            tabFiltered = removals.filter(r => ['aguardando_retirada', 'entrega_agendada'].includes(r.status));
        } else {
            tabFiltered = removals.filter(r => r.status === deliveryFilter);
        }
    } else {
      tabFiltered = removals.filter(r => r.status === activeTab);
    }
    
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
  }, [activeTab, removals, searchTerm, deliveryFilter]);

  const handleDownload = () => {
    exportToExcel(filteredRemovals, `historico_receptor_${activeTab}`);
  };

  const tabs: { id: RemovalStatus | 'agenda_entrega'; label: string }[] = [
    { id: 'solicitada', label: 'Remoções Recebidas' },
    { id: 'em_andamento', label: 'Remoções Direcionadas' },
    { id: 'a_caminho', label: 'Em Andamento' },
    { id: 'concluida', label: 'Remoções Concluídas' },
    { id: 'cancelada', label: 'Remoções Canceladas' },
    { id: 'agenda_entrega', label: 'Agenda de Entrega' },
  ];

  const deliveryFilters = [
    { id: 'entrega_agendada' as const, label: 'Entregas Agendadas', icon: CalendarClock },
    { id: 'aguardando_retirada' as const, label: 'Aguardando Retirada', icon: UserCheck },
    { id: 'entregue_retirado' as const, label: 'Entregue/Retirado', icon: CheckCircle },
    { id: 'todos' as const, label: 'Todos' },
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
                onClick={() => setIsRequestModalOpen(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-700 transition-colors"
            >
                <Plus className="h-5 w-5 mr-2" />
                Solicitar Remoção
            </button>
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
          {activeTab === 'agenda_entrega' ? (
            <div>
              <div className="flex justify-between items-center mb-4 flex-wrap gap-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-600 mr-2">Filtrar por status:</span>
                    {deliveryFilters.map(filter => (
                        <button 
                            key={filter.id}
                            onClick={() => setDeliveryFilter(filter.id)} 
                            className={`px-3 py-1 text-xs rounded-full transition-colors flex items-center gap-1.5 ${deliveryFilter === filter.id ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                            {filter.icon && <filter.icon size={12} />}
                            {filter.label}
                        </button>
                    ))}
                </div>
                <button
                  onClick={() => setIsScheduleDeliveryModalOpen(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Agendar Entrega/Retirada
                </button>
              </div>
              {deliveryFilter === 'entrega_agendada' ? (
                <ScheduledDeliveryList removals={filteredRemovals} onCancelDelivery={handleCancelDelivery} onMarkAsDelivered={handleMarkAsDelivered} />
              ) : (
                filteredRemovals.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRemovals.map(removal => <RemovalCard key={removal.code} removal={removal} onClick={() => setSelectedRemoval(removal)} />)}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-12">Nenhuma remoção encontrada para este filtro.</p>
                )
              )}
            </div>
          ) : filteredRemovals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRemovals.map(removal => <RemovalCard key={removal.code} removal={removal} onClick={() => setSelectedRemoval(removal)} />)}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-12">Nenhuma remoção encontrada nesta categoria.</p>
          )}
        </div>
      </div>
      <RemovalDetailsModal removal={selectedRemoval} onClose={() => setSelectedRemoval(null)} />
      <RequestTypeModal 
        isOpen={isRequestModalOpen} 
        onClose={() => setIsRequestModalOpen(false)} 
      />
      <ScheduleDeliveryModal 
        isOpen={isScheduleDeliveryModalOpen} 
        onClose={() => setIsScheduleDeliveryModalOpen(false)} 
      />
    </Layout>
  );
};

export default ReceptorHome;
