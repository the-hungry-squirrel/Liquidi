import React from 'react';
import { View, StyleSheet, Image, Platform } from 'react-native';

interface OakGrowthProps {
  stage: 1 | 2 | 3 | 4 | 'squirrel';
  isHealthy: boolean;
  width?: number;
  height?: number;
}

export const OakGrowth: React.FC<OakGrowthProps> = ({
  stage,
  isHealthy,
  width = 400,
  height = 300
}) => {
  // Get the appropriate oak tree image
  const getOakImage = () => {
    if (stage === 'squirrel') {
      return require('../../assets/squirrel-eating.svg');
    }

    if (isHealthy) {
      switch (stage) {
        case 1: return require('../../assets/oak-healthy-1.svg');
        case 2: return require('../../assets/oak-healthy-2.svg');
        case 3: return require('../../assets/oak-healthy-3.svg');
        case 4: return require('../../assets/oak-healthy-4.svg');
      }
    } else {
      switch (stage) {
        case 1: return require('../../assets/oak-sick-1.svg');
        case 2: return require('../../assets/oak-sick-2.svg');
        case 3: return require('../../assets/oak-sick-3.svg');
        case 4: return require('../../assets/oak-sick-4.svg');
      }
    }
  };

  return (
    <View style={[styles.container, { width, height }]}>
      <Image
        source={getOakImage()}
        style={[styles.image, { width, height }]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.15,
    zIndex: 0
  },
  image: {
    opacity: 0.8
  }
});
