import React, { useState } from 'react';
import { Modal, Button, Alert, Form, Row, Col } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

const AddressPickerMap = ({ show, onHide, onAddressSelect, initialAddress = {} }) => {
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualAddress, setManualAddress] = useState({
    street: '',
    houseNumber: '',
    postalCode: '',
    city: '',
    region: ''
  });

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-geo-alt me-2"></i>
          {t('profile.enterAddress', 'Enter Your Address')}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        {/* Manual Address Entry */}
        <div className="p-3 border rounded bg-light">
          <h6 className="mb-3">{t('profile.addressDetails', 'Address Details')}</h6>
          <Form>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('profile.street', 'Street')} <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={manualAddress.street}
                    onChange={(e) => setManualAddress(prev => ({ ...prev, street: e.target.value }))}
                    placeholder="Kungsgatan"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('profile.houseNumber', 'House Number')} <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={manualAddress.houseNumber}
                    onChange={(e) => setManualAddress(prev => ({ ...prev, houseNumber: e.target.value }))}
                    placeholder="12A"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('profile.postalCode', 'Postal Code')} <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={manualAddress.postalCode}
                    onChange={(e) => setManualAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                    placeholder="123 45"
                    required
                  />
                  <Form.Text className="text-muted">
                    {t('profile.postalCodeFormat', 'Format: 123 45')}
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('profile.city', 'City')} <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    value={manualAddress.city}
                    onChange={(e) => setManualAddress(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Stockholm"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>{t('profile.region', 'Region')} ({t('common.optional', 'Optional')})</Form.Label>
              <Form.Control
                type="text"
                value={manualAddress.region}
                onChange={(e) => setManualAddress(prev => ({ ...prev, region: e.target.value }))}
                placeholder="Stockholm County"
              />
            </Form.Group>
          </Form>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          {t('common.cancel', 'Cancel')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddressPickerMap;
