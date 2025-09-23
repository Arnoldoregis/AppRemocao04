import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types';
import { mockDrivers } from '../data/mock';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, userType: string) => Promise<User | null>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const employeeRoles: { [key: string]: User['role'] } = {
  'adm@gmail.com': 'administrador',
  'receptor@gmail.com': 'receptor',
  'motorista@gmail.com': 'motorista',
  'financeirojunior@gmail.com': 'financeiro_junior',
  'financeiromaster@gmail.com': 'financeiro_master',
  'gerencia@gmail.com': 'gerencia',
  'operacional@gmail.com': 'operacional',
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string, userType: string): Promise<User | null> => {
    // Simulação de login com senha única para teste
    if (password !== 'Ald83402310') {
        return null; // Senha incorreta para qualquer login de teste
    }

    let mockUser: User | null = null;

    if (userType === 'pessoa_fisica') {
      mockUser = {
        id: 'pf_123',
        email: email,
        name: 'João da Silva (Teste)',
        userType: 'pessoa_fisica',
        cpf: '123.456.789-00',
        phone: '(41) 99999-8888',
        address: {
          cep: '80000-000',
          street: 'Rua das Flores',
          number: '123',
          neighborhood: 'Centro',
          city: 'Curitiba',
          state: 'PR'
        }
      };
    } else if (userType === 'clinica') {
      mockUser = {
        id: 'clinic_456',
        email: email,
        name: 'Clínica Vet Top (Teste)',
        userType: 'clinica',
        cnpj: '11.222.333/0001-44',
        phone: '(41) 3333-4444',
        address: {
          cep: '81000-100',
          street: 'Avenida das Clínicas',
          number: '789',
          neighborhood: 'Batel',
          city: 'Curitiba',
          state: 'PR'
        }
      };
    } else if (userType === 'funcionarios') {
      const role = employeeRoles[email.toLowerCase()];
      if (role === 'motorista') {
        const driverData = mockDrivers.find(d => d.email === email.toLowerCase());
        if (driverData) {
            mockUser = {
                id: driverData.id,
                email: driverData.email,
                name: driverData.name,
                userType: 'funcionario',
                role: 'motorista',
                phone: '(41) 55555-4444',
                address: { cep: '', street: '', number: '', neighborhood: '', city: '', state: '' }
            };
        }
      } else if (role) {
        mockUser = {
          id: `func_${role}_789`,
          email: email,
          name: `${role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ')} (Teste)`,
          userType: 'funcionario',
          role: role,
          phone: '(41) 11111-2222',
          address: { cep: '', street: '', number: '', neighborhood: '', city: '', state: '' }
        };
      }
    }

    if (mockUser) {
      setUser(mockUser);
      return mockUser; // Retorna o objeto do usuário em caso de sucesso
    }

    return null; // Retorna nulo em caso de falha
  };

  const logout = () => {
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
