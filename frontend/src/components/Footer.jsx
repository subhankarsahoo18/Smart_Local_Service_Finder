import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Zap, Instagram, Twitter, Facebook, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer style={{
      background: 'white',
      borderTop: '1px solid rgba(59,108,244,0.1)',
      paddingTop: '4rem', paddingBottom: '2rem',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Subtle top gradient accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: 'linear-gradient(90deg, #3b6cf4, #7c3aed, #06b6d4)',
      }} />

      {/* Background orb */}
      <div style={{
        position: 'absolute', bottom: '-80px', right: '-80px',
        width: '350px', height: '350px',
        background: 'radial-gradient(circle, rgba(59,108,244,0.04) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', marginBottom: '3rem' }}>

          {/* Brand */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #3b6cf4 0%, #7c3aed 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(59,108,244,0.35)',
              }}>
                <Zap size={18} color="white" fill="white" />
              </div>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', letterSpacing: '-0.02em' }}>
                Smart<span style={{ color: '#3b6cf4' }}>Local</span>
              </span>
            </Link>
            <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.7 }}>
              Redefining the way you discover and book trusted local service professionals. Fast, reliable, and entirely seamless.
            </p>
            {/* Social Icons */}
            <div style={{ display: 'flex', gap: '0.625rem' }}>
              {[
                { Icon: Instagram, color: '#e1306c' },
                { Icon: Twitter, color: '#1da1f2' },
                { Icon: Facebook, color: '#1877f2' },
                { Icon: Linkedin, color: '#0077b5' },
              ].map(({ Icon, color }, i) => (
                <a
                  key={i}
                  href="#"
                  style={{
                    width: '36px', height: '36px', borderRadius: '9999px',
                    background: '#f8faff', border: '1px solid rgba(59,108,244,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#94a3b8', transition: 'all 0.25s', textDecoration: 'none',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = color; e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 4px 12px ${color}30`; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(59,108,244,0.1)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <h4 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Platform</h4>
            {[
              { to: '/', label: 'Browse Services' },
              { to: '/register', label: 'Become a Provider' },
              { to: '/dashboard', label: 'Provider Dashboard' },
              { to: '/user-dashboard', label: 'My Bookings' },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                style={{ fontSize: '0.875rem', color: '#64748b', textDecoration: 'none', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#3b6cf4'; e.currentTarget.style.transform = 'translateX(3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.transform = 'translateX(0)'; }}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Legal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <h4 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Legal</h4>
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Refund Guidelines'].map(label => (
              <a
                key={label}
                href="#"
                style={{ fontSize: '0.875rem', color: '#64748b', textDecoration: 'none', transition: 'all 0.2s', display: 'inline-flex' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#3b6cf4'; e.currentTarget.style.transform = 'translateX(3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.transform = 'translateX(0)'; }}
              >
                {label}
              </a>
            ))}
          </div>

          {/* Contact */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <h4 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Contact Us</h4>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', fontSize: '0.875rem', color: '#64748b' }}>
              <MapPin size={16} color="#3b6cf4" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>123 Horizon Avenue, Tech Skyline Area, City 400001</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.875rem', color: '#64748b' }}>
              <Phone size={16} color="#3b6cf4" style={{ flexShrink: 0 }} />
              <span>+91 81446 05161</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.875rem', color: '#64748b' }}>
              <Mail size={16} color="#3b6cf4" style={{ flexShrink: 0 }} />
              <span>support@smartlocal.com</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid rgba(59,108,244,0.08)',
          paddingTop: '1.5rem',
          display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center',
          gap: '0.75rem', fontSize: '0.8rem', color: '#94a3b8',
        }}>
          <p>© {new Date().getFullYear()} Smart Local Service Finder. All rights reserved.</p>
          <p style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            Designed with <span style={{ color: '#ef4444', animation: 'pulse 2s infinite' }}>♥</span> for local communities
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
