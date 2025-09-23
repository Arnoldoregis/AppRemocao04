import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Removal, FarewellSchedule } from '../types';

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

  const scheduleFarewell = (slotKey: string, removal: Removal) => {
    setSchedule(prev => ({
      ...prev,
      [slotKey]: removal,
    }));
  };

  const removeFarewell = (slotKey: string) => {
    setSchedule(prev => {
      const newSchedule = { ...prev };
      delete newSchedule[slotKey];
      return newSchedule;
    });
  };

  const value = {
    schedule,
    scheduleFarewell,
    removeFarewell,
  };

  return <AgendaContext.Provider value={value}>{children}</AgendaContext.Provider>;
};
