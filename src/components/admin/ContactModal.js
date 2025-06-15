import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const ContactModal = ({ show, onHide, contact, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    businessHours: '',
    active: true,
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: ''
    }
  });

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name || '',
        address: contact.address || '',
        phone: contact.phone || '',
        email: contact.email || '',
        businessHours: contact.businessHours || '',
        active: contact.active !== undefined ? contact.active : true,
        socialMedia: contact.socialMedia || {
          facebook: '',
          instagram: '',
          twitter: ''
        }
      });
    } else {
      setFormData({
        name: '',
        address: '',
        phone: '',
        email: '',
        businessHours: '',
        active: true,
        socialMedia: {
          facebook: '',
          instagram: '',
          twitter: ''
        }
      });
    }
  }, [contact]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSocialMediaChange = (platform, value) => {
    setFormData(prev => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: value
      }
    }));
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {contact ? 'Edit Contact Information' : 'Add Contact Information'}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Contact Name/Title</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Main Restaurant, Delivery Center"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Address</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Full address including postal code"
              required
            />
          </Form.Group>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Phone</Form.Label>
                <Form.Control
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+46734770107"
                  required
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contact@restaurant.com"
                  required
                />
              </Form.Group>
            </div>
          </div>

          <Form.Group className="mb-3">
            <Form.Label>Business Hours</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="businessHours"
              value={formData.businessHours}
              onChange={handleChange}
              placeholder="Mon-Fri: 11:00 AM - 10:00 PM&#10;Sat: 12:00 PM - 11:00 PM&#10;Sun: 12:00 PM - 9:00 PM"
            />
          </Form.Group>

          <h6 className="mb-3">Social Media (Optional)</h6>
          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <Form.Group>
                <Form.Label>Facebook</Form.Label>
                <Form.Control
                  type="url"
                  value={formData.socialMedia.facebook}
                  onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
                  placeholder="Facebook page URL"
                />
              </Form.Group>
            </div>
            <div className="col-md-4">
              <Form.Group>
                <Form.Label>Instagram</Form.Label>
                <Form.Control
                  type="url"
                  value={formData.socialMedia.instagram}
                  onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
                  placeholder="Instagram profile URL"
                />
              </Form.Group>
            </div>
            <div className="col-md-4">
              <Form.Group>
                <Form.Label>Twitter</Form.Label>
                <Form.Control
                  type="url"
                  value={formData.socialMedia.twitter}
                  onChange={(e) => handleSocialMediaChange('twitter', e.target.value)}
                  placeholder="Twitter profile URL"
                />
              </Form.Group>
            </div>
          </div>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              name="active"
              label="Active (Display this contact information)"
              checked={formData.active}
              onChange={handleChange}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {contact ? 'Update' : 'Add'} Contact Info
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ContactModal;