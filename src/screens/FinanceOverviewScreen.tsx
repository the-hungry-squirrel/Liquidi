import React from 'react';
import { ScrollView, StyleSheet, View, Dimensions, useWindowDimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { useFinance } from '../data/FinanceContext';
import { MainCategoryBlock } from '../components/MainCategoryBlock';
import { AcornStack } from '../components/AcornStack';
import { financeColors } from '../theme/colors';

export const FinanceOverviewScreen: React.FC = () => {
  const {
    expenses,
    income,
    updateExpenses,
    updateIncome,
    getTotalExpenses,
    getTotalIncome,
    getMonthlyInvestmentReturns,
    getSavingsRate,
    isLoading
  } = useFinance();

  const { width } = useWindowDimensions();
  const isDesktop = width >= 768; // Desktop ab 768px Breite

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Lade Finanzdaten...</Text>
      </View>
    );
  }

  const totalExpenses = getTotalExpenses();
  const totalIncome = getTotalIncome();
  const investmentReturns = getMonthlyInvestmentReturns();
  const totalIncomeWithReturns = totalIncome + investmentReturns;
  const savingsRate = getSavingsRate();
  const monthlySavings = totalIncomeWithReturns - totalExpenses;

  // Calculate maximum number of acorns across all three sections for uniform scaling
  const maxAcorns = Math.max(
    Math.floor(totalIncomeWithReturns / 500),
    Math.floor(Math.abs(monthlySavings) / 500),
    Math.floor(totalExpenses / 500)
  );

  return (
    <View style={styles.container}>
      {/* Coin Visualization Header */}
      <View style={styles.coinHeader}>
        <View style={styles.coinRow}>
          {/* Income Coins */}
          <View style={styles.coinColumn}>
            <View style={styles.labelValueContainer}>
              <Text style={styles.coinLabel}>Einnahmen</Text>
              <Text style={[styles.coinValue, { color: financeColors.incomeDark }]}>
                {totalIncomeWithReturns.toFixed(2)} €
              </Text>
            </View>
            <AcornStack amount={totalIncomeWithReturns} maxAcorns={maxAcorns} />
          </View>

          {/* Savings Coins */}
          <View style={styles.coinColumn}>
            <View style={styles.labelValueContainer}>
              <Text style={styles.coinLabel}>Ersparnis</Text>
              <Text style={[
                styles.coinValue,
                { color: monthlySavings >= 0 ? financeColors.incomeDark : financeColors.expenseAccent }
              ]}>
                {monthlySavings.toFixed(2)} €
              </Text>
            </View>
            <AcornStack amount={monthlySavings} maxAcorns={maxAcorns} />
          </View>

          {/* Expense Coins */}
          <View style={styles.coinColumn}>
            <View style={styles.labelValueContainer}>
              <Text style={styles.coinLabel}>Ausgaben</Text>
              <Text style={[styles.coinValue, { color: financeColors.expenseAccent }]}>
                {totalExpenses.toFixed(2)} €
              </Text>
            </View>
            <AcornStack amount={totalExpenses} maxAcorns={maxAcorns} />
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {isDesktop ? (
          // Desktop Layout: Nebeneinander
          <View style={styles.desktopContainer}>
            <View style={styles.desktopColumn}>
              {/* Einnahmen Block */}
              <MainCategoryBlock
                mainCategory={income}
                onUpdate={updateIncome}
                investmentReturns={investmentReturns}
              />
            </View>
            <View style={styles.desktopColumn}>
              {/* Ausgaben Block */}
              <MainCategoryBlock
                mainCategory={expenses}
                onUpdate={updateExpenses}
              />
            </View>
          </View>
        ) : (
          // Mobile Layout: Untereinander
          <>
            {/* Einnahmen Block */}
            <MainCategoryBlock
              mainCategory={income}
              onUpdate={updateIncome}
              investmentReturns={investmentReturns}
            />

            {/* Ausgaben Block */}
            <MainCategoryBlock
              mainCategory={expenses}
              onUpdate={updateExpenses}
            />
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: financeColors.background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: financeColors.background
  },
  coinHeader: {
    backgroundColor: financeColors.surface,
    paddingVertical: 24,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderBottomWidth: 1,
    borderBottomColor: financeColors.border
  },
  coinRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end'
  },
  coinColumn: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8
  },
  labelValueContainer: {
    alignItems: 'center',
    marginBottom: 16
  },
  coinLabel: {
    fontSize: 13,
    color: financeColors.textSecondary,
    marginBottom: 2,
    fontWeight: '500'
  },
  coinValue: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  scrollView: {
    flex: 1
  },
  desktopContainer: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 16
  },
  desktopColumn: {
    flex: 1,
    minWidth: 0
  },
  bottomPadding: {
    height: 40
  }
});
