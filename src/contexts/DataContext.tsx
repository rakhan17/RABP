import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { subscribeToRegistrations, getRegistrationsFromFirestore, seedRegistrationsToFirestore } from '../lib/firestoreService';
import { getRegistrations as getRegistrationsFromSheets } from '../lib/sheets';
import type { Sp2dRegistration } from '../types';

interface DataContextType {
  data: Sp2dRegistration[]; // Filtered dataset based on user's bidang scoping
  allData: Sp2dRegistration[]; // Full unfiltered dataset (for Keuangan / admin)
  loading: boolean;
  errorMsg: string;
  refreshData: () => Promise<void>;
  seedInitialData: () => Promise<number>;
  isKeuangan: boolean;
  userBidang: string;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [allData, setAllData] = useState<Sp2dRegistration[]>([]);
  const [data, setData] = useState<Sp2dRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const isKeuangan = user?.username === 'Keuangan' || user?.bidang === 'Keuangan';
  const userBidang = user?.bidang || '';

  // 1. Filter dataset based on Bidang scoping whenever allData or user changes
  useEffect(() => {
    if (!allData || allData.length === 0) {
      setData([]);
      return;
    }

    if (isKeuangan || !userBidang) {
      // Keuangan account sees all data
      setData(allData);
    } else {
      // Other accounts only see data matching their assigned Bidang
      const userBidangNormalized = userBidang.toLowerCase().trim();
      const filtered = allData.filter((item) => {
        if (!item.bidang) return false;
        return item.bidang.toLowerCase().trim() === userBidangNormalized;
      });
      setData(filtered);
    }
  }, [allData, user, isKeuangan, userBidang]);

  // 2. Real-time Subscription to Firebase Firestore
  useEffect(() => {
    setLoading(true);
    setErrorMsg('');

    const unsubscribe = subscribeToRegistrations(
      (items) => {
        setAllData(items);
        setLoading(false);
        if (items.length === 0) {
          // If Firestore is empty, auto-seed from fallback / sheets once
          autoSeedIfEmpty();
        }
      },
      (error) => {
        console.error("Firestore subscription failed, falling back to one-time fetch:", error);
        refreshData();
      }
    );

    return () => unsubscribe();
  }, []);

  // One-time fallback fetch
  const refreshData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      let items = await getRegistrationsFromFirestore();
      if (items.length === 0) {
        items = await getRegistrationsFromSheets(true);
        if (items.length > 0) {
          await seedRegistrationsToFirestore(items);
        }
      }
      setAllData(items);
      if (items.length === 0) {
        setErrorMsg('Data kosong (0 rows).');
      }
    } catch (error: any) {
      console.error("Error refreshing data:", error);
      setErrorMsg(error?.message || String(error));
    } finally {
      setLoading(false);
    }
  };

  // Helper to auto-seed initial data from Google Sheets / fallback dataset into Firestore
  const autoSeedIfEmpty = async () => {
    try {
      const sheetsData = await getRegistrationsFromSheets(true);
      if (sheetsData && sheetsData.length > 0) {
        console.log(`Auto-seeding ${sheetsData.length} records from Google Sheets to Firebase Firestore...`);
        await seedRegistrationsToFirestore(sheetsData);
      }
    } catch (err) {
      console.warn("Auto-seed from Google Sheets skipped:", err);
    }
  };

  const seedInitialData = async (): Promise<number> => {
    setLoading(true);
    try {
      const sheetsData = await getRegistrationsFromSheets(true);
      if (sheetsData.length > 0) {
        await seedRegistrationsToFirestore(sheetsData);
        await refreshData();
        return sheetsData.length;
      }
      return 0;
    } catch (err) {
      console.error("Manual seed failed:", err);
      throw err;
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
        seedInitialData,
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
