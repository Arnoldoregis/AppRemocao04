import React, { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useRemovals } from '../context/RemovalContext';
import Layout from '../components/Layout';
import { BarChart, TrendingUp, XCircle, DollarSign, FileText, Layers, Shield } from 'lucide-react';

const GerenciaHome: React.FC = () => {
  const { removals } = useRemovals();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'comparativo'>('dashboard');

  const { monthlyData, modalitiesData, plansData, chartOption } = useMemo(() => {
    const now = new Date();
    const currentMonthRemovalsAll = removals.filter(r => new Date(r.createdAt).getMonth() === now.getMonth());
    const currentMonthRemovalsValid = currentMonthRemovalsAll.filter(r => r.status !== 'cancelada');

    // KPI Data
    const totalRemovals = currentMonthRemovalsAll.length;
    const cancelledRemovals = currentMonthRemovalsAll.length - currentMonthRemovalsValid.length;
    const totalRevenue = currentMonthRemovalsValid.reduce((sum, r) => sum + r.value, 0);
    const preventivePlansCount = currentMonthRemovalsValid.filter(r => r.paymentMethod === 'plano_preventivo').length;

    const monthlyData = {
      totalRemovals,
      cancelledRemovals,
      totalRevenue,
      preventivePlans: preventivePlansCount,
    };

    // Modalities Table Data
    const modalitiesData = [
      { name: 'Coletivo', quantity: currentMonthRemovalsValid.filter(r => r.modality === 'coletivo').length, value: currentMonthRemovalsValid.filter(r => r.modality === 'coletivo').reduce((s, r) => s + r.value, 0) },
      { name: 'Individual Prata', quantity: currentMonthRemovalsValid.filter(r => r.modality === 'individual_prata').length, value: currentMonthRemovalsValid.filter(r => r.modality === 'individual_prata').reduce((s, r) => s + r.value, 0) },
      { name: 'Individual Ouro', quantity: currentMonthRemovalsValid.filter(r => r.modality === 'individual_ouro').length, value: currentMonthRemovalsValid.filter(r => r.modality === 'individual_ouro').reduce((s, r) => s + r.value, 0) },
    ];

    // Plans Table Data
    const plansData = [
      { name: 'Plano Preventivo', quantity: preventivePlansCount, value: currentMonthRemovalsValid.filter(r => r.paymentMethod === 'plano_preventivo').reduce((s, r) => s + r.value, 0) },
      { name: 'Plano Imediato', quantity: currentMonthRemovalsValid.filter(r => r.paymentMethod !== 'plano_preventivo').length, value: currentMonthRemovalsValid.filter(r => r.paymentMethod !== 'plano_preventivo').reduce((s, r) => s + r.value, 0) },
    ];
    
    // Chart Data
    const chartOption = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['Quantidade', 'Faturamento'] },
      xAxis: { type: 'category', data: ['Coletiva', 'Individual', 'Cancelada'] },
      yAxis: [{ type: 'value', name: 'Quantidade' }, { type: 'value', name: 'Faturamento (R$)' }],
      series: [
        { name: 'Quantidade', type: 'bar', data: [
            currentMonthRemovalsValid.filter(r => r.modality === 'coletivo').length, 
            currentMonthRemovalsValid.filter(r => r.modality !== 'coletivo').length, 
            cancelledRemovals
        ]},
        { name: 'Faturamento', type: 'line', yAxisIndex: 1, data: [
            modalitiesData.find(m => m.name === 'Coletivo')?.value || 0,
            (modalitiesData.find(m => m.name === 'Individual Prata')?.value || 0) + (modalitiesData.find(m => m.name === 'Individual Ouro')?.value || 0),
            0
        ]}
      ]
    };

    return { monthlyData, modalitiesData, plansData, chartOption };
  }, [removals]);
  
  const kpis = [
      { label: 'Remoções no Mês', value: monthlyData.totalRemovals, icon: TrendingUp, color: 'blue' },
      { label: 'Canceladas no Mês', value: monthlyData.cancelledRemovals, icon: XCircle, color: 'red' },
      { label: 'Faturamento do Mês', value: `R$ ${monthlyData.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'green' },
      { label: 'Planos Preventivos', value: monthlyData.preventivePlans, icon: FileText, color: 'purple' },
  ];

  return (
    <Layout title="Dashboard da Gerência">
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b">
          <nav className="flex flex-wrap -mb-px">
            <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-3 font-medium text-sm border-b-2 ${activeTab === 'dashboard' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Dashboard do Mês</button>
            <button onClick={() => setActiveTab('comparativo')} className={`px-4 py-3 font-medium text-sm border-b-2 ${activeTab === 'comparativo' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Compare Mês a Mês</button>
          </nav>
        </div>
        <div className="p-6">
          {activeTab === 'dashboard' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {kpis.map(kpi => (
                      <div key={kpi.label} className={`bg-gradient-to-br from-${kpi.color}-100 to-${kpi.color}-200 p-6 rounded-lg shadow`}>
                          <kpi.icon className={`h-8 w-8 text-${kpi.color}-600 mb-4`} />
                          <p className="text-3xl font-bold text-gray-800">{kpi.value}</p>
                          <p className="text-sm text-gray-600">{kpi.label}</p>
                      </div>
                  ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Tabela de Modalidades */}
                <div className="bg-gray-50 p-4 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center"><Layers className="mr-2 h-5 w-5 text-gray-700"/>Desempenho por Modalidade</h3>
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left text-sm font-medium text-gray-600 pb-2">Modalidade</th>
                                <th className="text-right text-sm font-medium text-gray-600 pb-2">Quantidade</th>
                                <th className="text-right text-sm font-medium text-gray-600 pb-2">Valor Faturado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {modalitiesData.map(item => (
                                <tr key={item.name} className="border-b border-gray-200 last:border-b-0">
                                    <td className="py-3 font-medium text-gray-800">{item.name}</td>
                                    <td className="py-3 text-right text-gray-700">{item.quantity}</td>
                                    <td className="py-3 text-right text-gray-700">R$ {item.value.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Tabela de Planos */}
                <div className="bg-gray-50 p-4 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center"><Shield className="mr-2 h-5 w-5 text-gray-700"/>Desempenho por Tipo de Plano</h3>
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left text-sm font-medium text-gray-600 pb-2">Plano</th>
                                <th className="text-right text-sm font-medium text-gray-600 pb-2">Quantidade</th>
                                <th className="text-right text-sm font-medium text-gray-600 pb-2">Valores</th>
                            </tr>
                        </thead>
                        <tbody>
                            {plansData.map(item => (
                                <tr key={item.name} className="border-b border-gray-200 last:border-b-0">
                                    <td className="py-3 font-medium text-gray-800">{item.name}</td>
                                    <td className="py-3 text-right text-gray-700">{item.quantity}</td>
                                    <td className="py-3 text-right text-gray-700">R$ {item.value.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="text-lg font-semibold mb-4 flex items-center"><BarChart className="mr-2"/>Gráfico do Mês</h3>
                <ReactECharts option={chartOption} style={{ height: '400px' }} />
              </div>
            </div>
          )}
          {activeTab === 'comparativo' && (
            <div className="text-center text-gray-500 py-12">
              <p>A funcionalidade de comparação mês a mês será implementada em breve.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default GerenciaHome;
