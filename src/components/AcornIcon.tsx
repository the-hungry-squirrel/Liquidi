import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface AcornIconProps {
  color: string;
  size?: number;
  isEmpty?: boolean;
}

export const AcornIcon: React.FC<AcornIconProps> = ({ color, size = 360, isEmpty = false }) => {
  // Leere Eichel soll 50% größer sein
  const actualSize = isEmpty ? size * 1.5 : size;

  if (isEmpty) {
    // Leere Eichel (kritisch) - neue SVG-Datei
    return (
      <View style={{ width: actualSize, height: actualSize }}>
        <Image
          source={require('../../assets/Eichel4Claud_Leer4.svg')}
          style={[styles.image, { width: actualSize, height: actualSize }]}
          resizeMode="contain"
        />
      </View>
    );
  }

  // Volle Eichel (gute Sparquote) - neue SVG-Datei
  return (
    <View style={{ width: size, height: size }}>
      <Image
        source={require('../../assets/Eichel4Claud_fürSparquoteGut_acornFullneu.svg')}
        style={[styles.image, { width: size, height: size }]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%'
  }
});
