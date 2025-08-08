// Swedish Address Validation Utility

/**
 * Validates a Swedish address using multiple validation methods
 * @param {Object} address - Address object containing street, houseNumber, postalCode, city
 * @returns {Promise<Object>} - Validation result with isValid, standardizedAddress, coordinates, error
 */
export const validateSwedishAddress = async (address) => {
  try {
    const { street, houseNumber, postalCode, city } = address;
    
    // Basic format validation first
    const formatValidation = validateSwedishAddressFormat(address);
    if (!formatValidation.isValid) {
      return formatValidation;
    }

    // Try multiple validation services in order of preference
    const validators = [
      validateWithPostnummerAPI,
      validateWithGoogleMapsAPI,
      validateWithOpenStreetMap
    ];

    for (const validator of validators) {
      try {
        const result = await validator(address);
        if (result.isValid) {
          return result;
        }
      } catch (error) {
        console.warn(`Validator failed:`, error.message);
        continue; // Try next validator
      }
    }

    // If all validators fail, return format validation result
    return {
      isValid: false,
      error: 'Unable to validate address with external services. Please check the address manually.',
      standardizedAddress: null,
      coordinates: null
    };

  } catch (error) {
    console.error('Address validation error:', error);
    return {
      isValid: false,
      error: 'Address validation service temporarily unavailable.',
      standardizedAddress: null,
      coordinates: null
    };
  }
};

/**
 * Validates Swedish address format (postal code, basic structure)
 */
export const validateSwedishAddressFormat = (address) => {
  const { street, houseNumber, postalCode, city } = address;
  const errors = [];

  // Required fields
  if (!street || !street.trim()) {
    errors.push('Street name is required');
  }

  if (!houseNumber || !houseNumber.trim()) {
    errors.push('House number is required');
  }

  if (!postalCode || !postalCode.trim()) {
    errors.push('Postal code is required');
  }

  if (!city || !city.trim()) {
    errors.push('City is required');
  }

  // Swedish postal code format: 5 digits, optionally with space after 3rd digit
  const postalCodeRegex = /^(\d{3}\s?\d{2})$/;
  if (postalCode && !postalCodeRegex.test(postalCode.trim())) {
    errors.push('Invalid Swedish postal code format (should be: 123 45 or 12345)');
  }

  // House number basic validation (numbers, letters, common separators)
  const houseNumberRegex = /^[\d]+[A-Za-z]?(-[\d]+[A-Za-z]?)?$/;
  if (houseNumber && !houseNumberRegex.test(houseNumber.trim())) {
    errors.push('Invalid house number format');
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      error: errors.join('. '),
      standardizedAddress: null,
      coordinates: null
    };
  }

  // Standardize postal code format
  const standardizedPostalCode = postalCode.replace(/\s/g, '').replace(/^(\d{3})(\d{2})$/, '$1 $2');

  return {
    isValid: true,
    error: null,
    standardizedAddress: {
      ...address,
      postalCode: standardizedPostalCode,
      street: street.trim(),
      houseNumber: houseNumber.trim(),
      city: city.trim(),
      region: address.region?.trim() || ''
    },
    coordinates: null
  };
};

/**
 * Validates address using Swedish Postnummer API (free service)
 */
const validateWithPostnummerAPI = async (address) => {
  const { postalCode } = address;
  const cleanPostalCode = postalCode.replace(/\s/g, '');

  try {
    const response = await fetch(
      `https://api.postnummer.nu/v2/codes/${cleanPostalCode}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const result = data[0];
      
      // Check if city matches (case-insensitive)
      const providedCity = address.city.toLowerCase().trim();
      const apiCity = result.city.toLowerCase().trim();
      
      if (providedCity === apiCity || apiCity.includes(providedCity) || providedCity.includes(apiCity)) {
        return {
          isValid: true,
          error: null,
          standardizedAddress: {
            ...address,
            city: result.city, // Use standardized city name
            region: result.county,
            postalCode: `${cleanPostalCode.substring(0, 3)} ${cleanPostalCode.substring(3)}`
          },
          coordinates: {
            lat: result.latitude,
            lng: result.longitude
          }
        };
      } else {
        return {
          isValid: false,
          error: `Postal code ${address.postalCode} does not match city ${address.city}. Expected: ${result.city}`,
          standardizedAddress: null,
          coordinates: null
        };
      }
    }

    return {
      isValid: false,
      error: 'Postal code not found in Swedish postal database',
      standardizedAddress: null,
      coordinates: null
    };

  } catch (error) {
    throw new Error(`Postnummer API validation failed: ${error.message}`);
  }
};

/**
 * Validates address using Google Maps Geocoding API
 */
const validateWithGoogleMapsAPI = async (address) => {
  if (!process.env.REACT_APP_GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key not configured');
  }

  const { street, houseNumber, postalCode, city } = address;
  const fullAddress = `${street} ${houseNumber}, ${postalCode} ${city}, Sweden`;

  try {
    const params = new URLSearchParams({
      address: fullAddress,
      key: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
      region: 'se',
      language: 'sv'
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params}`,
      {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      
      // Check if result is in Sweden
      const countryComponent = result.address_components.find(
        component => component.types.includes('country')
      );
      
      if (countryComponent && countryComponent.short_name !== 'SE') {
        return {
          isValid: false,
          error: 'Address is not in Sweden',
          standardizedAddress: null,
          coordinates: null
        };
      }

      // Parse address components
      const standardizedAddress = parseGoogleAddressComponents(result.address_components, address);
      
      return {
        isValid: true,
        error: null,
        standardizedAddress,
        coordinates: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng
        }
      };
    }

    return {
      isValid: false,
      error: 'Address not found by Google Maps',
      standardizedAddress: null,
      coordinates: null
    };

  } catch (error) {
    throw new Error(`Google Maps validation failed: ${error.message}`);
  }
};

