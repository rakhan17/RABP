import React, { createContext, useContext, useState, useEffect } from 'react';
import { getRegistrations } from '../lib/sheets';
import type { Sp2dRegistration } from '../types';

interface DataContextType {
  data: Sp2dRegistration[];
  loading: boolean;
  errorMsg: string;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Sp2dRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const refreshData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const result = await getRegistrations(true); // force refresh
      setData(result);
      if (result.length === 0) {
        setErrorMsg('Data kosong (0 rows).');
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      setErrorMsg(error?.message || String(error));
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    refreshData();
  }, []);

  return (
    <DataContext.Provider value={{ data, loading, errorMsg, refreshData }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
