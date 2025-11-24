#!/usr/bin/env python3
"""
Verschiebt 'Investiertes Vermögen' nach oben in PrognoseScreen.tsx
"""

file_path = r"C:\Users\Matthias\Documents\TestClaude\Liqui\src\screens\PrognoseScreen.tsx"

# Lese die Datei
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Finde den "Investiertes Vermögen" Block (Zeile 841-1038 ca.)
# Finde die Zeile "Rechts: Investiertes Vermögen"
investment_start_idx = None
investment_end_idx = None

for i, line in enumerate(lines):
    if "{/* Rechts: Investiertes Vermögen */}" in line:
        investment_start_idx = i
    if investment_start_idx and "          </View>" in line and i > investment_start_idx + 100:
        investment_end_idx = i + 1
        break

# Finde die Zeile wo "Untere Reihe" beginnt (nach oberer Reihe)
insert_idx = None
for i, line in enumerate(lines):
    if "{/* Untere Reihe: 2 Spalten (Renditeübersicht | Investiertes Vermögen) */}" in line:
        insert_idx = i
        break

if investment_start_idx and investment_end_idx and insert_idx:
    # Extrahiere Investment-Block
    investment_block = lines[investment_start_idx:investment_end_idx]

    # Entferne Investment aus alter Position
    del lines[investment_start_idx:investment_end_idx]

    # Passe insert_idx an (da wir Zeilen gelöscht haben)
    if insert_idx > investment_start_idx:
        insert_idx -= (investment_end_idx - investment_start_idx)

    # Füge neue Zeile ein für "Zweite Reihe"
    new_section = [
        "\n",
        "          {/* Zweite Reihe: Investiertes Vermögen (volle Breite) */}\n",
        "          <View style={styles.desktopFullWidthRow}>\n"
    ]

    # Passe Investment-Block an (entferne desktopBottomRight wrapper)
    # Finde "<View style={styles.desktopBottomRight}>"
    adjusted_block = []
    skip_next_close = False
    for j, line in enumerate(investment_block):
        if "<View style={styles.desktopBottomRight}>" in line:
            # Überspringe diese Zeile
            skip_next_close = True
            continue
        if skip_next_close and "</View>" in line and "          </View>" == line:
            # Überspringe die schließende View vom desktopBottomRight
            skip_next_close = False
            continue
        adjusted_block.append(line)

    # Füge schließendes Tag hinzu
    adjusted_block.append("          </View>\n")
    adjusted_block.append("\n")

    # Füge ein
    lines[insert_idx:insert_idx] = new_section + adjusted_block

    # Ändere "Untere Reihe" zu "Dritte Reihe"
    for i in range(insert_idx, len(lines)):
        if "{/* Untere Reihe: 2 Spalten (Renditeübersicht | Investiertes Vermögen) */}" in lines[i]:
            lines[i] = lines[i].replace(
                "{/* Untere Reihe: 2 Spalten (Renditeübersicht | Investiertes Vermögen) */}",
                "{/* Dritte Reihe: Renditeübersicht (volle Breite) */}"
            )
            break

    # Ändere desktopBottomRow zu desktopFullWidthRow für Renditeübersicht
    for i in range(insert_idx, len(lines)):
        if "<View style={styles.desktopBottomRow}>" in lines[i]:
            lines[i] = lines[i].replace("desktopBottomRow", "desktopFullWidthRow")
            break

    # Entferne desktopBottomLeft wrapper
    for i in range(insert_idx, len(lines)):
        if "{/* Links: Renditeübersicht */}" in lines[i]:
            # Nächste Zeile mit desktopBottomLeft
            if i + 1 < len(lines) and "<View style={styles.desktopBottomLeft}>" in lines[i+1]:
                del lines[i+1]  # Entferne öffnendes Tag
                # Finde schließendes Tag
                for j in range(i+1, len(lines)):
                    if "</View>" in lines[j] and "            </View>" == lines[j]:
                        del lines[j]
                        break
            break

    # Schreibe zurück
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)

    print("Layout erfolgreich umstrukturiert!")
    print(f"  - Investiertes Vermögen von Zeile {investment_start_idx} nach {insert_idx} verschoben")
    print(f"  - Neue Struktur: Obere Reihe (3 Spalten) -> Investiertes Vermoegen (voll) -> Renditeuebersicht (voll)")
else:
    print("X Konnte Bloecke nicht finden")
    print(f"  investment_start_idx: {investment_start_idx}")
    print(f"  investment_end_idx: {investment_end_idx}")
    print(f"  insert_idx: {insert_idx}")
