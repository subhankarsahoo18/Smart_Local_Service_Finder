import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, MapPin, Wrench, LocateFixed, Shield, Zap, Clock, Star, PlayCircle, X } from 'lucide-react';
import ServiceCard from '../components/ServiceCard';
import ProviderHome from './ProviderHome';
import api from '../api/axios';

const CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'Home Care', value: 'Cleaning' },
  { label: 'Electrician', value: 'Electrician' },
  { label: 'Mechanic', value: 'Mechanic' },
  { label: 'Plumber', value: 'Plumber' },
  { label: 'Handcraft', value: 'Carpenter' },
  { label: 'AC Repair', value: 'AC Repair' },
];

const HOW_IT_WORKS = [
  { step: '01', icon: '🔍', title: 'Search for Services', desc: 'Enter your location and select the type of service you\'re looking for.' },
  { step: '02', icon: '👤', title: 'Browse Local Experts', desc: 'Explore detailed profiles, ratings, and reviews of trusted professionals.' },
  { step: '03', icon: '📅', title: 'Book Your Service', desc: 'Choose the time that works best and connect with the professional directly.' },
  { step: '04', icon: '🎉', title: 'Enjoy Your Day', desc: 'Sit back while a qualified expert arrives to complete the job.' },
];

// Floating professional profile cards with real images
const FLOATING_PROS = [
  {
    id: 1,
    name: 'Rebecca S.',
    role: 'Home Care',
    rating: '4.9',
    image: '/pro_homecare.png',
    bg: 'rgba(255,255,255,0.88)',
    accentColor: '#9333ea',
    badgeColor: '#f3e8ff',
    badgeText: '#9333ea',
    style: { top: '10%', left: '3%' },
    animClass: 'float-card-1',
    rotate: '-5deg',
  },
  {
    id: 2,
    name: 'Michael Telo',
    role: 'Mechanic',
    rating: '4.8',
    image: '/pro_mechanic.png',
    bg: 'rgba(255,255,255,0.88)',
    accentColor: '#3b6cf4',
    badgeColor: '#eff6ff',
    badgeText: '#3b6cf4',
    style: { bottom: '15%', left: '2%' },
    animClass: 'float-card-2',
    rotate: '4deg',
  },
  {
    id: 3,
    name: 'Big Jane',
    role: 'Plumber',
    rating: '4.7',
    image: '/pro_plumber.png',
    bg: 'rgba(255,255,255,0.88)',
    accentColor: '#0284c7',
    badgeColor: '#e0f2fe',
    badgeText: '#0284c7',
    style: { top: '8%', right: '3%' },
    animClass: 'float-card-3',
    rotate: '5deg',
  },
  {
    id: 4,
    name: 'Ravi Kumar',
    role: 'Electrician',
    rating: '5.0',
    image: '/pro_electrician.png',
    bg: 'rgba(255,255,255,0.88)',
    accentColor: '#d97706',
    badgeColor: '#fef3c7',
    badgeText: '#d97706',
    style: { bottom: '12%', right: '2%' },
    animClass: 'float-card-4',
    rotate: '-4deg',
  },
];

