import React from 'react';
import { View, StyleSheet } from 'react-native';
import { OakGrowth } from './OakGrowth';
import { financeColors } from '../theme/colors';

interface OakGrowthWindowProps {
  stage: 1 | 2 | 3 | 4 | 'squirrel';
  isHealthy: boolean;
  width?: number;
  height?: number;
}

export const OakGrowthWindow: React.FC<OakGrowthWindowProps> = ({
  stage,
  isHealthy,
  width = 300,
  height = 300
}) => {
  return (
    <View style={styles.windowContainer}>
      <View style={[styles.window, { width, height }]}>
        <OakGrowth
          stage={stage}
          isHealthy={isHealthy}
          width={width - 32}
          height={height - 60}
          showTooltip={true}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  windowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    paddingHorizontal: 16
  },
  window: {
    backgroundColor: financeColors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: financeColors.divider,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
