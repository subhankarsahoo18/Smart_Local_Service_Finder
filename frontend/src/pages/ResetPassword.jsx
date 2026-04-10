import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { Zap, Eye, EyeOff, Check, CheckCircle, AlertCircle } from 'lucide-react';

const getPasswordStrength = (pwd) => {
  const checks = {
    length: pwd.length >= 8,
    upper: /[A-Z]/.test(pwd),
    lower: /[a-z]/.test(pwd),
    number: /\d/.test(pwd),
    special: /[@$!%*?&_\-#]/.test(pwd),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  return { checks, passed };
};

const strengthLabels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
const strengthColors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];

const RuleRow = ({ ok, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: ok ? '#16a34a' : '#94a3b8', transition: 'color 0.2s' }}>
    <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: ok ? '#dcfce7' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
      {ok ? <Check size={9} color="#16a34a" strokeWidth={3} /> : null}
    </div>
    {label}
  </div>
);

const ResetPassword = () => {
  const { id, token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error'
  const [message, setMessage] = useState('');

  const { checks, passed } = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passed < 5) {
      setStatus('error');
      setMessage('Please meet all password requirements before submitting.');
      return;
    }
    if (password !== confirm) {
      setStatus('error');
      setMessage('Passwords do not match.');
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const { data } = await api.post(`/auth/reset-password/${id}/${token}`, { password });
      setStatus('success');
      setMessage(data.message || 'Password reset successful!');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '0.75rem 0.9rem', border: '1.5px solid rgba(59,108,244,0.15)',
    borderRadius: '0.75rem', background: 'white', color: '#0f172a', fontSize: '0.9rem',
    fontFamily: 'inherit', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box',
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 140px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(145deg, #dce8ff 0%, #edf2ff 50%, #f0f4ff 100%)',
      padding: '2rem 1rem', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(59,108,244,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

      <div style={{
        background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)',
        borderRadius: '1.75rem', border: '1px solid rgba(255,255,255,0.7)',
        boxShadow: '0 24px 64px rgba(59,108,244,0.12)', padding: '2.75rem',
        width: '100%', maxWidth: '440px',
        animation: 'fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards', opacity: 0,
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg, #3b6cf4, #7c3aed)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(59,108,244,0.35)', marginBottom: '1rem' }}>
            <Zap size={24} color="white" fill="white" />
          </div>
          <h2 style={{ fontSize: '1.625rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Set New Password</h2>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.4rem' }}>Create a strong password for your account</p>
        </div>

        {/* Success State */}
        {status === 'success' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16,185,129,0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <CheckCircle size={32} color="#10b981" />
            </div>
            <h3 style={{ fontWeight: 800, fontSize: '1.125rem', color: '#0f172a', marginBottom: '0.625rem' }}>Password Reset!</h3>
            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>{message}</p>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '1.25rem' }}>Redirecting to sign in...</p>
            <Link to="/login" style={{ padding: '0.75rem 2rem', borderRadius: '0.75rem', background: 'linear-gradient(135deg, #3b6cf4, #2550d0)', color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem', display: 'inline-block', boxShadow: '0 4px 15px rgba(59,108,244,0.3)' }}>
              Sign In Now
            </Link>
          </div>
        ) : (
          <>
            {/* Error alert */}
            {status === 'error' && (
              <div style={{ display: 'flex', gap: '0.625rem', background: '#fff1f2', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '0.75rem', padding: '0.875rem 1rem', marginBottom: '1.25rem', fontSize: '0.875rem', color: '#dc2626' }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* New Password */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', color: '#475569', marginBottom: '0.35rem' }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} style={{ ...inputStyle, paddingRight: '2.75rem', borderColor: password ? (passed === 5 ? 'rgba(34,197,94,0.4)' : passed >= 3 ? 'rgba(234,179,8,0.4)' : 'rgba(239,68,68,0.3)') : 'rgba(59,108,244,0.15)' }}
                    value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min. 8 characters" />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: 0 }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Strength indicator */}
                {password.length > 0 && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '3px', marginBottom: '0.4rem' }}>
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i <= passed ? strengthColors[passed] : '#e2e8f0', transition: 'background 0.3s' }} />
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.72rem', color: strengthColors[passed], fontWeight: 600 }}>{strengthLabels[passed]}</span>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{passed}/5</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', background: '#f8faff', borderRadius: '0.625rem', padding: '0.625rem 0.75rem', border: '1px solid rgba(59,108,244,0.08)' }}>
                      <RuleRow ok={checks.length} label="At least 8 characters" />
                      <RuleRow ok={checks.upper} label="One uppercase letter (A-Z)" />
                      <RuleRow ok={checks.lower} label="One lowercase letter (a-z)" />
                      <RuleRow ok={checks.number} label="One number (0-9)" />
                      <RuleRow ok={checks.special} label="One special character (@$!%*?&_-#)" />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', color: '#475569', marginBottom: '0.35rem' }}>Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showConfirm ? 'text' : 'password'} style={{ ...inputStyle, paddingRight: '2.75rem', borderColor: confirm ? (confirm === password ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.3)') : 'rgba(59,108,244,0.15)' }}
                    value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="Repeat your password" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: 0 }}>
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirm && confirm !== password && (
                  <p style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.3rem' }}>Passwords do not match</p>
                )}
                {confirm && confirm === password && (
                  <p style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.3rem' }}>✓ Passwords match</p>
                )}
              </div>

              <button type="submit" disabled={loading || passed < 5 || password !== confirm}
                style={{
                  marginTop: '0.5rem', width: '100%', padding: '0.9rem',
                  background: (loading || passed < 5 || password !== confirm) ? '#94a3b8' : 'linear-gradient(135deg, #3b6cf4, #2550d0)',
                  color: 'white', border: 'none', borderRadius: '0.75rem',
                  fontWeight: 700, fontSize: '1rem', cursor: (loading || passed < 5 || password !== confirm) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s', boxShadow: (loading || passed < 5 || password !== confirm) ? 'none' : '0 4px 15px rgba(59,108,244,0.35)',
                }}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
              <Link to="/login" style={{ fontWeight: 700, color: '#3b6cf4', textDecoration: 'none' }}>← Back to Sign In</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
