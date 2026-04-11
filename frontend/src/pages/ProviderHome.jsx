import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BarChart2, Briefcase, Star, Phone, TrendingUp, Users,
  PlusCircle, Settings, ArrowRight, Zap, CheckCircle,
  Clock, MessageCircle, MapPin, IndianRupee, Award, Target,
  ChevronRight, RefreshCw,
} from 'lucide-react';
import api from '../api/axios';

const GROWTH_TIPS = [
  { icon: '📸', title: 'Add a Service Photo', desc: 'Listings with images get 3× more inquiries. Upload a professional photo from your Dashboard.', action: '/dashboard', actionLabel: 'Go to Dashboard' },
  { icon: '⭐', title: 'Earn More Reviews', desc: 'Ask satisfied customers to leave a review. Providers with 5+ reviews see 60% more contacts.', action: null, actionLabel: null },
  { icon: '📍', title: 'Pin Your Exact Location', desc: 'Enable GPS location when listing to appear in "Near Me" searches and reach customers faster.', action: '/dashboard', actionLabel: 'Update Location' },
  { icon: '💬', title: 'Respond Within 1 Hour', desc: 'Fast responses build trust. Customers are 80% more likely to hire you if you reply quickly.', action: null, actionLabel: null },
];

const ProviderHome = () => {
  const navigate = useNavigate();
  const userInfoStr = localStorage.getItem('userInfo');
  const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
  const firstName = userInfo?.name?.split(' ')[0] || 'Provider';

  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [servRes, bookRes] = await Promise.all([
          api.get('/services'),
          api.get('/bookings/my-history'),
        ]);
        const myServices = servRes.data.filter(
          s => s.provider === userInfo?._id || s.provider?._id === userInfo?._id
        );
        setServices(myServices);
        setBookings(bookRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Derived stats
  const totalContacts = bookings.length;
  const completedJobs = bookings.filter(b => b.status === 'completed').length;
  const avgRating = services.length
    ? (services.reduce((a, s) => a + (s.rating || 0), 0) / services.length).toFixed(1)
    : '0.0';
  const totalReviews = services.reduce((a, s) => a + (s.numReviews || 0), 0);

  const recentBookings = bookings.slice(0, 4);

  const getHour = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const interactionIcon = (type) => {
    if (type === 'whatsapp') return <MessageCircle size={14} color="#25d366" />;
    if (type === 'call') return <Phone size={14} color="#3b6cf4" />;
    return <Phone size={14} color="#94a3b8" />;
  };

  const statusColor = (status) => {
    if (status === 'completed') return { bg: '#dcfce7', color: '#16a34a' };
    if (status === 'contacted') return { bg: '#eff6ff', color: '#3b6cf4' };
    return { bg: '#f1f5f9', color: '#64748b' };
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: '5rem' }}>
      {/* =========================================================== */}
      {/* PROVIDER HERO                                                */}
      {/* =========================================================== */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 35%, #4f46e5 65%, #7c3aed 100%)',
        padding: '3.5rem 0 4rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background decorations */}
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '380px', height: '380px', background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-100px', left: '-60px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        {/* Dot grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '28px 28px', opacity: 0.6, pointerEvents: 'none' }} />

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="provider-hero-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
            {/* Left: greeting + quick actions */}
            <div style={{ flex: 1, minWidth: '280px' }}>
              {/* Greeting badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '9999px', padding: '0.35rem 1rem',
                fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)',
                marginBottom: '1.25rem', backdropFilter: 'blur(10px)',
              }}>
                <Zap size={13} fill="rgba(255,255,255,0.8)" color="rgba(255,255,255,0.8)" />
                Provider Dashboard
              </div>

              <h1 style={{
                fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 800,
                color: 'white', letterSpacing: '-0.03em', lineHeight: 1.15,
                marginBottom: '0.75rem', fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}>
                {getHour()},<br />{firstName}! 👋
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '2rem', maxWidth: '420px' }}>
                Here's an overview of your business performance. Manage your services, track contacts, and grow your customer base.
              </p>

              {/* Quick action buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button onClick={() => navigate('/dashboard')} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.75rem 1.5rem', borderRadius: '9999px',
                  background: 'white', color: '#4f46e5',
                  border: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  transition: 'all 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <BarChart2 size={16} /> My Dashboard
                </button>
                <button onClick={() => { navigate('/dashboard'); }} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.75rem 1.5rem', borderRadius: '9999px',
                  background: 'rgba(255,255,255,0.12)', color: 'white',
                  border: '1.5px solid rgba(255,255,255,0.3)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                  backdropFilter: 'blur(10px)', transition: 'all 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                >
                  <PlusCircle size={16} /> Add New Service
                </button>
              </div>
            </div>

            {/* Right: Live stats grid */}
            {!loading && (
              <div className="provider-hero-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', flexShrink: 0, minWidth: '260px' }}>
                {[
                  { icon: <Briefcase size={20} color="white" />, value: services.length, label: 'Active Services', bg: 'rgba(255,255,255,0.12)', border: 'rgba(255,255,255,0.15)' },
                  { icon: <Users size={20} color="white" />, value: totalContacts, label: 'Total Contacts', bg: 'rgba(255,255,255,0.12)', border: 'rgba(255,255,255,0.15)' },
                  { icon: <Star size={20} color="white" fill="white" />, value: avgRating === '0.0' ? 'New' : `${avgRating}★`, label: 'Avg Rating', bg: 'rgba(245,158,11,0.2)', border: 'rgba(245,158,11,0.3)' },
                  { icon: <CheckCircle size={20} color="white" />, value: completedJobs, label: 'Jobs Done', bg: 'rgba(16,185,129,0.2)', border: 'rgba(16,185,129,0.3)' },
                ].map(({ icon, value, label, bg, border }) => (
                  <div key={label} style={{
                    background: bg, border: `1px solid ${border}`,
                    borderRadius: '1.125rem', padding: '1.25rem',
                    backdropFilter: 'blur(10px)',
                    transition: 'transform 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={{ marginBottom: '0.625rem' }}>{icon}</div>
                    <div style={{ fontSize: '1.625rem', fontWeight: 800, color: 'white', lineHeight: 1.1 }}>{value}</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)', marginTop: '0.25rem', fontWeight: 500 }}>{label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================== */}
      {/* MAIN CONTENT                                                  */}
      {/* =========================================================== */}
      <div className="container" style={{ marginTop: '-1.5rem', position: 'relative', zIndex: 3 }}>

        {/* ---- Quick Action Cards ---- */}
        <div className="quick-actions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          {[
            { icon: '🛠️', label: 'Manage Services', desc: 'Edit or add listings', action: '/dashboard', color: '#4f46e5' },
            { icon: '📋', label: 'View Bookings', desc: 'See who contacted you', action: '/dashboard', color: '#0284c7' },
            { icon: '⭐', label: 'My Reviews', desc: `${totalReviews} reviews earned`, action: '/', color: '#d97706' },
            { icon: '⚙️', label: 'Account Settings', desc: 'Update your profile', action: '/', color: '#7c3aed' },
          ].map(({ icon, label, desc, action, color }) => (
            <div key={label}
              onClick={() => navigate(action)}
              style={{
                background: 'white', borderRadius: '1.25rem', padding: '1.5rem',
                border: '1px solid rgba(59,108,244,0.08)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                cursor: 'pointer', transition: 'all 0.25s',
                display: 'flex', flexDirection: 'column', gap: '0.625rem',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 30px ${color}20`; e.currentTarget.style.borderColor = `${color}30`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = 'rgba(59,108,244,0.08)'; }}
            >
              <span style={{ fontSize: '1.75rem' }}>{icon}</span>
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a', marginBottom: '0.2rem' }}>{label}</p>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{desc}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color, fontSize: '0.75rem', fontWeight: 700, marginTop: 'auto' }}>
                Open <ChevronRight size={13} />
              </div>
            </div>
          ))}
        </div>

        <div className="provider-content-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '1.5rem', alignItems: 'start' }}>

          {/* ---- My Services Preview ---- */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>Your Listings</p>
                <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0f172a' }}>My Services</h2>
              </div>
              <button onClick={() => navigate('/dashboard')} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                fontSize: '0.8rem', fontWeight: 600, color: '#4f46e5',
                background: 'rgba(79,70,229,0.06)', border: '1px solid rgba(79,70,229,0.15)',
                borderRadius: '9999px', padding: '0.4rem 1rem', cursor: 'pointer',
              }}>
                Manage All <ArrowRight size={13} />
              </button>
            </div>

            {loading ? (
              <div style={{ background: 'white', borderRadius: '1.25rem', padding: '3rem', textAlign: 'center' }}>
                <div style={{ width: '36px', height: '36px', border: '3px solid rgba(79,70,229,0.15)', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto' }} />
              </div>
            ) : services.length === 0 ? (
              <div style={{
                background: 'white', borderRadius: '1.25rem', padding: '3rem',
                textAlign: 'center', border: '1.5px dashed rgba(79,70,229,0.2)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🛠️</div>
                <h3 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>No Services Yet</h3>
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Create your first service listing to start receiving customer inquiries.</p>
                <button onClick={() => navigate('/dashboard')} style={{
                  padding: '0.7rem 1.75rem', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  color: 'white', border: 'none', borderRadius: '9999px', fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(79,70,229,0.35)',
                }}>
                  Create Listing
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {services.slice(0, 3).map(service => (
                  <div key={service._id} style={{
                    background: 'white', borderRadius: '1.125rem', padding: '1.125rem 1.25rem',
                    border: '1px solid rgba(59,108,244,0.08)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                    display: 'flex', gap: '1rem', alignItems: 'center',
                    transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(79,70,229,0.1)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                  >
                    {/* Service thumbnail */}
                    <div style={{
                      width: '56px', height: '56px', borderRadius: '0.875rem', flexShrink: 0,
                      overflow: 'hidden', border: '2px solid rgba(79,70,229,0.12)',
                      background: 'linear-gradient(135deg, #eff6ff, #e8e0ff)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {service.serviceImage ? (
                        <img src={service.serviceImage?.startsWith('http') ? service.serviceImage : `https://smart-local-service-finder-server.onrender.com${service.serviceImage}`} alt={service.serviceName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      ) : (
                        <span style={{ fontSize: '1.5rem' }}>🛠️</span>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ background: 'rgba(79,70,229,0.08)', color: '#4f46e5', borderRadius: '9999px', padding: '0.1rem 0.5rem', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase' }}>
                          {service.serviceType}
                        </span>
                        {service.rating > 0 && (
                          <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 700 }}>★ {service.rating?.toFixed(1)}</span>
                        )}
                      </div>
                      <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{service.serviceName}</p>
                      <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={11} />{service.location}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><IndianRupee size={11} />₹{service.serviceCharges}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.2rem' }}>Reviews</p>
                      <p style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>{service.numReviews || 0}</p>
                    </div>
                  </div>
                ))}
                {services.length > 3 && (
                  <button onClick={() => navigate('/dashboard')} style={{
                    padding: '0.7rem', background: 'rgba(79,70,229,0.05)', border: '1px dashed rgba(79,70,229,0.2)',
                    borderRadius: '1rem', color: '#4f46e5', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                  }}>
                    View all {services.length} services →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ---- Right Column: Recent Bookings + Growth Tips ---- */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Recent Activity */}
            <div style={{ background: 'white', borderRadius: '1.25rem', padding: '1.5rem', border: '1px solid rgba(59,108,244,0.08)', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.125rem' }}>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>Recent Contacts</h3>
                <Clock size={16} color="#94a3b8" />
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                  <div style={{ width: '28px', height: '28px', border: '2px solid rgba(79,70,229,0.15)', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto' }} />
                </div>
              ) : recentBookings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                  <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</p>
                  <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>No contacts yet. Keep your listing active!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {recentBookings.map(booking => {
                    const sc = statusColor(booking.status);
                    return (
                      <div key={booking._id} style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.75rem', borderRadius: '0.875rem',
                        background: '#f8faff', border: '1px solid rgba(59,108,244,0.06)',
                      }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
                          {booking.customer?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 600, fontSize: '0.82rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {booking.customer?.name || 'Customer'}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.1rem' }}>
                            {interactionIcon(booking.interactionType)}
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{booking.interactionType}</span>
                          </div>
                        </div>
                        <span style={{ background: sc.bg, color: sc.color, borderRadius: '9999px', padding: '0.15rem 0.625rem', fontSize: '0.68rem', fontWeight: 700, textTransform: 'capitalize', flexShrink: 0 }}>
                          {booking.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Growth Tips */}
            <div style={{ background: 'white', borderRadius: '1.25rem', padding: '1.5rem', border: '1px solid rgba(59,108,244,0.08)', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.125rem' }}>
                <TrendingUp size={16} color="#4f46e5" />
                <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>Grow Faster</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {GROWTH_TIPS.map(({ icon, title, desc, action, actionLabel }) => (
                  <div key={title} style={{
                    padding: '0.875rem', borderRadius: '0.875rem',
                    background: 'rgba(79,70,229,0.03)', border: '1px solid rgba(79,70,229,0.08)',
                    transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(79,70,229,0.06)'; e.currentTarget.style.borderColor = 'rgba(79,70,229,0.15)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(79,70,229,0.03)'; e.currentTarget.style.borderColor = 'rgba(79,70,229,0.08)'; }}
                  >
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1.25rem', lineHeight: 1, flexShrink: 0 }}>{icon}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a', marginBottom: '0.25rem' }}>{title}</p>
                        <p style={{ fontSize: '0.74rem', color: '#64748b', lineHeight: 1.6 }}>{desc}</p>
                        {action && actionLabel && (
                          <Link to={action} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem', fontSize: '0.74rem', fontWeight: 700, color: '#4f46e5', textDecoration: 'none' }}>
                            {actionLabel} <ChevronRight size={12} />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* =========================================================== */}
        {/* Platform Performance Banner                                  */}
        {/* =========================================================== */}
        <div className="platform-banner-inner" style={{
          marginTop: '2.5rem',
          background: 'linear-gradient(135deg, #1e1b4b, #4f46e5)',
          borderRadius: '1.5rem', padding: '2.5rem',
          display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 12px 40px rgba(79,70,229,0.25)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
          <div style={{ flex: 1, minWidth: '240px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Award size={18} color="#fcd34d" />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Platform Insights</span>
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', letterSpacing: '-0.03em', marginBottom: '0.625rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Reach more customers<br />in your area
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', lineHeight: 1.7 }}>
              Our platform has 10,000+ active users searching for local services every day. Make sure your listing is complete to maximize visibility.
            </p>
          </div>
          <div className="platform-stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', flexShrink: 0 }}>
            {[
              { value: '10K+', label: 'Daily Users', icon: '👥' },
              { value: '3×', label: 'More Leads w/ Photo', icon: '📸' },
              { value: '4.8★', label: 'Avg Provider Rating', icon: '⭐' },
              { value: '< 1hr', label: 'Avg Response Time', icon: '⚡' },
            ].map(({ value, label, icon }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '1rem', padding: '1rem', textAlign: 'center', backdropFilter: 'blur(10px)' }}>
                <div style={{ fontSize: '1.25rem', marginBottom: '0.2rem' }}>{icon}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>{value}</div>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.65)', marginTop: '0.1rem' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProviderHome;
