import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BotonGrid from '../menu/BotonGrid';
import { menuApi } from '../../api/menuApi';
import { 
  ArrowLeft, ShoppingCart, User, Trash2, X, Edit3, Printer, Lock, Layers, RefreshCw, ChevronUp, ChevronDown 
} from 'lucide-react';

const generarIdUnico = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const BOTONES_VACIOS = Array.from({ length: 35 }, (_, i) => ({ 
  posicion: i + 1, activo: false, bg_color: '#f3f4f6', text_color: '#374151', font_size: 'text-sm', tipo: null, referencia_id: null, etiqueta: null
}));

const formatMoney = (amount) => Math.round(amount).toLocaleString('es-CL', { maximumFractionDigits: 0 });

export default function TomarPedidoManager({ 
  usuario, 
  onVolver = () => {}, 
  tipoPedido = 'mesa', 
  mesa = null, 
  onPedidoCreado = () => {}, 
  pedidoExistente = null, 
  clienteInicial = null,
  cartaIdOverride = null,
  appDeliveryId = null,
  codigoVisual = null
}) {
  const navigate = useNavigate();

  // ============================================
  // ESTADOS
  // ============================================
  const [productosGlobales, setProductosGlobales] = useState([]);
  const [combosMaestros, setCombosMaestros] = useState([]); 
  const [itemsRecetaMaestra, setItemsRecetaMaestra] = useState([]); 
  
  const [pantallas, setPantallas] = useState([]);
  const [botones, setBotones] = useState([...BOTONES_VACIOS]);
  const [cartaActiva, setCartaActiva] = useState(null);
  const [pantallaSeleccionada, setPantallaSeleccionada] = useState(null);
  const [historialPantallas, setHistorialPantallas] = useState([]); 
  const [loading, setLoading] = useState(false);

  const [showMobileCart, setShowMobileCart] = useState(false);

  const [modalPantallaSeleccionada, setModalPantallaSeleccionada] = useState(null);
  const [modalBotones, setModalBotones] = useState([...BOTONES_VACIOS]);
  const [modalHistorial, setModalHistorial] = useState([]);

  const [pedido, setPedido] = useState({ items: [], total: 0 }); 

  const [cliente, setCliente] = useState({ id: null, nombre: '', apellido: '', telefono: '', direccion: '', comuna: '', referencia_direccion: '' });
  const [mesas, setMesas] = useState([]); 
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  
  const [modalClienteAbierto, setModalClienteAbierto] = useState(false);
  const [mostrarModalMesas, setMostrarModalMesas] = useState(false);
  const [mesaManualInput, setMesaManualInput] = useState('');

  const [comensales, setComensales] = useState(1);
  const [esModoBuffet, setEsModoBuffet] = useState(false);

  const [comboEnEdicion, setComboEnEdicion] = useState(null);
  const [mostrarModalCombo, setMostrarModalCombo] = useState(false);
  const [indexItemAEditar, setIndexItemAEditar] = useState(null);
  const [mostrarSelector, setMostrarSelector] = useState(false);

  const isAdmin = usuario?.roles?.some(r => ['admin', 'dueño', 'administrador'].includes(r.nombre?.toLowerCase())) || false;

  // ============================================
  // FUNCIONES AUXILIARES
  // ============================================
  
  const getProd = useCallback((id) => {
      if (!id) return null;
      return productosGlobales.find(p => String(p.id) === String(id));
  }, [productosGlobales]);

  const agruparItems = (listaPlana) => {
      if (!listaPlana) return [];
      const g = [];
      listaPlana.forEach((item, idx) => {
          const ex = g.find(x => x.producto_id === item.producto_id && x.precio_cobrado === item.precio_cobrado);
          if (ex) { ex.cantidad++; ex.indices.push(idx); }
          else g.push({ ...item, cantidad: 1, indices: [idx] });
      });
      return g;
  };

  // ============================================
  // FUNCIONES DE CARRITO
  // ============================================
  
  const agregarItemCarro = (item) => {
    setPedido(prev => {
        if (item.tipo === 'producto') {
            const idx = prev.items.findIndex(i => i.tipo === 'producto' && i.id === item.id && !i.yaGuardado);
            if (idx >= 0) { 
                const copia = [...prev.items]; 
                copia[idx].cantidad++; 
                copia[idx].subtotal = copia[idx].precio * copia[idx].cantidad; 
                return { items: copia, total: copia.reduce((s, x) => s + x.subtotal, 0) }; 
            }
        }
        const nuevos = [...prev.items, item];
        return { items: nuevos, total: nuevos.reduce((s, x) => s + x.subtotal, 0) };
    });
  };

  const handleEliminarDelCarro = (index) => {
      const item = pedido.items[index];
      if (item.yaGuardado && !isAdmin) return alert("⛔ Solo admin puede eliminar productos confirmados.");
      const nuevos = pedido.items.filter((_, i) => i !== index);
      setPedido({ items: nuevos, total: nuevos.reduce((s, i) => s + i.subtotal, 0) });
  };

  const handleRestarCantidad = (index) => {
      const item = pedido.items[index];
      if (item.cantidad === 1) { handleEliminarDelCarro(index); return; }
      if (item.yaGuardado && !isAdmin) return alert("⛔ Solo admin puede reducir cantidad confirmada.");
      const copia = [...pedido.items];
      copia[index].cantidad--;
      copia[index].subtotal = copia[index].precio * copia[index].cantidad;
      setPedido({ items: copia, total: copia.reduce((s, x) => s + x.subtotal, 0) });
  };

  const handleSumarCantidad = (index) => {
      const copia = [...pedido.items];
      copia[index].cantidad++;
      copia[index].subtotal = copia[index].precio * copia[index].cantidad;
      setPedido({ items: copia, total: copia.reduce((s, x) => s + x.subtotal, 0) });
  };

  // ============================================
  // FUNCIONES DE COMBO
  // ============================================
  
  const handleEditarCombo = (itemCarro) => {
      if (itemCarro.cantidad > 1) {
          const clon = JSON.parse(JSON.stringify(itemCarro));
          clon.unique_id = generarIdUnico(); 
          clon.cantidad = 1; 
          clon.subtotal = clon.precio;
          
          setPedido(prev => {
              const items = prev.items.map(i => 
                  i.unique_id === itemCarro.unique_id 
                  ? { ...i, cantidad: i.cantidad - 1, subtotal: i.precio * (i.cantidad - 1) } 
                  : i
              );
              return { 
                  items: [...items, clon], 
                  total: items.reduce((s, x) => s + x.subtotal, 0) + clon.subtotal 
              };
          });
          setComboEnEdicion(clon);
      } else {
          setComboEnEdicion({ ...itemCarro });
      }
      
      const principal = pantallas.length > 0 
          ? (pantallas.find(x => x.es_principal)?.id || pantallas[0].id)
          : null;

      if (principal) setModalPantallaSeleccionada(principal);
      
      setModalHistorial([]);
      setMostrarModalCombo(true);
      setMostrarSelector(false);
  };

  const handleIniciarReemplazo = (grupo) => {
      if (grupo.indices && grupo.indices.length > 0) {
          setIndexItemAEditar(grupo.indices[0]); 
          setMostrarSelector(true);
      }
  };

  const handleBotonModalClick = (btn) => {
      if (!btn.activo) return;
      if (btn.tipo === 'pantalla') { 
          setModalHistorial(prev => [...prev, modalPantallaSeleccionada]); 
          setModalPantallaSeleccionada(btn.referencia_id); 
      }
      else if (btn.tipo === 'platillo') { 
          const prod = getProd(btn.referencia_id); 
          if (prod) handleReemplazarProducto(prod); 
      }
  };

  const handleReemplazarProducto = (prod) => {
      if (!comboEnEdicion || indexItemAEditar === null) return;
      const items = [...comboEnEdicion.productos_instancia];
      const actual = items[indexItemAEditar];
      const precioNuevo = Math.round(parseFloat(prod.precio_venta));
      const diff = precioNuevo - actual.precio_base;
      const cobrado = diff > 0 ? actual.precio_base + diff : actual.precio_base;
      items[indexItemAEditar] = { ...actual, producto_id: prod.id, nombre: prod.nombre, precio_cobrado: cobrado };
      let extra = 0; 
      items.forEach(i => { 
          const d = i.precio_cobrado - i.precio_base; 
          if(d > 0) extra += d; 
      });
      const nuevoPrecioCombo = comboEnEdicion.precio_base_combo + extra;
      setComboEnEdicion({ 
          ...comboEnEdicion, 
          productos_instancia: items, 
          precio: nuevoPrecioCombo, 
          subtotal: nuevoPrecioCombo * comboEnEdicion.cantidad, 
          modificado: true 
      });
      setMostrarSelector(false); 
      setIndexItemAEditar(null);
  };

  const guardarCambiosCombo = () => {
      setPedido(prev => {
          const items = prev.items.map(i => i.unique_id === comboEnEdicion.unique_id ? comboEnEdicion : i);
          return { items, total: items.reduce((s, x) => s + x.subtotal, 0) };
      });
      setMostrarModalCombo(false);
  };

  // ============================================
  // FUNCIONES DE NEGOCIO Y VALIDACIÓN
  // ============================================
  
  const handleAgregarAlPedido = (btn) => {
    if (!btn.activo) return;
    if (btn.tipo === 'platillo') {
        const prod = getProd(btn.referencia_id);
        if (prod) {
            const precio = Math.round(parseFloat(prod.precio_venta));
            agregarItemCarro({ 
                unique_id: generarIdUnico(), 
                tipo: 'producto', 
                id: prod.id, 
                nombre: prod.nombre, 
                precio: precio, 
                cantidad: 1, 
                subtotal: precio, 
                yaGuardado: false, 
                zona_impresion: prod.zona_impresion 
            });
        }
    } else if (btn.tipo === 'combo') {
        const combo = combosMaestros.find(c => String(c.id) === String(btn.referencia_id));
        if (combo) {
            const receta = itemsRecetaMaestra.filter(ri => String(ri.combo_id) === String(combo.id));
            if (receta.length === 0) return alert("Este combo no tiene productos configurados.");
            
            const productosInstancia = [];
            receta.forEach(r => { 
                const pReal = getProd(r.producto_carta_id || r.producto_id); 
                if (pReal) { 
                    const precio = Math.round(parseFloat(pReal.precio_venta)); 
                    for(let k=0; k<(r.cantidad||1); k++) { 
                        productosInstancia.push({ 
                            producto_id: pReal.id, 
                            nombre: pReal.nombre, 
                            precio_base: precio, 
                            precio_cobrado: precio 
                        }); 
                    } 
                } 
            });
            const precioCombo = Math.round(parseFloat(combo.precio));
            agregarItemCarro({ 
                unique_id: generarIdUnico(), 
                tipo: 'combo', 
                id: combo.id, 
                nombre: combo.nombre, 
                precio_base_combo: precioCombo, 
                precio: precioCombo, 
                cantidad: 1, 
                subtotal: precioCombo, 
                productos_instancia: productosInstancia, 
                yaGuardado: false, 
                zona_impresion: combo.zona_impresion 
            });
        }
    }
  };

  const handleRestarComensales = () => setComensales(p => (parseInt(p) > 1 ? parseInt(p) - 1 : 1));
  const handleSumarComensales = () => setComensales(p => (parseInt(p) || 0) + 1);

// ... código existente hasta la función handleValidarYSeleccionarMesa ...

/**
 * ✅ VALIDACIÓN TEMPRANA DE LA MESA
 * Esta función llama al controlador MesaController@store
 * antes de asignar la mesa al estado del frontend.
 */
const handleValidarYSeleccionarMesa = async (numeroMesaInput) => {
    // ✅ Si ya tenemos un pedido existente, no necesitamos validar
    if (pedidoExistente) {
        console.log("ℹ️ No se necesita validar mesa - ya hay un pedido existente");
        return;
    }
    
    const numeroParaValidar = numeroMesaInput ? String(numeroMesaInput).trim() : mesaManualInput.trim();
    if (!numeroParaValidar) return;
    setLoading(true);
    try {
        // Llamamos a la API (que ejecuta MesaController@store)
        const res = await menuApi.crearMesa({ 
            numero: numeroParaValidar
        });
        const mesaBackend = res.data || res;
        if (mesaBackend && (mesaBackend.id || mesaBackend.numero)) {
            setMesaSeleccionada(mesaBackend);
            setMostrarModalMesas(false);
            setMesaManualInput('');
            console.log(`✅ Mesa ${mesaBackend.numero} validada y asignada.`);
        } else {
            alert("❌ Error: La API no devolvió una mesa válida.");
        }
    } catch (error) {
        const status = error.response?.status;
        const data = error.response?.data;
        console.error("❌ Error al validar mesa:", error);
        if (status === 403 && data?.error_type === 'mesa_ocupada_otro_mozo') {
    const pedidoInfo = data.pedido_existente;
    alert(
        `⛔ LA MESA ESTÁ SIENDO ATENDIDA POR ${pedidoInfo.mozo_nombre.toUpperCase()}.\n\n` +
        `NO ES POSIBLE UTILIZAR ESTA MESA`
    );
    setMesaManualInput('');
}
        else if (status === 409 && data?.error_type === 'pedido_duplicado') {
            // ✅ Si es el mismo mozo, cargar el pedido sin confirmación
            const esPropietario = Number(data.pedido_existente.id_mozo) === Number(usuario.id);
            
            if (esPropietario) {
                // Cargar directamente el pedido existente
                menuApi.getPedidoById(data.pedido_existente.id)
                    .then(res => {
                        const pedidoFull = res.data || res;
                        setMesaSeleccionada(pedidoFull.mesa);
                        setShowTomarPedido(false); // Ya estamos en el componente de toma de pedido
                    })
                    .catch(e => {
                        console.error("Error al cargar pedido existente:", e);
                        alert("Error al cargar el pedido existente");
                    });
            } else {
                // Otro mozo - mostrar confirmación como antes
                const pedidoInfo = data.pedido_existente;
                const continuar = window.confirm(
                    `⚠️ PEDIDO EXISTENTE
` +
                    `Ya tienes un pedido activo en la Mesa ${numeroParaValidar}:
` +
                    `📝 Pedido #${pedidoInfo.id}
` +
                    `Total: $${formatMoney(pedidoInfo.total || 0)}
` +
                    `¿Deseas abrir ese pedido?`
                );
                if (continuar && data.accion_sugerida === 'abrir_pedido_existente') {
                    navigate(`/pedidos/${pedidoInfo.id}/editar`);
                }
            }
            setMesaManualInput('');
        }
        else if (status === 404 && data?.error_type === 'mesa_no_existe') {
            alert(
                `⛔ MESA NO ENCONTRADA
` +
                `La Mesa ${numeroParaValidar} no existe en el sistema.
` +
                `Contacta a tu supervisor.`
            );
            setMesaManualInput('');
        }
        else {
            const errorMsg = data?.message || error.message || 'Error desconocido';
            alert(`❌ Error al validar la mesa:
${errorMsg}`);
        }
    } finally {
        setLoading(false);
    }
};

// ... resto del código existente ...

  const handleAceptar = async () => {
    if (pedido.items.length === 0) return alert("El pedido está vacío.");
    
    if (tipoPedido === 'mesa' && esModoBuffet) {
        if (!comensales || parseInt(comensales) < 1) return alert("⚠️ MODO BUFFET: Indique comensales.");
    }

    let mesaIdFinal = null;
    let numeroMesaTexto = null;
    
    if (tipoPedido === 'mesa') {
        if (!mesaSeleccionada) return alert("Seleccione una mesa.");
        if (mesaSeleccionada.id) mesaIdFinal = mesaSeleccionada.id;
        else if (mesaSeleccionada.numero) numeroMesaTexto = String(mesaSeleccionada.numero).trim();
    } 

    let clienteId = cliente.id;
    const esPedidoApp = tipoPedido === 'app';

    let datosClienteParaGuardar = { ...cliente };

    if (tipoPedido === 'takeout' && !datosClienteParaGuardar.nombre) {
        datosClienteParaGuardar.nombre = "Cliente";
        datosClienteParaGuardar.apellido = "Llevar";
    }

    if (tipoPedido === 'delivery' || tipoPedido === 'takeout' || esPedidoApp) {
        if (!datosClienteParaGuardar.nombre) return alert("Falta nombre del cliente/App.");

        if (tipoPedido === 'delivery' && !esPedidoApp) {
             if (!datosClienteParaGuardar.telefono) return alert("⚠️ El teléfono es obligatorio para Delivery.");
             if (!datosClienteParaGuardar.direccion && !datosClienteParaGuardar.comuna) return alert("⚠️ Dirección/Comuna obligatoria para Delivery.");
        }

        if (!clienteId) {
             try { 
                const payloadCliente = {
                    ...datosClienteParaGuardar,
                    movil: datosClienteParaGuardar.telefono || null, 
                    activo: true
                };
                const res = await menuApi.crearCliente(payloadCliente); 
                clienteId = res.data?.id || res.id; 
                setCliente(prev => ({
                    ...prev, 
                    id: clienteId, 
                    nombre: datosClienteParaGuardar.nombre, 
                    apellido: datosClienteParaGuardar.apellido 
                }));
            } catch(e) { 
                console.error(e);
                const errorMsg = e.response?.data?.message || e.message;
                const validationErrors = e.response?.data?.messages ? JSON.stringify(e.response.data.messages) : '';
                return alert(`Error creando cliente: ${errorMsg} \n${validationErrors}`); 
            }
        }
    }

    setLoading(true);
    try {
        const payload = {
            tipo_pedido: (tipoPedido === 'mesa') ? 'local' : tipoPedido, 
            cliente_id: clienteId,
            estado: 'pendiente',
            total: Math.round(pedido.total),
            mesa_id: mesaIdFinal,
            numero_mesa: numeroMesaTexto,
            cantidad_comensales: parseInt(comensales),
            app_delivery_id: appDeliveryId,
            codigo_visual: codigoVisual,
            comuna_entrega: datosClienteParaGuardar.comuna,
            telefono_contacto: datosClienteParaGuardar.telefono,
            direccion_entrega: datosClienteParaGuardar.direccion,
            referencia_direccion: datosClienteParaGuardar.referencia_direccion,
            items: pedido.items.filter(i => i.tipo === 'producto').map(p => ({
                id: parseInt(p.id), 
                tipo: 'producto', 
                producto_carta_id: parseInt(p.id), 
                cantidad: p.cantidad, 
                precio_unitario: Math.round(p.precio)
            })),
            combos: pedido.items.filter(i => i.tipo === 'combo').map(c => ({
                id: parseInt(c.id), 
                tipo: 'combo', 
                combo_id: parseInt(c.id), 
                cantidad: c.cantidad, 
                precio_unitario: Math.round(c.precio),
                pedido_combo_items: c.productos_instancia.map(pi => ({ 
                    producto_carta_id: parseInt(pi.producto_id), 
                    cantidad: 1, 
                    precio_unitario: Math.round(pi.precio_cobrado) 
                }))
            }))
        };

        const resGuardado = pedidoExistente 
            ? await menuApi.actualizarPedido(pedidoExistente.id, payload) 
            : await menuApi.crearPedido(payload);
        
        const itemsAImprimir = pedido.items.filter(item => {
            if (!item.yaGuardado) return true;
            if (item.modificado) return true;
            if (item.cantidad > (item.cantidadOriginal || 0)) return true;
            return false;
        }).map(item => ({ 
            ...item, 
            cantidadAImprimir: (item.yaGuardado && !item.modificado) 
                ? item.cantidad - item.cantidadOriginal 
                : item.cantidad 
        }));

        if (itemsAImprimir.length > 0) {
            console.log("🖨️ Imprimiendo Comanda...", itemsAImprimir);
            alert("✅ Pedido enviado a cocina.");
        } else {
            alert("✅ Pedido guardado.");
        }

        const bloqueoActivo = localStorage.getItem('config_bloqueo_terminal') === 'true';
        if (bloqueoActivo) {
             localStorage.removeItem('token');
             localStorage.removeItem('usuarioInfo');
             navigate('/login'); 
             window.location.reload(); 
        } else {
            onPedidoCreado(resGuardado.data || resGuardado); 
            if (onVolver && tipoPedido !== 'app') onVolver();
        }

    } catch (e) { 
        console.error("Error al guardar:", e); 
        const msg = e.response?.data?.message || e.message;
        alert(`Error al guardar: ${msg}`); 
    } finally { 
        setLoading(false); 
    }
  };

  // ============================================
  // FUNCIÓN DE RENDER
  // ============================================
  
  const renderCartItems = () => (
    <div className="space-y-2">
        {pedido.items.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
                <ShoppingCart size={32} className="mx-auto mb-2 opacity-50"/>
                No hay productos
            </div>
        )}
        {pedido.items.map((item, idx) => (
            <div key={item.unique_id} className={`border rounded-lg p-2 md:p-3 relative bg-white shadow-sm ${item.yaGuardado && !item.modificado ? 'border-l-4 border-l-gray-300' : 'border-l-4 border-l-green-500'}`}>
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-bold text-gray-800 flex items-center gap-2 text-sm leading-tight">
                            {item.nombre} 
                            {item.yaGuardado && !item.modificado && <Lock size={12} className="text-gray-400"/>} 
                            {item.tipo === 'combo' && <span className="text-[10px] text-blue-600 bg-blue-50 px-1 rounded flex items-center gap-1"><Layers size={10}/></span>}
                        </p>
                        <p className="text-xs text-gray-500">${formatMoney(item.precio)}</p>
                        
                        {item.tipo === 'combo' && item.productos_instancia && (
                            <div className="mt-1 pl-2 border-l-2 border-indigo-100 space-y-0.5">
                                {agruparItems(item.productos_instancia).map((g, k) => {
                                    const extra = g.precio_cobrado - g.precio_base;
                                    return (
                                        <div key={k} className="text-[10px] text-gray-600 flex items-center gap-1">
                                            <span className="font-bold text-gray-400">{g.cantidad}x</span> 
                                            <span className="truncate max-w-[150px]">{g.nombre}</span>
                                            {extra > 0 && <span className="text-red-500 font-bold">(+${formatMoney(extra)})</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <div className="text-right"><p className="font-bold text-emerald-600 text-sm">${formatMoney(item.subtotal)}</p></div>
                </div>
                
                <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                        <button onClick={()=>handleRestarCantidad(idx)} className={`w-7 h-7 rounded shadow text-xs font-bold active:scale-90 transition-transform flex items-center justify-center ${item.yaGuardado && !isAdmin ? 'bg-gray-300 text-gray-500' : 'bg-white'}`}>-</button>
                        <span className="w-6 text-center text-sm font-bold">{item.cantidad}</span>
                        <button onClick={()=>handleSumarCantidad(idx)} className="w-7 h-7 bg-white rounded shadow text-xs font-bold active:scale-90 transition-transform flex items-center justify-center">+</button>
                    </div>
                    <button onClick={()=>handleEliminarDelCarro(idx)} className={`p-1.5 rounded ${item.yaGuardado && !isAdmin ? 'text-gray-300' : 'text-red-500 hover:bg-red-50'}`}><Trash2 size={16}/></button>
                </div>
                
                {item.tipo === 'combo' && (
                    <div className="mt-2 pt-1 border-t border-dashed">
                        <button 
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEditarCombo(item);
                            }} 
                            className="w-full py-1.5 text-[10px] bg-blue-50 text-blue-700 font-bold rounded hover:bg-blue-100 border border-blue-200 flex items-center justify-center gap-1 active:scale-95"
                        >
                            <Edit3 size={10}/> Editar Contenido
                        </button>
                    </div>
                )}
            </div>
        ))}
    </div>
  );

  // ============================================
  // useEffect HOOKS
  // ============================================
  
// --- CARGA INICIAL (ACTUALIZADA PARA PRECIOS MÚLTIPLES EN PRODUCTOS Y COMBOS) ---
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        // 1. Determinar ID de Carta para la consulta de precios dinámicos
        // Si viene override (App), usamos ese ID. Si no, enviamos null y el backend usará la carta activa.
        const cartaIdParaConsulta = cartaIdOverride || null;

        const [cartasRes, prodsRes, cmbsRes, cItemsRes, mesasRes] = await Promise.all([
          menuApi.getCartas(),
          
          // ✅ PRODUCTOS DINÁMICOS: El backend inyecta el precio según la lista de la carta
          menuApi.getProductosPorCarta(cartaIdParaConsulta), 
          
          // ✅ COMBOS DINÁMICOS: El backend inyecta el precio según la lista de la carta
          // (Antes era getCombos(), ahora usamos la versión que soporta precios múltiples)
          menuApi.getCombosPorCarta 
            ? menuApi.getCombosPorCarta(cartaIdParaConsulta) 
            : menuApi.getCombos(),

          menuApi.getComboItems ? menuApi.getComboItems() : Promise.resolve([]),
          menuApi.getMesas().catch(err => [])
        ]);

        // 2. Procesar Cartas
        const listaCartas = Array.isArray(cartasRes) ? cartasRes : (cartasRes.data || []);
        
        // 3. Determinar Carta Activa en el Frontend (para referencia visual)
        let cartaSeleccionada = null;
        if (cartaIdOverride) {
            cartaSeleccionada = listaCartas.find(c => String(c.id) === String(cartaIdOverride));
        } else {
            cartaSeleccionada = listaCartas.find(c => c.estado === 'activa');
        }
        
        // 4. Procesar Datos (Ya vienen con el precio correcto desde el backend)
        const listaProductos = Array.isArray(prodsRes) ? prodsRes : (prodsRes.data || []);
        const listaCombos = Array.isArray(cmbsRes) ? cmbsRes : (cmbsRes.data || []);
        const listaMesas = Array.isArray(mesasRes) ? mesasRes : (mesasRes.data || []);
        const listaComboItems = Array.isArray(cItemsRes) ? cItemsRes : (cItemsRes.data || []);

        // 5. Actualizar Estados
        setCartaActiva(cartaSeleccionada || null);
        setProductosGlobales(listaProductos);
        setCombosMaestros(listaCombos);
        setMesas(listaMesas); 

        // 6. Aplanar items de recetas (Lógica para desglosar ingredientes de combos)
        let itemsPlanos = [...listaComboItems];
        if (listaCombos.length > 0) {
            listaCombos.forEach(c => {
                // Soportamos estructura anidada directa o vía relación
                const itemsAnidados = c.combo_items || c.items || [];
                if (itemsAnidados.length > 0) {
                    itemsPlanos = [...itemsPlanos, ...itemsAnidados.map(i => ({...i, combo_id: c.id}))];
                }
            });
        }
        setItemsRecetaMaestra(itemsPlanos);

      } catch (e) { 
          console.error("❌ Error CRÍTICO al cargar datos maestros:", e); 
          if (e.response && e.response.status === 500) {
              alert("Error del servidor al cargar precios. Verifique la conexión.");
          }
      } finally { 
          setLoading(false); 
      }
    };
    init();
  }, [cartaIdOverride]);

  // --- 🔥 VALIDACIÓN INICIAL AL CARGAR MESA POR PROPS ---
useEffect(() => { 
    if (pedidoExistente) {
        // ✅ Si ya tenemos un pedido existente, no necesitamos validar la mesa
        // Solo establecer el estado directamente
        if (pedidoExistente.mesa) {
            setMesaSeleccionada(pedidoExistente.mesa);
        } else if (mesa) {
            setMesaSeleccionada(mesa);
        }
        
        setComensales(pedidoExistente.cantidad_comensales || 1);
    } else if (mesa) {
        // ✅ Si no hay pedido existente pero sí hay una mesa proporcionada,
        // validar la mesa normalmente
        handleValidarYSeleccionarMesa(mesa.numero || mesa.id); 
    }
    
    setEsModoBuffet(localStorage.getItem('config_modo_buffet') === 'true');
}, [mesa, pedidoExistente]);

  
  useEffect(() => { 
    if (clienteInicial) {
        setCliente(prev => ({ 
            ...prev, 
            ...clienteInicial,
            telefono: clienteInicial.telefono || clienteInicial.movil || '',
            direccion: clienteInicial.direccion_entrega || clienteInicial.direccion || ''
        })); 
    }
  }, [clienteInicial]);

  // CARGA PANTALLAS Y BOTONES
  useEffect(() => {
    if (!cartaActiva) return;
    menuApi.getPantallasByCarta(cartaActiva.id).then(res => {
        const p = Array.isArray(res) ? res : (res.data || []);
        setPantallas(p);
        setPantallaSeleccionada(p.find(x => x.es_principal)?.id || p[0]?.id);
    });
  }, [cartaActiva]);

  useEffect(() => {
    if (!pantallaSeleccionada) return;
    menuApi.getBotonesByPantalla(pantallaSeleccionada).then(res => {
        const data = Array.isArray(res) ? res : (res.data || []);
        const mapa = new Map(data.map(b => [b.posicion, b]));
        setBotones(Array.from({ length: 35 }, (_, i) => ({
            posicion: i + 1, ...mapa.get(i + 1), activo: mapa.has(i + 1), bg_color: mapa.get(i + 1)?.bg_color || '#f3f4f6'
        })));
    });
  }, [pantallaSeleccionada]);

  // MODAL BOTONES (COMBOS)
  useEffect(() => {
    if (!mostrarModalCombo || !modalPantallaSeleccionada) return;
    menuApi.getBotonesByPantalla(modalPantallaSeleccionada).then(res => {
        const data = Array.isArray(res) ? res : (res.data || []);
        const mapa = new Map(data.map(b => [b.posicion, b]));
        setModalBotones(Array.from({ length: 35 }, (_, i) => ({
            posicion: i + 1, ...mapa.get(i + 1), activo: mapa.has(i + 1), bg_color: mapa.get(i + 1)?.bg_color || '#f3f4f6'
        })));
    });
  }, [modalPantallaSeleccionada, mostrarModalCombo]);

  // RECONSTRUIR PEDIDO AL EDITAR
  useEffect(() => {
    if (!pedidoExistente || productosGlobales.length === 0 || combosMaestros.length === 0) return;
    if (pedido.items.length > 0) return;

    const data = pedidoExistente.data || pedidoExistente;
    const itemsCarro = [];

    if (Array.isArray(data.items)) {
        data.items.forEach(item => {
            const pid = item.producto_carta_id || item.producto_id || item.producto?.id;
            const prod = getProd(pid);
            if (prod) {
                let precio = parseFloat(item.precio_unitario);
                if (!precio && precio !== 0) precio = parseFloat(prod.precio_venta);
                itemsCarro.push({
                    unique_id: generarIdUnico(), tipo: 'producto', id: prod.id, pedido_item_id: item.id, nombre: prod.nombre, precio: Math.round(precio), cantidad: parseInt(item.cantidad), subtotal: Math.round(precio) * parseInt(item.cantidad), yaGuardado: true, cantidadOriginal: parseInt(item.cantidad), modificado: false, zona_impresion: prod.zona_impresion
                });
            }
        });
    }

    if (Array.isArray(data.combos)) {
        data.combos.forEach(comboBack => {
            const cid = comboBack.combo_id || comboBack.combo?.id;
            const maestro = combosMaestros.find(c => String(c.id) === String(cid));
            if (maestro) {
                let itemsGuardados = comboBack.pedido_combo_items || [];
                if (itemsGuardados.length === 0 && Array.isArray(comboBack.items)) itemsGuardados = comboBack.items;
                let productosInstancia = [];
                if (itemsGuardados.length > 0) {
                    productosInstancia = itemsGuardados.map((ig) => {
                        const pid = ig.producto_carta_id || ig.producto_id;
                        const pReal = getProd(pid);
                        const precioCobrado = Math.round(parseFloat(ig.precio_unitario || ig.pivot?.precio_unitario || 0));
                        const precioBase = pReal ? Math.round(parseFloat(pReal.precio_venta)) : 0;
                        return { producto_id: pid, nombre: pReal ? pReal.nombre : 'Item Desconocido', precio_base: precioBase, precio_cobrado: precioCobrado };
                    });
                } else {
                    const recetaOriginal = itemsRecetaMaestra.filter(ri => String(ri.combo_id) === String(maestro.id));
                    recetaOriginal.forEach(r => {
                        const pReal = getProd(r.producto_carta_id || r.producto_id);
                        if (pReal) {
                            for(let k=0; k<(r.cantidad||1); k++) {
                                productosInstancia.push({ producto_id: pReal.id, nombre: pReal.nombre, precio_base: Math.round(parseFloat(pReal.precio_venta)), precio_cobrado: Math.round(parseFloat(pReal.precio_venta)) });
                            }
                        }
                    });
                }
                const precioCombo = Math.round(parseFloat(comboBack.precio_unitario));
                itemsCarro.push({ unique_id: generarIdUnico(), tipo: 'combo', id: maestro.id, nombre: maestro.nombre, precio_base_combo: Math.round(parseFloat(maestro.precio)), precio: precioCombo, cantidad: parseInt(comboBack.cantidad), subtotal: precioCombo * parseInt(comboBack.cantidad), productos_instancia: productosInstancia, yaGuardado: true, cantidadOriginal: parseInt(comboBack.cantidad), modificado: false, zona_impresion: maestro.zona_impresion });
            }
        });
    }

    if (itemsCarro.length > 0) setPedido({ items: itemsCarro, total: itemsCarro.reduce((s, i) => s + i.subtotal, 0) });
  }, [pedidoExistente, productosGlobales, combosMaestros, itemsRecetaMaestra, mesas, getProd]);


return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col h-screen w-screen overflow-hidden">
        {/* HEADER */}
        <div className="bg-white border-b p-2 md:p-3 flex justify-between items-center shadow-sm gap-2 shrink-0 z-10">
            <div className="flex items-center gap-3 md:gap-4">
                <button onClick={() => onVolver && onVolver()} className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-xl text-gray-600 hover:bg-gray-200 active:scale-95 transition-all">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex flex-col">
                    <h1 className="text-lg md:text-xl font-black text-gray-800 leading-none truncate max-w-[150px] md:max-w-none">
                        {tipoPedido === 'takeout' ? 'LLEVAR' : tipoPedido.toUpperCase()}
                    </h1>
                    <div className="flex gap-2 text-xs font-bold text-blue-600">
                        {tipoPedido === 'mesa' && mesaSeleccionada && <span>Mesa {mesaSeleccionada.numero}</span>}
                        {pedidoExistente?.codigo_visual && <span className="bg-purple-100 px-1 rounded">#{pedidoExistente.codigo_visual}</span>}
                    </div>
                </div>
            </div>

            {tipoPedido === 'mesa' && (
                <div className={`hidden md:flex items-center bg-gray-50 rounded-xl border-2 p-1 ${esModoBuffet ? 'border-orange-300' : 'border-gray-200'}`}>
                    <button onClick={handleRestarComensales} className="w-10 h-10 flex items-center justify-center rounded-lg font-bold bg-white text-gray-600 shadow-sm">-</button>
                    <div className="px-2 text-center"><span className="text-[10px] font-bold text-gray-400 block">{esModoBuffet ? 'PAX*' : 'PAX'}</span><span className="text-xl font-black">{comensales}</span></div>
                    <button onClick={handleSumarComensales} className="w-10 h-10 flex items-center justify-center rounded-lg font-bold bg-blue-600 text-white shadow-md">+</button>
                </div>
            )}

            {(tipoPedido === 'delivery' || tipoPedido === 'takeout' || tipoPedido === 'app') && (
                <button onClick={()=>setModalClienteAbierto(true)} className="bg-blue-100 text-blue-700 px-3 py-2 rounded-xl flex gap-2 font-bold text-sm items-center"><User size={18}/> <span className="hidden md:inline">{cliente.nombre || 'Cliente'}</span></button>
            )}
        </div>
        
        {/* BODY - CONTENEDOR PRINCIPAL */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-0 md:p-4 gap-0 md:gap-4 relative">
            
            {/* PANEL IZQUIERDO (CARRITO) */}
            <div className="hidden md:flex md:w-[35%] lg:w-[30%] bg-white rounded-xl shadow border flex-col h-full z-0 overflow-hidden">
                <div className="p-3 border-b bg-gray-50 flex justify-between items-center shrink-0">
                    <h3 className="font-bold flex gap-2 text-gray-700"><ShoppingCart size={18}/> Carrito</h3>
                    {tipoPedido === 'mesa' && <button onClick={() => setMostrarModalMesas(true)} className="text-xs text-blue-600 font-bold bg-blue-100 px-2 py-1 rounded hover:bg-blue-200">Mesa</button>}
                </div>
                
                <div className="flex-1 overflow-y-auto p-3">
                    {renderCartItems()}
                </div>
                
                <div className="p-4 bg-gray-100 border-t shrink-0">
                    <div className="flex justify-between items-center mb-4">
                        <span className="font-bold text-gray-700">Total</span>
                        <span className="text-2xl font-black text-emerald-600">${formatMoney(pedido.total)}</span>
                    </div>
                    <button onClick={handleAceptar} disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-green-700 active:scale-95 transition-all flex justify-center gap-2">
                        {loading ? <RefreshCw className="animate-spin"/> : <Printer/>} Confirmar
                    </button>
                </div>
            </div>

            {/* PANEL DERECHO (GRID) */}
            <div className="flex-1 flex flex-col bg-gray-50 h-full w-full min-h-0 md:rounded-xl md:shadow md:border overflow-hidden relative">
                <div className="p-2 md:p-3 flex justify-between items-center shrink-0 bg-white border-b z-20">
                    {historialPantallas.length > 0 ? (
                        <button 
                            onClick={()=>{
                                const ant=historialPantallas[historialPantallas.length-1];
                                setHistorialPantallas(p=>p.slice(0,-1));
                                setPantallaSeleccionada(ant)
                            }} 
                            className="text-blue-600 font-bold flex gap-1 text-sm px-3 py-2 bg-blue-50 rounded-lg shadow-sm border border-blue-100 active:scale-95"
                        >
                            <ArrowLeft size={18}/> Atrás
                        </button> 
                    ) : <div/>} 
                    
                    <button onClick={handleAceptar} disabled={loading} className="hidden md:flex bg-green-600 text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-green-700 items-center gap-2 text-sm">
                        <Printer size={16}/> {loading ? '...' : 'Confirmar'}
                    </button>
                </div>

                <div className="flex-1 min-h-0 relative">
                    <BotonGrid 
                        botones={botones} 
                        modoTomaPedido={true} 
                        compactMode={true} 
                        onAgregarAlPedido={handleAgregarAlPedido} 
                        onNavegacionSubpantalla={(id)=>{
                            setHistorialPantallas([...historialPantallas, pantallaSeleccionada]);
                            setPantallaSeleccionada(id)
                        }} 
                    />
                </div>
            </div>
        </div>

        {/* --- BARRA FLOTANTE MÓVIL --- */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] p-3 z-40 flex gap-3 items-center safe-area-pb">
            <div 
                onClick={() => setShowMobileCart(true)}
                className="flex-1 flex flex-col justify-center cursor-pointer active:opacity-70"
            >
                <div className="flex items-center gap-1 text-gray-500">
                    <ShoppingCart size={14} />
                    <span className="text-xs font-bold uppercase">{pedido.items.length} Ítems</span>
                </div>
                <span className="text-xl font-black text-emerald-600 leading-none mt-0.5">${formatMoney(pedido.total)}</span>
            </div>
            
            <button onClick={() => setShowMobileCart(true)} className="bg-gray-100 p-3 rounded-full text-gray-600 hover:bg-gray-200 active:scale-95"><ChevronUp size={24}/></button>
            <button onClick={handleAceptar} disabled={loading} className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold shadow-md active:scale-95 flex items-center gap-2">
                {loading ? <RefreshCw className="animate-spin w-5 h-5"/> : 'Confirmar'}
            </button>
        </div>

        {/* --- MODAL CARRITO MÓVIL --- */}
        {showMobileCart && (
            <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end">
                <div className="bg-white w-full h-[85vh] rounded-t-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300">
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl shrink-0" onClick={() => setShowMobileCart(false)}>
                        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><ShoppingCart size={20} className="text-blue-600"/> Tu Pedido</h3>
                        <button className="p-2 bg-gray-200 rounded-full text-gray-600"><ChevronDown size={20}/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 pb-24">
                        {renderCartItems()}
                    </div>
                    <div className="p-4 border-t bg-white safe-area-pb">
                        <div className="flex justify-between items-center mb-4"><span className="font-bold text-gray-600">Total a Pagar</span><span className="text-2xl font-black text-emerald-600">${formatMoney(pedido.total)}</span></div>
                        <button onClick={handleAceptar} disabled={loading} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95">{loading ? 'Enviando...' : 'Confirmar Pedido'}</button>
                    </div>
                </div>
            </div>
        )}
        
        {/* ✅ MODAL EDICIÓN COMBO (Z-INDEX 2050 PARA FLOTAR SOBRE TODO) */}
        {mostrarModalCombo && comboEnEdicion && (
            <div className="fixed inset-0 bg-black/60 z-[2050] flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white w-full max-w-[80vw] h-[95vh] rounded-xl flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="bg-blue-600 p-3 text-white flex justify-between items-center shrink-0">
                        <h3 className="font-bold truncate">Editando: {comboEnEdicion.nombre}</h3>
                        <button onClick={()=>setMostrarModalCombo(false)}><X/></button>
                    </div>
                    
                    <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
                        <div className={`${mostrarSelector ? 'hidden md:flex md:w-[25%]' : 'w-full'} flex flex-col border-r bg-gray-50 h-full transition-all duration-300`}>
                            <div className="p-3 border-b font-bold text-right text-emerald-600 bg-white shrink-0">Total: ${formatMoney(comboEnEdicion.precio)}</div>
                            <div className="flex-1 overflow-y-auto p-3 space-y-2 pb-20 md:pb-3">
                                {agruparItems(comboEnEdicion.productos_instancia).map((g,i)=>(
                                    <div key={i} className="p-3 border rounded-lg bg-white flex flex-col gap-1 shadow-sm items-start"> 
                                        <div className="text-sm leading-tight font-medium text-gray-800"><span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded mr-1">{g.cantidad}x</span>{g.nombre}</div>
                                        {g.precio_cobrado > g.precio_base && (<div className="text-left text-red-500 font-bold text-xs pl-8">(+${formatMoney(g.precio_cobrado - g.precio_base)})</div>)}
                                        <button onClick={()=>{handleIniciarReemplazo(g)}} className="mt-1 text-blue-600 text-xs font-bold bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100 hover:bg-blue-100 active:scale-95 transition-colors self-start">Cambiar</button>
                                    </div>
                                ))}
                            </div>
                            <div className="p-3 border-t flex flex-col gap-2 bg-white shrink-0">
                                <button onClick={guardarCambiosCombo} className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-bold shadow">Guardar</button>
                                <button onClick={()=>setMostrarModalCombo(false)} className="w-full px-4 py-2 border rounded-lg text-gray-600 font-bold text-xs">Cancelar</button>
                            </div>
                        </div>

                        {mostrarSelector && (
                            <div className="flex-1 flex flex-col bg-white border-l w-full h-full min-h-0">
                                <div className="p-2 border-b flex justify-between bg-gray-50 shrink-0">
                                    <button onClick={()=>{
                                        if(modalHistorial.length>0){ const ant=modalHistorial[modalHistorial.length-1]; setModalHistorial(p=>p.slice(0,-1)); setModalPantallaSeleccionada(ant) } else { setMostrarSelector(false); }
                                    }} className="text-blue-600 font-bold flex items-center text-sm"><ArrowLeft size={16}/> Volver</button>
                                    <span className="font-bold text-sm text-gray-700">Selecciona opción</span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 bg-gray-100 relative min-h-0">
                                    <BotonGrid botones={modalBotones} modoTomaPedido={true} compactMode={false} onAgregarAlPedido={handleBotonModalClick} onNavegacionSubpantalla={(id)=>{setModalHistorial([...modalHistorial,modalPantallaSeleccionada]);setModalPantallaSeleccionada(id)}}/>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* ✅ MODAL SELECCION DE MESA - CORREGIDO PARA LLAMAR A LA VALIDACIÓN */}
        {mostrarModalMesas && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95">
                    <h3 className="font-bold mb-4 text-xl border-b pb-2 text-gray-800">Seleccionar Mesa</h3>
                    
                    {/* INPUT MANUAL PARA MESA */}
                    <div className="flex gap-2 mb-4">
                        <input 
                           className="flex-1 border-2 border-gray-300 rounded-lg p-3 font-bold text-lg text-center"
                           placeholder="N° Manual"
                           value={mesaManualInput}
                           onChange={(e) => setMesaManualInput(e.target.value)}
                           onKeyDown={(e) => e.key === 'Enter' && handleValidarYSeleccionarMesa(mesaManualInput)}
                        />
                        <button 
                            onClick={() => handleValidarYSeleccionarMesa(mesaManualInput)}
                            disabled={loading}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold"
                        >
                            OK
                        </button>
                    </div>

                    <div className="grid grid-cols-4 gap-3 mb-6 max-h-60 overflow-y-auto">
                        {mesas.map(m => (
                            <button 
                                key={m.id} 
                                onClick={() => handleValidarYSeleccionarMesa(m.numero)} 
                                disabled={loading}
                                className={`h-14 border-2 rounded-xl font-bold text-lg transition-colors ${
                                    m.estado === 'ocupada' ? 'bg-red-50 border-red-200 text-red-500' : 
                                    m.estado === 'pagando' ? 'bg-yellow-50 border-yellow-200 text-yellow-600' : 
                                    'hover:bg-green-50 hover:border-green-500 text-gray-700'
                                }`}
                            >
                                {m.numero}
                            </button>
                        ))}
                    </div>
                    
                    <button onClick={()=>setMostrarModalMesas(false)} className="w-full text-center text-red-500 py-3 font-bold bg-red-50 rounded-xl">Cancelar</button>
                </div>
            </div>
        )}
        
        {modalClienteAbierto && <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"><div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95"><h3 className="font-bold mb-4 text-xl text-blue-800">Datos Cliente</h3><div className="space-y-4"><input className="w-full border-2 p-3 rounded-xl outline-none focus:border-blue-500 font-bold" placeholder="Teléfono" value={cliente.telefono} onChange={e=>setCliente({...cliente, telefono: e.target.value})}/><input className="w-full border-2 p-3 rounded-xl outline-none focus:border-blue-500 font-bold" placeholder="Nombre" value={cliente.nombre} onChange={e=>setCliente({...cliente, nombre: e.target.value})}/><input className="w-full border-2 p-3 rounded-xl outline-none focus:border-blue-500 font-bold" placeholder="Dirección" value={cliente.direccion} onChange={e=>setCliente({...cliente, direccion: e.target.value})}/></div><div className="mt-6 flex justify-end gap-3"><button onClick={()=>setModalClienteAbierto(false)} className="px-6 py-3 border-2 rounded-xl font-bold text-gray-500">Cerrar</button><button onClick={()=>setModalClienteAbierto(false)} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg">Guardar</button></div></div></div>}
    </div>
  );
}
