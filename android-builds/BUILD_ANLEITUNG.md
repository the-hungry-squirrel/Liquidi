# Android Build Anleitung

## Vorbereitung (einmalig)

1. **EAS Projekt initialisieren**
   ```bash
   cd C:\Users\Matthias\Documents\TestClaude\Liqui
   npx eas-cli build:configure
   ```
   - Bestätige "Yes" um ein EAS Projekt zu erstellen
   - Die Konfiguration wird automatisch in `app.json` und `eas.json` gespeichert

## Build erstellen

### Option 1: Cloud Build (empfohlen)
```bash
npx eas-cli build --platform android --profile production
```
- Build wird in der Cloud erstellt (dauert ~5-10 Minuten)
- Am Ende erhältst du einen Download-Link für die AAB-Datei
- Diese AAB kannst du direkt bei Google Play hochladen

### Option 2: Lokaler Build
```bash
npx eas-cli build --platform android --profile production --local
```
- Build wird lokal auf deinem PC erstellt
- Benötigt mehr Speicherplatz und Docker
- Schneller wenn du viele Builds machst

## Build für Preview/Testing (APK statt AAB)
```bash
npx eas-cli build --platform android --profile preview
```
- Erstellt eine APK die du direkt auf einem Android-Gerät installieren kannst
- Gut zum Testen vor dem Google Play Upload

## Google Play Store Upload

1. Gehe zu [Google Play Console](https://play.google.com/console)
2. Wähle deine App (oder erstelle eine neue)
3. Gehe zu "Release" → "Production" → "Create new release"
4. Lade die AAB-Datei hoch
5. Fülle App-Details aus (Beschreibung, Screenshots, etc.)
6. Sende zur Überprüfung

## Troubleshooting

**Problem: "EAS project not configured"**
- Lösung: Führe `npx eas-cli build:configure` aus

**Problem: "Not logged in"**
- Lösung: Führe `npx eas-cli login` aus

**Problem: Build schlägt fehl**
- Prüfe die Logs in der EAS Console: https://expo.dev/accounts/[dein-account]/projects/liqui/builds
- Oder prüfe lokale Logs wenn du `--local` nutzt

## Aktuelle Build-Version
- Version: 1.0.0
- Version Code: 1
- Package: com.thehungrysquirrel.liquidi

## Dateien
- AAB wird in `android-builds/` gespeichert (lokaler Build)
- Oder über EAS Dashboard heruntergeladen (Cloud Build)
