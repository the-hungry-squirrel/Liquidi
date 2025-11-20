import { MD3LightTheme } from 'react-native-paper';
import { uiColors, pastelColors } from './colors';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: pastelColors.pastelBlue,
    secondary: pastelColors.pastelPink,
    tertiary: pastelColors.pastelGreen,
    background: uiColors.background,
    surface: uiColors.surface,
    text: uiColors.text,
    onSurface: uiColors.text,
    onBackground: uiColors.text,
    error: uiColors.error,
    outline: uiColors.border,
  },
  roundness: 12,
};

export type AppTheme = typeof theme;
