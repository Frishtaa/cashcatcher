import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight } from 'lucide-react';
import { ApiTransaction, ApiCategory } from '../api';
import { Settings } from '../types';
import { T, translateCategoryName } from '../i18n';
import { formatCurrency, getMonthLabel } from '../utils';
import { format, subMonths } from 'date-fns';

interface Props {
  transactions: ApiTransaction[];
  categories: ApiCategory[];
  settings: Settings;
  onAddTransaction: () => void;
  t: T;
}

export default function Dashboard({ transactions, categories, settings, onAddTransaction, t }: Props) {
  const currentMonth = format(new Date(), 'yyyy-MM');
  const thisMonth = useMemo(() => transactions.filter(tx => tx.date?.startsWith(currentMonth)), [transactions, currentMonth]);
  const income   = useMemo(() => thisMonth.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0), [thisMonth]);
  const expenses = useMemo(() => thisMonth.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0), [thisMonth]);
  const balance  = income - expenses;

  const trendData = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const date  = subMonths(new Date(), 5 - i);
    const month = format(date, 'yyyy-MM');
    const mTx   = transactions.filter(tx => tx.date?.startsWith(month));
    return {
      name:     format(date, 'MMM'),
      income:   mTx.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0),
      expenses: mTx.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0),
    };
  }), [transactions]);

  const catData = useMemo(() => {
    const map: Record<string, number> = {};
    thisMonth.filter(tx => tx.type === 'expense').forEach(tx => {
      const key = tx.category_id;
      map[key] = (map[key] || 0) + tx.amount;
    });
    return Object.entries(map).map(([catId, amount]) => {
      const cat = categories.find(c => c.id === catId);
      return { name: translateCategoryName(cat?.name, t) || t.cat_other, value: amount, color: cat?.color || '#6b7280' };

    }).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [thisMonth, categories]);

  const fmt  = (n: number) => formatCurrency(n, settings.currency);
  const dark = settings.darkMode;
  const ttStyle    = { background: dark ? '#1a1917' : '#ffffff', border: `1px solid ${dark ? '#2e2c29' : '#e8e4de'}`, borderRadius: 10, fontSize: 13, color: dark ? '#f5f3f0' : '#1a1714' };
  const itemStyle  = { color: dark ? '#a09c97' : '#6b6560' };
  const labelStyle = { color: dark ? '#f5f3f0' : '#1a1714', fontWeight: 600 };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.dashboard}</h1>
          <p className="page-subtitle">{getMonthLabel(currentMonth)} {t.dashboardSubtitle}</p>
        </div>
        <button className="btn btn-primary" onClick={onAddTransaction}><ArrowUpRight size={16} />{t.addTransaction}</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">{t.balance}<div className="stat-icon" style={{ background: '#eff6ff' }}><Wallet size={16} color="#2563eb" /></div></div>
          <div className="stat-value" style={{ color: balance >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt(balance)}</div>
          <div className="stat-meta">{t.thisMonth}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t.totalIncome}<div className="stat-icon" style={{ background: '#dcfce7' }}><TrendingUp size={16} color="#16a34a" /></div></div>
          <div className="stat-value">{fmt(income)}</div>
          <div className="stat-meta">{t.thisMonth}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t.totalExpenses}<div className="stat-icon" style={{ background: '#fee2e2' }}><TrendingDown size={16} color="#dc2626" /></div></div>
          <div className="stat-value">{fmt(expenses)}</div>
          <div className="stat-meta">{t.thisMonth}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t.transactionsCount}<div className="stat-icon" style={{ background: '#fef3c7' }}><ArrowUpRight size={16} color="#d97706" /></div></div>
          <div className="stat-value">{thisMonth.length}</div>
          <div className="stat-meta">{t.thisMonth}</div>
        </div>
      </div>

      <div className="chart-grid">
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 20 }}>{t.monthlyTrend}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="incG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#16a34a" stopOpacity={0.15}/><stop offset="95%" stopColor="#16a34a" stopOpacity={0}/></linearGradient>
                <linearGradient id="expG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#dc2626" stopOpacity={0.15}/><stop offset="95%" stopColor="#dc2626" stopOpacity={0}/></linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
              <YAxis width={44} tickMargin={4} tick={{ fontSize: 11, fill: 'var(--text3)' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} />
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={ttStyle} itemStyle={itemStyle} labelStyle={labelStyle} />
              <Area type="monotone" dataKey="income"   stroke="#16a34a" strokeWidth={2} fill="url(#incG)" name={t.income} />
              <Area type="monotone" dataKey="expenses" stroke="#dc2626" strokeWidth={2} fill="url(#expG)" name={t.expense} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 20 }}>{t.expensesByCategory}</h3>
          {catData.length > 0 ? (<>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                  {catData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={ttStyle} itemStyle={itemStyle} labelStyle={labelStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {catData.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: d.color }} />
                    <span style={{ color: 'var(--text2)' }}>{d.name}</span>
                  </div>
                  <span style={{ fontWeight: 600 }}>{fmt(d.value)}</span>
                </div>
              ))}
            </div>
          </>) : (
            <div className="empty-state"><div className="empty-state-icon">🥧</div><p className="empty-state-title">{t.noExpenses}</p></div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>{t.recentTransactions}</h3>
        {transactions.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📭</div><p className="empty-state-title">{t.noTransactions}</p><p>{t.noTransactionsDesc}</p></div>
        ) : (
          <div className="table-wrap">
            <table className="tx-table">
              <thead><tr><th>{t.description}</th><th>{t.category}</th><th>{t.date}</th><th>{t.type}</th><th style={{ textAlign: 'right' }}>{t.amount}</th></tr></thead>
              <tbody>
                {transactions.slice(0, 5).map(tx => {
                  const cat = categories.find(c => c.id === tx.category_id);
                  return (
                    <tr key={tx.id}>
                      <td className="tx-desc">{tx.recurring && <span className="recurring-dot" />}{tx.description}</td>
                      <td><span className="cat-pill">{cat?.icon} {translateCategoryName(cat?.name, t) || '—'}</span></td>

                      <td className="tx-date" style={{ color: 'var(--text2)' }}>{tx.date}</td>
                      <td><span className={`badge badge-${tx.type}`}>{tx.type === 'income' ? t.income : t.expense}</span></td>
                      <td className="tx-amt" style={{ textAlign: 'right', fontWeight: 700, color: tx.type === 'income' ? 'var(--green)' : 'var(--red)' }}>
                        {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
