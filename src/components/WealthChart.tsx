import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Path, Line, Circle, G, Text as SvgText } from 'react-native-svg';
import { financeColors } from '../theme/colors';
import { OakGrowth } from './OakGrowth';

interface WealthChartProps {
  years: number[];
  liquidValues: number[];
  investmentValues: number[];
  width?: number;
  height?: number;
  inflationRate?: number;
}

export const WealthChart: React.FC<WealthChartProps> = ({
  years,
  liquidValues,
  investmentValues,
  width = Dimensions.get('window').width - 64,
  height = 300,
  inflationRate = 2.0
}) => {
  // Year filter options: 1, 5, 10, 15 years
  const [selectedYears, setSelectedYears] = useState<number>(10);
  const yearOptions = [1, 5, 10, 15];

  // Filter data based on selected years
  const dataEndIndex = Math.min(selectedYears, years.length - 1);
  const filteredYears = years.slice(0, dataEndIndex + 1);
  const filteredLiquidValues = liquidValues.slice(0, dataEndIndex + 1);
  const filteredInvestmentValues = investmentValues.slice(0, dataEndIndex + 1);

  // Ensure the chart doesn't overflow by adding extra margin
  const maxWidth = width - 40; // Subtract extra space to prevent overflow
  // Calculate total values
  const totalValues = filteredLiquidValues.map((liquid, index) => liquid + filteredInvestmentValues[index]);

  // Calculate growth rate (annualized)
  const initialValue = totalValues[0];
  const finalValue = totalValues[totalValues.length - 1];
  const annualGrowthRate = selectedYears > 0
    ? ((finalValue - initialValue) / initialValue) * 100 / selectedYears
    : 0;

  // Determine oak tree stage and health
  const getOakStage = (): { stage: 1 | 2 | 3 | 4 | 'squirrel', isHealthy: boolean } => {
    const threshold = inflationRate + 2;

    // Show squirrel if growth <= inflation
    if (annualGrowthRate <= inflationRate) {
      return { stage: 'squirrel', isHealthy: false };
    }

    // Show sick oak if growth <= inflation + 2%
    const isHealthy = annualGrowthRate > threshold;

    // Determine stage based on selected years
    if (selectedYears === 1) return { stage: 1, isHealthy };
    if (selectedYears === 5) return { stage: 2, isHealthy };
    if (selectedYears === 10) return { stage: 3, isHealthy };
    return { stage: 4, isHealthy };
  };

  const oakInfo = getOakStage();

  // Find min and max for scaling
  const allValues = [...totalValues, ...filteredLiquidValues, ...filteredInvestmentValues];
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues, 0);
  const valueRange = maxValue - minValue;

  // Chart dimensions
  const padding = { top: 20, right: 40, bottom: 40, left: 60 };
  const chartWidth = maxWidth - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Helper function to get Y coordinate
  const getY = (value: number) => {
    const normalized = (value - minValue) / valueRange;
    return padding.top + chartHeight * (1 - normalized);
  };

  // Calculate Y position for 0€ line
  const zeroLineY = getY(0);

  // Helper function to get X coordinate
  const getX = (index: number) => {
    return padding.left + (chartWidth / (filteredYears.length - 1)) * index;
  };

  // Create path data for each line
  const createPath = (values: number[]) => {
    return values
      .map((value, index) => {
        const x = getX(index);
        const y = getY(value);
        return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      })
      .join(' ');
  };

  // Format large numbers
  const formatValue = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return value.toFixed(0);
  };

  // Calculate Y-axis ticks
  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks }, (_, i) => {
    return minValue + (valueRange / (yTicks - 1)) * i;
  });

  return (
    <View style={styles.container}>
      {/* Year Slider */}
      <View style={styles.sliderContainer}>
        {yearOptions.map((yearOption) => (
          <TouchableOpacity
            key={yearOption}
            style={[
              styles.yearButton,
              selectedYears === yearOption && styles.yearButtonActive
            ]}
            onPress={() => setSelectedYears(yearOption)}
          >
            <Text style={[
              styles.yearButtonText,
              selectedYears === yearOption && styles.yearButtonTextActive
            ]}>
              {yearOption} {yearOption === 1 ? 'Jahr' : 'Jahre'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart with Oak Background */}
      <View style={styles.chartContainer}>
        {/* Oak Tree Background - positioned in center of chart */}
        <View style={[styles.oakBackground, {
          top: zeroLineY - (chartHeight * 2.4) + (chartHeight / 5) * 2.3 + 80,
          left: padding.left + chartWidth / 2 + 115
        }]}>
          <OakGrowth
            stage={oakInfo.stage}
            isHealthy={oakInfo.isHealthy}
            width={chartHeight * 2.4}
            height={chartHeight * 2.4}
          />
        </View>

        <Svg width={maxWidth} height={height}>
        {/* Grid lines */}
        {yTickValues.map((tickValue, index) => {
          const y = getY(tickValue);
          return (
            <G key={`grid-${index}`}>
              <Line
                x1={padding.left}
                y1={y}
                x2={maxWidth - padding.right}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth={1}
                strokeDasharray="4,4"
              />
              <SvgText
                x={padding.left - 10}
                y={y + 4}
                fontSize={10}
                fill={financeColors.textSecondary}
                textAnchor="end"
              >
                {formatValue(tickValue)}€
              </SvgText>
            </G>
          );
        })}

        {/* X-axis labels */}
        {filteredYears.map((year, index) => {
          if (index % Math.max(1, Math.floor(filteredYears.length / 6)) === 0 || index === filteredYears.length - 1) {
            const x = getX(index);
            return (
              <SvgText
                key={`year-${index}`}
                x={x}
                y={height - padding.bottom + 15}
                fontSize={10}
                fill={financeColors.textSecondary}
                textAnchor="middle"
              >
                {year}
              </SvgText>
            );
          }
          return null;
        })}

        {/* Investment line (bottom layer) */}
        <Path
          d={createPath(filteredInvestmentValues)}
          stroke="#22c55e"
          strokeWidth={2}
          fill="none"
        />

        {/* Liquid line (middle layer) */}
        <Path
          d={createPath(filteredLiquidValues)}
          stroke="#3b82f6"
          strokeWidth={2}
          fill="none"
        />

        {/* Total line (top layer) */}
        <Path
          d={createPath(totalValues)}
          stroke="#6366f1"
          strokeWidth={3}
          fill="none"
        />

        {/* Data points */}
        {totalValues.map((value, index) => {
          const x = getX(index);
          const y = getY(value);
          return (
            <Circle
              key={`point-${index}`}
              cx={x}
              cy={y}
              r={3}
              fill="#6366f1"
            />
          );
        })}
      </Svg>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#6366f1' }]} />
          <Text style={styles.legendText}>Gesamtvermögen</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
          <Text style={styles.legendText}>Flüssiges Vermögen</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
          <Text style={styles.legendText}>Investiertes Vermögen</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    marginTop: 24,
    overflow: 'hidden'
  },
  sliderContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8
  },
  yearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: financeColors.divider,
    backgroundColor: 'transparent'
  },
  yearButtonActive: {
    backgroundColor: financeColors.primary,
    borderColor: financeColors.primary
  },
  yearButtonText: {
    fontSize: 12,
    color: financeColors.textSecondary,
    fontWeight: '500'
  },
  yearButtonTextActive: {
    color: '#fff',
    fontWeight: '600'
  },
  chartContainer: {
    position: 'relative',
    alignItems: 'center'
  },
  oakBackground: {
    position: 'absolute',
    transform: [{ translateX: '-50%' }],
    zIndex: 0,
    pointerEvents: 'none',
    alignItems: 'center',
    justifyContent: 'flex-end'
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 16
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6
  },
  legendText: {
    fontSize: 12,
    color: financeColors.textSecondary
  }
});
