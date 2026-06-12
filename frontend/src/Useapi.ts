import { useState, useEffect, useCallback } from 'react';
import { authApi, txApi, catApi, budgetApi, setToken, clearToken, ApiUser, ApiTransaction, ApiCategory, ApiBudget } from './api';
import { Settings, Language, Currency } from './types';

export type AuthState = 'loading' | 'guest' | 'authed';

export function useApi() {
    const [authState, setAuthState]       = useState<AuthState>('loading');
    const [currentUser, setCurrentUser]   = useState<ApiUser | null>(null);
    const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
    const [categories, setCategories]     = useState<ApiCategory[]>([]);
    const [budgets, setBudgets]           = useState<ApiBudget[]>([]);
    const [loading, setLoading]           = useState(false);
    const [error, setError]               = useState<string | null>(null);

    const [localSettings, setLocalSettings] = useState<Settings>(() => {
        try {
            const s = localStorage.getItem('cashcatcher_settings');
            return s ? { currency: 'IQD', darkMode: false, language: 'en', ...JSON.parse(s) } : { currency: 'IQD', darkMode: false, language: 'en' };
        } catch { return { currency: 'IQD', darkMode: false, language: 'en' }; }
    });

    const settings = localSettings;

    useEffect(() => {
        const token = localStorage.getItem('cashcatcher_token');
        if (!token) { setAuthState('guest'); return; }
        authApi.me()
            .then(({ user }) => { setCurrentUser(user); setAuthState('authed'); })
            .catch(() => { clearToken(); setAuthState('guest'); });
    }, []);

    useEffect(() => {
        if (authState === 'authed') refreshAll();
    }, [authState]);

    const refreshAll = useCallback(async () => {
        setLoading(true);
        try {
            const [txRes, catRes, budgetRes] = await Promise.all([
                txApi.list(),
                catApi.list(),
                budgetApi.list(),
            ]);
            setTransactions(txRes.data);
            setCategories(catRes.data);
            setBudgets(budgetRes.data);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        setLoading(true); setError(null);
        try {
            const { user, token } = await authApi.login(email, password);
            setToken(token);
            setCurrentUser(user);
            setAuthState('authed');
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Login failed');
            throw e;
        } finally { setLoading(false); }
    };

    const register = async (name: string, email: string, password: string) => {
        setLoading(true); setError(null);
        try {
            const { user, token } = await authApi.register(name, email, password);
            setToken(token);
            setCurrentUser(user);
            setAuthState('authed');
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Registration failed');
            throw e;
        } finally { setLoading(false); }
    };

    const logout = async () => {
        try { await authApi.logout(); } catch {}
        clearToken();
        setCurrentUser(null);
        setTransactions([]);
        setCategories([]);
        setBudgets([]);
        setAuthState('guest');
    };

    const forgotPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
        try {
            const res = await authApi.forgotPassword(email);
            return { success: true, message: res.message };
        } catch (e: unknown) {
            return { success: false, message: e instanceof Error ? e.message : 'Something went wrong.' };
        }
    };

    const resetPassword = async (token: string, email: string, password: string, passwordConfirmation: string): Promise<{ success: boolean; message: string }> => {
        try {
            const res = await authApi.resetPassword(token, email, password, passwordConfirmation);
            return { success: true, message: res.message };
        } catch (e: unknown) {
            return { success: false, message: e instanceof Error ? e.message : 'Something went wrong.' };
        }
    };

    const enterAsGuest = () => setAuthState('guest');

    const updateSettings = async (s: Partial<Settings>) => {
        const next = { ...localSettings, ...s };
        setLocalSettings(next);
        localStorage.setItem('cashcatcher_settings', JSON.stringify(next));

        if (authState === 'authed' && currentUser) {
            try {
                if (s.language) {
                    await authApi.updateSettings({ language: s.language });
                }
            } catch {}
        }
    };

    const addTransaction = async (data: Omit<ApiTransaction, 'id' | 'category'>) => {
        if (authState !== 'authed') {
            const fake: ApiTransaction = { ...data, id: Date.now().toString() };
            setTransactions(prev => [fake, ...prev]);
            saveGuestData('transactions', [fake, ...transactions]);
            return;
        }
        try {
            const { data: tx } = await txApi.create(data);
            setTransactions(prev => [tx, ...prev]);
        } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed'); throw e; }
    };

    const editTransaction = async (id: string, data: Partial<ApiTransaction>) => {
        if (authState !== 'authed') {
            setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
            return;
        }
        try {
            const { data: tx } = await txApi.update(id, data);
            setTransactions(prev => prev.map(t => t.id === id ? tx : t));
        } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed'); throw e; }
    };

    const deleteTransaction = async (id: string) => {
        setTransactions(prev => prev.filter(t => t.id !== id));
        if (authState !== 'authed') return;
        try { await txApi.delete(id); } catch {}
    };

    const bulkDeleteTransactions = async (ids: string[]) => {
        setTransactions(prev => prev.filter(t => !ids.includes(t.id)));
        if (authState !== 'authed') return;
        try { await txApi.bulkDelete(ids); } catch {}
    };

    const addCategory = async (data: Omit<ApiCategory, 'id'>) => {
        if (authState !== 'authed') {
            const fake: ApiCategory = { ...data, id: Date.now().toString() };
            setCategories(prev => [...prev, fake]);
            return;
        }
        try {
            const { data: cat } = await catApi.create(data);
            setCategories(prev => [...prev, cat]);
        } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed'); throw e; }
    };

    const deleteCategory = async (id: string) => {
        setCategories(prev => prev.filter(c => c.id !== id));
        if (authState !== 'authed') return;
        try { await catApi.delete(id); } catch {}
    };

    const setBudget = async (data: { category_id: string; amount: number; month: string }) => {
        if (authState !== 'authed') {
            const existing = budgets.find(b => b.category_id === data.category_id && b.month === data.month);
            if (existing) setBudgets(prev => prev.map(b => b.id === existing.id ? { ...b, amount: data.amount } : b));
            else setBudgets(prev => [...prev, { ...data, id: Date.now().toString() }]);
            return;
        }
        try {
            const { data: budget } = await budgetApi.upsert(data);
            setBudgets(prev => {
                const existing = prev.find(b => b.category_id === budget.category_id && b.month === budget.month);
                if (existing) return prev.map(b => b.id === existing.id ? budget : b);
                return [...prev, budget];
            });
        } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed'); throw e; }
    };

    function saveGuestData(key: string, data: unknown) {
        localStorage.setItem(`cashcatcher_${key}`, JSON.stringify(data));
    }

    useEffect(() => {
        if (authState === 'guest') {
            try {
                const tx  = localStorage.getItem('cashcatcher_guest_transactions');
                const cat = localStorage.getItem('cashcatcher_guest_categories');
                const bud = localStorage.getItem('cashcatcher_guest_budgets');
                if (tx)  setTransactions(JSON.parse(tx));
                if (cat) setCategories(JSON.parse(cat));
                if (bud) setBudgets(JSON.parse(bud));

                if (!cat) {
                    import('./hooks/useStore').then(({ getDefaultCategories }) => {
                        const defaults = getDefaultCategories('en');
                        const apiCats: ApiCategory[] = defaults.map(d => ({ id: d.id, name: d.name, type: d.type, color: d.color, icon: d.icon }));
                        setCategories(apiCats);
                    });
                }
            } catch {}
        }
    }, [authState]);

    useEffect(() => {
        if (authState === 'guest') {
            localStorage.setItem('cashcatcher_guest_transactions', JSON.stringify(transactions));
            localStorage.setItem('cashcatcher_guest_categories',   JSON.stringify(categories));
            localStorage.setItem('cashcatcher_guest_budgets',      JSON.stringify(budgets));
        }
    }, [authState, transactions, categories, budgets]);

    return {
        authState, currentUser, loading, error, settings,
        transactions, categories, budgets,
        login, register, logout, enterAsGuest,
        forgotPassword, resetPassword,
        updateSettings,
        addTransaction, editTransaction, deleteTransaction, bulkDeleteTransactions,
        addCategory, deleteCategory,
        setBudget,
        refreshAll,
    };
}