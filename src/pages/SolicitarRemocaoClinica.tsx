import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRemovals } from '../context/RemovalContext';
import { usePricing } from '../context/PricingContext';
import Layout from '../components/Layout';
import { ArrowLeft, Upload, Plus, Minus, Building2, MapPin } from 'lucide-react';
import { Additional, Removal, Address } from '../types';
import { adicionaisDisponiveis } from '../data/pricing';
import { getRegionFromAddress, getSpeciesType, getBillingType } from '../utils/pricingUtils';

const SolicitarRemocaoClinica: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addRemoval } = useRemovals();
  const { priceTable } = usePricing();

  const [formData, setFormData] = useState({
    modalidade: '' as Removal['modality'],
    tutorCpfCnpj: '',
    tutorNome: '',
    tutorContato: '',
    tutorEmail: '',
    petNome: '',
    petEspecie: '' as Removal['pet']['species'],
    petRaca: '',
    petSexo: '' as Removal['pet']['gender'],
    petPeso: '',
    petCausaMorte: '',
    enderecoRemocao: `${user?.address?.street || ''}, ${user?.address?.number || ''}, ${user?.address?.neighborhood || ''}, ${user?.address?.city || ''} - ${user?.address?.state || ''}, CEP: ${user?.address?.cep || ''}`,
    formaPagamento: '' as Removal['paymentMethod'],
    contratoNumero: '',
    observacoes: '',
    tipoSolicitacao: 'agora' as Removal['requestType'],
    dataAgendamento: '',
    horarioAgendamento: '',
    motivoAgendamento: ''
  });
  
  const [adicionais, setAdicionais] = useState<Additional[]>([]);
  const [valorTotal, setValorTotal] = useState(0);
  const [priceBreakdown, setPriceBreakdown] = useState({ base: 0, extras: 0, discount: 0 });
  const [showUpload, setShowUpload] = useState(false);
  const [showContrato, setShowContrato] = useState(false);
  const [showPagamentoInfo, setShowPagamentoInfo] = useState(false);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);

  const paymentOptions = [
    { value: 'faturado', label: 'Faturado' },
    { value: 'debito', label: 'Cartão de Débito' },
    { value: 'credito', label: 'Cartão de Crédito' },
    { value: 'pix', label: 'PIX' },
    { value: 'link_pagamento', label: 'Link de Pagamento' },
    { value: 'dinheiro', label: 'Dinheiro' },
    { value: 'plano_preventivo', label: 'Plano Preventivo' }
  ];

  useEffect(() => {
    const calcularValorTotal = () => {
      const canCalculate = 
          formData.modalidade &&
          formData.petEspecie &&
          formData.petPeso &&
          user?.address?.city &&
          user?.address?.state &&
          formData.formaPagamento;

      if (!canCalculate) {
          setValorTotal(0);
          setPriceBreakdown({ base: 0, extras: 0, discount: 0 });
          return;
      }

      let valorBase = 0;
      const pesoKey = formData.petPeso;
      const modKey = formData.modalidade;

      const region = getRegionFromAddress(user!.address!);
      const speciesType = getSpeciesType(formData.petEspecie);
      const billingType = getBillingType(formData.formaPagamento);
      
      if (priceTable[region]?.[speciesType]?.[billingType]?.[pesoKey]?.[modKey]) {
        valorBase = priceTable[region][speciesType][billingType][pesoKey][modKey];
      }
      
      const valorAdicionais = adicionais.reduce((total, ad) => total + (ad.value * ad.quantity), 0);
      
      let finalTotal = valorBase + valorAdicionais;
      let patinhaDiscount = 0;

      if (formData.modalidade === 'individual_ouro' && adicionais.some(ad => ad.type === 'patinha_resina' && ad.quantity > 0)) {
          const patinhaPrice = adicionaisDisponiveis.find(ad => ad.type === 'patinha_resina')?.value || 0;
          patinhaDiscount = patinhaPrice;
          finalTotal -= patinhaPrice;
      }

      setValorTotal(finalTotal);
      setPriceBreakdown({ base: valorBase, extras: valorAdicionais, discount: patinhaDiscount });
    };
    calcularValorTotal();
  }, [formData.modalidade, formData.petEspecie, formData.petPeso, formData.formaPagamento, adicionais, user?.address, priceTable]);
  
  useEffect(() => {
    const needsUpload = formData.formaPagamento === 'pix' || formData.formaPagamento === 'link_pagamento';
    const needsContrato = formData.formaPagamento === 'plano_preventivo';
    const needsInfo = ['credito', 'debito', 'dinheiro'].includes(formData.formaPagamento);
    
    setShowUpload(needsUpload);
    setShowContrato(needsContrato);
    setShowPagamentoInfo(needsInfo);
  }, [formData.formaPagamento]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAdicionalChange = (type: Additional['type'], quantity: number) => {
    const adicionalInfo = adicionaisDisponiveis.find(a => a.type === type);
    if (!adicionalInfo) return;

    setAdicionais(prev => {
      const existing = prev.find(a => a.type === type);
      if (quantity <= 0) return prev.filter(a => a.type !== type);
      if (existing) return prev.map(a => a.type === type ? { ...a, quantity } : a);
      return [...prev, { type, quantity, value: adicionalInfo.value }];
    });
  };

  const getAdicionalQuantity = (type: string) => adicionais.find(a => a.type === type)?.quantity || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const newRemoval: Partial<Removal> = {
      createdById: user.id,
      clinicName: user.name,
      clinicCnpj: user.cnpj,
      clinicPhone: user.phone,
      modality: formData.modalidade,
      tutor: { cpfOrCnpj: formData.tutorCpfCnpj, name: formData.tutorNome, phone: formData.tutorContato, email: formData.tutorEmail },
      pet: { name: formData.petNome, species: formData.petEspecie, breed: formData.petRaca, gender: formData.petSexo, weight: formData.petPeso, causeOfDeath: formData.petCausaMorte },
      removalAddress: { ...(user.address as Address), street: formData.enderecoRemocao },
      additionals: adicionais,
      paymentMethod: formData.formaPagamento,
      value: valorTotal,
      observations: formData.observacoes,
      requestType: formData.tipoSolicitacao,
      scheduledDate: formData.dataAgendamento,
      scheduledTime: formData.horarioAgendamento,
      schedulingReason: formData.motivoAgendamento,
      status: formData.tipoSolicitacao === 'agendar' ? 'agendada' : 'solicitada',
      history: [{ date: new Date().toISOString(), action: 'Solicitação criada', user: user.name }],
      contractNumber: formData.contratoNumero,
      paymentProof: paymentProofFile ? paymentProofFile.name : undefined,
    };

    addRemoval(newRemoval);
    alert(`Solicitação de remoção criada com sucesso!`);
    navigate('/clinica');
  };

  const isPatinhaInclusa = formData.modalidade === 'individual_ouro';

  return (
    <Layout title="Solicitar Remoção (Clínica)">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/clinica')} className="flex items-center text-blue-600 hover:text-blue-800 mb-6"><ArrowLeft className="h-5 w-5 mr-2" />Voltar ao Dashboard</button>
        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="p-4 bg-gray-50 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center"><Building2 className="h-5 w-5 mr-2 text-green-600" />Informações da Clínica</h3>
              <p><strong>Nome:</strong> {user?.name}</p>
              <p><strong>CNPJ:</strong> {user?.cnpj}</p>
              <p><strong>Contato:</strong> {user?.phone}</p>
            </div>
            
            {/* Modalidade */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Modalidade *</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['coletivo', 'individual_prata', 'individual_ouro'].map((modalidade) => (
                  <label key={modalidade} className="relative cursor-pointer">
                    <input type="radio" name="modalidade" value={modalidade} checked={formData.modalidade === modalidade} onChange={handleInputChange} className="sr-only" required />
                    <div className={`p-4 rounded-lg border-2 text-center transition-all ${formData.modalidade === modalidade ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <span className="font-medium">{modalidade.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Dados do Tutor */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados do Tutor</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input name="tutorCpfCnpj" value={formData.tutorCpfCnpj} onChange={handleInputChange} placeholder="CPF ou CNPJ *" required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                <input name="tutorNome" value={formData.tutorNome} onChange={handleInputChange} placeholder="Nome do Tutor *" required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                <input name="tutorContato" value={formData.tutorContato} onChange={handleInputChange} placeholder="Número de Contato *" required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                <input type="email" name="tutorEmail" value={formData.tutorEmail} onChange={handleInputChange} placeholder="Email" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
            </div>

            {/* Dados do Pet */}
             <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados do Pet</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input name="petNome" value={formData.petNome} onChange={handleInputChange} placeholder="Nome do Pet *" required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                <select name="petEspecie" value={formData.petEspecie} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="">Espécie *</option>
                    <option value="cachorro">Cachorro</option><option value="gato">Gato</option><option value="roedor">Roedor</option><option value="passaro">Pássaro</option><option value="outros">Outros</option>
                </select>
                <input name="petRaca" value={formData.petRaca} onChange={handleInputChange} placeholder="Raça" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                <select name="petSexo" value={formData.petSexo} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="">Sexo *</option>
                    <option value="macho">Macho</option><option value="femea">Fêmea</option>
                </select>
                <select name="petPeso" value={formData.petPeso} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="">Peso *</option>
                    <option value="0-5kg">Até 05kg</option>
                    <option value="6-10kg">De 06kg a 10kg</option>
                    <option value="11-20kg">De 11kg a 20kg</option>
                    <option value="21-40kg">De 21kg a 40kg</option>
                    <option value="41-50kg">De 41kg a 50kg</option>
                    <option value="51-60kg">De 51kg a 60kg</option>
                    <option value="61-80kg">De 61kg a 80kg</option>
                </select>
                <input name="petCausaMorte" value={formData.petCausaMorte} onChange={handleInputChange} placeholder="Causa da morte" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
            </div>

            {/* Dados da Remoção */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados da Remoção</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Endereço da Remoção (editável)
                </label>
                <textarea
                  name="enderecoRemocao"
                  value={formData.enderecoRemocao}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Adicionais */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Adicionais</h3>
              <div className="space-y-4">
                {adicionaisDisponiveis.map((ad) => (
                  <div key={ad.type} className={`flex items-center justify-between p-4 border rounded-lg ${isPatinhaInclusa && ad.type === 'patinha_resina' ? 'bg-gray-50 border-green-200' : 'border-gray-200'}`}>
                    <div>
                        <span className="font-medium">{ad.label}</span>
                        <span className="text-green-600 ml-2">R$ {ad.value},00</span>
                        {isPatinhaInclusa && ad.type === 'patinha_resina' && (
                            <span className="ml-3 text-xs font-bold text-white bg-green-500 px-2 py-0.5 rounded-full">1ª Grátis</span>
                        )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <button type="button" onClick={() => handleAdicionalChange(ad.type, Math.max(0, getAdicionalQuantity(ad.type) - 1))} className="p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200"><Minus className="h-4 w-4" /></button>
                      <span className="w-8 text-center">{getAdicionalQuantity(ad.type)}</span>
                      <button type="button" onClick={() => handleAdicionalChange(ad.type, Math.min(15, getAdicionalQuantity(ad.type) + 1))} className="p-1 rounded-full bg-green-100 text-green-600 hover:bg-green-200"><Plus className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Forma de Pagamento */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Forma de Pagamento *</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {paymentOptions.map((pagamento) => (
                  <label key={pagamento.value} className="relative cursor-pointer">
                    <input
                      type="radio"
                      name="formaPagamento"
                      value={pagamento.value}
                      checked={formData.formaPagamento === pagamento.value}
                      onChange={handleInputChange}
                      className="sr-only"
                      required
                    />
                    <div className={`p-3 rounded-lg border-2 text-center text-sm transition-all ${
                      formData.formaPagamento === pagamento.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      {pagamento.label}
                    </div>
                  </label>
                ))}
              </div>

              {showUpload && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Upload className="inline h-4 w-4 mr-1" />
                    Anexar Comprovante de Pagamento (JPG, PDF)
                  </label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.pdf"
                    onChange={(e) => setPaymentProofFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              )}

              {showContrato && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Número do Contrato</label>
                  <input
                    type="text"
                    name="contratoNumero"
                    value={formData.contratoNumero}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {showPagamentoInfo && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <strong>Informação:</strong> O pagamento será realizado no ato da remoção.
                  </p>
                </div>
              )}
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
              <textarea
                name="observacoes"
                value={formData.observacoes}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Informações adicionais..."
              />
            </div>

            {/* Tipo de Solicitação */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Solicitar Remoção</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="relative cursor-pointer"><input type="radio" name="tipoSolicitacao" value="agora" checked={formData.tipoSolicitacao === 'agora'} onChange={handleInputChange} className="sr-only" /><div className={`p-4 rounded-lg border-2 text-center transition-all ${formData.tipoSolicitacao === 'agora' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}><span className="font-medium">Solicitar Agora</span></div></label>
                <label className="relative cursor-pointer"><input type="radio" name="tipoSolicitacao" value="agendar" checked={formData.tipoSolicitacao === 'agendar'} onChange={handleInputChange} className="sr-only" /><div className={`p-4 rounded-lg border-2 text-center transition-all ${formData.tipoSolicitacao === 'agendar' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}><span className="font-medium">Agendar Remoção</span></div></label>
              </div>

              {formData.tipoSolicitacao === 'agendar' && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
                    <input type="date" name="dataAgendamento" value={formData.dataAgendamento} onChange={handleInputChange} min={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Horário</label>
                    <input type="time" name="horarioAgendamento" value={formData.horarioAgendamento} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Motivo do Agendamento</label>
                    <textarea name="motivoAgendamento" value={formData.motivoAgendamento} onChange={handleInputChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Explique o motivo para agendar..."/>
                  </div>
                </div>
              )}
            </div>

            {/* Valor Total */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 border border-gray-200">
                <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-800">Valor Total:</span>
                    {valorTotal > 0 || (priceBreakdown.base === 0 && priceBreakdown.extras > 0) ? (
                        <span className="text-2xl font-bold text-green-600">R$ {valorTotal.toFixed(2)}</span>
                    ) : (
                        <span className="text-sm text-gray-500">Preencha os campos para calcular</span>
                    )}
                </div>
                {valorTotal > 0 && (
                    <details className="text-xs">
                        <summary className="text-blue-600 cursor-pointer select-none font-medium">Ver detalhes do cálculo</summary>
                        <div className="text-sm text-gray-600 mt-2 space-y-1 border-t pt-2">
                            {priceBreakdown.base > 0 && <div className="flex justify-between"><span>Valor Base (Modalidade/Peso/Região):</span><span>R$ {priceBreakdown.base.toFixed(2)}</span></div>}
                            {priceBreakdown.extras > 0 && <div className="flex justify-between"><span>Adicionais:</span><span>+ R$ {priceBreakdown.extras.toFixed(2)}</span></div>}
                            {priceBreakdown.discount > 0 && <div className="flex justify-between text-red-600"><span>Desconto (Patinha Inclusa):</span><span>- R$ {priceBreakdown.discount.toFixed(2)}</span></div>}
                        </div>
                    </details>
                )}
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <button type="button" onClick={() => navigate('/clinica')} className="px-6 py-2 border rounded-md">Cancelar</button>
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Solicitar</button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default SolicitarRemocaoClinica;
