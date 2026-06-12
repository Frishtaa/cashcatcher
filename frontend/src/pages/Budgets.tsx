import { useMemo, useState } from 'react';
import { ApiCategory, ApiTransaction, ApiBudget } from '../api';
import { Settings } from '../types';
import { T, translateCategoryName } from '../i18n';
import { formatCurrency, getCurrentMonth, getMonthLabel } from '../utils';

interface Props {
  budgets: ApiBudget[];
  categories: ApiCategory[];
  transactions: ApiTransaction[];
  settings: Settings;
  onSetBudget: (d: { category_id: string; amount: number; month: string }) => void;
  t: T;
}

export default function Budgets({ budgets, categories, transactions, settings, onSetBudget, t }: Props) {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [editCat,    setEditCat]    = useState<string|null>(null);
  const [editAmount, setEditAmount] = useState('');

  const fmt = (n: number) => formatCurrency(n, settings.currency);
  const expCats = categories.filter(c => c.type === 'expense');

  const data = useMemo(() => expCats.map(cat => {
    const budget = budgets.find(b => b.category_id === cat.id && b.month === selectedMonth);
    const spent  = transactions
      .filter(tx => tx.type === 'expense' && tx.category_id === cat.id && tx.date?.startsWith(selectedMonth))
      .reduce((s, tx) => s + tx.amount, 0);
    const budgetAmt = budget?.amount || 0;
    const pct = budgetAmt > 0 ? Math.min((spent/budgetAmt)*100, 100) : 0;
    return { cat, budget: budgetAmt, spent, pct };
  }), [expCats, budgets, transactions, selectedMonth]);

  const totalBudget = data.reduce((s,d) => s+d.budget, 0);
  const totalSpent  = data.reduce((s,d) => s+d.spent,  0);

  const handleSave = (catId: string) => {
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount < 0) return;
    onSetBudget({ category_id: catId, amount, month: selectedMonth });
    setEditCat(null); setEditAmount('');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.budgets}</h1>
          <p className="page-subtitle">{t.budgetsSubtitle}</p>
        </div>
        <input type="month" className="form-input" style={{ width: 'auto' }} value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">{t.totalBudget}</div>
          <div className="stat-value">{fmt(totalBudget)}</div>
          <div className="stat-meta">{getMonthLabel(selectedMonth)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t.totalSpent}</div>
          <div className="stat-value" style={{ color: totalSpent>totalBudget?'var(--red)':'var(--text)' }}>{fmt(totalSpent)}</div>
          <div className="stat-meta">{getMonthLabel(selectedMonth)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t.remaining}</div>
          <div className="stat-value" style={{ color: totalBudget-totalSpent<0?'var(--red)':'var(--green)' }}>{fmt(totalBudget-totalSpent)}</div>
          <div className="stat-meta">{getMonthLabel(selectedMonth)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data.map(({ cat, budget, spent, pct }) => {
          const isOver    = spent > budget && budget > 0;
          const isEditing = editCat === cat.id;
          return (
            <div key={cat.id} className="card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: cat.color+'22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{cat.icon}</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{translateCategoryName(cat.name, t)}</div>

                    <div style={{ fontSize: 13, color: 'var(--text2)' }}>{fmt(spent)} {t.spent} {budget>0 ? `${t.of} ${fmt(budget)}` : `— ${t.noBudgetSet}`}</div>

                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {isOver && <span style={{ fontSize: 12, color: 'var(--red)', fontWeight: 600 }}>{t.overBudget}</span>}
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input className="form-input" style={{ width: 120 }} type="number" placeholder={t.amountLabel} value={editAmount} onChange={e => setEditAmount(e.target.value)} onKeyDown={e => { if(e.key==='Enter') handleSave(cat.id); if(e.key==='Escape') setEditCat(null); }} autoFocus />
                      <button className="btn btn-primary btn-sm" onClick={() => handleSave(cat.id)}>{t.save}</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditCat(null)}>{t.cancel}</button>
                    </div>
                  ) : (
                    <button className="btn btn-secondary btn-sm" onClick={() => { setEditCat(cat.id); setEditAmount(budget>0?budget.toString():''); }}>
                      {budget>0 ? t.edit : t.setBudget}
                    </button>
                  )}
                </div>
              </div>
              {budget > 0 && (
                <div>
                  <div className="progress-bar-wrap">
                    <div className="progress-bar" style={{ width: `${pct}%`, background: isOver?'var(--red)':pct>80?'#f59e0b':cat.color }} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6, textAlign: 'right' }}>{pct.toFixed(0)}% {t.used}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
