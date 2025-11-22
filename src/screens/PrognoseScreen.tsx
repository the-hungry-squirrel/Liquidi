import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, StyleSheet, View, TextInput, TouchableOpacity, Dimensions, useWindowDimensions } from 'react-native';
import { Text, Card, Menu } from 'react-native-paper';
import Svg, { Path } from 'react-native-svg';
import { useFinance } from '../data/FinanceContext';
import { Investment, Frequency } from '../types/finance';
import { investmentTemplates } from '../data/financeTemplates';
import { financeColors } from '../theme/colors';
import { WealthChart } from '../components/WealthChart';
import { OakGrowthWindow } from '../components/OakGrowthWindow';

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
  const [chartSelectedYears, setChartSelectedYears] = useState<number>(10); // State für Chart-Jahresauswahl
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Initialisiere reinvestmentEnabled aus prognoseData beim Laden und bei Änderungen
  useEffect(() => {
    const initialReinvestment: { [id: string]: boolean } = {};
    prognoseData.investments.forEach(inv => {
      // Behalte bestehende Werte bei, falls vorhanden
      initialReinvestment[inv.id] = reinvestmentEnabled[inv.id] ?? inv.reinvestEnabled ?? true;
    });
    setReinvestmentEnabled(initialReinvestment);
  }, [prognoseData.investments.length]); // Aktualisiere wenn Anzahl der Investments sich ändert

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

  // Berechne maximale Dauer für wiederkehrende Investments
  const calculateMaxDuration = (investment: Investment, amount: number): number | null => {
    if (investment.frequency === '1x') {
      return null; // Einmalige Investments haben keine Dauer
    }

    // Monatlichen Betrag berechnen
    let monthlyAmount = amount;
    if (investment.frequency === 'w') monthlyAmount = amount * 4.33;
    if (investment.frequency === 'j') monthlyAmount = amount / 12;

    // Monatlicher Überschuss nach allen anderen Investments
    const otherMonthlyInvestments = prognoseData.investments
      .filter(inv => inv.id !== investment.id && inv.frequency !== '1x')
      .reduce((sum, inv) => {
        let amt = inv.amount;
        if (inv.frequency === 'w') amt *= 4.33;
        if (inv.frequency === 'j') amt /= 12;
        return sum + amt;
      }, 0);

    const monthlyOverage = monthlyAmount - (monthlySavings - otherMonthlyInvestments);

    if (monthlyOverage <= 0) {
      return null; // Unbegrenzt möglich, da genug monatlicher Überschuss
    }

    // Berechne wie lange das verfügbare Kapital reicht
    const maxMonths = Math.floor(availableLiquid / monthlyOverage);
    return maxMonths > 0 ? maxMonths : 0;
  };

  // Validierung: Prüfe ob Investment möglich ist
  const validateInvestment = (investment: Investment, newAmount: number, duration?: number): { valid: boolean; message?: string } => {
    if (investment.frequency === '1x') {
      // Einmalige Investments: Prüfe gegen verfügbares liquides Vermögen
      const otherOneTimeInvestments = prognoseData.investments
        .filter(inv => inv.frequency === '1x' && inv.id !== investment.id)
        .reduce((sum, inv) => sum + inv.amount, 0);

      const maxPossible = availableLiquid - otherOneTimeInvestments;

      if (newAmount > maxPossible) {
        return {
          valid: false,
          message: `Nicht genug liquides Vermögen! Verfügbar: ${Math.max(0, maxPossible).toFixed(2)} €`
        };
      }
    } else {
      // Wiederkehrende Investments: Prüfe gegen monatlichen Überschuss + verfügbares Kapital
      let monthlyAmount = newAmount;
      if (investment.frequency === 'w') monthlyAmount = newAmount * 4.33;
      if (investment.frequency === 'j') monthlyAmount = newAmount / 12;

      const otherMonthlyInvestments = prognoseData.investments
        .filter(inv => inv.id !== investment.id && inv.frequency !== '1x')
        .reduce((sum, inv) => {
          let amt = inv.amount;
          if (inv.frequency === 'w') amt *= 4.33;
          if (inv.frequency === 'j') amt /= 12;
          return sum + amt;
        }, 0);

      const maxPossibleMonthly = monthlySavings - otherMonthlyInvestments;
      const monthlyOverage = monthlyAmount - maxPossibleMonthly;

      // Wenn mehr als monatlicher Überschuss: Prüfe ob genug Kapital für Dauer vorhanden
      if (monthlyOverage > 0) {
        const maxDuration = calculateMaxDuration(investment, newAmount);
        const requestedDuration = duration || investment.durationMonths || prognoseData.yearsToProject * 12;

        if (maxDuration !== null && requestedDuration > maxDuration) {
          return {
            valid: false,
            message: `Nicht genug Kapital für ${requestedDuration} Monate! Maximal möglich: ${maxDuration} Monate`
          };
        }
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
      frequency: 'm', // Default to monthly
      durationMonths: undefined // Unbegrenzt
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
        const validation = validateInvestment(investment, value, investment.durationMonths);

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

  const handleUpdateDuration = (id: string, durationMonths: number | undefined) => {
    const investment = prognoseData.investments.find(inv => inv.id === id);
    if (investment) {
      const validation = validateInvestment(investment, investment.amount, durationMonths);

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
        inv.id === id ? { ...inv, durationMonths } : inv
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

    // Calculate average annual return rate
    const totalInvestedYear1 = prognoseData.investments.reduce((sum, inv) => sum + inv.amount, 0);
    const avgYear1ReturnRate = totalInvestedYear1 > 0 ? (year1NominalReturn / totalInvestedYear1) * 100 : 0;
    const realReturnRateYear1 = avgYear1ReturnRate - prognoseData.inflationRate;

    return {
      year1: {
        nominalReturn: year1NominalReturn,
        inflationLoss: year1InflationLoss,
        realReturn: year1RealReturn,
        realReturnRate: realReturnRateYear1
      },
      fullPeriod: {
        nominalReturn: totalPeriodNominalReturn,
        inflationLoss: totalPeriodInflationLoss,
        realReturn: totalPeriodRealReturn,
        realReturnRate: realReturnRateYear1 // Verwende die gleiche Rate für Konsistenz
      }
    };
  };

  const returns = calculateReturns();

  // Determine oak tree stage and health based on Realrendite
  const getOakStage = (): { stage: 1 | 2 | 3 | 4 | 'squirrel', isHealthy: boolean } => {
    // Use realReturnRate from year1: <1% = sick oak, <=0% = squirrel
    const realReturnRate = returns.year1.realReturnRate;

    // Show squirrel if real return <= 0%
    if (realReturnRate <= 0) {
      return { stage: 'squirrel', isHealthy: false };
    }

    // Show sick oak if real return < 1%
    const isHealthy = realReturnRate >= 1.0;

    // Determine stage based on CHART-selected years (not prognoseData.yearsToProject)
    if (chartSelectedYears === 1) return { stage: 1, isHealthy };
    if (chartSelectedYears === 5) return { stage: 2, isHealthy };
    if (chartSelectedYears === 10) return { stage: 3, isHealthy };
    return { stage: 4, isHealthy }; // 15 Jahre
  };

  const oakInfo = getOakStage();

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
    // Track months elapsed for duration tracking
    const investmentMonthsElapsed: { [id: string]: number } = {};

    prognoseData.investments.forEach(inv => {
      // Für einmalige Investments: voller Betrag am Anfang (sofort abziehen)
      if (inv.frequency === '1x') {
        investmentAmounts[inv.id] = inv.amount;
        currentLiquid -= inv.amount; // Abzug vom liquiden Vermögen
      } else {
        investmentAmounts[inv.id] = 0;
        investmentMonthsElapsed[inv.id] = 0;
      }
    });

    // Jahr 0 (aktuell)
    years.push(0);
    liquidValues.push(Math.max(0, currentLiquid)); // Nie negativ
    investmentValues.push(Object.values(investmentAmounts).reduce((sum, val) => sum + val, 0));

    // Berechnung für zukünftige Jahre
    for (let year = 1; year <= prognoseData.yearsToProject; year++) {
      // Add annual savings to liquid assets
      currentLiquid += annualSavings;

      // Add recurring investment contributions (monatlich prüfen)
      for (let month = 1; month <= 12; month++) {
        prognoseData.investments.forEach(inv => {
          if (inv.frequency !== '1x') {
            // Prüfe ob Dauer-Limit erreicht
            if (inv.durationMonths && investmentMonthsElapsed[inv.id] >= inv.durationMonths) {
              return; // Keine weiteren Einzahlungen
            }

            let monthlyContribution = 0;
            switch (inv.frequency) {
              case 'm': // Monatlich
                monthlyContribution = inv.amount;
                break;
              case 'w': // Wöchentlich (4.33 Wochen pro Monat)
                monthlyContribution = inv.amount * 4.33;
                break;
              case 'j': // Jährlich (nur im letzten Monat des Jahres)
                monthlyContribution = month === 12 ? inv.amount : 0;
                break;
            }

            // Prüfe ob genug liquides Vermögen vorhanden ist
            if (currentLiquid >= monthlyContribution) {
              investmentAmounts[inv.id] += monthlyContribution;
              currentLiquid -= monthlyContribution;
              investmentMonthsElapsed[inv.id]++;
            } else {
              // Nicht genug Kapital: Nur so viel wie verfügbar
              const actualContribution = Math.max(0, currentLiquid);
              investmentAmounts[inv.id] += actualContribution;
              currentLiquid -= actualContribution;
              investmentMonthsElapsed[inv.id]++;
            }
          }
        });
      }

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

        // Default: reinvestieren (true), falls nicht explizit false gesetzt
        const shouldReinvest = reinvestmentEnabled[inv.id] ?? inv.reinvestEnabled ?? true;

        if (shouldReinvest) {
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

      // Sicherstellen dass Werte nie negativ sind
      currentLiquid = Math.max(0, currentLiquid);

      years.push(year);
      liquidValues.push(currentLiquid);
      const totalInvested = Object.values(investmentAmounts).reduce((sum, val) => sum + val, 0);
      investmentValues.push(totalInvested);
    }

    return { years, liquidValues, investmentValues };
  };

  const { years, liquidValues, investmentValues } = calculatePrognose();

  // Debug: Log investment values
  console.log('Investment Values:', investmentValues);
  console.log('Liquid Values:', liquidValues);
  console.log('Years:', years);

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
        <View style={styles.desktopMainContainer}>
          {/* Obere Reihe: 3 Spalten (Chart | Eiche MITTIG | Flüssiges Vermögen) */}
          <View style={styles.desktopTopRow}>
            {/* Links: Vermögensprognose (Chart) */}
            <View style={styles.desktopTopLeft}>
              <Card style={styles.card}>
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

                  <WealthChart
                    years={years}
                    liquidValues={liquidValues}
                    investmentValues={investmentValues}
                    width={380}
                    onYearsChange={setChartSelectedYears}
                  />
                </Card.Content>
              </Card>
            </View>

            {/* Mitte: Wachstumsprognose (Eiche) - IMMER MITTIG */}
            <View style={styles.desktopTopCenter}>
              <OakGrowthWindow
                stage={oakInfo.stage}
                isHealthy={oakInfo.isHealthy}
                width={280}
                height={400}
              />
            </View>

            {/* Rechts: Flüssiges Vermögen */}
            <View style={styles.desktopTopRight}>
              <Card style={[styles.card, styles.matchedHeightCard]}>
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
            </View>
          </View>

          {/* Untere Reihe: 2 Spalten (Renditeübersicht | Investiertes Vermögen) */}
          <View style={styles.desktopBottomRow}>
            {/* Links: Renditeübersicht */}
            <View style={styles.desktopBottomLeft}>
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={styles.sectionTitle}>Renditeübersicht</Text>

                  {/* Prognosezeitraum (aus Chart übernommen) und Inflation */}
                  <View style={styles.prognoseInputRow}>
                    <View style={styles.prognoseInputBlock}>
                      <Text style={styles.prognoseInputLabel}>Prognosezeitraum:</Text>
                      <Text style={styles.prognoseInputValue}>{chartSelectedYears} {chartSelectedYears === 1 ? 'Jahr' : 'Jahre'}</Text>
                    </View>

                    <View style={styles.prognoseInputBlock}>
                      <Text style={styles.prognoseInputLabel}>Inflation:</Text>
                      {editingField === 'inflation' ? (
                        <TextInput
                          style={styles.prognoseInput}
                          value={prognoseData.inflationRate.toString()}
                          onChangeText={(text) => {
                            const cleanText = text.replace(',', '.');
                            const value = parseFloat(cleanText);
                            updatePrognoseData({
                              ...prognoseData,
                              inflationRate: isNaN(value) ? 2.0 : value
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

                  {/* Jahr 1 */}
                  <Text style={[styles.liquidInfoLabel, { marginTop: 16, marginBottom: 8, fontSize: 16, fontWeight: '600', color: financeColors.textPrimary }]}>Jahr 1</Text>

                  <View style={styles.liquidInfoRow}>
                    <Text style={styles.liquidInfoLabel}>Nominalrendite:</Text>
                    <Text style={[styles.liquidInfoValue, { color: financeColors.incomeDark }]}>
                      {Math.round(returns.year1.nominalReturn)} €
                    </Text>
                  </View>

                  <View style={styles.liquidInfoRow}>
                    <Text style={styles.liquidInfoLabel}>Inflation:</Text>
                    <Text style={[styles.liquidInfoValue, { color: financeColors.expenseAccent }]}>
                      -{Math.round(returns.year1.inflationLoss)} €
                    </Text>
                  </View>

                  <View style={styles.liquidInfoRow}>
                    <Text style={styles.liquidInfoLabel}>Realrendite:</Text>
                    <Text style={[styles.liquidInfoValue, { color: getRealReturnColor(returns.year1.realReturn), fontWeight: '700' }]}>
                      {Math.round(returns.year1.realReturn)} € ({returns.year1.realReturnRate.toFixed(2)}%)
                    </Text>
                  </View>

                  {/* Gesamter Zeitraum */}
                  <Text style={[styles.liquidInfoLabel, { marginTop: 24, marginBottom: 8, fontSize: 16, fontWeight: '600', color: financeColors.textPrimary }]}>
                    Gesamt über {prognoseData.yearsToProject} Jahre
                  </Text>

                  <View style={styles.liquidInfoRow}>
                    <Text style={styles.liquidInfoLabel}>Nominalrendite:</Text>
                    <Text style={[styles.liquidInfoValue, { color: financeColors.incomeDark }]}>
                      {Math.round(returns.fullPeriod.nominalReturn)} €
                    </Text>
                  </View>

                  <View style={styles.liquidInfoRow}>
                    <Text style={styles.liquidInfoLabel}>Inflation:</Text>
                    <Text style={[styles.liquidInfoValue, { color: financeColors.expenseAccent }]}>
                      -{Math.round(returns.fullPeriod.inflationLoss)} €
                    </Text>
                  </View>

                  <View style={styles.liquidInfoRow}>
                    <Text style={styles.liquidInfoLabel}>Realrendite:</Text>
                    <Text style={[styles.liquidInfoValue, { color: getRealReturnColor(returns.fullPeriod.realReturn), fontWeight: '700' }]}>
                      {Math.round(returns.fullPeriod.realReturn)} € ({returns.fullPeriod.realReturnRate.toFixed(2)}%)
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            </View>

            {/* Rechts: Investiertes Vermögen */}
            <View style={styles.desktopBottomRight}>
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
                                      onChangeText={(text) => {
                                        const cleanText = text.replace(',', '.');
                                        const value = parseFloat(cleanText);
                                        handleUpdateInvestment(investment.id, 'annualReturn', isNaN(value) ? 0 : value);
                                      }}
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

                              {/* Dauer der Einzahlungen (nur für wiederkehrende Investments) */}
                              {investment.frequency !== '1x' && (
                                <View style={styles.durationRow}>
                                  <Text style={styles.durationLabel}>
                                    Dauer:
                                  </Text>
                                  {editingField === `duration-${investment.id}` ? (
                                    <TextInput
                                      style={styles.durationInput}
                                      value={investment.durationMonths?.toString() || ''}
                                      placeholder="Unbegrenzt"
                                      onChangeText={(text) => {
                                        const value = text === '' ? undefined : parseInt(text);
                                        handleUpdateDuration(investment.id, value);
                                      }}
                                      onBlur={() => setEditingField(null)}
                                      keyboardType="number-pad"
                                      autoFocus
                                    />
                                  ) : (
                                    <TouchableOpacity onPress={() => setEditingField(`duration-${investment.id}`)}>
                                      <Text style={styles.durationValue}>
                                        {investment.durationMonths ? `${investment.durationMonths} Mon.` : 'Unbegrenzt'}
                                      </Text>
                                    </TouchableOpacity>
                                  )}
                                </View>
                              )}

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
        </View>
      ) : (
        <>
          {/* Mobile: Oak Growth Window oben mittig */}
          <OakGrowthWindow
            stage={oakInfo.stage}
            isHealthy={oakInfo.isHealthy}
            width={300}
            height={320}
          />

          {/* Mobile Layout: Alles untereinander */}
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

              <WealthChart
                years={years}
                liquidValues={liquidValues}
                investmentValues={investmentValues}
                width={Dimensions.get('window').width - 80}
                onYearsChange={setChartSelectedYears}
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
                            onChangeText={(text) => {
                              const cleanText = text.replace(',', '.');
                              const value = parseFloat(cleanText);
                              handleUpdateInvestment(investment.id, 'annualReturn', isNaN(value) ? 0 : value);
                            }}
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

                    {/* Dauer der Einzahlungen (nur für wiederkehrende Investments) */}
                    {investment.frequency !== '1x' && (
                      <View style={styles.durationRow}>
                        <Text style={styles.durationLabel}>
                          Dauer:
                        </Text>
                        {editingField === `duration-${investment.id}` ? (
                          <TextInput
                            style={styles.durationInput}
                            value={investment.durationMonths?.toString() || ''}
                            placeholder="Unbegrenzt"
                            onChangeText={(text) => {
                              const value = text === '' ? undefined : parseInt(text);
                              handleUpdateDuration(investment.id, value);
                            }}
                            onBlur={() => setEditingField(null)}
                            keyboardType="number-pad"
                            autoFocus
                          />
                        ) : (
                          <TouchableOpacity onPress={() => setEditingField(`duration-${investment.id}`)}>
                            <Text style={styles.durationValue}>
                              {investment.durationMonths ? `${investment.durationMonths} Mon.` : 'Unbegrenzt'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}

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

          {/* Rendite-Übersicht für Mobile */}
          <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Rendite-Übersicht</Text>

          {/* Prognosezeitraum (aus Chart übernommen) und Inflation */}
          <View style={styles.prognoseInputRow}>
            <View style={styles.prognoseInputBlock}>
              <Text style={styles.prognoseInputLabel}>Prognosezeitraum:</Text>
              <Text style={styles.prognoseInputValue}>{chartSelectedYears} {chartSelectedYears === 1 ? 'Jahr' : 'Jahre'}</Text>
            </View>

            <View style={styles.prognoseInputBlock}>
              <Text style={styles.prognoseInputLabel}>Inflation:</Text>
              {editingField === 'inflation' ? (
                <TextInput
                  style={styles.prognoseInput}
                  value={prognoseData.inflationRate.toString()}
                  onChangeText={(text) => {
                    const cleanText = text.replace(',', '.');
                    const value = parseFloat(cleanText);
                    updatePrognoseData({
                      ...prognoseData,
                      inflationRate: isNaN(value) ? 2.0 : value
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

          {/* Jahr 1 */}
          <Text style={[styles.liquidInfoLabel, { marginTop: 16, marginBottom: 8, fontSize: 16, fontWeight: '600', color: financeColors.textPrimary }]}>Jahr 1</Text>

          <View style={styles.liquidInfoRow}>
            <Text style={styles.liquidInfoLabel}>Nominalrendite:</Text>
            <Text style={[styles.liquidInfoValue, { color: financeColors.incomeDark }]}>
              {Math.round(returns.year1.nominalReturn)} €
            </Text>
          </View>

          <View style={styles.liquidInfoRow}>
            <Text style={styles.liquidInfoLabel}>Inflation:</Text>
            <Text style={[styles.liquidInfoValue, { color: financeColors.expenseAccent }]}>
              -{Math.round(returns.year1.inflationLoss)} €
            </Text>
          </View>

          <View style={styles.liquidInfoRow}>
            <Text style={styles.liquidInfoLabel}>Realrendite:</Text>
            <Text style={[styles.liquidInfoValue, { color: getRealReturnColor(returns.year1.realReturn), fontWeight: '700' }]}>
              {Math.round(returns.year1.realReturn)} € ({returns.year1.realReturnRate.toFixed(2)}%)
            </Text>
          </View>

          {/* Gesamter Zeitraum */}
          <Text style={[styles.liquidInfoLabel, { marginTop: 24, marginBottom: 8, fontSize: 16, fontWeight: '600', color: financeColors.textPrimary }]}>
            Gesamt über {prognoseData.yearsToProject} Jahre
          </Text>

          <View style={styles.liquidInfoRow}>
            <Text style={styles.liquidInfoLabel}>Nominalrendite:</Text>
            <Text style={[styles.liquidInfoValue, { color: financeColors.incomeDark }]}>
              {Math.round(returns.fullPeriod.nominalReturn)} €
            </Text>
          </View>

          <View style={styles.liquidInfoRow}>
            <Text style={styles.liquidInfoLabel}>Inflation:</Text>
            <Text style={[styles.liquidInfoValue, { color: financeColors.expenseAccent }]}>
              -{Math.round(returns.fullPeriod.inflationLoss)} €
            </Text>
          </View>

          <View style={styles.liquidInfoRow}>
            <Text style={styles.liquidInfoLabel}>Realrendite:</Text>
            <Text style={[styles.liquidInfoValue, { color: getRealReturnColor(returns.fullPeriod.realReturn), fontWeight: '700' }]}>
              {Math.round(returns.fullPeriod.realReturn)} € ({returns.fullPeriod.realReturnRate.toFixed(2)}%)
            </Text>
          </View>
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
  desktopMainContainer: {
    paddingHorizontal: 16,
    paddingTop: 16
  },
  desktopTopRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    alignItems: 'flex-start'
  },
  desktopTopLeft: {
    flex: 1,
    minWidth: 0
  },
  desktopTopCenter: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  desktopTopRight: {
    flex: 1,
    minWidth: 0
  },
  desktopBottomRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    alignItems: 'flex-start'
  },
  desktopBottomLeft: {
    flex: 1,
    minWidth: 0
  },
  desktopBottomRight: {
    flex: 2,
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
  matchedHeightCard: {
    minHeight: 400
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: financeColors.incomeLight,
    borderRadius: 8,
    minWidth: 100,
    textAlign: 'center'
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
    marginVertical: 16,
    width: '100%',
    maxWidth: '100%'
  },
  barChartLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: financeColors.textPrimary,
    marginBottom: 16
  },
  barRow: {
    marginBottom: 12,
    flexDirection: 'column',
    width: '100%'
  },
  barLabelText: {
    fontSize: 13,
    color: financeColors.textSecondary,
    marginBottom: 6
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    flex: 1,
    overflow: 'hidden'
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
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: financeColors.divider
  },
  durationLabel: {
    fontSize: 12,
    color: financeColors.textSecondary,
    fontWeight: '500',
    flex: 1
  },
  durationInput: {
    fontSize: 12,
    fontWeight: 'bold',
    color: financeColors.textPrimary,
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: financeColors.incomeDark,
    minWidth: 80,
    textAlign: 'center'
  },
  durationValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: financeColors.textPrimary,
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    minWidth: 80,
    textAlign: 'center'
  },
  bottomPadding: {
    height: 40
  },
  liquidInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: financeColors.divider
  },
  liquidInfoLabel: {
    fontSize: 14,
    color: financeColors.textSecondary,
    flex: 1,
    textAlign: 'left'
  },
  liquidInfoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: financeColors.textPrimary
  }
});
