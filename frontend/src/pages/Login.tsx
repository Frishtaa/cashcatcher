import { useState } from 'react';
import { Eye, EyeOff, Sun, Moon, Loader2, ArrowRight } from 'lucide-react';
import { T } from '../i18n';
import logoUrl from '../assets/cashcatcher-logo.jpg';

interface Props {
  onLogin: (email: string, password: string) => void;
  onSignup: () => void;
  onSkip: () => void;
  onForgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  darkMode: boolean;
  toggleDark: () => void;
  t: T;
  error?: string;
  loading?: boolean;
  langBtn?: React.ReactNode;
}

export default function Login({ onLogin, onSignup, onSkip, onForgotPassword, darkMode, toggleDark, t, error, loading, langBtn }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [localErr, setLocalErr] = useState('');

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotErr, setForgotErr] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleSubmit = () => {
    if (!email.trim() || !password.trim()) { setLocalErr(t.fillFields); return; }
    if (!isValidEmail(email.trim())) { setLocalErr(t.errInvalidEmail); return; }
    setLocalErr('');
    onLogin(email.trim().toLowerCase(), password);
  };
  const displayError = localErr || error;

  const handleForgotSubmit = async () => {
    if (!forgotEmail.trim() || !isValidEmail(forgotEmail.trim())) {
      setForgotErr(t.errInvalidEmail);
      setForgotMsg('');
      return;
    }
    setForgotErr('');
    setForgotMsg('');
    setForgotLoading(true);
    try {
      const res = await onForgotPassword(forgotEmail.trim().toLowerCase());
      if (res.success) {
        setForgotMsg(res.message || t.forgotPasswordSent);
      } else {
        setForgotErr(res.message || t.errGenericLogin);
      }
    } catch {
      setForgotErr(t.errGenericLogin);
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgot = () => {
    setShowForgot(false);
    setForgotEmail('');
    setForgotMsg('');
    setForgotErr('');
  };

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
            <div className="auth-logo">
              <img src={logoUrl} alt="Ca$hCatcher" />
            </div>
            <h1 className="auth-title">{t.welcomeBack}</h1>
            <p className="auth-sub">{t.signInSubtitle}</p>
          </div>

          <div className="auth-card-wrap">
            <div className="auth-card">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" placeholder="you@example.com" value={email} autoFocus
                       onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
              </div>
              <div className="form-group">
                <label className="form-label">{t.password}</label>
                <div style={{ position: 'relative' }}>
                  <input className="form-input" type={showPass ? 'text' : 'password'} placeholder={t.passwordPlaceholder}
                         value={password} style={{ paddingRight: 44 }}
                         onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
                  <button onClick={() => setShowPass(v => !v)} className="auth-eye">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div style={{ textAlign: 'right', marginTop: 8 }}>
                  <button type="button" onClick={() => setShowForgot(true)} className="auth-link" style={{ fontSize: 12 }}>
                    {t.forgotPassword}
                  </button>
                </div>
              </div>

              {displayError && <div className="auth-err">{displayError}</div>}

              <button className="auth-cta" disabled={loading} onClick={handleSubmit} style={{ opacity: loading ? 0.7 : 1 }}>
                {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : (<><span>{t.signIn}</span><ArrowRight size={16} /></>)}
              </button>

              <div className="auth-foot">
                {t.noAccount}{' '}
                <button onClick={onSignup} className="auth-link">{t.signUp}</button>
              </div>
            </div>
          </div>

        </div>

        {showForgot && (
            <div className="auth-modal-overlay" onClick={closeForgot}>
              <div className="auth-modal" onClick={e => e.stopPropagation()}>
                <h2 className="auth-modal-title">{t.forgotPasswordTitle}</h2>
                <p className="auth-modal-sub">{t.forgotPasswordDesc}</p>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" placeholder="you@example.com" value={forgotEmail} autoFocus
                         onChange={e => setForgotEmail(e.target.value)}
                         onKeyDown={e => e.key === 'Enter' && handleForgotSubmit()} />
                </div>

                {forgotErr && <div className="auth-err">{forgotErr}</div>}
                {forgotMsg && <div className="auth-success">{forgotMsg}</div>}

                <button className="auth-cta" disabled={forgotLoading} onClick={handleForgotSubmit} style={{ opacity: forgotLoading ? 0.7 : 1 }}>
                  {forgotLoading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <span>{t.forgotPasswordBtn}</span>}
                </button>

                <div className="auth-foot">
                  <button onClick={closeForgot} className="auth-link">{t.backToSignIn}</button>
                </div>
              </div>
            </div>
        )}

        <AuthStyles />
      </div>
  );
}

