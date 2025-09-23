import React from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import AdminHome from './AdminHome';
import ReceptorHome from './ReceptorHome';
import MotoristaHome from './MotoristaHome';
import FinanceiroJuniorHome from './FinanceiroJuniorHome';
import FinanceiroMasterHome from './FinanceiroMasterHome';
import GerenciaHome from './GerenciaHome';
import OperacionalHome from './OperacionalHome.tsx';

const FuncionarioDashboard: React.FC = () => {
  const { role } = useParams<{ role: string }>();

  switch (role) {
    case 'administrador':
      return <AdminHome />;
    case 'receptor':
      return <ReceptorHome />;
    case 'motorista':
      return <MotoristaHome />;
    case 'financeiro_junior':
      return <FinanceiroJuniorHome />;
    case 'financeiro_master':
      return <FinanceiroMasterHome />;
    case 'gerencia':
      return <GerenciaHome />;
    case 'operacional':
      return <OperacionalHome />;
    default:
      return (
        <Layout title="Erro">
          <div className="text-center text-red-500">
            <h1 className="text-2xl">Função de usuário desconhecida.</h1>
          </div>
        </Layout>
      );
  }
};

export default FuncionarioDashboard;
