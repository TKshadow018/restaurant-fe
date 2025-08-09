import React from 'react';
import { useTranslation } from 'react-i18next';
import '@/styles/theme.css';
import '@/styles/campaign.css';
import '../styles/Banner.css';

const getPositionClass = (position) => {
  switch (position) {
    case 'top-left':
      return 'banner-text-top-left';
    case 'top-right':
      return 'banner-text-top-right';
    case 'bottom-left':
      return 'banner-text-bottom-left';
    case 'bottom-right':
      return 'banner-text-bottom-right';
    case 'center':
    default:
      return 'banner-text-center';
  }
};

const Banner = ({
  image,
  title,
  subtitle,
  text,
  duration,
  textPosition = 'center',
  overlay = true,
  isMain= false,
  campainStartDate,
  campainEndDate,
  couponCode,
  hideCouponCode = false,
  minimumOrderAmount = 0,
    bannerColor = {
      title: '#ffffff',
      subtitle: '#ffffff',
      text: '#ffffff',
      duration: '#ffffff',
    },
}) => {
  const { i18n, t } = useTranslation();
  const currentLanguage = i18n.language === 'sv' ? 'swedish' : 'english';
  
  // Helper function to get localized text
  const getLocalizedText = (textObj, fallback = '') => {
    if (typeof textObj === 'string') return textObj;
    if (!textObj) return fallback;
    return textObj[currentLanguage] || textObj.english || textObj.swedish || fallback;
  };
  
  const positionClass = getPositionClass(textPosition);

  // Helper function to format campaign dates
  const formatCampaignDates = () => {
    if (!campainStartDate && !campainEndDate) return null;

    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      
      return date.toLocaleDateString(i18n.language === 'sv' ? 'sv-SE' : 'en-US', options);
    };

    if (campainStartDate && campainEndDate) {
      return `${formatDate(campainStartDate)} - ${formatDate(campainEndDate)}`;
    } else if (campainStartDate) {
      return t('campaign.dateFrom', { date: formatDate(campainStartDate) }) || `${t('common.from', 'From')} ${formatDate(campainStartDate)}`;
    } else if (campainEndDate) {
      return t('campaign.dateUntil', { date: formatDate(campainEndDate) }) || `${t('common.until', 'Until')} ${formatDate(campainEndDate)}`;
    }
  };

  // Set CSS custom properties for dynamic colors
  const bannerStyles = {
    '--banner-title-color': bannerColor.title,
    '--banner-subtitle-color': bannerColor.subtitle,
    '--banner-text-color': bannerColor.text,
    '--banner-duration-color': bannerColor.duration,
  };

  return (
    <div className={`${isMain ? 'banner-card-main' : 'banner-card'} position-relative mb-4 rounded`} style={bannerStyles}>
      <img
        src={image}
        alt={title}
        className={`${isMain ? 'banner-image-main' : 'banner-image'} w-100 rounded`}
      />
      {overlay && (
        <div className="banner-overlay position-absolute top-0 start-0 w-100 h-100" />
      )}
      <div className={`banner-text position-absolute ${positionClass}`}>
        <div className="banner-badge p-4 rounded">
          <h2 className="fw-bold mb-1 banner-title banner-title-dynamic">
            {getLocalizedText(title)}
          </h2>
          <h5 className="mb-2 banner-subtitle banner-subtitle-dynamic">
            {getLocalizedText(subtitle)}
          </h5>
          <p className="mb-0 banner-desc banner-text-dynamic">
            {getLocalizedText(text)}
          </p>
          {couponCode && !hideCouponCode && (
            <div className="mt-2 mb-2">
              <span className="badge bg-success banner-coupon-code">
                Code: {couponCode}
              </span>
            </div>
          )}
          {minimumOrderAmount > 0 && (
            <p className="mt-2 mb-0 banner-duration banner-duration-dynamic">
              <small>
                {t('campaign.minimumOrder', { amount: minimumOrderAmount }) || 
                 `${t('campaign.canBeUsedOn', 'Can be used on orders over')} ${minimumOrderAmount} SEK`
                }
              </small>
            </p>
          )}
          {formatCampaignDates() && (
            <p className="mt-2 mb-0 banner-duration banner-duration-dynamic">
              {formatCampaignDates()}
            </p>
          )}
          {duration && getLocalizedText(duration) && (
            <p className="mt-2 mb-0 banner-duration banner-duration-dynamic">
              {getLocalizedText(duration)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Banner;