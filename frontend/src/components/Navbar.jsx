import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, Zap, KeyRound, BookOpen, BarChart2, Check, Eye, EyeOff, AlertCircle, ChevronDown } from 'lucide-react';
import api from '../api/axios';
import LanguageSelector from './LanguageSelector';

// Password strength helper
const getStrength = (pwd) => {
  const checks = {
    length: pwd.length >= 8,
    upper: /[A-Z]/.test(pwd),
    lower: /[a-z]/.test(pwd),
    number: /\d/.test(pwd),
    special: /[@$!%*?&_\-#]/.test(pwd),
  };
  return { checks, passed: Object.values(checks).filter(Boolean).length };
};
const strengthColors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];
const strengthLabels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];

const RuleRow = ({ ok, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: ok ? '#16a34a' : '#94a3b8' }}>
    <div style={{ width: '13px', height: '13px', borderRadius: '50%', background: ok ? '#dcfce7' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {ok ? <Check size={8} color="#16a34a" strokeWidth={3} /> : null}
    </div>
    {label}
  </div>
);

// ── Change Password Modal ──────────────────────────────────────────────────────
const ChangePasswordModal = ({ onClose }) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const isGoogleUser = !!(userInfo.isGoogleUser || userInfo.googleId) && !userInfo.hasPassword;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const { checks, passed } = getStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passed < 5) { setError('New password does not meet all strength requirements.'); return; }
    if (newPassword !== confirmPassword) { setError('New passwords do not match.'); return; }
    setLoading(true); setError(null);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      setSuccess(true);
      setTimeout(onClose, 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };


  const inputStyle = {
    width: '100%', padding: '0.65rem 0.875rem', border: '1.5px solid rgba(59,108,244,0.15)',
    borderRadius: '0.75rem', background: 'white', color: '#0f172a', fontSize: '0.875rem',
    fontFamily: 'inherit', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box',
  };

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div style={{ background: 'white', borderRadius: '1.5rem', boxShadow: '0 25px 60px rgba(59,108,244,0.18)', padding: '2rem', width: '100%', maxWidth: '440px', border: '1px solid rgba(59,108,244,0.12)', borderLeft: '4px solid #3b6cf4', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontWeight: 800, fontSize: '1.125rem', color: '#0f172a', margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {isGoogleUser ? '🔑 Add Password' : '🔒 Change Password'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.25rem', lineHeight: 1, padding: '0.25rem' }}>✕</button>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16,185,129,0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Check size={28} color="#10b981" strokeWidth={2.5} />
            </div>
            <h3 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              {isGoogleUser ? 'Password Added! 🎉' : 'Password Changed!'}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
              {isGoogleUser
                ? 'You can now sign in with your email and password too. Refreshing...'
                : 'Your password has been updated successfully.'}
            </p>
          </div>
        ) : isGoogleUser ? (
          /* ── Google User: Add Password form (no current password field) ── */
          <>
            <p style={{ fontSize: '0.82rem', color: '#64748b', background: 'rgba(59,108,244,0.06)', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1.25rem', lineHeight: 1.6, border: '1px solid rgba(59,108,244,0.1)' }}>
              🔗 You signed in with <strong>Google</strong>. Set a password below to also be able to sign in with your email and password.
            </p>
            {error && (
              <div style={{ display: 'flex', gap: '0.5rem', background: '#fff1f2', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '0.75rem', padding: '0.75rem 0.875rem', marginBottom: '1rem', fontSize: '0.82rem', color: '#dc2626' }}>
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                {error}
              </div>
            )}
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (passed < 5) { setError('Password does not meet all strength requirements.'); return; }
              if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
              setLoading(true); setError(null);
              try {
                await api.post('/auth/add-password', { newPassword });
                // Update localStorage so dropdown shows "Change Password" after reload
                const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
                localStorage.setItem('userInfo', JSON.stringify({ ...currentUser, hasPassword: true }));
                setSuccess(true);
                setTimeout(() => window.location.reload(), 2500); // reload to refresh navbar
              } catch (err) {
                setError(err.response?.data?.message || 'Failed to set password.');
              } finally { setLoading(false); }
            }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* New Password */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: '#475569', marginBottom: '0.3rem' }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showNew ? 'text' : 'password'} style={{ ...inputStyle, paddingRight: '2.5rem', borderColor: newPassword ? (passed === 5 ? 'rgba(34,197,94,0.4)' : passed >= 3 ? 'rgba(234,179,8,0.4)' : 'rgba(239,68,68,0.3)') : 'rgba(59,108,244,0.15)' }} value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder="Min. 8 characters" />
                  <button type="button" onClick={() => setShowNew(!showNew)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {newPassword.length > 0 && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '3px', marginBottom: '0.35rem' }}>
                      {[1,2,3,4,5].map(i => <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= passed ? strengthColors[passed] : '#e2e8f0', transition: 'all 0.3s' }} />)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.7rem', color: strengthColors[passed], fontWeight: 600 }}>{strengthLabels[passed]}</span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{passed}/5</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', background: '#f8faff', borderRadius: '0.5rem', padding: '0.5rem 0.625rem', border: '1px solid rgba(59,108,244,0.08)' }}>
                      <RuleRow ok={checks.length} label="At least 8 characters" />
                      <RuleRow ok={checks.upper} label="Uppercase letter (A-Z)" />
                      <RuleRow ok={checks.lower} label="Lowercase letter (a-z)" />
                      <RuleRow ok={checks.number} label="Number (0-9)" />
                      <RuleRow ok={checks.special} label="Special character (@$!%*?&_-#)" />
                    </div>
                  </div>
                )}
              </div>
              {/* Confirm Password */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: '#475569', marginBottom: '0.3rem' }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showConfirm ? 'text' : 'password'} style={{ ...inputStyle, paddingRight: '2.5rem', borderColor: confirmPassword ? (confirmPassword === newPassword ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.3)') : 'rgba(59,108,244,0.15)' }} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Repeat new password" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {confirmPassword.length > 0 && (
                  <p style={{ fontSize: '0.72rem', marginTop: '0.25rem', color: confirmPassword === newPassword ? '#16a34a' : '#dc2626' }}>
                    {confirmPassword === newPassword ? '✓ Passwords match' : 'Passwords do not match'}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.7rem', borderRadius: '0.75rem', border: '1.5px solid rgba(59,108,244,0.2)', background: 'white', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ flex: 1, padding: '0.7rem', borderRadius: '0.75rem', background: loading ? '#94a3b8' : 'linear-gradient(135deg, #3b6cf4, #2550d0)', color: 'white', border: 'none', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.875rem', boxShadow: loading ? 'none' : '0 4px 12px rgba(59,108,244,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  {loading ? <><div style={{ width: '13px', height: '13px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Saving...</> : 'Set Password'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            {error && (
              <div style={{ display: 'flex', gap: '0.5rem', background: '#fff1f2', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '0.75rem', padding: '0.75rem 0.875rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#dc2626' }}>
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Current Password */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: '#475569', marginBottom: '0.3rem' }}>Current Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showCurrent ? 'text' : 'password'} style={{ ...inputStyle, paddingRight: '2.5rem' }} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required placeholder="Your current password" />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
                    {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: '#475569', marginBottom: '0.3rem' }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showNew ? 'text' : 'password'} style={{ ...inputStyle, paddingRight: '2.5rem', borderColor: newPassword ? (passed === 5 ? 'rgba(34,197,94,0.4)' : passed >= 3 ? 'rgba(234,179,8,0.4)' : 'rgba(239,68,68,0.3)') : 'rgba(59,108,244,0.15)' }} value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder="Min. 8 characters" />
                  <button type="button" onClick={() => setShowNew(!showNew)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {newPassword.length > 0 && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '3px', marginBottom: '0.35rem' }}>
                      {[1,2,3,4,5].map(i => <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= passed ? strengthColors[passed] : '#e2e8f0', transition: 'all 0.3s' }} />)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.7rem', color: strengthColors[passed], fontWeight: 600 }}>{strengthLabels[passed]}</span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{passed}/5</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', background: '#f8faff', borderRadius: '0.5rem', padding: '0.5rem 0.625rem', border: '1px solid rgba(59,108,244,0.08)' }}>
                      <RuleRow ok={checks.length} label="At least 8 characters" />
                      <RuleRow ok={checks.upper} label="Uppercase letter (A-Z)" />
                      <RuleRow ok={checks.lower} label="Lowercase letter (a-z)" />
                      <RuleRow ok={checks.number} label="Number (0-9)" />
                      <RuleRow ok={checks.special} label="Special character (@$!%*?&_-#)" />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: '#475569', marginBottom: '0.3rem' }}>Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showConfirm ? 'text' : 'password'} style={{ ...inputStyle, paddingRight: '2.5rem', borderColor: confirmPassword ? (confirmPassword === newPassword ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.3)') : 'rgba(59,108,244,0.15)' }} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Repeat new password" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {confirmPassword.length > 0 && (
                  <p style={{ fontSize: '0.72rem', marginTop: '0.25rem', color: confirmPassword === newPassword ? '#16a34a' : '#dc2626' }}>
                    {confirmPassword === newPassword ? '✓ Passwords match' : 'Passwords do not match'}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.7rem', borderRadius: '0.75rem', border: '1.5px solid rgba(59,108,244,0.2)', background: 'white', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading} style={{ flex: 1, padding: '0.7rem', borderRadius: '0.75rem', background: loading ? '#94a3b8' : 'linear-gradient(135deg, #3b6cf4, #2550d0)', color: 'white', border: 'none', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.875rem', boxShadow: loading ? 'none' : '0 4px 12px rgba(59,108,244,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  {loading ? <><div style={{ width: '13px', height: '13px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Saving...</> : 'Update Password'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

// ── Main Navbar ────────────────────────────────────────────────────────────────
const Navbar = () => {
  const navigate = useNavigate();
  const userInfoStr = localStorage.getItem('userInfo');
  const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/');
    window.location.reload();
  };

  return (
    <>
      <header className="navbar" style={{ boxShadow: scrolled ? '0 4px 30px rgba(59,108,244,0.1)' : '0 1px 10px rgba(59,108,244,0.05)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b6cf4 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(59,108,244,0.35)' }}>
              <Zap size={18} color="white" fill="white" />
            </div>
            <div>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', letterSpacing: '-0.03em' }}>
                Smart<span style={{ color: '#3b6cf4' }}>Local</span>
              </span>
            </div>
          </Link>


          {/* Desktop Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }} className="hidden md:flex">
            <Link to="/" style={{ fontWeight: 500, fontSize: '0.9rem', color: '#64748b', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#3b6cf4'} onMouseLeave={e => e.target.style.color = '#64748b'}>Home</Link>
            <Link to="/services" style={{ fontWeight: 500, fontSize: '0.9rem', color: '#64748b', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#3b6cf4'} onMouseLeave={e => e.target.style.color = '#64748b'}>Services</Link>

            {/* Language Selector */}
            <div style={{ borderLeft: '1px solid rgba(59,108,244,0.12)', paddingLeft: '1rem', display: 'flex', alignItems: 'center' }}>
              <LanguageSelector />
            </div>

            {/* Hidden Google Translate widget — used programmatically */}
            <div id="google_translate_element" style={{ position: 'absolute', top: '-9999px', left: '-9999px', visibility: 'hidden' }}></div>

            {userInfo ? (
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                {/* Avatar / Name chip — clicking opens dropdown */}
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    background: 'rgba(59,108,244,0.06)', borderRadius: '9999px',
                    padding: '0.375rem 0.875rem', border: '1px solid rgba(59,108,244,0.15)',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,108,244,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(59,108,244,0.06)'}
                >
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b6cf4, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }}>
                    {userInfo.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155' }}>{userInfo.name}</span>
                  <ChevronDown size={14} color="#64748b" style={{ transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    background: 'white', borderRadius: '1rem',
                    boxShadow: '0 12px 40px rgba(59,108,244,0.15), 0 2px 8px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(59,108,244,0.1)',
                    minWidth: '200px', zIndex: 500, overflow: 'hidden',
                    animation: 'fadeInUp 0.15s ease',
                  }}>
                    {/* Profile header */}
                    <div style={{ padding: '1rem', borderBottom: '1px solid rgba(59,108,244,0.08)', background: 'linear-gradient(135deg, rgba(59,108,244,0.04), rgba(124,58,237,0.03))' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>{userInfo.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem' }}>{userInfo.email}</div>
                      <div style={{ marginTop: '0.4rem', display: 'inline-flex', alignItems: 'center', background: 'rgba(59,108,244,0.08)', borderRadius: '9999px', padding: '0.1rem 0.5rem', fontSize: '0.65rem', fontWeight: 700, color: '#3b6cf4', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {userInfo.role}
                      </div>
                    </div>

                    {/* Menu items */}
                    <div style={{ padding: '0.5rem' }}>
                      {userInfo.role === 'provider' ? (
                        <Link to="/dashboard" onClick={() => setDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.6rem 0.75rem', borderRadius: '0.625rem', color: '#334155', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,108,244,0.07)'; e.currentTarget.style.color = '#3b6cf4'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#334155'; }}>
                          <BarChart2 size={15} /> Dashboard
                        </Link>
                      ) : (
                        <Link to="/user-dashboard" onClick={() => setDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.6rem 0.75rem', borderRadius: '0.625rem', color: '#334155', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,108,244,0.07)'; e.currentTarget.style.color = '#3b6cf4'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#334155'; }}>
                          <BookOpen size={15} /> My Bookings
                        </Link>
                      )}

                      <button onClick={() => { setDropdownOpen(false); setShowChangePassword(true); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.6rem 0.75rem', borderRadius: '0.625rem', color: '#334155', width: '100%', background: 'none', border: 'none', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,108,244,0.07)'; e.currentTarget.style.color = '#3b6cf4'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#334155'; }}>
                        <KeyRound size={15} /> {userInfo.isGoogleUser && !userInfo.hasPassword ? 'Add Password' : 'Change Password'}
                      </button>

                      <div style={{ height: '1px', background: 'rgba(239,68,68,0.1)', margin: '0.25rem 0.5rem' }} />

                      <button onClick={handleLogout}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.6rem 0.75rem', borderRadius: '0.625rem', color: '#ef4444', width: '100%', background: 'none', border: 'none', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.07)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <LogOut size={15} /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Link to="/login" className="btn btn-outline" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>Login</Link>
                <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>Sign Up</Link>
              </div>
            )}
          </nav>

          {/* Mobile Toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)} style={{ background: 'none', border: 'none', padding: '0.5rem', color: '#334155', cursor: 'pointer' }} className="md:hidden">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(59,108,244,0.1)', boxShadow: '0 8px 30px rgba(59,108,244,0.1)', padding: '1rem 1.5rem 1.5rem', zIndex: 200, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/" onClick={() => setMobileOpen(false)} style={{ fontWeight: 600, color: '#334155', padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Home</Link>
            <Link to="/services" onClick={() => setMobileOpen(false)} style={{ fontWeight: 600, color: '#334155', padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Services</Link>
            
            <div style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <LanguageSelector />
            </div>

            {userInfo ? (
              <>
                <div style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>{userInfo.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{userInfo.email}</div>
                </div>
                {userInfo.role === 'provider' ? (
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#3b6cf4', padding: '0.5rem 0' }}>
                    <BarChart2 size={15} /> Dashboard
                  </Link>
                ) : (
                  <Link to="/user-dashboard" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#3b6cf4', padding: '0.5rem 0' }}>
                    <BookOpen size={15} /> My Bookings
                  </Link>
                )}
                <button onClick={() => { setMobileOpen(false); setShowChangePassword(true); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textAlign: 'left', fontWeight: 600, color: '#334155', padding: '0.5rem 0', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>
                  <KeyRound size={15} /> Change Password
                </button>
                <button onClick={handleLogout} style={{ textAlign: 'left', fontWeight: 600, color: '#ef4444', padding: '0.5rem 0', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                  <LogOut size={15} /> Logout
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="btn btn-outline" style={{ flex: 1, padding: '0.625rem 1rem' }}>Login</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="btn btn-primary" style={{ flex: 1, padding: '0.625rem 1rem' }}>Sign Up</Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Change Password Modal */}
      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
    </>
  );
};

export default Navbar;
