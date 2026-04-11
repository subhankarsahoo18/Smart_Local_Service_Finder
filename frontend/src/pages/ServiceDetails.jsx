import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Phone, MessageCircle, Star, IndianRupee, ArrowLeft, ShieldCheck, X, Loader2 } from 'lucide-react';
import api from '../api/axios';

const AVATAR_COLORS = [
  'linear-gradient(135deg, #3b6cf4, #7c3aed)',
  'linear-gradient(135deg, #06b6d4, #3b6cf4)',
  'linear-gradient(135deg, #10b981, #06b6d4)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
];

const ServiceDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(JSON.parse(localStorage.getItem('userInfo')) || null);
  
  // Mobile Prompt State
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [newMobileNumber, setNewMobileNumber] = useState('');
  const [mobileUpdating, setMobileUpdating] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const { data } = await api.get(`/services/${id}`);
        setService(data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        setLoading(false);
      }
    };
    fetchService();
  }, [id]);

  const proceedWithAction = async (type) => {
    try {
      // Log interaction
      await api.post('/bookings', { serviceId: id, interactionType: type });
    } catch (err) {
      console.warn("Analytics log failed:", err);
    }
    
    if (type === 'call') {
      window.open(`tel:${service.mobileNumber}`, '_self');
    } else {
      let wpNumber = service.mobileNumber;
      if (wpNumber.length === 10) wpNumber = `91${wpNumber}`;
      const message = encodeURIComponent(`Hello ${service.providerName}, I want to book your ${service.serviceName} service as seen on Smart Local.`);
      window.open(`https://wa.me/${wpNumber}?text=${message}`, '_blank');
    }
    setPendingAction(null);
  };

  const handleBookingAction = (type) => {
    if (!userInfo) {
      navigate('/login');
      return;
    }
    if (!userInfo.mobileNumber) {
      setPendingAction(type);
      setShowMobileModal(true);
      return;
    }
    proceedWithAction(type);
  };

  const handleUpdateMobile = async (e) => {
    e.preventDefault();
    if (newMobileNumber.length !== 10) return;
    setMobileUpdating(true);
    try {
      const { data } = await api.put('/auth/update-mobile', { mobileNumber: newMobileNumber });
      localStorage.setItem('userInfo', JSON.stringify(data));
      setUserInfo(data);
      setShowMobileModal(false);
      setMobileUpdating(false);
      
      // Auto-continue with pending action
      if (pendingAction) {
        proceedWithAction(pendingAction);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update mobile number.');
      setMobileUpdating(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', border: '3px solid rgba(59,108,244,0.15)', borderTopColor: '#3b6cf4', borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 1rem' }} />
        <p style={{ color: '#64748b' }}>Loading service details...</p>
      </div>
    </div>
  );

  if (error || !service) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ background: 'white', borderRadius: '1.25rem', padding: '2rem', textAlign: 'center', color: error ? '#dc2626' : '#64748b', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', maxWidth: '400px' }}>
        {error || 'Service not found'}
      </div>
    </div>
  );

  const avatarColor = AVATAR_COLORS[(service.providerName?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  const stars = service.rating ? Math.round(service.rating) : 0;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: '4rem' }}>
      <div className="container" style={{ paddingTop: '2.5rem' }}>
        {/* Back link */}
        <Link to="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: 'white', border: '1px solid rgba(59,108,244,0.15)',
          borderRadius: '9999px', padding: '0.5rem 1rem',
          fontSize: '0.85rem', fontWeight: 600, color: '#334155',
          textDecoration: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          marginBottom: '2rem', transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.color = '#3b6cf4'; e.currentTarget.style.borderColor = '#3b6cf4'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#334155'; e.currentTarget.style.borderColor = 'rgba(59,108,244,0.15)'; }}
        >
          <ArrowLeft size={16} />
          Back to Services
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '1.5rem' }}>

            {/* Two-column layout on larger screens */}
            <div className="service-detail-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem' }}>

              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Main Card */}
                <div style={{ background: 'white', borderRadius: '1.5rem', border: '1px solid rgba(59,108,244,0.08)', boxShadow: '0 4px 20px rgba(59,108,244,0.07)', overflow: 'hidden' }}>
                  {/* Top image or accent */}
                  {service.serviceImage ? (
                    <div style={{ height: '260px', overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg, #eff6ff, #dce8ff)' }}>
                      <img
                        src={service.serviceImage?.startsWith('http') ? service.serviceImage : `https://smart-local-service-finder-server.onrender.com${service.serviceImage}`}
                        alt={service.serviceName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
                        onError={e => { e.target.parentNode.style.background = 'linear-gradient(135deg, #eff6ff, #dce8ff)'; e.target.style.display = 'none'; }}
                      />
                      {/* Gradient overlay at bottom for contrast */}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px', background: 'linear-gradient(to top, rgba(255,255,255,0.95), transparent)' }} />
                      <div style={{ position: 'absolute', top: '14px', left: '14px' }}>
                        <span style={{ background: 'rgba(255,255,255,0.92)', color: '#3b6cf4', borderRadius: '9999px', padding: '0.3rem 0.875rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', backdropFilter: 'blur(8px)' }}>
                          {service.serviceType}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ height: '5px', background: 'linear-gradient(90deg, #3b6cf4, #7c3aed)' }} />
                  )}
                  <div style={{ padding: '2.25rem' }}>
                    {/* Badge + rating row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <span style={{ background: 'rgba(59,108,244,0.08)', color: '#3b6cf4', border: '1px solid rgba(59,108,244,0.15)', borderRadius: '9999px', padding: '0.3rem 0.875rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {service.serviceType}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        {stars > 0 ? (
                          <>
                            {[...Array(5)].map((_, i) => <Star key={i} size={16} fill={i < stars ? '#f59e0b' : 'none'} color={i < stars ? '#f59e0b' : '#d1d5db'} />)}
                            <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: '1rem', marginLeft: '0.25rem' }}>{service.rating?.toFixed(1)}</span>
                          </>
                        ) : <span style={{ fontSize: '0.8rem', color: '#94a3b8', background: '#f1f5f9', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontWeight: 600 }}>New Provider</span>}
                      </div>
                    </div>

                    <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: '1.25rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {service.serviceName}
                    </h1>

                    {/* Info pills */}
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.75rem', paddingBottom: '1.75rem', borderBottom: '1px solid rgba(59,108,244,0.08)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8faff', border: '1px solid rgba(59,108,244,0.1)', borderRadius: '0.75rem', padding: '0.5rem 1rem', fontSize: '0.9rem', color: '#334155' }}>
                        <MapPin size={16} color="#7c3aed" /> {service.location}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f0fdf4', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '0.75rem', padding: '0.5rem 1rem', fontSize: '0.9rem', color: '#0f172a' }}>
                        <IndianRupee size={16} color="#10b981" />
                        <span style={{ fontWeight: 700 }}>₹{service.serviceCharges}</span>
                        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>onwards</span>
                      </div>
                    </div>

                    <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', marginBottom: '0.875rem' }}>Description</h3>
                    <p style={{ color: '#475569', lineHeight: 1.8, background: '#f8faff', borderRadius: '1rem', padding: '1.25rem', border: '1px solid rgba(59,108,244,0.06)' }}>
                      {service.description || 'No description provided for this service.'}
                    </p>
                  </div>
                </div>

                {/* Reviews Card */}
                <div style={{ background: 'white', borderRadius: '1.5rem', border: '1px solid rgba(59,108,244,0.08)', boxShadow: '0 4px 20px rgba(59,108,244,0.07)', padding: '2rem' }}>
                  <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Customer Reviews
                    <span style={{ background: '#f1f5f9', color: '#64748b', borderRadius: '9999px', padding: '0.15rem 0.625rem', fontSize: '0.8rem', fontWeight: 600 }}>
                      {service.reviews?.length || 0}
                    </span>
                  </h3>

                  {service.reviews?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {service.reviews.map((review, index) => (
                        <div key={review._id || index} style={{ background: '#f8faff', border: '1px solid rgba(59,108,244,0.08)', borderRadius: '1rem', padding: '1.25rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>{review.name}</span>
                            <div style={{ display: 'flex', gap: '2px' }}>
                              {[...Array(review.rating)].map((_, i) => <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />)}
                            </div>
                          </div>
                          <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2.5rem', background: '#f8faff', borderRadius: '1rem', border: '1.5px dashed rgba(59,108,244,0.15)' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⭐</div>
                      <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No reviews yet. Be the first!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Contact Sidebar */}
              <div>
                <div style={{ background: 'white', borderRadius: '1.5rem', border: '1px solid rgba(59,108,244,0.08)', boxShadow: '0 8px 30px rgba(59,108,244,0.1)', padding: '1.75rem', position: 'sticky', top: '90px' }}>
                  {/* Provider info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: 'linear-gradient(135deg, #f0f4ff, #f8faff)', borderRadius: '1rem', border: '1px solid rgba(59,108,244,0.1)' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.25rem', fontWeight: 800, flexShrink: 0 }}>
                      {service.providerName?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.2rem' }}>Provided by</p>
                      <p style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>{service.providerName}</p>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.3rem', background: 'rgba(16,185,129,0.1)', color: '#059669', borderRadius: '9999px', padding: '0.15rem 0.6rem', fontSize: '0.72rem', fontWeight: 600 }}>
                        <ShieldCheck size={11} /> Verified Partner
                      </div>
                    </div>
                  </div>

                  <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', marginBottom: '1rem' }}>Contact Professional</h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button onClick={() => handleBookingAction('call')} style={{
                      width: '100%', padding: '0.875rem', borderRadius: '0.875rem',
                      background: 'linear-gradient(135deg, #3b6cf4, #2550d0)', color: 'white',
                      border: 'none', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem',
                      boxShadow: '0 4px 15px rgba(59,108,244,0.35)', transition: 'all 0.2s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <Phone size={18} /> Call Directly
                    </button>
                    <button onClick={() => handleBookingAction('whatsapp')} style={{
                      width: '100%', padding: '0.875rem', borderRadius: '0.875rem',
                      background: 'linear-gradient(135deg, #128C7E, #25D366)', color: 'white',
                      border: 'none', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem',
                      boxShadow: '0 4px 15px rgba(37,211,102,0.3)', transition: 'all 0.2s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <MessageCircle size={18} /> WhatsApp Message
                    </button>
                  </div>

                  <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(59,108,244,0.04)', borderRadius: '0.875rem', border: '1px solid rgba(59,108,244,0.08)', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.6 }}>
                      Mention <span style={{ color: '#3b6cf4', fontWeight: 700 }}>Smart Local Finder</span> to get the best prices and priority service!
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Mobile Number Modal */}
      {showMobileModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', borderRadius: '1.5rem', width: '90%', maxWidth: '440px', padding: '2rem', position: 'relative', boxShadow: '0 24px 48px rgba(0,0,0,0.1)' }}>
            <button onClick={() => setShowMobileModal(false)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: '#f1f5f9', border: 'none', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
              <X size={16} />
            </button>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(59,108,244,0.1), rgba(16,185,129,0.1))', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', border: '2px solid rgba(59,108,244,0.15)' }}>
                <Phone size={24} color="#3b6cf4" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Complete Your Profile</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.4rem', lineHeight: 1.5 }}>
                Please provide your mobile number. We use this to send you OTPs when a service job gets completed.
              </p>
            </div>
            
            <form onSubmit={handleUpdateMobile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>Mobile Number <span style={{ color: '#ef4444' }}>*</span></label>
                <input 
                  type="tel" 
                  value={newMobileNumber}
                  onChange={e => setNewMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  required 
                  maxLength={10} 
                  placeholder="10-digit number"
                  style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '0.75rem', border: '1.5px solid rgba(59,108,244,0.2)', fontSize: '0.95rem', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#3b6cf4'} 
                  onBlur={e => e.target.style.borderColor = 'rgba(59,108,244,0.2)'}
                  autoFocus
                />
              </div>
              <button 
                type="submit" 
                disabled={mobileUpdating || newMobileNumber.length !== 10}
                style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', background: mobileUpdating || newMobileNumber.length !== 10 ? '#94a3b8' : '#3b6cf4', color: 'white', border: 'none', fontWeight: 700, fontSize: '0.95rem', cursor: mobileUpdating || newMobileNumber.length !== 10 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}>
                {mobileUpdating ? <Loader2 size={16} className="spin" /> : 'Save & Continue'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Global spin animation class for loader if needed, or inline */}
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ServiceDetails;
