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
 * Get the current logged-in user's business and branch IDs
 * @returns {Object} Object with business and branch IDs, or null if user not found
 */
export const getCurrentUserBusinessAndBranch = () => {
  try {
    const storedUser = localStorage.getItem('pos_user');
    if (!storedUser) {
      return null;
    }
    
    const user = JSON.parse(storedUser);
    const businessId = user.business_id || user.business;
    const branchId = user.branch_id || user.branch;
    
    if (!businessId) {
      return null;
    }
    
    return {
      business: businessId,
      branch: branchId || null
    };
  } catch (error) {
    console.error('Error getting user business and branch:', error);
    return null;
  }
};

/**
 * Enrich request body with business and branch IDs for authenticated requests
 * @param {Object} data - Original request body data
 * @param {boolean} requiresAuth - Whether the request requires authentication
 * @returns {Object} Enriched request body with business and branch IDs
 */
const enrichRequestBody = (data, requiresAuth) => {
  if (!requiresAuth) {
    return data;
  }
  
  const userContext = getCurrentUserBusinessAndBranch();
  if (!userContext) {
    return data;
  }
  
  // Ensure data is an object
  const bodyData = data || {};
  
  // Always set business and branch IDs (override if already present)
  return {
    ...bodyData,
    business: userContext.business,
    branch: userContext.branch
  };
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
  const enrichedData = enrichRequestBody(data, requiresAuth);
  return apiRequest(
    endpoint,
    {
      method: 'POST',
      body: JSON.stringify(enrichedData)
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
  const enrichedData = enrichRequestBody(data, requiresAuth);
  return apiRequest(
    endpoint,
    {
      method: 'PUT',
      body: JSON.stringify(enrichedData)
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
  const enrichedData = enrichRequestBody(data, requiresAuth);
  return apiRequest(
    endpoint,
    {
      method: 'PATCH',
      body: JSON.stringify(enrichedData)
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