/**
 * Parse Google Maps address components into standardized format
 */
const parseGoogleAddressComponents = (components, originalAddress) => {
  const parsed = {
    street: originalAddress.street,
    houseNumber: originalAddress.houseNumber,
    postalCode: originalAddress.postalCode,
    city: originalAddress.city,
    region: originalAddress.region || ''
  };

  components.forEach(component => {
    const types = component.types;
    
    if (types.includes('route')) {
      parsed.street = component.long_name;
    } else if (types.includes('street_number')) {
      parsed.houseNumber = component.long_name;
    } else if (types.includes('postal_code')) {
      parsed.postalCode = component.long_name;
    } else if (types.includes('locality')) {
      parsed.city = component.long_name;
    } else if (types.includes('administrative_area_level_1')) {
      parsed.region = component.long_name;
    }
  });

  return parsed;
};

/**
 * Validates address using OpenStreetMap Nominatim (fallback)
 */
const validateWithOpenStreetMap = async (address) => {
  const { street, houseNumber, postalCode, city } = address;
  const fullAddress = `${street} ${houseNumber}, ${postalCode} ${city}, Sweden`;

  try {
    const params = new URLSearchParams({
      q: fullAddress,
      format: 'json',
      countrycodes: 'se',
      limit: '1',
      addressdetails: '1'
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        method: 'GET',
        headers: {
          'User-Agent': 'RestaurantApp/1.0 (address-validation)'
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const result = data[0];
      const addressData = result.address;

      return {
        isValid: true,
        error: null,
        standardizedAddress: {
          street: addressData.road || address.street,
          houseNumber: addressData.house_number || address.houseNumber,
          postalCode: addressData.postcode || address.postalCode,
          city: addressData.city || addressData.town || addressData.village || address.city,
          region: addressData.state || address.region || ''
        },
        coordinates: {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon)
        }
      };
    }

    return {
      isValid: false,
      error: 'Address not found in OpenStreetMap',
      standardizedAddress: null,
      coordinates: null
    };

  } catch (error) {
    throw new Error(`OpenStreetMap validation failed: ${error.message}`);
  }
};

/**
 * Get suggestions for Swedish addresses based on partial input
 */
export const getSwedishAddressSuggestions = async (query, maxResults = 5) => {
  if (!query || query.length < 3) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: query + ', Sweden',
      format: 'json',
      countrycodes: 'se',
      limit: maxResults.toString(),
      addressdetails: '1'
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        method: 'GET',
        headers: {
          'User-Agent': 'RestaurantApp/1.0 (address-autocomplete)'
        },
        signal: AbortSignal.timeout(3000) // 3 second timeout
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return data.map(result => ({
      display_name: result.display_name,
      address: {
        street: result.address.road || '',
        houseNumber: result.address.house_number || '',
        postalCode: result.address.postcode || '',
        city: result.address.city || result.address.town || result.address.village || '',
        region: result.address.state || '',
        coordinates: {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon)
        }
      }
    }));

  } catch (error) {
    console.error('Address suggestions error:', error);
    return [];
  }
};

/**
 * Validate Swedish postal code format
 */
export const isValidSwedishPostalCode = (postalCode) => {
  if (!postalCode) return false;
  const regex = /^(\d{3}\s?\d{2})$/;
  return regex.test(postalCode.trim());
};

/**
 * Format Swedish postal code (add space if needed)
 */
export const formatSwedishPostalCode = (postalCode) => {
  if (!postalCode) return '';
  const cleaned = postalCode.replace(/\s/g, '');
  if (cleaned.length === 5 && /^\d{5}$/.test(cleaned)) {
    return `${cleaned.substring(0, 3)} ${cleaned.substring(3)}`;
  }
  return postalCode;
};