// Individual floating card — image-only, larger, 3D tilt on hover
const FloatingCard = ({ pro }) => {
  const cardRef = useRef(null);

  const handleMouseEnter = () => {
    const card = cardRef.current;
    if (!card) return;
    // Pause CSS float animation so it doesn't fight JS transform
    card.style.animationPlayState = 'paused';
    card.style.transition = 'none';
  };

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `rotate(${pro.rotate}) perspective(700px) rotateX(${-y * 22}deg) rotateY(${x * 22}deg) translateZ(24px) scale(1.1)`;
    card.style.transition = 'none';
    card.style.boxShadow = `${x * -25}px ${y * -20}px 50px rgba(59,108,244,0.22), 0 24px 60px rgba(0,0,0,0.18)`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    // Resume CSS float animation
    card.style.animationPlayState = 'running';
    card.style.transition = 'none';
    // Remove inline transform so CSS animation takes back over
    card.style.transform = '';
    card.style.boxShadow = '0 20px 60px rgba(0,0,0,0.13), 0 6px 20px rgba(0,0,0,0.08)';
  };

  return (
    <div
      ref={cardRef}
      className={pro.animClass}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'absolute',
        ...pro.style,
        background: 'rgba(255,255,255,0.92)',
        borderRadius: '1.5rem',
        padding: '10px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.14), 0 6px 20px rgba(0,0,0,0.08)',
        cursor: 'default',
        zIndex: 5,
        border: '2px solid rgba(255,255,255,0.98)',
        backdropFilter: 'blur(16px)',
        willChange: 'transform',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Image only — larger portrait */}
      <div style={{
        width: '110px',
        height: '120px',
        borderRadius: '1rem',
        overflow: 'hidden',
        boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
        background: '#e2e8f0',
      }}>
        <img
          src={pro.image}
          alt={pro.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'top center',
            display: 'block',
            pointerEvents: 'none',
          }}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentNode.style.background = pro.accentColor;
            e.target.parentNode.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:white;font-size:2rem;font-weight:800">${pro.name.charAt(0)}</div>`;
          }}
        />
      </div>
    </div>
  );
};

