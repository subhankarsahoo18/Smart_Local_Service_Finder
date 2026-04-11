import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Zap, LocateFixed, Eye, EyeOff, User, Briefcase, ImagePlus, X, Check, ArrowLeft, ShieldCheck, RefreshCw } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';


// Password strength checker
const getPasswordStrength = (pwd) => {
  const checks = {
    length: pwd.length >= 8,
    upper: /[A-Z]/.test(pwd),
    lower: /[a-z]/.test(pwd),
    number: /\d/.test(pwd),
    special: /[@$!%*?&_\-#]/.test(pwd),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  return { checks, passed, total: 5 };
};

const strengthLabels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
const strengthColors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [role, setRole] = useState('user');
  const [serviceName, setServiceName] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [serviceCharges, setServiceCharges] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [description, setDescription] = useState('');
  const [serviceImage, setServiceImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const imageInputRef = useRef(null);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // OTP State
  const [view, setView] = useState('register'); // 'register' | 'otp'
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

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

  // Handle OTP Inputs
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
  const { checks: pwdChecks, passed: pwdPassed } = getPasswordStrength(password);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setServiceImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setServiceImage(null);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) { alert('Geolocation not supported.'); return; }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude; const lon = pos.coords.longitude;
          setLatitude(lat); setLongitude(lon);
          const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`);
          const data = await resp.json();
          if (data?.address) setLocation(data.address.city || data.address.town || data.address.state_district || 'Your Location');
        } catch (err) { console.error(err); } finally { setIsLocating(false); }
      },
      () => { alert('Could not get location.'); setIsLocating(false); }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Frontend password validation
    if (pwdPassed < 5) {
      setError('Please create a stronger password that meets all requirements below.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/send-register-otp', { email, name, mobileNumber });
      setView('otp');
      setOtpDigits(['', '', '', '', '', '']);
      setLoading(false);
    } catch (err) { 
      setError(err.response?.data?.message || err.message); 
      setLoading(false); 
    }
  };

  const handleVerifyOtp = async () => {
    const otp = otpDigits.join('');
    if (otp.length < 6) { setError('Please enter all 6 digits.'); return; }
    setOtpLoading(true); setError(null);
    try {
      const payload = { name, email, password, role, otp, mobileNumber };
      if (role === 'provider') Object.assign(payload, { serviceName, serviceType, location, serviceCharges: Number(serviceCharges), description, latitude, longitude });
      
      const { data } = await api.post('/auth/register', payload);
      localStorage.setItem('userInfo', JSON.stringify(data));

      if (role === 'provider' && serviceImage && data.serviceId) {
        try {
          const formData = new FormData();
          formData.append('serviceImage', serviceImage);
          await api.put(`/services/${data.serviceId}/image`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        } catch (imgErr) {
          console.warn('Image upload failed but account created:', imgErr.message);
      }

      window.location.href = role === 'provider' ? '/dashboard' : '/';
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    try {
      await api.post('/auth/send-register-otp', { email, name, mobileNumber });
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

  // Google Sign-Up — uses ID token (credential) flow via GoogleLogin component
  const handleGoogleSuccess = async (credentialResponse) => {
    setError(null);
    try {
      const { data } = await api.post('/auth/google', {
        credential: credentialResponse.credential,
      });
      if (data.requiresOtp) {
        // Existing account — send them to login page where OTP verification is handled
        navigate('/login', { state: { otpRequired: true, userId: data.userId, email: data.email, name: data.name } });
        return;
      }
      localStorage.setItem('userInfo', JSON.stringify(data));
      window.location.href = data.role === 'provider' ? '/dashboard' : '/';
    } catch (err) {
      setError(err.response?.data?.message || 'Google sign-up failed. Please try again.');
    }
  };

  const handleGoogleError = () => {
    setError('Google sign-up was cancelled or failed. Please try again.');
  };

  const inputStyle = { width: '100%', padding: '0.7rem 0.9rem', border: '1.5px solid rgba(59,108,244,0.15)', borderRadius: '0.75rem', background: 'white', color: '#0f172a', fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', transition: 'all 0.2s' };
  const labelStyle = { display: 'block', fontWeight: 500, fontSize: '0.82rem', color: '#475569', marginBottom: '0.35rem' };

  const RuleRow = ({ ok, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: ok ? '#16a34a' : '#94a3b8', transition: 'color 0.2s' }}>
      <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: ok ? '#dcfce7' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
        {ok ? <Check size={9} color="#16a34a" strokeWidth={3} /> : null}
      </div>
      {label}
    </div>
  );

  return (
    <div style={{
      minHeight: 'calc(100vh - 140px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(145deg, #dce8ff 0%, #edf2ff 50%, #f0f4ff 100%)',
      padding: '2rem 1rem', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '-80px', right: '-60px', width: '350px', height: '350px', background: 'radial-gradient(circle, rgba(59,108,244,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-60px', left: '-80px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

      <div style={{
        background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)',
        borderRadius: '1.75rem', border: '1px solid rgba(255,255,255,0.7)',
        boxShadow: '0 24px 64px rgba(59,108,244,0.12)', padding: '2.5rem',
        width: '100%', maxWidth: '540px',
        animation: 'fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards', opacity: 0,
      }}>
        {view === 'register' && (
          <>
            {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg, #3b6cf4, #7c3aed)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(59,108,244,0.35)', marginBottom: '0.875rem' }}>
            <Zap size={24} color="white" fill="white" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Create Account</h2>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.35rem' }}>Join Smart Local Service Finder</p>
        </div>

        {error && <div style={{ background: '#fff1f2', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.875rem', color: '#dc2626' }}>{error}</div>}

        {/* Google Sign-Up — GoogleLogin component (ID token flow, no COOP issues) */}
        {role === 'user' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
                theme="outline"
                size="large"
                text="signup_with_google"
                shape="rectangular"
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>or register with email</span>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            </div>
          </>
        )}

        {/* Role Toggle */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            { value: 'user', label: 'Customer', icon: <User size={17} />, desc: 'Book services' },
            { value: 'provider', label: 'Provider', icon: <Briefcase size={17} />, desc: 'Offer services' },
          ].map(({ value, label, icon, desc }) => (
            <button key={value} type="button" onClick={() => setRole(value)} style={{
              padding: '0.875rem', borderRadius: '0.875rem', cursor: 'pointer',
              border: role === value ? '2px solid #3b6cf4' : '1.5px solid rgba(59,108,244,0.15)',
              background: role === value ? 'rgba(59,108,244,0.06)' : 'white',
              transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
            }}>
              <span style={{ color: role === value ? '#3b6cf4' : '#94a3b8', transition: 'all 0.2s' }}>{icon}</span>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: role === value ? '#3b6cf4' : '#334155' }}>{label}</span>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{desc}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div>
            <label style={labelStyle}>Full Name</label>
            <input type="text" style={inputStyle} value={name} onChange={e => setName(e.target.value)} required placeholder="John Doe"
              onFocus={e => e.target.style.borderColor = '#3b6cf4'} onBlur={e => e.target.style.borderColor = 'rgba(59,108,244,0.15)'} />
          </div>
          <div>
            <label style={labelStyle}>Email Address</label>
            <input type="email" style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
              onFocus={e => e.target.style.borderColor = '#3b6cf4'} onBlur={e => e.target.style.borderColor = 'rgba(59,108,244,0.15)'} />
          </div>

          {/* Password with strength indicator */}
          <div>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                style={{ ...inputStyle, paddingRight: '2.75rem', borderColor: password ? (pwdPassed === 5 ? 'rgba(34,197,94,0.4)' : pwdPassed >= 3 ? 'rgba(234,179,8,0.4)' : 'rgba(239,68,68,0.3)') : 'rgba(59,108,244,0.15)' }}
                value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min. 8 characters"
                onFocus={e => e.target.style.outline = 'none'} />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: 0 }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Strength bar */}
            {password.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '3px', marginBottom: '0.5rem' }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} style={{
                      flex: 1, height: '4px', borderRadius: '2px',
                      background: i <= pwdPassed ? strengthColors[pwdPassed] : '#e2e8f0',
                      transition: 'background 0.3s',
                    }} />
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.72rem', color: strengthColors[pwdPassed], fontWeight: 600 }}>
                    {strengthLabels[pwdPassed]}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{pwdPassed}/5 requirements</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', background: '#f8faff', borderRadius: '0.625rem', padding: '0.625rem 0.75rem', border: '1px solid rgba(59,108,244,0.08)' }}>
                  <RuleRow ok={pwdChecks.length} label="At least 8 characters" />
                  <RuleRow ok={pwdChecks.upper} label="One uppercase letter (A-Z)" />
                  <RuleRow ok={pwdChecks.lower} label="One lowercase letter (a-z)" />
                  <RuleRow ok={pwdChecks.number} label="One number (0-9)" />
                  <RuleRow ok={pwdChecks.special} label="One special character (@$!%*?&_-#)" />
                </div>
              </div>
            )}
          </div>

          {/* Common: WhatsApp mobile */}
          <div>
            <label style={labelStyle}>
              WhatsApp Mobile Number <span style={{ color: '#ef4444' }}>*</span>
              <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: '0.75rem', marginLeft: '0.4rem' }}>(OTP will be sent here)</span>
            </label>
            <input type="tel" style={inputStyle} value={mobileNumber}
              onChange={e => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
              required maxLength={10} placeholder="10-digit WhatsApp number"
              onFocus={e => e.target.style.borderColor = '#3b6cf4'} onBlur={e => e.target.style.borderColor = 'rgba(59,108,244,0.15)'} />
            <p style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.3rem', lineHeight: 1.4 }}>
              📱 {role === 'provider' ? 'Customers will contact you on this number.' : 'This number will receive a WhatsApp OTP when a service is completed.'}
            </p>
          </div>

          {/* Provider: Service details */}
          {role === 'provider' && (
            <div style={{ padding: '1.25rem', background: 'rgba(59,108,244,0.04)', borderRadius: '1rem', border: '1px solid rgba(59,108,244,0.1)', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a', textAlign: 'center', marginBottom: '0.25rem' }}>Service Details</p>

              <div>
                <label style={labelStyle}>Service Title</label>
                <input type="text" style={inputStyle} value={serviceName} onChange={e => setServiceName(e.target.value)} required placeholder="e.g. Expert Home Plumbing"
                  onFocus={e => e.target.style.borderColor = '#3b6cf4'} onBlur={e => e.target.style.borderColor = 'rgba(59,108,244,0.15)'} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>Category</label>
                  <select style={inputStyle} value={serviceType} onChange={e => setServiceType(e.target.value)} required
                    onFocus={e => e.target.style.borderColor = '#3b6cf4'} onBlur={e => e.target.style.borderColor = 'rgba(59,108,244,0.15)'}>
                    <option value="">Select Type</option>
                    <option value="Plumber">Plumber</option>
                    <option value="Electrician">Electrician</option>
                    <option value="Mechanic">Mechanic</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="AC Repair">AC Repair</option>
                    <option value="Carpenter">Carpenter</option>
                    <option value="Appliance Repair">Appliance Repair</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Base Charge (₹)</label>
                  <input type="number" style={inputStyle} value={serviceCharges} onChange={e => setServiceCharges(e.target.value)} required min="0" placeholder="e.g. 500"
                    onFocus={e => e.target.style.borderColor = '#3b6cf4'} onBlur={e => e.target.style.borderColor = 'rgba(59,108,244,0.15)'} />
                </div>
              </div>
              <div style={{ position: 'relative' }}>
                <label style={labelStyle}>City / Area</label>
                <input type="text" style={{ ...inputStyle, paddingRight: '3rem' }} value={location} onChange={e => setLocation(e.target.value)} required placeholder="e.g. Bhubaneswar"
                  onFocus={e => e.target.style.borderColor = '#3b6cf4'} onBlur={e => e.target.style.borderColor = 'rgba(59,108,244,0.15)'} />
                <button type="button" onClick={handleGetLocation} disabled={isLocating} style={{ position: 'absolute', right: '0.625rem', bottom: '0.6rem', background: 'rgba(59,108,244,0.1)', border: 'none', borderRadius: '0.5rem', padding: '0.35rem', cursor: 'pointer', color: '#3b6cf4', display: 'flex', alignItems: 'center' }}>
                  <LocateFixed size={16} style={{ animation: isLocating ? 'spin 1s linear infinite' : 'none' }} />
                </button>
              </div>

              <div>
                <label style={labelStyle}>About Your Service</label>
                <textarea style={{ ...inputStyle, resize: 'none' }} value={description} onChange={e => setDescription(e.target.value)} required rows="3" placeholder="Describe your experience..."
                  onFocus={e => e.target.style.borderColor = '#3b6cf4'} onBlur={e => e.target.style.borderColor = 'rgba(59,108,244,0.15)'} />
              </div>

              {/* Service Image */}
              <div>
                <label style={labelStyle}>Service Image <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
                <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                {imagePreview ? (
                  <div style={{ position: 'relative', borderRadius: '0.875rem', overflow: 'hidden', border: '2px solid rgba(59,108,244,0.2)' }}>
                    <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)', display: 'flex', alignItems: 'flex-end', padding: '0.625rem' }}>
                      <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 600 }}>✓ Image selected</span>
                    </div>
                    <button type="button" onClick={clearImage} style={{ position: 'absolute', top: '8px', right: '8px', width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(239,68,68,0.9)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => imageInputRef.current?.click()} style={{
                    width: '100%', padding: '1.25rem', border: '2px dashed rgba(59,108,244,0.25)',
                    borderRadius: '0.875rem', background: 'rgba(59,108,244,0.03)',
                    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b6cf4'; e.currentTarget.style.background = 'rgba(59,108,244,0.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(59,108,244,0.25)'; e.currentTarget.style.background = 'rgba(59,108,244,0.03)'; }}>
                    <ImagePlus size={24} color="#3b6cf4" />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#3b6cf4' }}>Click to upload service image</span>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>JPG, PNG, WebP up to 5MB</span>
                  </button>
                )}
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            marginTop: '0.5rem', width: '100%', padding: '0.9rem',
            background: loading ? '#94a3b8' : 'linear-gradient(135deg, #3b6cf4, #2550d0)',
            color: 'white', border: 'none', borderRadius: '0.75rem',
            fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s', boxShadow: loading ? 'none' : '0 4px 15px rgba(59,108,244,0.35)',
          }}>
            {loading ? 'Creating Account...' : 'Register Now'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 700, color: '#3b6cf4', textDecoration: 'none' }}>Sign In</Link>
        </div>
          </>
        )}

        {view === 'otp' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(59,108,244,0.12), rgba(124,58,237,0.12))', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', border: '2px solid rgba(59,108,244,0.2)' }}>
                <ShieldCheck size={26} color="#3b6cf4" />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Verify Your Email</h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem', lineHeight: 1.6 }}>
                We've sent a <strong>6-digit verification code</strong> to<br />
                <span style={{ color: '#3b6cf4', fontWeight: 600 }}>{email}</span>
              </p>
            </div>

            {error && <div style={{ background: '#fff1f2', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.875rem', color: '#dc2626', textAlign: 'center' }}>{error}</div>}

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
                : <><ShieldCheck size={17} /> Verify & Create Account</>}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
              <button onClick={() => { setView('register'); setError(null); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.82rem', padding: 0 }}>
                <ArrowLeft size={14} /> Back to Sign Up
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Register;
