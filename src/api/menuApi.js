import axios from './axiosInstance'; // Importamos la instancia configurada

// =============================================================================
// HELPERS DE COMPATIBILIDAD
// =============================================================================

export const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const handleResponse = async (promise) => {
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
        if (error.message === "NO_NETWORK_CONFIG") {
            throw new Error("No hay configuración de red. Reinicie la aplicación.");
        }
        throw error;
    }
};

// =============================================================================
// OBJETO PRINCIPAL menuApi
// =============================================================================

export const menuApi = {
    // === CARTAS Y PANTALLAS ===
    getCartas: () => handleResponse(axios.get('/cartas')),
    crearCarta: (datos) => handleResponse(axios.post('/cartas', datos)),
    activarCarta: (id) => handleResponse(axios.post(`/cartas/${id}/activar`)),
    desactivarCarta: (id) => handleResponse(axios.post(`/cartas/${id}/desactivar`)),
    eliminarCarta: (id) => handleResponse(axios.delete(`/cartas/${id}`)),
    actualizarCarta: (id, datos) => handleResponse(axios.put(`/cartas/${id}`, datos)),

    getPantallasByCarta: (cartaId) => handleResponse(axios.get(`/pantallas?carta_id=${cartaId}`)),
    getBotonesByPantalla: (pantallaId) => handleResponse(axios.get(`/menu/pantallas/${pantallaId}/botones`)),
    crearPantalla: (datos) => handleResponse(axios.post('/pantallas', datos)),
    actualizarPantalla: (id, datos) => handleResponse(axios.put(`/pantallas/${id}`, datos)),
    eliminarPantalla: (id) => handleResponse(axios.delete(`/pantallas/${id}`)),
    
    updateBoton: (pantallaId, posicion, datos) => handleResponse(axios.put(`/menu/pantallas/${pantallaId}/botones/${posicion}`, datos)),
    updateBotones: (pantallaId, botones) => handleResponse(axios.put(`/menu/pantallas/${pantallaId}/botones`, { botones })),

    // === PRODUCTOS ===
    getCategorias: () => handleResponse(axios.get('/productos/categorias')),
    getProductos: () => handleResponse(axios.get('/productos')),
    getProductosCarta: () => handleResponse(axios.get('/productos')), // Alias para administración
    
    // ✅ NUEVO: Obtener productos con precio dinámico según la carta (Para el POS)
    getProductosPorCarta: (cartaId) => handleResponse(axios.get('/productos/por-carta', { params: { carta_id: cartaId } })),

    getTodosProductosParaRecetas: () => handleResponse(axios.get('/inventario/todos-para-recetas')),

    crearProductoCarta: (datos) => handleResponse(axios.post('/productos', datos)),
    actualizarProductoCarta: (id, datos) => handleResponse(axios.put(`/productos/${id}`, datos)),
    eliminarProductoCarta: (id) => handleResponse(axios.delete(`/productos/${id}`)),

    getFactoresConversion: () => handleResponse(axios.get('/factores-conversion')),
    getUnidadesMedida: () => handleResponse(axios.get('/productos/unidades-medida')),
    getSubcategorias: (categoria = null) => handleResponse(axios.get(`/productos/subcategorias${categoria ? `?categoria=${categoria}` : ''}`)),
    calcularCostoProducto: (id) => handleResponse(axios.get(`/productos/${id}/calcular-costo`)),

    // === INVENTARIO ===
    getProductosInventario: () => handleResponse(axios.get('/inventario')),
    getRecetasProductoInventario: () => handleResponse(axios.get('/recetas-producto-inventario')),

    // === COMBOS ===
    getCombos: () => handleResponse(axios.get('/combos')),
    getCombosPorCarta: (cartaId) => handleResponse(axios.get('/combos/por-carta', { params: { carta_id: cartaId } })),
    getComboItems: () => Promise.resolve([]),
    crearCombo: (datos) => handleResponse(axios.post('/combos', datos)),
    actualizarCombo: (id, datos) => handleResponse(axios.put(`/combos/${id}`, datos)),
    eliminarCombo: (id) => handleResponse(axios.delete(`/combos/${id}`)),

    // === MESAS ===
    getMesas: (params = {}) => handleResponse(axios.get('/mesas', { params })),
    getMesa: (id) => handleResponse(axios.get(`/mesas/${id}`)),
    crearMesa: (datos) => handleResponse(axios.post('/mesas', datos)),
    actualizarMesa: (id, datos) => handleResponse(axios.put(`/mesas/${id}`, datos)),
    eliminarMesa: (id) => handleResponse(axios.delete(`/mesas/${id}`)),
    
    // === PEDIDOS ===
    getPedidos: (params = {}) => handleResponse(axios.get('/pedidos', { params })),
    getPedidoById: (id) => handleResponse(axios.get(`/pedidos/${id}`)),
    
    crearPedido: (datos) => handleResponse(axios.post('/pedidos', datos)),
    actualizarPedido: (id, datos) => handleResponse(axios.put(`/pedidos/${id}`, datos)),
    eliminarPedido: (id) => handleResponse(axios.delete(`/pedidos/${id}`)),
    
    pagarPedido: (id, datos) => handleResponse(axios.post(`/pedidos/${id}/pagar`, datos)),
    asignarRepartidor: (id, repartidorId) => handleResponse(axios.post(`/pedidos/${id}/asignar-repartidor`, { repartidor_id: repartidorId })),
    obtenerVoucher: (id) => handleResponse(axios.get(`/pedidos/${id}/voucher`)),

    // === APPS DELIVERY ===
    getAppsDelivery: () => handleResponse(axios.get('/apps-delivery')),
    crearAppDelivery: (d) => handleResponse(axios.post('/apps-delivery', d)),
    updateAppDelivery: (id, d) => handleResponse(axios.put(`/apps-delivery/${id}`, d)),
    deleteAppDelivery: (id) => handleResponse(axios.delete(`/apps-delivery/${id}`)),

    // === TIPOS DE PRECIOS ===
    getTiposPrecios: () => handleResponse(axios.get('/tipos-precios')),
    crearTipoPrecio: (datos) => handleResponse(axios.post('/tipos-precios', datos)),
    eliminarTipoPrecio: (id) => handleResponse(axios.delete(`/tipos-precios/${id}`)),
 
    // === CLIENTES Y USUARIOS ===
    getClientes: (params) => handleResponse(axios.get('/clientes', { params })),
    crearCliente: (datos) => handleResponse(axios.post('/clientes', datos)),
    actualizarCliente: (id, datos) => handleResponse(axios.put(`/clientes/${id}`, datos)),
    eliminarCliente: (id) => handleResponse(axios.delete(`/clientes/${id}`)),
    
    getRoles: () => handleResponse(axios.get('/roles')),
    getUsuarios: (params = {}) => handleResponse(axios.get('/usuarios', { params })),
    crearUsuario: (datos) => handleResponse(axios.post('/usuarios', datos)),
    actualizarUsuario: (id, datos) => handleResponse(axios.put(`/usuarios/${id}`, datos)),
    eliminarUsuario: (id) => handleResponse(axios.delete(`/usuarios/${id}`)),
    
    // === REPORTES Y PARAMETROS ===
    getReporteVentas: (params) => handleResponse(axios.get('/reportes/ventas', { params })),
    getFormasPago: () => handleResponse(axios.get('/formas-pago')),
    
    getSecuencias: () => handleResponse(axios.get('/parametros/secuencias')),
    updateSecuencias: (datos) => handleResponse(axios.post('/parametros/secuencias', datos)),

    // === IMPRESORAS ===
    getImpresoras: () => handleResponse(axios.get('/impresoras')),
    crearImpresora: (datos) => handleResponse(axios.post('/impresoras', datos)),
    actualizarImpresora: (id, datos) => handleResponse(axios.put(`/impresoras/${id}`, datos)),
    eliminarImpresora: (id) => handleResponse(axios.delete(`/impresoras/${id}`)),
    probarImpresoraBackend: (id) => handleResponse(axios.post(`/impresoras/${id}/probar`)),
};
