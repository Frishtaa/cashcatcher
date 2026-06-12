import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ApiTransaction, ApiCategory } from '../api';
import { T, translateCategoryName } from '../i18n';

import { format } from 'date-fns';

interface Props {
  categories: ApiCategory[];
  onSave: (data: Omit<ApiTransaction,'id'|'category'>) => void;
  onClose: () => void;
  editing?: ApiTransaction | null;
  t: T;
}

export default function TransactionModal({ categories, onSave, onClose, editing, t }: Props) {
  const [type,     setType]     = useState<'income'|'expense'>(editing?.type || 'expense');
  const [amount,   setAmount]   = useState(editing?.amount?.toString() || '');
  const [desc,     setDesc]     = useState(editing?.description || '');
  const [catId,    setCatId]    = useState(editing?.category_id || '');
  const [date,     setDate]     = useState(editing?.date || format(new Date(),'yyyy-MM-dd'));
  const [recur,    setRecur]    = useState(editing?.recurring || false);
  const [interval, setInterval] = useState<'daily'|'weekly'|'monthly'>(editing?.recurring_interval || 'monthly');

  const filteredCats = categories.filter(c => c.type === type);

  useEffect(() => {
    if (!filteredCats.find((c: ApiCategory) => c.id === catId)) setCatId(filteredCats[0]?.id || '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const handleSave = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || !desc.trim() || !catId || !date) return;
    onSave({
      type, amount: amt, description: desc.trim(),
      category_id: catId, date,
      recurring: recur,
      recurring_interval: recur ? interval : undefined,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{editing ? t.editTransaction : t.addTransactionTitle}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={18}/></button>
        </div>
        <div className="form-group">
          <div className="type-toggle">
            <button className={`type-btn ${type==='income'?'active-income':''}`}  onClick={() => setType('income')}>📈 {t.income}</button>
            <button className={`type-btn ${type==='expense'?'active-expense':''}`} onClick={() => setType('expense')}>📉 {t.expense}</button>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t.amountLabel}</label>
            <input className="form-input" type="number" placeholder="0" min="0" value={amount} onChange={e => setAmount(e.target.value)} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">{t.dateLabel}</label>
            <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">{t.descriptionLabel}</label>
          <input className="form-input" placeholder={t.whatWasThis} value={desc} onChange={e => setDesc(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">{t.categoryLabel}</label>
          <select className="form-select" value={catId} onChange={e => setCatId(e.target.value)}>
            {filteredCats.map(c => <option key={c.id} value={c.id}>{c.icon} {translateCategoryName(c.name, t)}</option>)}

          </select>
        </div>
        <div className="form-group">
          <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontSize:14, fontWeight:500, color:'var(--text2)' }}>
            <input type="checkbox" checked={recur} onChange={e => setRecur(e.target.checked)} style={{ width:16, height:16 }} />
            {t.recurringTransaction}
          </label>
        </div>
        {recur && (
          <div className="form-group">
            <label className="form-label">{t.repeatEvery}</label>
            <select className="form-select" value={interval} onChange={e => setInterval(e.target.value as 'daily'|'weekly'|'monthly')}>
              <option value="daily">{t.day}</option>
              <option value="weekly">{t.week}</option>
              <option value="monthly">{t.month}</option>
            </select>
          </div>
        )}
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:24 }}>
          <button className="btn btn-secondary" onClick={onClose}>{t.cancel}</button>
          <button className="btn btn-primary" onClick={handleSave}>{editing ? t.saveChanges : t.addTransactionTitle}</button>
        </div>
      </div>
    </div>
  );
}
