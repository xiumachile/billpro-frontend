import axios from 'axios';

const axiosInstance = axios.create({
    timeout: 60000, 
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    // CAMBIO 1: True para permitir cookies/sesiones de Laravel (Sanctum)
    // Si usas tokens puros y te da error de CORS/CSRF, solo entonces vuélvelo a false.
    withCredentials: true, 
});

// --- INTERCEPTOR REQUEST (Salida) ---
axiosInstance.interceptors.request.use(
    (config) => {
        // 1. Buscar configuración manual (Prioridad para Escritorio/Tauri)
        // Esto permite que si el usuario quiere conectar a otra IP local, pueda hacerlo.
        let host = localStorage.getItem('network_host');

        // 2. Si no hay manual, usar variable de entorno O EL DOMINIO FIJO
        if (!host) {
            // CAMBIO 2: Agregamos el "OR" (||) con tu dominio real.
            // Esto garantiza que el .exe funcione aunque el .env falle al compilar.
            host = import.meta.env.VITE_API_URL || 'https://clicktools.cl';
        }

        // 3. Si sigue sin haber host (Imposible ahora con el fix de arriba), cancelamos
        if (!host) {
            const controller = new AbortController();
            config.signal = controller.signal;
            controller.abort("NO_NETWORK_CONFIG");
            console.error("⛔ Petición bloqueada: No hay IP ni URL de API configurada.");
            return config;
        }

        // 4. Limpieza inteligente de la URL
        let cleanHost = host.replace(/\/$/, ""); 

        if (cleanHost.endsWith('/api')) {
            config.baseURL = cleanHost;
        } else {
            config.baseURL = `${cleanHost}/api`;
        }

        // 5. Inyectar Token
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

        if (!error.response) {
            // CAMBIO 3: Log más descriptivo para depurar en Tauri
            console.warn(`⚠️ Error de Red hacia: ${error.config?.baseURL || 'Desconocido'}`);
            return Promise.reject(error);
        }

        if (error.response.status === 401) {
            if (!error.config.url.includes('/auth/validar-admin')) {
                console.warn("🔒 Token expirado (401). Cerrando sesión...");
                
                if (window.location.pathname !== '/login') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('usuarioInfo');
                    window.location.href = '/login';
                }
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
