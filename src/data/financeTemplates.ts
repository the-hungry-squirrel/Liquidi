import { CategoryTemplate } from '../types/finance';

// Ausgaben-Templates
export const expenseTemplates: CategoryTemplate[] = [
  {
    name: 'Haus (Eigentum)',
    defaultItems: [
      'Grundsteuer',
      'Schornsteinfeger',
      'Strom',
      'Heizkosten',
      'Feuerholz',
      'Wasser',
      'Müll',
      'Hausversicherung',
      'Kreditkosten',
      'Reparatur Pauschale'
    ]
  },
  {
    name: 'Haus (Miete)',
    defaultItems: [
      'Miete',
      'Strom',
      'Heizkosten',
      'Wasser',
      'Müll',
      'Hausversicherung'
    ]
  },
  {
    name: 'Versicherungen',
    defaultItems: [
      'Zahn-Zusatzversicherung',
      'Haftpflichtversicherung',
      'Rechtsschutzversicherung',
      'Lebensversicherung'
    ]
  },
  {
    name: 'Mobilität',
    defaultItems: [
      'Leasing',
      'Kfz Versicherung',
      'Kfz Steuer',
      'Auto Pauschale Reparatur',
      'Spritkosten Pauschale',
      'Bahntickets',
      'Bustickets',
      'Fahrrad Pauschale'
    ]
  },
  {
    name: 'Kommunikation',
    defaultItems: [
      'Mobilfunk Verträge',
      'Festnetz/Internet'
    ]
  },
  {
    name: 'Lebensmittel',
    defaultItems: [
      'Lebensmittel'
    ]
  },
  {
    name: 'Kinder',
    defaultItems: [
      'Kindergarten',
      'Schulgebühren',
      'Sport',
      'Musikschule',
      'Hobbies',
      'Taschengeld'
    ]
  },
  {
    name: 'Abos',
    defaultItems: [
      'Streaming Apps',
      'E-Commerce',
      'Fitnessapps',
      'Apps',
      'Zeitschriften',
      'Speicherplatz',
      'KI'
    ]
  },
  {
    name: 'Freizeit',
    defaultItems: [
      'Sport',
      'Restaurant',
      'Schwimmen',
      'Aktionen',
      'Kino',
      'Geschenke'
    ]
  },
  {
    name: 'Kleidung',
    defaultItems: [
      'Kleidung'
    ]
  },
  {
    name: 'Urlaub',
    defaultItems: [
      'Pauschale Sommerurlaub',
      'Pauschale Winterurlaub',
      'Pauschale Wochenend Trips'
    ]
  },
  {
    name: 'Vorsorge',
    defaultItems: [
      'private Rentenversicherung'
    ]
  },
  {
    name: 'Einmalige Anschaffungen',
    defaultItems: [
      'Einmalige Anschaffungen'
    ]
  },
  {
    name: 'Sonstiges',
    defaultItems: [
      'Sonstiges'
    ]
  }
];

// Einnahmen-Templates
export const incomeTemplates: CategoryTemplate[] = [
  {
    name: 'Nettogehalt',
    defaultItems: [
      'Nettogehalt'
    ]
  },
  {
    name: 'Miet Einnahmen',
    defaultItems: [
      'Miet Einnahmen'
    ]
  },
  {
    name: 'Sonstige Einnahmen',
    defaultItems: [
      'Sonstige Einnahmen'
    ]
  },
  {
    name: 'Verkäufe',
    defaultItems: [
      'Verkäufe'
    ]
  },
  {
    name: 'Kindergeld',
    defaultItems: [
      'Kindergeld'
    ]
  }
];

// Investment-Templates für Prognose
export const investmentTemplates = [
  { name: 'Tagesgeld / Zinsen', defaultRate: 2 },
  { name: 'Festgeld / Zinsen', defaultRate: 3 },
  { name: 'Aktien / Rendite', defaultRate: 5 },
  { name: 'Sonstige Rendite', defaultRate: 0 }
];
