import { useState, useEffect } from 'react';

export interface ExpenseItem {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  includesVat: boolean;
  receipt: boolean;
}

export interface ExpensesState {
  weekStartDate: string;
  items: ExpenseItem[];
}

const VAT_RATE = 0.20;

const EXPENSE_CATEGORIES = [
  'Fuel / Mileage',
  'Parking',
  'Tolls / Congestion',
  'Tools / Equipment',
  'Materials',
  'Vehicle Maintenance',
  'Vehicle Hire',
  'Food / Subsistence',
  'Accommodation',
  'PPE / Workwear',
  'Phone / Data',
  'Postage / Courier',
  'Training / Certification',
  'Printing / Stationery',
  'Insurance',
  'Software / Subscriptions',
  'Client Entertainment',
  'Travel (Rail / Bus)',
  'Travel (Flights)',
  'Medical / First Aid',
  'Cleaning / Waste Disposal',
  'Other',
];

const defaultExpensesState = (weekStartDate: string): ExpensesState => ({
  weekStartDate,
  items: [],
});

export function calcVat(amount: number, includesVat: boolean) {
  if (!amount || amount <= 0) return { net: 0, vat: 0, gross: 0 };
  if (includesVat) {
    const net = amount / (1 + VAT_RATE);
    const vat = amount - net;
    return { net: parseFloat(net.toFixed(2)), vat: parseFloat(vat.toFixed(2)), gross: amount };
  }
  const vat = amount * VAT_RATE;
  const gross = amount + vat;
  return { net: amount, vat: parseFloat(vat.toFixed(2)), gross: parseFloat(gross.toFixed(2)) };
}

export function useExpenses(weekStartDate: string) {
  const [state, setState] = useState<ExpensesState>(() => {
    const saved = localStorage.getItem('expenses-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.weekStartDate === weekStartDate) {
          if (parsed.items) {
            parsed.items = parsed.items.map((item: any) => ({
              ...item,
              includesVat: item.includesVat !== undefined ? item.includesVat : true,
            }));
          }
          return parsed;
        }
      } catch (e) {}
    }
    return defaultExpensesState(weekStartDate);
  });

  useEffect(() => {
    if (state.weekStartDate !== weekStartDate) {
      const saved = localStorage.getItem('expenses-state');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.weekStartDate === weekStartDate) {
            setState(parsed);
            return;
          }
        } catch (e) {}
      }
      setState(defaultExpensesState(weekStartDate));
    }
  }, [weekStartDate]);

  useEffect(() => {
    localStorage.setItem('expenses-state', JSON.stringify(state));
  }, [state]);

  const addExpense = () => {
    setState(s => ({
      ...s,
      items: [...s.items, {
        id: Date.now().toString(),
        date: weekStartDate,
        category: EXPENSE_CATEGORIES[0],
        description: '',
        amount: 0,
        includesVat: true,
        receipt: false,
      }],
    }));
  };

  const updateExpense = (id: string, updates: Partial<ExpenseItem>) => {
    setState(s => ({
      ...s,
      items: s.items.map(item => item.id === id ? { ...item, ...updates } : item),
    }));
  };

  const removeExpense = (id: string) => {
    setState(s => ({
      ...s,
      items: s.items.filter(item => item.id !== id),
    }));
  };

  const clearExpenses = () => {
    setState(defaultExpensesState(weekStartDate));
  };

  const totals = state.items.reduce((acc, item) => {
    const v = calcVat(item.amount || 0, item.includesVat);
    return { net: acc.net + v.net, vat: acc.vat + v.vat, gross: acc.gross + v.gross };
  }, { net: 0, vat: 0, gross: 0 });

  return { expenses: state, addExpense, updateExpense, removeExpense, clearExpenses, totals, categories: EXPENSE_CATEGORIES };
}
