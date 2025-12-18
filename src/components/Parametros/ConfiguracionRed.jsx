import React, { useState, useEffect } from 'react';
import { Save, Server, Wifi, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function ConfiguracionRed() {
  const [hostActual, setHostActual] = useState('');
  const [nuevoHost, setNuevoHost] = useState('');
  const [loading, setLoading] = useState(false);
  const [estadoPrueba, setEstadoPrueba] = useState('idle'); // idle, success, error
  const [mensajeError, setMensajeError] = useState('');

  useEffect(() => {
    // 1. Cargar la configuración actual del LocalStorage
    const storedHost = localStorage.getItem('network_host');
    if (storedHost) {
      setHostActual(storedHost);
      // Quitamos el protocolo para mostrarlo más limpio en el input, si se prefiere
      setNuevoHost(storedHost.replace(/^https?:\/\//, ''));
    }
  }, []);

  const probarConexion = async (e) => {
    e.preventDefault();
    setLoading(true);
    setEstadoPrueba('idle');
    setMensajeError('');

    // 1. Formatear la URL
    let urlAProbar = nuevoHost.trim();
    if (!/^https?:\/\//i.test(urlAProbar)) {
        urlAProbar = `http://${urlAProbar}`;
    }
    // Quitar slash final si existe
    urlAProbar = urlAProbar.replace(/\/$/, "");

    try {
      // 2. Intentar fetch al endpoint de ping
      // Usamos fetch nativo porque Axios está configurado con la IP vieja
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 segundos timeout

      console.log(`📡 Probando conexión a: ${urlAProbar}/api/ping`);

      const response = await fetch(`${urlAProbar}/api/ping`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // 3. Validar respuesta
      // Aceptamos 200 (OK), 401 (No autorizado - pero llegó), 404 (No encontrado - pero llegó)
      if (response.ok || response.status === 401 || response.status === 404) {
        setEstadoPrueba('success');
      } else {
        throw new Error(`El servidor respondió con estado: ${response.status}`);
      }

    } catch (error) {
      console.error('Error de conexión:', error);
      setEstadoPrueba('error');
      setMensajeError(error.name === 'AbortError' ? 'Tiempo de espera agotado (Timeout)' : error.message);
    } finally {
      setLoading(false);
    }
  };

  const guardarConfiguracion = () => {
    if (estadoPrueba !== 'success') return;

    // 1. Formatear final
    let urlFinal = nuevoHost.trim();
    if (!/^https?:\/\//i.test(urlFinal)) {
        urlFinal = `http://${urlFinal}`;
    }
    urlFinal = urlFinal.replace(/\/$/, "");

    // 2. Guardar en LocalStorage
    localStorage.setItem('network_host', urlFinal);

    // 3. Feedback y Recarga
    if (window.confirm('✅ Configuración guardada. La aplicación se reiniciará para aplicar los cambios.')) {
        window.location.reload();
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg">
              <Server className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Configuración de Red</h2>
              <p className="text-slate-400 text-sm">Conexión con el servidor backend (Laravel)</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Estado Actual */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Wifi className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-bold text-blue-800">Conexión Actual</h3>
              <p className="text-sm text-blue-600 font-mono mt-1 bg-white/50 px-2 py-1 rounded inline-block">
                {hostActual || 'No configurada'}
              </p>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={probarConexion} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Dirección IP o Dominio del Servidor
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={nuevoHost}
                  onChange={(e) => {
                    setNuevoHost(e.target.value);
                    setEstadoPrueba('idle'); // Resetear estado al escribir
                  }}
                  placeholder="Ej: 192.168.1.50:8000"
                  className="w-full pl-4 pr-12 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-0 outline-none font-mono text-gray-700 transition-colors"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">
                  IPv4 / DNS
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Ingrese la IP donde se ejecuta Laravel (puerto 8000 usualmente).
              </p>
            </div>

            {/* Mensajes de Estado */}
            {estadoPrueba === 'error' && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 text-sm">
                <XCircle className="w-5 h-5" />
                <span>Error: {mensajeError || 'No se pudo conectar.'}</span>
              </div>
            )}

            {estadoPrueba === 'success' && (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg border border-green-100 text-sm">
                <CheckCircle className="w-5 h-5" />
                <span>¡Conexión exitosa! El servidor responde correctamente.</span>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading || !nuevoHost}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Wifi className="w-5 h-5" />}
                {loading ? 'Probando...' : 'Probar Conexión'}
              </button>

              <button
                type="button"
                onClick={guardarConfiguracion}
                disabled={estadoPrueba !== 'success'}
                className={`flex-1 py-3 font-bold rounded-xl flex items-center justify-center gap-2 text-white transition-all shadow-md
                  ${estadoPrueba === 'success' 
                    ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:scale-95' 
                    : 'bg-gray-300 cursor-not-allowed'
                  }`}
              >
                <Save className="w-5 h-5" />
                Guardar y Reiniciar
              </button>
            </div>
          </form>

          {/* Advertencia */}
          <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>
              Cambiar esta configuración requiere reiniciar la aplicación. Asegúrese de que la nueva IP sea correcta y estática para evitar pérdidas de conexión futuras.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
