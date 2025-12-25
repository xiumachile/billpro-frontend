import axios from 'axios';

// 1. Configuración Base
const axiosInstance = axios.create({
    timeout: 60000, // Esperar hasta 60 segundos antes de cancelar
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    // IMPORTANTE: True para que Laravel Sanctum acepte la cookie de sesión/CSRF
    withCredentials: true, 
});

// --- INTERCEPTOR REQUEST (Salida) ---
axiosInstance.interceptors.request.use(
    (config) => {
        // A. Prioridad 1: Configuración manual guardada en el PC (útil para pruebas locales)
        let host = localStorage.getItem('network_host');
        
        // B. Prioridad 2: Variable de entorno (Web) o URL Fija (Escritorio/Respaldo)
        // El "|| 'https://clicktools.cl'" es el SALVAVIDAS para que el .exe funcione 
        // aunque el .env falle en GitHub Actions.
        if (!host) {
            host = import.meta.env.VITE_API_URL || 'https://clicktools.cl';
        }
        
        // C. Validación final (Esto nunca debería pasar gracias al salvavidas)
        if (!host) {
            const controller = new AbortController();
            config.signal = controller.signal;
            controller.abort("NO_NETWORK_CONFIG");
            if (window.__TAURI__) alert("Error Crítico: No hay URL de API configurada.");
            return config;
        }
        
        // D. Limpieza y Formato de URL
        // Quitamos la barra final si existe para evitar dobles barras (//)
        let cleanHost = host.replace(/\/$/, ""); 
        
        // Aseguramos que termine en /api
        if (cleanHost.endsWith('/api')) {
            config.baseURL = cleanHost;
        } else {
            config.baseURL = `${cleanHost}/api`;
        }
        
        // E. Inyectar Token (si existe)
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        // 🐛 DEBUG: Log para ver qué URL se está usando
        console.log('🌐 Axios conectando a:', config.baseURL);
        
        return config;
    },
    (error) => Promise.reject(error)
);

// --- INTERCEPTOR RESPONSE (Llegada) ---
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // Ignorar cancelaciones manuales
        if (error.message === "NO_NETWORK_CONFIG") return Promise.reject(error);
        
        // --- DIAGNÓSTICO PARA TAURI (Escritorio) ---
        // Si hay un error de red y estamos en la App de Escritorio, mostramos alerta.
        // Esto te ayudará a ver por qué falla el .exe (CORS, 404, Network Error)
        if (!error.response && window.__TAURI__) {
            const urlIntentada = error.config?.baseURL || 'Desconocida';
            // ✅ CORREGIDO: Sintaxis del alert
            alert(`⚠️ ERROR DE CONEXIÓN:\n\nNo se pudo conectar con el servidor.\nIntentando conectar a:\n${urlIntentada}\n\nPosibles causas:\n1. El servidor está apagado.\n2. Problema de CORS.\n3. Tu internet no funciona.`);
        }
        
        // -------------------------------------------
        // Error 401 (No autorizado / Token vencido)
        if (error.response && error.response.status === 401) {
            // No cerrar sesión si es solo una validación de PIN administrativa
            if (!error.config.url.includes('/auth/validar-admin')) {
                console.warn("🔒 Sesión expirada. Redirigiendo al login...");
                
                // Evitar bucle infinito si ya estamos en login
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
