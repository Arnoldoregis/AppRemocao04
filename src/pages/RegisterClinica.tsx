import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft } from 'lucide-react';
import Layout from '../components/Layout';

const RegisterClinica: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nomeFantasia: '',
    cnpj: '',
    numeroContato: '',
    cep: '',
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    email: '',
    senha: '',
    confirmarSenha: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    let formattedValue = value;
    if (name === 'cnpj') {
      formattedValue = value.replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .slice(0, 18);
    } else if (name === 'numeroContato') {
      formattedValue = value.replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .slice(0, 15);
    } else if (name === 'cep') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2').slice(0, 9);
    }
    
    setFormData(prev => ({ ...prev, [name]: formattedValue }));
  };

  const searchCEP = async () => {
    const cep = formData.cep.replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            rua: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };

  const validatePassword = (password: string): boolean => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    return hasUpperCase && hasLowerCase && hasNumbers && password.length >= 8;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword(formData.senha)) {
      alert('A senha deve conter pelo menos 1 letra maiúscula, 1 letra minúscula e números');
      return;
    }
    
    if (formData.senha !== formData.confirmarSenha) {
      alert('As senhas não coincidem');
      return;
    }

    console.log('Dados de cadastro da clínica:', formData);
    alert('Cadastro de clínica realizado com sucesso!');
    navigate('/');
  };

  return (
    <Layout title="Cadastro - Clínica">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Voltar ao Login
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Cadastre os dados da Clínica <span className="text-red-500">*obrigatório</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome Fantasia *</label>
                <input type="text" name="nomeFantasia" required value={formData.nomeFantasia} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CNPJ *</label>
                <input type="text" name="cnpj" required value={formData.cnpj} onChange={handleInputChange} placeholder="00.000.000/0000-00" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Número de Contato *</label>
                <input type="text" name="numeroContato" required value={formData.numeroContato} onChange={handleInputChange} placeholder="(41) 90000-0000" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Endereço *</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <input type="text" name="cep" required value={formData.cep} onChange={handleInputChange} placeholder="00000-000" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <button type="button" onClick={searchCEP} className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"><Search className="h-5 w-5" /></button>
                  </div>
                  <div className="md:col-span-2">
                    <input type="text" name="rua" required value={formData.rua} onChange={handleInputChange} placeholder="Rua" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                  <input type="text" name="numero" required value={formData.numero} onChange={handleInputChange} placeholder="Número" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="text" name="bairro" required value={formData.bairro} onChange={handleInputChange} placeholder="Bairro" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="text" name="cidade" required value={formData.cidade} onChange={handleInputChange} placeholder="Cidade" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="text" name="estado" required maxLength={2} value={formData.estado} onChange={handleInputChange} placeholder="UF" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email (será seu login) *</label>
                <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Senha *</label>
                <input type="password" name="senha" required value={formData.senha} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <p className="text-xs text-gray-500 mt-1">*1 Letra maiúscula, 1 letra minúscula e números</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Senha *</label>
                <input type="password" name="confirmarSenha" required value={formData.confirmarSenha} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button type="button" onClick={() => navigate('/')} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancelar</button>
              <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Cadastrar Clínica</button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default RegisterClinica;
