import React from 'react';
import '@/styles/theme.css';
import '@/styles/campaign.css';

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
  textPosition = 'center',
  overlay = true,
  isMain= false,
  campainStartDate,
  campainEndDate,
    bannerColor = {
      title: '#ffffff',
      subtitle: '#ffffff',
      text: '#ffffff',
      duration: '#ffffff',
    },
}) => {
  const positionClass = getPositionClass(textPosition);

  return (
    <div className={`${isMain ? 'banner-card-main' : 'banner-card'} position-relative mb-4 rounded`}>
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
          <h2 className="fw-bold mb-1 banner-title" style={{color:bannerColor.title}}>{title}</h2>
          <h5 className="mb-2 banner-subtitle" style={{color:bannerColor.subtitle}}>{subtitle}</h5>
          <p className="mb-0 banner-desc" style={{color:bannerColor.text}}>{text}</p>
          {campainStartDate && campainEndDate && (
            <p className="mt-2 mb-0 banner-duration" style={{color:bannerColor.duration}}>
              Journey begins {new Date(campainStartDate).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })} • Concludes {new Date(campainEndDate).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Banner;