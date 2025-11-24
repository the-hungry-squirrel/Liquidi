# PROTOKOLL: Tab-Menü Zentrierung

## Problem
3 Tab-Menü Buttons (Übersicht, Analyse, Prognose) sollen horizontal über die gesamte Bildschirmbreite verteilt werden mit gleichen Abständen, wobei das mittlere Element (Analyse) IMMER in der exakten Mitte des Bildschirms sein muss.

## Anforderungen
1. **Gleiche Verteilung**: Jeder Button nimmt exakt 1/3 der Bildschirmbreite
2. **Mittleres Element zentriert**: "Analyse" muss in der exakten Mitte sein
3. **Ausrichtung mit oberer Reihe**: Die 3 Tabs sollen sich an den 3 Spalten oben (Einnahmen, Ersparnis, Ausgaben) ausrichten

## Was NICHT funktioniert hat
❌ `justifyContent: 'space-around'` auf tabBarStyle
❌ `paddingHorizontal: 8` auf tabBarItemStyle
❌ `flex: 1` alleine ohne weitere Constraints
❌ `marginHorizontal: 0` - hat keinen Effekt

## Technische Details
- Framework: React Navigation Bottom Tabs (`@react-navigation/bottom-tabs`)
- 3 sichtbare Tabs + 1 versteckter Tab (Donation mit `tabBarButton: () => null`)
- Die obere Reihe (coinRow) nutzt:
  ```tsx
  coinRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end'
  }
  coinColumn: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8
  }
  ```

## Lösungsansatz für nächstes Mal
1. **Teste zuerst**: Schaue dir den Screenshot/Browser an BEVOR du Änderungen machst
2. **Verstehe das Layout**: React Navigation Tab Bar verhält sich anders als normale Flexbox
3. **Richtige Properties**:
   - `tabBarStyle`: Steuert den CONTAINER der Tab Bar
   - `tabBarItemStyle`: Steuert JEDES einzelne Tab Item
4. **Mögliche Lösung**:
   - Setze `flex: 1` auf jedes Item
   - Entferne ALLE Paddings (paddingLeft, paddingRight, paddingHorizontal auf 0)
   - Nutze `alignItems: 'center'` und `justifyContent: 'center'` auf Items
   - Eventuell custom TabBar Component erstellen wenn React Navigation's Standard nicht ausreicht

## Nächste Schritte beim Debugging
1. Öffne Browser DevTools und inspiziere die Tab Bar Elemente
2. Checke welche CSS Properties tatsächlich applied werden
3. Messe die tatsächliche Position von jedem Tab (left offset, width)
4. Vergleiche mit der Position der oberen Spalten (Einnahmen, Ersparnis, Ausgaben)

## Datum
2025-11-24

## Status
⚠️ Problem besteht weiterhin auf Desktop - wird nach GitHub Push und Android Build nochmal angegangen