/* ============== background + styles (shared, exported) ============== */

export function AuthBg({ darkMode }: { darkMode: boolean }) {
  return (
      <div className="auth-bg" aria-hidden>
        <div className={`auth-orb orb-a ${darkMode ? 'dark' : 'light'}`} />
        <div className={`auth-orb orb-b ${darkMode ? 'dark' : 'light'}`} />
        <div className={`auth-orb orb-c ${darkMode ? 'dark' : 'light'}`} />
        <div className={`auth-orb orb-d ${darkMode ? 'dark' : 'light'}`} />
        <svg className="auth-wave" viewBox="0 0 1440 600" preserveAspectRatio="none">
          <defs>
            <linearGradient id="wv1" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#e8632a" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path fill="url(#wv1)">
            <animate attributeName="d" dur="14s" repeatCount="indefinite"
                     values="
              M0,320 C320,420 560,180 840,260 C1120,340 1280,480 1440,360 L1440,600 L0,600 Z;
              M0,360 C260,260 580,440 880,320 C1160,210 1300,400 1440,300 L1440,600 L0,600 Z;
              M0,320 C320,420 560,180 840,260 C1120,340 1280,480 1440,360 L1440,600 L0,600 Z" />
          </path>
        </svg>
        <div className="auth-grain" />
      </div>
  );
}

