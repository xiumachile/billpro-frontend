// src/api/inventarioApi.js
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

export const inventarioApi = {
  // ==================== PRODUCTOS ====================
  getProductosInventario: (filtros = {}) => {
    // Preparamos los params para Axios
    const params = { ...filtros };
    // Convertir booleano a 1/0 si viene definido
    if (params.bajo_stock !== undefined) {
        params.bajo_stock = params.bajo_stock ? 1 : 0;
    }
    return handleResponse(axios.get('/inventario', { params }));
  },
  
  crearProductoInventario: (datos) =>
    handleResponse(axios.post('/inventario', datos)),
  
  obtenerProductoInventario: (id) =>
    handleResponse(axios.get(`/inventario/${id}`)),
  
  actualizarProductoInventario: (id, datos) => {
    // Limpiamos el ID del cuerpo para evitar conflictos
    const { id: idEnCuerpo, ...cleanData } = datos;
    return handleResponse(axios.put(`/inventario/${id}`, cleanData));
  },
  
  eliminarProductoInventario: (id) =>
    handleResponse(axios.delete(`/inventario/${id}`)),

  // ==================== CATEGORÍAS Y UNIDADES ====================
  getUnidadesMedida: () =>
    handleResponse(axios.get('/inventario/unidades-medida')),
  
  getCategorias: () =>
    handleResponse(axios.get('/inventario/categorias')),
  
  getSubcategorias: (categoria = null) =>
    handleResponse(axios.get('/inventario/subcategorias', { params: { categoria } })),

  // ==================== MOVIMIENTOS DE INVENTARIO ====================
  registrarMovimiento: (datos) =>
    handleResponse(axios.post('/inventario/movimientos', datos)),

  ajustarStock: (datos) =>
    handleResponse(axios.post('/inventario/ajustes', datos)),

  getMovimientos: (filtros = {}) =>
    handleResponse(axios.get('/inventario/movimientos', { params: filtros })),

  // ==================== PROVEEDORES ====================
  getProveedores: (search = '') =>
    handleResponse(axios.get('/proveedores', { params: { search } })),
  
  crearProveedor: (datos) =>
    handleResponse(axios.post('/proveedores', datos)),
  
  obtenerProveedor: (id) =>
    handleResponse(axios.get(`/proveedores/${id}`)),
  
  actualizarProveedor: (id, datos) =>
    handleResponse(axios.put(`/proveedores/${id}`, datos)),
  
  eliminarProveedor: (id) =>
    handleResponse(axios.delete(`/proveedores/${id}`)),

  // ==================== COMPRAS ====================
  getCompras: (filtros = {}) =>
    handleResponse(axios.get('/compras', { params: filtros })),

  crearCompra: (datos) =>
    handleResponse(axios.post('/compras', datos)),

  getCompra: (id) =>
    handleResponse(axios.get(`/compras/${id}`)),

  actualizarCompra: (id, datos) =>
    handleResponse(axios.put(`/compras/${id}`, datos)),

  eliminarCompra: (id) =>
    handleResponse(axios.delete(`/compras/${id}`)),

  registrarCompraPago: (datos) =>
    handleResponse(axios.post('/compra-pagos', datos)),

  // ==================== PAGOS DE COMPRAS ====================
  registrarPago: (datos) =>
    handleResponse(axios.post('/compra-pagos', datos)),
  
  registrarPagosMultiples: (datos) =>
    handleResponse(axios.post('/compras/registrar-pagos-multiples', datos)),

  getHistorialPagos: (filtros = {}) =>
    handleResponse(axios.get('/historial-pagos', { params: filtros })),

  // ==================== HISTORIAL DE PRECIOS ====================
  getHistorialPrecios: (productoId, fechaInicio = null, fechaFin = null) => {
    const params = {};
    if (fechaInicio) params.fecha_inicio = fechaInicio;
    if (fechaFin) params.fecha_fin = fechaFin;
    
    return handleResponse(axios.get(`/inventario/${productoId}/historial-precios`, { params }));
  },

  // ==================== REFERENCIAS Y OTROS ====================
  getFormasPago: () =>
    handleResponse(axios.get('/formas-pago')),

  crearFormaPago: (datos) =>
    handleResponse(axios.post('/formas-pago', datos)),

  actualizarFormaPago: (id, datos) =>
    handleResponse(axios.put(`/formas-pago/${id}`, datos)),

  eliminarFormaPago: (id) =>
    handleResponse(axios.delete(`/formas-pago/${id}`)),
  
  getProductosCompra: () =>
    handleResponse(axios.get('/productos-compra')),
  
  getFacturasPendientes: (proveedorId) =>
    handleResponse(axios.get(`/proveedores/${proveedorId}/facturas-pendientes`)),
  
  getComprasPorProveedor: (proveedorId) =>
    handleResponse(axios.get(`/proveedores/${proveedorId}/facturas-pendientes`)),

  // ==================== REPORTES ====================
  getReporteCompras: (filtros = {}) =>
    handleResponse(axios.get('/reportes/compras', { params: filtros })),

  getReporteInventario: (filtros = {}) => {
    const params = { ...filtros };
    if (params.bajo_stock !== undefined) {
        params.bajo_stock = params.bajo_stock ? 1 : 0;
    }
    return handleResponse(axios.get('/reportes/inventario', { params }));
  },

  getReporteProveedores: () =>
    handleResponse(axios.get('/reportes/proveedores')),

  // ==================== ESTADÍSTICAS ====================
  getEstadisticasInventario: () =>
    handleResponse(axios.get('/estadisticas/inventario')),

  getEstadisticasCompras: (filtros = {}) =>
    handleResponse(axios.get('/estadisticas/compras', { params: filtros })),

  // ==================== RECETAS DE PRODUCTO INVENTARIO ====================
  getRecetasProductoInventario: (filtros = {}) => {
    const params = { ...filtros };
    if (params.bajo_stock !== undefined) {
        params.bajo_stock = params.bajo_stock ? 1 : 0;
    }
    return handleResponse(axios.get('/recetas-producto-inventario', { params }));
  },

  crearRecetaProductoInventario: (datos) =>
    handleResponse(axios.post('/recetas-producto-inventario', datos)),

  obtenerRecetaProductoInventario: (id) =>
    handleResponse(axios.get(`/recetas-producto-inventario/${id}`)),

  actualizarRecetaProductoInventario: (id, datos) =>
    handleResponse(axios.put(`/recetas-producto-inventario/${id}`, datos)),

  eliminarRecetaProductoInventario: (id) =>
    handleResponse(axios.delete(`/recetas-producto-inventario/${id}`)),
};
