import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { financeColors } from '../theme/colors';
import { OakGrowth } from '../components/OakGrowth';

export const DonationScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Gesunde Eiche Stufe 2 */}
        <View style={styles.acornContainer}>
          <OakGrowth
            stage={2}
            isHealthy={true}
            width={300}
            height={300}
            showTooltip={false}
          />
        </View>

        {/* Haupt-Text */}
        <Text style={styles.mainText}>
          Spende 1 Euro um die Prognoseseite nutzen zu können!
        </Text>

        {/* Zusatz-Info */}
        <Text style={styles.subText}>
          Sobald 100 Euro Spenden eingegangen sind, pflanze ich eine Eiche für bedürftige Eichhörnchen auf dieser Welt.
        </Text>

        {/* Spenden-Button */}
        <TouchableOpacity style={styles.donateButton}>
          <Text style={styles.donateButtonText}>Spende jetzt 1 Euro</Text>
        </TouchableOpacity>

        {/* Hinweis */}
        <Text style={styles.noteText}>
          Dieser Button wird später mit PayPal verknüpft
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: financeColors.background
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    paddingTop: 60
  },
  acornContainer: {
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  mainText: {
    fontSize: 20,
    fontWeight: '600',
    color: financeColors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 24,
    lineHeight: 28
  },
  subText: {
    fontSize: 14,
    color: financeColors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 24,
    lineHeight: 22
  },
  donateButton: {
    backgroundColor: financeColors.incomeDark,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginBottom: 16
  },
  donateButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center'
  },
  noteText: {
    fontSize: 12,
    color: financeColors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8
  }
});
