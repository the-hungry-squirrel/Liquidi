# Arbeitsprotokoll - 22. Januar 2025 (Fortsetzung Teil 2)

## Zusammenfassung der heutigen Arbeit - Teil 2

Heute haben wir das Desktop-Layout komplett neustrukturiert, die Eichel-Logik optimiert und neue Investment-Features implementiert.

### Durchgeführte Änderungen

## 1. Desktop-Layout komplett neustrukturiert

**Neue Layout-Anordnung (basierend auf SVG-Vorlage):**

```
+------------------------+------------------------+
| Wachstumsprognose      | Flüssiges Vermögen    |
| (OakGrowthWindow)      |                        |
| klein (280x300)        | volle Höhe             |
+------------------------+                        |
| Vermögensprognose      |                        |
| (WealthChart)          |                        |
| groß                   |                        |
|                        |                        |
+------------------------+                        |
| Investiertes Vermögen  |                        |
| mittelgroß             |                        |
+------------------------+------------------------+
| Renditeübersicht (volle Breite)                |
+------------------------------------------------+
```

**Änderungen:**
- `src/screens/PrognoseScreen.tsx`:
  - Zwei-Spalten-Layout erstellt mit `desktopContainer`
  - Linke Spalte (`desktopLeftColumn`): OakGrowthWindow → WealthChart → Investiertes Vermögen
  - Rechte Spalte (`desktopRightColumn`): Flüssiges Vermögen (volle Höhe)
  - Renditeübersicht bleibt unten in voller Breite

## 2. Eichel-Stadium an Chart-Jahresauswahl gekoppelt

**Problem:** Eichel wuchs nicht, wenn im Chart die Jahre geändert wurden (nur bei `prognoseData.yearsToProject`)

**Lösung:**
- `src/components/WealthChart.tsx`:
  - Neuer Prop `onYearsChange?: (years: number) => void` hinzugefügt
  - Callback wird beim Klick auf Jahr-Buttons aufgerufen

- `src/screens/PrognoseScreen.tsx`:
  - Neuer State: `chartSelectedYears` (initial: 10)
  - `getOakStage()` nutzt jetzt `chartSelectedYears` statt `prognoseData.yearsToProject`
  - Callback `onYearsChange={setChartSelectedYears}` zum WealthChart hinzugefügt
  - Stadium-Mapping:
    - 1 Jahr → Stadium 1
    - 5 Jahre → Stadium 2
    - 10 Jahre → Stadium 3
    - 15 Jahre → Stadium 4

## 3. Prognosezeitraum in Renditeübersicht entfernt

**Änderung:** Das Prognosezeitraum-Eingabefeld in der Renditeübersicht wurde entfernt und durch einen schreibgeschützten Wert ersetzt, der automatisch mit der Chart-Jahresauswahl synchronisiert wird.

- Vorher: Bearbeitbares TextInput-Feld
- Nachher: Nur-Lese-Text mit Wert von `chartSelectedYears`

## 4. Investment-Validierung & Dauer-Feature

### Neues "Dauer der Einzahlungen" Feld:
- `src/types/finance.ts`:
  - `durationMonths?: number` zum `Investment`-Interface hinzugefügt
- Nur sichtbar für wiederkehrende Investments (m, w, j)
- Zeigt "Max X Monate" oder "Unbegrenzt" an
- User kann eigene Dauer setzen

### Investment-Validierung:
- **Einmalige Investments**: Prüft gegen verfügbares liquides Vermögen
- **Wiederkehrende Investments**:
  - Prüft monatlichen Überschuss
  - Berechnet maximale Dauer basierend auf verfügbarem Kapital
  - `calculateMaxDuration()` berechnet wie lange das Kapital reicht
  - `validateInvestment()` prüft ob genug Kapital für gewünschte Dauer vorhanden

### Prognose-Berechnung korrigiert:
- **Problem:** `investmentValues` konnte größer als Gesamtvermögen werden
- **Lösung** (`calculatePrognose()`):
  - Einmalige Investments werden sofort in Jahr 0 vom liquiden Vermögen abgezogen
  - Wiederkehrende Investments werden **monatlich** geprüft (nicht mehr jährlich)
  - Bei jedem Monat: Prüfung ob genug Kapital verfügbar
  - Berücksichtigt `durationMonths`-Limit
  - Wenn nicht genug Kapital: Nur verfügbarer Betrag wird investiert
  - `currentLiquid` wird nie negativ (`Math.max(0, currentLiquid)`)

