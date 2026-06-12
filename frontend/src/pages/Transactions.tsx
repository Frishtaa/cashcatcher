import { useState, useMemo } from 'react';
import { Trash2, Edit2, Download, Search, RefreshCw, CheckSquare, Square, XSquare } from 'lucide-react';
import { ApiTransaction, ApiCategory } from '../api';
import { Settings } from '../types';
import { T, translateCategoryName } from '../i18n';
import { formatCurrency, exportToCSV, exportToPDF } from '../utils';
import { format } from 'date-fns';

interface Props {
  transactions: ApiTransaction[];
  categories: ApiCategory[];
  settings: Settings;
  onDelete: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onEdit: (t: ApiTransaction) => void;
  onAdd: () => void;
  t: T;
}

export default function Transactions({ transactions, categories, settings, onDelete, onBulkDelete, onEdit, onAdd, t }: Props) {
  const [search,     setSearch]     = useState('');
  const [filterType, setFilterType] = useState<'all'|'income'|'expense'>('all');
  const [filterMonth,setFilterMonth]= useState('');
  const [filterCat,  setFilterCat]  = useState('');
  const [selected,   setSelected]   = useState<Set<string>>(new Set());
  const [showExport, setShowExport] = useState(false);

  const fmt = (n: number) => formatCurrency(n, settings.currency);

  const filtered = useMemo(() => transactions.filter(tx => {
    if (filterType  !== 'all' && tx.type !== filterType) return false;
    if (filterMonth && !tx.date?.startsWith(filterMonth)) return false;
    if (filterCat   && tx.category_id !== filterCat) return false;
    if (search      && !tx.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [transactions, filterType, filterMonth, filterCat, search]);

  const allSelected  = filtered.length > 0 && filtered.every(tx => selected.has(tx.id));
  const someSelected = filtered.some(tx => selected.has(tx.id));

  const toggleOne = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => {
    if (allSelected) setSelected(prev => { const n = new Set(prev); filtered.forEach(tx => n.delete(tx.id)); return n; });
    else             setSelected(prev => { const n = new Set(prev); filtered.forEach(tx => n.add(tx.id)); return n; });
  };
  const deleteSelected = () => {
    if (window.confirm(`${t.deleteConfirm} ${selected.size} ${t.transactionsQ}`)) {
      onBulkDelete(Array.from(selected));
      setSelected(new Set());
    }
  };

  const getExportRows = () => filtered.map(tx => ({
    [t.date]:        tx.date,
    [t.type]:        tx.type === 'income' ? t.income : t.expense,
    [t.description]: tx.description,
    [t.category]:    translateCategoryName(categories.find(c => c.id === tx.category_id)?.name, t),

    [t.amount]:      tx.amount,
    Currency:        settings.currency,
  }));

  const handleExportCSV = () => { exportToCSV(getExportRows() as Record<string,unknown>[], `cashcatcher-${format(new Date(),'yyyy-MM-dd')}.csv`); setShowExport(false); };
  const handleExportPDF = () => { exportToPDF(getExportRows() as Record<string,unknown>[], 'Ca$hCatcher — Transactions'); setShowExport(false); };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.transactions}</h1>
          <p className="page-subtitle">{filtered.length} {t.of} {transactions.length} {t.transactionsSubtitle}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div className="export-wrap">
            <button className="btn btn-secondary" onClick={() => setShowExport(v => !v)}><Download size={15}/>{t.export} <span style={{ fontSize: 11 }}>▾</span></button>
            {showExport && (
              <div className="export-menu" style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 200, overflow: 'hidden' }}>
                <button onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text)', fontFamily: 'var(--font-body)' }}
                  onMouseEnter={e=>(e.currentTarget.style.background='var(--bg3)')} onMouseLeave={e=>(e.currentTarget.style.background='none')}>
                  📊 {t.exportCSV}
                </button>
                <div style={{ height: 1, background: 'var(--border)' }} />
                <button onClick={handleExportPDF} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text)', fontFamily: 'var(--font-body)' }}
                  onMouseEnter={e=>(e.currentTarget.style.background='var(--bg3)')} onMouseLeave={e=>(e.currentTarget.style.background='none')}>
                  📄 {t.exportPDF}
                </button>
              </div>
            )}
          </div>
          <button className="btn btn-primary" onClick={onAdd}>+ {t.addTransaction}</button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-bar-search">
          <Search size={16} />
          <input className="form-input" placeholder={t.search} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filter-bar-row">
          <div className="filter-chip">
            <select className="form-select" value={filterType} onChange={e => setFilterType(e.target.value as 'all'|'income'|'expense')}>
              <option value="all">{t.allTypes}</option>
              <option value="income">{t.income}</option>
              <option value="expense">{t.expense}</option>
            </select>
          </div>
          <div className="filter-chip">
            <input type="month" className="form-input" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} />
          </div>
          <div className="filter-chip">
            <select className="form-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
              <option value="">{t.allCategories}</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {translateCategoryName(c.name, t)}</option>)}
            </select>
          </div>
          {(search || filterType !== 'all' || filterMonth || filterCat) && (
            <button className="btn btn-ghost btn-sm filter-bar-clear" onClick={() => { setSearch(''); setFilterType('all'); setFilterMonth(''); setFilterCat(''); }}>{t.clearFilters}</button>
          )}
        </div>
      </div>

      {someSelected && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'rgba(232,99,42,0.08)', border: '1px solid rgba(232,99,42,0.2)', borderRadius: 10, marginBottom: 12, fontSize: 14 }}>
          <CheckSquare size={16} color="var(--accent)" />
          <span style={{ fontWeight: 500 }}>{selected.size} {t.selected}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())} style={{ marginLeft: 'auto' }}><XSquare size={14}/>{t.clearSelection}</button>
          <button className="btn btn-danger btn-sm" onClick={deleteSelected}><Trash2 size={14}/>{t.deleteSelected}</button>
        </div>
      )}

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🔍</div><p className="empty-state-title">{t.noTransactionsFound}</p><p>{t.adjustFilters}</p></div>
        ) : (
          <div className="table-wrap">
            <table className="tx-table tx-table-rich">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <button onClick={toggleAll} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex', alignItems: 'center' }}>
                      {allSelected ? <CheckSquare size={16} color="var(--accent)"/> : <Square size={16}/>}
                    </button>
                  </th>
                  <th>{t.description}</th><th>{t.category}</th><th>{t.date}</th><th>{t.type}</th>
                  <th style={{ textAlign: 'end' }}>{t.amount}</th><th style={{ width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(tx => {
                  const cat  = categories.find(c => c.id === tx.category_id);
                  const isSel = selected.has(tx.id);
                  return (
                    <tr key={tx.id} className={isSel ? 'is-selected' : ''}>
                      <td className="tx-check">
                        <button onClick={() => toggleOne(tx.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isSel ? 'var(--accent)' : 'var(--text3)', display: 'flex', alignItems: 'center' }}>
                          {isSel ? <CheckSquare size={16}/> : <Square size={16}/>}
                        </button>
                      </td>
                      <td className="tx-desc">{tx.recurring && <span title="Recurring" style={{ marginRight: 6 }}><RefreshCw size={12} color="var(--accent2)"/></span>}{tx.description}</td>
                      <td><span className="cat-pill">{cat?.icon} {translateCategoryName(cat?.name, t) || '—'}</span></td>

                      <td className="tx-date" style={{ color: 'var(--text2)' }}>{tx.date}</td>
                      <td><span className={`badge badge-${tx.type}`}>{tx.type === 'income' ? t.income : t.expense}</span></td>
                      <td className="tx-amt" style={{ textAlign: 'end', fontWeight: 700, color: tx.type === 'income' ? 'var(--green)' : 'var(--red)' }}>
                        {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                      </td>
                      <td className="tx-actions">
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }} dir="ltr">
                          <button className="btn btn-ghost btn-sm" onClick={() => onEdit(tx)}><Edit2 size={14}/></button>
                          <button className="btn btn-danger btn-sm" onClick={() => onDelete(tx.id)}><Trash2 size={14}/></button>
                        </div>
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
