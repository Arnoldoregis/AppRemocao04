import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RemovalProvider } from './context/RemovalContext';
import { NotificationProvider } from './context/NotificationContext';
import { ChatProvider } from './context/ChatContext';
import { AgendaProvider } from './context/AgendaContext';
import HomePage from './pages/HomePage';
import RegisterPessoaFisica from './pages/RegisterPessoaFisica';
import RegisterClinica from './pages/RegisterClinica';
import PessoaFisicaHome from './pages/PessoaFisicaHome';
import SolicitarRemocao from './pages/SolicitarRemocao';
import ClinicaHome from './pages/ClinicaHome';
import SolicitarRemocaoClinica from './pages/SolicitarRemocaoClinica';
import FuncionarioDashboard from './pages/FuncionarioDashboard';
import RegisterFuncionario from './pages/RegisterFuncionario';
import ResetPassword from './pages/ResetPassword';
import AgendaDespedida from './pages/AgendaDespedida';
import CremadorDashboardPage from './pages/CremadorDashboardPage';
import ReceptorSolicitarRemocaoPF from './pages/ReceptorSolicitarRemocaoPF';
import ReceptorSolicitarRemocaoClinica from './pages/ReceptorSolicitarRemocaoClinica';

// Componente para rotas protegidas
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/" />;
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <RemovalProvider>
          <ChatProvider>
            <AgendaProvider>
              <Router>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/cadastro/pessoa-fisica" element={<RegisterPessoaFisica />} />
                  <Route path="/cadastro/clinica" element={<RegisterClinica />} />
                  <Route path="/redefinir-senha" element={<ResetPassword />} />
                  
                  {/* Rotas protegidas */}
                  <Route path="/pessoa-fisica" element={
                    <ProtectedRoute>
                      <PessoaFisicaHome />
                    </ProtectedRoute>
                  } />
                  <Route path="/solicitar-remocao" element={
                    <ProtectedRoute>
                      <SolicitarRemocao />
                    </ProtectedRoute>
                  } />
                  <Route path="/clinica" element={
                    <ProtectedRoute>
                      <ClinicaHome />
                    </ProtectedRoute>
                  } />
                  <Route path="/solicitar-remocao-clinica" element={
                    <ProtectedRoute>
                      <SolicitarRemocaoClinica />
                    </ProtectedRoute>
                  } />
                  <Route path="/funcionario/:role" element={
                    <ProtectedRoute>
                      <FuncionarioDashboard />
                    </ProtectedRoute>
                  } />
                   <Route path="/funcionario/adm/cadastro-funcionarios" element={
                    <ProtectedRoute>
                      <RegisterFuncionario />
                    </ProtectedRoute>
                  } />
                  <Route path="/agenda-despedida" element={
                    <ProtectedRoute>
                      <AgendaDespedida />
                    </ProtectedRoute>
                  } />
                  <Route path="/painel-cremador" element={
                    <ProtectedRoute>
                      <CremadorDashboardPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/receptor/solicitar-remocao-pf" element={
                    <ProtectedRoute>
                      <ReceptorSolicitarRemocaoPF />
                    </ProtectedRoute>
                  } />
                  <Route path="/receptor/solicitar-remocao-clinica" element={
                    <ProtectedRoute>
                      <ReceptorSolicitarRemocaoClinica />
                    </ProtectedRoute>
                  } />
                </Routes>
              </Router>
            </AgendaProvider>
          </ChatProvider>
        </RemovalProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
