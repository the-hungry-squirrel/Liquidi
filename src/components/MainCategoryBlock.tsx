import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Text, IconButton, Menu } from 'react-native-paper';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MainCategory, FinanceCategory, MainCategoryType } from '../types/finance';
import { FinanceCategoryBlock } from './FinanceCategoryBlock';
import { expenseTemplates, incomeTemplates } from '../data/financeTemplates';
import { financeColors } from '../theme/colors';

// Sortierbare Kategorie-Komponente
interface SortableCategoryProps {
  category: FinanceCategory;
  type: MainCategoryType;
  onUpdate: (category: FinanceCategory) => void;
  onDelete: () => void;
}

const SortableCategory: React.FC<SortableCategoryProps> = ({
  category,
  type,
  onUpdate,
  onDelete
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <View ref={setNodeRef} style={style} {...attributes}>
      <View style={styles.sortableWrapper}>
        {/* Drag Handle */}
        <TouchableOpacity
          ref={setActivatorNodeRef}
          {...listeners}
          style={styles.dragHandle}
        >
          <Text style={styles.dragHandleText}>⋮⋮</Text>
        </TouchableOpacity>

        <View style={styles.categoryContent}>
          <FinanceCategoryBlock
            category={category}
            type={type}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        </View>
      </View>
    </View>
  );
};

interface MainCategoryBlockProps {
  mainCategory: MainCategory;
  onUpdate: (mainCategory: MainCategory) => void;
  investmentReturns?: number; // Optional: Nur für Einnahmen
}

