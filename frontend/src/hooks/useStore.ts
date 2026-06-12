import { useState, useEffect } from 'react';
import { Transaction, Category, Budget, Settings, Language } from '../types';
import { format } from 'date-fns';

export function getDefaultCategories(language: Language = 'en'): Category[] {
  const names: Record<Language, string[]> = {
    en: ['Salary','Freelance','Investment','Other Income','Food & Dining','Transportation','Housing','Entertainment','Health','Shopping','Education','Other'],
    ar: ['الراتب','عمل حر','استثمار','دخل آخر','طعام ومطاعم','مواصلات','سكن','ترفيه','صحة','تسوق','تعليم','أخرى'],
    ku: ['مووچە','کارکردنی سەربەخۆ','وەبەرهێنان','داهاتی تر','خواردن و چێشتخانە','گواستنەوە','خانوو','کێف و سەرگەرمی','تەندروستی','بازاڕکردن','پەروەردە','تر'],
  };
  const n = names[language] || names.en;
  return [
    { id: '1', name: n[0],  type: 'income',  color: '#22c55e', icon: '💼' },
    { id: '2', name: n[1],  type: 'income',  color: '#3b82f6', icon: '💻' },
    { id: '3', name: n[2],  type: 'income',  color: '#a855f7', icon: '📈' },
    { id: '4', name: n[3],  type: 'income',  color: '#06b6d4', icon: '💰' },
    { id: '5', name: n[4],  type: 'expense', color: '#f97316', icon: '🍽️' },
    { id: '6', name: n[5],  type: 'expense', color: '#eab308', icon: '🚗' },
    { id: '7', name: n[6],  type: 'expense', color: '#ef4444', icon: '🏠' },
    { id: '8', name: n[7],  type: 'expense', color: '#ec4899', icon: '🎬' },
    { id: '9', name: n[8],  type: 'expense', color: '#14b8a6', icon: '🏥' },
    { id: '10', name: n[9], type: 'expense', color: '#8b5cf6', icon: '🛍️' },
    { id: '11', name: n[10],type: 'expense', color: '#f59e0b', icon: '📚' },
    { id: '12', name: n[11],type: 'expense', color: '#6b7280', icon: '📦' },
  ];
}

const DEFAULT_SETTINGS: Settings = {
  currency: 'IQD',
  darkMode: false,
  language: 'en',
};

const SAMPLE_TRANSACTIONS: Transaction[] = [
  { id: 's1', type: 'income',  amount: 900000, description: 'Monthly Salary', category: '1', date: format(new Date(), 'yyyy-MM') + '-01', recurring: true, recurringInterval: 'monthly' },
  { id: 's2', type: 'expense', amount: 2500,   description: 'Lunch',          category: '5', date: format(new Date(), 'yyyy-MM') + '-03' },
  { id: 's3', type: 'expense', amount: 1000,   description: 'Taxi',           category: '6', date: format(new Date(), 'yyyy-MM') + '-05' },
  { id: 's4', type: 'expense', amount: 833,    description: 'Groceries',      category: '5', date: format(new Date(), 'yyyy-MM') + '-07' },
];

function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return defaultValue;
      const parsed = JSON.parse(stored);
      if (typeof defaultValue === 'object' && defaultValue !== null && !Array.isArray(defaultValue)) {
        return { ...defaultValue, ...parsed };
      }
      return parsed;
    } catch {
      return defaultValue;
    }
  });
  useEffect(() => { localStorage.setItem(key, JSON.stringify(value)); }, [key, value]);
  return [value, setValue] as const;
}

export function useStore() {
  const [settings, setSettings] = useLocalStorage<Settings>('cashcatcher_settings', DEFAULT_SETTINGS);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('cashcatcher_transactions', SAMPLE_TRANSACTIONS);
  const [categories, setCategories] = useLocalStorage<Category[]>('cashcatcher_categories', getDefaultCategories(settings.language));
  const [budgets, setBudgets] = useLocalStorage<Budget[]>('cashcatcher_budgets', []);

  // When language changes, update default category names for categories that still have default IDs
  const updateSettings = (s: Partial<Settings>) => {
    setSettings(prev => {
      const next = { ...prev, ...s };
      // If language changed, update category names for default categories
      if (s.language && s.language !== prev.language) {
        const newDefaults = getDefaultCategories(s.language);
        setCategories(cats => cats.map(cat => {
          const def = newDefaults.find(d => d.id === cat.id);
          // Only rename if id matches a default (1-12) and icon matches (user hasn't customized it)
          if (def && def.icon === cat.icon && def.color === cat.color) {
            return { ...cat, name: def.name };
          }
          return cat;
        }));
      }
      return next;
    });
  };

  const addTransaction = (t: Omit<Transaction, 'id'>) => setTransactions(prev => [{ ...t, id: Date.now().toString() }, ...prev]);
  const deleteTransaction = (id: string) => setTransactions(prev => prev.filter(t => t.id !== id));
  const editTransaction = (id: string, updated: Partial<Transaction>) => setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
  const addCategory = (c: Omit<Category, 'id'>) => setCategories(prev => [...prev, { ...c, id: Date.now().toString() }]);
  const deleteCategory = (id: string) => setCategories(prev => prev.filter(c => c.id !== id));
  const setBudget = (b: Omit<Budget, 'id'>) => {
    setBudgets(prev => {
      const existing = prev.find(x => x.categoryId === b.categoryId && x.month === b.month);
      if (existing) return prev.map(x => x.id === existing.id ? { ...x, amount: b.amount } : x);
      return [...prev, { ...b, id: Date.now().toString() }];
    });
  };

  return { transactions, categories, budgets, settings, addTransaction, deleteTransaction, editTransaction, addCategory, deleteCategory, setBudget, updateSettings };
}
