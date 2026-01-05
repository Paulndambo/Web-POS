import { BASE_URL } from '../config/currency.js';
import { getAuthTokens } from './cookies.js';

/**
 * Get the access token from cookies
 * @returns {string|null} The access token or null if not found
 */
export const getAccessToken = () => {
  const { accessToken } = getAuthTokens();
  return accessToken;
};

/**
 * Get the refresh token from cookies
 * @returns {string|null} The refresh token or null if not found
 */
export const getRefreshToken = () => {
  const { refreshToken } = getAuthTokens();
  return refreshToken;
};

/**
 * Create headers for API requests
 * @param {boolean} includeAuth - Whether to include authorization header
 * @param {Object} additionalHeaders - Additional headers to include
 * @returns {Object} Headers object
 */
export const createHeaders = (includeAuth = true, additionalHeaders = {}) => {
  const headers = {
    'Accept': '*/*',
    'Content-Type': 'application/json',
    ...additionalHeaders
  };

  if (includeAuth) {
    const token = getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

/**
 * Make an API request
 * @param {string} endpoint - API endpoint (e.g., '/users/', '/inventory')
 * @param {Object} options - Fetch options
 * @param {boolean} requiresAuth - Whether the request requires authentication (default: true)
 * @returns {Promise<Response>} Fetch response
 */
export const apiRequest = async (endpoint, options = {}, requiresAuth = true) => {
  const url = `${BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: createHeaders(requiresAuth, options.headers || {})
  };

  const fetchOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {})
    }
  };

  return fetch(url, fetchOptions);
};

/**
 * Make a GET request
 * @param {string} endpoint - API endpoint
 * @param {boolean} requiresAuth - Whether the request requires authentication (default: true)
 * @returns {Promise<Response>} Fetch response
 */
export const apiGet = async (endpoint, requiresAuth = true) => {
  return apiRequest(endpoint, { method: 'GET' }, requiresAuth);
};

/**
 * Make a POST request
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body data
 * @param {boolean} requiresAuth - Whether the request requires authentication (default: true)
 * @returns {Promise<Response>} Fetch response
 */
export const apiPost = async (endpoint, data, requiresAuth = true) => {
  return apiRequest(
    endpoint,
    {
      method: 'POST',
      body: JSON.stringify(data)
    },
    requiresAuth
  );
};

/**
 * Make a PUT request
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body data
 * @param {boolean} requiresAuth - Whether the request requires authentication (default: true)
 * @returns {Promise<Response>} Fetch response
 */
export const apiPut = async (endpoint, data, requiresAuth = true) => {
  return apiRequest(
    endpoint,
    {
      method: 'PUT',
      body: JSON.stringify(data)
    },
    requiresAuth
  );
};

/**
 * Make a PATCH request
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body data
 * @param {boolean} requiresAuth - Whether the request requires authentication (default: true)
 * @returns {Promise<Response>} Fetch response
 */
export const apiPatch = async (endpoint, data, requiresAuth = true) => {
  return apiRequest(
    endpoint,
    {
      method: 'PATCH',
      body: JSON.stringify(data)
    },
    requiresAuth
  );
};

/**
 * Make a DELETE request
 * @param {string} endpoint - API endpoint
 * @param {boolean} requiresAuth - Whether the request requires authentication (default: true)
 * @returns {Promise<Response>} Fetch response
 */
export const apiDelete = async (endpoint, requiresAuth = true) => {
  return apiRequest(endpoint, { method: 'DELETE' }, requiresAuth);
};

