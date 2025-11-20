# Liquidi - Finance Tracking App

Eine React Native/Expo App zur visuellen Verfolgung von Finanzen mit Eichel-basierten Visualisierungen.

## Features

- **Übersichtsseite**: Visualisierung von Einnahmen, Ausgaben und Ersparnissen mit skalierbaren Eichel-Grafiken
- **Analyse**: Detaillierte Verteilungsdiagramme für Einnahmen und Ausgaben
- **Prognose**: Vermögensprognose mit interaktiven Charts für flüssiges und investiertes Vermögen
- **Investment-Tracking**: Automatische Berechnung von Investment-Renditen
- **Responsive Design**: Optimiert für Desktop und Mobile

## Installation

### Voraussetzungen

- Node.js (v14 oder höher)
- npm oder yarn
- Expo Go App auf dem Smartphone (für mobiles Testing)

### Setup

1. Repository klonen:
```bash
git clone <repository-url>
cd Liqui
```

2. Dependencies installieren:
```bash
npm install
```

3. App starten:
```bash
npx expo start
```

## App testen

### Auf dem eigenen Gerät (gleiches WLAN)

1. Expo Go App auf dem Smartphone installieren
2. QR-Code im Terminal/Browser scannen
3. App wird geladen und kann getestet werden

### Teilen mit anderen Testern (außerhalb des WLANs)

Nach dem Push auf GitHub:

1. Andere Tester klonen das Repository
2. Führen `npm install` und `npx expo start` aus
3. Scannen den QR-Code mit Expo Go

**Alternative: Expo Publish**
```bash
npx expo publish
```
Erzeugt einen öffentlichen Link, den Tester direkt in Expo Go öffnen können (kein Git-Clone notwendig).

## Technologie-Stack

- **Framework**: React Native mit Expo
- **Sprache**: TypeScript
- **UI Components**: React Native Paper
- **Charts**: react-native-chart-kit
- **Grafiken**: react-native-svg
- **State Management**: React Context API
- **Datenspeicherung**: AsyncStorage

## Projektstruktur

```
Liqui/
├── src/
│   ├── components/       # Wiederverwendbare UI-Komponenten
│   │   ├── AcornStack.tsx       # Eichel-Visualisierung
│   │   ├── DonutChart.tsx       # Donut-Chart Komponente
│   │   └── ...
│   ├── data/            # Datenmanagement
│   │   ├── FinanceContext.tsx   # Context API für Finanzdaten
│   │   └── financeTemplates.ts  # Standard-Templates
│   ├── screens/         # App-Screens
│   │   ├── FinanceOverviewScreen.tsx
│   │   ├── AnalysisScreen.tsx
│   │   └── PrognoseScreen.tsx
│   ├── navigation/      # Navigation Setup
│   ├── theme/          # Farben und Theme
│   └── types/          # TypeScript Typen
├── assets/             # App Icons und Bilder
├── App.tsx            # Root Component
└── package.json       # Dependencies
```

## Autoren

- Matthias Gottwald
- Claude Code (AI-Assistent)

## Lizenz

Private Project
