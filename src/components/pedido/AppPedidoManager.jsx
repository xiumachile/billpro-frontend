import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { menuApi } from '../../api/menuApi';
import printerService from '../../services/printerService'; // Asegúrate de importar esto
import TomarPedidoManager from './TomarPedidoManager';
import { 
  ArrowLeft, Smartphone, Hash, RefreshCw, Printer, CheckCircle, Edit, Clock 
} from 'lucide-react';

export default function AppPedidoManager({ usuario }) {
  const navigate = useNavigate();
  
  // --- ESTADOS ---
  const [apps, setApps] = useState([]);
  const [step, setStep] = useState(1); // 1: Dashboard, 2: Ingreso Código, 3: Tomar/Editar Pedido
  
  // Selección para Crear
  const [selectedApp, setSelectedApp] = useState(null);
  const [codigoExterno, setCodigoExterno] = useState('');
  
  // Datos para el Dashboard
  const [pedidosActivos, setPedidosActivos] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Estado para Edición
  const [pedidoParaEditar, setPedidoParaEditar] = useState(null);

  // --- EFECTOS ---

  // 1. Cargar Apps y Pedidos Iniciales
  useEffect(() => {
    cargarApps();
    cargarPedidos();

    // Polling: Refrescar pedidos cada 15 segundos
    const intervalo = setInterval(cargarPedidos, 15000);
    return () => clearInterval(intervalo);
  }, []);

  const cargarApps = async () => {
    try {
        const res = await menuApi.getAppsDelivery();
        const data = Array.isArray(res) ? res : (res.data || []);
        setApps(data.filter(app => app.activa !== false)); 
    } catch (error) {
        console.error("Error cargando apps:", error);
    }
  };

  const cargarPedidos = async () => {
    try {
        // Solicitamos solo pedidos tipo 'app' que no estén finalizados
        const res = await menuApi.getPedidos({ 
            tipo_pedido: 'app', 
            estados: ['pendiente', 'en_preparacion', 'listo', 'entregando'] 
        });
        const data = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
        setPedidosActivos(data);
    } catch (error) {
        console.error("Error cargando pedidos:", error);
    }
  };

  // --- ACCIONES DE CREACIÓN ---

  const handleSelectApp = (app) => {
      setSelectedApp(app);
      setPedidoParaEditar(null); // Aseguramos que es nuevo
      setCodigoExterno('');
      setStep(2);
  };

  const handleConfirmarCodigo = (e) => {
      e.preventDefault();
      if (!codigoExterno.trim()) return alert("Ingrese el código del pedido");
      setStep(3);
  };

  const handlePedidoFinalizado = () => {
      alert("✅ Operación exitosa.");
      setStep(1);
      setCodigoExterno('');
      setSelectedApp(null);
      setPedidoParaEditar(null);
      cargarPedidos(); // Recargar lista
  };

  // --- ACCIONES DE GESTIÓN (LISTA) ---

  const handleEntregar = async (pedido) => {
      if (!window.confirm(`¿Marcar pedido ${pedido.codigo_visual} como ENTREGADO a repartidor?`)) return;
      
      setLoading(true);
      try {
          // Cambiamos estado a 'entregado' (finalizado para cocina) o 'pagado' si prefieres cerrar caja.
          // Al ser App, 'entregado' es lo lógico si el pago es externo.
          await menuApi.actualizarPedido(pedido.id, { estado: 'entregado' });
          
          // Opcional: Imprimir comprobante de entrega
          // printerService.imprimirTicket(pedido); 
          
          cargarPedidos();
      } catch (error) {
          alert("Error al entregar: " + error.message);
      } finally {
          setLoading(false);
      }
  };

  const handleImprimir = (pedido) => {
      if(window.confirm("¿Reimprimir comanda?")) {
          printerService.imprimirTicket(pedido);
      }
  };

  const handleEditar = (pedido) => {
      // 1. Busamos la app correspondiente
      const appDelPedido = apps.find(a => a.id === pedido.app_delivery_id);
      
      // 2. Preparamos estados
      setSelectedApp(appDelPedido || { nombre: 'App Desconocida', id: null, color: '#999' });
      setCodigoExterno(pedido.codigo_visual);
      setPedidoParaEditar(pedido);
      
      // 3. Vamos a la vista de edición
      setStep(3);
  };

  // --- RENDERIZADO ---

  // VISTA 3: TOMAR / EDITAR PEDIDO
  if (step === 3) {
      return (
          <TomarPedidoManager
              usuario={usuario}
              onVolver={() => {
                  setStep(1);
                  setPedidoParaEditar(null);
              }}
              tipoPedido="app" 
              
              // Datos para Nuevo Pedido
              cartaIdOverride={selectedApp?.carta_id}
              appDeliveryId={selectedApp?.id} 
              codigoVisual={codigoExterno}   
              
              // Datos para Edición
              pedidoExistente={pedidoParaEditar}

              onPedidoCreado={handlePedidoFinalizado}
              
              // Cliente Visual
              clienteInicial={{ 
                  nombre: selectedApp?.nombre || 'App', 
                  apellido: codigoExterno,
                  direccion: 'Pedido Externo - App'
              }}
          />
      );
  }

  // VISTA 2: INGRESAR CÓDIGO (Solo para nuevos)
  if (step === 2) {
      return (
        <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center justify-center">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
                <div className="flex justify-start mb-4">
                    <button onClick={() => setStep(1)}><ArrowLeft className="text-gray-500"/></button>
                </div>
                <div 
                    className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white shadow-md"
                    style={{ backgroundColor: selectedApp.color || '#333' }}
                >
                    <Smartphone size={32}/>
                </div>
                <h2 className="text-2xl font-black mb-2 text-gray-800">Pedido {selectedApp.nombre}</h2>
                <p className="text-sm text-gray-500 mb-8">Ingrese el código externo</p>
                
                <form onSubmit={handleConfirmarCodigo}>
                    <div className="relative mb-8">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24}/>
                        <input 
                            autoFocus
                            className="w-full pl-14 pr-4 py-4 text-3xl font-black text-center border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none uppercase"
                            placeholder="Ej: 883A"
                            value={codigoExterno}
                            onChange={e => setCodigoExterno(e.target.value.toUpperCase())}
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={!codigoExterno.trim()}
                        className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg transition-all"
                    >
                        CONTINUAR
                    </button>
                </form>
            </div>
        </div>
      );
  }

  // VISTA 1: DASHBOARD (SELECCIÓN APP + LISTA PEDIDOS)
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6 flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/')} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"><ArrowLeft/></button>
                <h1 className="text-xl md:text-2xl font-black text-gray-800">Gestión de Apps</h1>
            </div>
            <button onClick={cargarPedidos} className="flex items-center gap-2 text-blue-600 font-bold bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100">
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''}/> Actualizar
            </button>
        </div>

        {/* SECCIÓN 1: NUEVO PEDIDO (APPS) */}
        <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 ml-1">Nuevo Pedido</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {apps.map(app => (
                    <button 
                        key={app.id}
                        onClick={() => handleSelectApp(app)}
                        className="h-32 rounded-2xl shadow-sm bg-white border border-gray-200 flex flex-col items-center justify-center gap-2 hover:shadow-md hover:scale-[1.02] transition-all active:scale-95 group"
                    >
                        <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform"
                            style={{ backgroundColor: app.color || '#333' }}
                        >
                            <Smartphone size={24}/>
                        </div>
                        <span className="font-bold text-gray-700">{app.nombre}</span>
                    </button>
                ))}
                {apps.length === 0 && <p className="text-gray-400 text-sm italic col-span-full">No hay apps configuradas.</p>}
            </div>
        </div>

        {/* SECCIÓN 2: PEDIDOS ACTIVOS (LISTA) */}
        <div className="flex-1 flex flex-col min-h-0">
            <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 ml-1 flex items-center gap-2">
                Pedidos en Curso <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">{pedidosActivos.length}</span>
            </h3>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Hora</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">App / Código</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Items</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Estado</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Total</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pedidosActivos.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-400 italic">No hay pedidos activos de aplicaciones.</td>
                                </tr>
                            ) : (
                                pedidosActivos.map(pedido => {
                                    const app = apps.find(a => a.id === pedido.app_delivery_id);
                                    const fecha = new Date(pedido.created_at);
                                    const hora = fecha.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                                    
                                    return (
                                        <tr key={pedido.id} className="hover:bg-blue-50 transition-colors">
                                            <td className="p-4 text-sm font-medium text-gray-600 flex items-center gap-2">
                                                <Clock size={14}/> {hora}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span 
                                                        className="w-3 h-3 rounded-full" 
                                                        style={{ backgroundColor: app?.color || '#ccc' }} 
                                                        title={app?.nombre}
                                                    ></span>
                                                    <div>
                                                        <p className="font-bold text-gray-800">{app?.nombre || 'App'}</p>
                                                        <p className="text-xs font-black text-blue-600 bg-blue-50 px-1.5 rounded inline-block">
                                                            {pedido.codigo_visual || `ID:${pedido.id}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-gray-600">
                                                {pedido.items?.length || 0} prod. + {pedido.combos?.length || 0} combos
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                                    pedido.estado === 'listo' ? 'bg-green-100 text-green-700' :
                                                    pedido.estado === 'en_preparacion' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {pedido.estado.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right font-mono font-bold text-gray-800">
                                                ${Math.round(pedido.total).toLocaleString('es-CL')}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button 
                                                        onClick={() => handleImprimir(pedido)}
                                                        className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-lg tooltip"
                                                        title="Reimprimir Ticket"
                                                    >
                                                        <Printer size={18}/>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleEditar(pedido)}
                                                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                                                        title="Modificar Pedido"
                                                    >
                                                        <Edit size={18}/>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleEntregar(pedido)}
                                                        className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 font-bold text-xs shadow-sm active:scale-95 transition-all"
                                                    >
                                                        <CheckCircle size={14}/> ENTREGAR
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {loading && (
            <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
                <div className="bg-white p-4 rounded-full shadow-lg">
                    <RefreshCw className="animate-spin text-blue-600" size={32}/>
                </div>
            </div>
        )}
    </div>
  );
}
