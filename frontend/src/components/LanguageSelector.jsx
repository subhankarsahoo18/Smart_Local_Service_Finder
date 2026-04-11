/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import { Globe, Search, X, ChevronDown, Check } from 'lucide-react';

const LANGUAGES = [
  // ── Indian Languages ──
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', region: 'Indian' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', region: 'Indian' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', region: 'Indian' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', region: 'Indian' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', region: 'Indian' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', region: 'Indian' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', region: 'Indian' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', region: 'Indian' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ', region: 'Indian' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', region: 'Indian' },
  { code: 'as', name: 'Assamese', native: 'অসমীয়া', region: 'Indian' },
  { code: 'mai', name: 'Maithili', native: 'मैथिली', region: 'Indian' },
  { code: 'sa', name: 'Sanskrit', native: 'संस्कृतम्', region: 'Indian' },
  { code: 'sd', name: 'Sindhi', native: 'سنڌي', region: 'Indian' },
  { code: 'ur', name: 'Urdu', native: 'اردو', region: 'Indian' },
  { code: 'ne', name: 'Nepali', native: 'नेपाली', region: 'Indian' },
  { code: 'si', name: 'Sinhala', native: 'සිංහල', region: 'Indian' },
  { code: 'doi', name: 'Dogri', native: 'डोगरी', region: 'Indian' },
  { code: 'ks', name: 'Kashmiri', native: 'कॉशुर', region: 'Indian' },
  { code: 'gom', name: 'Konkani', native: 'कोंकणी', region: 'Indian' },
  { code: 'mni-Mtei', name: 'Meiteilon', native: 'ꯃꯤꯇꯩꯂꯣꯟ', region: 'Indian' },
  { code: 'lus', name: 'Mizo', native: 'Mizo tawng', region: 'Indian' },
  { code: 'bho', name: 'Bhojpuri', native: 'भोजपुरी', region: 'Indian' },

  // ── European ──
  { code: 'en', name: 'English', native: 'English', region: 'European' },
  { code: 'es', name: 'Spanish', native: 'Español', region: 'European' },
  { code: 'fr', name: 'French', native: 'Français', region: 'European' },
  { code: 'de', name: 'German', native: 'Deutsch', region: 'European' },
  { code: 'it', name: 'Italian', native: 'Italiano', region: 'European' },
  { code: 'pt', name: 'Portuguese', native: 'Português', region: 'European' },
  { code: 'ru', name: 'Russian', native: 'Русский', region: 'European' },
  { code: 'nl', name: 'Dutch', native: 'Nederlands', region: 'European' },
  { code: 'pl', name: 'Polish', native: 'Polski', region: 'European' },
  { code: 'uk', name: 'Ukrainian', native: 'Українська', region: 'European' },
  { code: 'cs', name: 'Czech', native: 'Čeština', region: 'European' },
  { code: 'sv', name: 'Swedish', native: 'Svenska', region: 'European' },
  { code: 'da', name: 'Danish', native: 'Dansk', region: 'European' },
  { code: 'fi', name: 'Finnish', native: 'Suomi', region: 'European' },
  { code: 'no', name: 'Norwegian', native: 'Norsk', region: 'European' },
  { code: 'el', name: 'Greek', native: 'Ελληνικά', region: 'European' },
  { code: 'hu', name: 'Hungarian', native: 'Magyar', region: 'European' },
  { code: 'ro', name: 'Romanian', native: 'Română', region: 'European' },
  { code: 'sk', name: 'Slovak', native: 'Slovenčina', region: 'European' },
  { code: 'bg', name: 'Bulgarian', native: 'Български', region: 'European' },
  { code: 'hr', name: 'Croatian', native: 'Hrvatski', region: 'European' },
  { code: 'sr', name: 'Serbian', native: 'Српски', region: 'European' },
  { code: 'lt', name: 'Lithuanian', native: 'Lietuvių', region: 'European' },
  { code: 'lv', name: 'Latvian', native: 'Latviešu', region: 'European' },
  { code: 'et', name: 'Estonian', native: 'Eesti', region: 'European' },
  { code: 'sl', name: 'Slovenian', native: 'Slovenščina', region: 'European' },
  { code: 'is', name: 'Icelandic', native: 'Íslenska', region: 'European' },
  { code: 'ga', name: 'Irish', native: 'Gaeilge', region: 'European' },
  { code: 'cy', name: 'Welsh', native: 'Cymraeg', region: 'European' },
  { code: 'eu', name: 'Basque', native: 'Euskara', region: 'European' },
  { code: 'ca', name: 'Catalan', native: 'Català', region: 'European' },
  { code: 'gl', name: 'Galician', native: 'Galego', region: 'European' },
  { code: 'sq', name: 'Albanian', native: 'Shqip', region: 'European' },
  { code: 'mk', name: 'Macedonian', native: 'Македонски', region: 'European' },
  { code: 'bs', name: 'Bosnian', native: 'Bosanski', region: 'European' },
  { code: 'mt', name: 'Maltese', native: 'Malti', region: 'European' },
  { code: 'lb', name: 'Luxembourgish', native: 'Lëtzebuergesch', region: 'European' },

  // ── East & Southeast Asian ──
  { code: 'zh-CN', name: 'Chinese (Simplified)', native: '简体中文', region: 'Asian' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', native: '繁體中文', region: 'Asian' },
  { code: 'ja', name: 'Japanese', native: '日本語', region: 'Asian' },
  { code: 'ko', name: 'Korean', native: '한국어', region: 'Asian' },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt', region: 'Asian' },
  { code: 'th', name: 'Thai', native: 'ไทย', region: 'Asian' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', region: 'Asian' },
  { code: 'ms', name: 'Malay', native: 'Bahasa Melayu', region: 'Asian' },
  { code: 'tl', name: 'Filipino', native: 'Filipino', region: 'Asian' },
  { code: 'my', name: 'Myanmar', native: 'မြန်မာ', region: 'Asian' },
  { code: 'km', name: 'Khmer', native: 'ខ្មែរ', region: 'Asian' },
  { code: 'lo', name: 'Lao', native: 'ລາວ', region: 'Asian' },
  { code: 'mn', name: 'Mongolian', native: 'Монгол', region: 'Asian' },
  { code: 'ka', name: 'Georgian', native: 'ქართული', region: 'Asian' },
  { code: 'hy', name: 'Armenian', native: 'Հայերեն', region: 'Asian' },
  { code: 'az', name: 'Azerbaijani', native: 'Azərbaycan', region: 'Asian' },
  { code: 'uz', name: 'Uzbek', native: 'Oʻzbek', region: 'Asian' },
  { code: 'kk', name: 'Kazakh', native: 'Қазақ', region: 'Asian' },
  { code: 'ky', name: 'Kyrgyz', native: 'Кыргызча', region: 'Asian' },
  { code: 'tg', name: 'Tajik', native: 'Тоҷикӣ', region: 'Asian' },
  { code: 'tk', name: 'Turkmen', native: 'Türkmen', region: 'Asian' },

  // ── Middle Eastern ──
  { code: 'ar', name: 'Arabic', native: 'العربية', region: 'Middle Eastern' },
  { code: 'fa', name: 'Persian', native: 'فارسی', region: 'Middle Eastern' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe', region: 'Middle Eastern' },
  { code: 'he', name: 'Hebrew', native: 'עברית', region: 'Middle Eastern' },
  { code: 'ku', name: 'Kurdish', native: 'Kurdî', region: 'Middle Eastern' },
  { code: 'ps', name: 'Pashto', native: 'پښتو', region: 'Middle Eastern' },

  // ── African ──
  { code: 'sw', name: 'Swahili', native: 'Kiswahili', region: 'African' },
  { code: 'am', name: 'Amharic', native: 'አማርኛ', region: 'African' },
  { code: 'ha', name: 'Hausa', native: 'Hausa', region: 'African' },
  { code: 'ig', name: 'Igbo', native: 'Igbo', region: 'African' },
  { code: 'yo', name: 'Yoruba', native: 'Yorùbá', region: 'African' },
  { code: 'zu', name: 'Zulu', native: 'isiZulu', region: 'African' },
  { code: 'af', name: 'Afrikaans', native: 'Afrikaans', region: 'African' },
  { code: 'so', name: 'Somali', native: 'Soomaali', region: 'African' },
  { code: 'mg', name: 'Malagasy', native: 'Malagasy', region: 'African' },
  { code: 'rw', name: 'Kinyarwanda', native: 'Ikinyarwanda', region: 'African' },
];

const REGION_ORDER = ['Indian', 'Asian', 'European', 'Middle Eastern', 'African'];
const REGION_EMOJI = {
  'Indian': '🇮🇳',
  'Asian': '🌏',
  'European': '🌍',
  'Middle Eastern': '🕌',
  'African': '🌍',
};

const LanguageSelector = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedLang, setSelectedLang] = useState(null);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [open]);

  // Load saved language on mount
  useEffect(() => {
    const saved = localStorage.getItem('selectedLanguage');
    if (saved) {
      const lang = LANGUAGES.find(l => l.code === saved);
      if (lang) setSelectedLang(lang);
    }
  }, []);

  const triggerGoogleTranslate = (langCode) => {
    try {
      // 1. Set the translation cookie directly
      document.cookie = `googtrans=/en/${langCode}; path=/`;
      document.cookie = `googtrans=/en/${langCode}; domain=${window.location.hostname}; path=/`;

      // 2. Try to trigger the hidden select element
      const selectEl = document.querySelector('.goog-te-combo');
      if (selectEl) {
        selectEl.value = langCode;
        selectEl.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
      } else {
        // Fallback: If Google Translate hasn't loaded the select yet, reload to apply cookie
        window.location.reload();
      }
    } catch (e) {
      console.error('Translation error:', e);
      window.location.reload();
    }
  };

  const handleSelect = (lang) => {
    if (lang.code === 'en') {
      // Reset to original
      setSelectedLang(null);
      localStorage.removeItem('selectedLanguage');
      
      // Clear cookies
      document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      document.cookie = `googtrans=; domain=${window.location.hostname}; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
      
      // Trigger restore
      const selectEl = document.querySelector('.goog-te-combo');
      if (selectEl) {
        selectEl.value = '';
        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
      }
      
      // Force reload to clear translation cache
      window.location.reload();
    } else {
      setSelectedLang(lang);
      localStorage.setItem('selectedLanguage', lang.code);
      triggerGoogleTranslate(lang.code);
    }
    setOpen(false);
    setSearch('');
  };

  // Filter languages by search
  const filtered = LANGUAGES.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.native.toLowerCase().includes(search.toLowerCase()) ||
    l.region.toLowerCase().includes(search.toLowerCase())
  );

  // Group by region
  const grouped = REGION_ORDER.reduce((acc, region) => {
    const langs = filtered.filter(l => l.region === region);
    if (langs.length > 0) acc.push({ region, langs });
    return acc;
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.35rem 0.7rem',
          borderRadius: '9999px',
          background: selectedLang ? 'rgba(59,108,244,0.08)' : 'transparent',
          border: `1.5px solid ${selectedLang ? 'rgba(59,108,244,0.25)' : 'rgba(59,108,244,0.12)'}`,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          color: selectedLang ? '#3b6cf4' : '#64748b',
          fontSize: '0.78rem',
          fontWeight: 600,
          fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(59,108,244,0.4)';
          e.currentTarget.style.background = 'rgba(59,108,244,0.06)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = selectedLang ? 'rgba(59,108,244,0.25)' : 'rgba(59,108,244,0.12)';
          e.currentTarget.style.background = selectedLang ? 'rgba(59,108,244,0.08)' : 'transparent';
        }}
        title="Change Language"
      >
        <Globe size={14} />
        <span>{selectedLang ? selectedLang.name : 'Language'}</span>
        <ChevronDown size={12} style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: '320px',
          maxHeight: '420px',
          background: 'white',
          borderRadius: '1rem',
          boxShadow: '0 20px 60px rgba(59,108,244,0.18), 0 4px 12px rgba(0,0,0,0.08)',
          border: '1px solid rgba(59,108,244,0.1)',
          zIndex: 600,
          overflow: 'hidden',
          animation: 'fadeInUp 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Search Bar */}
          <div style={{ padding: '0.75rem', borderBottom: '1px solid rgba(59,108,244,0.08)' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 0.75rem',
              background: '#f8faff',
              borderRadius: '0.625rem',
              border: '1.5px solid rgba(59,108,244,0.1)',
            }}>
              <Search size={14} color="#94a3b8" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search languages..."
                style={{
                  border: 'none', outline: 'none', background: 'transparent',
                  fontSize: '0.82rem', color: '#0f172a', width: '100%',
                  fontFamily: "'Inter', sans-serif",
                }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#94a3b8', display: 'flex' }}>
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Language List */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '0.375rem' }}>
            {grouped.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8', fontSize: '0.82rem' }}>
                No languages found for "{search}"
              </div>
            ) : (
              grouped.map(({ region, langs }) => (
                <div key={region}>
                  {/* Region Header */}
                  <div style={{
                    padding: '0.4rem 0.75rem',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    position: 'sticky', top: 0,
                    background: 'white',
                    zIndex: 1,
                  }}>
                    <span>{REGION_EMOJI[region]}</span> {region}
                  </div>

                  {/* Language Items */}
                  {langs.map(lang => {
                    const isActive = selectedLang?.code === lang.code || (!selectedLang && lang.code === 'en');
                    return (
                      <button
                        key={lang.code}
                        onClick={() => handleSelect(lang)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          width: '100%', padding: '0.5rem 0.75rem',
                          borderRadius: '0.5rem',
                          background: isActive ? 'rgba(59,108,244,0.08)' : 'transparent',
                          border: 'none', cursor: 'pointer',
                          transition: 'all 0.15s',
                          textAlign: 'left',
                        }}
                        onMouseEnter={e => {
                          if (!isActive) e.currentTarget.style.background = 'rgba(59,108,244,0.04)';
                        }}
                        onMouseLeave={e => {
                          if (!isActive) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.05rem' }}>
                          <span style={{
                            fontSize: '0.82rem', fontWeight: isActive ? 700 : 500,
                            color: isActive ? '#3b6cf4' : '#334155',
                            fontFamily: "'Inter', sans-serif",
                          }}>
                            {lang.name}
                          </span>
                          <span style={{
                            fontSize: '0.7rem',
                            color: isActive ? 'rgba(59,108,244,0.7)' : '#94a3b8',
                          }}>
                            {lang.native}
                          </span>
                        </div>
                        {isActive && (
                          <div style={{
                            width: '18px', height: '18px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #3b6cf4, #7c3aed)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            <Check size={10} color="white" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