## 5. Neue Eichen-Grafiken integriert

- Alle Grafiken aus `Wachstum/zugeschnitteneEichen/` nach `assets/` kopiert
- `OakGrowth.tsx`:
  - Tooltip-Funktion `getTooltipText()` mit allen Texten
  - Opacity auf 1.0 erhöht (vorher 0.2)
  - Neuer Prop: `showTooltip?: boolean`
- `OakGrowthWindow.tsx`:
  - Eigenständige Komponente für separates Fenster
  - Card-Styling mit Schatten und Rahmen

### Wichtige Dateien

- `src/types/finance.ts` - Investment-Interface erweitert
- `src/components/WealthChart.tsx` - Callback für Jahresauswahl hinzugefügt
- `src/components/OakGrowth.tsx` - Tooltip-Funktion
- `src/components/OakGrowthWindow.tsx` - Separates Fenster für Oak
- `src/screens/PrognoseScreen.tsx` - Hauptänderungen (Layout, Logik, Validierung)

## Aktueller Status

### ✅ Fertig:
1. Desktop-Layout neu strukturiert
2. Eichel an Chart-Jahre gekoppelt
3. Prognosezeitraum aus Renditeübersicht entfernt
4. Investment-Validierung implementiert
5. Dauer-Feature hinzugefügt
6. Prognose-Berechnung korrigiert

### 🔍 In Arbeit:
1. **Investment-Graph fehlt im Chart** - Debug läuft
2. CSS-Styles für neues Layout anpassen
3. Testing

## Offene Probleme

### Problem 1: Investment-Graph nicht sichtbar
**Symptom:** Trotz Investments erscheint kein grüner Graph für "Investiertes Vermögen" im Diagramm

**Debug-Schritte:**
- Console.logs zu `investmentValues`, `liquidValues` und `years` hinzugefügt
- Nächster Schritt: Browser-Console prüfen

**Mögliche Ursachen:**
1. `investmentValues` ist ein Array mit Nullen
2. Prognose-Berechnung hat einen Fehler
3. Chart rendert die Investment-Linie nicht

### Problem 2: Styles müssen angepasst werden
- Neue Layout-Container brauchen passende Styles
- `desktopContainer`, `desktopLeftColumn`, `desktopRightColumn` müssen definiert werden

## Nächste Schritte

- [ ] Investment-Graph-Problem debuggen und beheben
- [ ] Styles für neues Layout hinzufügen/anpassen
- [ ] Visuell prüfen (Browser)
- [ ] Git Commit erstellen

## Technische Details

### Oak-Stadium-Berechnung (neu)

```typescript
const getOakStage = (): { stage: 1 | 2 | 3 | 4 | 'squirrel', isHealthy: boolean } => {
  const realReturnRate = returns.year1.realReturnRate;

  if (realReturnRate <= 0) {
    return { stage: 'squirrel', isHealthy: false };
  }

  const isHealthy = realReturnRate >= 1.0;

  // Nutzt jetzt chartSelectedYears statt prognoseData.yearsToProject
  if (chartSelectedYears === 1) return { stage: 1, isHealthy };
  if (chartSelectedYears === 5) return { stage: 2, isHealthy };
  if (chartSelectedYears === 10) return { stage: 3, isHealthy };
  return { stage: 4, isHealthy };
};
```

### Investment-Validierung

```typescript
const calculateMaxDuration = (investment: Investment, amount: number): number | null => {
  if (investment.frequency === '1x') return null;

  const monthlyAmount = /* berechne monatlichen Betrag */;
  const monthlyOverage = monthlyAmount - (monthlySavings - otherMonthlyInvestments);

  if (monthlyOverage <= 0) return null; // Unbegrenzt möglich

  const maxMonths = Math.floor(availableLiquid / monthlyOverage);
  return maxMonths > 0 ? maxMonths : 0;
};
```

## Lessons Learned

1. **Callback-Pattern für State-Synchronisation**: Wenn ein Child-Component (WealthChart) den State eines Parent (PrognoseScreen) beeinflussen soll, ist ein Callback die sauberste Lösung
2. **Monatliche vs. Jährliche Berechnungen**: Bei Investments ist eine monatliche Prüfung genauer als jährlich, besonders wenn das Kapital knapp wird
3. **Layout-Refactoring**: Bei komplexen Layouts ist es besser, komplett neu zu strukturieren statt viele kleine Edits zu machen
4. **State-Management**: Zentrale States (wie `chartSelectedYears`) sollten im Parent sein, nicht verteilt über mehrere Components
