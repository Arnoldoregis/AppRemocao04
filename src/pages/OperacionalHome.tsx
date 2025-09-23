import React, { useState, useMemo, useEffect } from 'react';
import { useRemovals } from '../context/RemovalContext';
import Layout from '../components/Layout';
import { Search, Download, List, Check } from 'lucide-react';
import { Removal } from '../types';
import RemovalCard from '../components/RemovalCard';
import RemovalDetailsModal from '../components/RemovalDetailsModal';
import { exportToExcel } from '../utils/exportToExcel';

const OperacionalHome: React.FC = () => {
    const { removals } = useRemovals();
    const [selectedRemoval, setSelectedRemoval] = useState<Removal | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'pendentes' | 'finalizadas'>('pendentes');

    useEffect(() => {
        if (selectedRemoval) {
          const updatedVersion = removals.find(r => r.code === selectedRemoval.code);
          if (updatedVersion) {
            setSelectedRemoval(updatedVersion);
          }
        }
    }, [removals, selectedRemoval?.code]);

    const filteredRemovals = useMemo(() => {
        let baseRemovals: Removal[];
        if (activeTab === 'pendentes') {
            baseRemovals = removals.filter(r => r.status === 'concluida');
        } else {
            baseRemovals = removals.filter(r => r.history.some(h => h.user.toLowerCase().includes('operacional')) && r.status !== 'concluida');
        }

        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            return baseRemovals.filter(r =>
                r.code.toLowerCase().includes(lowerCaseSearch) ||
                r.pet.name.toLowerCase().includes(lowerCaseSearch) ||
                r.tutor.name.toLowerCase().includes(lowerCaseSearch)
            );
        }
        return baseRemovals;
    }, [removals, activeTab, searchTerm]);

    const handleDownload = () => {
        exportToExcel(filteredRemovals, `historico_operacional_${activeTab}`);
    };

    const tabs = [
        { id: 'pendentes' as const, label: 'Pendentes de Análise', icon: List },
        { id: 'finalizadas' as const, label: 'Análises Finalizadas', icon: Check },
    ];

    return (
        <Layout title="Dashboard Operacional">
            <div className="flex justify-between items-center mb-6">
                <div className="relative w-full max-w-xs">
                    <input 
                        type="text" 
                        placeholder="Pesquisar por código, pet, tutor..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg" 
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
                            <button 
                                key={tab.id} 
                                onClick={() => setActiveTab(tab.id)} 
                                className={`px-4 py-3 font-medium text-sm border-b-2 flex items-center gap-2 ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="p-6">
                    {filteredRemovals.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredRemovals.map(removal => 
                                <RemovalCard key={removal.code} removal={removal} onClick={() => setSelectedRemoval(removal)} />
                            )}
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

export default OperacionalHome;
