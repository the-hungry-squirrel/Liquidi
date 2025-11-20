import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MainCategory, PrognoseData, Investment } from '../types/finance';

// Web-compatible storage wrapper
const Storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return AsyncStorage.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    return AsyncStorage.setItem(key, value);
  }
};

interface FinanceContextType {
  expenses: MainCategory;
  income: MainCategory;
  prognoseData: PrognoseData;
  updateExpenses: (expenses: MainCategory) => void;
  updateIncome: (income: MainCategory) => void;
  updatePrognoseData: (data: PrognoseData) => void;
  getTotalExpenses: () => number;
  getTotalIncome: () => number;
  getMonthlyInvestmentReturns: () => number;
  getSavingsRate: () => number;
  isLoading: boolean;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_KEY_EXPENSES = '@finance_expenses';
const STORAGE_KEY_INCOME = '@finance_income';
const STORAGE_KEY_PROGNOSE = '@finance_prognose';

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [expenses, setExpenses] = useState<MainCategory>({
    type: 'expense',
    categories: []
  });

  const [income, setIncome] = useState<MainCategory>({
    type: 'income',
    categories: []
  });

  const [prognoseData, setPrognoseData] = useState<PrognoseData>({
    currentAssets: 0,
    liquidAssets: 0,
    investments: [],
    inflationRate: 2,
    yearsToProject: 10
  });

  const [isLoading, setIsLoading] = useState(true);

  // Load data from AsyncStorage
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [expensesData, incomeData, prognoseDataStr] = await Promise.all([
        Storage.getItem(STORAGE_KEY_EXPENSES),
        Storage.getItem(STORAGE_KEY_INCOME),
        Storage.getItem(STORAGE_KEY_PROGNOSE)
      ]);

      if (expensesData) {
        setExpenses(JSON.parse(expensesData));
      }
      if (incomeData) {
        setIncome(JSON.parse(incomeData));
      }
      if (prognoseDataStr) {
        setPrognoseData(JSON.parse(prognoseDataStr));
      }
    } catch (error) {
      console.error('Error loading finance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateExpenses = async (newExpenses: MainCategory) => {
    setExpenses(newExpenses);
    try {
      await Storage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(newExpenses));
    } catch (error) {
      console.error('Error saving expenses:', error);
    }
  };

  const updateIncome = async (newIncome: MainCategory) => {
    setIncome(newIncome);
    try {
      await Storage.setItem(STORAGE_KEY_INCOME, JSON.stringify(newIncome));
    } catch (error) {
      console.error('Error saving income:', error);
    }
  };

  const updatePrognoseData = async (data: PrognoseData) => {
    setPrognoseData(data);
    try {
      await Storage.setItem(STORAGE_KEY_PROGNOSE, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving prognose data:', error);
    }
  };

  const calculateMonthlyTotal = (mainCategory: MainCategory): number => {
    return mainCategory.categories.reduce((sum, category) => {
      return sum + category.items.reduce((catSum, item) => {
        let monthlyAmount = item.amount;
        switch (item.frequency) {
          case 'w':
            monthlyAmount = item.amount * 4.33;
            break;
          case 'j':
            monthlyAmount = item.amount / 12;
            break;
          case '1x':
            monthlyAmount = 0; // Einmalige Ausgaben nicht in monatlichen Betrag einrechnen
            break;
        }
        return catSum + monthlyAmount;
      }, 0);
    }, 0);
  };

  const getTotalExpenses = () => calculateMonthlyTotal(expenses);
  const getTotalIncome = () => calculateMonthlyTotal(income);

  // Berechne monatliche Erträge aus nicht-reinvestierten Investments
  const getMonthlyInvestmentReturns = (): number => {
    return prognoseData.investments.reduce((sum, inv) => {
      // Nur nicht-reinvestierte Erträge zählen
      if (inv.reinvestEnabled !== false) {
        return sum; // reinvestEnabled ist true oder undefined (Standard: reinvestieren)
      }

      // Jährliche Rendite berechnen
      const annualReturn = inv.amount * (inv.annualReturn / 100);

      // Auf Monat umrechnen
      const monthlyReturn = annualReturn / 12;

      return sum + monthlyReturn;
    }, 0);
  };

  const getSavingsRate = (): number => {
    const totalIncome = getTotalIncome();
    const investmentReturns = getMonthlyInvestmentReturns();
    const totalExpenses = getTotalExpenses();

    // Gesamteinkommen = reguläres Einkommen + nicht-reinvestierte Erträge
    const totalIncomeWithReturns = totalIncome + investmentReturns;

    if (totalIncomeWithReturns === 0) return 0;

    const savings = totalIncomeWithReturns - totalExpenses;
    return (savings / totalIncomeWithReturns) * 100;
  };

  return (
    <FinanceContext.Provider
      value={{
        expenses,
        income,
        prognoseData,
        updateExpenses,
        updateIncome,
        updatePrognoseData,
        getTotalExpenses,
        getTotalIncome,
        getMonthlyInvestmentReturns,
        getSavingsRate,
        isLoading
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = (): FinanceContextType => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
