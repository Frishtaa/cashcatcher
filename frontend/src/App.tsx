import { useState, useEffect } from 'react';
import { LayoutDashboard, ArrowLeftRight, Tag, PiggyBank, BarChart3, Sun, Moon, LogOut, User, Loader2 } from 'lucide-react';
import { useApi } from './Useapi';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Categories from './pages/Categories';
import Budgets from './pages/Budgets';
import Reports from './pages/Reports';
import TransactionModal from './components/TransactionModal';
import LangSwitcher from './components/LangSwitcher';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ResetPassword from './pages/ResetPassword';
import { ApiTransaction, ApiCategory } from './api';
import { Language } from './types';
import { useT, isRTL } from './i18n';
import logoUrl from './assets/cashcatcher-logo.jpg';

type Page = 'dashboard' | 'transactions' | 'categories' | 'budgets' | 'reports';

export default function App() {
  const api = useApi();
  const lang = api.settings?.language ?? 'en';
  const t    = useT(lang);
  const rtl  = isRTL(lang);

  const [page,         setPage]         = useState<Page>('dashboard');
  const [showModal,    setShowModal]     = useState(false);
  const [editingTx,    setEditingTx]     = useState<ApiTransaction | null>(null);
  const [sidebarOpen,  setSidebarOpen]   = useState(false);
  const [authError,    setAuthError]     = useState('');
  const [authView, setAuthView] = useState<'login' | 'signup' | 'reset-password'>('login');

  // Check if we're on a password reset link on first load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('token') && params.get('email')) {
      setAuthView('reset-password');
    }
  }, []);

  // Dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', api.settings?.darkMode ?? false);
  }, [api.settings?.darkMode]);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const toggleDark = () => api.updateSettings({ darkMode: !api.settings.darkMode });
  const setLang = (l: Language) => { api.updateSettings({ language: l }); };
  const navigate = (p: Page) => { setPage(p); setSidebarOpen(false); };

  const mapAuthError = (msg: string, isSignup = false): string => {
    const m = msg.toLowerCase();
    // Wrong password / invalid credentials
    if (m.includes('credentials') || m.includes('password is incorrect') || m.includes('invalid password') || m.includes('wrong password')) {
      return t.errWrongPassword;
    }
    // Email not found
    if (m.includes('not found') || m.includes('no account') || m.includes('user not found') || m.includes('does not exist')) {
      return t.errEmailNotFound;
    }
    // Email already in use (signup)
    if (m.includes('already') || m.includes('taken') || m.includes('exists') || m.includes('duplicate') || m.includes('has already been taken')) {
      return t.errEmailInUse;
    }
    // Invalid email format
    if (m.includes('invalid email') || m.includes('email is invalid') || m.includes('valid email')) {
      return t.errInvalidEmail;
    }
    // Weak password from server
    if (m.includes('password') && (m.includes('least') || m.includes('short') || m.includes('characters') || m.includes('minimum'))) {
      return t.errWeakPassword;
    }
    return isSignup ? t.errGenericSignup : t.errGenericLogin;
  };

  // ── Auth handlers ──────────────────────────────────────────
  const handleLogin = async (email: string, password: string) => {
    setAuthError('');
    try { await api.login(email, password); }
    catch (e: unknown) { setAuthError(mapAuthError(e instanceof Error ? e.message : '', false)); }
  };

  const handleSignup = async (name: string, email: string, password: string) => {
    console.log('handleSignup received password:', password);
    setAuthError('');
    try { await api.register(name, email, password); }
    catch (e: unknown) { setAuthError(mapAuthError(e instanceof Error ? e.message : '', true)); }
  };

  const handleForgotPassword = async (email: string) => {
    return api.forgotPassword(email);
  };

  const handleResetPassword = async (token: string, email: string, password: string, passwordConfirmation: string) => {
    return api.resetPassword(token, email, password, passwordConfirmation);
  };

  const handleLogout = async () => {
    await api.logout();
    setPage('dashboard');
    setAuthView('login');
  };

  // ── Transaction handlers ───────────────────────────────────
  const handleSave = async (data: Omit<ApiTransaction, 'id' | 'category'>) => {
    if (editingTx) await api.editTransaction(editingTx.id, data);
    else           await api.addTransaction(data);
    setShowModal(false);
    setEditingTx(null);
  };

  const handleDelete = async (id: string) => { await api.deleteTransaction(id); };
  const handleBulkDelete = async (ids: string[]) => { await api.bulkDeleteTransactions(ids); };

  const handleAddCat = async (c: Omit<ApiCategory, 'id'>) => { await api.addCategory(c); };
  const handleDelCat = async (id: string) => { await api.deleteCategory(id); };

  const handleSetBudget = async (data: { category_id: string; amount: number; month: string }) => {
    await api.setBudget(data);
  };

  // ── Shared UI components ───────────────────────────────────
  const ThemeBtn = () => (
      <button className="theme-toggle" onClick={toggleDark} aria-label="Toggle theme">
        {api.settings.darkMode ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
      </button>
  );

  // ── Loading spinner while checking auth ────────────────────
  if (api.authState === 'loading') {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', flexDirection: 'column', gap: 16 }}>
          <img src={logoUrl} alt="Ca$hCatcher" style={{ width: 92, height: 54, objectFit: 'contain' }} />
          <Loader2 size={24} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
        </div>
    );
  }

  // ── Auth screens ───────────────────────────────────────────
  if (api.authState !== 'authed') {
    const authDir = rtl ? 'rtl' : 'ltr';
    if (authView === 'reset-password') {
      return <div dir={authDir} style={{ fontFamily: 'inherit' }}><ResetPassword
          onResetPassword={handleResetPassword}
          onBackToLogin={() => { setAuthView('login'); window.history.replaceState({}, '', window.location.pathname); }}
          darkMode={api.settings.darkMode}
          toggleDark={toggleDark}
          t={t}
          langBtn={<LangSwitcher lang={lang} onChange={setLang} />}
      /></div>;
    }
    if (authView === 'login') {
      return <div dir={authDir} style={{ fontFamily: 'inherit' }}><Login
          onLogin={handleLogin}
          onSignup={() => { setAuthView('signup'); setAuthError(''); }}
          onSkip={() => api.enterAsGuest()}
          onForgotPassword={handleForgotPassword}
          darkMode={api.settings.darkMode}
          toggleDark={toggleDark}
          t={t}
          error={authError}
          loading={api.loading}
          langBtn={<LangSwitcher lang={lang} onChange={setLang} />}
      /></div>;
    }
    return <div dir={authDir} style={{ fontFamily: 'inherit' }}><Signup
        onSignup={handleSignup}
        onLogin={() => { setAuthView('login'); setAuthError(''); }}
        onSkip={() => api.enterAsGuest()}
        darkMode={api.settings.darkMode}
        toggleDark={toggleDark}
        t={t}
        error={authError}
        loading={api.loading}
        langBtn={<LangSwitcher lang={lang} onChange={setLang} />}
    /></div>;
  }

  const NAV = [
    { id: 'dashboard',    label: t.dashboard,    icon: LayoutDashboard },
    { id: 'transactions', label: t.transactions, icon: ArrowLeftRight },
    { id: 'categories',   label: t.categories,   icon: Tag },
    { id: 'budgets',      label: t.budgets,      icon: PiggyBank },
    { id: 'reports',      label: t.reports,      icon: BarChart3 },
  ] as const;

  return (
      <div className={`app-layout${rtl ? ' rtl' : ''}`} dir={rtl ? 'rtl' : 'ltr'}>

        {/* Mobile header */}
        <header className="mobile-header" dir="ltr">
          <div className="mobile-header-actions">
            <LangSwitcher lang={lang} onChange={setLang} />
            <ThemeBtn />
          </div>
          <div className="mobile-logo"><img src={logoUrl} alt="Ca$hCatcher" className="brand-logo" /></div>
          <button className={`burger-btn ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(v => !v)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </header>

        {/* Desktop top bar */}
        <div className="top-bar">
          <LangSwitcher lang={lang} onChange={setLang} />
          <ThemeBtn />
        </div>

        {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-logo">
            <div className="logo-mark"><img src={logoUrl} alt="Ca$hCatcher" className="brand-logo" /></div>
          </div>
          <nav className="sidebar-nav">
            {NAV.map((item, i) => (
                <button
                    key={item.id}
                    className={`nav-item ${page === item.id ? 'active' : ''}`}
                    onClick={() => navigate(item.id as Page)}
                    style={{ ['--i' as string]: i }}
                >
                  <item.icon size={18} />{item.label}
                </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div style={{ padding: '12px', borderRadius: 10, background: 'var(--bg3)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={16} color="white" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {api.currentUser?.name ?? t.guest}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {api.currentUser ? api.currentUser.email : t.notSignedIn}
                </div>
              </div>
              <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex', padding: 4, borderRadius: 6, transition: 'color 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}>
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </aside>

        <main className="main-content">
          {api.loading && (
              <div style={{ position: 'fixed', top: 68, right: 90, zIndex: 999 }}>
                <Loader2 size={18} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
              </div>
          )}

          {page === 'dashboard' && (
              <Dashboard
                  transactions={api.transactions}
                  categories={api.categories}
                  settings={api.settings}
                  onAddTransaction={() => { setEditingTx(null); setShowModal(true); }}
                  t={t}
              />
          )}
          {page === 'transactions' && (
              <Transactions
                  transactions={api.transactions}
                  categories={api.categories}
                  settings={api.settings}
                  onDelete={handleDelete}
                  onBulkDelete={handleBulkDelete}
                  onEdit={(tx) => { setEditingTx(tx); setShowModal(true); }}
                  onAdd={() => { setEditingTx(null); setShowModal(true); }}
                  t={t}
              />
          )}
          {page === 'categories' && (
              <Categories
                  categories={api.categories}
                  onAdd={handleAddCat}
                  onDelete={handleDelCat}
                  t={t}
              />
          )}
          {page === 'budgets' && (
              <Budgets
                  budgets={api.budgets}
                  categories={api.categories}
                  transactions={api.transactions}
                  settings={api.settings}
                  onSetBudget={handleSetBudget}
                  t={t}
              />
          )}
          {page === 'reports' && (
              <Reports
                  transactions={api.transactions}
                  categories={api.categories}
                  settings={api.settings}
                  t={t}
              />
          )}
        </main>

        {showModal && (
            <TransactionModal
                categories={api.categories}
                onSave={handleSave}
                onClose={() => { setShowModal(false); setEditingTx(null); }}
                editing={editingTx}
                t={t}
            />
        )}
      </div>
  );
}
