import { useState, useEffect } from 'react';
import { Eye, EyeOff, Sun, Moon, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { T } from '../i18n';
import { AuthBg, AuthStyles } from './Login';
import logoUrl from '../assets/cashcatcher-logo.jpg';

interface Props {
    onResetPassword: (token: string, email: string, password: string, passwordConfirmation: string) => Promise<{ success: boolean; message: string }>;
    onBackToLogin: () => void;
    darkMode: boolean;
    toggleDark: () => void;
    t: T;
    langBtn?: React.ReactNode;
}

export default function ResetPassword({ onResetPassword, onBackToLogin, darkMode, toggleDark, t, langBtn }: Props) {
    const [token, setToken] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [err, setErr] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setToken(params.get('token') || '');
        setEmail(params.get('email') || '');
    }, []);

    const handleSubmit = async () => {
        if (!password.trim() || !passwordConfirmation.trim()) { setErr(t.fillFields); return; }
        if (password.length < 6) { setErr(t.passwordLength); return; }
        if (password !== passwordConfirmation) { setErr('Passwords do not match'); return; }
        if (!token || !email) { setErr('Invalid or expired reset link'); return; }

        setErr('');
        setLoading(true);
        try {
            const res = await onResetPassword(token, email, password, passwordConfirmation);
            if (res.success) {
                setSuccess(true);
            } else {
                setErr(res.message || 'Something went wrong. Please try again.');
            }
        } catch {
            setErr('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
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
                    <div className="auth-logo"><img src={logoUrl} alt="Ca$hCatcher" /></div>
                    <h1 className="auth-title">Reset Password</h1>
                    <p className="auth-sub">{email ? `For ${email}` : 'Choose a new password'}</p>
                </div>

                <div className="auth-card-wrap">
                    <div className="auth-card">
                        {success ? (
                            <div style={{ textAlign: 'center' }}>
                                <CheckCircle2 size={48} color="#16a34a" style={{ margin: '0 auto 16px' }} />
                                <p style={{ color: 'var(--text)', marginBottom: 20 }}>
                                    Your password has been reset successfully. You can now sign in with your new password.
                                </p>
                                <button className="auth-cta" onClick={onBackToLogin}>
                                    <span>{t.signIn}</span><ArrowRight size={16} />
                                </button>
                            </div>
                        ) : (
                            <>
                                {!token || !email ? (
                                    <div className="auth-err">This reset link is invalid or has expired. Please request a new one.</div>
                                ) : null}

                                <div className="form-group">
                                    <label className="form-label">New Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <input className="form-input" type={showPass ? 'text' : 'password'} placeholder={t.passwordPlaceholder2}
                                               value={password} style={{ paddingRight: 44 }}
                                               onChange={e => setPassword(e.target.value)} />
                                        <button onClick={() => setShowPass(v => !v)} className="auth-eye">
                                            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Confirm New Password</label>
                                    <input className="form-input" type={showPass ? 'text' : 'password'} placeholder={t.passwordPlaceholder2}
                                           value={passwordConfirmation}
                                           onChange={e => setPasswordConfirmation(e.target.value)}
                                           onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
                                </div>

                                {err && <div className="auth-err">{err}</div>}

                                <button className="auth-cta" disabled={loading} onClick={handleSubmit} style={{ opacity: loading ? 0.7 : 1 }}>
                                    {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : (<><span>Reset Password</span><ArrowRight size={16} /></>)}
                                </button>

                                <div className="auth-foot">
                                    <button onClick={onBackToLogin} className="auth-link">Back to sign in</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <AuthStyles />
        </div>
    );
}
