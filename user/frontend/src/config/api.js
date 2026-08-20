// API configuration
const PROD_API_URL = 'https://renthub-user-backend.onrender.com';
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : PROD_API_URL);

/**
 * Get the full API URL for a given endpoint
 * @param {string} endpoint - The API endpoint (e.g., '/api/vehicles')
 * @returns {string} - The full API URL
 */
export const getApiUrl = (endpoint) => {
  if (API_BASE_URL) {
    return `${API_BASE_URL}${endpoint}`;
  }
  return endpoint;
};

export default getApiUrl;
