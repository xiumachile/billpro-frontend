import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../api/axiosInstance'; // Asegúrate que la ruta a axiosInstance sea correcta

const SessionManager = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const token = localStorage.getItem('token');
        
        // Si no hay token o estamos en login, no hacemos nada
        if (!token || location.pathname === '/login') return;

        // Función para enviar el "latido" (Heartbeat)
        const sendHeartbeat = async () => {
            try {
                // Llamamos a una ruta ligera. Si no creaste /api/ping, 
                // usa /api/user o /api/config/license que son ligeras.
                await axios.get('/ping'); 
            } catch (error) {
                // Si el servidor nos dice que sobran usuarios (Error 403 o 429)
                if (error.response?.status === 403 && error.response?.data?.error === 'PLAN_LIMIT_REACHED') {
                    alert("Su plan ha excedido el límite de usuarios conectados. Se cerrará la sesión en este terminal.");
                    
                    // Forzar Logout
                    localStorage.removeItem('token');
                    localStorage.removeItem('usuarioInfo');
                    navigate('/login');
                }
            }
        };

        // 1. Enviar latido inmediatamente al cargar
        sendHeartbeat();

        // 2. Configurar intervalo cada 60 segundos
        const intervalId = setInterval(sendHeartbeat, 60000);

        // Limpieza al desmontar
        return () => clearInterval(intervalId);
    }, [navigate, location.pathname]);

    // Manejar cierre de pestaña/ventana para liberar cupo rápido
    useEffect(() => {
        const handleTabClose = () => {
             const token = localStorage.getItem('token');
             if (token) {
                 // Usamos sendBeacon porque es más fiable al cerrar el navegador que axios
                 // Asegúrate de que la URL apunte a tu API
                 const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
                 const blob = new Blob([JSON.stringify({ logout: true })], { type: 'application/json' });
                 navigator.sendBeacon(`${apiUrl}/auth/logout_beacon?token=${token}`, blob);
             }
        };

        window.addEventListener('beforeunload', handleTabClose);
        return () => window.removeEventListener('beforeunload', handleTabClose);
    }, []);

    // Este componente no renderiza nada visual
    return null; 
};

export default SessionManager;
