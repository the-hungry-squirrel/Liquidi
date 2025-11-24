// Frequenz für wiederkehrende Einträge
export type Frequency = '1x' | 'w' | 'm' | 'j';

// Einzelposition (kleinster Block)
export interface FinanceItem {
  id: string;
  name: string;
  amount: number;
  frequency: Frequency;
}

// Oberblock (Kategorie wie "Haus", "Mobilität")
export interface FinanceCategory {
  id: string;
  name: string;
  items: FinanceItem[];
  isExpanded: boolean;
}

// Hauptkategorie (Ausgaben oder Einnahmen)
export type MainCategoryType = 'expense' | 'income';

export interface MainCategory {
  type: MainCategoryType;
  categories: FinanceCategory[];
}

// Template für vordefinierte Kategorien
export interface CategoryTemplate {
  name: string;
  defaultItems: string[];
}

// Prognose-Daten
export interface Investment {
  id: string;
  name: string;
  amount: number;
  annualReturn: number; // in Prozent
  frequency: Frequency; // Wie oft wird investiert
  reinvestEnabled?: boolean; // Ob Erträge reinvestiert werden (optional für Rückwärtskompatibilität)
  durationMonths?: number; // Dauer der Einzahlungen in Monaten (null = unbegrenzt, nur für wiederkehrende Investments)
  amountType?: 'euro' | 'percentage'; // Art der Eingabe
  percentageAmount?: number; // Prozentsatz vom verfügbaren Vermögen
}

export interface PrognoseData {
  currentAssets: number;
  liquidAssets: number;
  investments: Investment[];
  inflationRate: number;
  yearsToProject: number;
}

// Sparquoten-Bewertung
export interface SavingsRating {
  percentage: number;
  category: 'critical' | 'average' | 'good';
  message: string;
}
