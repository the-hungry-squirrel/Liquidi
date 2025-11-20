import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, Menu } from 'react-native-paper';
import { FinanceItem, Frequency } from '../types/finance';
import { financeColors } from '../theme/colors';

interface FinanceItemBlockProps {
  item: FinanceItem;
  color: string;
  onUpdate: (item: FinanceItem) => void;
  onDelete: () => void;
}

const frequencyLabels: Record<Frequency, string> = {
  '1x': 'Einmalig',
  'w': 'Wöchentlich',
  'm': 'Monatlich',
  'j': 'Jährlich'
};

export const FinanceItemBlock: React.FC<FinanceItemBlockProps> = ({
  item,
  color,
  onUpdate,
  onDelete
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [nameEditing, setNameEditing] = useState(false);
  const [amountEditing, setAmountEditing] = useState(false);

  const handleFrequencySelect = (frequency: Frequency) => {
    onUpdate({ ...item, frequency });
    setMenuVisible(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: color }]}>
      {/* Langloch-Form Hauptteil */}
      <View style={styles.mainBlock}>
        {/* Name */}
        <View style={styles.nameSection}>
          {nameEditing ? (
            <TextInput
              style={styles.nameInput}
              value={item.name}
              onChangeText={(text) => onUpdate({ ...item, name: text })}
              onBlur={() => setNameEditing(false)}
              autoFocus
              placeholder="Name"
            />
          ) : (
            <TouchableOpacity onPress={() => setNameEditing(true)}>
              <Text style={styles.nameText}>{item.name}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Betrag */}
        <View style={styles.amountSection}>
          {amountEditing ? (
            <TextInput
              style={styles.amountInput}
              value={item.amount.toString()}
              onChangeText={(text) => {
                const amount = parseFloat(text) || 0;
                onUpdate({ ...item, amount });
              }}
              onBlur={() => setAmountEditing(false)}
              keyboardType="decimal-pad"
              autoFocus
              placeholder="0"
            />
          ) : (
            <TouchableOpacity onPress={() => setAmountEditing(true)}>
              <Text style={styles.amountText}>{item.amount.toFixed(2)} €</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Löschen Button */}
        <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
          <Text style={styles.deleteText}>×</Text>
        </TouchableOpacity>
      </View>

      {/* Frequenz-Kreis am Ende */}
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <TouchableOpacity
            style={[styles.frequencyCircle, { borderColor: color }]}
            onPress={() => setMenuVisible(true)}
          >
            <Text style={styles.frequencyText}>{item.frequency}</Text>
          </TouchableOpacity>
        }
      >
        {(['1x', 'w', 'm', 'j'] as Frequency[]).map((freq) => (
          <Menu.Item
            key={freq}
            onPress={() => handleFrequencySelect(freq)}
            title={`${freq} - ${frequencyLabels[freq]}`}
          />
        ))}
      </Menu>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    marginLeft: 40,
    borderRadius: 20,
    overflow: 'visible'
  },
  mainBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20
  },
  nameSection: {
    flex: 1,
    marginRight: 12
  },
  nameText: {
    fontSize: 14,
    color: financeColors.textPrimary,
    fontWeight: '500'
  },
  nameInput: {
    fontSize: 14,
    color: financeColors.textPrimary,
    fontWeight: '500',
    padding: 0
  },
  amountSection: {
    marginRight: 8
  },
  amountText: {
    fontSize: 14,
    color: financeColors.textPrimary,
    fontWeight: '600'
  },
  amountInput: {
    fontSize: 14,
    color: financeColors.textPrimary,
    fontWeight: '600',
    padding: 0,
    minWidth: 60,
    textAlign: 'right'
  },
  deleteButton: {
    padding: 4,
    marginLeft: 4
  },
  deleteText: {
    fontSize: 24,
    color: financeColors.textSecondary,
    fontWeight: '300'
  },
  frequencyCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: financeColors.surface,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2
  },
  frequencyText: {
    fontSize: 12,
    fontWeight: '600',
    color: financeColors.textPrimary
  }
});
