/**
 * Cookie utility functions for managing authentication tokens
 */

/**
 * Set a cookie with a specific expiration time
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} hours - Hours until expiration (default: 1)
 */
export const setCookie = (name, value, hours = 1) => {
  const date = new Date();
  date.setTime(date.getTime() + (hours * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  
  // Set cookie with secure flags
  document.cookie = `${name}=${value};${expires};path=/;SameSite=Strict`;
};

/**
 * Get a cookie by name
 * @param {string} name - Cookie name
 * @returns {string|null} Cookie value or null if not found
 */
export const getCookie = (name) => {
  const nameEQ = `${name}=`;
  const cookies = document.cookie.split(';');
  
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return cookie.substring(nameEQ.length, cookie.length);
    }
  }
  return null;
};

/**
 * Delete a cookie by name
 * @param {string} name - Cookie name
 */
export const deleteCookie = (name) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

/**
 * Check if a cookie exists
 * @param {string} name - Cookie name
 * @returns {boolean} True if cookie exists
 */
export const hasCookie = (name) => {
  return getCookie(name) !== null;
};

/**
 * Set authentication tokens in cookies
 * @param {string} accessToken - Access token
 * @param {string} refreshToken - Refresh token
 * @param {number} accessTokenHours - Hours until access token expires (default: 1)
 * @param {number} refreshTokenHours - Hours until refresh token expires (default: 24)
 */
export const setAuthTokens = (accessToken, refreshToken, accessTokenHours = 1, refreshTokenHours = 24) => {
  setCookie('pos_access_token', accessToken, accessTokenHours);
  setCookie('pos_refresh_token', refreshToken, refreshTokenHours);
  setCookie('pos_token_timestamp', Date.now().toString(), accessTokenHours);
};

/**
 * Get authentication tokens from cookies
 * @returns {Object} Object containing access and refresh tokens
 */
export const getAuthTokens = () => {
  return {
    accessToken: getCookie('pos_access_token'),
    refreshToken: getCookie('pos_refresh_token'),
    timestamp: getCookie('pos_token_timestamp')
  };
};

/**
 * Clear all authentication tokens
 */
export const clearAuthTokens = () => {
  deleteCookie('pos_access_token');
  deleteCookie('pos_refresh_token');
  deleteCookie('pos_token_timestamp');
};

/**
 * Check if access token is expired or about to expire
 * @returns {boolean} True if token is expired or will expire soon
 */
export const isTokenExpired = () => {
  const timestamp = getCookie('pos_token_timestamp');
  if (!timestamp) return true;
  
  const tokenAge = Date.now() - parseInt(timestamp);
  const oneHourInMs = 60 * 60 * 1000;
  
  // Return true if token is older than 1 hour
  return tokenAge >= oneHourInMs;
};

