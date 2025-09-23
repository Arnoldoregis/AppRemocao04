import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Removal, RemovalStatus } from '../types';
import { generateMockRemovals } from '../data/mock';
import { differenceInMinutes, parse, isBefore } from 'date-fns';
import { useNotifications } from './NotificationContext';

interface RemovalContextType {
  removals: Removal[];
  addRemoval: (removal: Removal) => void;
  updateRemoval: (code: string, updates: Partial<Removal>) => void;
  updateMultipleRemovals: (codes: string[], updates: Partial<Removal>, firstRemoval: Removal) => void;
  getRemovalsByStatus: (status: RemovalStatus) => Removal[];
  getRemovalsByOwner: (ownerId: string) => Removal[];
  generateRemovalCode: () => string;
}

const RemovalContext = createContext<RemovalContextType | undefined>(undefined);

export const useRemovals = () => {
  const context = useContext(RemovalContext);
  if (context === undefined) {
    throw new Error('useRemovals must be used within a RemovalProvider');
  }
  return context;
};

interface RemovalProviderProps {
  children: ReactNode;
}

export const RemovalProvider: React.FC<RemovalProviderProps> = ({ children }) => {
  const [removals, setRemovals] = useState<Removal[]>([]);
  const [codeCounter, setCodeCounter] = useState(1);
  const { addNotification } = useNotifications();
  
  const generateRemovalCode = (): string => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const currentCount = codeCounter + removals.length; // Garante unicidade
    const letterIndex = Math.floor((currentCount - 1) / 999999);
    const number = ((currentCount - 1) % 999999) + 1;
    
    let prefix = '';
    if (letterIndex < 26) {
        prefix = letters[letterIndex];
    } else {
        const firstLetter = Math.floor((letterIndex / 26) - 1);
        const secondLetter = letterIndex % 26;
        prefix = letters[firstLetter] + letters[secondLetter];
    }
    
    const code = `${prefix}${number.toString().padStart(6, '0')}`;
    setCodeCounter(prev => prev + 1);
    return code;
  };

  useEffect(() => {
    setRemovals(generateMockRemovals());
  }, []);

  // Efeito para verificar agendamentos
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      removals.forEach(r => {
        if (r.status === 'agendada' && r.scheduledDate && r.scheduledTime) {
          try {
            const scheduledDateTime = parse(`${r.scheduledDate} ${r.scheduledTime}`, 'yyyy-MM-dd HH:mm', new Date());
            
            // Verifica se o horário agendado já passou e se a diferença é de até 10 minutos
            if (isBefore(scheduledDateTime, now) && differenceInMinutes(now, scheduledDateTime) <= 10) {
              updateRemoval(r.code, {
                status: 'solicitada',
                history: [
                  ...r.history,
                  {
                    date: new Date().toISOString(),
                    action: 'Status alterado automaticamente de Agendada para Solicitada',
                    user: 'Sistema',
                  },
                ],
              });
               addNotification(`Agendamento ${r.code} virou uma solicitação.`, { recipientRole: 'receptor' });
            }
          } catch (error) {
            console.error("Erro ao parsear data/hora do agendamento:", error);
          }
        }
      });
    }, 60000); // Verifica a cada minuto

    return () => clearInterval(interval); // Limpa o intervalo ao desmontar
  }, [removals]);


  const addRemoval = (removal: Removal) => {
    setRemovals(prev => [removal, ...prev]);
    addNotification(`Nova remoção solicitada "${removal.code}".`, { recipientRole: 'receptor' });
  };

  const updateRemoval = (code: string, updates: Partial<Removal>) => {
    let originalRemoval: Removal | undefined;
    setRemovals(prev =>
      prev.map(removal => {
        if (removal.code === code) {
          originalRemoval = removal;
          return { ...removal, ...updates };
        }
        return removal;
      })
    );
    
    // Disparar notificações com base na atualização
    if (originalRemoval && updates.status) {
      switch(updates.status) {
        case 'em_andamento':
          if (updates.assignedDriver) {
            addNotification(`Nova remoção encaminhada a você: ${code}.`, { recipientId: updates.assignedDriver.id });
          }
          break;
        case 'a_caminho':
          addNotification(`O motorista está a caminho da sua solicitação ${code}.`, { recipientId: originalRemoval.createdById });
          break;
        case 'concluida':
          addNotification(`Remoção ${code} está pronta para análise operacional.`, { recipientRole: 'operacional' });
          break;
        case 'aguardando_financeiro_junior':
          addNotification(`Remoção ${code} aguardando análise financeira.`, { recipientRole: 'financeiro_junior' });
          break;
      }
    }
  };

  const updateMultipleRemovals = (codes: string[], updates: Partial<Removal>, firstRemoval: Removal) => {
    setRemovals(prev =>
      prev.map(removal =>
        codes.includes(removal.code) ? { ...removal, ...updates } : removal
      )
    );

    // Notificações para faturamento
    if (updates.status) {
      switch(updates.status) {
        case 'aguardando_boleto':
          addNotification(`Boleto de faturamento mensal recebido.`, { recipientId: firstRemoval.createdById });
          break;
        case 'pagamento_concluido':
          addNotification(`Comprovante de pagamento da Clínica ${firstRemoval.clinicName} recebido.`, { recipientRole: 'financeiro_master' });
          break;
      }
    }
  };

  const getRemovalsByStatus = (status: RemovalStatus): Removal[] => {
    return removals.filter(removal => removal.status === status);
  };
  
  const getRemovalsByOwner = (ownerId: string): Removal[] => {
    return removals.filter(removal => removal.createdById === ownerId);
  };

  const value = {
    removals,
    addRemoval,
    updateRemoval,
    updateMultipleRemovals,
    getRemovalsByStatus,
    getRemovalsByOwner,
    generateRemovalCode,
  };

  return <RemovalContext.Provider value={value}>{children}</RemovalContext.Provider>;
};