const Home = () => {
  // ---- Role guard: providers get a different home page ----
  const _userInfoRaw = localStorage.getItem('userInfo');
  const _userInfo = _userInfoRaw ? JSON.parse(_userInfoRaw) : null;
  if (_userInfo?.role === 'provider') return <ProviderHome />;
  // ---------------------------------------------------------

  const routerLocation = useLocation();
  const isServicesPage = routerLocation.pathname === '/services';
  const heroRef = useRef(null);

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  const fetchServices = async (overrideType) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (keyword) params.append('keyword', keyword);
      if (location) params.append('location', location);
      const type = overrideType !== undefined ? overrideType : serviceType;
      if (type) params.append('serviceType', type);
      if (latitude && longitude) { params.append('lat', latitude); params.append('lng', longitude); }
      const { data } = await api.get(`/services?${params.toString()}`);
      setServices(data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setLoading(false);
    }
  };

  useEffect(() => { fetchServices(); }, []);

  // Subtle parallax on hero cards based on mouse position
  useEffect(() => {
    if (isServicesPage) return;
    const hero = heroRef.current;
    if (!hero) return;
    const onMouseMove = (e) => {
      const rect = hero.getBoundingClientRect();
      const cx = (e.clientX - rect.left) / rect.width - 0.5;
      const cy = (e.clientY - rect.top) / rect.height - 0.5;
      const parallaxItems = hero.querySelectorAll('[data-parallax]');
      parallaxItems.forEach((el) => {
        const depth = parseFloat(el.dataset.parallax || 1);
        el.style.transform = `translateX(${cx * 18 * depth}px) translateY(${cy * 14 * depth}px)`;
      });
    };
    const onMouseLeave = () => {
      const parallaxItems = hero.querySelectorAll('[data-parallax]');
      parallaxItems.forEach((el) => {
        el.style.transform = 'translateX(0) translateY(0)';
        el.style.transition = 'transform 0.8s ease';
      });
    };
    hero.addEventListener('mousemove', onMouseMove);
    hero.addEventListener('mouseleave', onMouseLeave);
    return () => {
      hero.removeEventListener('mousemove', onMouseMove);
      hero.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [isServicesPage]);

  const handleCategorySelect = (value) => {
    setActiveCategory(value);
    setServiceType(value);
    fetchServices(value);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) { alert('Geolocation is not supported.'); return; }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setLatitude(lat); setLongitude(lon);
          const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`);
          const data = await resp.json();
          if (data?.address) {
            setLocation(data.address.city || data.address.town || data.address.state_district || 'Your Location');
          }
        } catch { alert('Could not determine location.'); }
        finally { setIsLocating(false); }
      },
      () => { alert('Could not get location. Check browser permissions.'); setIsLocating(false); }
    );
  };

  const handleSearch = (e) => { e.preventDefault(); fetchServices(); };

  return (
    <>
      {/* ======================================================== */}
      {/* INJECTED HERO STYLES                                       */}
      {/* ======================================================== */}
      <style>{`
        /* Hero gradient background */
        .hero-v2 {
          background: linear-gradient(145deg, #b8c8f8 0%, #a8b8f0 20%, #c4cef8 50%, #d4dcfa 70%, #dce8ff 100%);
          position: relative;
          overflow: hidden;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Animated soft blob in BG */
        .hero-blob-1 {
          position: absolute;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%);
          border-radius: 50%;
          top: -150px; right: -150px;
          animation: blobDrift 12s ease-in-out infinite alternate;
          pointer-events: none;
        }
        .hero-blob-2 {
          position: absolute;
          width: 450px; height: 450px;
          background: radial-gradient(circle, rgba(100,120,255,0.12) 0%, transparent 70%);
          border-radius: 50%;
          bottom: -100px; left: -100px;
          animation: blobDrift 15s ease-in-out infinite alternate-reverse;
          pointer-events: none;
        }
        .hero-blob-3 {
          position: absolute;
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%);
          border-radius: 50%;
          top: 40%; left: 40%;
          animation: blobDrift 10s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes blobDrift {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(30px, -20px) scale(1.1); }
        }

        /* Floating grid dots pattern */
        .hero-dots {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none;
          opacity: 0.5;
        }

        /* Floating card animations — each with different trajectory */
        .float-card-1 { animation: floatCard1 7s ease-in-out infinite; }
        .float-card-2 { animation: floatCard2 9s ease-in-out 0.5s infinite; }
        .float-card-3 { animation: floatCard3 8s ease-in-out 1s infinite; }
        .float-card-4 { animation: floatCard4 10s ease-in-out 1.5s infinite; }
        .float-card-5 { animation: floatCard5 7.5s ease-in-out 2s infinite; }

        @keyframes floatCard1 {
          0%, 100% { transform: rotate(-4deg) translateY(0px); }
          50% { transform: rotate(-2deg) translateY(-22px); }
        }
        @keyframes floatCard2 {
          0%, 100% { transform: rotate(3deg) translateY(0px) translateX(0px); }
          33% { transform: rotate(1deg) translateY(-16px) translateX(6px); }
          66% { transform: rotate(4deg) translateY(-8px) translateX(-4px); }
        }
        @keyframes floatCard3 {
          0%, 100% { transform: rotate(5deg) translateY(0px); }
          50% { transform: rotate(3deg) translateY(-20px) translateX(-6px); }
        }
        @keyframes floatCard4 {
          0%, 100% { transform: rotate(-3deg) translateY(0px) translateX(0px); }
          40% { transform: rotate(-1deg) translateY(-18px) translateX(8px); }
          70% { transform: rotate(-4deg) translateY(-6px) translateX(-4px); }
        }
        @keyframes floatCard5 {
          0%, 100% { transform: rotate(4deg) translateY(0px); }
          50% { transform: rotate(2deg) translateY(-24px) translateX(4px); }
        }

        /* Pulsing online dot */
        @keyframes pulseDot {
          0%, 100% { transform: scale(1); box-shadow: 0 0 6px rgba(34,197,94,0.6); }
          50% { transform: scale(1.3); box-shadow: 0 0 12px rgba(34,197,94,0.9); }
        }

        /* Hero search box */
        .hero-search {
          background: rgba(255,255,255,0.96);
          backdrop-filter: blur(20px);
          border-radius: 9999px;
          border: none;
          box-shadow: 0 8px 40px rgba(59,108,244,0.18), 0 2px 8px rgba(0,0,0,0.06);
          display: flex;
          align-items: center;
          padding: 6px 6px 6px 20px;
          gap: 8px;
          max-width: 600px;
          width: 100%;
          transition: box-shadow 0.3s ease;
        }
        .hero-search:focus-within {
          box-shadow: 0 8px 50px rgba(59,108,244,0.28), 0 0 0 3px rgba(59,108,244,0.15);
        }
        /* Hero search box layout helpers */
        .hero-search-input-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }
        .hero-search-location {
          display: flex;
          align-items: center;
          gap: 6px;
          border-left: 1.5px solid #e2e8f0;
          padding-left: 10px;
          margin-left: 4px;
          flex-shrink: 0;
          width: 170px;
        }
        .hero-search input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 0.95rem;
          color: #0f172a;
          background: transparent;
          font-family: 'Inter', sans-serif;
          min-width: 0;
        }
        .hero-search input::placeholder { color: #94a3b8; }
        .hero-search-btn {
          width: 44px; height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b6cf4, #2550d0);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(59,108,244,0.4);
          transition: all 0.2s;
        }
        .hero-search-btn:hover {
          transform: scale(1.08);
          box-shadow: 0 6px 20px rgba(59,108,244,0.5);
        }
        @media (max-width: 600px) {
          .hero-search {
            flex-direction: column;
            border-radius: 1.25rem;
            padding: 14px;
            align-items: stretch;
            background: rgba(255,255,255,0.98);
          }
          .hero-search-input-wrapper {
            padding-bottom: 10px;
            border-bottom: 1px solid #e2e8f0;
          }
          .hero-search-location {
            border-left: none;
            padding-left: 0;
            margin-left: 0;
            width: 100%;
            padding-top: 4px;
            justify-content: space-between;
          }
          .hero-search-btn {
            width: 100%;
            border-radius: 0.75rem;
            margin-top: 8px;
            height: 40px;
          }
          .hero-search-btn:hover {
            transform: translateY(-2px);
          }
        }


        /* Category pill dark style (matches reference) */
        .hero-pill {
          background: rgba(255,255,255,0.22);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.5);
          border-radius: 9999px;
          padding: 8px 18px;
          font-size: 0.82rem;
          font-weight: 600;
          color: #3b6cf4;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
          white-space: nowrap;
        }
        .hero-pill:hover {
          background: rgba(255,255,255,0.45);
          transform: translateY(-3px) scale(1.04);
          box-shadow: 0 8px 20px rgba(0,0,0,0.06);
        }
        .hero-pill.active {
          background: white;
          color: #3b6cf4;
          box-shadow: 0 6px 20px rgba(0,0,0,0.12);
          transform: translateY(-3px);
        }

        /* 3D floating particles in background */
        .hero-particle {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          opacity: 0.6;
        }
        .hero-particle-1 {
          width: 12px; height: 12px;
          background: white;
          top: 20%; left: 25%;
          animation: particleFloat 8s ease-in-out infinite;
        }
        .hero-particle-2 {
          width: 8px; height: 8px;
          background: rgba(255,255,255,0.7);
          top: 60%; left: 70%;
          animation: particleFloat 11s ease-in-out 2s infinite reverse;
        }
        .hero-particle-3 {
          width: 16px; height: 16px;
          background: rgba(255,255,255,0.5);
          top: 75%; left: 35%;
          animation: particleFloat 9s ease-in-out 4s infinite;
        }
        .hero-particle-4 {
          width: 6px; height: 6px;
          background: white;
          top: 35%; right: 25%;
          animation: particleFloat 7s ease-in-out 1s infinite reverse;
        }
        .hero-particle-5 {
          width: 10px; height: 10px;
          background: rgba(255,255,255,0.65);
          top: 55%; left: 15%;
          animation: particleFloat 12s ease-in-out 3s infinite;
        }
        @keyframes particleFloat {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); opacity: 0.6; }
          25% { transform: translateY(-30px) rotate(90deg) scale(1.2); opacity: 0.9; }
          50% { transform: translateY(-15px) rotate(180deg) scale(0.8); opacity: 0.4; }
          75% { transform: translateY(-45px) rotate(270deg) scale(1.1); opacity: 0.7; }
        }

        /* 3D Ring decorations */
        .hero-ring {
          position: absolute;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.15);
          pointer-events: none;
          animation: ringRotate 20s linear infinite;
        }
        .hero-ring-1 {
          width: 220px; height: 220px;
          top: 10%; left: 10%;
          animation-direction: normal;
          border-style: dashed;
          opacity: 0.4;
        }
        .hero-ring-2 {
          width: 150px; height: 150px;
          bottom: 15%; right: 12%;
          animation-direction: reverse;
          animation-duration: 15s;
          opacity: 0.35;
        }
        @keyframes ringRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Trust badges */
        .hero-trust-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 9999px;
          background: rgba(255,255,255,0.22);
          border: 1px solid rgba(255,255,255,0.5);
          font-size: 0.78rem;
          font-weight: 600;
          color: #3b6cf4;
          backdrop-filter: blur(8px);
        }

        /* 3D Spinning cube decoration */
        .hero-cube {
          position: absolute;
          pointer-events: none;
          perspective: 400px;
        }
        .hero-cube-inner {
          width: 40px; height: 40px;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.4);
          border-radius: 8px;
          animation: cubeRotate3D 8s ease-in-out infinite;
        }
        .hero-cube-2 .hero-cube-inner {
          width: 28px; height: 28px;
          animation-duration: 12s;
          animation-direction: reverse;
        }
        @keyframes cubeRotate3D {
          0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
          25% { transform: rotateX(90deg) rotateY(45deg) rotateZ(15deg); }
          50% { transform: rotateX(180deg) rotateY(90deg) rotateZ(30deg); }
          75% { transform: rotateX(270deg) rotateY(135deg) rotateZ(15deg); }
          100% { transform: rotateX(360deg) rotateY(180deg) rotateZ(0deg); }
        }

        /* Responsive: hide some cards on small screens */
        @media (max-width: 900px) {
          .float-card-3, .float-card-5 { display: none; }
        }
        @media (max-width: 600px) {
          .float-card-1, .float-card-2, .float-card-4 { display: none; }
          .hero-v2 { min-height: auto; padding: 5rem 0; }
        }
      `}</style>

      <div style={{ padding: 0 }}>
        {/* ============================================================ */}
        {/* HERO SECTION — Reference Image Style                          */}
        {/* ============================================================ */}
        {!isServicesPage && (
          <section className="hero-v2" ref={heroRef} style={{ padding: '2rem 0' }}>
            {/* Background elements */}
            <div className="hero-dots" />
            <div className="hero-blob-1" />
            <div className="hero-blob-2" />
            <div className="hero-blob-3" />

            {/* Floating particles */}
            <div className="hero-particle hero-particle-1" />
            <div className="hero-particle hero-particle-2" />
            <div className="hero-particle hero-particle-3" />
            <div className="hero-particle hero-particle-4" />
            <div className="hero-particle hero-particle-5" />

            {/* 3D Rings */}
            <div className="hero-ring hero-ring-1" />
            <div className="hero-ring hero-ring-2" />

            {/* 3D Cubes */}
            <div className="hero-cube" style={{ top: '15%', left: '42%' }}>
              <div className="hero-cube-inner" />
            </div>
            <div className="hero-cube hero-cube-2" style={{ bottom: '25%', right: '35%' }}>
              <div className="hero-cube-inner" />
            </div>

            {/* ---- FLOATING PROFESSIONAL CARDS ---- */}
            {FLOATING_PROS.map(pro => (
              <div key={pro.id} data-parallax={pro.id * 0.2}>
                <FloatingCard pro={pro} />
              </div>
            ))}

            {/* ---- CENTERED CONTENT ---- */}
            <div style={{
              position: 'relative', zIndex: 10,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              textAlign: 'center', padding: '0 1.5rem', width: '100%',
              maxWidth: '680px', margin: '0 auto',
            }}>
              {/* Trust pill */}
              <div data-aos="fade-down" style={{ marginBottom: '2rem' }}>
                <span className="hero-trust-badge">
                  <span style={{ fontSize: '1rem' }}>⭐</span>
                  Rated 4.9 by 10,000+ users
                </span>
              </div>

              {/* Main Headline */}
              <h1 data-aos="fade-up" data-aos-delay="100" style={{
                fontSize: 'clamp(2rem, 5.5vw, 3.5rem)',
                fontWeight: 800,
                color: 'white',
                lineHeight: 1.12,
                letterSpacing: '-0.03em',
                marginBottom: '2.5rem',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                textShadow: '0 2px 20px rgba(59,108,244,0.25)',
              }}>
                Connect with Reliable<br />
                Professionals Home Service
              </h1>

              {/* Search Bar */}
              <form data-aos="fade-up" data-aos-delay="200" onSubmit={handleSearch}
                className="hero-search" style={{ marginBottom: '1.75rem' }}>
                <div className="hero-search-input-wrapper">
                  <Search size={18} color="#94a3b8" />
                  <input
                    type="text"
                    placeholder="Search service..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>
                
                {/* Location */}
                <div className="hero-search-location">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                    <MapPin size={16} color="#94a3b8" />
                    <input
                      type="text"
                      placeholder="Location"
                      value={location}
                      onChange={(e) => { setLocation(e.target.value); setLatitude(null); setLongitude(null); }}
                      style={{ width: '100%', fontSize: '0.875rem' }}
                    />
                  </div>
                  <button type="button" onClick={handleGetLocation} disabled={isLocating}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', flexShrink: 0 }}>
                    <LocateFixed size={15} style={{ animation: isLocating ? 'spin 1s linear infinite' : 'none' }} color={isLocating ? '#3b6cf4' : '#94a3b8'} />
                  </button>
                </div>

                <button type="submit" className="hero-search-btn">
                  <Search size={18} color="white" />
                </button>
              </form>

              {/* Category Pills */}
              <div data-aos="fade-up" data-aos-delay="300" style={{
                display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center',
              }}>
                {CATEGORIES.map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => handleCategorySelect(value)}
                    className={`hero-pill ${activeCategory === value ? 'active' : ''}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Trust badges row */}
              <div data-aos="fade-up" data-aos-delay="450" style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {[
                  { icon: '🛡️', label: 'Verified Providers' },
                  { icon: '⚡', label: 'Instant Connect' },
                  { icon: '🕐', label: '24/7 Available' },
                ].map(({ icon, label }) => (
                  <span key={label} className="hero-trust-badge">
                    {icon} {label}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* HOW IT WORKS                                                   */}
        {/* ============================================================ */}
        {!isServicesPage && (
          <section className="section" style={{ background: 'var(--bg)' }}>
            <div className="container">
              <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                <p data-aos="fade-up" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#3b6cf4', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Simple Process</p>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <h2 data-aos="fade-up" data-aos-delay="100" className="section-title" style={{ margin: 0 }}>How It Works</h2>
                  <button 
                    data-aos="fade-up" data-aos-delay="150"
                    onClick={() => setVideoModalOpen(true)}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '0.5rem', 
                      background: 'rgba(59,108,244,0.08)', color: '#3b6cf4', 
                      border: '1px solid rgba(59,108,244,0.15)', borderRadius: '9999px',
                      padding: '0.5rem 1.25rem', fontSize: '0.875rem', fontWeight: 700,
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,108,244,0.12)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(59,108,244,0.08)'}
                  >
                    <PlayCircle size={18} /> Watch Website Demo
                  </button>
                </div>
                <div className="divider" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                {HOW_IT_WORKS.map(({ step, icon, title, desc }, i) => (
                  <div key={step} className="step-card" data-aos="fade-up" data-aos-delay={`${i * 100}`}>
                    <div style={{ position: 'relative', width: 'fit-content', margin: '0 auto 1.25rem' }}>
                      <div className="step-icon" style={{ background: `rgba(59,108,244,${0.06 + i * 0.02})` }}>
                        <span style={{ fontSize: '2rem' }}>{icon}</span>
                      </div>
                      <span className="step-number">STEP {step}</span>
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.625rem' }}>{title}</h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.7 }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* FEATURED SERVICES                                              */}
        {/* ============================================================ */}
        <section className="section" style={{ background: isServicesPage ? 'var(--bg)' : 'white', paddingTop: isServicesPage ? '8rem' : '2rem' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }} data-aos="fade-right">
              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#3b6cf4', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>
                  {isServicesPage ? 'All Listings' : 'Top Professionals'}
                </p>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }}>
                  {isServicesPage ? 'All Services' : 'Featured Services'}
                </h2>
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: 'rgba(59,108,244,0.08)', border: '1px solid rgba(59,108,244,0.15)',
                borderRadius: '9999px', padding: '0.35rem 0.875rem',
                fontSize: '0.8rem', fontWeight: 700, color: '#3b6cf4',
              }}>
                <Star size={13} fill="#3b6cf4" color="#3b6cf4" />
                {services.length} Experts Found
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '5rem 0' }}>
                <div style={{ display: 'inline-block', width: '48px', height: '48px', border: '3px solid rgba(59,108,244,0.15)', borderTopColor: '#3b6cf4', borderRadius: '50%', animation: 'spin 0.9s linear infinite', marginBottom: '1rem' }} />
                <p style={{ color: '#64748b', fontWeight: 500 }}>Finding the best services near you...</p>
              </div>
            ) : error ? (
              <div style={{ background: '#fff1f2', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '1rem', padding: '2rem', textAlign: 'center', color: '#ef4444' }}>{error}</div>
            ) : services.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '5rem 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>No services found</h3>
                <p style={{ color: '#64748b' }}>Try adjusting your search filters or exploring a different area.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
                {services.map((service, index) => (
                  <div key={service._id} data-aos="fade-up" data-aos-delay={`${Math.min(index * 60, 400)}`}>
                    <ServiceCard service={service} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ============================================================ */}
        {/* CTA BANNER                                                     */}
        {/* ============================================================ */}
        {!isServicesPage && (
          <section style={{ padding: '4rem 0 5rem', background: 'var(--bg)' }}>
            <div className="container">
              <div className="cta-banner" data-aos="fade-up" style={{ padding: '4rem 3rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '2rem' }}>
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
                    Join 10,000+ Users
                  </div>
                  <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, color: 'white', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '1rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Explore Top-Rated<br />Professionals Today
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '1.75rem', maxWidth: '420px' }}>
                    From plumbing to electrical fixes, find and connect with trusted local service providers in minutes.
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <a href="/register" className="btn btn-white" style={{ padding: '0.75rem 1.75rem', fontWeight: 700 }}>
                      Get Started Free
                    </a>
                    <a href="/services" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: '0.9rem', padding: '0.75rem 1.25rem', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: '9999px', textDecoration: 'none', transition: 'all 0.2s' }}>
                      Browse Services →
                    </a>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', flexShrink: 0 }}>
                  {[
                    { value: '10K+', label: 'Active Users', icon: '👥' },
                    { value: '4.9★', label: 'Average Rating', icon: '⭐' },
                    { value: '500+', label: 'Professionals', icon: '🏆' },
                    { value: '24/7', label: 'Support', icon: '💬' },
                  ].map(({ value, label, icon }) => (
                    <div key={label} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '1rem', padding: '1.25rem', textAlign: 'center', backdropFilter: 'blur(10px)' }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{icon}</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', lineHeight: 1.1 }}>{value}</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.2rem' }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      {/* Demo Video Modal */}
      {videoModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
        }} onClick={() => setVideoModalOpen(false)}>
          <div style={{
            background: '#0f172a', borderRadius: '1.5rem', overflow: 'hidden',
            width: '100%', maxWidth: '1000px', 
            position: 'relative', boxShadow: '0 25px 70px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '0.75rem', background: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ marginLeft: 'auto', marginRight: 'auto', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Smart Local - Platform Walkthrough</span>
              <button onClick={() => setVideoModalOpen(false)} style={{
                background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center'
              }} onMouseEnter={e => e.currentTarget.style.color = 'white'} onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
                <X size={18} />
              </button>
            </div>

            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/10' }}>
              <img 
                src="/demo_video.webp" 
                alt="Smart Local Demo" 
                style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default Home;
