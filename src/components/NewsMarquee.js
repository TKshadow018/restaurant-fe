import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { fetchNews } from '@/store/slices/newsSlice';
import '@/styles/NewsMarquee.css';

const NewsMarquee = () => {
  const dispatch = useDispatch();
  const { items: allNews, status } = useSelector((state) => state.news);
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language === 'sv' ? 'swedish' : 'english';

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchNews());
    }
  }, [dispatch, status]);

  // Filter and sort news items
  const activeNews = useMemo(() => {
    if (!allNews || allNews.length === 0) return [];

    // Filter only active news items
    const activeItems = allNews.filter(item => item.isActive);
    
    // Sort by priority, then by creation date
    return activeItems.sort((a, b) => {
      if (a.priority !== b.priority) {
        return (a.priority || 999) - (b.priority || 999);
      }
      // Secondary sort by createdAt if available
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return 0;
    });
  }, [allNews]);

  // Helper function to get localized text
  const getLocalizedText = (textObj, fallback = '') => {
    if (typeof textObj === 'string') return textObj;
    if (!textObj) return fallback;
    return textObj[currentLanguage] || textObj.english || textObj.swedish || fallback;
  };

  // Don't render if no active news items or still loading
  if (status === 'loading' || activeNews.length === 0) {
    return null;
  }

  return (
    <div className="news-marquee-container">
      <div className="news-marquee-wrapper">
        <div className="news-marquee-content">
          {activeNews.map((newsItem, index) => (
            <div key={newsItem.id} className="news-item">
              <span className="news-title">
                📢 {getLocalizedText(newsItem.title, t('news.defaultTitle', 'News Update'))}
              </span>
              {newsItem.subtitle && (
                <span className="news-subtitle">
                  - {getLocalizedText(newsItem.subtitle)}
                </span>
              )}
              {index < activeNews.length - 1 && (
                <span className="news-separator">•••</span>
              )}
            </div>
          ))}
          {/* Duplicate the content for seamless loop */}
          {activeNews.map((newsItem, index) => (
            <div key={`${newsItem.id}-duplicate`} className="news-item">
              <span className="news-title">
                📢 {getLocalizedText(newsItem.title, t('news.defaultTitle', 'News Update'))}
              </span>
              {newsItem.subtitle && (
                <span className="news-subtitle">
                  - {getLocalizedText(newsItem.subtitle)}
                </span>
              )}
              {index < activeNews.length - 1 && (
                <span className="news-separator">•••</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewsMarquee;
