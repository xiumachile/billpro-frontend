import React, { useState, useEffect } from 'react';
import TomarPedidoManager from './TomarPedidoManager';
import { menuApi } from '../../api/menuApi';
import ModalPagoUniversal from '../pagos/ModalPagoUniversal';
import printerService  from '../../services/printerService';
import { 
  ArrowLeft, 
  Bike, 
  Package, 
  Edit3, 
  Trash2, 
  DollarSign, 
  AlertCircle,
  Timer,
  User,
  Search,
  Plus,
  Printer 
} from 'lucide-react';

export default function DeliveryManager({ 
  usuario, 
  onVolver 
}) {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [idsImpresos, setIdsImpresos] = useState(new Set()); 

  const [showTomarPedido, setShowTomarPedido] = useState(false);
  const [pedidoAEditar, setPedidoAEditar] = useState(null);
  const [clienteParaNuevoPedido, setClienteParaNuevoPedido] = useState(null);

  const [cartaActiva, setCartaActiva] = useState(null);
  const [repartidores, setRepartidores] = useState([]);
  const [cargandoRepartidores, setCargandoRepartidores] = useState(false);

  const [showEliminarPedidoModal, setShowEliminarPedidoModal] = useState(false);
  const [pedidoAEliminar, setPedidoAEliminar] = useState(null);

  const [showModalTelefono, setShowModalTelefono] = useState(false);
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [cargandoCliente, setCargandoCliente] = useState(false);

  const [showModalAsignarRepartidor, setShowModalAsignarRepartidor] = useState(false);
  const [pedidoParaAsignar, setPedidoParaAsignar] = useState(null);
  const [repartidorSeleccionado, setRepartidorSeleccionado] = useState('');

  const [showModalPagar, setShowModalPagar] = useState(false);
  const [pedidoParaPagar, setPedidoParaPagar] = useState(null);

  const [showModalCrearCliente, setShowModalCrearCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '', apellido: '', movil: '', direccion: '', comuna: '', referencia_direccion: ''
  });

  useEffect(() => {
    cargarDatosIniciales();
    cargarRepartidores();
  }, []);

  const cargarDatosIniciales = async () => {
    setLoading(true);
    try {
      const params = {
        tipo_pedido: 'delivery',
        estados: ['pendiente', 'en_preparacion', 'listo', 'entregando', 'en_camino']
      };
      
      const pedidosRes = await menuApi.getPedidos(params);
      
      // ✅ VALIDACIÓN SEGURA
      let pedidosData = [];
      if (pedidosRes && Array.isArray(pedidosRes.data)) {
          pedidosData = pedidosRes.data;
      } else if (Array.isArray(pedidosRes)) {
          pedidosData = pedidosRes;
      }
      
      // Ordenar: Los más recientes primero
      pedidosData.sort((a, b) => b.id - a.id);
      
      setPedidos(pedidosData);

      // Cargar carta activa
      const cartasRes = await menuApi.getCartas();
      const cartas = Array.isArray(cartasRes) ? cartasRes : (cartasRes.data || []);
      const carta = cartas.find(c => c.estado === 'activa');
      setCartaActiva(carta);

    } catch (err) {
      console.error('❌ Error inicial:', err);
      setError('Error al cargar datos. Verifique conexión.');
    } finally {
      setLoading(false);
    }
  };

  const cargarRepartidores = async () => {
    setCargandoRepartidores(true);
    try {
      const response = await menuApi.getUsuarios({ rol: 'repartidor', activo: true });
      const lista = Array.isArray(response) ? response : (response.data || []);
      setRepartidores(lista);
    } catch (error) {
      console.error('❌ Error repartidores:', error);
    } finally {
      setCargandoRepartidores(false);
    }
  };

  // --- LÓGICA DE CLIENTES ---
  const handleAbrirModalTelefono = () => {
    if (!cartaActiva) return alert('⚠️ No hay una carta activa. Cree una primero.');
    setTelefonoCliente('');
    setClienteParaNuevoPedido(null);
    setShowModalTelefono(true);
  };

  const handleBuscarClientePorTelefono = async () => {
    if (!telefonoCliente.trim()) return alert('⚠️ Ingresa un teléfono.');
    setCargandoCliente(true);
    try {
      const respuesta = await menuApi.getClientes({ movil: telefonoCliente.trim() });
      const clientes = Array.isArray(respuesta) ? respuesta : (respuesta?.data || []);

      if (clientes.length > 0) {
        const clienteEncontrado = clientes[0];
        setClienteParaNuevoPedido({
            ...clienteEncontrado,
            telefono: clienteEncontrado.movil || clienteEncontrado.telefono 
        });
        setShowModalTelefono(false);
        setShowTomarPedido(true);
      } else {
        setNuevoCliente(prev => ({ ...prev, movil: telefonoCliente.trim() }));
        setShowModalTelefono(false);
        setShowModalCrearCliente(true);
      }
    } catch (err) {
      console.error(err);
      alert('Error al buscar cliente.');
    } finally {
      setCargandoCliente(false);
    }
  };

  const handleCrearNuevoCliente = async () => {
    if (!nuevoCliente.nombre.trim() || !nuevoCliente.movil.trim()) return alert('Nombre y teléfono son obligatorios.');
    setLoading(true);
    try {
      const res = await menuApi.crearCliente({ ...nuevoCliente, activo: true });
      const clienteCreado = res.data || res;
      setClienteParaNuevoPedido({
          ...clienteCreado,
          telefono: clienteCreado.movil 
      });
      setShowModalCrearCliente(false);
      setShowTomarPedido(true);
      alert('✅ Cliente creado correctamente.');
    } catch (err) {
      alert('Error al crear cliente: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE PEDIDOS ---
  const handleAbrirTomaPedido = (pedidoExistente = null) => {
    if (!cartaActiva) return alert('⚠️ No hay carta activa.');
    
    // ✅ LIMPIEZA PREVENTIVA PARA DELIVERY
    if (pedidoExistente) {
        // Aseguramos que no tenga mesa asignada visualmente para evitar confusiones
        const pedidoLimpio = { ...pedidoExistente, mesa_id: null };
        setPedidoAEditar(pedidoLimpio);
        
        const c = pedidoExistente.cliente || pedidoExistente.cliente_datos;
        if(c) {
            setClienteParaNuevoPedido({
                ...c,
                telefono: pedidoExistente.telefono_contacto || c.movil
            });
        }
    } else {
        setPedidoAEditar(null);
    }
    
    setShowTomarPedido(true);
  };

  const handleCloseTomaPedido = () => {
    setShowTomarPedido(false);
    setPedidoAEditar(null);
    setClienteParaNuevoPedido(null);
  };

  const handlePedidoCreado = (pedidoGuardado) => {
    cargarDatosIniciales();
    handleCloseTomaPedido();
  };

  // --- ACCIONES DE GESTIÓN ---
  const handlePrepararEliminarPedido = (pedido) => {
    if (['pagado', 'entregado', 'cancelado'].includes(pedido.estado)) return alert("No se puede eliminar este pedido porque ya fue finalizado.");
    setPedidoAEliminar(pedido);
    setShowEliminarPedidoModal(true);
  };

  const handleEliminarPedidoConfirmado = async () => {
    if (!pedidoAEliminar) return;
    try {
      await menuApi.eliminarPedido(pedidoAEliminar.id);
      setPedidos(prev => prev.filter(p => p.id !== pedidoAEliminar.id));
      alert('✅ Pedido eliminado.');
      setShowEliminarPedidoModal(false);
    } catch (error) { 
        alert('Error al eliminar: ' + error.message); 
    }
  };

  const handleAbrirModalAsignarRepartidor = (pedido) => {
    setPedidoParaAsignar(pedido);
    setRepartidorSeleccionado('');
    setShowModalAsignarRepartidor(true);
  };

  const handleAsignarRepartidor = async () => {
    if (!repartidorSeleccionado) return alert('Selecciona un repartidor.');
    setLoading(true);
    try {
      await menuApi.asignarRepartidor(pedidoParaAsignar.id, parseInt(repartidorSeleccionado));
      await cargarDatosIniciales(); 
      alert('✅ Repartidor asignado.');
      setShowModalAsignarRepartidor(false);
    } catch (error) { 
        alert('Error al asignar: ' + error.message); 
    } finally { 
        setLoading(false); 
    }
  };

  // --- ACCIONES DE IMPRESIÓN Y PAGO ---
  const handleImprimirCuenta = (pedido) => {
    printerService.imprimirTicket(pedido);
    setIdsImpresos(prev => new Set(prev).add(pedido.id));
  };

  const handlePrepararPago = (pedido) => {
    if (!idsImpresos.has(pedido.id)) {
        const deseaImprimir = window.confirm(`⚠️ Ticket no impreso. ¿Imprimir antes de cobrar?`);
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

  const obtenerNombreUsuario = () => usuario?.nombre_completo || usuario?.username || 'Usuario';

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <button onClick={onVolver} className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-amber-600 hover:bg-amber-50 rounded-lg font-medium group">
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span>Volver</span>
              </button>
              <div className="h-8 w-px bg-gray-200" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
                  <Bike className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Módulo Delivery</h1>
                  <p className="text-sm text-gray-500">Gestión de pedidos a domicilio</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
                {usuario && (
                <div className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2 rounded-lg border border-amber-100">
                    <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {obtenerNombreUsuario().charAt(0).toUpperCase()}
                    </div>
                    <div>
                    <p className="text-xs text-amber-700">Usuario activo</p>
                    <p className="text-sm font-semibold text-gray-700">{obtenerNombreUsuario()}</p>
                    </div>
                </div>
                )}
                <button onClick={handleAbrirModalTelefono} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                    <Plus className="w-5 h-5" />
                    <span>Nuevo Pedido</span>
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla Pedidos */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Package className="w-5 h-5" /> Pedidos Activos</h2>
          </div>
          <div className="p-6">
            {loading && !showTomarPedido ? (
              <div className="text-center py-8 text-gray-500">Cargando pedidos...</div>
            ) : pedidos.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No hay pedidos pendientes.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Orden</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Cliente</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Teléfono</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Dirección</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Repartidor</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Tiempo</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pedidos.map((p) => {
                      const repartidorObj = p.repartidor || (p.repartidor_id ? repartidores.find(r => r.id == p.repartidor_id) : null);
                      const tieneRepartidor = !!repartidorObj;

                      return (
                        <tr key={p.id} className="hover:bg-gray-50">
                          {/* COLUMNA ORDEN VISUAL */}
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {p.codigo_visual ? (
                                  <div className="flex flex-col items-start">
                                      <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded border border-blue-200">
                                          {p.codigo_visual}
                                      </span>
                                      <span className="text-[10px] text-gray-400 mt-0.5">#{p.id}</span>
                                  </div>
                              ) : (
                                  <span className="text-gray-500">#{p.id}</span>
                              )}
                          </td>

                          <td className="px-6 py-4 text-sm text-gray-900">{p.cliente?.nombre || p.cliente_datos?.nombre || 'Anonimo'}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{p.cliente?.movil || p.telefono_contacto || 'N/A'}</td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{p.cliente?.direccion || p.direccion_entrega || 'N/A'}</td>
                          
                          <td className="px-6 py-4 text-sm">
                            {tieneRepartidor ? (
                                <span className="flex items-center gap-1 font-bold text-amber-700">
                                  <Bike size={14}/> {repartidorObj.nombre_completo || repartidorObj.username || 'Sin Nombre'}
                                </span>
                            ) : (
                                <span className="text-gray-400 italic text-xs">Sin asignar</span>
                            )}
                          </td>

                          <td className="px-6 py-4 text-sm font-semibold text-emerald-600">${parseFloat(p.total).toLocaleString('es-CL')}</td>
                          <td className="px-6 py-4"><span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{p.estado}</span></td>
                          <td className="px-6 py-4 text-sm text-gray-500 flex items-center gap-1"><Timer className="w-4 h-4" /> {calcularTiempoTranscurrido(p.fecha_hora)}</td>
                          <td className="px-6 py-4 text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              
                              {!tieneRepartidor && (
                                  <button onClick={() => handleAbrirModalAsignarRepartidor(p)} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded" title="Asignar Repartidor"><User className="w-4 h-4"/></button>
                              )}

                              {tieneRepartidor && (
                                <>
                                  <button onClick={() => handleImprimirCuenta(p)} className="text-gray-600 hover:bg-gray-100 p-1 rounded" title="Imprimir Cuenta">
                                      <Printer className="w-5 h-5"/>
                                  </button>

                                  <button onClick={() => handlePrepararPago(p)} className="text-green-600 hover:bg-green-50 p-1 rounded font-bold" title="Pagar">
                                      <DollarSign className="w-5 h-5"/>
                                  </button>
                                </>
                              )}
                              
                              <button onClick={() => handleAbrirTomaPedido(p)} className="text-blue-600 hover:bg-blue-50 p-1 rounded" title="Editar"><Edit3 className="w-4 h-4"/></button>
                              <button onClick={() => handlePrepararEliminarPedido(p)} className="text-red-600 hover:bg-red-50 p-1 rounded" title="Eliminar"><Trash2 className="w-4 h-4"/></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODALES IGUALES... */}
      {showTomarPedido && (
        <div className="fixed inset-0 z-[1000] bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-full max-h-full overflow-hidden shadow-2xl flex flex-col">
            <TomarPedidoManager
              key={pedidoAEditar?.id || clienteParaNuevoPedido?.id || 'new'}
              usuario={usuario}
              onVolver={handleCloseTomaPedido}
              tipoPedido="delivery"
              pedidoExistente={pedidoAEditar}
              clienteInicial={clienteParaNuevoPedido}
              onPedidoCreado={handlePedidoCreado}
            />
          </div>
        </div>
      )}

      {showModalPagar && pedidoParaPagar && (
        <ModalPagoUniversal 
            pedido={pedidoParaPagar} 
            onCerrar={()=>{setShowModalPagar(false); setPedidoParaPagar(null)}} 
            onPagoExitoso={handlePagarPedido} 
        />
      )}

      {showEliminarPedidoModal && pedidoAEliminar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
                <h3 className="font-bold text-lg mb-4 text-red-600 flex gap-2"><AlertCircle/> Eliminar Pedido #{pedidoAEliminar.id}</h3>
                <p className="text-gray-600 mb-6">¿Estás seguro? Esta acción no se puede deshacer.</p>
                <div className="flex justify-end gap-3">
                    <button onClick={() => setShowEliminarPedidoModal(false)} className="px-4 py-2 border rounded hover:bg-gray-100">Cancelar</button>
                    <button onClick={handleEliminarPedidoConfirmado} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Eliminar</button>
                </div>
            </div>
        </div>
      )}

      {showModalTelefono && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
                <h3 className="font-bold text-lg mb-4">Nuevo Pedido Delivery</h3>
                <label className="block text-sm text-gray-600 mb-1">Teléfono Cliente</label>
                <div className="flex gap-2">
                    <input autoFocus type="tel" className="flex-1 border p-2 rounded" placeholder="+56 9..." value={telefonoCliente} onChange={(e)=>setTelefonoCliente(e.target.value)} />
                    <button onClick={handleBuscarClientePorTelefono} disabled={!telefonoCliente} className="bg-amber-600 text-white px-4 rounded hover:bg-amber-700"><Search size={20}/></button>
                </div>
                <button onClick={()=>setShowModalTelefono(false)} className="mt-4 text-gray-500 w-full text-center text-sm underline">Cancelar</button>
            </div>
        </div>
      )}

      {showModalCrearCliente && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
                <h3 className="font-bold text-lg mb-4 text-green-700">Registrar Cliente</h3>
                <div className="space-y-3">
                    <input className="w-full border p-2 rounded" value={nuevoCliente.movil} readOnly />
                    <input className="w-full border p-2 rounded" placeholder="Nombre *" value={nuevoCliente.nombre} onChange={e=>setNuevoCliente({...nuevoCliente, nombre: e.target.value})} />
                    <input className="w-full border p-2 rounded" placeholder="Apellido" value={nuevoCliente.apellido} onChange={e=>setNuevoCliente({...nuevoCliente, apellido: e.target.value})} />
                    <input className="w-full border p-2 rounded" placeholder="Dirección *" value={nuevoCliente.direccion} onChange={e=>setNuevoCliente({...nuevoCliente, direccion: e.target.value})} />
                    <input className="w-full border p-2 rounded" placeholder="Comuna" value={nuevoCliente.comuna} onChange={e=>setNuevoCliente({...nuevoCliente, comuna: e.target.value})} />
                </div>
                <div className="mt-6 flex justify-end gap-2">
                    <button onClick={()=>setShowModalCrearCliente(false)} className="px-4 py-2 border rounded">Cancelar</button>
                    <button onClick={handleCrearNuevoCliente} className="px-4 py-2 bg-green-600 text-white rounded font-bold">Guardar y Continuar</button>
                </div>
            </div>
        </div>
      )}

      {showModalAsignarRepartidor && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full">
                <h3 className="font-bold mb-4">Seleccionar Repartidor</h3>
                <select className="w-full border p-2 rounded mb-4" value={repartidorSeleccionado} onChange={e=>setRepartidorSeleccionado(e.target.value)}>
                    <option value="">-- Seleccione --</option>
                    {repartidores.map(r => <option key={r.id} value={r.id}>{r.nombre_completo}</option>)}
                </select>
                <div className="flex justify-end gap-2">
                    <button onClick={()=>setShowModalAsignarRepartidor(false)} className="px-4 py-2 border rounded">Cancelar</button>
                    <button onClick={handleAsignarRepartidor} className="px-4 py-2 bg-blue-600 text-white rounded">Asignar</button>
                </div>
            </div>
         </div>
      )}
    </div>
  );
}
