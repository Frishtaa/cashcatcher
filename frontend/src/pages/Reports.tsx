import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ApiTransaction, ApiCategory } from '../api';
import { Settings } from '../types';
import { T, translateCategoryName } from '../i18n';
import { formatCurrency } from '../utils';
import { format, subMonths } from 'date-fns';

interface Props {
  transactions: ApiTransaction[];
  categories: ApiCategory[];
  settings: Settings;
  t: T;
}

export default function Reports({ transactions, categories, settings, t }: Props) {
  const [months, setMonths] = useState(6);
  const fmt  = (n: number) => formatCurrency(n, settings.currency);
  const dark = settings.darkMode;
  const ttStyle    = { background: dark?'#1a1917':'#ffffff', border:`1px solid ${dark?'#2e2c29':'#e8e4de'}`, borderRadius:10, fontSize:13, color:dark?'#f5f3f0':'#1a1714' };
  const itemStyle  = { color: dark?'#a09c97':'#6b6560' };
  const labelStyle = { color: dark?'#f5f3f0':'#1a1714', fontWeight:600 };

  const monthlyData = useMemo(() => Array.from({ length: months }, (_, i) => {
    const date  = subMonths(new Date(), months-1-i);
    const month = format(date, 'yyyy-MM');
    const mTx   = transactions.filter(tx => tx.date?.startsWith(month));
    const income   = mTx.filter(tx => tx.type==='income').reduce((s,tx) => s+tx.amount, 0);
    const expenses = mTx.filter(tx => tx.type==='expense').reduce((s,tx) => s+tx.amount, 0);
    return { name: format(date,'MMM yy'), income, expenses, savings: income-expenses };
  }), [transactions, months]);

  const catBreakdown = useMemo(() => {
    const map: Record<string,number> = {};
    const cutoff = format(subMonths(new Date(), months-1), 'yyyy-MM');
    transactions.filter(tx => tx.type==='expense' && tx.date >= cutoff)
      .forEach(tx => { map[tx.category_id] = (map[tx.category_id]||0)+tx.amount; });
    return Object.entries(map).map(([id, amount]) => {
      const cat = categories.find(c => c.id === id);
      return { name: cat ? `${cat.icon} ${translateCategoryName(cat.name, t)}` : 'Unknown', value: amount, color: cat?.color||'#6b7280' };

    }).sort((a,b) => b.value-a.value);
  }, [transactions, categories, months]);

  const totals = useMemo(() => {
    const income   = monthlyData.reduce((s,d) => s+d.income,   0);
    const expenses = monthlyData.reduce((s,d) => s+d.expenses, 0);
    return { income, expenses, savings: income-expenses, savingsRate: income>0 ? ((income-expenses)/income)*100 : 0 };
  }, [monthlyData]);

  const monthOptions = [
    { value: 3,  label: t.last3Months },
    { value: 6,  label: t.last6Months },
    { value: 12, label: t.last12Months },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.reports}</h1>
          <p className="page-subtitle">{t.reportsSubtitle}</p>
        </div>
        <select className="form-select" style={{ width: 'auto' }} value={months} onChange={e => setMonths(+e.target.value)}>
          {monthOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card"><div className="stat-label">{t.totalIncome}</div><div className="stat-value" style={{ color:'var(--green)' }}>{fmt(totals.income)}</div><div className="stat-meta">{t.lastMonths} {months} {t.months}</div></div>
        <div className="stat-card"><div className="stat-label">{t.totalExpenses}</div><div className="stat-value" style={{ color:'var(--red)' }}>{fmt(totals.expenses)}</div><div className="stat-meta">{t.lastMonths} {months} {t.months}</div></div>
        <div className="stat-card"><div className="stat-label">{t.netSavings}</div><div className="stat-value" style={{ color:totals.savings>=0?'var(--green)':'var(--red)' }}>{fmt(totals.savings)}</div><div className="stat-meta">{t.lastMonths} {months} {t.months}</div></div>
        <div className="stat-card"><div className="stat-label">{t.savingsRate}</div><div className="stat-value" style={{ color:totals.savingsRate>=0?'var(--green)':'var(--red)' }}>{totals.savingsRate.toFixed(1)}%</div><div className="stat-meta">{t.ofTotalIncome}</div></div>
      </div>

      <div className="charts-row">
        <div className="card">
          <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, marginBottom:20 }}>{t.incomeVsExpenses}</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData} barGap={4}>
              <XAxis dataKey="name" tick={{ fontSize:12, fill:'var(--text3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:11, fill:'var(--text3)' }} axisLine={false} tickLine={false} tickFormatter={v => v>=1000?`${(v/1000).toFixed(0)}k`:String(v)} />
              <Tooltip formatter={(v:number) => fmt(v)} contentStyle={ttStyle} itemStyle={itemStyle} labelStyle={labelStyle} />
              <Bar dataKey="income"   fill="#16a34a" radius={[4,4,0,0]} name={t.income} />
              <Bar dataKey="expenses" fill="#dc2626" radius={[4,4,0,0]} name={t.expense} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, marginBottom:20 }}>{t.expenseBreakdown}</h3>
          {catBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <Pie data={catBreakdown} cx="50%" cy="42%" outerRadius="70%" paddingAngle={2} dataKey="value">
                  {catBreakdown.map((e,i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v:number) => fmt(v)} contentStyle={ttStyle} itemStyle={itemStyle} labelStyle={labelStyle} />
                <Legend wrapperStyle={{ paddingTop: 8 }} formatter={v => <span style={{ fontSize:12, color:dark?'#a09c97':'#6b6560' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><div className="empty-state-icon">📊</div><p>{t.noExpenseData}</p></div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, marginBottom:20 }}>{t.monthlySavings}</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthlyData}>
            <XAxis dataKey="name" tick={{ fontSize:12, fill:'var(--text3)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize:11, fill:'var(--text3)' }} axisLine={false} tickLine={false} tickFormatter={v => v>=1000?`${(v/1000).toFixed(0)}k`:String(v)} />
            <Tooltip formatter={(v:number) => fmt(v)} contentStyle={ttStyle} itemStyle={itemStyle} labelStyle={labelStyle} />
            <Bar dataKey="savings" name={t.netSavings} radius={[4,4,0,0]}>
              {monthlyData.map((e,i) => <Cell key={i} fill={e.savings>=0?'#16a34a':'#dc2626'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
