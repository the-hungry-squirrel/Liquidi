import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { financeColors } from '../theme/colors';

// Only import PrognoseScreen on web
let PrognoseScreen: any = null;
if (Platform.OS === 'web') {
  PrognoseScreen = require('./PrognoseScreen').PrognoseScreen;
}

export const PrognoseScreenWrapper: React.FC = () => {
  if (Platform.OS === 'web' && PrognoseScreen) {
    return <PrognoseScreen />;
  }

  // Mobile fallback
  return (
    <View style={styles.container}>
      <View style={styles.messageContainer}>
        <Text style={styles.title}>Prognose</Text>
        <Text style={styles.message}>
          Die Prognose-Funktion mit interaktiven Charts ist derzeit nur in der Web-Version verfügbar.
        </Text>
        <Text style={styles.hint}>
          Bitte öffne die App im Browser, um die vollständige Vermögensprognose mit Charts zu sehen.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: financeColors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  messageContainer: {
    backgroundColor: financeColors.surface,
    padding: 30,
    borderRadius: 12,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: financeColors.textPrimary,
    marginBottom: 16,
    textAlign: 'center'
  },
  message: {
    fontSize: 16,
    color: financeColors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 24
  },
  hint: {
    fontSize: 14,
    color: financeColors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic'
  }
});
