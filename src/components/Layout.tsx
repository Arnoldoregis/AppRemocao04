import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import ChatWidget from './ChatWidget';
import ChatModal from './modals/ChatModal';
import ConversationListModal from './modals/ConversationListModal';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleHome = () => {
    if (user?.userType === 'pessoa_fisica') {
      navigate('/pessoa-fisica');
    } else if (user?.userType === 'clinica') {
      navigate('/clinica');
    } else if (user?.userType === 'funcionario') {
      navigate(`/funcionario/${user.role}`);
    }
  };

  const showChat = user?.userType === 'pessoa_fisica' || user?.userType === 'clinica' || user?.role === 'receptor';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <>
                  <NotificationBell />
                  <span className="text-sm text-gray-600">
                    Olá, {user.name}
                  </span>
                  <button
                    onClick={handleHome}
                    className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                    title="Início"
                  >
                    <Home className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                    title="Sair"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      {showChat && (
        <>
          <ChatWidget />
          <ConversationListModal />
          <ChatModal />
        </>
      )}
    </div>
  );
};

export default Layout;
