import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { View, Image, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { theme } from '../theme/theme';

// Screens
import { FinanceOverviewScreen } from '../screens/FinanceOverviewScreen';
import { AnalysisScreen } from '../screens/AnalysisScreen';
import { PrognoseScreenWrapper } from '../screens/PrognoseScreenWrapper';
import { DonationScreen } from '../screens/DonationScreen';

// Logo Header Component with Donate Button
const LogoHeader = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.headerContainer}>
      <Image
        source={require('../../ee34a9e6-fee0-40c7-ac3c-e0703a106a04.png')}
        style={styles.headerLogo}
        resizeMode="contain"
      />
      <TouchableOpacity
        style={styles.donateButton}
        onPress={() => navigation.navigate('Donation' as never)}
      >
        <Text style={styles.donateButtonText}>Donate</Text>
      </TouchableOpacity>
    </View>
  );
};

export type FinanceTabParamList = {
  Übersicht: undefined;
  Analyse: undefined;
  Prognose: undefined;
  Donation: undefined;
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
          tabBarStyle: {
            width: '100%',
            paddingLeft: 0,
            paddingRight: 0,
          },
          tabBarItemStyle: {
            flex: 1,
            maxWidth: '33.333%',
          },
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
          component={PrognoseScreenWrapper}
          options={{
            headerTitle: () => <LogoHeader />,
            headerTitleAlign: 'center',
          }}
        />
        <Tab.Screen
          name="Donation"
          component={DonationScreen}
          options={{
            headerTitle: () => <LogoHeader />,
            headerTitleAlign: 'center',
            tabBarButton: () => null,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  headerLogo: {
    width: 450,
    height: 150,
  },
  donateButton: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#CCCCCC',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  donateButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  }
});
