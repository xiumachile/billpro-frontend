import React, { createContext, useContext, useState, useEffect } from 'react';

const NetworkContext = createContext();

export const useNetwork = () => useContext(NetworkContext);

export const NetworkProvider = ({ children }) => {
  const [networkHost, setNetworkHost] = useState(localStorage.getItem('network_host') || '');
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Helper para limpiar la URL (quitar /api final si existe para hacer el ping correctamente)
  // Porque la función checkConnection le agrega /api/ping manualmente
  const cleanUrlForPing = (url) => {
      let clean = url.trim().replace(/\/$/, ""); // Quitar slash final
      // Si la URL termina en /api, se lo quitamos temporalmente para el ping
      // para evitar que quede http://host/api/api/ping
      if (clean.endsWith('/api')) {
          clean = clean.substring(0, clean.length - 4);
      }
      return clean;
  };

  const checkConnection = async (hostUrl) => {
    try {
      // Normalizamos la URL base para el ping
      const baseUrl = cleanUrlForPing(hostUrl);
      console.log(`📡 Probando conexión con: ${baseUrl}/api/ping`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seg timeout

      const response = await fetch(`${baseUrl}/api/ping`, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      // Si responde cualquier cosa válida (incluso errores http del backend), hay conexión
      if (response.ok || response.status === 401 || response.status === 404 || response.status === 405) {
        console.log("✅ Conexión establecida con éxito (Status: " + response.status + ")");
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("❌ Error de conexión:", error);
      return false;
    }
  };

  const saveNetworkConfig = async (inputHost) => {
    setIsChecking(true);
    let formattedHost = inputHost.trim().replace(/\/$/, "");
    
    // Normalizar protocolo
    if (!/^https?:\/\//i.test(formattedHost)) {
      // Si parece un dominio (tiene letras y puntos), usar HTTPS, si no HTTP
      const esDominio = /[a-zA-Z]/.test(formattedHost) && !/^\d{1,3}\./.test(formattedHost);
      formattedHost = `${esDominio ? 'https' : 'http'}://${formattedHost}`;
    }

    const success = await checkConnection(formattedHost);

    if (success) {
      // Guardamos la URL base. Si es PWA vendrá con /api, si es manual quizás no.
      // AxiosInstance se encarga de formatear después.
      localStorage.setItem('network_host', formattedHost);
      setNetworkHost(formattedHost);
      setIsConnected(true);
      setShowModal(false);
      
      // Recargar solo si es necesario (en PWA a veces no es ideal, pero asegura limpieza)
      window.location.reload(); 
    } else {
      setIsChecking(false);
      // No lanzamos error, solo mostramos alerta para que el usuario intente de nuevo
      alert("No se pudo conectar con el servidor. Verifique la IP/Dominio.");
    }
  };

useEffect(() => {
    const init = async () => {
      let hostToTest = localStorage.getItem('network_host');
      
      // URL CORRECTA QUE QUEREMOS FORZAR
      const CORRECT_URL = import.meta.env.VITE_API_URL || "https://clicktools.cl/api";
      const OLD_BAD_URL = "api.clicktools.cl";

      let isAutoConfig = false;

      // CORRECCIÓN: Si no hay host guardado O si el guardado es el malo, usamos el correcto.
      if (!hostToTest || hostToTest.includes(OLD_BAD_URL)) {
          console.log("🌍 Configuración automática o corrección aplicada:", CORRECT_URL);
          hostToTest = CORRECT_URL;
          isAutoConfig = true;
          // Forzamos la limpieza inmediata del valor malo
          localStorage.removeItem('network_host'); 
      }

      if (hostToTest) {
        const success = await checkConnection(hostToTest);
        if (success) {
          // Si conectó, guardamos la URL buena para siempre
          if (isAutoConfig) {
              localStorage.setItem('network_host', hostToTest);
          }
          setNetworkHost(hostToTest);
          setIsConnected(true);
          setShowModal(false);
        } else {
          console.warn("⚠️ La URL configurada no responde.");
          setShowModal(true);
        }
      } else {
        setShowModal(true);
      }
      
      setIsChecking(false);
    };

    init();
  }, []);

  // Componente Modal de Configuración IP
  const ConfigModal = () => (
      <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl">
              <h2 className="text-2xl font-black text-gray-800 mb-2">Conexión al Servidor</h2>
              <p className="text-sm text-gray-500 mb-6">Ingrese la dirección IP o Dominio del sistema POS.</p>
              
              <form onSubmit={(e) => {
                  e.preventDefault();
                  saveNetworkConfig(e.target.ip.value);
              }}>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Host / IP</label>
                  <input 
                    name="ip" 
                    className="border-2 border-gray-300 p-4 w-full rounded-xl mb-6 text-lg outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all" 
                    placeholder="Ej: 192.168.1.50 o app.midominio.com" 
                    autoFocus 
                    defaultValue={networkHost}
                  />
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-bold text-lg shadow-lg transition-transform active:scale-95">
                      {isChecking ? 'Verificando...' : 'CONECTAR'}
                  </button>
              </form>
          </div>
      </div>
  );

  return (
    <NetworkContext.Provider value={{ isConnected, isChecking, showModal, saveNetworkConfig, networkHost }}>
      {children}
      {showModal && <ConfigModal />}
    </NetworkContext.Provider>
  );
};
