import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Line, Circle, G, Text as SvgText } from 'react-native-svg';
import { financeColors } from '../theme/colors';

interface WealthChartProps {
  years: number[];
  liquidValues: number[];
  investmentValues: number[];
  width?: number;
  height?: number;
}

export const WealthChart: React.FC<WealthChartProps> = ({
  years,
  liquidValues,
  investmentValues,
  width = Dimensions.get('window').width - 64,
  height = 300
}) => {
  // Ensure the chart doesn't overflow by adding extra margin
  const maxWidth = width - 40; // Subtract extra space to prevent overflow
  // Calculate total values
  const totalValues = liquidValues.map((liquid, index) => liquid + investmentValues[index]);

  // Find min and max for scaling
  const allValues = [...totalValues, ...liquidValues, ...investmentValues];
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

  // Helper function to get X coordinate
  const getX = (index: number) => {
    return padding.left + (chartWidth / (years.length - 1)) * index;
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
        {years.map((year, index) => {
          if (index % Math.max(1, Math.floor(years.length / 6)) === 0 || index === years.length - 1) {
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
          d={createPath(investmentValues)}
          stroke="#22c55e"
          strokeWidth={2}
          fill="none"
        />

        {/* Liquid line (middle layer) */}
        <Path
          d={createPath(liquidValues)}
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
