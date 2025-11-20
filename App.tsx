import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import FinanceNavigator from './src/navigation/FinanceNavigator';
import { theme } from './src/theme/theme';
import { FinanceProvider } from './src/data/FinanceContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <FinanceProvider>
        <PaperProvider theme={theme}>
          <FinanceNavigator />
          <StatusBar style="auto" />
        </PaperProvider>
      </FinanceProvider>
    </SafeAreaProvider>
  );
}
