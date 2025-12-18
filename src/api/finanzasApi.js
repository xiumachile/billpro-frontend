import axios from '@/api/axiosInstance';

export const finanzasApi = {
  // Obtener lista de gastos (con filtros opcionales)
  getGastos: async (params = {}) => {
    const response = await axios.get('/finanzas/gastos', { params });
    return response.data;
  },

  // Obtener categorías para el select
  getCategorias: async () => {
    const response = await axios.get('/finanzas/categorias');
    return response.data;
  },

  // Registrar nuevo gasto
  crearGasto: async (data) => {
    const response = await axios.post('/finanzas/gastos', data);
    return response.data;
  },

  // Eliminar gasto
  eliminarGasto: async (id) => {
    const response = await axios.delete(`/finanzas/gastos/${id}`);
    return response.data;
  },

  // Obtener reporte de balance (P&L)
  getBalance: async (fechaDesde, fechaHasta) => {
    const response = await axios.get('/finanzas/balance', {
      params: { fecha_desde: fechaDesde, fecha_hasta: fechaHasta }
    });
    return response.data;
  }
};