export function AuthStyles() {
  return (
      <style>{`
      @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      @keyframes floatA { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(90px,70px) scale(1.18)} }
      @keyframes floatB { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-100px,80px) scale(1.12)} }
      @keyframes floatC { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(70px,-90px) scale(1.2)} }
      @keyframes floatD { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-80px,-70px) scale(1.14)} }
      @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
      @keyframes glowPulse { 0%,100%{box-shadow:0 30px 80px -20px rgba(232,99,42,0.35), 0 0 0 1px var(--auth-border)} 50%{box-shadow:0 40px 100px -20px rgba(232,99,42,0.5), 0 0 0 1px var(--auth-border)} }

      .auth-shell{
        position:fixed; inset:0; width:100vw; height:100vh; overflow:hidden;
        display:flex; align-items:center; justify-content:center;
        padding:24px !important;
        --auth-card-bg: rgba(255,255,255,0.7);
        --auth-border: rgba(232,99,42,0.18);
        --auth-base: #fff5ec;
      }
      .dark .auth-shell{
        --auth-card-bg: rgba(28,22,18,0.7);
        --auth-border: rgba(232,99,42,0.28);
        --auth-base: #14100c;
      }
      .auth-shell{ background: var(--auth-base) !important; }

      .auth-bg{ position:absolute; inset:0; pointer-events:none; overflow:hidden; z-index:0; }
      .auth-orb{
        position:absolute; width:560px; height:560px; border-radius:50%;
        filter: blur(80px); opacity:0.75; will-change: transform;
      }
      .orb-a{ top:-12%; left:-10%; animation: floatA 16s ease-in-out infinite; }
      .orb-b{ top:5%; right:-14%; animation: floatB 20s ease-in-out infinite; }
      .orb-c{ bottom:-18%; left:8%; animation: floatC 18s ease-in-out infinite; }
      .orb-d{ bottom:-10%; right:5%; animation: floatD 22s ease-in-out infinite; }

      .orb-a.light{ background: radial-gradient(circle, #ffb27a 0%, transparent 65%); }
      .orb-b.light{ background: radial-gradient(circle, #ffd27a 0%, transparent 65%); }
      .orb-c.light{ background: radial-gradient(circle, #ff8a5b 0%, transparent 65%); }
      .orb-d.light{ background: radial-gradient(circle, #fcc59a 0%, transparent 65%); opacity:0.6; }

      .orb-a.dark{ background: radial-gradient(circle, #e8632a 0%, transparent 60%); opacity:0.55; }
      .orb-b.dark{ background: radial-gradient(circle, #f59e0b 0%, transparent 60%); opacity:0.45; }
      .orb-c.dark{ background: radial-gradient(circle, #c2410c 0%, transparent 60%); opacity:0.6; }
      .orb-d.dark{ background: radial-gradient(circle, #fb923c 0%, transparent 60%); opacity:0.4; }

      .auth-wave{ position:absolute; left:0; right:0; bottom:0; width:100%; height:60%; opacity:0.85; }
      .auth-grain{
        position:absolute; inset:0; opacity:0.05; mix-blend-mode:overlay; pointer-events:none;
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.9'/></svg>");
      }

      .auth-center{
        position:relative; z-index:2; width:100%; max-width:420px;
        display:flex; flex-direction:column; align-items:center;
        animation: fadeUp 0.6s ease-out both;
      }

      .auth-brand{ text-align:center; margin-bottom:28px; }
      .auth-logo{
        width:124px; height:74px; margin:0 auto 18px;
        display:flex; align-items:center; justify-content:center;
      }
      .auth-logo img{
        width:100%; height:100%; object-fit:contain; display:block;
      }
      .auth-title{
        font-family: var(--font-display, Inter, sans-serif);
        font-size:32px; font-weight:800; letter-spacing:-0.02em;
        color: var(--text); margin:0 0 8px;
      }
      .auth-sub{ color: var(--text2); font-size:15px; margin:0; }

      .auth-card-wrap{ width:100%; position:relative; }
      .auth-card{
        position:relative;
        background: var(--auth-card-bg);
        backdrop-filter: blur(22px) saturate(150%);
        -webkit-backdrop-filter: blur(22px) saturate(150%);
        border: 1px solid var(--auth-border);
        border-radius: 26px; padding: 30px;
        animation: glowPulse 6s ease-in-out infinite;
      }

      .auth-shell .form-input{
        background: rgba(255,255,255,0.6) !important;
        border:1px solid rgba(232,99,42,0.15) !important;
      }
      .dark .auth-shell .form-input{
        background: rgba(255,255,255,0.04) !important;
        border:1px solid rgba(255,255,255,0.08) !important;
      }
      .auth-shell .form-input:focus{
        border-color: #e8632a !important;
        box-shadow: 0 0 0 3px rgba(232,99,42,0.18) !important;
      }

      .auth-eye{
        position:absolute; right:12px; top:50%; transform:translateY(-50%);
        background:none; border:none; cursor:pointer; color: var(--text3);
        display:flex; align-items:center;
      }

      .auth-err{
        background: rgba(220,38,38,0.1); color:#dc2626;
        border:1px solid rgba(220,38,38,0.2);
        border-radius:10px; padding:10px 14px; font-size:13px; margin-bottom:14px;
      }

      .auth-success{
        background: rgba(34,197,94,0.1); color:#16a34a;
        border:1px solid rgba(34,197,94,0.2);
        border-radius:10px; padding:10px 14px; font-size:13px; margin-bottom:14px;
      }

      .auth-cta{
        width:100%; display:flex; align-items:center; justify-content:center; gap:8px;
        padding:14px; font-size:15px; font-weight:700; border-radius:14px;
        color:#fff; cursor:pointer; border:none; margin-top:4px;
        font-family: var(--font-body, inherit);
        background: linear-gradient(135deg,#e8632a 0%, #f59e0b 100%);
        background-size: 200% 200%;
        box-shadow: 0 14px 32px -8px rgba(232,99,42,0.55), inset 0 1px 0 rgba(255,255,255,0.25);
        transition: transform .18s ease, background-position .4s ease, box-shadow .2s ease;
      }
      .auth-cta:hover{ background-position: 100% 0; transform: translateY(-1px); box-shadow: 0 18px 40px -8px rgba(232,99,42,0.65); }
      .auth-cta:active{ transform: translateY(0); }

      .auth-foot{ text-align:center; color: var(--text3); font-size:13px; margin-top:16px; }
      .auth-link{
        background:none; border:none; cursor:pointer; padding:0;
        color:#e8632a; font-weight:700; font-size:13px; font-family:inherit;
      }
      .auth-link:hover{ color:#d4541f; }

      .auth-skip{
        margin-top:22px; background:none; border:none; cursor:pointer;
        color: var(--text3); font-size:14px; font-family:inherit; transition:color .15s;
      }
      .auth-skip:hover{ color: var(--text); }

      .auth-modal-overlay{
        position: fixed; inset: 0; z-index: 50;
        background: rgba(0,0,0,0.45);
        display:flex; align-items:center; justify-content:center;
        padding: 20px;
        animation: fadeUp 0.2s ease-out both;
      }
      .auth-modal{
        width:100%; max-width: 420px;
        background: var(--auth-card-bg);
        backdrop-filter: blur(22px) saturate(150%);
        -webkit-backdrop-filter: blur(22px) saturate(150%);
        border: 1px solid var(--auth-border);
        border-radius: 22px; padding: 28px;
      }
      .auth-modal-title{
        font-family: var(--font-display, Inter, sans-serif);
        font-size:22px; font-weight:800; color: var(--text); margin:0 0 8px;
      }
      .auth-modal-sub{ color: var(--text2); font-size:14px; margin:0 0 18px; line-height:1.5; }
    `}</style>
  );
}
