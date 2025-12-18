// src/api/produccionApi.js
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

export const produccionApi = {
  /**
   * Verifica si hay suficiente stock para producir una receta
   */
  verificarStock: async (recetaId, cantidad) => {
    try {
      console.log('🔍 Verificando stock para producción:', { recetaId, cantidad });
      const data = await handleResponse(axios.post('/produccion/verificar-stock', {
        receta_id: recetaId,
        cantidad: cantidad
      }));
      console.log('✅ Verificación de stock completada:', data);
      return data;
    } catch (error) {
      console.error('❌ Error al verificar stock:', error);
      throw error;
    }
  },

  /**
   * Ejecuta la producción de una receta
   */
  producirReceta: async (data) => {
    try {
      console.log('🏭 Ejecutando producción:', data);
      const responseData = await handleResponse(axios.post('/produccion/ejecutar', data));
      console.log('✅ Producción ejecutada correctamente:', responseData);
      return responseData;
    } catch (error) {
      console.error('❌ Error al ejecutar producción:', error);
      throw error;
    }
  },

  // ✅ NUEVOS MÉTODOS PARA REPORTES (Agregados para ReporteProduccion.jsx)
  getReporteProducciones: (params = {}) => 
    handleResponse(axios.get('/reportes/produccion', { params })),

  getResumenProduccion: (params = {}) => 
    handleResponse(axios.get('/reportes/produccion/resumen-por-receta', { params })),
};
