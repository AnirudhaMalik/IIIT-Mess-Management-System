/**
 * api.js - Centralized API Service for IIIT Bhubaneswar Mess Management System
 * Base: http://localhost:5000/api/v1
 */

const API_BASE = window.APP_CONFIG?.API_BASE_URL ||
  'http://localhost:5000/api/v1';

const api = {
  /**
   * Performs GET request
   */
  async get(endpoint, params = {}) {
    const url = this._buildUrl(endpoint, params);
    return this._fetch(url, {
      method: 'GET',
      headers: this._getHeaders(false)
    });
  },

  /**
   * Performs POST request
   */
  async post(endpoint, data = {}, isFormData = false) {
    const url = this._buildUrl(endpoint);
    const options = {
      method: 'POST',
      headers: this._getHeaders(isFormData)
    };
    if (isFormData) {
      options.body = data;
    } else {
      options.body = JSON.stringify(data);
    }
    return this._fetch(url, options);
  },

  /**
   * Performs PUT request
   */
  async put(endpoint, data = {}, isFormData = false) {
    const url = this._buildUrl(endpoint);
    const options = {
      method: 'PUT',
      headers: this._getHeaders(isFormData)
    };
    if (isFormData) {
      options.body = data;
    } else {
      options.body = JSON.stringify(data);
    }
    return this._fetch(url, options);
  },

  /**
   * Performs PATCH request
   */
  async patch(endpoint, data = {}, isFormData = false) {
    const url = this._buildUrl(endpoint);
    const options = {
      method: 'PATCH',
      headers: this._getHeaders(isFormData)
    };
    if (isFormData) {
      options.body = data;
    } else {
      options.body = JSON.stringify(data);
    }
    return this._fetch(url, options);
  },

  /**
   * Performs DELETE request
   */
  async delete(endpoint, params = {}) {
    const url = this._buildUrl(endpoint, params);
    return this._fetch(url, {
      method: 'DELETE',
      headers: this._getHeaders(false)
    });
  },

  /**
   * Builds full URL with query parameters
   */
  _buildUrl(endpoint, params = {}) {
    let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    let url = `${API_BASE}${cleanEndpoint}`;

    const paramEntries = Object.entries(params).filter(
      ([_, value]) => value !== undefined && value !== null && value !== ''
    );

    if (paramEntries.length > 0) {
      const searchParams = new URLSearchParams();
      paramEntries.forEach(([key, value]) => {
        searchParams.append(key, value);
      });
      url += (url.includes('?') ? '&' : '?') + searchParams.toString();
    }

    return url;
  },

  /**
   * Returns request headers with Bearer token
   */
  _getHeaders(isFormData = false) {
    const headers = {};
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  /**
   * Internal fetch executor with unified error & response handling
   */
  async _fetch(url, options) {
    try {
      const response = await fetch(url, options);
      return await this._handleResponse(response);
    } catch (error) {
      return this._handleError(error);
    }
  },

  /**
   * Handles server response
   */
  async _handleResponse(response) {
    // 401 Unauthorized -> clear token & redirect
    if (response.status === 401) {
      localStorage.clear();
      // Calculate relative path to login page
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/pages/auth/login.html')) {
        let prefix = './';
        if (currentPath.includes('/pages/student/') || currentPath.includes('/pages/admin/')) {
          prefix = '../auth/';
        } else if (currentPath.includes('/pages/auth/')) {
          prefix = './';
        } else {
          prefix = './pages/auth/';
        }
        window.location.href = `${prefix}login.html`;
      }
      throw new Error('Session expired. Please log in again.');
    }

    // Attempt to parse JSON
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }

    if (!response.ok) {
      const errorMsg =
        (data && (data.message || data.error || (Array.isArray(data.errors) && data.errors[0]?.msg))) ||
        `Request failed with status ${response.status}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  },

  /**
   * Handles network or fetch errors
   */
  _handleError(error) {
    console.error('API Error:', error);
    throw error;
  }
};

window.api = api;
