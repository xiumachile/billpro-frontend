// src/services/cajaService.js
import axios from '@/api/axiosInstance';

const cajaService = {
    // 1. Obtener lista de cajas físicas (Para configuración y apertura)
    getCajasFisicas: async () => {
        const response = await axios.get('/cajas');
        return response.data;
    },

    // 2. Verificar si el usuario actual tiene caja abierta
    getEstadoUsuario: async () => {
        const response = await axios.get('/caja/estado');
        return response.data;
    },

    // 3. Obtener TODAS las sesiones activas (Para que Admin seleccione en Pagos)
    getSesionesActivas: async () => {
        const response = await axios.get('/cajas/activas'); 
        return response.data;
    },

    // 4. Abrir caja
    abrirCaja: async (datos) => {
        const response = await axios.post('/caja/abrir', datos);
        return response.data;
    },

    // 5. Registrar movimiento manual (Ingreso/Egreso)
    registrarMovimiento: async (datos) => {
        const response = await axios.post('/caja/movimiento', datos);
        return response.data;
    },

    // 6. Obtener cálculos antes de cerrar (Pre-cierre)
    getPreCierre: async () => {
        const response = await axios.get('/caja/precierre');
        return response.data;
    },

    // 7. Cerrar caja
    cerrarCaja: async (datos) => {
        const response = await axios.post('/caja/cerrar', datos);
        return response.data;
    },

    // 8. Historial y Reportes
    getHistorialCierres: async () => {
        const response = await axios.get('/caja/historial');
        return response.data;
    },

    getReporteCierre: async (id) => {
        const response = await axios.get(`/caja/reporte/${id}`);
        return response.data;
    },

    // 9. Propinas (Esencial para el Modal de Propinas)
    getPropinasAcumuladas: async () => {
        const response = await axios.get('/caja/propinas');
        return response.data;
    },

    // --- ADMINISTRACIÓN DE CAJAS (CRUD) ---
    crearCaja: async (nombre) => {
        const response = await axios.post('/cajas', { nombre });
        return response.data;
    },

    actualizarCaja: async (id, nombre) => {
        const response = await axios.put(`/cajas/${id}`, { nombre });
        return response.data;
    },

    eliminarCaja: async (id) => {
        const response = await axios.delete(`/cajas/${id}`);
        return response.data;
    }
};

export default cajaService;
