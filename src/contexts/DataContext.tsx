import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { subscribeToRegistrations, getRegistrationsFromFirestore } from '../lib/firestoreService';
import type { Sp2dRegistration } from '../types';

interface DataContextType {
  data: Sp2dRegistration[]; // Filtered dataset based on user's bidang scoping
  allData: Sp2dRegistration[]; // Full unfiltered dataset (for Keuangan / admin)
  loading: boolean;
  errorMsg: string;
  refreshData: () => Promise<void>;
  isKeuangan: boolean;
  userBidang: string;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [allData, setAllData] = useState<Sp2dRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const isKeuangan = user?.username?.toLowerCase() === 'keuangan' || user?.bidang?.toLowerCase() === 'keuangan';
  const userBidang = user?.bidang || '';

  // 1. Filter dataset synchronously based on Bidang scoping
  const data = React.useMemo(() => {
    if (!allData || allData.length === 0) {
      return [];
    }
    if (isKeuangan || !userBidang) {
      // Keuangan account sees all data
      return allData;
    } else {
      // Other accounts only see data matching their assigned Bidang
      const userBidangNormalized = userBidang.toLowerCase().trim();
      return allData.filter((item) => {
        if (!item.bidang) return false;
        return item.bidang.toLowerCase().trim() === userBidangNormalized;
      });
    }
  }, [allData, isKeuangan, userBidang]);

  // 2. Real-time Subscription to Firebase Firestore
  useEffect(() => {
    setLoading(true);
    setErrorMsg('');

    const unsubscribe = subscribeToRegistrations(
      (items) => {
        setAllData(items);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore subscription error:", error);
        refreshData();
      }
    );

    return () => unsubscribe();
  }, []);

  // One-time fetch from Firestore
  const refreshData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const items = await getRegistrationsFromFirestore();
      setAllData(items);
      if (items.length === 0) {
        setErrorMsg('Data kosong (0 rows). Klik Tambah Data untuk mengisi.');
      }
    } catch (error: any) {
      console.error("Error refreshing data:", error);
      setErrorMsg(error?.message || String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DataContext.Provider
      value={{
        data,
        allData,
        loading,
        errorMsg,
        refreshData,
        isKeuangan,
        userBidang,
      }}
    >
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
