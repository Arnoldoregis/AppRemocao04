import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRemovals } from '../context/RemovalContext';
import { useAgenda } from '../context/AgendaContext';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { CalendarDays, Download, Search, Filter, PackageCheck, Truck, Plus, UserCheck, CalendarClock } from 'lucide-react';
import { Removal } from '../types';
import RemovalCard from '../components/RemovalCard';
import RemovalDetailsModal from '../components/RemovalDetailsModal';
import { exportToExcel } from '../utils/exportToExcel';
import ScheduleDeliveryModal from '../components/modals/ScheduleDeliveryModal';
import DeliveryCalendarView from '../components/shared/DeliveryCalendarView';

const FinanceiroJuniorHome: React.FC = () => {
  const { removals, updateRemoval } = useRemovals();
  const { schedule } = useAgenda();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('coletivas');
  const [selectedRemoval, setSelectedRemoval] = useState<Removal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'todos' | 'convencional' | 'faturado'>('todos');
  const [deliveryFilter, setDeliveryFilter] = useState<'todos' | 'aguardando_retirada' | 'entrega_agendada'>('todos');
  const [isScheduleDeliveryModalOpen, setIsScheduleDeliveryModalOpen] = useState(false);

  useEffect(() => {
    if (selectedRemoval) {
      const updatedVersion = removals.find(r => r.code === selectedRemoval.code);
      if (updatedVersion) {
        setSelectedRemoval(updatedVersion);
      }
    }
  }, [removals, selectedRemoval?.code]);

  useEffect(() => {
    setPaymentFilter('todos');
    setDeliveryFilter('todos');
  }, [activeTab]);

  const handleCancelDelivery = (removalCode: string) => {
    if (!user) return;
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
  };

  const filteredRemovals = useMemo(() => {
    if (!user) return [];
    let baseFiltered: Removal[] = [];
    
    // Main category filtering
    switch (activeTab) {
        case 'coletivas':
            baseFiltered = removals.filter(r => r.status === 'aguardando_financeiro_junior' && r.modality === 'coletivo' && r.assignedFinanceiroJunior?.id === user.id);
            break;
        case 'individuais':
            baseFiltered = removals.filter(r => r.status === 'aguardando_financeiro_junior' && r.modality !== 'coletivo' && r.assignedFinanceiroJunior?.id === user.id);
            break;
        case 'agendado_despedida':
            baseFiltered = Object.values(schedule).filter(r => r.assignedFinanceiroJunior?.id === user.id);
            break;
        case 'pronto_para_entrega':
            baseFiltered = removals.filter(r => r.status === 'pronto_para_entrega' && r.assignedFinanceiroJunior?.id === user.id);
            break;
        case 'agenda_entrega':
            baseFiltered = removals.filter(r => (r.status === 'aguardando_retirada' || r.status === 'entrega_agendada') && r.assignedFinanceiroJunior?.id === user.id);
            if (deliveryFilter !== 'todos') {
                baseFiltered = baseFiltered.filter(r => r.status === deliveryFilter);
            }
            break;
        case 'finalizadas':
            baseFiltered = removals.filter(r => r.status === 'aguardando_baixa_master' && r.assignedFinanceiroJunior?.id === user.id);
            break;
        default:
            baseFiltered = [];
    }

    // Payment method sub-filtering
    if (paymentFilter !== 'todos' && !['agendado_despedida', 'pronto_para_entrega', 'agenda_entrega'].includes(activeTab)) {
        if (paymentFilter === 'faturado') {
            baseFiltered = baseFiltered.filter(r => r.paymentMethod === 'faturado');
        } else { // 'convencional'
            baseFiltered = baseFiltered.filter(r => r.paymentMethod !== 'faturado');
        }
    }

    // Search term filtering
    if (searchTerm) {
        const lowerCaseSearch = searchTerm.toLowerCase();
        return baseFiltered.filter(r =>
            r.tutor.name.toLowerCase().includes(lowerCaseSearch) ||
            r.pet.name.toLowerCase().includes(lowerCaseSearch) ||
            r.code.toLowerCase().includes(lowerCaseSearch)
        );
    }

    return baseFiltered;
  }, [activeTab, removals, searchTerm, schedule, paymentFilter, user, deliveryFilter]);

  const handleDownload = () => {
    exportToExcel(filteredRemovals, `historico_fin_junior_${activeTab}`);
  };

  const tabs = [
    { id: 'coletivas', label: 'Coletivas/Faturado' },
    { id: 'individuais', label: 'Individuais/Faturado' },
    { id: 'agendado_despedida', label: 'Agendado Despedida' },
    { id: 'pronto_para_entrega', label: 'Pronto p/ Entrega', icon: PackageCheck },
    { id: 'agenda_entrega', label: 'Agenda de Entrega', icon: Truck },
    { id: 'finalizadas', label: 'Finalizadas' },
  ];

  const paymentFilters = [
    { id: 'todos' as const, label: 'Todos' },
    { id: 'convencional' as const, label: 'Pag. Convencional' },
    { id: 'faturado' as const, label: 'Pag. Faturado' },
  ];

  const deliveryFilters = [
    { id: 'todos' as const, label: 'Todos' },
    { id: 'aguardando_retirada' as const, label: 'Aguardando Retirada', icon: UserCheck },
    { id: 'entrega_agendada' as const, label: 'Entrega Agendada', icon: CalendarClock },
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
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-3 font-medium text-sm border-b-2 flex items-center gap-2 ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab.icon && <tab.icon size={16} />}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        
        {['coletivas', 'individuais', 'finalizadas'].includes(activeTab) && (
            <div className="p-4 border-b flex items-center justify-center gap-2 bg-gray-50">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-600 mr-2">Filtrar por pagamento:</span>
                {paymentFilters.map(filter => (
                    <button 
                        key={filter.id}
                        onClick={() => setPaymentFilter(filter.id)} 
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${paymentFilter === filter.id ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>
        )}

        <div className="p-6">
          {activeTab === 'agenda_entrega' ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
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
                <DeliveryCalendarView removals={filteredRemovals} onCancelDelivery={handleCancelDelivery} />
              ) : (
                filteredRemovals.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRemovals.map(removal => <RemovalCard key={removal.code} removal={removal} onClick={() => setSelectedRemoval(removal)} />)}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-12">Nenhuma entrega ou retirada agendada.</p>
                )
              )}
            </div>
          ) : filteredRemovals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRemovals.map(removal => <RemovalCard key={removal.code} removal={removal} onClick={() => setSelectedRemoval(removal)} />)}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-12">Nenhuma remoção nesta categoria.</p>
          )}
        </div>
      </div>
      <RemovalDetailsModal removal={selectedRemoval} onClose={() => setSelectedRemoval(null)} />
      <ScheduleDeliveryModal 
        isOpen={isScheduleDeliveryModalOpen} 
        onClose={() => setIsScheduleDeliveryModalOpen(false)} 
      />
    </Layout>
  );
};

export default FinanceiroJuniorHome;
