import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define types
export interface ModalityInfo {
    key: string;
    label: string;
    active: boolean;
}

export type PriceTable = Record<string, Record<string, number>>;

interface PricingContextType {
    priceTable: PriceTable;
    modalities: ModalityInfo[];
    updatePrice: (weightRange: string, modalityKey: string, newPrice: number) => void;
    toggleModalityStatus: (modalityKey: string) => void;
    addWeightRange: (range: string, prices: Record<string, number>) => void;
    removeWeightRange: (range: string) => void;
}

const PricingContext = createContext<PricingContextType | undefined>(undefined);

export const usePricing = () => {
    const context = useContext(PricingContext);
    if (!context) {
        throw new Error('usePricing must be used within a PricingProvider');
    }
    return context;
};

// Initial data from the old pricing file
const initialPriceTable: PriceTable = {
    '0-5kg': { coletivo: 207.00, individual_prata: 480.00, individual_ouro: 500.00 },
    '6-10kg': { coletivo: 230.00, individual_prata: 780.00, individual_ouro: 830.00 },
    '11-20kg': { coletivo: 255.00, individual_prata: 830.00, individual_ouro: 890.00 },
    '21-40kg': { coletivo: 285.00, individual_prata: 850.00, individual_ouro: 999.00 },
    '41-50kg': { coletivo: 330.00, individual_prata: 870.00, individual_ouro: 1060.00 },
    '51-60kg': { coletivo: 370.00, individual_prata: 890.00, individual_ouro: 1190.00 },
    '61-80kg': { coletivo: 400.00, individual_prata: 1070.00, individual_ouro: 1350.00 },
};

const initialModalities: ModalityInfo[] = [
    { key: 'coletivo', label: 'Coletivo', active: true },
    { key: 'individual_prata', label: 'Individual Prata', active: true },
    { key: 'individual_ouro', label: 'Individual Ouro', active: true },
];

export const PricingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [priceTable, setPriceTable] = useState<PriceTable>(initialPriceTable);
    const [modalities, setModalities] = useState<ModalityInfo[]>(initialModalities);

    const updatePrice = (weightRange: string, modalityKey: string, newPrice: number) => {
        setPriceTable(prev => ({
            ...prev,
            [weightRange]: {
                ...prev[weightRange],
                [modalityKey]: newPrice,
            },
        }));
    };

    const toggleModalityStatus = (modalityKey: string) => {
        setModalities(prev =>
            prev.map(mod =>
                mod.key === modalityKey ? { ...mod, active: !mod.active } : mod
            )
        );
    };

    const addWeightRange = (range: string, prices: Record<string, number>) => {
        setPriceTable(prev => ({
            ...prev,
            [range]: prices,
        }));
    };

    const removeWeightRange = (range: string) => {
        setPriceTable(prev => {
            const newTable = { ...prev };
            delete newTable[range];
            return newTable;
        });
    };

    const value = {
        priceTable,
        modalities,
        updatePrice,
        toggleModalityStatus,
        addWeightRange,
        removeWeightRange,
    };

    return <PricingContext.Provider value={value}>{children}</PricingContext.Provider>;
};
