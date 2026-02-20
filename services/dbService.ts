
import { Transaction } from '../types';

const LOCAL_STORAGE_KEY = 'pos_history_lelekrispy';

/**
 * Senior Note: 
 * Connecting directly to MS SQL Server from a mobile webview is insecure and technically restricted.
 * The standard architecture is: Mobile (React/Flutter) -> API (Go) -> Database (SQL Server).
 * This service simulates the API call while keeping local persistence for the demo.
 */
export const saveTransaction = async (transaction: Transaction): Promise<boolean> => {
  try {
    // 1. Simulate API delay to Go Backend
    await new Promise(resolve => setTimeout(resolve, 800));

    // 2. Persist to local "database" (LocalStorage)
    const existingHistory = getHistory();
    const newHistory = [transaction, ...existingHistory];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newHistory));

    console.log('Transaction synced to simulated SQL Server:', transaction);
    return true;
  } catch (error) {
    console.error('Failed to save transaction:', error);
    return false;
  }
};

export const updateTransaction = async (updatedTrx: Transaction): Promise<boolean> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));
    const existingHistory = getHistory();
    const newHistory = existingHistory.map(trx => 
      trx.id === updatedTrx.id ? updatedTrx : trx
    );
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newHistory));
    return true;
  } catch (error) {
    console.error('Failed to update transaction:', error);
    return false;
  }
};

export const getHistory = (): Transaction[] => {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};
