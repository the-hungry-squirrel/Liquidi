import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Ellipse, Line } from 'react-native-svg';

interface CoinProps {
  size?: number;
}

// Single coin component with 3D perspective (ellipse)
const Coin: React.FC<CoinProps> = ({ size = 80 }) => {
  const cx = size / 2;
  const cy = size / 2;
  const rx = size * 0.42; // Horizontal radius
  const ry = size * 0.16; // Vertical radius (compressed for 3D effect)

  return (
    <Svg width={size} height={size * 0.4} viewBox={`0 0 ${size} ${size * 0.4}`}>
      {/* Coin body - white fill with light gray border */}
      <Ellipse
        cx={cx}
        cy={cy * 0.4}
        rx={rx}
        ry={ry}
        fill="#FFFFFF"
        stroke="#999999"
        strokeWidth="1.5"
      />
      {/* Inner ellipse for detail */}
      <Ellipse
        cx={cx}
        cy={cy * 0.4}
        rx={rx * 0.75}
        ry={ry * 0.75}
        fill="none"
        stroke="#CCCCCC"
        strokeWidth="1"
      />
      {/* Small decorative lines for texture */}
      <Line
        x1={cx - rx * 0.3}
        y1={cy * 0.4}
        x2={cx + rx * 0.3}
        y2={cy * 0.4}
        stroke="#E0E0E0"
        strokeWidth="0.5"
      />
    </Svg>
  );
};

interface CoinStackProps {
  amount: number; // Amount in euros
}

export const CoinStack: React.FC<CoinStackProps> = ({ amount }) => {
  // Don't show coins for negative amounts
  if (amount < 0) {
    return <View style={styles.container} />;
  }

  // Calculate number of coins (1 coin = 100€)
  const totalCoins = Math.floor(amount / 100);

  // Calculate stacks of 10 and remaining coins
  const fullStacks = Math.floor(totalCoins / 10);
  const remainingCoins = totalCoins % 10;

  const coinSize = 80; // Doubled from 40
  const stackSpacing = 16; // Space between stacks
  const coinOverlap = 6; // How much coins overlap (doubled)

  // Don't show anything if less than 100€
  if (totalCoins === 0) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.stacksContainer}>
        {/* Render full stacks of 10 */}
        {[...Array(fullStacks)].map((_, stackIndex) => (
          <View key={`stack-${stackIndex}`} style={[styles.stack, { marginRight: stackIndex < fullStacks - 1 || remainingCoins > 0 ? stackSpacing : 0 }]}>
            {[...Array(10)].map((_, coinIndex) => (
              <View
                key={`coin-${stackIndex}-${coinIndex}`}
                style={[
                  styles.coinWrapper,
                  { marginBottom: -coinSize * 0.4 + coinOverlap }
                ]}
              >
                <Coin size={coinSize} />
              </View>
            ))}
          </View>
        ))}

        {/* Render remaining coins */}
        {remainingCoins > 0 && (
          <View style={styles.stack}>
            {[...Array(remainingCoins)].map((_, coinIndex) => (
              <View
                key={`remaining-${coinIndex}`}
                style={[
                  styles.coinWrapper,
                  { marginBottom: -coinSize * 0.4 + coinOverlap }
                ]}
              >
                <Coin size={coinSize} />
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    minHeight: 100
  },
  stacksContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  stack: {
    flexDirection: 'column-reverse',
    alignItems: 'center'
  },
  coinWrapper: {
    // Coins stack from bottom to top
  }
});
