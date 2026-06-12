import { useEffect, useRef, useState } from 'react';
import { Language } from '../types';

const LANG_OPTIONS: { value: Language; flag: string; label: string }[] = [
  { value: 'en', flag: 'https://flagcdn.com/w40/us.png', label: 'English' },
  { value: 'ar', flag: 'https://flagcdn.com/w40/iq.png', label: 'العربية' },
  { value: 'ku', flag: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Flag_of_Kurdistan.svg/40px-Flag_of_Kurdistan.svg.png', label: 'کوردی' },
];

const Flag = ({ src, alt, size = 18 }: { src: string; alt: string; size?: number }) => (
  <img
    src={src}
    alt={alt}
    style={{ width: size * 1.4, height: size, objectFit: 'cover', borderRadius: 2, display: 'block', boxShadow: '0 0 0 1px rgba(0,0,0,0.08)' }}
  />
);

interface Props {
  lang: Language;
  onChange: (l: Language) => void;
  compact?: boolean;
}

export default function LangSwitcher({ lang, onChange, compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const current = LANG_OPTIONS.find(l => l.value === lang) || LANG_OPTIONS[0];

  const handlePick = (l: Language) => {
    onChange(l);
    setOpen(false);
  };

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        type="button"
        className="lang-btn"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Flag src={current.flag} alt={current.value} size={16} />

      </button>
      {open && (
        <div className="lang-dropdown" role="listbox">
          {LANG_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`lang-option ${lang === opt.value ? 'active' : ''}`}
              onPointerDown={(e) => { e.preventDefault(); handlePick(opt.value); }}
              onClick={() => handlePick(opt.value)}
            >
              <Flag src={opt.flag} alt={opt.value} size={16} />
              <span>{opt.label}</span>
              {lang === opt.value && <span style={{ marginLeft: 'auto', color: 'var(--accent)' }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
