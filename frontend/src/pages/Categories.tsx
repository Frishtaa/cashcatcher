import { useState } from 'react';
import { Trash2, Plus, X } from 'lucide-react';
import { ApiCategory } from '../api';
import { T, translateCategoryName } from '../i18n';

const COLORS = ['#22c55e','#3b82f6','#a855f7','#06b6d4','#f97316','#eab308','#ef4444','#ec4899','#14b8a6','#8b5cf6','#f59e0b','#6b7280','#e8632a','#1d4ed8','#7e22ce'];
const ICONS  = ['💼','💻','📈','💰','🍽️','🚗','🏠','🎬','🏥','🛍️','📚','📦','✈️','⚡','🎮','📱','💊','🎵','🏋️','☕'];

interface Props {
  categories: ApiCategory[];
  onAdd: (c: Omit<ApiCategory,'id'>) => void;
  onDelete: (id: string) => void;
  t: T;
}

export default function Categories({ categories, onAdd, onDelete, t }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [name,  setName]  = useState('');
  const [type,  setType]  = useState<'income'|'expense'>('expense');
  const [color, setColor] = useState(COLORS[0]);
  const [icon,  setIcon]  = useState(ICONS[0]);

  const income  = categories.filter(c => c.type === 'income');
  const expense = categories.filter(c => c.type === 'expense');

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), type, color, icon });
    setName(''); setColor(COLORS[0]); setIcon(ICONS[0]); setType('expense');
    setShowModal(false);
  };

  const CatList = ({ cats, label }: { cats: ApiCategory[], label: string }) => (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 14, fontSize: 16 }}>{label}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
        {cats.map(c => (
          <div key={c.id} className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: c.color+'22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{c.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{translateCategoryName(c.name, t)}</div>

              <div style={{ fontSize: 12, color: 'var(--text3)' }}>{c.type === 'income' ? t.income : t.expense}</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => onDelete(c.id)} style={{ color: 'var(--red)', opacity: 0.6 }}><Trash2 size={14}/></button>
            <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 28, background: c.color, borderRadius: '0 3px 3px 0' }} />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.categories}</h1>
          <p className="page-subtitle">{categories.length} {t.categoriesSubtitle}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16}/>{t.addCategory}</button>
      </div>
      <CatList cats={income}  label={t.incomeCategories} />
      <CatList cats={expense} label={t.expenseCategories} />

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{t.newCategory}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={18}/></button>
            </div>
            <div className="form-group">
              <label className="form-label">{t.type}</label>
              <div className="type-toggle">
                <button className={`type-btn ${type==='income'?'active-income':''}`} onClick={() => setType('income')}>{t.income}</button>
                <button className={`type-btn ${type==='expense'?'active-expense':''}`} onClick={() => setType('expense')}>{t.expense}</button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{t.nameLabel}</label>
              <input className="form-input" placeholder={t.categoryName} value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">{t.iconLabel}</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ICONS.map(i => (
                  <button key={i} onClick={() => setIcon(i)} style={{ fontSize: 22, background: icon===i?'var(--bg3)':'transparent', border: icon===i?'2px solid var(--accent)':'2px solid transparent', borderRadius: 8, cursor: 'pointer', padding: '4px 6px', transition: 'all 0.15s' }}>{i}</button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{t.colorLabel}</label>
              <div className="color-grid">
                {COLORS.map(c => <div key={c} className={`color-swatch ${color===c?'selected':''}`} style={{ background: c }} onClick={() => setColor(c)} />)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>{t.cancel}</button>
              <button className="btn btn-primary" onClick={handleAdd}>{t.addCategory}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
