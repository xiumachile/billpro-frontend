import axios from 'axios';

const axiosInstance = axios.create({
    timeout: 60000, 
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: false,
});

// --- INTERCEPTOR REQUEST (Salida) ---
axiosInstance.interceptors.request.use(
    (config) => {
        // 1. Buscar configuración manual (Prioridad para Escritorio/Tauri)
        let host = localStorage.getItem('network_host');

        // 2. Si no hay manual, usar variable de entorno (Prioridad para Web/PWA)
        if (!host) {
            host = import.meta.env.VITE_API_URL;
        }

        // 3. Si sigue sin haber host, cancelamos
        if (!host) {
            const controller = new AbortController();
            config.signal = controller.signal;
            controller.abort("NO_NETWORK_CONFIG");
            console.error("⛔ Petición bloqueada: No hay IP ni URL de API configurada.");
            return config;
        }

        // 4. Limpieza inteligente de la URL
        let cleanHost = host.replace(/\/$/, ""); // Quitar slash final si existe

        // Si la URL ya termina en '/api' (común en VITE_API_URL), no lo agregamos de nuevo
        if (cleanHost.endsWith('/api')) {
            config.baseURL = cleanHost;
        } else {
            // Si es solo la IP o dominio raíz, le pegamos el /api
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
        // Ignorar cancelaciones propias
        if (error.message === "NO_NETWORK_CONFIG") return Promise.reject(error);

        // Error de red
        if (!error.response) {
            console.warn("⚠️ Alerta: Error de conexión / Red inestable.");
            return Promise.reject(error);
        }

        // Error 401 (Token vencido)
        if (error.response.status === 401) {
            // Evitamos cerrar sesión si es solo una validación de PIN de admin
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
