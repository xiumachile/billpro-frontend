// src/api/parametrosApi.js
import axios from './axiosInstance';

// ✅ Helper para manejar respuestas y errores de forma consistente
const handleResponse = async (promise) => {
  try {
    const response = await promise;
    return response.data;
  } catch (error) {
    // Si el servidor responde con error (400, 401, 422, 500)
    if (error.response) {
      const data = error.response.data;
      const message = data.message || data.error || error.response.statusText || 'Error en la solicitud';
      
      // Si hay errores de validación de Laravel
      if (data.errors) {
        const detalles = Object.values(data.errors).flat().join(', ');
        throw new Error(`${message}: ${detalles}`);
      }
      
      throw new Error(message);
    }
    // Si es error de red o configuración
    throw error;
  }
};

// ✅ API para gestión de parámetros del sistema
export const parametrosApi = {
  // ==================== UNIDADES DE MEDIDA ====================

  getUnidadesMedida: () => 
    handleResponse(axios.get('/unidades-medida')),

  getTiposUnidad: () => 
    handleResponse(axios.get('/unidades-medida/tipos')),

  createUnidadMedida: (data) => 
    handleResponse(axios.post('/unidades-medida', data)),

  updateUnidadMedida: (id, data) => 
    handleResponse(axios.put(`/unidades-medida/${id}`, data)),

  deleteUnidadMedida: (id) => 
    handleResponse(axios.delete(`/unidades-medida/${id}`)),

  // ==================== FACTORES DE CONVERSIÓN ====================

  getFactoresConversion: () => 
    handleResponse(axios.get('/factores-conversion')),

  createFactorConversion: (data) => 
    handleResponse(axios.post('/factores-conversion', data)),

  updateFactorConversion: (id, data) => 
    handleResponse(axios.put(`/factores-conversion/${id}`, data)),

  deleteFactorConversion: (id) => 
    handleResponse(axios.delete(`/factores-conversion/${id}`)),

  // ==================== IMPRESORAS ====================

  getImpresoras: () => 
    handleResponse(axios.get('/impresoras')),

  createImpresora: (data) => 
    handleResponse(axios.post('/impresoras', data)),

  updateImpresora: (id, data) => 
    handleResponse(axios.put(`/impresoras/${id}`, data)),

  deleteImpresora: (id) => 
    handleResponse(axios.delete(`/impresoras/${id}`)),

  probarImpresora: (id) => 
    handleResponse(axios.post(`/impresoras/${id}/probar`)),

  // ==================== CONFIGURACIÓN TICKETS ====================

  getConfiguracionTicket: () => 
    handleResponse(axios.get('/configuracion-ticket')),

  updateConfiguracionTicket: (data) => 
    handleResponse(axios.put('/configuracion-ticket', data)),

  // ==================== CONFIGURACIÓN COMANDAS ====================

  getConfiguracionComanda: () => 
    handleResponse(axios.get('/configuracion-comanda')),

  updateConfiguracionComanda: (data) => 
    handleResponse(axios.put('/configuracion-comanda', data)),

  // ==================== CONFIGURACIÓN RED ====================

  getConfiguracionRed: () => 
    handleResponse(axios.get('/configuracion-red')),

  updateConfiguracionRed: (data) => 
    handleResponse(axios.put('/configuracion-red', data)),

  // ==================== FORMAS DE PAGO ====================

  getFormasPago: () => 
    handleResponse(axios.get('/formas-pago')),

  createFormaPago: (data) => 
    handleResponse(axios.post('/formas-pago', data)),

  updateFormaPago: (id, data) => 
    handleResponse(axios.put(`/formas-pago/${id}`, data)),

  deleteFormaPago: (id) => 
    handleResponse(axios.delete(`/formas-pago/${id}`)),
};