export const MainCategoryBlock: React.FC<MainCategoryBlockProps> = ({
  mainCategory,
  onUpdate,
  investmentReturns
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = mainCategory.categories.findIndex((cat) => cat.id === active.id);
      const newIndex = mainCategory.categories.findIndex((cat) => cat.id === over.id);

      const newCategories = arrayMove(mainCategory.categories, oldIndex, newIndex);
      onUpdate({
        ...mainCategory,
        categories: newCategories,
      });
    }
  };

  const getTitle = () => {
    return mainCategory.type === 'expense' ? 'Ausgaben' : 'Einnahmen';
  };

  const getBackgroundColor = () => {
    return mainCategory.type === 'expense'
      ? 'rgba(255, 232, 163, 0.25)'  // Helles Gelb mit Transparenz
      : 'rgba(199, 245, 232, 0.25)'; // Helles Mint-Grün mit Transparenz
  };

  const getBorderColor = () => {
    return mainCategory.type === 'expense'
      ? financeColors.expenseMedium
      : financeColors.incomeMedium;
  };

  const getTotalAmount = () => {
    return mainCategory.categories.reduce((sum, category) => {
      return sum + category.items.reduce((catSum, item) => {
        let monthlyAmount = item.amount;
        switch (item.frequency) {
          case 'w':
            monthlyAmount = item.amount * 4.33;
            break;
          case 'j':
            monthlyAmount = item.amount / 12;
            break;
        }
        return catSum + monthlyAmount;
      }, 0);
    }, 0);
  };

  const handleAddCategory = (templateIndex: number) => {
    const templates = mainCategory.type === 'expense' ? expenseTemplates : incomeTemplates;
    const template = templates[templateIndex];

    const newCategory: FinanceCategory = {
      id: Date.now().toString(),
      name: template.name,
      items: template.defaultItems.map((itemName, index) => ({
        id: `${Date.now()}-${index}`,
        name: itemName,
        amount: 0,
        frequency: 'm'
      })),
      isExpanded: true
    };

    onUpdate({
      ...mainCategory,
      categories: [...mainCategory.categories, newCategory]
    });
    setMenuVisible(false);
  };

  const handleUpdateCategory = (categoryId: string, updatedCategory: FinanceCategory) => {
    onUpdate({
      ...mainCategory,
      categories: mainCategory.categories.map((cat) =>
        cat.id === categoryId ? updatedCategory : cat
      )
    });
  };

  const handleDeleteCategory = (categoryId: string) => {
    onUpdate({
      ...mainCategory,
      categories: mainCategory.categories.filter((cat) => cat.id !== categoryId)
    });
  };

  const templates = mainCategory.type === 'expense' ? expenseTemplates : incomeTemplates;

  return (
    <View style={[styles.container, {
      backgroundColor: getBackgroundColor(),
      borderColor: getBorderColor()
    }]}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
        <Text style={styles.title}>{getTitle()}</Text>
        <Text style={styles.totalAmount}>{getTotalAmount().toFixed(2)} €/m</Text>
      </TouchableOpacity>

      {/* Categories with Drag & Drop */}
      {isExpanded && (
        <View style={styles.content}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={mainCategory.categories.map((cat) => cat.id)}
              strategy={verticalListSortingStrategy}
            >
              {mainCategory.categories.map((category) => (
                <SortableCategory
                  key={category.id}
                  category={category}
                  type={mainCategory.type}
                  onUpdate={(updated) => handleUpdateCategory(category.id, updated)}
                  onDelete={() => handleDeleteCategory(category.id)}
                />
              ))}
            </SortableContext>
          </DndContext>

          {/* Investment Returns (nur für Einnahmen, nicht editierbar) */}
          {mainCategory.type === 'income' && investmentReturns !== undefined && investmentReturns > 0 && (
            <View style={styles.sortableWrapper}>
              {/* Empty drag handle space to align with other categories */}
              <View style={styles.dragHandle} />

              <View style={styles.categoryContent}>
                <View style={[styles.investmentReturnsContainer, {
                  backgroundColor: getBackgroundColor(),
                  borderColor: getBorderColor()
                }]}>
                  <View style={styles.investmentReturnsHeader}>
                    <Text style={styles.investmentReturnsTitle}>Erträge aus Investitionen</Text>
                    <Text style={[styles.investmentReturnsAmount, { color: financeColors.incomeDark }]}>
                      {investmentReturns.toFixed(2)} €/m
                    </Text>
                  </View>
                  <Text style={styles.investmentReturnsSubtext}>
                    Nicht-reinvestierte Erträge aus der Prognose-Seite
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Add Category Menu */}
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <TouchableOpacity
                style={styles.addCategoryButton}
                onPress={() => setMenuVisible(true)}
              >
                <Text style={styles.addCategoryText}>+ Kategorie hinzufügen</Text>
              </TouchableOpacity>
            }
            contentStyle={styles.menuContent}
          >
            <ScrollView style={styles.menuScroll}>
              {templates.map((template, index) => (
                <Menu.Item
                  key={index}
                  onPress={() => handleAddCategory(index)}
                  title={template.name}
                  titleStyle={styles.menuItemTitle}
                />
              ))}
            </ScrollView>
          </Menu>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sortableWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dragHandle: {
    width: 32,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
    cursor: 'grab',
  },
  dragHandleText: {
    fontSize: 20,
    color: financeColors.textTertiary,
    fontWeight: 'bold',
    letterSpacing: -2,
  },
  categoryContent: {
    flex: 1,
  },
  container: {
    marginVertical: 12,
    marginHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8
  },
  expandIcon: {
    fontSize: 18,
    marginRight: 12,
    color: financeColors.textPrimary,
    fontWeight: 'bold'
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    color: financeColors.textPrimary
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: financeColors.textPrimary
  },
  content: {
    marginTop: 8
  },
  addCategoryButton: {
    marginTop: 12,
    marginLeft: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: financeColors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: financeColors.border,
    borderStyle: 'dashed',
    alignItems: 'center'
  },
  addCategoryText: {
    fontSize: 15,
    color: financeColors.textSecondary,
    fontWeight: '600'
  },
  menuContent: {
    maxHeight: 400,
    backgroundColor: '#fff'
  },
  menuScroll: {
    maxHeight: 400
  },
  menuItemTitle: {
    fontSize: 14
  },
  investmentReturnsContainer: {
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'solid',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2
  },
  investmentReturnsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  investmentReturnsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: financeColors.textPrimary
  },
  investmentReturnsAmount: {
    fontSize: 16,
    fontWeight: '700'
  },
  investmentReturnsSubtext: {
    fontSize: 11,
    color: financeColors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2
  }
});
