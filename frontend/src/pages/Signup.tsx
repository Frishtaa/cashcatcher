import { useState } from 'react';

import { Eye, EyeOff, Sun, Moon, Loader2, ArrowRight } from 'lucide-react';
import { T } from '../i18n';
import { AuthBg, AuthStyles } from './Login';
import logoUrl from '../assets/cashcatcher-logo.jpg';



interface Props {
  onSignup: (name: string, email: string, password: string) => void;
  onLogin: () => void;
  onSkip: () => void;
  darkMode: boolean;
  toggleDark: () => void;
  t: T;
  error?: string;
  loading?: boolean;
  langBtn?: React.ReactNode;
}

export default function Signup({ onSignup, onLogin, onSkip, darkMode, toggleDark, t, error, loading, langBtn }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  // ── Renamed state variable to isolate from 'en' scope conflicts ──
  const [userPassword, setUserPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [localErr, setLocalErr] = useState('');

  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleSubmit = () => {
    console.log('userPassword value:', userPassword);
    console.log('userPassword length:', userPassword.length);
    console.log('typeof userPassword:', typeof userPassword);

    if (!name.trim() || !email.trim() || !userPassword.trim()) { setLocalErr(t.fillFields); return; }
    if (!isValidEmail(email.trim())) { setLocalErr(t.errInvalidEmail); return; }
    if (userPassword.length < 6) { setLocalErr(t.passwordLength); return; }
    setLocalErr('');
    onSignup(name, email.trim().toLowerCase(), userPassword);
  };
  const displayError = localErr || error;

  return (
      <div className="auth-page auth-shell">
        <AuthBg darkMode={darkMode} />

        <div style={{ position: 'fixed', top: 16, right: 20, display: 'flex', alignItems: 'center', gap: 10, zIndex: 20 }}>
          {langBtn}
          <button className="theme-toggle" onClick={toggleDark}>
            {darkMode ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#e8632a" />}
          </button>
        </div>

        <div className="auth-center">
          <div className="auth-brand">
            <div className="auth-logo"><img src={logoUrl} alt="Ca$hCatcher" /></div>
            <h1 className="auth-title">{t.createAccount}</h1>
            <p className="auth-sub">{t.signUpSubtitle}</p>
          </div>

          <div className="auth-card-wrap">
            {/* Using an HTML form wrapper blocks browsers from forcing bad autocomplete assumptions */}
            <form
                className="auth-card"
                onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
            >
              <div className="form-group">
                <label className="form-label">{t.fullName}</label>
                <input
                    className="form-input"
                    type="text"
                    placeholder={t.fullNamePlaceholder}
                    value={name}
                    autoFocus
                    autoComplete="name"
                    onChange={e => setName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                    className="form-input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    autoComplete="email"
                    onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t.password}</label>
                <div style={{ position: 'relative' }}>
                  <input
                      className="form-input"
                      type={showPass ? 'text' : 'password'}
                      placeholder={t.passwordPlaceholder2}
                      value={userPassword}
                      style={{ paddingRight: 44 }}
                      autoComplete="off"
                      onChange={e => setUserPassword(e.target.value)}
                  />
                  <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      className="auth-eye"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {displayError && <div className="auth-err">{displayError}</div>}

              <button
                  type="submit"
                  className="auth-cta"
                  disabled={loading}
                  style={{ opacity: loading ? 0.7 : 1 }}
              >
                {loading ? (
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                    <><span>{t.createAccountBtn}</span><ArrowRight size={16} /></>
                )}
              </button>

              <div className="auth-foot">
                {t.alreadyAccount}{' '}
                <button type="button" onClick={onLogin} className="auth-link">{t.signIn}</button>
              </div>
            </form>
          </div>

        </div>

        <AuthStyles />
      </div>
  );
}