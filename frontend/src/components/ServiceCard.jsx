import React, { useRef } from 'react';
import { MapPin, Phone, MessageCircle, Star, IndianRupee } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

// Avatar color palette
const AVATAR_COLORS = [
  'linear-gradient(135deg, #3b6cf4, #7c3aed)',
  'linear-gradient(135deg, #06b6d4, #3b6cf4)',
  'linear-gradient(135deg, #10b981, #06b6d4)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #7c3aed, #ec4899)',
  'linear-gradient(135deg, #ef4444, #f59e0b)',
];

const ServiceCard = ({ service }) => {
  const cardRef = useRef(null);

  // 3D Tilt on hover
  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(8px)`;
    card.style.boxShadow = `${-rotateY * 2}px ${rotateX * 2}px 40px rgba(59,108,244,0.18), 0 12px 40px rgba(0,0,0,0.08)`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)';
    card.style.boxShadow = '0 4px 16px rgba(59,108,244,0.08), 0 2px 8px rgba(0,0,0,0.06)';
    card.style.transition = 'all 0.4s cubic-bezier(0.4,0,0.2,1)';
  };

  const handleMouseEnter = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transition = 'none';
  };

  const logInteraction = async (interactionType) => {
    try {
      const userInfoStr = localStorage.getItem('userInfo');
      if (userInfoStr) {
        await api.post('/bookings', { serviceId: service._id, interactionType });
      }
    } catch (e) {
      console.error('Failed to log interaction', e);
    }
  };

  const handleCall = () => {
    logInteraction('call');
    window.open(`tel:${service.mobileNumber}`, '_self');
  };

  const handleWhatsApp = () => {
    logInteraction('whatsapp');
    let wpNumber = service.mobileNumber;
    if (wpNumber.length === 10) wpNumber = `91${wpNumber}`;
    const message = encodeURIComponent(`Hello ${service.providerName}, I want to book your ${service.serviceName} service as seen on Smart Local.`);
    window.open(`https://wa.me/${wpNumber}?text=${message}`, '_blank');
  };

  const avatarColor = AVATAR_COLORS[(service.providerName?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  const stars = service.rating ? Math.round(service.rating) : 0;

  return (
    <div
      ref={cardRef}
      className="card"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      style={{
        display: 'flex', flexDirection: 'column', height: '100%',
        background: 'white', borderRadius: '1.25rem',
        border: '1px solid rgba(59,108,244,0.08)',
        boxShadow: '0 4px 16px rgba(59,108,244,0.08), 0 2px 8px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
    >
      {/* Card image or colored strip */}
      {service.serviceImage ? (
        <div style={{
          height: '160px', overflow: 'hidden', position: 'relative',
          background: 'linear-gradient(135deg, #eff6ff, #dce8ff)',
        }}>
          <img
            src={`http://localhost:5000${service.serviceImage}`}
            alt={service.serviceName}
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center',
              display: 'block',
              transition: 'transform 0.4s ease',
            }}
            onError={e => { e.target.parentNode.style.background = 'linear-gradient(135deg, #eff6ff, #dce8ff)'; e.target.style.display = 'none'; }}
          />
          {/* Type badge overlay */}
          <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
            <span style={{
              background: 'rgba(255,255,255,0.92)', color: '#3b6cf4',
              borderRadius: '9999px', padding: '0.2rem 0.75rem',
              fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
              backdropFilter: 'blur(8px)',
            }}>
              {service.serviceType}
            </span>
          </div>
        </div>
      ) : (
        <div style={{ height: '6px', background: 'linear-gradient(90deg, #3b6cf4, #7c3aed)' }} />
      )}

      <div style={{ padding: '1.5rem', flexGrow: 1 }}>
        {/* Top row: badge + rating */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <span style={{
            background: 'rgba(59,108,244,0.08)', color: '#3b6cf4',
            border: '1px solid rgba(59,108,244,0.15)',
            borderRadius: '9999px', padding: '0.2rem 0.75rem',
            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.02em',
            textTransform: 'uppercase',
          }}>
            {service.serviceType}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            {stars > 0 ? (
              <>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={12} fill={i < stars ? '#f59e0b' : 'none'} color={i < stars ? '#f59e0b' : '#d1d5db'} />
                ))}
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', marginLeft: '0.2rem' }}>
                  {service.rating?.toFixed(1)}
                </span>
              </>
            ) : (
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, background: '#f1f5f9', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>New</span>
            )}
          </div>
        </div>

        {/* Service name */}
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a', lineHeight: 1.3 }} className="line-clamp-2">
          {service.serviceName}
        </h3>

        {/* Provider row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
          <div style={{
            width: '32px', height: '32px',
            background: avatarColor,
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0,
          }}>
            {service.providerName?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>{service.providerName}</p>
          </div>
        </div>

        {/* Info chips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: '#f8faff', padding: '0.5rem 0.75rem',
            borderRadius: '0.5rem', border: '1px solid rgba(59,108,244,0.06)',
          }}>
            <MapPin size={14} color="#3b6cf4" />
            <span style={{ fontSize: '0.8rem', color: '#64748b' }} className="truncate">{service.location}</span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: '#f0fdf4', padding: '0.5rem 0.75rem',
            borderRadius: '0.5rem', border: '1px solid rgba(16,185,129,0.1)',
          }}>
            <IndianRupee size={14} color="#10b981" />
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
              {service.serviceCharges}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>base price</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{
        padding: '1rem 1.5rem 1.5rem',
        borderTop: '1px solid rgba(59,108,244,0.06)',
        display: 'flex', flexDirection: 'column', gap: '0.625rem',
        background: '#fafbff',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <button onClick={handleCall} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
            padding: '0.6rem 0.5rem', borderRadius: '0.625rem',
            background: 'white', border: '1.5px solid rgba(59,108,244,0.15)',
            color: '#3b6cf4', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,108,244,0.06)'; e.currentTarget.style.borderColor = '#3b6cf4'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = 'rgba(59,108,244,0.15)'; }}
          >
            <Phone size={14} />
            Call
          </button>
          <button onClick={handleWhatsApp} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
            padding: '0.6rem 0.5rem', borderRadius: '0.625rem',
            background: 'rgba(37,211,102,0.06)', border: '1.5px solid rgba(37,211,102,0.25)',
            color: '#16a34a', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(37,211,102,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(37,211,102,0.06)'; }}
          >
            <MessageCircle size={14} />
            WhatsApp
          </button>
        </div>
        <Link
          to={`/services/${service._id}`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0.65rem', borderRadius: '0.625rem',
            background: 'linear-gradient(135deg, #3b6cf4, #2550d0)',
            color: 'white', fontWeight: 600, fontSize: '0.85rem',
            textDecoration: 'none',
            boxShadow: '0 4px 12px rgba(59,108,244,0.25)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(59,108,244,0.35)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,108,244,0.25)'; }}
        >
          View Full Details
        </Link>
      </div>
    </div>
  );
};

export default ServiceCard;
