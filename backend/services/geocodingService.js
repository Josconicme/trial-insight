// backend/services/geocodingService.js
const axios = require('axios');

class GeocodingService {
  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.geocodeCache = new Map();
    if (!this.apiKey) {
        console.warn('Warning: GOOGLE_MAPS_API_KEY is not set. Geocoding will not work.');
    }
  }

  _formatAddress(location) {
    const components = [location.facility, location.city, location.state, location.country];
    return components.filter(Boolean).join(', ');
  }

  async geocodeLocation(location) {
    if (!this.apiKey) return null;
    const address = this._formatAddress(location);
    if (!address) return null;
    
    if (this.geocodeCache.has(address)) {
      return this.geocodeCache.get(address);
    }
    
    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: { address, key: this.apiKey },
      });
      
      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const { lat, lng } = response.data.results[0].geometry.location;
        const coordinates = [lng, lat]; // MongoDB uses [longitude, latitude]
        this.geocodeCache.set(address, coordinates);
        return coordinates;
      }
      return null;
    } catch (error) {
      console.error(`Error geocoding address "${address}":`, error.message);
      return null;
    }
  }
}

module.exports = new GeocodingService();