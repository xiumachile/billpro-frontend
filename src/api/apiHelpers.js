// src/api/apiHelpers.js

/**
 * Obtiene el header de autenticación con el token almacenado
 * @returns {Object} Headers de autenticación
 */
export const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
};

/**
 * Obtiene el header de autenticación para FormData (sin Content-Type)
 * @returns {Object} Headers de autenticación para FormData
 */
export const getAuthHeaderForFormData = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  };
};

/**
 * URL base de la API
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Maneja errores de respuesta de la API
 * @param {Response} response - Respuesta de fetch
 * @returns {Promise} Respuesta procesada
 */
export const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ 
      message: 'Error en la petición' 
    }));
    throw new Error(error.message || `Error ${response.status}`);
  }
  return response.json();
};

/**
 * Realiza una petición GET autenticada
 * @param {string} endpoint - Endpoint de la API
 * @returns {Promise} Datos de la respuesta
 */
export const fetchGet = async (endpoint) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: getAuthHeader()
  });
  return handleResponse(response);
};

/**
 * Realiza una petición POST autenticada
 * @param {string} endpoint - Endpoint de la API
 * @param {Object} data - Datos a enviar
 * @returns {Promise} Datos de la respuesta
 */
export const fetchPost = async (endpoint, data) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify(data)
  });
  return handleResponse(response);
};

/**
 * Realiza una petición PUT autenticada
 * @param {string} endpoint - Endpoint de la API
 * @param {Object} data - Datos a enviar
 * @returns {Promise} Datos de la respuesta
 */
export const fetchPut = async (endpoint, data) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers: getAuthHeader(),
    body: JSON.stringify(data)
  });
  return handleResponse(response);
};

/**
 * Realiza una petición DELETE autenticada
 * @param {string} endpoint - Endpoint de la API
 * @returns {Promise} Datos de la respuesta
 */
export const fetchDelete = async (endpoint) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers: getAuthHeader()
  });
  return handleResponse(response);
};

/**
 * Realiza una petición POST con FormData autenticada
 * @param {string} endpoint - Endpoint de la API
 * @param {FormData} formData - FormData a enviar
 * @returns {Promise} Datos de la respuesta
 */
export const fetchPostFormData = async (endpoint, formData) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: getAuthHeaderForFormData(),
    body: formData
  });
  return handleResponse(response);
};

/**
 * Verifica si el usuario está autenticado
 * @returns {boolean} True si hay token
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

/**
 * Obtiene el token almacenado
 * @returns {string|null} Token o null
 */
export const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Guarda el token en localStorage
 * @param {string} token - Token a guardar
 */
export const setToken = (token) => {
  localStorage.setItem('token', token);
};

/**
 * Elimina el token de localStorage
 */
export const removeToken = () => {
  localStorage.removeItem('token');
};

/**
 * Maneja errores de autenticación (401)
 * @param {Error} error - Error capturado
 * @param {Function} navigate - Función de navegación de React Router
 */
export const handleAuthError = (error, navigate) => {
  if (error.message.includes('401') || error.message.includes('Unauthorized')) {
    removeToken();
    if (navigate) {
      navigate('/login');
    }
  }
};
