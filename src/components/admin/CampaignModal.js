import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Spinner } from 'react-bootstrap';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase/config';
import { useSelector } from 'react-redux';
import '../../styles/AdminComponents.css';

const CampaignModal = ({ show, onHide, campaign, onSave }) => {
  const foods = useSelector((state) => state.menu.menuItems);

  const [formData, setFormData] = useState({
    image: '',
    title: {
      swedish: '',
      english: ''
    },
    subtitle: {
      swedish: '',
      english: ''
    },
    text: {
      swedish: '',
      english: ''
    },
    textPosition: 'center',
    isMain: false,
    campainStartDate: '',
    campainEndDate: '',
    couponCode: '',
    hideCouponCode: false, // New field to hide/show coupon code
    discountType: 'percentage', // 'percentage' or 'fixed'
    discountPercentage: 20,
    discountFixedAmount: 50,
    maxUsagesPerUser: 1,
    minimumOrderAmount: 0,
    bannerColor: {
      title: '#ffcc00',
      subtitle: '#ff9900',
      text: '#ffffff',
      duration: '#ffffff',
    },
    eligibleDishes: [],
  });

  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    if (campaign) {
      // When editing an existing campaign
      setFormData({
        image: campaign.image || '',
        title: {
          swedish: campaign.title?.swedish || '',
          english: campaign.title?.english || ''
        },
        subtitle: {
          swedish: campaign.subtitle?.swedish || '',
          english: campaign.subtitle?.english || ''
        },
        text: {
          swedish: campaign.text?.swedish || '',
          english: campaign.text?.english || ''
        },
        textPosition: campaign.textPosition || 'center',
        isMain: campaign.isMain || false,
        campainStartDate: campaign.campainStartDate || '',
        campainEndDate: campaign.campainEndDate || '',
        couponCode: campaign.couponCode || '',
        hideCouponCode: campaign.hideCouponCode || false,
        discountType: campaign.discountType || 'percentage',
        discountPercentage: campaign.discountPercentage || 20,
        discountFixedAmount: campaign.discountFixedAmount || 50,
        maxUsagesPerUser: campaign.maxUsagesPerUser || 1,
        minimumOrderAmount: campaign.minimumOrderAmount || 0,
        bannerColor: campaign.bannerColor || {
          title: '#ffcc00',
          subtitle: '#ff9900',
          text: '#ffffff',
          duration: '#ffffff',
        },
        eligibleDishes: campaign.eligibleDishes || [],
      });
      setImagePreview(campaign.image || '');
    } else {
      // For new campaigns, reset to initial state
      setFormData({
        image: '',
        title: {
          swedish: '',
          english: ''
        },
        subtitle: {
          swedish: '',
          english: ''
        },
        text: {
          swedish: '',
          english: ''
        },
        textPosition: 'center',
        isMain: false,
        campainStartDate: '',
        campainEndDate: '',
        couponCode: '',
        hideCouponCode: false,
        discountType: 'percentage',
        discountPercentage: 20,
        discountFixedAmount: 50,
        maxUsagesPerUser: 1,
        minimumOrderAmount: 0,
        bannerColor: {
          title: '#ffcc00',
          subtitle: '#ff9900',
          text: '#ffffff',
          duration: '#ffffff',
        },
        eligibleDishes: [],
      });
      setImagePreview('');
    }
  }, [campaign]);

  // Cleanup function to revoke object URLs
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Clean up previous preview URL if it was a blob
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      
      setImageFile(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      
      // Clear the URL input when file is selected
      setFormData(prev => ({
        ...prev,
        image: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required multilingual fields
    if (!formData.title.swedish.trim() || !formData.title.english.trim()) {
      alert('Please provide titles in both Swedish and English.');
      return;
    }

    setUploading(true);

    try {
      // Handle image upload if file is selected
      let imageUrl = formData.image;
      if (imageFile) {
        const imageRef = ref(storage, `campaigns/${Date.now()}-${imageFile.name}`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      // Validate that we have an image (either uploaded or URL)
      if (!imageUrl && !formData.image) {
        alert('Please provide an image (either upload a file or enter a URL).');
        setUploading(false);
        return;
      }

      const processedData = {
        ...formData,
        image: imageUrl
      };
      
      onSave(processedData);
      
      // Reset form after successful save
      if (!campaign) {
        setFormData({
          image: '',
          title: { swedish: '', english: '' },
          subtitle: { swedish: '', english: '' },
          text: { swedish: '', english: '' },
          textPosition: 'center',
          isMain: false,
          campainStartDate: '',
          campainEndDate: '',
          couponCode: '',
          discountType: 'percentage',
          discountPercentage: 20,
          discountFixedAmount: 50,
          maxUsagesPerUser: 1,
          minimumOrderAmount: 0,
          bannerColor: {
            title: '#ffcc00',
            subtitle: '#ff9900',
            text: '#ffffff',
            duration: '#ffffff',
          },
          eligibleDishes: [],
        });
        setImageFile(null);
        setImagePreview('');
      }
      
    } catch (error) {
      console.error('Error saving campaign:', error);
      alert('Failed to save campaign. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, multiple, options } = e.target;
    
    if (name === "eligibleDishes") {
      if (multiple) {
        const selectedValues = Array.from(options)
          .filter(option => option.selected)
          .map(option => option.value);
        setFormData(prev => ({ ...prev, [name]: selectedValues }));
      }
    } else if (name.includes('.')) {
      // Handle nested properties like title.swedish, bannerColor.title
      const keys = name.split('.');
      setFormData(prev => {
        const updated = { ...prev };
        let current = updated;
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = type === 'checkbox' ? checked : value;
        return updated;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>{campaign ? 'Edit Campaign' : 'Add New Campaign'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {/* Image Section */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Campaign Image</Form.Label>
            
            {/* Image Upload Section */}
            <div className="mb-3">
              <Form.Label>Upload Image File</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
              />
              {uploading && (
                <div className="mt-2 d-flex align-items-center">
                  <Spinner animation="border" size="sm" className="me-2" />
                  <span>Uploading image...</span>
                </div>
              )}
            </div>

            {/* OR Divider */}
            <div className="text-center mb-3">
              <span className="text-muted">OR</span>
            </div>

            {/* Image URL Section */}
            <div className="mb-3">
              <Form.Label>Image URL</Form.Label>
              <Form.Control
                type="url"
                name="image"
                value={formData.image}
                onChange={handleChange}
                placeholder="Enter image URL"
                disabled={!!imageFile || uploading}
              />
              <Form.Text className="text-muted">
                {imageFile ? 'File selected - URL input disabled' : 'Enter a direct image URL'}
              </Form.Text>
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="mb-3">
                <Form.Label>Preview</Form.Label>
                <div>
                  <img 
                    src={imagePreview} 
                    alt="Campaign Preview" 
                    className="food-modal-preview-image"
                  />
                </div>
              </div>
            )}
          </Form.Group>

          {/* Title Fields */}
          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Title (Swedish)</Form.Label>
                <Form.Control
                  type="text"
                  name="title.swedish"
                  value={formData.title.swedish}
                  onChange={handleChange}
                  placeholder="Kampanjtitel på svenska"
                  required
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Title (English)</Form.Label>
                <Form.Control
                  type="text"
                  name="title.english"
                  value={formData.title.english}
                  onChange={handleChange}
                  placeholder="Campaign title in English"
                  required
                />
              </Form.Group>
            </div>
          </div>

          {/* Subtitle Fields */}
          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Subtitle (Swedish)</Form.Label>
                <Form.Control
                  type="text"
                  name="subtitle.swedish"
                  value={formData.subtitle.swedish}
                  onChange={handleChange}
                  placeholder="Underrubrik på svenska"
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Subtitle (English)</Form.Label>
                <Form.Control
                  type="text"
                  name="subtitle.english"
                  value={formData.subtitle.english}
                  onChange={handleChange}
                  placeholder="Subtitle in English"
                />
              </Form.Group>
            </div>
          </div>

          {/* Text Fields */}
          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Text (Swedish)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="text.swedish"
                  value={formData.text.swedish}
                  onChange={handleChange}
                  placeholder="Kampanjtext på svenska"
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Text (English)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="text.english"
                  value={formData.text.english}
                  onChange={handleChange}
                  placeholder="Campaign text in English"
                />
              </Form.Group>
            </div>
          </div>

          {/* Campaign Details Row 1 */}
          <div className="row">
            <div className="col-md-4">
              <Form.Group className="mb-3">
                <Form.Label>Coupon Code</Form.Label>
                <Form.Control
                  type="text"
                  name="couponCode"
                  value={formData.couponCode}
                  onChange={handleChange}
                  placeholder="e.g., SAVE20, NEWBIE15"
                  className="campaign-modal-color-input"
                />
                <Form.Text className="text-muted">
                  Optional: Enter a coupon code for this campaign
                </Form.Text>
                <Form.Check
                  type="checkbox"
                  name="hideCouponCode"
                  label="Hide coupon code from campaign display"
                  checked={formData.hideCouponCode}
                  onChange={handleChange}
                  className="mt-2"
                />
              </Form.Group>
            </div>
            <div className="col-md-4">
              <Form.Group className="mb-3">
                <Form.Label>Discount Type</Form.Label>
                <Form.Select
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleChange}
                >
                  <option value="percentage">Percentage Discount</option>
                  <option value="fixed">Fixed Amount Discount</option>
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-md-4">
              {formData.discountType === 'percentage' ? (
                <Form.Group className="mb-3">
                  <Form.Label>Discount Percentage</Form.Label>
                  <Form.Control
                    type="number"
                    name="discountPercentage"
                    value={formData.discountPercentage}
                    onChange={handleChange}
                    min="1"
                    max="100"
                    placeholder="20"
                  />
                  <Form.Text className="text-muted">
                    Discount % for eligible items
                  </Form.Text>
                </Form.Group>
              ) : (
                <Form.Group className="mb-3">
                  <Form.Label>Fixed Discount Amount (SEK)</Form.Label>
                  <Form.Control
                    type="number"
                    name="discountFixedAmount"
                    value={formData.discountFixedAmount}
                    onChange={handleChange}
                    min="1"
                    placeholder="50"
                  />
                  <Form.Text className="text-muted">
                    Fixed amount discount in SEK
                  </Form.Text>
                </Form.Group>
              )}
            </div>
          </div>

          {/* Campaign Details Row 2 */}
          <div className="row">
            <div className="col-md-3">
              <Form.Group className="mb-3">
                <Form.Label>Max Uses Per User</Form.Label>
                <Form.Control
                  type="number"
                  name="maxUsagesPerUser"
                  value={formData.maxUsagesPerUser}
                  onChange={handleChange}
                  min="1"
                  placeholder="1"
                />
                <Form.Text className="text-muted">
                  How many times each user can use this coupon
                </Form.Text>
              </Form.Group>
            </div>
            <div className="col-md-3">
              <Form.Group className="mb-3">
                <Form.Label>Minimum Order (SEK)</Form.Label>
                <Form.Control
                  type="number"
                  name="minimumOrderAmount"
                  value={formData.minimumOrderAmount}
                  onChange={handleChange}
                  min="0"
                  placeholder="0"
                />
                <Form.Text className="text-muted">
                  Minimum order value to use coupon (0 = no minimum)
                </Form.Text>
              </Form.Group>
            </div>
            <div className="col-md-3">
              <Form.Group className="mb-3">
                <Form.Label>Text Position</Form.Label>
                <Form.Select
                  name="textPosition"
                  value={formData.textPosition}
                  onChange={handleChange}
                >
                  <option value="center">Center</option>
                  <option value="top-left">Top Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-right">Bottom Right</option>
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  name="isMain"
                  label="Main Banner"
                  checked={formData.isMain}
                  onChange={handleChange}
                />
              </Form.Group>
            </div>
          </div>

          {/* Date Fields */}
          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  name="campainStartDate"
                  value={formData.campainStartDate}
                  onChange={handleChange}
                />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>End Date</Form.Label>
                <Form.Control
                  type="date"
                  name="campainEndDate"
                  value={formData.campainEndDate}
                  onChange={handleChange}
                />
              </Form.Group>
            </div>
          </div>

          {/* Color Fields */}
          <div className="row">
            <div className="col-md-3">
              <Form.Group className="mb-3">
                <Form.Label>Title Color</Form.Label>
                <Form.Control
                  type="color"
                  name="bannerColor.title"
                  value={formData.bannerColor.title}
                  onChange={handleChange}
                />
              </Form.Group>
            </div>
            <div className="col-md-3">
              <Form.Group className="mb-3">
                <Form.Label>Subtitle Color</Form.Label>
                <Form.Control
                  type="color"
                  name="bannerColor.subtitle"
                  value={formData.bannerColor.subtitle}
                  onChange={handleChange}
                />
              </Form.Group>
            </div>
            <div className="col-md-3">
              <Form.Group className="mb-3">
                <Form.Label>Text Color</Form.Label>
                <Form.Control
                  type="color"
                  name="bannerColor.text"
                  value={formData.bannerColor.text}
                  onChange={handleChange}
                />
              </Form.Group>
            </div>
            <div className="col-md-3">
              <Form.Group className="mb-3">
                <Form.Label>Duration Color</Form.Label>
                <Form.Control
                  type="color"
                  name="bannerColor.duration"
                  value={formData.bannerColor.duration}
                  onChange={handleChange}
                />
              </Form.Group>
            </div>
          </div>

          {/* Eligible Dishes */}
          <Form.Group className="mb-3">
            <Form.Label>Eligible Dishes</Form.Label>
            <Form.Select
              multiple
              name="eligibleDishes"
              value={formData.eligibleDishes || []}
              onChange={handleChange}
              className="campaign-modal-description"
            >
              {foods.map((food) => {
                const getDisplayName = (name) => {
                  if (typeof name === 'string') return name;
                  return name?.english || name?.swedish || 'Unnamed Item';
                };
                
                return (
                  <option key={food.id} value={food.id}>
                    {getDisplayName(food.name)}
                  </option>
                );
              })}
            </Form.Select>
            <Form.Text className="text-muted">
              Hold Ctrl (Windows) or Cmd (Mac) to select multiple dishes.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            type="submit"
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Uploading...
              </>
            ) : (
              <>{campaign ? 'Update' : 'Add'} Campaign</>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CampaignModal;
