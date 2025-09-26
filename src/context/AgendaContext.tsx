import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Removal, FarewellSchedule } from '../types';
import { useRemovals } from './RemovalContext';
import { useNotifications } from './NotificationContext';
import { parse, addMinutes, isAfter } from 'date-fns';

interface AgendaContextType {
  schedule: FarewellSchedule;
  scheduleFarewell: (slotKey: string, removal: Removal) => void;
  removeFarewell: (slotKey: string) => void;
}

const AgendaContext = createContext<AgendaContextType | undefined>(undefined);

export const useAgenda = () => {
  const context = useContext(AgendaContext);
  if (!context) {
    throw new Error('useAgenda must be used within an AgendaProvider');
  }
  return context;
};

export const AgendaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [schedule, setSchedule] = useState<FarewellSchedule>({});
  const { updateRemoval } = useRemovals();
  const { addNotification } = useNotifications();

  const scheduleFarewell = useCallback((slotKey: string, removal: Removal) => {
    setSchedule(prev => ({
      ...prev,
      [slotKey]: removal,
    }));
  }, []);

  const removeFarewell = useCallback((slotKey: string) => {
    setSchedule(prev => {
      const newSchedule = { ...prev };
      delete newSchedule[slotKey];
      return newSchedule;
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      
      // Use functional update to get the latest schedule state inside the interval
      setSchedule(currentSchedule => {
        let scheduleChanged = false;
        const nextSchedule = { ...currentSchedule };

        Object.entries(currentSchedule).forEach(([slotKey, removal]) => {
          // Example slotKey: "2025-09-23-14:00"
          const timePart = slotKey.split('-')[3];
          if (!timePart || timePart === 'ENCAIXE EMERGÊNCIA') {
            return; // Skip non-timed slots
          }

          try {
            const scheduledDateTime = parse(slotKey, 'yyyy-MM-dd-HH:mm', new Date());
            const releaseTime = addMinutes(scheduledDateTime, 30);

            if (isAfter(now, releaseTime)) {
              // Update removal status to move it back to Operacional's "Aguardando Liberação" tab
              updateRemoval(removal.code, {
                history: [
                  ...removal.history,
                  {
                    date: new Date().toISOString(),
                    action: 'Despedida finalizada. Retornado para a fila de liberação de cremação.',
                    user: 'Sistema',
                  },
                ],
              });

              // Notify the operational team
              addNotification(
                `Despedida da remoção ${removal.code} finalizada. Aguardando liberação para cremação.`,
                { recipientRole: 'operacional' }
              );
              
              // Prepare to remove from schedule
              delete nextSchedule[slotKey];
              scheduleChanged = true;
            }
          } catch (error) {
            console.error(`Error processing schedule slot ${slotKey}:`, error);
          }
        });

        // Only update state if something actually changed
        return scheduleChanged ? nextSchedule : currentSchedule;
      });
    }, 60 * 1000); // Check every minute

    return () => clearInterval(interval); // Cleanup on unmount
  }, [updateRemoval, addNotification]);

  const value = {
    schedule,
    scheduleFarewell,
    removeFarewell,
  };

  return <AgendaContext.Provider value={value}>{children}</AgendaContext.Provider>;
};
