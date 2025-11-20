import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { G, Path, Circle, Text as SvgText } from 'react-native-svg';

interface DonutChartData {
  name: string;
  amount: number;
  color: string;
}

interface DonutChartProps {
  data: DonutChartData[];
  size?: number;
  onHover?: (name: string | null) => void;
  highlightedCategory?: string | null;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  size = 300,
  onHover,
  highlightedCategory
}) => {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  const centerX = size / 2;
  const centerY = size / 2;
  const outerRadius = size / 2 - 10;
  const innerRadius = outerRadius * 0.6; // 60% für das Loch in der Mitte

  const total = data.reduce((sum, item) => sum + item.amount, 0);

  // Berechne die Pfade für jedes Segment
  const createArc = (
    startAngle: number,
    endAngle: number,
    innerRad: number,
    outerRad: number
  ): string => {
    const startOuterX = centerX + outerRad * Math.cos(startAngle);
    const startOuterY = centerY + outerRad * Math.sin(startAngle);
    const endOuterX = centerX + outerRad * Math.cos(endAngle);
    const endOuterY = centerY + outerRad * Math.sin(endAngle);

    const startInnerX = centerX + innerRad * Math.cos(endAngle);
    const startInnerY = centerY + innerRad * Math.sin(endAngle);
    const endInnerX = centerX + innerRad * Math.cos(startAngle);
    const endInnerY = centerY + innerRad * Math.sin(startAngle);

    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

    return [
      `M ${startOuterX} ${startOuterY}`,
      `A ${outerRad} ${outerRad} 0 ${largeArcFlag} 1 ${endOuterX} ${endOuterY}`,
      `L ${startInnerX} ${startInnerY}`,
      `A ${innerRad} ${innerRad} 0 ${largeArcFlag} 0 ${endInnerX} ${endInnerY}`,
      'Z',
    ].join(' ');
  };

  // Spezialfall: Nur ein Segment (voller Kreis)
  const createFullCircle = (innerRad: number, outerRad: number): string => {
    // Zeichne zwei Halbkreise, um einen vollen Kreis zu erstellen
    const topX = centerX;
    const topYOuter = centerY - outerRad;
    const topYInner = centerY - innerRad;
    const bottomX = centerX;
    const bottomYOuter = centerY + outerRad;
    const bottomYInner = centerY + innerRad;

    return [
      `M ${topX} ${topYOuter}`,
      `A ${outerRad} ${outerRad} 0 0 1 ${bottomX} ${bottomYOuter}`,
      `A ${outerRad} ${outerRad} 0 0 1 ${topX} ${topYOuter}`,
      `M ${topX} ${topYInner}`,
      `A ${innerRad} ${innerRad} 0 0 0 ${bottomX} ${bottomYInner}`,
      `A ${innerRad} ${innerRad} 0 0 0 ${topX} ${topYInner}`,
      'Z',
    ].join(' ');
  };

  // Erstelle Segmente
  let currentAngle = -Math.PI / 2; // Start oben
  const segments = data.map((item, index) => {
    const angle = (item.amount / total) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const isHighlighted =
      highlightedCategory === item.name ||
      hoveredSegment === item.name;

    // Bei Highlight: größerer Radius
    const segmentOuterRadius = isHighlighted ? outerRadius + 5 : outerRadius;
    const segmentInnerRadius = isHighlighted ? innerRadius - 2 : innerRadius;

    // Wenn es nur ein Segment gibt, zeichne einen vollen Kreis
    const path = data.length === 1
      ? createFullCircle(segmentInnerRadius, segmentOuterRadius)
      : createArc(startAngle, endAngle, segmentInnerRadius, segmentOuterRadius);

    return {
      name: item.name,
      path: path,
      color: item.color,
      amount: item.amount,
    };
  });

  const handleSegmentHover = (name: string | null) => {
    setHoveredSegment(name);
    if (onHover) {
      onHover(name);
    }
  };

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <G>
          {segments.map((segment, index) => (
            <Path
              key={index}
              d={segment.path}
              fill={segment.color}
              stroke="#fff"
              strokeWidth={2}
            />
          ))}

          {/* Weißer Kreis in der Mitte */}
          <Circle
            cx={centerX}
            cy={centerY}
            r={innerRadius}
            fill="#fff"
          />
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
