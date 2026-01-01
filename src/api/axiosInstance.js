import axios from 'axios';

// 1. Configuración Base
const axiosInstance = axios.create({
  // Si no hay variable de entorno, usa localhost por defecto
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// --- INTERCEPTOR REQUEST (Salida) ---
axiosInstance.interceptors.request.use(
    (config) => {
        // A. Prioridad 1: Configuración manual guardada en el PC (útil para pruebas locales)
        let host = localStorage.getItem('network_host');

        // B. Prioridad 2: Variable de entorno (Web) o URL Fija (Escritorio/Respaldo)
        if (!host) {
            host = import.meta.env.VITE_API_URL || 'https://clicktools.cl';
        }

        // C. Validación final
        if (!host) {
            const controller = new AbortController();
            config.signal = controller.signal;
            controller.abort("NO_NETWORK_CONFIG");
            if (window.__TAURI__) alert("Error Crítico: No hay URL de API configurada.");
            return config;
        }

        // D. Limpieza y Formato de URL
        let cleanHost = host.replace(/\/$/, ""); 

        if (cleanHost.endsWith('/api')) {
            config.baseURL = cleanHost;
        } else {
            config.baseURL = `${cleanHost}/api`;
        }

        // ============================================================
        // ✅ NUEVO: INYECCIÓN DE TENANT (RESTAURANTE)
        // ============================================================
        // Leemos el ID seleccionado en el TenantSelector
        const tenantId = localStorage.getItem('tenant_id');
        
        if (tenantId) {
            // Enviamos la cabecera para que Laravel sepa qué BD usar
            config.headers['X-Tenant'] = tenantId; 
        }
        // ============================================================

        // E. Inyectar Token (si existe)
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => Promise.reject(error)
);

// --- INTERCEPTOR RESPONSE (Llegada) ---
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.message === "NO_NETWORK_CONFIG") return Promise.reject(error);

        // --- DIAGNÓSTICO PARA TAURI (Escritorio) ---
        if (!error.response && window.__TAURI__) {
             const urlIntentada = error.config?.baseURL || 'Desconocida';
             // Solo alertar si no es una cancelación intencional
             if (error.code !== "ERR_CANCELED") {
                 console.error(`⚠️ Error de conexión a: ${urlIntentada}`);
             }
        }

        // Error 401 (No autorizado / Token vencido)
        if (error.response && error.response.status === 401) {
            if (!error.config.url.includes('/auth/validar-admin')) {
                console.warn("🔒 Sesión expirada. Redirigiendo al login...");
                
                if (window.location.pathname !== '/login') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('usuarioInfo');
                    // Opcional: No borramos tenant_id para que no tenga que escribir el restaurante de nuevo
                    window.location.href = '/login';
                }
            }
        }

        // Error 404 en identificación de Tenant (Si borraron el restaurante)
        if (error.response && error.response.status === 404 && error.response.data?.message?.includes('Tenant')) {
            alert("El restaurante seleccionado no existe o no está disponible.");
            localStorage.removeItem('tenant_id');
            window.location.href = '/';
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
