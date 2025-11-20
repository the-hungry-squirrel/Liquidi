import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { View, Image, StyleSheet } from 'react-native';
import { theme } from '../theme/theme';

// Screens
import { FinanceOverviewScreen } from '../screens/FinanceOverviewScreen';
import { AnalysisScreen } from '../screens/AnalysisScreen';
import { PrognoseScreen } from '../screens/PrognoseScreen';

// Logo Header Component
const LogoHeader = () => (
  <Image
    source={require('../../ee34a9e6-fee0-40c7-ac3c-e0703a106a04.png')}
    style={styles.headerLogo}
    resizeMode="contain"
  />
);

export type FinanceTabParamList = {
  Übersicht: undefined;
  Analyse: undefined;
  Prognose: undefined;
};

const Tab = createBottomTabNavigator<FinanceTabParamList>();

export default function FinanceNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap = 'home';

            if (route.name === 'Übersicht') {
              iconName = focused ? 'wallet' : 'wallet-outline';
            } else if (route.name === 'Analyse') {
              iconName = focused ? 'pie-chart' : 'pie-chart-outline';
            } else if (route.name === 'Prognose') {
              iconName = focused ? 'trending-up' : 'trending-up-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: 'gray',
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTintColor: theme.colors.text,
        })}
      >
        <Tab.Screen
          name="Übersicht"
          component={FinanceOverviewScreen}
          options={{
            headerTitle: () => <LogoHeader />,
            headerTitleAlign: 'center',
          }}
        />
        <Tab.Screen
          name="Analyse"
          component={AnalysisScreen}
          options={{
            headerTitle: () => <LogoHeader />,
            headerTitleAlign: 'center',
          }}
        />
        <Tab.Screen
          name="Prognose"
          component={PrognoseScreen}
          options={{
            headerTitle: () => <LogoHeader />,
            headerTitleAlign: 'center',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  headerLogoWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogo: {
    width: 450,
    height: 150,
  },
});
