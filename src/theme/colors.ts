// Moderne Finanz-App Farbpalette (basierend auf Farbwelten.jpg)
export const financeColors = {
  // Einnahmen - Obere Reihe: Grün zu Lila/Blau
  incomeLight: '#C7F5E8',      // Helles Mint/Grün (obere Reihe links)
  incomeMedium: '#9FE7D2',     // Mittleres Türkis-Grün
  incomeDark: '#87D4C8',       // Türkis
  incomeAccent: '#B8A3E8',     // Lila (obere Reihe rechts)
  incomeGradientStart: '#C7F5E8',
  incomeGradientEnd: '#B8A3E8',

  // Ausgaben - Untere Reihe: Gelb zu Pink/Magenta
  expenseLight: '#FFE8A3',     // Helles Gelb (untere Reihe links)
  expenseMedium: '#FFCF87',    // Warmes Orange-Gelb
  expenseDark: '#FFB5A3',      // Pfirsich-Koralle
  expenseAccent: '#FFB8D4',    // Pink/Magenta (untere Reihe rechts)
  expenseGradientStart: '#FFE8A3',
  expenseGradientEnd: '#FFB8D4',

  // Primärfarben - Lila-Töne aus der Palette
  primary: '#B8A3E8',          // Sanftes Lila
  primaryLight: '#D4C8F5',
  primaryDark: '#9B87D4',      // Kräftigeres Lila

  // Akzentfarben - Warme Gelb/Orange-Töne
  accent: '#FFD78A',           // Helles Gelb-Orange
  accentLight: '#FFE5B3',
  accentDark: '#FFC266',       // Kräftiges Orange

  // Sparquote/Info - Pink/Magenta-Töne
  savings: '#FFB8D4',          // Helles Pink
  savingsMedium: '#FF8FB8',    // Mittleres Pink
  savingsDark: '#FF6BA3',      // Kräftiges Magenta

  // Neutral/UI - Sehr helle Töne
  background: '#FAFCFE',       // Sehr helles Blaugrau
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Text
  textPrimary: '#2D3748',
  textSecondary: '#718096',
  textTertiary: '#A0AEC0',

  // Borders & Dividers
  border: '#E2E8F0',
  divider: '#F7FAFC',

  // Status
  success: '#4DD4AC',          // Türkis aus Palette
  warning: '#FFC266',          // Orange aus Palette
  error: '#FF9B87',            // Lachs aus Palette
  info: '#9B87D4',             // Lila aus Palette
};

// Gradienten für verschiedene Elemente
export const gradients = {
  income: 'linear-gradient(135deg, #ECFDF5 0%, #A7F3D0 100%)',
  expense: 'linear-gradient(135deg, #FEF2F2 0%, #FECACA 100%)',
  primary: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
  card: 'linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)',
  savings: 'linear-gradient(135deg, #FEE2E2 0%, #DBEAFE 100%)',
};

// Legacy colors für Kompatibilität
export const pastelColors = {
  pastelBlue: '#B4D4FF',
  pastelPink: '#FFB4D4',
  pastelGreen: '#B4FFD4',
  pastelYellow: '#FFFCB4',
  pastelPurple: '#D4B4FF',
  pastelOrange: '#FFD4B4',
  pastelMint: '#B4FFE8',
  pastelLavender: '#E8B4FF',
  pastelPeach: '#FFD4C4',
  pastelSky: '#C4E8FF',
};

export const uiColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  disabled: '#CBD5E1',
};

// Terminkategorien Farben
export const categoryColors = {
  beruf: '#B4D4FF',      // Blau
  schule: '#FFD4B4',     // Pfirsich
  sport: '#B4FFD4',      // Grün
  musik: '#D4B4FF',      // Lila
  freizeit: '#FFFCB4',   // Gelb
  arzt: '#FFB4D4',       // Pink
  veranstaltung: '#B4FFE8', // Mint
  urlaub: '#C4E8FF',     // Himmelblau
  geburtstag: '#FFB4D4', // Pink
  reise: '#E8B4FF',      // Lavendel
};

// Array für Nutzerfarben-Auswahl
export const userColorOptions = Object.values(pastelColors);

export type PastelColor = keyof typeof pastelColors;
export type CategoryColor = keyof typeof categoryColors;
