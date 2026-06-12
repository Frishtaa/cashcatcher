export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: string;
  date: string;
  recurring?: boolean;
  recurringInterval?: 'daily' | 'weekly' | 'monthly';
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  month: string;
}

export type Currency = 'IQD' | 'USD' | 'EUR' | 'GBP';
export type Language = 'en' | 'ar' | 'ku';

export interface Settings {
  currency: Currency;
  darkMode: boolean;
  language: Language;
}
