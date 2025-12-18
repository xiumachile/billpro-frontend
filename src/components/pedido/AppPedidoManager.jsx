import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { menuApi } from '../../api/menuApi'; // ✅ Usamos menuApi
import TomarPedidoManager from './TomarPedidoManager';
import { ArrowLeft, Smartphone, Hash } from 'lucide-react';

export default function AppPedidoManager({ usuario }) {
  const navigate = useNavigate();
  
  // Estados
  const [apps, setApps] = useState([]);
  const [step, setStep] = useState(1); // 1: Selección App, 2: Código, 3: Tomar Pedido
  const [selectedApp, setSelectedApp] = useState(null);
  const [codigoExterno, setCodigoExterno] = useState('');
  const [loading, setLoading] = useState(false);

  // Cargar Apps al inicio
  useEffect(() => {
    const cargarApps = async () => {
        try {
            const res = await menuApi.getAppsDelivery();
            // Asegurar que sea array
            const data = Array.isArray(res) ? res : (res.data || []);
            // Filtrar solo activas
            setApps(data.filter(app => app.activa !== false)); 
        } catch (error) {
            console.error("Error cargando apps:", error);
        }
    };
    cargarApps();
  }, []);

  const handleSelectApp = (app) => {
      setSelectedApp(app);
      setStep(2);
  };

  const handleConfirmarCodigo = (e) => {
      e.preventDefault();
      if (!codigoExterno.trim()) return alert("Ingrese el código del pedido");
      setStep(3);
  };

  // Callback al terminar el pedido en TomarPedidoManager
  const handlePedidoFinalizado = async (pedidoGuardado) => {
      setLoading(true);
      try {
          // Actualización Post-Guardado para vincular la App y el Código Externo
          // El pedido se creó como 'delivery' o 'takeout', ahora lo marcamos como 'app'
          // o mantenemos el tipo pero agregamos la referencia de la app.
          
          await menuApi.actualizarPedido(pedidoGuardado.id, {
              // Opcional: Puedes cambiar el tipo a 'app' si tu backend lo soporta en enum
              // o dejarlo como 'delivery' y solo guardar el ID de la app.
              // tipo_pedido: 'delivery', 
              
              app_delivery_id: selectedApp.id, // ID de Uber/Rappi en tu BD
              codigo_visual: codigoExterno     // Reemplazamos la secuencia interna por el código de Uber (ej: #883A)
          });

          alert("✅ Pedido de APP registrado correctamente.");
          
          // Reiniciar flujo
          setStep(1);
          setCodigoExterno('');
          setSelectedApp(null);
      } catch (e) {
          console.error(e);
          alert("Pedido guardado, pero hubo un error al vincular los datos de la App.");
      } finally {
          setLoading(false);
      }
  };

  // VISTA 3: TOMAR PEDIDO (Usando la carta específica de la App)
  if (step === 3) {
      return (
          <TomarPedidoManager
              usuario={usuario}
              onVolver={() => setStep(2)}
              tipoPedido="delivery" // Usamos delivery para que pida cliente si es necesario
              cartaIdOverride={selectedApp.carta_id} // 🔥 Cargamos la carta específica de la APP (Precios App)
              onPedidoCreado={handlePedidoFinalizado}
              // Pasamos el nombre de la App y Código como nombre de cliente temporal
              clienteInicial={{ 
                  nombre: `${selectedApp.nombre}`, 
                  apellido: codigoExterno,
                  direccion: 'Pedido Externo - App' 
              }}
          />
      );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col">
        
        {/* Header */}
        <div className="max-w-4xl mx-auto w-full mb-8 flex items-center gap-4">
            <button 
                onClick={() => step === 1 ? navigate('/') : setStep(1)} 
                className="p-3 bg-white rounded-full shadow hover:bg-gray-200 transition-colors"
            >
                <ArrowLeft className="text-gray-700"/>
            </button>
            <h1 className="text-2xl font-bold text-gray-800">
                {step === 1 ? 'Seleccionar Aplicación' : `Pedido ${selectedApp?.nombre}`}
            </h1>
        </div>

        {/* VISTA 1: SELECCIONAR APP */}
        {step === 1 && (
            <div className="max-w-4xl mx-auto w-full grid grid-cols-2 md:grid-cols-3 gap-6">
                {apps.map(app => (
                    <button 
                        key={app.id}
                        onClick={() => handleSelectApp(app)}
                        className="h-40 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-3 text-white transition-all hover:scale-105 active:scale-95 border-4 border-transparent hover:border-white/20"
                        style={{ backgroundColor: app.color || '#333' }}
                    >
                        <Smartphone size={48} strokeWidth={1.5}/>
                        <span className="text-2xl font-black tracking-wide">{app.nombre}</span>
                    </button>
                ))}
                
                {apps.length === 0 && (
                    <div className="col-span-full text-center py-10 text-gray-500 bg-white rounded-xl shadow-sm">
                        <p className="mb-2">No hay aplicaciones configuradas.</p>
                        <button onClick={() => navigate('/parametros/apps')} className="text-blue-600 font-bold hover:underline">
                            Ir a Configuración
                        </button>
                    </div>
                )}
            </div>
        )}

        {/* VISTA 2: INGRESAR CÓDIGO */}
        {step === 2 && (
            <div className="max-w-md mx-auto w-full bg-white p-8 rounded-2xl shadow-xl text-center animate-in fade-in zoom-in-95 duration-200">
                <div 
                    className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white shadow-md"
                    style={{ backgroundColor: selectedApp.color || '#333' }}
                >
                    <Smartphone size={32}/>
                </div>
                
                <h2 className="text-2xl font-black mb-2 text-gray-800">
                    Pedido {selectedApp.nombre}
                </h2>
                <p className="text-sm text-gray-500 mb-8 font-medium">
                    Ingrese el código o número de orden externo
                </p>
                
                <form onSubmit={handleConfirmarCodigo}>
                    <div className="relative mb-8">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24}/>
                        <input 
                            autoFocus
                            className="w-full pl-14 pr-4 py-4 text-3xl font-black text-center border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none uppercase transition-all"
                            placeholder="Ej: 883A"
                            value={codigoExterno}
                            onChange={e => setCodigoExterno(e.target.value.toUpperCase())}
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={!codigoExterno.trim()}
                        className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg disabled:bg-gray-300 disabled:shadow-none transition-all active:scale-95"
                    >
                        CONTINUAR
                    </button>
                </form>
            </div>
        )}

        {loading && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000]">
                <div className="bg-white p-6 rounded-xl shadow-xl flex items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="font-bold text-gray-700">Procesando...</span>
                </div>
            </div>
        )}

    </div>
  );
}
