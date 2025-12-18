// src/api/conversionApi.js
import axios from './axiosInstance';

// ✅ Helper para manejar respuestas y errores de forma consistente
const handleResponse = async (promise) => {
  try {
    const response = await promise;
    return response.data;
  } catch (error) {
    if (error.response) {
      const data = error.response.data;
      const message = data.message || data.error || error.response.statusText || 'Error en la solicitud';
      
      if (data.errors) {
        const detalles = Object.values(data.errors).flat().join(', ');
        throw new Error(`${message}: ${detalles}`);
      }
      
      throw new Error(message);
    }
    throw error;
  }
};

export const conversionApi = {
  /**
   * Obtiene las unidades compatibles para un producto
   * @param {number} productoId - ID del producto de inventario
   */
  getUnidadesCompatibles: (productoId) =>
    handleResponse(axios.get(`/unidades-medida/compatibles/${productoId}`)),

  /**
   * Convierte una cantidad entre unidades
   * @param {Object} data - { cantidad, unidad_origen_id, unidad_destino_id }
   */
  convertirCantidad: async (data) => {
    console.log('🔄 conversionApi.convertirCantidad - Enviando:', data);
    
    try {
        // Axios serializa el objeto data a JSON automáticamente
        const result = await handleResponse(axios.post('/unidades-medida/convertir', data));
        console.log('✅ conversionApi.convertirCantidad - Respuesta:', result);
        return result;
    } catch (error) {
        console.error('❌ conversionApi.convertirCantidad - Error:', error);
        throw error;
    }
  },

  /**
   * Verifica si se puede convertir entre dos unidades
   * @param {number} unidadOrigenId
   * @param {number} unidadDestinoId
   */
  puedeConvertir: (unidadOrigenId, unidadDestinoId) =>
    handleResponse(axios.post('/unidades-medida/puede-convertir', {
      unidad_origen_id: unidadOrigenId,
      unidad_destino_id: unidadDestinoId
    })),
};
