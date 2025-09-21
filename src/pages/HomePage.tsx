import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginForm from '../components/LoginForm';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import { Users, Building2, UserCog, Heart } from 'lucide-react';

const HomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pessoa_fisica' | 'clinica' | 'funcionarios'>('pessoa_fisica');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    const loggedInUser = await login(email, password, activeTab);
    
    if (loggedInUser) {
      switch (loggedInUser.userType) {
        case 'pessoa_fisica':
          navigate('/pessoa-fisica');
          break;
        case 'clinica':
          navigate('/clinica');
          break;
        case 'funcionario':
          if (loggedInUser.role) {
            navigate(`/funcionario/${loggedInUser.role}`);
          }
          break;
        default:
          navigate('/'); // Fallback
          break;
      }
      return true;
    }
    
    return false;
  };

  const handleRegister = () => {
    if (activeTab === 'pessoa_fisica') {
      navigate('/cadastro/pessoa-fisica');
    } else if (activeTab === 'clinica') {
      navigate('/cadastro/clinica');
    }
  };

  const tabs = [
    {
      id: 'pessoa_fisica' as const,
      label: 'Pessoa Física',
      icon: Users,
      color: 'blue'
    },
    {
      id: 'clinica' as const,
      label: 'Clínica',
      icon: Building2,
      color: 'green'
    },
    {
      id: 'funcionarios' as const,
      label: 'Funcionários',
      icon: UserCog,
      color: 'yellow'
    }
  ];

  // Mapeamento para garantir que o Tailwind CSS detecte as classes
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500', // Manter para referência, caso necessário
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-white p-4 rounded-full shadow-lg">
              <Heart className="h-12 w-12 text-red-500" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Remoção Pet
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Sistema de Gerenciamento de Remoção
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-md p-1 inline-flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 px-6 py-3 rounded-md font-medium transition-all
                  ${activeTab === tab.id
                    ? `${colorClasses[tab.color as keyof typeof colorClasses]} text-white shadow-sm`
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Login Form */}
        <div className="flex justify-center">
          <LoginForm
            onLogin={handleLogin}
            onForgotPassword={() => setShowForgotPassword(true)}
            onRegister={activeTab !== 'funcionarios' ? handleRegister : undefined}
            title={`Login ${tabs.find(t => t.id === activeTab)?.label}`}
            showRegister={activeTab !== 'funcionarios'}
          />
        </div>

        {/* Forgot Password Modal */}
        <ForgotPasswordModal
          isOpen={showForgotPassword}
          onClose={() => setShowForgotPassword(false)}
        />

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500">
          <p>© 2025 Pet Anjinho - Sistema de Remoção com Carinho</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
