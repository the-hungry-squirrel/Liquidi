import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, StyleSheet, View, TextInput, TouchableOpacity, Dimensions, useWindowDimensions } from 'react-native';
import { Text, Card, Menu } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import Svg, { Path } from 'react-native-svg';
import { useFinance } from '../data/FinanceContext';
import { Investment, Frequency } from '../types/finance';
import { investmentTemplates } from '../data/financeTemplates';
import { financeColors } from '../theme/colors';

const frequencyLabels: Record<Frequency, string> = {
  '1x': 'Einmalig',
  'w': 'Wöchentlich',
  'm': 'Monatlich',
  'j': 'Jährlich'
};

const investmentTypes = [
  { name: 'Tagesgeld / Zinsen', defaultRate: 2.0 },
  { name: 'Festgeld / Zinsen', defaultRate: 3.0 },
  { name: 'Aktien', defaultRate: 7.0 },
  { name: 'ETF', defaultRate: 7.0 },
  { name: 'Anleihen', defaultRate: 4.0 },
  { name: 'Crypto', defaultRate: 10.0 }
];

const screenWidth = Dimensions.get('window').width;

export const PrognoseScreen: React.FC = () => {
  const {
    prognoseData,
    updatePrognoseData,
    getTotalIncome,
    getTotalExpenses,
    getMonthlyInvestmentReturns
  } = useFinance();

  const [editingField, setEditingField] = useState<string | null>(null);
  const [reinvestmentEnabled, setReinvestmentEnabled] = useState<{ [id: string]: boolean }>({});
  const [frequencyMenuVisible, setFrequencyMenuVisible] = useState<{ [id: string]: boolean }>({});
  const [nameMenuVisible, setNameMenuVisible] = useState<{ [id: string]: boolean }>({});
  const [validationErrors, setValidationErrors] = useState<{ [id: string]: string }>({});
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Initialisiere reinvestmentEnabled aus prognoseData beim Laden
  useEffect(() => {
    const initialReinvestment: { [id: string]: boolean } = {};
    prognoseData.investments.forEach(inv => {
      initialReinvestment[inv.id] = inv.reinvestEnabled ?? true; // Default: true (reinvestieren)
    });
    setReinvestmentEnabled(initialReinvestment);
  }, []); // Nur beim ersten Laden

  // Toggle reinvestment for an investment
  const toggleReinvestment = (id: string) => {
    const newValue = !reinvestmentEnabled[id];

    setReinvestmentEnabled(prev => ({
      ...prev,
      [id]: newValue
    }));

    // Auch in prognoseData speichern
    updatePrognoseData({
      ...prognoseData,
      investments: prognoseData.investments.map(inv =>
        inv.id === id ? { ...inv, reinvestEnabled: newValue } : inv
      )
    });
  };

  const investmentReturns = getMonthlyInvestmentReturns();
  const monthlySavings = getTotalIncome() + investmentReturns - getTotalExpenses();
  const annualSavings = monthlySavings * 12;

  // Berechne das tatsächlich verfügbare liquide Vermögen
  const calculateAvailableLiquid = (): number => {
    // Startvermögen (Extravermögen + currentAssets)
    const startingLiquid = prognoseData.currentAssets + prognoseData.liquidAssets;

    // Abzug: Alle bereits getätigten Investments (einmalige)
    const oneTimeInvestments = prognoseData.investments
      .filter(inv => inv.frequency === '1x')
      .reduce((sum, inv) => sum + inv.amount, 0);

    return startingLiquid - oneTimeInvestments;
  };

  // Berechne wie viel monatlich bereits in Sparpläne investiert wird
  const calculateMonthlyInvestments = (): number => {
    return prognoseData.investments.reduce((sum, inv) => {
      let monthlyAmount = 0;
      switch (inv.frequency) {
        case 'm':
          monthlyAmount = inv.amount;
          break;
        case 'w':
          monthlyAmount = inv.amount * 4.33;
          break;
        case 'j':
          monthlyAmount = inv.amount / 12;
          break;
        case '1x':
          monthlyAmount = 0;
          break;
      }
      return sum + monthlyAmount;
    }, 0);
  };

  const availableLiquid = calculateAvailableLiquid();
  const monthlyInvestments = calculateMonthlyInvestments();
  const availableMonthly = monthlySavings - monthlyInvestments;

  // Validierung: Prüfe ob Investment möglich ist
  const validateInvestment = (investment: Investment, newAmount: number): { valid: boolean; message?: string } => {
    if (investment.frequency === '1x') {
      // Einmalige Investments: Prüfe gegen verfügbares liquides Vermögen
      const otherOneTimeInvestments = prognoseData.investments
        .filter(inv => inv.frequency === '1x' && inv.id !== investment.id)
        .reduce((sum, inv) => sum + inv.amount, 0);

      const maxPossible = availableLiquid - otherOneTimeInvestments;

      if (newAmount > maxPossible) {
        return {
          valid: false,
          message: `Nicht genug liquides Vermögen! Verfügbar: ${maxPossible.toFixed(2)} €`
        };
      }
    } else {
      // Wiederkehrende Investments: Prüfe gegen monatlichen Überschuss
      let monthlyAmount = newAmount;
      if (investment.frequency === 'w') monthlyAmount = newAmount * 4.33;
      if (investment.frequency === 'j') monthlyAmount = newAmount / 12;

      const otherMonthlyInvestments = prognoseData.investments
        .filter(inv => inv.id !== investment.id)
        .reduce((sum, inv) => {
          if (inv.frequency === '1x') return sum;
          let amt = inv.amount;
          if (inv.frequency === 'w') amt *= 4.33;
          if (inv.frequency === 'j') amt /= 12;
          return sum + amt;
        }, 0);

      const maxPossibleMonthly = monthlySavings - otherMonthlyInvestments;

      if (monthlyAmount > maxPossibleMonthly) {
        return {
          valid: false,
          message: `Nicht genug monatlicher Überschuss! Verfügbar: ${maxPossibleMonthly.toFixed(2)} €/Monat`
        };
      }
    }

    return { valid: true };
  };

  const handleAddInvestment = () => {
    const newInvestment: Investment = {
      id: Date.now().toString(),
      name: 'Tagesgeld / Zinsen', // Default
      amount: 0,
      annualReturn: 2.0, // Default rate
      frequency: 'm' // Default to monthly
    };

    updatePrognoseData({
      ...prognoseData,
      investments: [...prognoseData.investments, newInvestment]
    });
  };

  const handleUpdateInvestment = (id: string, field: 'amount' | 'annualReturn', value: number) => {
    // Nur bei Amount-Änderungen validieren
    if (field === 'amount') {
      const investment = prognoseData.investments.find(inv => inv.id === id);
      if (investment) {
        const validation = validateInvestment(investment, value);

        if (!validation.valid && validation.message) {
          // Fehler anzeigen
          setValidationErrors(prev => ({ ...prev, [id]: validation.message! }));
          // Trotzdem Update erlauben, aber Fehler anzeigen
        } else {
          // Fehler löschen wenn valid
          setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[id];
            return newErrors;
          });
        }
      }
    }

    updatePrognoseData({
      ...prognoseData,
      investments: prognoseData.investments.map((inv) =>
        inv.id === id ? { ...inv, [field]: value } : inv
      )
    });
  };

  const handleUpdateInvestmentName = (id: string, name: string, defaultRate?: number) => {
    updatePrognoseData({
      ...prognoseData,
      investments: prognoseData.investments.map((inv) =>
        inv.id === id ? { ...inv, name, annualReturn: defaultRate !== undefined ? defaultRate : inv.annualReturn } : inv
      )
    });
    setNameMenuVisible(prev => ({ ...prev, [id]: false }));
  };

  const handleUpdateFrequency = (id: string, frequency: Frequency) => {
    // Nach Frequency-Änderung neu validieren
    const investment = prognoseData.investments.find(inv => inv.id === id);
    if (investment) {
      const updatedInvestment = { ...investment, frequency };
      const validation = validateInvestment(updatedInvestment, investment.amount);

      if (!validation.valid && validation.message) {
        setValidationErrors(prev => ({ ...prev, [id]: validation.message! }));
      } else {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[id];
          return newErrors;
        });
      }
    }

    updatePrognoseData({
      ...prognoseData,
      investments: prognoseData.investments.map((inv) =>
        inv.id === id ? { ...inv, frequency } : inv
      )
    });
    setFrequencyMenuVisible(prev => ({ ...prev, [id]: false }));
  };

  const handleDeleteInvestment = (id: string) => {
    // Remove investment and its reinvestment state
    const newReinvestment = { ...reinvestmentEnabled };
    delete newReinvestment[id];
    setReinvestmentEnabled(newReinvestment);

    updatePrognoseData({
      ...prognoseData,
      investments: prognoseData.investments.filter((inv) => inv.id !== id)
    });
  };

  const calculateAnnualReturn = (investment: Investment): number => {
    return investment.amount * (investment.annualReturn / 100);
  };

  // Calculate returns for Year 1 and over the full prognosis period
  const calculateReturns = () => {
    // Year 1 calculation (current state)
    let year1NominalReturn = 0;
    prognoseData.investments.forEach(inv => {
      year1NominalReturn += calculateAnnualReturn(inv);
    });

    // Inflation loss only on liquid assets (not on investments, as returns compensate)
    const year1InflationLoss = prognoseData.liquidAssets * (prognoseData.inflationRate / 100);
    const year1RealReturn = year1NominalReturn - year1InflationLoss;

    // Full period calculation (with reinvestment and recurring contributions)
    let currentLiquid = prognoseData.liquidAssets;
    const investmentAmounts: { [id: string]: number } = {};
    prognoseData.investments.forEach(inv => {
      // Für einmalige Investments: voller Betrag am Anfang
      // Für wiederkehrende: 0 am Anfang (wird jährlich eingezahlt)
      investmentAmounts[inv.id] = inv.frequency === '1x' ? inv.amount : 0;
    });

    let totalNominalReturnSum = 0;
    let totalInflationLossSum = 0;

    for (let year = 1; year <= prognoseData.yearsToProject; year++) {
      // Add annual savings to liquid assets
      currentLiquid += annualSavings;

      // Add recurring investment contributions
      prognoseData.investments.forEach(inv => {
        if (inv.frequency !== '1x') {
          let yearlyContribution = 0;
          switch (inv.frequency) {
            case 'm': yearlyContribution = inv.amount * 12; break;
            case 'w': yearlyContribution = inv.amount * 52; break;
            case 'j': yearlyContribution = inv.amount; break;
          }
          investmentAmounts[inv.id] += yearlyContribution;
          currentLiquid -= yearlyContribution;
        }
      });

      // Calculate returns for this year
      let yearlyNominalReturn = 0;
      const returns: { [id: string]: number } = {};

      prognoseData.investments.forEach((inv) => {
        const currentAmount = investmentAmounts[inv.id];
        const yearlyReturn = currentAmount * (inv.annualReturn / 100);
        returns[inv.id] = yearlyReturn;
        yearlyNominalReturn += yearlyReturn;

        // Apply return to investment
        investmentAmounts[inv.id] = currentAmount + yearlyReturn;
      });

      // Handle reinvestment based on toggle state
      prognoseData.investments.forEach(inv => {
        const returnAmount = returns[inv.id];
        if (!returnAmount) return;

        if (reinvestmentEnabled[inv.id]) {
          // Reinvest: return stays in investment (compound interest)
          // No action needed
        } else {
          // Don't reinvest: move to liquid
          investmentAmounts[inv.id] -= returnAmount;
          currentLiquid += returnAmount;
        }
      });

      // Calculate inflation loss only on liquid assets (investments already compensate via returns)
      const yearlyInflationLoss = currentLiquid * (prognoseData.inflationRate / 100);

      // Apply inflation only to liquid assets
      currentLiquid *= (1 - prognoseData.inflationRate / 100);

      totalNominalReturnSum += yearlyNominalReturn;
      totalInflationLossSum += yearlyInflationLoss;
    }

    // Total over full period
    const totalPeriodNominalReturn = totalNominalReturnSum;
    const totalPeriodInflationLoss = totalInflationLossSum;
    const totalPeriodRealReturn = totalPeriodNominalReturn - totalPeriodInflationLoss;

    return {
      year1: {
        nominalReturn: year1NominalReturn,
        inflationLoss: year1InflationLoss,
        realReturn: year1RealReturn
      },
      fullPeriod: {
        nominalReturn: totalPeriodNominalReturn,
        inflationLoss: totalPeriodInflationLoss,
        realReturn: totalPeriodRealReturn
      }
    };
  };

  const returns = calculateReturns();

  // Determine color for real return (red to green)
  const getRealReturnColor = (value: number): string => {
    if (value < -1000) return financeColors.expenseAccent; // Pink/Magenta
    if (value < 0) return financeColors.expenseMedium; // Orange
    if (value < 500) return financeColors.accent; // Yellow
    if (value < 2000) return financeColors.incomeLight; // Light green
    return financeColors.incomeDark; // Turquoise/dark green
  };


  const calculatePrognose = () => {
    const years: number[] = [];
    const liquidValues: number[] = [];
    const investmentValues: number[] = [];

    let currentLiquid = prognoseData.liquidAssets;

    // Track each investment separately with reinvestment logic
    const investmentAmounts: { [id: string]: number } = {};
    prognoseData.investments.forEach(inv => {
      // Für einmalige Investments: voller Betrag am Anfang
      // Für wiederkehrende: 0 am Anfang (wird monatlich/jährlich eingezahlt)
      investmentAmounts[inv.id] = inv.frequency === '1x' ? inv.amount : 0;
    });

    // Jahr 0 (aktuell)
    years.push(0);
    liquidValues.push(currentLiquid);
    investmentValues.push(Object.values(investmentAmounts).reduce((sum, val) => sum + val, 0));

    // Berechnung für zukünftige Jahre
    for (let year = 1; year <= prognoseData.yearsToProject; year++) {
      // Add annual savings to liquid assets
      currentLiquid += annualSavings;

      // Add recurring investment contributions
      prognoseData.investments.forEach(inv => {
        if (inv.frequency !== '1x') {
          let yearlyContribution = 0;
          switch (inv.frequency) {
            case 'm': // Monatlich
              yearlyContribution = inv.amount * 12;
              break;
            case 'w': // Wöchentlich
              yearlyContribution = inv.amount * 52;
              break;
            case 'j': // Jährlich
              yearlyContribution = inv.amount;
              break;
          }
          investmentAmounts[inv.id] += yearlyContribution;
          currentLiquid -= yearlyContribution;
        }
      });

      // Calculate returns for each investment
      const returns: { [id: string]: number } = {};
      prognoseData.investments.forEach((inv) => {
        const currentAmount = investmentAmounts[inv.id];
        const yearlyReturn = currentAmount * (inv.annualReturn / 100);
        returns[inv.id] = yearlyReturn;

        // Apply return to investment (will be adjusted if reinvested elsewhere)
        investmentAmounts[inv.id] = currentAmount + yearlyReturn;
      });

      // Handle reinvestment based on toggle state
      prognoseData.investments.forEach(inv => {
        const returnAmount = returns[inv.id];
        if (!returnAmount) return;

        if (reinvestmentEnabled[inv.id]) {
          // Reinvest: return stays in the investment (already added above)
          // No action needed - compound interest automatic
        } else {
          // Don't reinvest: move return to liquid assets
          investmentAmounts[inv.id] -= returnAmount;
          currentLiquid += returnAmount;
        }
      });

      // Apply inflation to liquid assets only
      currentLiquid *= (1 - prognoseData.inflationRate / 100);

      years.push(year);
      liquidValues.push(currentLiquid);
      investmentValues.push(Object.values(investmentAmounts).reduce((sum, val) => sum + val, 0));
    }

    return { years, liquidValues, investmentValues };
  };

  const { years, liquidValues, investmentValues } = calculatePrognose();

  // Calculate total wealth (liquid + invested)
  const totalValues = liquidValues.map((liquid, index) => liquid + investmentValues[index]);

  const chartData = {
    labels: years.map((y) => y.toString()),
    datasets: [
      {
        data: totalValues,
        color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`, // Indigo for total
        strokeWidth: 3
      },
      {
        data: liquidValues,
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // Blue for liquid
        strokeWidth: 2
      },
      {
        data: investmentValues,
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`, // Green for invested
        strokeWidth: 2
      }
    ],
    legend: ['Gesamtvermögen', 'Flüssiges Vermögen', 'Investiertes Vermögen']
  };

  return (
    <ScrollView style={styles.container}>
      {isDesktop ? (
        <View style={styles.desktopContainer}>
          {/* Left Column: Vermögensprognose Chart */}
          <View style={styles.desktopLeftColumn}>
            {/* Prognosezeitraum und Inflation Card */}
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.prognoseInputRow}>
                  <View style={styles.prognoseInputBlock}>
                    <Text style={styles.prognoseInputLabel}>Prognosezeitraum:</Text>
                    {editingField === 'years' ? (
                      <TextInput
                        style={styles.prognoseInput}
                        value={prognoseData.yearsToProject.toString()}
                        onChangeText={(text) =>
                          updatePrognoseData({
                            ...prognoseData,
                            yearsToProject: parseInt(text) || 10
                          })
                        }
                        onBlur={() => setEditingField(null)}
                        keyboardType="number-pad"
                        autoFocus
                      />
                    ) : (
                      <TouchableOpacity onPress={() => setEditingField('years')}>
                        <Text style={styles.prognoseInputValue}>{prognoseData.yearsToProject} Jahre</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.prognoseInputBlock}>
                    <Text style={styles.prognoseInputLabel}>Inflationsrate / Jahr:</Text>
                    {editingField === 'inflation' ? (
                      <TextInput
                        style={styles.prognoseInput}
                        value={prognoseData.inflationRate.toString()}
                        onChangeText={(text) => {
                          const cleanText = text.replace(',', '.');
                          const value = parseFloat(cleanText);
                          updatePrognoseData({
                            ...prognoseData,
                            inflationRate: isNaN(value) ? 0 : value
                          });
                        }}
                        onBlur={() => setEditingField(null)}
                        keyboardType="decimal-pad"
                        autoFocus
                      />
                    ) : (
                      <TouchableOpacity onPress={() => setEditingField('inflation')}>
                        <Text style={styles.prognoseInputValue}>{prognoseData.inflationRate.toFixed(1)} %</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* Vermögensprognose Chart */}
            <Card style={[styles.card, styles.squareCard]}>
              <Card.Content>
                <Text style={styles.cardTitle}>Vermögensprognose</Text>

                <View style={styles.overviewRow}>
                  <Text style={styles.overviewLabel}>Jährliche Ersparnis:</Text>
                  <Text style={[
                    styles.overviewValue,
                    { color: annualSavings >= 0 ? financeColors.incomeDark : financeColors.expenseAccent }
                  ]}>
                    {Math.round(annualSavings)} €
                  </Text>
                </View>

                <View style={styles.overviewRow}>
                  <Text style={styles.overviewLabel}>Aktuelles Vermögen:</Text>
                  <Text style={styles.overviewValue}>
                    {Math.round(prognoseData.liquidAssets +
                      prognoseData.investments.reduce((sum, inv) => sum + inv.amount, 0)
                    )} €
                  </Text>
                </View>

                <View style={styles.overviewRow}>
                  <Text style={styles.overviewLabel}>Vermögen in {prognoseData.yearsToProject} Jahren:</Text>
                  <Text style={styles.overviewValue}>
                    {Math.round(liquidValues[liquidValues.length - 1] +
                      investmentValues[investmentValues.length - 1]
                    )} €
                  </Text>
                </View>

                <LineChart
                  data={chartData}
                  width={Math.min(screenWidth / 2 - 40, 500)}
                  height={300}
                  chartConfig={{
                    backgroundColor: '#fff',
                    backgroundGradientFrom: '#fff',
                    backgroundGradientTo: '#fff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: {
                      borderRadius: 16
                    },
                    propsForDots: {
                      r: '4',
                      strokeWidth: '2'
                    },
                    propsForBackgroundLines: {
                      strokeDasharray: ''
                    },
                    propsForLabels: {
                      fontFamily: 'System',
                      fontSize: 12
                    }
                  }}
                  bezier
                  style={styles.chart}
                />
              </Card.Content>
            </Card>
          </View>

          {/* Right Column: Flüssiges + Investiertes Vermögen */}
          <View style={styles.desktopRightColumn}>
            {/* Spacer to push content to bottom */}
            <View style={{ flex: 1 }} />

            {/* Flüssiges Vermögen */}
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Flüssiges Vermögen</Text>

                <View style={styles.inputBlock}>
                  <Text style={styles.inputLabel}>Gesamtes Startkapital:</Text>
                  {editingField === 'liquid' ? (
                    <TextInput
                      style={styles.input}
                      value={prognoseData.liquidAssets.toString()}
                      onChangeText={(text) =>
                        updatePrognoseData({
                          ...prognoseData,
                          liquidAssets: parseFloat(text) || 0
                        })
                      }
                      onBlur={() => setEditingField(null)}
                      keyboardType="decimal-pad"
                      autoFocus
                    />
                  ) : (
                    <TouchableOpacity onPress={() => setEditingField('liquid')}>
                      <Text style={styles.inputValue}>{Math.round(prognoseData.liquidAssets)} €</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.liquidInfoRow}>
                  <Text style={styles.liquidInfoLabel}>Aktuell verfügbar (nach Investments):</Text>
                  <Text style={[
                    styles.liquidInfoValue,
                    { color: availableLiquid >= 0 ? financeColors.incomeDark : financeColors.expenseAccent }
                  ]}>
                    {Math.round(availableLiquid)} €
                  </Text>
                </View>

                <View style={styles.liquidInfoRow}>
                  <Text style={styles.liquidInfoLabel}>Monatlicher Zuwachs aus Einkommen:</Text>
                  <Text style={[
                    styles.liquidInfoValue,
                    { color: monthlySavings >= 0 ? financeColors.incomeDark : financeColors.expenseAccent }
                  ]}>
                    {monthlySavings >= 0 ? '+' : ''}{Math.round(monthlySavings)} € / Monat
                  </Text>
                </View>

                <View style={styles.liquidInfoRow}>
                  <Text style={styles.liquidInfoLabel}>Verfügbar für einmalige Investments:</Text>
                  <Text style={[
                    styles.liquidInfoValue,
                    { color: availableLiquid >= 0 ? financeColors.incomeDark : financeColors.expenseAccent }
                  ]}>
                    {Math.round(availableLiquid)} €
                  </Text>
                </View>

                <View style={styles.liquidInfoRow}>
                  <Text style={styles.liquidInfoLabel}>Verfügbar für monatliche Sparpläne:</Text>
                  <Text style={[
                    styles.liquidInfoValue,
                    { color: availableMonthly >= 0 ? financeColors.incomeDark : financeColors.expenseAccent }
                  ]}>
                    {Math.round(availableMonthly)} € / Monat
                  </Text>
                </View>
              </Card.Content>
            </Card>

            {/* Investiertes Vermögen */}
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Investiertes Vermögen</Text>
                  <TouchableOpacity
                    style={styles.addInvestmentButtonSmall}
                    onPress={handleAddInvestment}
                  >
                    <Text style={styles.addInvestmentButtonTextSmall}>+</Text>
                  </TouchableOpacity>
                </View>

                {prognoseData.investments.length > 0 && (
                  <View style={styles.investmentGrid}>
                    {prognoseData.investments.map((investment, index) => {
                      const annualReturn = calculateAnnualReturn(investment);
                      const isReinvesting = reinvestmentEnabled[investment.id] || false;

                      return (
                        <View
                          key={investment.id}
                          style={styles.investmentCard}
                        >
                          {/* Simple card content */}
                          <View style={styles.cardInner}>
                            <View style={styles.investmentHeader}>
                              <Menu
                                visible={nameMenuVisible[investment.id] || false}
                                onDismiss={() => setNameMenuVisible(prev => ({ ...prev, [investment.id]: false }))}
                                anchor={
                                  <TouchableOpacity
                                    style={styles.investmentNameButton}
                                    onPress={() => setNameMenuVisible(prev => ({ ...prev, [investment.id]: true }))}
                                  >
                                    <Text style={styles.investmentName}>{investment.name}</Text>
                                    <Text style={styles.dropdownIcon}>▼</Text>
                                  </TouchableOpacity>
                                }
                              >
                                {investmentTypes.map((type, index) => (
                                  <Menu.Item
                                    key={index}
                                    onPress={() => {
                                      handleUpdateInvestmentName(investment.id, type.name, type.defaultRate);
                                    }}
                                    title={type.name}
                                  />
                                ))}
                              </Menu>
                              <TouchableOpacity onPress={() => handleDeleteInvestment(investment.id)}>
                                <Text style={styles.deleteText}>×</Text>
                              </TouchableOpacity>
                            </View>

                            <View style={styles.investmentInputs}>
                              <View style={styles.investmentInputBlock}>
                                <Text style={styles.investmentInputLabel}>Betrag:</Text>
                                {editingField === `amount-${investment.id}` ? (
                                  <TextInput
                                    style={styles.investmentInput}
                                    value={investment.amount.toString()}
                                    onChangeText={(text) =>
                                      handleUpdateInvestment(investment.id, 'amount', parseFloat(text) || 0)
                                    }
                                    onBlur={() => setEditingField(null)}
                                    keyboardType="decimal-pad"
                                    autoFocus
                                  />
                                ) : (
                                  <TouchableOpacity onPress={() => setEditingField(`amount-${investment.id}`)}>
                                    <Text style={styles.investmentInputValue}>
                                      {Math.round(investment.amount)} €
                                    </Text>
                                  </TouchableOpacity>
                                )}
                              </View>

                              <View style={styles.investmentInputBlock}>
                                <Text style={styles.investmentInputLabel}>Rendite/Jahr:</Text>
                                {editingField === `return-${investment.id}` ? (
                                  <TextInput
                                    style={styles.investmentInput}
                                    value={investment.annualReturn.toString()}
                                    onChangeText={(text) =>
                                      handleUpdateInvestment(investment.id, 'annualReturn', parseFloat(text) || 0)
                                    }
                                    onBlur={() => setEditingField(null)}
                                    keyboardType="decimal-pad"
                                    autoFocus
                                  />
                                ) : (
                                  <TouchableOpacity onPress={() => setEditingField(`return-${investment.id}`)}>
                                    <Text style={styles.investmentInputValue}>
                                      {investment.annualReturn.toFixed(1)} %
                                    </Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            </View>

                            {/* Frequency Selector */}
                            <View style={styles.frequencyRow}>
                              <Text style={styles.frequencyRowLabel}>Einzahlung:</Text>
                              <Menu
                                visible={frequencyMenuVisible[investment.id] || false}
                                onDismiss={() => setFrequencyMenuVisible(prev => ({ ...prev, [investment.id]: false }))}
                                anchor={
                                  <TouchableOpacity
                                    style={styles.frequencyButton}
                                    onPress={() => setFrequencyMenuVisible(prev => ({ ...prev, [investment.id]: true }))}
                                  >
                                    <Text style={styles.frequencyButtonText}>
                                      {investment.frequency} - {frequencyLabels[investment.frequency]}
                                    </Text>
                                  </TouchableOpacity>
                                }
                              >
                                {(['1x', 'w', 'm', 'j'] as Frequency[]).map((freq) => (
                                  <Menu.Item
                                    key={freq}
                                    onPress={() => handleUpdateFrequency(investment.id, freq)}
                                    title={`${freq} - ${frequencyLabels[freq]}`}
                                  />
                                ))}
                              </Menu>
                            </View>

                            {/* Erträge mit Reinvestment Toggle */}
                            <View style={styles.returnRowWithToggle}>
                              <View style={styles.returnInfo}>
                                <Text style={styles.returnLabel}>Erträge / Jahr:</Text>
                                <Text style={styles.returnValue}>
                                  {Math.round(annualReturn)} €
                                </Text>
                              </View>

                              {/* Stylischer Toggle-Switch */}
                              <View style={styles.toggleContainer}>
                                <Text style={styles.toggleLabel}>Reinvestieren</Text>
                                <TouchableOpacity
                                  style={[
                                    styles.toggleTrack,
                                    isReinvesting && styles.toggleTrackActive
                                  ]}
                                  onPress={() => toggleReinvestment(investment.id)}
                                >
                                  <View
                                    style={[
                                      styles.toggleThumb,
                                      isReinvesting && styles.toggleThumbActive
                                    ]}
                                  />
                                </TouchableOpacity>
                              </View>
                            </View>

                            {/* Status-Text */}
                            {isReinvesting && (
                              <View style={styles.reinvestStatus}>
                                <Text style={styles.reinvestStatusText}>
                                  ✓ Wird reinvestiert
                                </Text>
                              </View>
                            )}

                            {/* Validierungs-Warnung */}
                            {validationErrors[investment.id] && (
                              <View style={styles.validationError}>
                                <Text style={styles.validationErrorText}>
                                  ⚠ {validationErrors[investment.id]}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </Card.Content>
            </Card>
          </View>
        </View>
      ) : (
        // Mobile Layout: Alles untereinander
        <>
          {/* Prognosezeitraum und Inflation Card */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.prognoseInputRow}>
                <View style={styles.prognoseInputBlock}>
                  <Text style={styles.prognoseInputLabel}>Prognosezeitraum:</Text>
                  {editingField === 'years' ? (
                    <TextInput
                      style={styles.prognoseInput}
                      value={prognoseData.yearsToProject.toString()}
                      onChangeText={(text) =>
                        updatePrognoseData({
                          ...prognoseData,
                          yearsToProject: parseInt(text) || 10
                        })
                      }
                      onBlur={() => setEditingField(null)}
                      keyboardType="number-pad"
                      autoFocus
                    />
                  ) : (
                    <TouchableOpacity onPress={() => setEditingField('years')}>
                      <Text style={styles.prognoseInputValue}>{prognoseData.yearsToProject} Jahre</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.prognoseInputBlock}>
                  <Text style={styles.prognoseInputLabel}>Inflationsrate:</Text>
                  {editingField === 'inflation' ? (
                    <TextInput
                      style={styles.prognoseInput}
                      value={prognoseData.inflationRate.toString()}
                      onChangeText={(text) =>
                        updatePrognoseData({
                          ...prognoseData,
                          inflationRate: parseFloat(text) || 2
                        })
                      }
                      onBlur={() => setEditingField(null)}
                      keyboardType="decimal-pad"
                      autoFocus
                    />
                  ) : (
                    <TouchableOpacity onPress={() => setEditingField('inflation')}>
                      <Text style={styles.prognoseInputValue}>{prognoseData.inflationRate} %</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Vermögensprognose */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Vermögensprognose</Text>

              <View style={styles.overviewRow}>
                <Text style={styles.overviewLabel}>Jährliche Ersparnis:</Text>
                <Text style={[
                  styles.overviewValue,
                  { color: annualSavings >= 0 ? financeColors.incomeDark : financeColors.expenseAccent }
                ]}>
                  {annualSavings.toFixed(2)} €
                </Text>
              </View>

              <View style={styles.overviewRow}>
                <Text style={styles.overviewLabel}>Aktuelles Vermögen:</Text>
                <Text style={styles.overviewValue}>
                  {(prognoseData.liquidAssets +
                    prognoseData.investments.reduce((sum, inv) => sum + inv.amount, 0)
                  ).toFixed(2)} €
                </Text>
              </View>

              <View style={styles.overviewRow}>
                <Text style={styles.overviewLabel}>Vermögen in {prognoseData.yearsToProject} Jahren:</Text>
                <Text style={styles.overviewValue}>
                  {(liquidValues[liquidValues.length - 1] +
                    investmentValues[investmentValues.length - 1]
                  ).toFixed(2)} €
                </Text>
              </View>

              <LineChart
                data={chartData}
                width={screenWidth - 50}
                height={280}
                chartConfig={{
                  backgroundColor: '#fff',
                  backgroundGradientFrom: '#fff',
                  backgroundGradientTo: '#fff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: '4',
                    strokeWidth: '2'
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: ''
                  },
                  propsForLabels: {
                    fontFamily: 'System',
                    fontSize: 12
                  }
                }}
                bezier
                style={styles.chart}
              />
            </Card.Content>
          </Card>

          {/* Flüssiges Vermögen */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Flüssiges Vermögen</Text>

              <View style={styles.inputBlock}>
                <Text style={styles.inputLabel}>Gesamtes Startkapital:</Text>
                {editingField === 'liquid' ? (
                  <TextInput
                    style={styles.input}
                    value={prognoseData.liquidAssets.toString()}
                    onChangeText={(text) =>
                      updatePrognoseData({
                        ...prognoseData,
                        liquidAssets: parseFloat(text) || 0
                      })
                    }
                    onBlur={() => setEditingField(null)}
                    keyboardType="decimal-pad"
                    autoFocus
                  />
                ) : (
                  <TouchableOpacity onPress={() => setEditingField('liquid')}>
                    <Text style={styles.inputValue}>{Math.round(prognoseData.liquidAssets)} €</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.liquidInfoRow}>
                <Text style={styles.liquidInfoLabel}>Aktuell verfügbar (nach Investments):</Text>
                <Text style={[
                  styles.liquidInfoValue,
                  { color: availableLiquid >= 0 ? financeColors.incomeDark : financeColors.expenseAccent }
                ]}>
                  {Math.round(availableLiquid)} €
                </Text>
              </View>

              <View style={styles.liquidInfoRow}>
                <Text style={styles.liquidInfoLabel}>Monatlicher Zuwachs aus Einkommen:</Text>
                <Text style={[
                  styles.liquidInfoValue,
                  { color: monthlySavings >= 0 ? financeColors.incomeDark : financeColors.expenseAccent }
                ]}>
                  {monthlySavings >= 0 ? '+' : ''}{Math.round(monthlySavings)} € / Monat
                </Text>
              </View>

              <View style={styles.liquidInfoRow}>
                <Text style={styles.liquidInfoLabel}>Verfügbar für einmalige Investments:</Text>
                <Text style={[
                  styles.liquidInfoValue,
                  { color: availableLiquid >= 0 ? financeColors.incomeDark : financeColors.expenseAccent }
                ]}>
                  {Math.round(availableLiquid)} €
                </Text>
              </View>

              <View style={styles.liquidInfoRow}>
                <Text style={styles.liquidInfoLabel}>Verfügbar für monatliche Sparpläne:</Text>
                <Text style={[
                  styles.liquidInfoValue,
                  { color: availableMonthly >= 0 ? financeColors.incomeDark : financeColors.expenseAccent }
                ]}>
                  {Math.round(availableMonthly)} € / Monat
                </Text>
              </View>
            </Card.Content>
          </Card>

          {/* Investiertes Vermögen */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Investiertes Vermögen</Text>
                <TouchableOpacity
                  style={styles.addInvestmentButtonSmall}
                  onPress={handleAddInvestment}
                >
                  <Text style={styles.addInvestmentButtonTextSmall}>+</Text>
                </TouchableOpacity>
              </View>

              {prognoseData.investments.map((investment) => {
                const annualReturn = calculateAnnualReturn(investment);
                const isReinvesting = reinvestmentEnabled[investment.id] || false;

                return (
                  <View key={investment.id} style={styles.investmentBlock}>
                    <View style={styles.investmentHeader}>
                      <Menu
                        visible={nameMenuVisible[investment.id] || false}
                        onDismiss={() => setNameMenuVisible(prev => ({ ...prev, [investment.id]: false }))}
                        anchor={
                          <TouchableOpacity
                            style={styles.investmentNameButton}
                            onPress={() => setNameMenuVisible(prev => ({ ...prev, [investment.id]: true }))}
                          >
                            <Text style={styles.investmentName}>{investment.name}</Text>
                            <Text style={styles.dropdownIcon}>▼</Text>
                          </TouchableOpacity>
                        }
                      >
                        {investmentTypes.map((type, index) => (
                          <Menu.Item
                            key={index}
                            onPress={() => {
                              handleUpdateInvestmentName(investment.id, type.name, type.defaultRate);
                            }}
                            title={type.name}
                          />
                        ))}
                      </Menu>
                      <TouchableOpacity onPress={() => handleDeleteInvestment(investment.id)}>
                        <Text style={styles.deleteText}>×</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.investmentInputs}>
                      <View style={styles.investmentInputBlock}>
                        <Text style={styles.investmentInputLabel}>Betrag:</Text>
                        {editingField === `amount-${investment.id}` ? (
                          <TextInput
                            style={styles.investmentInput}
                            value={investment.amount.toString()}
                            onChangeText={(text) =>
                              handleUpdateInvestment(investment.id, 'amount', parseFloat(text) || 0)
                            }
                            onBlur={() => setEditingField(null)}
                            keyboardType="decimal-pad"
                            autoFocus
                          />
                        ) : (
                          <TouchableOpacity onPress={() => setEditingField(`amount-${investment.id}`)}>
                            <Text style={styles.investmentInputValue}>
                              {Math.round(investment.amount)} €
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      <View style={styles.investmentInputBlock}>
                        <Text style={styles.investmentInputLabel}>Rendite/Jahr:</Text>
                        {editingField === `return-${investment.id}` ? (
                          <TextInput
                            style={styles.investmentInput}
                            value={investment.annualReturn.toString()}
                            onChangeText={(text) =>
                              handleUpdateInvestment(investment.id, 'annualReturn', parseFloat(text) || 0)
                            }
                            onBlur={() => setEditingField(null)}
                            keyboardType="decimal-pad"
                            autoFocus
                          />
                        ) : (
                          <TouchableOpacity onPress={() => setEditingField(`return-${investment.id}`)}>
                            <Text style={styles.investmentInputValue}>
                              {investment.annualReturn.toFixed(1)} %
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                    {/* Frequency Selector */}
                    <View style={styles.frequencyRow}>
                      <Text style={styles.frequencyRowLabel}>Einzahlung:</Text>
                      <Menu
                        visible={frequencyMenuVisible[investment.id] || false}
                        onDismiss={() => setFrequencyMenuVisible(prev => ({ ...prev, [investment.id]: false }))}
                        anchor={
                          <TouchableOpacity
                            style={styles.frequencyButton}
                            onPress={() => setFrequencyMenuVisible(prev => ({ ...prev, [investment.id]: true }))}
                          >
                            <Text style={styles.frequencyButtonText}>
                              {investment.frequency} - {frequencyLabels[investment.frequency]}
                            </Text>
                          </TouchableOpacity>
                        }
                      >
                        {(['1x', 'w', 'm', 'j'] as Frequency[]).map((freq) => (
                          <Menu.Item
                            key={freq}
                            onPress={() => handleUpdateFrequency(investment.id, freq)}
                            title={`${freq} - ${frequencyLabels[freq]}`}
                          />
                        ))}
                      </Menu>
                    </View>

                    {/* Erträge mit Reinvestment Toggle */}
                    <View style={styles.returnRowWithToggle}>
                      <View style={styles.returnInfo}>
                        <Text style={styles.returnLabel}>Erträge:</Text>
                        <Text style={styles.returnValue}>
                          {Math.round(annualReturn)} €
                        </Text>
                      </View>

                      {/* Stylischer Toggle-Switch */}
                      <View style={styles.toggleContainer}>
                        <Text style={styles.toggleLabel}>Reinvestieren</Text>
                        <TouchableOpacity
                          style={[
                            styles.toggleTrack,
                            isReinvesting && styles.toggleTrackActive
                          ]}
                          onPress={() => toggleReinvestment(investment.id)}
                        >
                          <View
                            style={[
                              styles.toggleThumb,
                              isReinvesting && styles.toggleThumbActive
                            ]}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Status-Text */}
                    {isReinvesting && (
                      <View style={styles.reinvestStatus}>
                        <Text style={styles.reinvestStatusText}>
                          ✓ Wird reinvestiert
                        </Text>
                      </View>
                    )}

                    {/* Validierungs-Warnung */}
                    {validationErrors[investment.id] && (
                      <View style={styles.validationError}>
                        <Text style={styles.validationErrorText}>
                          ⚠ {validationErrors[investment.id]}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </Card.Content>
          </Card>
        </>
      )}

      {/* Nominal- und Realrendite Section - Bar Chart */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Rendite-Übersicht</Text>

          {/* Jahr 1 Bar Chart */}
          <View style={styles.barChartContainer}>
            <Text style={styles.barChartLabel}>Jahr 1</Text>

            {/* Nominalrendite Bar */}
            <View style={styles.barRow}>
              <Text style={styles.barLabelText}>Nominalrendite</Text>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      width: `${Math.min(Math.abs(returns.year1.nominalReturn) / 100, 100)}%`,
                      backgroundColor: financeColors.incomeDark
                    }
                  ]}
                />
                <Text style={styles.barValueText}>{Math.round(returns.year1.nominalReturn)} €</Text>
              </View>
            </View>

            {/* Inflation Bar */}
            <View style={styles.barRow}>
              <Text style={styles.barLabelText}>Inflation</Text>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      width: `${Math.min(Math.abs(returns.year1.inflationLoss) / 100, 100)}%`,
                      backgroundColor: financeColors.expenseAccent
                    }
                  ]}
                />
                <Text style={styles.barValueText}>-{Math.round(returns.year1.inflationLoss)} €</Text>
              </View>
            </View>

            {/* Realrendite Bar */}
            <View style={styles.barRow}>
              <Text style={[styles.barLabelText, { fontWeight: 'bold' }]}>Realrendite</Text>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      width: `${Math.min(Math.abs(returns.year1.realReturn) / 100, 100)}%`,
                      backgroundColor: getRealReturnColor(returns.year1.realReturn)
                    }
                  ]}
                />
                <Text style={[styles.barValueText, { fontWeight: 'bold' }]}>
                  {Math.round(returns.year1.realReturn)} €
                </Text>
              </View>
            </View>
          </View>

          {/* Gesamter Zeitraum Bar Chart */}
          <View style={[styles.barChartContainer, { marginTop: 24 }]}>
            <Text style={styles.barChartLabel}>Gesamt über {prognoseData.yearsToProject} Jahre</Text>

            {/* Nominalrendite Bar */}
            <View style={styles.barRow}>
              <Text style={styles.barLabelText}>Nominalrendite</Text>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      width: `${Math.min(Math.abs(returns.fullPeriod.nominalReturn) / 1000, 100)}%`,
                      backgroundColor: financeColors.incomeDark
                    }
                  ]}
                />
                <Text style={styles.barValueText}>{Math.round(returns.fullPeriod.nominalReturn)} €</Text>
              </View>
            </View>

            {/* Inflation Bar */}
            <View style={styles.barRow}>
              <Text style={styles.barLabelText}>Inflation</Text>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      width: `${Math.min(Math.abs(returns.fullPeriod.inflationLoss) / 1000, 100)}%`,
                      backgroundColor: financeColors.expenseAccent
                    }
                  ]}
                />
                <Text style={styles.barValueText}>-{Math.round(returns.fullPeriod.inflationLoss)} €</Text>
              </View>
            </View>

            {/* Realrendite Bar */}
            <View style={styles.barRow}>
              <Text style={[styles.barLabelText, { fontWeight: 'bold' }]}>Realrendite</Text>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      width: `${Math.min(Math.abs(returns.fullPeriod.realReturn) / 1000, 100)}%`,
                      backgroundColor: getRealReturnColor(returns.fullPeriod.realReturn)
                    }
                  ]}
                />
                <Text style={[styles.barValueText, { fontWeight: 'bold' }]}>
                  {Math.round(returns.fullPeriod.realReturn)} €
                </Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>

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
  desktopLeftColumn: {
    flex: 1,
    minWidth: 0
  },
  desktopRightColumn: {
    flex: 1,
    minWidth: 0
  },
  squareCard: {
    minHeight: 500
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
  cardDropTarget: {
    borderWidth: 3,
    borderColor: financeColors.incomeDark,
    borderStyle: 'dashed',
    backgroundColor: financeColors.incomeLight
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: financeColors.textPrimary
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: financeColors.textPrimary
  },
  prognoseInputRow: {
    flexDirection: 'row',
    gap: 16
  },
  prognoseInputBlock: {
    flex: 1
  },
  prognoseInputLabel: {
    fontSize: 12,
    color: financeColors.textSecondary,
    marginBottom: 4
  },
  prognoseInput: {
    fontSize: 16,
    fontWeight: '600',
    color: financeColors.textPrimary,
    borderWidth: 1,
    borderColor: financeColors.incomeDark,
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#fff'
  },
  prognoseInputValue: {
    fontSize: 16,
    fontWeight: '600',
    color: financeColors.textPrimary,
    paddingVertical: 8
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: financeColors.divider
  },
  overviewLabel: {
    fontSize: 14,
    color: financeColors.textSecondary
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: financeColors.textPrimary
  },
  inputBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: financeColors.incomeLight,
    paddingHorizontal: 16,
    borderRadius: 12
  },
  inputLabel: {
    fontSize: 14,
    color: financeColors.textSecondary,
    flex: 1
  },
  inputValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: financeColors.textPrimary
  },
  input: {
    fontSize: 16,
    fontWeight: 'bold',
    color: financeColors.textPrimary,
    textAlign: 'right',
    minWidth: 100
  },
  investmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginHorizontal: -5
  },
  reinvestInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: financeColors.divider
  },
  reinvestInfoText: {
    fontSize: 12,
    color: financeColors.incomeDark,
    fontWeight: '600',
    textAlign: 'center'
  },
  investmentCard: {
    flexBasis: '48%',
    maxWidth: '48%',
    backgroundColor: financeColors.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 5,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: financeColors.incomeDark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  cardInner: {
    flex: 1
  },
  investmentSquare: {
    backgroundColor: financeColors.incomeLight,
    borderRadius: 16,
    padding: 12,
    minWidth: 180,
    maxWidth: 220,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  investmentBlock: {
    backgroundColor: financeColors.incomeLight,
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  investmentBlockDropTarget: {
    borderColor: financeColors.incomeDark,
    borderStyle: 'dashed',
    backgroundColor: financeColors.incomeLight
  },
  investmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  investmentNameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingVertical: 4
  },
  investmentName: {
    fontSize: 16,
    fontWeight: '600',
    color: financeColors.textPrimary,
    marginRight: 6
  },
  dropdownIcon: {
    fontSize: 10,
    color: financeColors.textSecondary
  },
  deleteText: {
    fontSize: 28,
    color: financeColors.textSecondary,
    fontWeight: '300'
  },
  investmentInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  investmentInputBlock: {
    flex: 1,
    marginHorizontal: 4
  },
  investmentInputLabel: {
    fontSize: 12,
    color: financeColors.textSecondary,
    marginBottom: 4
  },
  investmentInput: {
    fontSize: 14,
    fontWeight: 'bold',
    color: financeColors.textPrimary,
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    textAlign: 'center'
  },
  investmentInputValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: financeColors.textPrimary,
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    textAlign: 'center'
  },
  addInvestmentButtonSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: financeColors.incomeDark,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3
  },
  addInvestmentButtonTextSmall: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '300',
    lineHeight: 24
  },
  inflationBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: financeColors.expenseLight,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 8
  },
  chart: {
    marginVertical: 16,
    borderRadius: 16
  },
  returnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)'
  },
  returnLabel: {
    fontSize: 13,
    color: financeColors.textSecondary,
    fontWeight: '500'
  },
  returnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: financeColors.incomeDark,
    cursor: 'grab'
  },
  returnBadgeDragging: {
    opacity: 0.5,
    cursor: 'grabbing'
  },
  returnBadgeRouted: {
    backgroundColor: financeColors.incomeLight,
    borderColor: financeColors.incomeDark
  },
  returnIcon: {
    fontSize: 16,
    color: financeColors.incomeDark,
    marginRight: 6,
    fontWeight: 'bold'
  },
  returnValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: financeColors.incomeDark
  },
  returnRowWithToggle: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: financeColors.divider
  },
  returnInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8
  },
  toggleLabel: {
    fontSize: 14,
    color: financeColors.textPrimary,
    fontWeight: '500',
    marginRight: 12
  },
  toggleTrack: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: financeColors.divider,
    justifyContent: 'center',
    padding: 2,
    cursor: 'pointer'
  },
  toggleTrackActive: {
    backgroundColor: financeColors.incomeDark
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    alignSelf: 'flex-start'
  },
  toggleThumbActive: {
    alignSelf: 'flex-end'
  },
  reinvestStatus: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: financeColors.incomeLight,
    borderRadius: 8,
    alignItems: 'center'
  },
  reinvestStatusText: {
    fontSize: 12,
    color: financeColors.incomeDark,
    fontWeight: '600'
  },
  validationError: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE082',
    alignItems: 'center'
  },
  validationErrorText: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '600'
  },
  availabilityInfo: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: financeColors.divider
  },
  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  availabilityLabel: {
    fontSize: 13,
    color: financeColors.textSecondary,
    flex: 1
  },
  availabilityValue: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12
  },
  returnOverviewBlock: {
    backgroundColor: financeColors.surface,
    borderRadius: 12,
    padding: 16
  },
  periodLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: financeColors.textPrimary,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: financeColors.divider
  },
  returnOverviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8
  },
  returnOverviewLabel: {
    fontSize: 15,
    color: financeColors.textPrimary,
    fontWeight: '500'
  },
  returnOverviewValue: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  pacmanRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 20
  },
  pacmanLabel: {
    fontSize: 13,
    color: financeColors.textSecondary,
    fontStyle: 'italic'
  },
  pacmanValue: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  divider: {
    height: 2,
    backgroundColor: financeColors.divider,
    marginVertical: 8
  },
  realReturnValue: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  barChartContainer: {
    marginVertical: 16
  },
  barChartLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: financeColors.textPrimary,
    marginBottom: 16
  },
  barRow: {
    marginBottom: 12
  },
  barLabelText: {
    fontSize: 13,
    color: financeColors.textSecondary,
    marginBottom: 6
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32
  },
  bar: {
    height: '100%',
    borderRadius: 6,
    minWidth: 4
  },
  barValueText: {
    fontSize: 14,
    color: financeColors.textPrimary,
    marginLeft: 12,
    fontWeight: '600'
  },
  routeIndicator: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: financeColors.divider,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: financeColors.incomeLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8
  },
  routeIndicatorText: {
    fontSize: 12,
    color: financeColors.incomeDark,
    fontWeight: '600',
    flex: 1
  },
  routeArrow: {
    fontSize: 20,
    color: financeColors.incomeDark,
    fontWeight: 'bold',
    marginLeft: 8
  },
  selfLoopArrow: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10
  },
  crossInvestIndicator: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: financeColors.divider,
    backgroundColor: financeColors.incomeLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8
  },
  crossInvestText: {
    fontSize: 13,
    color: financeColors.incomeDark,
    fontWeight: '700',
    textAlign: 'center'
  },
  frequencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: financeColors.divider
  },
  frequencyRowLabel: {
    fontSize: 13,
    color: financeColors.textSecondary,
    fontWeight: '500'
  },
  frequencyButton: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: financeColors.incomeDark
  },
  frequencyButtonText: {
    fontSize: 12,
    color: financeColors.textPrimary,
    fontWeight: '600'
  },
  bottomPadding: {
    height: 40
  },
  liquidInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: financeColors.divider
  },
  liquidInfoLabel: {
    fontSize: 14,
    color: financeColors.textSecondary,
    flex: 1
  },
  liquidInfoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: financeColors.textPrimary
  }
});
