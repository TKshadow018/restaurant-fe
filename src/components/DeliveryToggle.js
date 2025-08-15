import React from 'react';
import { useDelivery } from '@/contexts/DeliveryContext';
import { useTranslation } from 'react-i18next';

const DeliveryToggle = () => {
  const { isDeliveryEnabled, loading, toggleDelivery } = useDelivery();
  const { t } = useTranslation();

  const handleToggle = async () => {
    await toggleDelivery();
  };

  if (loading) {
    return (
      <button className="btn btn-outline-light" disabled>
        <i className="bi bi-hourglass-split"></i>
      </button>
    );
  }

  return (
    <button
      className={`btn ${isDeliveryEnabled ? 'btn-success' : 'btn-danger'} fs-6 fw-bold`}
      onClick={handleToggle}
      title={isDeliveryEnabled ? 
        t('admin.delivery.disable', 'Disable Delivery') : 
        t('admin.delivery.enable', 'Enable Delivery')
      }
      style={{ minWidth: '140px' }}
    >
      <i className={`bi ${isDeliveryEnabled ? 'bi-truck' : 'bi-truck-flatbed'} me-2`}></i>
      {isDeliveryEnabled ? 
        t('admin.delivery.enabled', 'Delivery ON') : 
        t('admin.delivery.disabled', 'Delivery OFF')
      }
    </button>
  );
};

export default DeliveryToggle;
