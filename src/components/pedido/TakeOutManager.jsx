import React, { useState, useEffect } from 'react';
import TomarPedidoManager from './TomarPedidoManager';
import { menuApi } from '../../api/menuApi';
import printerService  from '../../services/printerService';
import ModalPagoUniversal from '../pagos/ModalPagoUniversal';
import { 
  ArrowLeft, ShoppingBag, Edit3, Trash2, DollarSign, Timer, Plus, AlertCircle, Printer, Hash
} from 'lucide-react';

export default function TakeOutManager({ usuario, onVolver }) {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // RASTREO DE IMPRESIONES (SESIÓN)
  const [idsImpresos, setIdsImpresos] = useState(new Set());

  const [showTomarPedido, setShowTomarPedido] = useState(false);
  const [pedidoAEditar, setPedidoAEditar] = useState(null);
  
  const [showEliminarPedidoModal, setShowEliminarPedidoModal] = useState(false);
  const [pedidoAEliminar, setPedidoAEliminar] = useState(null);
  
  const [showModalPagar, setShowModalPagar] = useState(false);
  const [pedidoParaPagar, setPedidoParaPagar] = useState(null);

  useEffect(() => {
    cargarPedidos();
  }, []);

  const cargarPedidos = async () => {
    setLoading(true); setError('');
    try {
      const params = { tipo_pedido: 'takeout', estados: ['pendiente', 'en_preparacion', 'listo'] };
      const res = await menuApi.getPedidos(params);
      let data = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      
      // Ordenar descendente (más nuevo arriba)
      data.sort((a, b) => b.id - a.id);
      
      setPedidos(data);
    } catch (err) {
      console.error('❌ Error al cargar pedidos:', err);
      setError(err.message || 'Error al cargar los pedidos.');
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirTomaPedido = (pedido = null) => {
    setPedidoAEditar(pedido);
    setShowTomarPedido(true);
  };

  const handlePedidoCreado = () => {
    cargarPedidos();
    setShowTomarPedido(false);
  };

  const handleEliminarPedido = (pedido) => {
    // Verificar permisos si es necesario
    setPedidoAEliminar(pedido);
    setShowEliminarPedidoModal(true);
  };

  const confirmEliminarPedido = async () => {
      try {
          await menuApi.eliminarPedido(pedidoAEliminar.id);
          setPedidos(prev => prev.filter(p => p.id !== pedidoAEliminar.id));
          setShowEliminarPedidoModal(false);
          alert("✅ Pedido eliminado.");
      } catch (e) {
          alert("Error al eliminar.");
      }
  };

  // --- NUEVAS ACCIONES DE IMPRESIÓN Y PAGO ---

  const handleImprimirCuenta = (pedido) => {
    printerService.imprimirTicket(pedido);
    setIdsImpresos(prev => new Set(prev).add(pedido.id));
  };

  const handlePrepararPago = (pedido) => {
    if (!idsImpresos.has(pedido.id)) {
        const deseaImprimir = window.confirm(
            `⚠️ Ticket no impreso. ¿Imprimir antes de cobrar?`
        );

        if (deseaImprimir) {
            handleImprimirCuenta(pedido);
            setTimeout(() => {
                setPedidoParaPagar(pedido);
                setShowModalPagar(true);
            }, 500);
            return;
        }
    }
    setPedidoParaPagar(pedido);
    setShowModalPagar(true);
  };

const handlePagarPedido = async (datosPago) => {
    setLoading(true);
    try {
      await menuApi.pagarPedido(pedidoParaPagar.id, datosPago);
      
      // ✅ LECTURA CONFIGURACIÓN
      const imprimirFinal = localStorage.getItem('config_imprimir_final') === 'true';

      if (imprimirFinal) {
          if (window.confirm("✅ Pago exitoso. ¿Imprimir comprobante final?")) {
              printerService.imprimirTicket({ ...pedidoParaPagar, estado: 'pagado' });
          }
      }

      setPedidos(prev => prev.filter(p => p.id !== pedidoParaPagar.id));
      setShowModalPagar(false);
      setPedidoParaPagar(null);
    } catch (error) { 
        console.error(error);
        alert('Error al procesar el pago: ' + (error.message || 'Error desconocido')); 
    } finally { 
      setLoading(false); 
    }
  };
  const calcularTiempoTranscurrido = (fechaStr) => {
    if (!fechaStr) return '-';
    const diffMin = Math.floor((Date.now() - new Date(fechaStr).getTime()) / 60000);
    return `${diffMin}m`; 
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-slate-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <button onClick={onVolver} className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all duration-200 font-medium group">
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span>Volver</span>
              </button>
              <div className="h-8 w-px bg-gray-200" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Para Llevar</h1>
                  <p className="text-sm text-gray-500">Pedidos sin entrega a domicilio</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleAbrirTomaPedido()}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-700 text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" /> Nuevo Pedido
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" /> Pedidos Activos
            </h2>
          </div>
          <div className="p-6">
            {loading ? (
                <div className="text-center py-8 text-gray-500">Cargando...</div>
            ) : pedidos.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No hay pedidos pendientes.</div>
            ) : (
                <div className="space-y-4">
                    {pedidos.map(p => (
                    <div key={p.id} className="flex flex-col md:flex-row justify-between items-center p-4 bg-white border rounded-xl hover:shadow-md transition-shadow">
                        <div className="flex-1 mb-2 md:mb-0">
                            <div className="flex items-center gap-3">
                                {/* ✅ CÓDIGO VISUAL (L-X) */}
                                {p.codigo_visual ? (
                                    <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg font-black text-xl border border-purple-200 flex items-center gap-1 shadow-sm">
                                        <Hash size={18} className="opacity-50"/> {p.codigo_visual}
                                    </div>
                                ) : (
                                    <span className="text-lg font-bold text-gray-800">Pedido #{p.id}</span>
                                )}

                                <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded border">
                                    {calcularTiempoTranscurrido(p.fecha_hora)}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                                <span className="font-semibold">{p.cliente_datos?.nombre || p.cliente?.nombre || 'Cliente Ocasional'}</span>
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            {/* Estado Badge */}
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                { 
                                    pendiente: 'bg-gray-100 text-gray-600', 
                                    en_preparacion: 'bg-blue-100 text-blue-700', 
                                    listo: 'bg-amber-100 text-amber-700', 
                                    pagado: 'bg-emerald-100 text-emerald-700' 
                                }[p.estado] || 'bg-gray-100'
                            }`}>
                                {p.estado.replace('_', ' ')}
                            </span>

                            {/* Total */}
                            <span className="text-xl font-bold text-emerald-600 min-w-[100px] text-right">
                                ${Math.round(p.total).toLocaleString('es-CL')}
                            </span>

                            {/* Acciones */}
                            <div className="flex gap-2 border-l pl-4 ml-2">
                                <button onClick={() => handleAbrirTomaPedido(p)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors" title="Editar">
                                    <Edit3 className="w-5 h-5" />
                                </button>
                                
                                <button onClick={() => handleImprimirCuenta(p)} className="p-2 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors" title="Imprimir">
                                    <Printer className="w-5 h-5" />
                                </button>

                                {p.estado !== 'pagado' && (
                                    <button onClick={() => handlePrepararPago(p)} className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors font-bold" title="Pagar">
                                        <DollarSign className="w-5 h-5" />
                                    </button>
                                )}
                                
                                <button onClick={() => handleEliminarPedido(p)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title="Eliminar">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                    ))}
                </div>
            )}
          </div>
        </div>
      </div>

      {/* MODALES */}
      {showTomarPedido && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-full max-h-full overflow-hidden shadow-2xl flex flex-col">
            <TomarPedidoManager
              usuario={usuario}
              onVolver={() => setShowTomarPedido(false)}
              tipoPedido="takeout"
              onPedidoCreado={handlePedidoCreado}
              pedidoExistente={pedidoAEditar}
            />
          </div>
        </div>
      )}

      {showEliminarPedidoModal && pedidoAEliminar && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-lg mb-4 text-red-600 flex items-center gap-2">
                <AlertCircle /> Eliminar Pedido #{pedidoAEliminar.id}
            </h3>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowEliminarPedidoModal(false)} className="px-4 py-2 border rounded hover:bg-gray-50">Cancelar</button>
              <button onClick={confirmEliminarPedido} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {showModalPagar && pedidoParaPagar && (
        <ModalPagoUniversal
          pedido={pedidoParaPagar}
          onCerrar={() => { setShowModalPagar(false); setPedidoParaPagar(null); }}
          onPagoExitoso={handlePagarPedido}
        />
      )}
    </div>
  );
}
