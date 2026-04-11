import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { Eye, EyeOff, Zap, Mail, ArrowLeft, CheckCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const [view, setView] = useState('login'); // 'login' | 'forgot' | 'sent' | 'otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // OTP state
  const [otpUserId, setOtpUserId] = useState(null);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();
  const location = useLocation();

  // Handle redirect from Register page when existing Google user tries to sign up
  useEffect(() => {
    if (location.state?.otpRequired) {
      setOtpUserId(location.state.userId);
      setOtpEmail(location.state.email);
      setOtpDigits(['', '', '', '', '', '']);
      setView('otp');
    }
  }, []);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (view !== 'otp') return;
    setOtpTimer(60);
    setCanResend(false);
    const tick = setInterval(() => {
      setOtpTimer(t => {
        if (t <= 1) { clearInterval(tick); setCanResend(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [view]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.requiresOtp) {
        setOtpUserId(data.userId);
        setOtpEmail(data.email);
        setOtpDigits(['', '', '', '', '', '']);
        setView('otp');
      } else {
        localStorage.setItem('userInfo', JSON.stringify(data));
        window.location.href = '/';
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError(null);
    try {
      const { data } = await api.post('/auth/google', { credential: credentialResponse.credential });
      if (data.requiresOtp) {
        setOtpUserId(data.userId);
        setOtpEmail(data.email);
        setOtpDigits(['', '', '', '', '', '']);
        setView('otp');
      } else {
        localStorage.setItem('userInfo', JSON.stringify(data));
        window.location.href = '/';
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Google sign-in failed. Please try again.');
    }
  };

  const handleGoogleError = () => setError('Google sign-in was cancelled. Please try again.');

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail });
      setView('sent');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email.');
    } finally { setLoading(false); }
  };

  // OTP digit input
  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newDigits = Array(6).fill('');
    paste.split('').forEach((d, i) => { newDigits[i] = d; });
    setOtpDigits(newDigits);
    inputRefs.current[Math.min(paste.length, 5)]?.focus();
  };

  const handleVerifyOtp = async () => {
    const otp = otpDigits.join('');
    if (otp.length < 6) { setError('Please enter all 6 digits.'); return; }
    setOtpLoading(true); setError(null);
    try {
      const { data } = await api.post('/auth/verify-otp', { userId: otpUserId, otp });
      localStorage.setItem('userInfo', JSON.stringify(data));
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    try {
      await api.post('/auth/resend-otp', { userId: otpUserId });
      setOtpDigits(['', '', '', '', '', '']);
      setOtpTimer(60); setCanResend(false);
      const tick = setInterval(() => {
        setOtpTimer(t => {
          if (t <= 1) { clearInterval(tick); setCanResend(true); return 0; }
          return t - 1;
        });
      }, 1000);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    }
  };

  // Shared submit on Enter for OTP
  useEffect(() => {
    if (view !== 'otp') return;
    const handle = (e) => { if (e.key === 'Enter') handleVerifyOtp(); };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [view, otpDigits]);

  const cardStyle = {
    background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)',
    borderRadius: '1.75rem', border: '1px solid rgba(255,255,255,0.7)',
    boxShadow: '0 24px 64px rgba(59,108,244,0.12), 0 8px 24px rgba(0,0,0,0.06)',
    padding: '2.75rem', width: '100%', maxWidth: '420px',
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 140px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(145deg, #dce8ff 0%, #edf2ff 50%, #f0f4ff 100%)',
      padding: '2rem 1rem', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(59,108,244,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

      <div style={cardStyle}>

        {/* ── SIGN IN VIEW ── */}
        {view === 'login' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg, #3b6cf4, #7c3aed)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(59,108,244,0.35)', marginBottom: '1rem' }}>
                <Zap size={24} color="white" fill="white" />
              </div>
              <h2 style={{ fontSize: '1.625rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Welcome Back</h2>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.4rem' }}>Sign in to your SmartLocal account</p>
            </div>

            {error && <div style={{ background: '#fff1f2', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '0.75rem', padding: '0.875rem 1rem', marginBottom: '1.25rem', fontSize: '0.875rem', color: '#dc2626' }}>{error}</div>}

            <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'center', width: '100%' }}>
              <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} useOneTap={false} theme="outline" size="large" text="signin_with_google" shape="rectangular" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>or sign in with email</span>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              <div className="input-group">
                <label className="label">Email Address</label>
                <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
              </div>
              <div className="input-group" style={{ position: 'relative' }}>
                <label className="label">Password</label>
                <input type={showPass ? 'text' : 'password'} className="input" style={{ paddingRight: '2.75rem' }} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '0.75rem', bottom: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: '0' }}>
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <div style={{ textAlign: 'right', marginTop: '0.25rem', marginBottom: '0.75rem' }}>
                <button type="button" onClick={() => { setView('forgot'); setError(null); setForgotEmail(email); }} style={{ background: 'none', border: 'none', color: '#3b6cf4', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                  Forgot Password?
                </button>
              </div>
              <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.875rem', background: loading ? '#94a3b8' : 'linear-gradient(135deg, #3b6cf4, #2550d0)', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: loading ? 'none' : '0 4px 15px rgba(59,108,244,0.35)' }}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ fontWeight: 700, color: '#3b6cf4', textDecoration: 'none' }}>Register here</Link>
            </div>
          </>
        )}

        {/* ── OTP VERIFICATION VIEW ── */}
        {view === 'otp' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(59,108,244,0.12), rgba(124,58,237,0.12))', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', border: '2px solid rgba(59,108,244,0.2)' }}>
                <ShieldCheck size={26} color="#3b6cf4" />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Verify It's You</h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem', lineHeight: 1.6 }}>
                We've sent a <strong>6-digit verification code</strong> to<br />
                <span style={{ color: '#3b6cf4', fontWeight: 600 }}>{otpEmail}</span>
              </p>
            </div>

            {error && <div style={{ background: '#fff1f2', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.875rem', color: '#dc2626', textAlign: 'center' }}>{error}</div>}

            {/* 6-digit OTP inputs */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={el => inputRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  onPaste={i === 0 ? handleOtpPaste : undefined}
                  autoFocus={i === 0}
                  style={{
                    width: '46px', height: '54px', textAlign: 'center', fontSize: '1.4rem', fontWeight: 700,
                    border: `2px solid ${digit ? '#3b6cf4' : 'rgba(59,108,244,0.2)'}`,
                    borderRadius: '0.75rem', outline: 'none', color: '#0f172a',
                    background: digit ? 'rgba(59,108,244,0.05)' : 'white',
                    transition: 'all 0.15s', fontFamily: 'monospace',
                    boxShadow: digit ? '0 0 0 3px rgba(59,108,244,0.1)' : 'none',
                  }}
                />
              ))}
            </div>

            {/* Timer / Resend */}
            <div style={{ textAlign: 'center', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#94a3b8' }}>
              {canResend ? (
                <button onClick={handleResendOtp} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'none', border: 'none', color: '#3b6cf4', fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem', padding: 0, textDecoration: 'underline' }}>
                  <RefreshCw size={13} /> Resend verification code
                </button>
              ) : (
                <>Resend code in <strong style={{ color: '#475569' }}>{otpTimer}s</strong></>
              )}
            </div>

            <button
              onClick={handleVerifyOtp}
              disabled={otpLoading || otpDigits.join('').length < 6}
              style={{
                width: '100%', padding: '0.875rem',
                background: (otpLoading || otpDigits.join('').length < 6) ? '#94a3b8' : 'linear-gradient(135deg, #3b6cf4, #2550d0)',
                color: 'white', border: 'none', borderRadius: '0.75rem',
                fontWeight: 700, fontSize: '1rem',
                cursor: (otpLoading || otpDigits.join('').length < 6) ? 'not-allowed' : 'pointer',
                boxShadow: otpDigits.join('').length === 6 ? '0 4px 15px rgba(59,108,244,0.35)' : 'none',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              }}>
              {otpLoading
                ? <><div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Verifying...</>
                : <><ShieldCheck size={17} /> Verify & Sign In</>}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
              <button onClick={() => { setView('login'); setError(null); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.82rem', padding: 0 }}>
                <ArrowLeft size={14} /> Back to Sign In
              </button>
            </div>
          </>
        )}

        {/* ── FORGOT PASSWORD VIEW ── */}
        {view === 'forgot' && (
          <>
            <button onClick={() => { setView('login'); setError(null); }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '1.5rem', padding: 0 }}>
              <ArrowLeft size={16} /> Back to Sign In
            </button>
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg, #3b6cf4, #7c3aed)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(59,108,244,0.35)', marginBottom: '1rem' }}>
                <Mail size={24} color="white" />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Forgot Password</h2>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.4rem' }}>Enter your email and we'll send a reset link</p>
            </div>
            {error && <div style={{ background: '#fff1f2', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '0.75rem', padding: '0.875rem 1rem', marginBottom: '1.25rem', fontSize: '0.875rem', color: '#dc2626' }}>{error}</div>}
            <form onSubmit={handleForgotPassword}>
              <div className="input-group">
                <label className="label">Email Address</label>
                <input type="email" className="input" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required placeholder="you@example.com" autoFocus />
              </div>
              <button type="submit" disabled={loading} style={{ marginTop: '1rem', width: '100%', padding: '0.875rem', background: loading ? '#94a3b8' : 'linear-gradient(135deg, #3b6cf4, #2550d0)', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 15px rgba(59,108,244,0.35)' }}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}

        {/* ── EMAIL SENT VIEW ── */}
        {view === 'sent' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16,185,129,0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <CheckCircle size={32} color="#10b981" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: '0.75rem' }}>Check Your Email</h2>
            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
              We've sent a password reset link to <strong>{forgotEmail}</strong>. The link expires in 15 minutes.
            </p>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
              Didn't receive it?{' '}
              <button onClick={() => { setView('forgot'); setError(null); }} style={{ background: 'none', border: 'none', color: '#3b6cf4', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: '0.8rem' }}>Try again</button>.
            </p>
            <button onClick={() => setView('login')} style={{ padding: '0.75rem 2rem', borderRadius: '0.75rem', background: 'linear-gradient(135deg, #3b6cf4, #2550d0)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 15px rgba(59,108,244,0.3)' }}>
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
