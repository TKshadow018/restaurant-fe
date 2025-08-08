import React, { useState } from 'react';
import { Dropdown, Badge, ListGroup } from 'react-bootstrap';
import { useNotification } from '@/contexts/NotificationContext';
import { useTranslation } from 'react-i18next';
import '@/styles/notifications.css';

const NotificationBell = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    clearAllNotifications,
    hasPermission,
    voiceEnabled,
    toggleVoiceNotifications,
    testVoiceNotification,
    requestPermission 
  } = useNotification();
  const { t, i18n } = useTranslation();
  const [show, setShow] = useState(false);

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    setShow(false);
  };

  const handleRequestPermission = async () => {
    await requestPermission();
  };

  const handleTestVoice = () => {
    testVoiceNotification();
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return i18n.language === 'sv' ? 'Nu' : 'Now';
    if (minutes < 60) return i18n.language === 'sv' ? `${minutes}m sedan` : `${minutes}m ago`;
    if (hours < 24) return i18n.language === 'sv' ? `${hours}h sedan` : `${hours}h ago`;
    return i18n.language === 'sv' ? `${days}d sedan` : `${days}d ago`;
  };

  return (
    <Dropdown show={show} onToggle={setShow} align="end">
      <Dropdown.Toggle
        variant="link"
        className={`notification-bell text-decoration-none position-relative ${unreadCount > 0 ? 'has-new' : ''}`}
        style={{ boxShadow: 'none', color: 'white' }}
      >
        <i className="bi bi-bell fs-5"></i>
        {unreadCount > 0 && (
          <span className="notification-count">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu className="notification-dropdown shadow-lg border-0">
        <div className="dropdown-header d-flex justify-content-between align-items-center">
          <span>{t('notifications.title', 'Notifications')}</span>
          <div className="d-flex gap-1">
            {/* Voice toggle button */}
            <button
              className={`btn btn-sm ${voiceEnabled ? 'btn-success' : 'btn-outline-light'}`}
              onClick={() => toggleVoiceNotifications(!voiceEnabled)}
              title={voiceEnabled ? 'Disable voice notifications' : 'Enable voice notifications'}
            >
              <i className={`bi ${voiceEnabled ? 'bi-volume-up' : 'bi-volume-mute'}`}></i>
            </button>
            
            {/* Test voice button */}
            {voiceEnabled && (
              <button
                className="btn btn-sm btn-outline-light"
                onClick={testVoiceNotification}
                title="Test voice notification"
              >
                <i className="bi bi-play"></i>
              </button>
            )}
            
            {/* Clear all button */}
            {notifications.length > 0 && (
              <button
                className="btn btn-sm btn-outline-light"
                onClick={clearAllNotifications}
              >
                {t('notifications.clearAll', 'Clear All')}
              </button>
            )}
          </div>
        </div>

        {!hasPermission && (
          <div className="px-3 py-2 text-center border-bottom">
            <small className="text-muted d-block mb-2">
              {t('notifications.enablePrompt', 'Enable notifications to stay updated')}
            </small>
            <button
              className="btn btn-sm btn-primary"
              onClick={handleRequestPermission}
            >
              {t('notifications.enable', 'Enable Notifications')}
            </button>
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="px-3 py-4 text-center">
            <i className="bi bi-bell text-muted mb-2" style={{ fontSize: '2rem' }}></i>
            <p className="text-muted mb-0">
              {t('notifications.empty', 'No notifications yet')}
            </p>
          </div>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {notifications.slice(0, 10).map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="d-flex align-items-start">
                  <div className={`notification-icon ${notification.type}`}>
                    {notification.type === 'order-received' ? '🎉' : 
                     notification.type === 'new-order' ? '🔔' : 'ℹ️'}
                  </div>
                  <div className="notification-content flex-grow-1">
                    <h6 className={!notification.read ? 'text-primary' : ''}>
                      {notification.title}
                    </h6>
                    <p>{notification.message}</p>
                    {notification.orderId && (
                      <small className="text-muted">
                        ID: {notification.orderId.slice(-8)}
                      </small>
                    )}
                    <div className="notification-time">
                      {formatTime(notification.timestamp)}
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="notification-unread-indicator"></div>
                  )}
                </div>
              </div>
            ))}
            {notifications.length > 10 && (
              <div className="text-center py-2 px-3">
                <small className="text-muted">
                  {t('notifications.showingRecent', 'Showing 10 most recent notifications')}
                </small>
              </div>
            )}
          </div>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default NotificationBell;
