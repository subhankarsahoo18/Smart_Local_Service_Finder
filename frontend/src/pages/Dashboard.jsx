import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit, Wrench, Users, BarChart2, MapPin, Phone, ImagePlus, CheckCircle, KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import api from '../api/axios';
import { io } from 'socket.io-client';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const userInfoStr = localStorage.getItem('userInfo');
  const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;

  const [showForm, setShowForm] = useState(false);
  const [uploadingImageId, setUploadingImageId] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const imageInputRefs = useRef({});
  // otpMap: bookingId -> { requesting, otpInput, verifying, error }
  const [otpMap, setOtpMap] = useState({});
  const [formData, setFormData] = useState({
    serviceName: '', serviceType: 'Electrician', location: '', serviceCharges: '', mobileNumber: '', description: ''
  });
  const [editingService, setEditingService] = useState(null); // service being edited
  const [editFormData, setEditFormData] = useState({
    serviceName: '', serviceType: 'Electrician', location: '', serviceCharges: '', mobileNumber: '', description: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userInfo || userInfo.role !== 'provider') { navigate('/login'); }
    else {
      fetchData();
      // Connect Socket.IO and join the provider's personal room
      const socket = io('https://smart-local-service-finder-server.onrender.com');
      socketRef.current = socket;
      socket.on('connect', () => {
        socket.emit('join_room', userInfo._id);
      });
      // Real-time: when a booking is completed, refresh booking list instantly
      socket.on('booking_completed', () => {
        fetchMyBookings();
      });
      return () => socket.disconnect();
    }
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchMyServices(), fetchMyBookings()]);
    setLoading(false);
  };

  const fetchMyBookings = async () => {
    try { const { data } = await api.get('/bookings/my-history'); setBookings(data); }
    catch (error) { console.error(error); }
  };

  const fetchMyServices = async () => {
    try {
      const { data } = await api.get('/services');
      const myServices = data.filter(s => s.provider === userInfo._id || s.provider._id === userInfo._id);
      setServices(myServices);
    } catch (error) { console.error(error); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/services', formData);
      setShowForm(false); fetchMyServices();
      setFormData({ serviceName: '', serviceType: 'Electrician', location: '', serviceCharges: '', mobileNumber: '', description: '' });
    } catch (error) { alert("Error creating service: " + (error.response?.data?.message || error.message)); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this service listing?')) {
      try { await api.delete(`/services/${id}`); fetchMyServices(); }
      catch { alert("Error deleting service"); }
    }
  };

  const handleEditOpen = (service) => {
    setEditingService(service);
    setEditFormData({
      serviceName: service.serviceName || '',
      serviceType: service.serviceType || 'Electrician',
      location: service.location || '',
      serviceCharges: service.serviceCharges || '',
      mobileNumber: service.mobileNumber || '',
      description: service.description || '',
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await api.put(`/services/${editingService._id}`, editFormData);
      setEditingService(null);
      fetchMyServices();
    } catch (error) {
      alert('Error updating service: ' + (error.response?.data?.message || error.message));
    } finally {
      setEditLoading(false);
    }
  };

  const handleImageUpload = async (serviceId, file) => {
    if (!file) return;
    setUploadingImageId(serviceId);
    try {
      const formData = new FormData();
      formData.append('serviceImage', file);
      await api.put(`/services/${serviceId}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadSuccess(serviceId);
      setTimeout(() => setUploadSuccess(null), 3000);
      fetchMyServices(); // refresh to get updated serviceImage
    } catch (err) {
      alert('Image upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingImageId(null);
      if (imageInputRefs.current[serviceId]) imageInputRefs.current[serviceId].value = '';
    }
  };

  const handleRequestCompletion = async (bookingId) => {
    setOtpMap(prev => ({ ...prev, [bookingId]: { requesting: true, otpInput: '', verifying: false, error: null } }));
    try {
      const { data } = await api.post(`/bookings/${bookingId}/request-complete`);

      setOtpMap(prev => ({
        ...prev,
        [bookingId]: {
          requesting: false,
          otpInput: '',
          verifying: false,
          error: null,
          message: data.message,
        },
      }));
      fetchMyBookings();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
      setOtpMap(prev => { const n = { ...prev }; delete n[bookingId]; return n; });
    }
  };

  const handleVerifyOtp = async (bookingId) => {
    const state = otpMap[bookingId];
    if (!state?.otpInput || state.otpInput.length < 4) {
      setOtpMap(prev => ({ ...prev, [bookingId]: { ...prev[bookingId], error: 'Please enter the 4-digit OTP from the customer.' } }));
      return;
    }
    setOtpMap(prev => ({ ...prev, [bookingId]: { ...prev[bookingId], verifying: true, error: null } }));
    try {
      await api.put(`/bookings/${bookingId}/complete`, { otp: state.otpInput });
      setOtpMap(prev => { const n = { ...prev }; delete n[bookingId]; return n; });
      fetchMyBookings();
    } catch (err) {
      setOtpMap(prev => ({ ...prev, [bookingId]: { ...prev[bookingId], verifying: false, error: err.response?.data?.message || 'Invalid OTP. Try again.' } }));
    }
  };

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', border: '3px solid rgba(59,108,244,0.15)', borderTopColor: '#3b6cf4', borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 1rem' }} />
        <p style={{ color: '#64748b' }}>Loading dashboard...</p>
      </div>
    </div>
  );

  const inputStyle = { width: '100%', padding: '0.7rem 0.9rem', border: '1.5px solid rgba(59,108,244,0.15)', borderRadius: '0.75rem', background: 'white', color: '#0f172a', fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontWeight: 500, fontSize: '0.82rem', color: '#475569', marginBottom: '0.35rem' };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: '4rem' }}>
      {/* Page Header */}
      <div style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #3b6cf4 100%)', padding: '3rem 0 2rem' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart2 size={24} color="white" />
              </div>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.03em' }}>Provider Dashboard</h1>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                  Hi {userInfo?.name}! Manage your listings and requests.
                </p>
              </div>
            </div>
            {activeTab === 'services' && (
              <button onClick={() => setShowForm(!showForm)} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.7rem 1.5rem', borderRadius: '9999px',
                background: showForm ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.2)',
                color: 'white', border: '1.5px solid rgba(255,255,255,0.3)',
                fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
                backdropFilter: 'blur(10px)', transition: 'all 0.2s',
              }}>
                {showForm ? '✕ Cancel' : <><Plus size={18} /> Add Service</>}
              </button>
            )}
          </div>

          {/* Overview stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
            {[
              { label: 'My Listings', value: services.length, icon: '🛠️' },
              { label: 'Total Bookings', value: bookings.length, icon: '📋' },
              { label: 'Completed', value: bookings.filter(b => b.status === 'completed').length, icon: '✅' },
              { label: 'Pending', value: bookings.filter(b => b.status !== 'completed').length, icon: '⏳' },
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
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '2px solid rgba(59,108,244,0.1)' }}>
          {[
            { key: 'services', label: '🛠️ My Services', count: services.length },
            { key: 'bookings', label: '📋 Booking Requests', count: bookings.length },
          ].map(({ key, label, count }) => (
            <button key={key} onClick={() => setActiveTab(key)} style={{
              padding: '0.75rem 1.25rem', borderRadius: '0.75rem 0.75rem 0 0',
              fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
              border: 'none', marginBottom: '-2px',
              background: activeTab === key ? 'white' : 'transparent',
              color: activeTab === key ? '#3b6cf4' : '#64748b',
              borderBottom: activeTab === key ? '2px solid #3b6cf4' : '2px solid transparent',
              transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              {label}
              <span style={{ background: activeTab === key ? 'rgba(59,108,244,0.1)' : '#f1f5f9', color: activeTab === key ? '#3b6cf4' : '#94a3b8', borderRadius: '9999px', padding: '0.1rem 0.5rem', fontSize: '0.72rem', fontWeight: 700 }}>{count}</span>
            </button>
          ))}
        </div>

        {/* Create Service Form */}
        {activeTab === 'services' && showForm && (
          <div data-aos="fade-down" style={{ background: 'white', borderRadius: '1.5rem', border: '1px solid rgba(59,108,244,0.12)', boxShadow: '0 8px 30px rgba(59,108,244,0.1)', padding: '2rem', marginBottom: '2rem', borderLeft: '4px solid #3b6cf4' }}>
            <h2 style={{ fontWeight: 800, fontSize: '1.125rem', color: '#0f172a', marginBottom: '1.5rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Create New Service Listing</h2>
            <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Service Title</label>
                <input type="text" style={inputStyle} required value={formData.serviceName} onChange={e => setFormData({ ...formData, serviceName: e.target.value })} placeholder="e.g. Expert Home AC Repair"
                  onFocus={e => e.target.style.borderColor = '#3b6cf4'} onBlur={e => e.target.style.borderColor = 'rgba(59,108,244,0.15)'} />
              </div>
              <div>
                <label style={labelStyle}>Category</label>
                <select style={inputStyle} required value={formData.serviceType} onChange={e => setFormData({ ...formData, serviceType: e.target.value })}
                  onFocus={e => e.target.style.borderColor = '#3b6cf4'} onBlur={e => e.target.style.borderColor = 'rgba(59,108,244,0.15)'}>
                  <option value="Electrician">Electrician</option>
                  <option value="Plumber">Plumber</option>
                  <option value="AC Repair">AC Repair</option>
                  <option value="Appliance Repair">Appliance Repair</option>
                  <option value="Mechanic">Mechanic</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Carpenter">Carpenter</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Base Charges (₹)</label>
                <input type="number" style={inputStyle} required value={formData.serviceCharges} onChange={e => setFormData({ ...formData, serviceCharges: e.target.value })} placeholder="e.g. 500"
                  onFocus={e => e.target.style.borderColor = '#3b6cf4'} onBlur={e => e.target.style.borderColor = 'rgba(59,108,244,0.15)'} />
              </div>
              <div>
                <label style={labelStyle}>Location (City/Area)</label>
                <input type="text" style={inputStyle} required value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="e.g. Patia, Bhubaneswar"
                  onFocus={e => e.target.style.borderColor = '#3b6cf4'} onBlur={e => e.target.style.borderColor = 'rgba(59,108,244,0.15)'} />
              </div>
              <div>
                <label style={labelStyle}>Mobile Number</label>
                <input type="text" style={inputStyle} required value={formData.mobileNumber} onChange={e => setFormData({ ...formData, mobileNumber: e.target.value })} placeholder="e.g. 9876543210"
                  onFocus={e => e.target.style.borderColor = '#3b6cf4'} onBlur={e => e.target.style.borderColor = 'rgba(59,108,244,0.15)'} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Description</label>
                <textarea style={{ ...inputStyle, resize: 'none' }} rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Describe your service, experience, and what's included..."
                  onFocus={e => e.target.style.borderColor = '#3b6cf4'} onBlur={e => e.target.style.borderColor = 'rgba(59,108,244,0.15)'} />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '0.7rem 1.5rem', borderRadius: '0.75rem', border: '1.5px solid rgba(59,108,244,0.2)', background: 'white', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.7rem 2rem', borderRadius: '0.75rem', background: 'linear-gradient(135deg, #3b6cf4, #2550d0)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 15px rgba(59,108,244,0.3)' }}>Publish Listing</button>
              </div>
            </form>
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          services.length === 0 && !showForm ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '1.5rem', border: '1.5px dashed rgba(59,108,244,0.2)', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🛠️</div>
              <h3 style={{ fontWeight: 800, fontSize: '1.125rem', color: '#0f172a', marginBottom: '0.625rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No Active Listings</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem', maxWidth: '380px', margin: '0 auto 1.5rem' }}>You haven't added any services yet. Create your first listing to start getting customers.</p>
              <button onClick={() => setShowForm(true)} style={{ padding: '0.75rem 2rem', background: 'linear-gradient(135deg, #3b6cf4, #2550d0)', color: 'white', border: 'none', borderRadius: '9999px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 15px rgba(59,108,244,0.35)' }}>
                Create First Listing
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {services.map((service, i) => (
                <div key={service._id} data-aos="fade-up" data-aos-delay={`${i * 60}`} style={{
                  background: 'white', borderRadius: '1.25rem', border: '1px solid rgba(59,108,244,0.08)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.05)', padding: '1.25rem 1.5rem',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap',
                  transition: 'all 0.25s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(59,108,244,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {/* Service image thumbnail */}
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '0.875rem', flexShrink: 0,
                    overflow: 'hidden', border: '2px solid rgba(59,108,244,0.12)',
                    background: 'linear-gradient(135deg, #eff6ff, #dce8ff)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {service.serviceImage ? (
                      <img
                        src={service.serviceImage?.startsWith('http') ? service.serviceImage : `https://smart-local-service-finder-server.onrender.com${service.serviceImage}`}
                        alt="service"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <span style={{ fontSize: '1.75rem' }}>🛠️</span>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
                      <span style={{ background: 'rgba(59,108,244,0.08)', color: '#3b6cf4', borderRadius: '9999px', padding: '0.15rem 0.625rem', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {service.serviceType}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: '#64748b' }}>
                        <MapPin size={12} />{service.location}
                      </span>
                    </div>
                    <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a', marginBottom: '0.35rem' }}>{service.serviceName}</h3>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.82rem' }}>
                      <span style={{ color: '#064e3b', fontWeight: 700 }}>₹{service.serviceCharges} <span style={{ color: '#94a3b8', fontWeight: 400 }}>base</span></span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#64748b' }}><Phone size={12} />{service.mobileNumber}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Hidden file input */}
                    <input
                      ref={el => imageInputRefs.current[service._id] = el}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => handleImageUpload(service._id, e.target.files[0])}
                    />
                    {/* Upload image btn */}
                    <button
                      title="Upload service image"
                      onClick={() => imageInputRefs.current[service._id]?.click()}
                      disabled={uploadingImageId === service._id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.55rem 0.875rem', borderRadius: '0.75rem',
                        background: uploadSuccess === service._id ? 'rgba(16,185,129,0.08)' : 'rgba(59,108,244,0.06)',
                        border: `1.5px solid ${uploadSuccess === service._id ? 'rgba(16,185,129,0.3)' : 'rgba(59,108,244,0.2)'}`,
                        color: uploadSuccess === service._id ? '#059669' : '#3b6cf4',
                        fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      {uploadingImageId === service._id ? (
                        <div style={{ width: '14px', height: '14px', border: '2px solid rgba(59,108,244,0.2)', borderTopColor: '#3b6cf4', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      ) : uploadSuccess === service._id ? (
                        <CheckCircle size={14} />
                      ) : (
                        <ImagePlus size={14} />
                      )}
                      {uploadingImageId === service._id ? 'Uploading…' : uploadSuccess === service._id ? 'Uploaded!' : service.serviceImage ? 'Change Image' : 'Add Image'}
                    </button>

                    <button title="Edit" onClick={() => handleEditOpen(service)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 0.875rem', borderRadius: '0.75rem', background: 'white', border: '1.5px solid rgba(59,108,244,0.2)', color: '#3b6cf4', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,108,244,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}
                    >
                      <Edit size={14} /> Edit
                    </button>
                    <button title="Delete" onClick={() => handleDelete(service._id)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 0.875rem', borderRadius: '0.75rem', background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.2)', color: '#dc2626', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          bookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '1.5rem', border: '1.5px dashed rgba(59,108,244,0.2)' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📋</div>
              <h3 style={{ fontWeight: 800, fontSize: '1.125rem', color: '#0f172a', marginBottom: '0.625rem' }}>No Booking Requests Yet</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>When customers contact you, they will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
              {bookings.map((booking, i) => {
                const isCompleted = booking.status === 'completed';
                const isPending = booking.status === 'completion_requested';
                const otpState = otpMap[booking._id];

                // Status display config
                let statusBg = 'rgba(124,58,237,0.09)', statusColor = '#7c3aed', statusBorder = 'rgba(124,58,237,0.15)', statusLabel = '⚡ New Request';
                if (isCompleted) { statusBg = 'rgba(16,185,129,0.1)'; statusColor = '#059669'; statusBorder = 'rgba(16,185,129,0.2)'; statusLabel = '✅ Completed'; }
                if (isPending) { statusBg = 'rgba(245,158,11,0.1)'; statusColor = '#d97706'; statusBorder = 'rgba(245,158,11,0.2)'; statusLabel = '🔐 Awaiting Verification'; }

                return (
                  <div key={booking._id} data-aos="fade-up" data-aos-delay={`${Math.min(i * 60, 300)}`} style={{
                    background: 'white', borderRadius: '1.25rem',
                    border: `1px solid ${isCompleted ? 'rgba(16,185,129,0.15)' : isPending ? 'rgba(245,158,11,0.2)' : 'rgba(124,58,237,0.12)'}`,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.05)', overflow: 'hidden',
                    transition: 'all 0.25s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 35px rgba(124,58,237,0.12)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.05)'; }}
                  >
                    <div style={{ height: '4px', background: isCompleted ? 'linear-gradient(90deg, #10b981, #06b6d4)' : isPending ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #7c3aed, #3b6cf4)' }} />
                    <div style={{ padding: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{ background: statusBg, color: statusColor, borderRadius: '9999px', padding: '0.2rem 0.75rem', fontSize: '0.72rem', fontWeight: 700, border: `1px solid ${statusBorder}` }}>
                          {statusLabel}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{new Date(booking.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', marginBottom: '0.375rem' }}>
                        {booking.service?.serviceName || 'Service Deleted'}
                      </h3>
                      <p style={{ fontSize: '0.82rem', color: '#334155', marginBottom: '0.3rem' }}>
                        Customer: <span style={{ fontWeight: 700 }}>{booking.customer?.name || 'Unknown'}</span>
                      </p>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>
                        Email: {booking.customer?.email}
                      </p>
                      <div style={{ marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', background: 'rgba(59,108,244,0.07)', borderRadius: '0.5rem', padding: '0.3rem 0.75rem', fontSize: '0.78rem', color: '#3b6cf4', fontWeight: 600 }}>
                        Via: <span style={{ textTransform: 'capitalize' }}>{booking.interactionType}</span>
                      </div>

                      {/* OTP section — provider enters OTP received verbally from customer */}
                      {!isCompleted && (
                        <div style={{ borderTop: '1px solid rgba(59,108,244,0.08)', paddingTop: '1rem' }}>
                          {otpState && !otpState.requesting ? (
                            // OTP has been requested — show input for provider to enter customer's code
                            <div style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.06), rgba(124,58,237,0.04))', border: '1px solid rgba(79,70,229,0.2)', borderRadius: '0.875rem', padding: '1rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <KeyRound size={14} color="#4f46e5" />
                                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4f46e5' }}>Enter OTP from Customer</p>
                              </div>
                              {/* Dev fallback: if Twilio not configured, show OTP here */}
                              {otpState.devOtp && (
                                <p style={{ fontSize: '0.72rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '0.5rem', padding: '0.4rem 0.625rem', color: '#92400e', marginBottom: '0.5rem' }}>
                                  ⚠️ Dev mode (Twilio not set up) — OTP: <strong>{otpState.devOtp}</strong>
                                </p>
                              )}
                              <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>
                                <span style={{ fontWeight: 700, color: '#4f46e5' }}>OTP was sent to customer's email.</span>
                                <br/>
                                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Ask the customer for the code they received in their email.</span>
                              </p>

                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <input
                                  type="text"
                                  maxLength={4}
                                  inputMode="numeric"
                                  placeholder="_ _ _ _"
                                  value={otpState.otpInput || ''}
                                  onChange={e => setOtpMap(prev => ({ ...prev, [booking._id]: { ...prev[booking._id], otpInput: e.target.value.replace(/\D/g, ''), error: null } }))}
                                  style={{
                                    flex: 1, padding: '0.65rem 0.875rem',
                                    border: `1.5px solid ${otpState.error ? '#ef4444' : 'rgba(79,70,229,0.25)'}`,
                                    borderRadius: '0.625rem', background: 'white',
                                    fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.25em',
                                    textAlign: 'center', outline: 'none', color: '#0f172a', fontFamily: 'monospace',
                                  }}
                                />
                                <button
                                  onClick={() => handleVerifyOtp(booking._id)}
                                  disabled={otpState.verifying}
                                  style={{
                                    padding: '0.65rem 1rem', borderRadius: '0.625rem',
                                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                                    color: 'white', border: 'none', fontWeight: 700, fontSize: '0.82rem',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem',
                                    boxShadow: '0 3px 10px rgba(79,70,229,0.3)', whiteSpace: 'nowrap',
                                  }}
                                >
                                  {otpState.verifying
                                    ? <div style={{ width: '13px', height: '13px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                    : <ShieldCheck size={14} />}
                                  Verify
                                </button>
                              </div>
                              {otpState.error && (
                                <p style={{ fontSize: '0.72rem', color: '#dc2626', marginTop: '0.4rem' }}>⚠️ {otpState.error}</p>
                              )}
                              <button onClick={() => handleRequestCompletion(booking._id)} style={{ marginTop: '0.75rem', fontSize: '0.7rem', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Resend/Regenerate OTP</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleRequestCompletion(booking._id)}
                              disabled={otpState?.requesting}
                              style={{
                                width: '100%', padding: '0.7rem 1rem',
                                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                                color: 'white', border: 'none', borderRadius: '0.75rem',
                                fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                boxShadow: '0 4px 12px rgba(79,70,229,0.3)', transition: 'all 0.2s',
                              }}
                            >
                              {otpState?.requesting
                                ? <><div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Generating OTP…</>
                                : <><KeyRound size={15} /> Request Completion (Generate OTP)</>}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Edit Service Modal */}
      {editingService && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }} onClick={(e) => { if (e.target === e.currentTarget) setEditingService(null); }}>
          <div style={{
            background: 'white', borderRadius: '1.5rem',
            boxShadow: '0 25px 60px rgba(59,108,244,0.18)',
            padding: '2rem', width: '100%', maxWidth: '600px',
            border: '1px solid rgba(59,108,244,0.12)',
            borderLeft: '4px solid #3b6cf4',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.125rem', color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>
                ✏️ Edit Service Listing
              </h2>
              <button onClick={() => setEditingService(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.25rem', lineHeight: 1, padding: '0.25rem' }}>✕</button>
            </div>

            <form onSubmit={handleUpdate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Service Title</label>
                <input type="text" style={inputStyle} required value={editFormData.serviceName}
                  onChange={e => setEditFormData({ ...editFormData, serviceName: e.target.value })}
                  placeholder="e.g. Expert Home AC Repair"
                  onFocus={e => e.target.style.borderColor = '#3b6cf4'}
                  onBlur={e => e.target.style.borderColor = 'rgba(59,108,244,0.15)'} />
              </div>
              <div>
                <label style={labelStyle}>Category</label>
                <select style={inputStyle} required value={editFormData.serviceType}
                  onChange={e => setEditFormData({ ...editFormData, serviceType: e.target.value })}
                  onFocus={e => e.target.style.borderColor = '#3b6cf4'}
                  onBlur={e => e.target.style.borderColor = 'rgba(59,108,244,0.15)'}>
                  <option value="Electrician">Electrician</option>
                  <option value="Plumber">Plumber</option>
                  <option value="AC Repair">AC Repair</option>
                  <option value="Appliance Repair">Appliance Repair</option>
                  <option value="Mechanic">Mechanic</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Carpenter">Carpenter</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Base Charges (₹)</label>
                <input type="number" style={inputStyle} required value={editFormData.serviceCharges}
                  onChange={e => setEditFormData({ ...editFormData, serviceCharges: e.target.value })}
                  placeholder="e.g. 500"
                  onFocus={e => e.target.style.borderColor = '#3b6cf4'}
                  onBlur={e => e.target.style.borderColor = 'rgba(59,108,244,0.15)'} />
              </div>
              <div>
                <label style={labelStyle}>Location (City/Area)</label>
                <input type="text" style={inputStyle} required value={editFormData.location}
                  onChange={e => setEditFormData({ ...editFormData, location: e.target.value })}
                  placeholder="e.g. Patia, Bhubaneswar"
                  onFocus={e => e.target.style.borderColor = '#3b6cf4'}
                  onBlur={e => e.target.style.borderColor = 'rgba(59,108,244,0.15)'} />
              </div>
              <div>
                <label style={labelStyle}>Mobile Number</label>
                <input type="text" style={inputStyle} required value={editFormData.mobileNumber}
                  onChange={e => setEditFormData({ ...editFormData, mobileNumber: e.target.value })}
                  placeholder="e.g. 9876543210"
                  onFocus={e => e.target.style.borderColor = '#3b6cf4'}
                  onBlur={e => e.target.style.borderColor = 'rgba(59,108,244,0.15)'} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Description</label>
                <textarea style={{ ...inputStyle, resize: 'none' }} rows={3} value={editFormData.description}
                  onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                  placeholder="Describe your service, experience, and what's included..."
                  onFocus={e => e.target.style.borderColor = '#3b6cf4'}
                  onBlur={e => e.target.style.borderColor = 'rgba(59,108,244,0.15)'} />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setEditingService(null)} style={{ padding: '0.7rem 1.5rem', borderRadius: '0.75rem', border: '1.5px solid rgba(59,108,244,0.2)', background: 'white', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={editLoading} style={{ padding: '0.7rem 2rem', borderRadius: '0.75rem', background: editLoading ? '#94a3b8' : 'linear-gradient(135deg, #3b6cf4, #2550d0)', color: 'white', border: 'none', fontWeight: 700, cursor: editLoading ? 'not-allowed' : 'pointer', boxShadow: editLoading ? 'none' : '0 4px 15px rgba(59,108,244,0.3)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {editLoading ? (
                    <><div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Saving…</>
                  ) : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
