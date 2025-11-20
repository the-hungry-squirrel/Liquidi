import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { FinanceCategory, FinanceItem, MainCategoryType } from '../types/finance';
import { FinanceItemBlock } from './FinanceItemBlock';
import { financeColors } from '../theme/colors';

interface FinanceCategoryBlockProps {
  category: FinanceCategory;
  type: MainCategoryType;
  onUpdate: (category: FinanceCategory) => void;
  onDelete: () => void;
}

export const FinanceCategoryBlock: React.FC<FinanceCategoryBlockProps> = ({
  category,
  type,
  onUpdate,
  onDelete
}) => {
  const [nameEditing, setNameEditing] = useState(false);

  // Hilfsfunktion: Umrechnung auf Monatsbasis für Sortierung
  const getMonthlyAmountForSort = (item: FinanceItem): number => {
    let monthlyAmount = item.amount;
    switch (item.frequency) {
      case 'w':
        monthlyAmount = item.amount * 4.33;
        break;
      case 'j':
        monthlyAmount = item.amount / 12;
        break;
      case '1x':
        // Bei einmaligen Ausgaben verwenden wir den vollen Betrag zum Sortieren
        monthlyAmount = item.amount;
        break;
      case 'm':
        monthlyAmount = item.amount;
        break;
    }
    return monthlyAmount;
  };

  // Hilfsfunktion: Umrechnung auf Monatsbasis für Summen
  const getMonthlyAmount = (item: FinanceItem): number => {
    let monthlyAmount = item.amount;
    switch (item.frequency) {
      case 'w':
        monthlyAmount = item.amount * 4.33;
        break;
      case 'j':
        monthlyAmount = item.amount / 12;
        break;
      case '1x':
        // Bei einmaligen Ausgaben: 0 für monatliche Summe
        monthlyAmount = 0;
        break;
      case 'm':
        monthlyAmount = item.amount;
        break;
    }
    return monthlyAmount;
  };

  // Sortierte Items: Höchster Wert oben
  const getSortedItems = (): FinanceItem[] => {
    return [...category.items].sort((a, b) => {
      const monthlyA = getMonthlyAmountForSort(a);
      const monthlyB = getMonthlyAmountForSort(b);
      return monthlyB - monthlyA; // Absteigend sortieren
    });
  };

  // Farbe basierend auf Typ und Gesamtbetrag
  const getTotalAmount = () => {
    return category.items.reduce((sum, item) => {
      return sum + getMonthlyAmount(item);
    }, 0);
  };

  const getColor = () => {
    const total = getTotalAmount();

    if (type === 'expense') {
      // Gelb zu Orange (untere Reihe links-mitte)
      if (total < 500) return financeColors.expenseLight;
      if (total < 1000) return financeColors.expenseMedium;
      return financeColors.expenseDark;
    } else {
      // Mint-Grün zu Türkis (obere Reihe links-mitte)
      if (total < 500) return financeColors.incomeLight;
      if (total < 1000) return financeColors.incomeMedium;
      return financeColors.incomeDark;
    }
  };

  const getItemColor = () => {
    const total = getTotalAmount();

    if (type === 'expense') {
      // Etwas dunkler als Header
      if (total < 500) return financeColors.expenseMedium;
      if (total < 1000) return financeColors.expenseDark;
      return financeColors.expenseAccent;
    } else {
      // Etwas dunkler als Header
      if (total < 500) return financeColors.incomeMedium;
      if (total < 1000) return financeColors.incomeDark;
      return financeColors.incomeAccent;
    }
  };

  const handleToggleExpand = () => {
    onUpdate({ ...category, isExpanded: !category.isExpanded });
  };

  const handleAddItem = () => {
    const newItem: FinanceItem = {
      id: Date.now().toString(),
      name: 'Neue Position',
      amount: 0,
      frequency: 'm'
    };
    onUpdate({
      ...category,
      items: [...category.items, newItem]
    });
  };

  const handleUpdateItem = (itemId: string, updatedItem: FinanceItem) => {
    onUpdate({
      ...category,
      items: category.items.map((item) =>
        item.id === itemId ? updatedItem : item
      )
    });
  };

  const handleDeleteItem = (itemId: string) => {
    onUpdate({
      ...category,
      items: category.items.filter((item) => item.id !== itemId)
    });
  };

  return (
    <View style={styles.container}>
      {/* Oberblock Header */}
      <View style={[styles.header, { backgroundColor: getColor() }]}>
        <TouchableOpacity
          style={styles.expandButton}
          onPress={handleToggleExpand}
        >
          <Text style={styles.expandIcon}>
            {category.isExpanded ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>

        {nameEditing ? (
          <TextInput
            style={styles.nameInput}
            value={category.name}
            onChangeText={(text) => onUpdate({ ...category, name: text })}
            onBlur={() => setNameEditing(false)}
            autoFocus
          />
        ) : (
          <TouchableOpacity
            style={styles.nameContainer}
            onPress={() => setNameEditing(true)}
          >
            <Text style={styles.nameText}>{category.name}</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.totalText}>{getTotalAmount().toFixed(2)} €/m</Text>

        <IconButton
          icon="delete-outline"
          size={20}
          onPress={onDelete}
          iconColor="#666"
        />
      </View>

      {/* Items (nur sichtbar wenn expanded) */}
      {category.isExpanded && (
        <View style={styles.itemsContainer}>
          {getSortedItems().map((item) => (
            <FinanceItemBlock
              key={item.id}
              item={item}
              color={getItemColor()}
              onUpdate={(updatedItem) => handleUpdateItem(item.id, updatedItem)}
              onDelete={() => handleDeleteItem(item.id)}
            />
          ))}

          {/* Add Item Button */}
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: getItemColor() }]}
            onPress={handleAddItem}
          >
            <Text style={styles.addButtonText}>+ Position hinzufügen</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    marginLeft: 20
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2
  },
  expandButton: {
    padding: 4,
    marginRight: 8
  },
  expandIcon: {
    fontSize: 14,
    color: financeColors.textPrimary
  },
  nameContainer: {
    flex: 1
  },
  nameText: {
    fontSize: 16,
    fontWeight: '600',
    color: financeColors.textPrimary
  },
  nameInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: financeColors.textPrimary,
    padding: 0
  },
  totalText: {
    fontSize: 14,
    fontWeight: '700',
    color: financeColors.textPrimary,
    marginLeft: 12,
    marginRight: 8
  },
  itemsContainer: {
    marginTop: 8
  },
  addButton: {
    marginLeft: 40,
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  addButtonText: {
    fontSize: 13,
    color: financeColors.textSecondary,
    fontWeight: '500'
  }
});
