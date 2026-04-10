import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Phone, MessageCircle, CheckCircle, Star, X, Calendar, MapPin, ShieldCheck } from 'lucide-react';
import api from '../api/axios';
import { io } from 'socket.io-client';

const AVATAR_COLORS = [
  'linear-gradient(135deg, #3b6cf4, #7c3aed)',
  'linear-gradient(135deg, #06b6d4, #3b6cf4)',
  'linear-gradient(135deg, #10b981, #06b6d4)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #7c3aed, #ec4899)',
];

const UserDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  const socketRef = useRef(null);

  const navigate = useNavigate();
  const userInfoStr = localStorage.getItem('userInfo');
  const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;

  useEffect(() => {
    if (!userInfo) { navigate('/login'); }
    else {
      fetchHistory();
      // Connect Socket.IO — join the user's personal room for real-time updates
      const socket = io('https://smart-local-service-finder-server.onrender.com', { transports: ['websocket'] });
      socketRef.current = socket;
      socket.on('connect', () => {
        socket.emit('join_room', userInfo._id);
      });
      // When the provider confirms OTP, this event fires and updates the UI instantly
      socket.on('booking_completed', () => {
        fetchHistory();
      });
      // When provider requests completion, refresh so the WhatsApp hint appears
      socket.on('completion_requested', () => {
        fetchHistory();
      });
      return () => socket.disconnect();
    }
  }, [navigate]);

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/bookings/my-history');
      setBookings(data); setLoading(false);
    } catch (error) { console.error(error); setLoading(false); }
  };

  const handleRebookCall = async (booking) => {
    try {
      await api.post('/bookings', { serviceId: booking.service._id, interactionType: 'call' });
      window.open(`tel:${booking.service.mobileNumber}`, '_self');
      fetchHistory();
    } catch (e) { console.error(e); }
  };

  const handleRebookWhatsApp = async (booking) => {
    try {
      await api.post('/bookings', { serviceId: booking.service._id, interactionType: 'whatsapp' });
      let wpNumber = booking.service.mobileNumber;
      if (wpNumber.length === 10) wpNumber = `91${wpNumber}`;
      const message = encodeURIComponent(`Hello again ${booking.provider.name}, I would like to rebook your ${booking.service.serviceName} service.`);
      window.open(`https://wa.me/${wpNumber}?text=${message}`, '_blank');
      fetchHistory();
    } catch (e) { console.error(e); }
  };

  // Removed: handleVerifyOtp — user no longer enters OTP. Provider does it.

  const openReviewModal = (booking) => {
    setSelectedBooking(booking); setRating(5); setComment(''); setReviewModalOpen(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault(); setSubmittingReview(true);
    try {
      await api.post(`/services/${selectedBooking.service._id}/reviews`, { rating, comment });
      alert('Review submitted successfully!');
      setReviewModalOpen(false); fetchHistory();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit review. You may have already reviewed this service.');
    } finally { setSubmittingReview(false); }
  };

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', border: '3px solid rgba(59,108,244,0.15)', borderTopColor: '#3b6cf4', borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 1rem' }} />
        <p style={{ color: '#64748b' }}>Loading your bookings...</p>
      </div>
    </div>
  );

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: '4rem' }}>
      {/* Page Header */}
      <div style={{ background: 'linear-gradient(135deg, #3b6cf4 0%, #7c3aed 100%)', padding: '3rem 0 2rem' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <History size={24} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.03em' }}>
                My Bookings
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                Welcome back, {userInfo?.name}! Here are your service contacts.
              </p>
            </div>
          </div>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
            {[
              { label: 'Total Bookings', value: bookings.length, icon: '📋' },
              { label: 'Completed', value: bookings.filter(b => b.status === 'completed').length, icon: '✅' },
              { label: 'Active', value: bookings.filter(b => b.status !== 'completed').length, icon: '⚡' },
            ].map(({ label, value, icon }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', borderRadius: '1rem', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{icon}</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>{value}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2.5rem' }}>
        {bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'white', borderRadius: '1.5rem', border: '1px solid rgba(59,108,244,0.08)', boxShadow: '0 4px 20px rgba(59,108,244,0.06)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.25rem' }}>📋</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.625rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No Bookings Found</h3>
            <p style={{ color: '#64748b', marginBottom: '1.75rem', fontSize: '0.9rem' }}>You haven't contacted any services yet.</p>
            <button onClick={() => navigate('/')} style={{ padding: '0.75rem 2rem', background: 'linear-gradient(135deg, #3b6cf4, #2550d0)', color: 'white', border: 'none', borderRadius: '9999px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 15px rgba(59,108,244,0.3)' }}>
              Discover Services
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {bookings.map((booking, i) => {
              const isCompleted = booking.status === 'completed';
              const avatarColor = AVATAR_COLORS[(booking.service?.providerName?.charCodeAt(0) || i) % AVATAR_COLORS.length];

              return (
                <div key={booking._id} data-aos="fade-up" data-aos-delay={`${Math.min(i * 60, 300)}`} style={{
                  background: 'white', borderRadius: '1.25rem',
                  border: `1px solid ${isCompleted ? 'rgba(16,185,129,0.15)' : 'rgba(59,108,244,0.08)'}`,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.05)', overflow: 'hidden',
                  transition: 'all 0.3s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 35px rgba(59,108,244,0.12)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {/* Card top strip */}
                  <div style={{ height: '4px', background: isCompleted ? 'linear-gradient(90deg, #10b981, #06b6d4)' : 'linear-gradient(90deg, #3b6cf4, #7c3aed)' }} />
                  <div style={{ padding: '1.5rem' }}>
                    {/* Status + date */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <span style={{
                        background: isCompleted ? 'rgba(16,185,129,0.1)' : 'rgba(59,108,244,0.08)',
                        color: isCompleted ? '#059669' : '#3b6cf4',
                        borderRadius: '9999px', padding: '0.2rem 0.75rem',
                        fontSize: '0.72rem', fontWeight: 700,
                        border: `1px solid ${isCompleted ? 'rgba(16,185,129,0.2)' : 'rgba(59,108,244,0.15)'}`,
                      }}>
                        {isCompleted ? '✅ Completed' : '⚡ Contacted'}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Calendar size={11} />
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', marginBottom: '0.5rem' }}>
                      {booking.service?.serviceName || 'Service Deleted'}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.375rem' }}>
                      Provider: <span style={{ color: '#334155', fontWeight: 600 }}>{booking.provider?.name || 'Unknown'}</span>
                    </p>
                    {booking.service?.location && (
                      <p style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '1.25rem' }}>
                        <MapPin size={11} />{booking.service.location}
                      </p>
                    )}

                    {booking.service ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', borderTop: '1px solid rgba(59,108,244,0.06)', paddingTop: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          <button onClick={() => handleRebookCall(booking)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', padding: '0.6rem', borderRadius: '0.625rem', background: 'rgba(59,108,244,0.06)', border: '1px solid rgba(59,108,244,0.15)', color: '#3b6cf4', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,108,244,0.12)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(59,108,244,0.06)'}
                          >
                            <Phone size={13} /> Call
                          </button>
                          <button onClick={() => handleRebookWhatsApp(booking)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', padding: '0.6rem', borderRadius: '0.625rem', background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)', color: '#16a34a', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,211,102,0.15)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(37,211,102,0.08)'}
                          >
                            <MessageCircle size={13} /> WhatsApp
                          </button>
                        </div>

                        {/* Completion states — user just waits / gets notified */}
                        {!isCompleted && (
                          booking.status === 'completion_requested' ? (
                            <div style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.06), rgba(124,58,237,0.04))', border: '1px solid rgba(79,70,229,0.2)', borderRadius: '1rem', padding: '1.25rem', textAlign: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <ShieldCheck size={18} color="#4f46e5" />
                                <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#4f46e5', letterSpacing: '-0.01em' }}>Completion Requested</p>
                              </div>
                              <p style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 600, margin: '0.5rem 0' }}>
                                Check your email for the OTP!
                              </p>
                              <p style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.5, marginTop: '0.5rem' }}>
                                We've sent a 4-digit code to your registered email. Share this code with <strong>{booking.provider?.name}</strong> to confirm the work is done.
                              </p>
                            </div>
                          ) : (
                            // No completion requested yet
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.875rem', background: 'rgba(59,108,244,0.05)', border: '1px solid rgba(59,108,244,0.1)', borderRadius: '0.625rem', fontSize: '0.75rem', color: '#64748b' }}>
                              <span style={{ fontSize: '1rem' }}>⏳</span>
                              <span>Waiting for provider to mark as complete…</span>
                            </div>
                          )
                        )}

                        {isCompleted && (
                          <button onClick={() => openReviewModal(booking)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '0.625rem', background: 'linear-gradient(135deg, #3b6cf4, #2550d0)', color: 'white', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,108,244,0.3)', transition: 'all 0.2s' }}>
                            <Star size={15} fill="white" /> Leave a Review
                          </button>
                        )}
                      </div>
                    ) : (
                      <p style={{ color: '#f87171', fontSize: '0.8rem', fontStyle: 'italic', borderTop: '1px solid rgba(59,108,244,0.06)', paddingTop: '1rem' }}>
                        This service is no longer available.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModalOpen && selectedBooking && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: 'white', borderRadius: '1.75rem', padding: '2.5rem', width: '100%', maxWidth: '440px', position: 'relative', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', animation: 'bounceIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
            <button onClick={() => setReviewModalOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
              <X size={16} />
            </button>
            <h2 style={{ fontWeight: 800, fontSize: '1.25rem', color: '#0f172a', marginBottom: '0.5rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Review <span style={{ color: '#3b6cf4' }}>{selectedBooking.service?.serviceName}</span>
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.75rem' }}>Share your experience with this service</p>

            <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#334155', marginBottom: '0.75rem' }}>Rate your experience</label>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', padding: '1.25rem', background: '#f8faff', borderRadius: '1rem', border: '1px solid rgba(59,108,244,0.08)' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button type="button" key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', transition: 'transform 0.15s' }}
                      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
                      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <Star size={36} fill={star <= (hoveredStar || rating) ? '#f59e0b' : 'none'} color={star <= (hoveredStar || rating) ? '#f59e0b' : '#d1d5db'} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: '#334155', marginBottom: '0.5rem' }}>Your Comment</label>
                <textarea
                  rows={4} required value={comment} onChange={e => setComment(e.target.value)}
                  placeholder="How was the service? Would you recommend them?"
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid rgba(59,108,244,0.15)', borderRadius: '0.875rem', resize: 'none', fontFamily: 'inherit', fontSize: '0.9rem', color: '#0f172a', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#3b6cf4'}
                  onBlur={e => e.target.style.borderColor = 'rgba(59,108,244,0.15)'}
                />
              </div>
              <button type="submit" disabled={submittingReview} style={{ width: '100%', padding: '0.875rem', background: submittingReview ? '#94a3b8' : 'linear-gradient(135deg, #3b6cf4, #2550d0)', color: 'white', border: 'none', borderRadius: '0.875rem', fontWeight: 700, fontSize: '1rem', cursor: submittingReview ? 'not-allowed' : 'pointer', boxShadow: submittingReview ? 'none' : '0 4px 15px rgba(59,108,244,0.35)' }}>
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
