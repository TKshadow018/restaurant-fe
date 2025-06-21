import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const toggleLanguage = () => {
    const currentLang = i18n.language || 'en';
    const newLang = currentLang === 'en' ? 'sv' : 'en';
    
    console.log('Current language:', currentLang);
    console.log('Switching to:', newLang);
    console.log('Test translation before:', t('navbar.home'));
    
    i18n.changeLanguage(newLang).then(() => {
      console.log('Language changed to:', i18n.language);
      console.log('Test translation after:', t('navbar.home'));
    });
  };

  return (
    <div className="d-flex align-items-center me-3 bg-light rounded-pill p-2 shadow-sm">
      {/* English Flag */}
      <button
        className={`btn rounded-circle p-1 me-2 ${
          i18n.language === 'en' 
            ? 'btn-primary border-3 border-warning shadow' 
            : 'btn-outline-secondary border-0'
        }`}
        onClick={() => i18n.changeLanguage('en')}
        title="Switch to English"
        style={{ width: '40px', height: '40px' }}
      >
        <img
          src="/flags/uk.png"
          alt="English"
          className="rounded-circle"
          width="28"
          height="28"
        />
      </button>

      {/* Swedish Flag */}
      <button
        className={`btn rounded-circle p-1 ${
          i18n.language === 'sv' 
            ? 'btn-primary border-3 border-warning shadow' 
            : 'btn-outline-secondary border-0'
        }`}
        onClick={() => i18n.changeLanguage('sv')}
        title="Växla till svenska"
        style={{ width: '40px', height: '40px' }}
      >
        <img
          src="/flags/sweden.png"
          alt="Swedish"
          className="rounded-circle"
          width="28"
          height="28"
        />
      </button>
    </div>
  );
};

export default LanguageSwitcher;