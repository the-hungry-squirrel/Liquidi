import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Dimensions, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { useFinance } from '../data/FinanceContext';
import { DonutChart } from '../components/DonutChart';
import { AcornIcon } from '../components/AcornIcon';
import { financeColors } from '../theme/colors';

const screenWidth = Dimensions.get('window').width;

export const AnalysisScreen: React.FC = () => {
  const { expenses, income, getTotalExpenses, getTotalIncome, getSavingsRate, getMonthlyInvestmentReturns } = useFinance();
  const [highlightedCategory, setHighlightedCategory] = useState<string | null>(null);
  const [highlightedIncomeCategory, setHighlightedIncomeCategory] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const getSavingsRatingInfo = (rate: number) => {
    if (rate < 0) {
      return {
        category: 'Defizit',
        message: 'Denk dran, der Winter kommt!',
        color: financeColors.expenseAccent, // Pink/Magenta aus Palette
        range: '< 0%'
      };
    } else if (rate < 3) {
      return {
        category: 'Kritisch',
        message: 'Denk dran, der Winter kommt!',
        color: financeColors.expenseAccent, // Pink/Magenta
        range: '0-3%'
      };
    } else if (rate < 8) {
      return {
        category: 'Okay',
        message: 'Mühsam ernährt sich das Eichhörnchen',
        color: financeColors.accent, // Gelb-Orange aus Palette
        range: '3-8%'
      };
    } else if (rate < 15) {
      return {
        category: 'Gut',
        message: 'Du liegst im Durchschnitt',
        color: financeColors.incomeAccent, // Lila aus Palette
        range: '8-15%'
      };
    } else {
      return {
        category: 'Top',
        message: 'Überall sind Eicheln versteckt!',
        color: financeColors.incomeDark, // Türkis aus Palette
        range: '15%+'
      };
    }
  };

  const getPieChartData = () => {
    const categoryTotals = expenses.categories.map((category) => {
      const total = category.items.reduce((sum, item) => {
        let monthlyAmount = item.amount;
        switch (item.frequency) {
          case 'w':
            monthlyAmount = item.amount * 4.33;
            break;
          case 'j':
            monthlyAmount = item.amount / 12;
            break;
          case '1x':
            monthlyAmount = 0;
            break;
        }
        return sum + monthlyAmount;
      }, 0);

      return {
        name: category.name,
        amount: total,
        color: getRandomColor(category.name, false), // false = Ausgaben
        legendFontColor: '#333',
        legendFontSize: 12
      };
    })
    .filter(item => item.amount > 0)
    .sort((a, b) => b.amount - a.amount); // Sortiere nach Größe, größte zuerst

    return categoryTotals;
  };

  const getIncomeChartData = () => {
    const categoryTotals = income.categories.map((category) => {
      const total = category.items.reduce((sum, item) => {
        let monthlyAmount = item.amount;
        switch (item.frequency) {
          case 'w':
            monthlyAmount = item.amount * 4.33;
            break;
          case 'j':
            monthlyAmount = item.amount / 12;
            break;
          case '1x':
            monthlyAmount = 0;
            break;
        }
        return sum + monthlyAmount;
      }, 0);

      return {
        name: category.name,
        amount: total,
        color: getRandomColor(category.name, true), // true = Einnahmen
        legendFontColor: '#333',
        legendFontSize: 12
      };
    });

    // Add investment returns if available
    const investmentReturns = getMonthlyInvestmentReturns();
    if (investmentReturns > 0) {
      categoryTotals.push({
        name: 'Erträge aus Investitionen',
        amount: investmentReturns,
        color: getRandomColor('Erträge aus Investitionen', true),
        legendFontColor: '#333',
        legendFontSize: 12
      });
    }

    return categoryTotals
      .filter(item => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  };

  const getRandomColor = (seed: string, isIncome: boolean = false): string => {
    // Generate consistent color based on string seed with better distribution
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash; // Convert to 32bit integer
    }

    if (isIncome) {
      // Einnahmen: Obere Reihe (Grün → Türkis → Blau → Lila) - Mehr Variation
      const incomeColors = [
        '#C7F5E8',    // Helles Mint/Grün
        '#87D4C8',    // Türkis
        '#A3C8E8',    // Helles Blau
        '#9FD4E8',    // Blau-Türkis
        '#B8A3E8',    // Lila
        '#9FE7D2',    // Mittleres Türkis-Grün
        '#78C8B8',    // Dunkles Türkis
        '#C8E8D4',    // Helles Grün-Türkis
        '#D4C8F5',    // Helles Lila
        '#8FC8D8',    // Mittleres Blau-Türkis
        '#A8D8C8',    // Helles Blau-Grün
        '#B8C8E8'     // Helles Blau-Lila
      ];
      const index = Math.abs(hash) % incomeColors.length;
      return incomeColors[index];
    } else {
      // Ausgaben: Untere Reihe (Gelb → Orange → Pink) - Mehr Variation
      const expenseColors = [
        '#FFE8A3',    // Helles Gelb
        '#FFCF87',    // Warmes Orange-Gelb
        '#FFB5A3',    // Pfirsich-Koralle
        '#FFB8D4',    // Pink/Magenta
        '#FFD4A3',    // Helles Pfirsich
        '#FFA8C8',    // Mittleres Pink
        '#FFC878',    // Orange
        '#FFE0B8',    // Helles Orange-Beige
        '#FFCCE0',    // Helles Rosa
        '#FFD8B8',    // Helles Pfirsich-Beige
        '#FFA8B8',    // Rosa-Koralle
        '#FFE8C8'     // Sehr helles Beige-Orange
      ];
      const index = Math.abs(hash) % expenseColors.length;
      return expenseColors[index];
    }
  };

  const savingsRate = getSavingsRate();
  const ratingInfo = getSavingsRatingInfo(savingsRate);
  const pieData = getPieChartData();
  const incomeData = getIncomeChartData();
  const totalExpenses = getTotalExpenses();
  const investmentReturns = getMonthlyInvestmentReturns();
  const totalIncome = getTotalIncome() + investmentReturns;

  // Sparquoten-Card Content (nur Bewertung, keine Aufschlüsselung)
  const SavingsRateContent = () => {
    // Bestimme, ob kritisch (< 3%) - dann leere Eichel, sonst volle Eichel
    const isCritical = savingsRate < 3;

    return (
      <>
        <Text style={styles.cardTitle}>Sparquote</Text>
        <View style={styles.ratingContainerHorizontal}>
          <View style={styles.acornContainer}>
            <AcornIcon
              color={ratingInfo.color}
              size={180}
              isEmpty={isCritical}
            />
            <View style={styles.acornTextOverlay}>
              <Text style={styles.ratingPercentage}>{Math.round(savingsRate)}%</Text>
            </View>
          </View>
          <View style={styles.ratingTextContainer}>
            <Text style={[styles.ratingCategoryLarge, { color: ratingInfo.color }]}>
              {ratingInfo.category}! {ratingInfo.message}
            </Text>
          </View>
        </View>
      </>
    );
  };

  // Einnahmenverteilung Card Content (kleiner)
  const IncomeDistributionContent = () => (
    <>
      <Text style={styles.cardTitle}>Einnahmenverteilung</Text>

      {incomeData.length > 0 ? (
        <View style={styles.chartContainer}>
          <View style={styles.chartWrapper}>
            <DonutChart
              data={incomeData}
              size={280}
              onHover={(name) => setHighlightedIncomeCategory(name)}
              highlightedCategory={highlightedIncomeCategory}
            />
            <View style={styles.centerValue}>
              <Text style={styles.centerValueText}>{totalIncome.toFixed(0)} €</Text>
            </View>
          </View>

          {/* Kategorien-Liste mit Hover-Effekt */}
          <View style={styles.categoriesList}>
            {incomeData.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.categoryItem,
                  highlightedIncomeCategory === item.name && styles.categoryItemHighlighted
                ]}
                onMouseEnter={() => setHighlightedIncomeCategory(item.name)}
                onMouseLeave={() => setHighlightedIncomeCategory(null)}
              >
                <View style={[styles.categoryDot, { backgroundColor: item.color }]} />
                <Text style={[
                  styles.categoryName,
                  highlightedIncomeCategory === item.name && styles.categoryNameHighlighted
                ]}>
                  {item.name}
                </Text>
                <Text style={[
                  styles.categoryAmount,
                  highlightedIncomeCategory === item.name && styles.categoryAmountHighlighted
                ]}>
                  {item.amount.toFixed(2)} €
                </Text>
                <Text style={[
                  styles.categoryPercentage,
                  highlightedIncomeCategory === item.name && styles.categoryPercentageHighlighted
                ]}>
                  ({((item.amount / totalIncome) * 100).toFixed(1)}%)
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Keine Einnahmen vorhanden.
          </Text>
        </View>
      )}
    </>
  );

  // Ausgabenverteilung Card Content
  const ExpenseDistributionContent = () => (
    <>
      <Text style={styles.cardTitle}>Ausgabenverteilung</Text>

      {pieData.length > 0 ? (
        <View style={styles.chartContainer}>
          <View style={styles.chartWrapper}>
            <DonutChart
              data={pieData}
              size={280}
              onHover={(name) => setHighlightedCategory(name)}
              highlightedCategory={highlightedCategory}
            />
            <View style={styles.centerValue}>
              <Text style={styles.centerValueText}>{totalExpenses.toFixed(0)} €</Text>
            </View>
          </View>

          {/* Kategorien-Liste mit Hover-Effekt */}
          <View style={styles.categoriesList}>
            {pieData.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.categoryItem,
                  highlightedCategory === item.name && styles.categoryItemHighlighted
                ]}
                onMouseEnter={() => setHighlightedCategory(item.name)}
                onMouseLeave={() => setHighlightedCategory(null)}
              >
                <View style={[styles.categoryDot, { backgroundColor: item.color }]} />
                <Text style={[
                  styles.categoryName,
                  highlightedCategory === item.name && styles.categoryNameHighlighted
                ]}>
                  {item.name}
                </Text>
                <Text style={[
                  styles.categoryAmount,
                  highlightedCategory === item.name && styles.categoryAmountHighlighted
                ]}>
                  {item.amount.toFixed(2)} €
                </Text>
                <Text style={[
                  styles.categoryPercentage,
                  highlightedCategory === item.name && styles.categoryPercentageHighlighted
                ]}>
                  ({((item.amount / totalExpenses) * 100).toFixed(1)}%)
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Keine Ausgaben vorhanden. Fügen Sie Kategorien und Positionen hinzu.
          </Text>
        </View>
      )}
    </>
  );

  return (
    <ScrollView style={styles.container}>
      {isDesktop ? (
        // Desktop Layout: Oben zwei Verteilungen nebeneinander, unten Sparquote
        <>
          <View style={styles.desktopContainer}>
            <View style={styles.desktopColumn}>
              <Card style={styles.card}>
                <Card.Content>
                  <IncomeDistributionContent />
                </Card.Content>
              </Card>
            </View>
            <View style={styles.desktopColumn}>
              <Card style={styles.card}>
                <Card.Content>
                  <ExpenseDistributionContent />
                </Card.Content>
              </Card>
            </View>
          </View>
          <Card style={[styles.card, styles.savingsCard]}>
            <Card.Content>
              <SavingsRateContent />
            </Card.Content>
          </Card>
        </>
      ) : (
        // Mobile Layout: Untereinander
        <>
          <Card style={styles.card}>
            <Card.Content>
              <IncomeDistributionContent />
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <ExpenseDistributionContent />
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <SavingsRateContent />
            </Card.Content>
          </Card>
        </>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: financeColors.background
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
  card: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: financeColors.surface,
    elevation: 3,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: financeColors.textPrimary
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16
  },
  ratingContainerCentered: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24
  },
  ratingContainerHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 40
  },
  acornContainer: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  acornTextOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center'
  },
  ratingPercentage: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff'
  },
  ratingTextContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start'
  },
  ratingInfo: {
    flex: 1
  },
  ratingCategory: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4
  },
  ratingCategoryLarge: {
    fontSize: 48,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  ratingMessage: {
    fontSize: 18,
    color: financeColors.textSecondary,
    marginTop: 16,
    textAlign: 'center'
  },
  savingsCard: {
    marginHorizontal: 16
  },
  ratingRange: {
    fontSize: 14,
    color: financeColors.textSecondary,
    marginBottom: 8
  },
  ratingMessage: {
    fontSize: 14,
    color: financeColors.textPrimary,
    lineHeight: 20
  },
  legendContainer: {
    borderTopWidth: 1,
    borderTopColor: financeColors.border,
    paddingTop: 16
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8
  },
  legendText: {
    fontSize: 13,
    color: financeColors.textSecondary
  },
  totalText: {
    fontSize: 16,
    color: financeColors.textSecondary,
    marginBottom: 16,
    fontWeight: '600'
  },
  chartContainer: {
    alignItems: 'center'
  },
  chartWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center'
  },
  centerValue: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none'
  },
  centerValueText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: financeColors.textPrimary
  },
  categoriesList: {
    width: '100%',
    marginTop: 24
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: financeColors.divider,
    borderRadius: 4,
    transition: 'all 0.2s ease'
  },
  categoryItemHighlighted: {
    backgroundColor: financeColors.incomeLight,
    borderBottomColor: financeColors.incomeDark,
    transform: [{scale: 1.02}]
  },
  categoryDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12
  },
  categoryName: {
    flex: 1,
    fontSize: 14,
    color: financeColors.textPrimary,
    fontWeight: '500'
  },
  categoryNameHighlighted: {
    fontWeight: '700',
    color: financeColors.incomeDark
  },
  categoryAmount: {
    fontSize: 14,
    color: financeColors.textPrimary,
    fontWeight: '600',
    marginRight: 8
  },
  categoryAmountHighlighted: {
    fontWeight: '800',
    color: financeColors.incomeDark
  },
  categoryPercentage: {
    fontSize: 12,
    color: financeColors.textSecondary,
    minWidth: 50,
    textAlign: 'right'
  },
  categoryPercentageHighlighted: {
    fontWeight: '700',
    color: financeColors.incomeDark
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 14,
    color: financeColors.textTertiary,
    textAlign: 'center'
  },
  bottomPadding: {
    height: 40
  }
});
