import React from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';

interface OakGrowthProps {
  stage: 1 | 2 | 3 | 4 | 'squirrel';
  isHealthy: boolean;
  width?: number;
  height?: number;
  showTooltip?: boolean;
}

export const OakGrowth: React.FC<OakGrowthProps> = ({
  stage,
  isHealthy,
  width = 400,
  height = 300,
  showTooltip = false
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

  // Get tooltip text based on stage and health
  const getTooltipText = (): string => {
    if (stage === 'squirrel') {
      return 'Iss nicht alle Eicheln selber auf!';
    }

    if (isHealthy) {
      switch (stage) {
        case 1: return 'Sammel mehr und verbuddel sie';
        case 2: return 'Lass dein Sprößling wachsen';
        case 3: return 'Die Eiche wächst gut';
        case 4: return 'Sie beginnt Früchte zu tragen';
        default: return '';
      }
    } else {
      switch (stage) {
        case 1: return 'Such ein guten Ort mit Eichen';
        case 2: return 'Pflege eingebuddelte Eicheln';
        case 3: return 'Mehr Eicheln Einbuddeln!';
        case 4: return 'Bessere Erträge und Reinvestition nötig';
        default: return '';
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
      {showTooltip && (
        <View style={styles.tooltipContainer}>
          <Text style={styles.tooltipText}>{getTooltipText()}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 1,
    zIndex: 0
  },
  image: {
    opacity: 1
  },
  tooltipContainer: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  tooltipText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500'
  }
});
