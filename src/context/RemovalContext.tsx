import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Removal, RemovalStatus, CremationBatch, CremationBatchItem } from '../types';
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
  cremationBatches: CremationBatch[];
  createCremationBatch: (items: CremationBatchItem[], operatorName: string) => void;
  startCremationBatch: (batchId: string, operatorName: string) => void;
  finishCremationBatch: (batchId: string, operatorName: string) => void;
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
  const [cremationBatches, setCremationBatches] = useState<CremationBatch[]>([]);
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

  const createCremationBatch = (items: CremationBatchItem[], operatorName: string) => {
    const newBatch: CremationBatch = {
      id: `LOTE-${new Date().getTime()}`,
      createdAt: new Date().toISOString(),
      items: items,
    };
    setCremationBatches(prev => [newBatch, ...prev]);

    const removalCodes = items.map(item => item.removalCode);
    const historyEntry = {
        date: new Date().toISOString(),
        action: `Adicionado ao lote de cremação ${newBatch.id} pelo operador ${operatorName.split(' ')[0]}`,
        user: operatorName,
    };

    setRemovals(prevRemovals => 
      prevRemovals.map(r => 
        removalCodes.includes(r.code) ? { ...r, status: 'em_lote_cremacao', history: [...r.history, historyEntry] } : r
      )
    );
    addNotification(`Novo lote de cremação ${newBatch.id} foi criado.`, { recipientRole: 'operacional' });
  };

  const startCremationBatch = (batchId: string, operatorName: string) => {
    let removalCodesToUpdate: string[] = [];
    setCremationBatches(prev => 
      prev.map(batch => {
        if (batch.id === batchId) {
            removalCodesToUpdate = batch.items.map(item => item.removalCode);
            return { ...batch, startedAt: new Date().toISOString() };
        }
        return batch;
      })
    );

    if (removalCodesToUpdate.length > 0) {
        const historyEntry = {
            date: new Date().toISOString(),
            action: `Cremação do lote ${batchId} iniciada pelo operador ${operatorName.split(' ')[0]}`,
            user: operatorName,
        };
        setRemovals(prevRemovals =>
            prevRemovals.map(r =>
                removalCodesToUpdate.includes(r.code) ? { ...r, history: [...r.history, historyEntry] } : r
            )
        );
    }
  };

  const finishCremationBatch = (batchId: string, operatorName: string) => {
    let removalCodesToUpdate: string[] = [];

    setCremationBatches(prevBatches => 
      prevBatches.map(batch => {
        if (batch.id === batchId) {
          removalCodesToUpdate = batch.items.map(item => item.removalCode);
          return { ...batch, finishedAt: new Date().toISOString() };
        }
        return batch;
      })
    );

    if (removalCodesToUpdate.length > 0) {
        const historyEntry = {
            date: new Date().toISOString(),
            action: `Pet cremado no lote ${batchId} pelo operador ${operatorName.split(' ')[0]}`,
            user: operatorName,
        };
        setRemovals(prevRemovals => 
          prevRemovals.map(r => 
            removalCodesToUpdate.includes(r.code) ? { ...r, status: 'cremado', history: [...r.history, historyEntry] } : r
          )
        );
    }
    addNotification(`O lote de cremação ${batchId} foi finalizado.`, { recipientRole: 'operacional' });
  };

  const value = {
    removals,
    addRemoval,
    updateRemoval,
    updateMultipleRemovals,
    getRemovalsByStatus,
    getRemovalsByOwner,
    generateRemovalCode,
    cremationBatches,
    createCremationBatch,
    startCremationBatch,
    finishCremationBatch,
  };

  return <RemovalContext.Provider value={value}>{children}</RemovalContext.Provider>;
};
