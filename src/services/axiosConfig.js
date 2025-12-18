import axios from 'axios';

const API_URL = 'http://192.168.4.126/api';

console.log('🌐 Axios apuntando a:', API_URL);

const axiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: false, // ✅ CAMBIA A FALSE - no necesitas cookies con Bearer token
});

// Interceptor para el Token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor de errores
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("❌ Error Axios:", error.message);
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
