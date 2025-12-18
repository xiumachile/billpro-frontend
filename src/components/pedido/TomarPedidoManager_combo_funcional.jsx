import React, { useState, useEffect, useCallback } from 'react';
import BotonGrid from '../menu/BotonGrid';
import { menuApi } from '../../api/menuApi';
import { 
  ArrowLeft, Package, ShoppingCart, CheckCircle, User, Trash2, X, Edit3, Repeat, Grid3x3 
} from 'lucide-react';

const generarIdUnico = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const BOTONES_VACIOS = Array.from({ length: 35 }, (_, i) => ({ 
  posicion: i + 1, activo: false, bg_color: '#f3f4f6', text_color: '#374151', font_size: 'text-sm', tipo: null, referencia_id: null, etiqueta: null
}));

export default function TomarPedidoManager({ 
  usuario, onVolver, tipoPedido = 'mesa', mesa = null, onPedidoCreado = () => {}, pedidoExistente = null, clienteInicial = null
}) {
  // --- 1. DATOS MAESTROS ---
  const [productosGlobales, setProductosGlobales] = useState([]);
  const [combosMaestros, setCombosMaestros] = useState([]); 
  const [itemsRecetaMaestra, setItemsRecetaMaestra] = useState([]); 
  
  // --- 2. INTERFAZ PRINCIPAL ---
  const [pantallas, setPantallas] = useState([]);
  const [botones, setBotones] = useState([...BOTONES_VACIOS]);
  const [cartaActiva, setCartaActiva] = useState(null);
  const [pantallaSeleccionada, setPantallaSeleccionada] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historialPantallas, setHistorialPantallas] = useState([]);

  // --- 3. INTERFAZ MODAL ---
  const [modalPantallaSeleccionada, setModalPantallaSeleccionada] = useState(null);
  const [modalBotones, setModalBotones] = useState([...BOTONES_VACIOS]);
  const [modalHistorial, setModalHistorial] = useState([]);

  // --- 4. PEDIDO ---
  const [pedido, setPedido] = useState({ items: [], total: 0 }); 

  // --- 5. NEGOCIO ---
  const [cliente, setCliente] = useState({ id: null, nombre: '', apellido: '', telefono: '', direccion: '', comuna: '' });
  const [mesas, setMesas] = useState([]); 
  const [mesaSeleccionada, setMesaSeleccionada] = useState(mesa || null);
  const [modalClienteAbierto, setModalClienteAbierto] = useState(false);
  const [mostrarModalMesas, setMostrarModalMesas] = useState(false);

  // --- 6. EDICIÓN ---
  const [comboEnEdicion, setComboEnEdicion] = useState(null);
  const [mostrarModalCombo, setMostrarModalCombo] = useState(false);
  const [indexItemAEditar, setIndexItemAEditar] = useState(null);
  const [mostrarSelector, setMostrarSelector] = useState(false);

  // --------------------------------------------------------------------------------
  // CARGA INICIAL
  // --------------------------------------------------------------------------------
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [cartas, prods, cmbs, cItems, mesasData] = await Promise.all([
          menuApi.getCartas(),
          menuApi.getProductosCarta(),
          menuApi.getCombos(),
          menuApi.getComboItems ? menuApi.getComboItems() : Promise.resolve([]),
          menuApi.getMesas()
        ]);

        const carta = Array.isArray(cartas) ? cartas.find(c => c.estado === 'activa') : null;
        setCartaActiva(carta);
        setProductosGlobales(Array.isArray(prods) ? prods : []);
        setCombosMaestros(Array.isArray(cmbs) ? cmbs : []);
        setMesas(Array.isArray(mesasData) ? mesasData : []); 

        let itemsPlanos = Array.isArray(cItems) ? [...cItems] : [];
        if (Array.isArray(cmbs)) {
            cmbs.forEach(c => {
                const itemsAnidados = c.combo_items || c.items || [];
                if (itemsAnidados.length > 0) {
                    itemsPlanos = [...itemsPlanos, ...itemsAnidados.map(i => ({...i, combo_id: c.id}))];
                }
            });
        }
        setItemsRecetaMaestra(itemsPlanos);

      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    init();
  }, []);

  useEffect(() => {
    if (clienteInicial && tipoPedido === 'delivery') {
        setCliente(prev => ({ ...prev, ...clienteInicial, telefono: clienteInicial.movil || '' }));
    }
  }, [clienteInicial, tipoPedido]);

  // Cargar Pantallas
  useEffect(() => {
    if (!cartaActiva) return;
    menuApi.getPantallasByCarta(cartaActiva.id).then(res => {
        const p = Array.isArray(res) ? res : [];
        setPantallas(p);
        const principal = p.find(x => x.es_principal)?.id || p[0]?.id;
        setPantallaSeleccionada(principal);
    });
  }, [cartaActiva]);

  // Cargar Botones Principales
  useEffect(() => {
    if (!pantallaSeleccionada) return;
    menuApi.getBotonesByPantalla(pantallaSeleccionada).then(res => {
        const data = Array.isArray(res) ? res : [];
        const mapa = new Map(data.map(b => [b.posicion, b]));
        setBotones(Array.from({ length: 35 }, (_, i) => ({
            posicion: i + 1, ...mapa.get(i + 1), activo: mapa.has(i + 1), bg_color: mapa.get(i + 1)?.bg_color || '#f3f4f6'
        })));
    });
  }, [pantallaSeleccionada]);

  // Cargar Botones del Modal
  useEffect(() => {
    if (!mostrarModalCombo || !modalPantallaSeleccionada) return;
    
    menuApi.getBotonesByPantalla(modalPantallaSeleccionada).then(res => {
        const data = Array.isArray(res) ? res : [];
        const mapa = new Map(data.map(b => [b.posicion, b]));
        setModalBotones(Array.from({ length: 35 }, (_, i) => ({
            posicion: i + 1, ...mapa.get(i + 1), activo: mapa.has(i + 1), bg_color: mapa.get(i + 1)?.bg_color || '#f3f4f6'
        })));
    });
  }, [modalPantallaSeleccionada, mostrarModalCombo]);

  // --------------------------------------------------------------------------------
  // LÓGICA DE NEGOCIO
  // --------------------------------------------------------------------------------

  const getProd = (id) => productosGlobales.find(p => String(p.id) === String(id));

  // A. RECONSTRUIR PEDIDO
  useEffect(() => {
    if (!pedidoExistente || productosGlobales.length === 0 || combosMaestros.length === 0) return;
    if (pedido.items.length > 0) return;

    const data = pedidoExistente.data || pedidoExistente;
    const itemsCarro = [];

    // 1. Productos
    (data.items || []).forEach(item => {
        const prod = getProd(item.producto_carta_id || item.producto?.id);
        if (prod) {
            itemsCarro.push({
                unique_id: generarIdUnico(),
                tipo: 'producto',
                id: prod.id,
                pedido_item_id: item.id, 
                nombre: prod.nombre,
                precio: parseFloat(item.precio_unitario),
                cantidad: parseInt(item.cantidad),
                subtotal: parseFloat(item.precio_unitario) * parseInt(item.cantidad)
            });
        }
    });

    // 2. Combos
    (data.combos || []).forEach(comboBack => {
        const maestro = combosMaestros.find(c => String(c.id) === String(comboBack.combo_id || comboBack.combo?.id));
        if (maestro) {
            const itemsGuardados = comboBack.pedido_combo_items || comboBack.items || [];
            
            const recetaOriginal = itemsRecetaMaestra.filter(ri => String(ri.combo_id) === String(maestro.id));
            const recetaExpandida = [];
            recetaOriginal.forEach(r => {
                const pReal = getProd(r.producto_carta_id || r.producto_id);
                if (pReal) {
                    for(let k=0; k<(r.cantidad||1); k++) {
                        recetaExpandida.push({
                            producto_id: pReal.id,
                            precio_base: parseFloat(pReal.precio_venta)
                        });
                    }
                }
            });

            let productosInstancia = [];
            if (itemsGuardados.length > 0) {
                productosInstancia = itemsGuardados.map((ig, idx) => {
                    const pid = ig.producto_carta_id || ig.producto_id || ig.id;
                    const pReal = getProd(pid);
                    const precioCobrado = parseFloat(ig.precio_unitario || ig.pivot?.precio_unitario || 0);
                    const original = recetaExpandida[idx];
                    const precioBase = original ? original.precio_base : 0;

                    return {
                        producto_id: pid,
                        nombre: pReal ? pReal.nombre : 'Item',
                        precio_base: precioBase, 
                        precio_cobrado: precioCobrado
                    };
                });
            } else {
                productosInstancia = recetaExpandida.map(r => {
                    const pReal = getProd(r.producto_id);
                    return {
                        producto_id: r.producto_id,
                        nombre: pReal ? pReal.nombre : 'Producto',
                        precio_base: r.precio_base,
                        precio_cobrado: r.precio_base
                    };
                });
            }

            itemsCarro.push({
                unique_id: generarIdUnico(),
                tipo: 'combo',
                id: maestro.id,
                nombre: maestro.nombre,
                precio_base_combo: parseFloat(maestro.precio),
                precio: parseFloat(comboBack.precio_unitario),
                cantidad: parseInt(comboBack.cantidad),
                subtotal: parseFloat(comboBack.precio_unitario) * parseInt(comboBack.cantidad),
                productos_instancia: productosInstancia
            });
        }
    });

    setPedido({ items: itemsCarro, total: itemsCarro.reduce((s, i) => s + i.subtotal, 0) });
    if (data.cliente_datos) setCliente(prev => ({...prev, ...data.cliente_datos}));
    if (data.mesa_id) setMesaSeleccionada(mesas.find(m => m.id === data.mesa_id) || null);

  }, [pedidoExistente, productosGlobales, combosMaestros, itemsRecetaMaestra, mesas]);

  // B. AGREGAR NUEVO COMBO
  const handleAgregarAlPedido = (btn) => {
    if (!btn.activo) return;

    if (btn.tipo === 'platillo') {
        const prod = getProd(btn.referencia_id);
        if (prod) {
            agregarItemCarro({
                unique_id: generarIdUnico(),
                tipo: 'producto',
                id: prod.id,
                nombre: prod.nombre,
                precio: parseFloat(prod.precio_venta),
                cantidad: 1,
                subtotal: parseFloat(prod.precio_venta)
            });
        }
    } else if (btn.tipo === 'combo') {
        const combo = combosMaestros.find(c => String(c.id) === String(btn.referencia_id));
        if (combo) {
            const receta = itemsRecetaMaestra.filter(ri => String(ri.combo_id) === String(combo.id));
            if (receta.length === 0) return alert("Combo sin productos.");

            const productosInstancia = [];
            receta.forEach(r => {
                const pReal = getProd(r.producto_carta_id || r.producto_id);
                if (pReal) {
                    for(let k=0; k<(r.cantidad||1); k++) {
                        productosInstancia.push({
                            producto_id: pReal.id,
                            nombre: pReal.nombre,
                            precio_base: parseFloat(pReal.precio_venta),
                            precio_cobrado: parseFloat(pReal.precio_venta)
                        });
                    }
                }
            });

            agregarItemCarro({
                unique_id: generarIdUnico(),
                tipo: 'combo',
                id: combo.id,
                nombre: combo.nombre,
                precio_base_combo: parseFloat(combo.precio),
                precio: parseFloat(combo.precio),
                cantidad: 1,
                subtotal: parseFloat(combo.precio),
                productos_instancia: productosInstancia
            });
        }
    }
  };

  const agregarItemCarro = (item) => {
    setPedido(prev => {
        if (item.tipo === 'producto') {
            const idx = prev.items.findIndex(i => i.tipo === 'producto' && i.id === item.id);
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

  // C. EDITAR CONTENIDO
  const agruparItems = (listaPlana) => {
    if (!listaPlana) return [];
    const grupos = [];
    listaPlana.forEach((item, indexReal) => {
        const existente = grupos.find(g => g.producto_id === item.producto_id && g.precio_cobrado === item.precio_cobrado);
        if (existente) {
            existente.cantidad++;
            existente.indices.push(indexReal);
        } else {
            grupos.push({ ...item, cantidad: 1, indices: [indexReal] });
        }
    });
    return grupos;
  };

  const handleEditarCombo = (itemCarro) => {
    if (itemCarro.cantidad > 1) {
        const clon = JSON.parse(JSON.stringify(itemCarro));
        clon.unique_id = generarIdUnico();
        clon.cantidad = 1;
        clon.subtotal = clon.precio;
        
        setPedido(prev => {
            const items = prev.items.map(i => {
                if (i.unique_id === itemCarro.unique_id) return { ...i, cantidad: i.cantidad - 1, subtotal: i.precio * (i.cantidad - 1) };
                return i;
            });
            return { items: [...items, clon], total: items.reduce((s, x) => s + x.subtotal, 0) + clon.subtotal };
        });
        setComboEnEdicion(clon);
    } else {
        setComboEnEdicion({ ...itemCarro });
    }

    const principal = pantallas.find(x => x.es_principal)?.id || pantallas[0]?.id;
    setModalPantallaSeleccionada(principal);
    setModalHistorial([]);
    setMostrarModalCombo(true);
    setMostrarSelector(false);
  };

  const handleIniciarReemplazo = (grupo) => {
    setIndexItemAEditar(grupo.indices[0]);
    setMostrarSelector(true);
  };

  const handleBotonModalClick = (btn) => {
    if (!btn.activo) return;
    if (btn.tipo === 'pantalla') {
        setModalHistorial(prev => [...prev, modalPantallaSeleccionada]);
        setModalPantallaSeleccionada(btn.referencia_id);
    } else if (btn.tipo === 'platillo') {
        const prod = getProd(btn.referencia_id);
        if (prod) handleReemplazarProducto(prod);
    }
  };

  const handleReemplazarProducto = (nuevoProd) => {
    if (!comboEnEdicion || indexItemAEditar === null) return;

    const items = [...comboEnEdicion.productos_instancia];
    const itemActual = items[indexItemAEditar];

    const precioNuevo = parseFloat(nuevoProd.precio_venta);
    const diferencia = precioNuevo - itemActual.precio_base;
    const precioACobrar = diferencia > 0 ? (itemActual.precio_base + diferencia) : itemActual.precio_base;

    items[indexItemAEditar] = {
        ...itemActual,
        producto_id: nuevoProd.id,
        nombre: nuevoProd.nombre,
        precio_cobrado: precioACobrar
    };

    let extraTotal = 0;
    items.forEach(i => {
        const dif = i.precio_cobrado - i.precio_base;
        if (dif > 0) extraTotal += dif;
    });

    const nuevoTotalCombo = comboEnEdicion.precio_base_combo + extraTotal;

    setComboEnEdicion({
        ...comboEnEdicion,
        productos_instancia: items,
        precio: nuevoTotalCombo,
        subtotal: nuevoTotalCombo * comboEnEdicion.cantidad
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

  // D. GUARDAR (CORREGIDO: ID siempre es el ID del Producto Maestro)
  const handleAceptar = async () => {
    if (pedido.items.length === 0) return alert("El pedido está vacío.");
    
    let clienteId = cliente.id;
    if (tipoPedido === 'delivery') {
        if (!cliente.nombre) return alert("Falta el nombre del cliente.");
        if (!clienteId) {
             try {
                const res = await menuApi.crearCliente({...cliente, activo: true});
                clienteId = res.data?.id || res.id;
             } catch(e) {
                return alert("Error guardando cliente: " + e.message);
             }
        }
    }

    setLoading(true);
    try {
        const payload = {
            tipo_pedido: tipoPedido === 'mesa' ? 'local' : tipoPedido,
            cliente_id: clienteId,
            estado: 'pendiente',
            total: pedido.total,
            mesa_id: mesaSeleccionada?.id,
            comuna_entrega: cliente.comuna,
            telefono_contacto: cliente.telefono,
            direccion_entrega: cliente.direccion,
            referencia_direccion: cliente.referencia_direccion,
            
            // ✅ CORRECCIÓN: En 'items', 'id' siempre es el ID DEL PRODUCTO DE LA CARTA
            items: pedido.items.filter(i => i.tipo === 'producto').map(p => ({
                id: parseInt(p.id), // ID Maestro (Producto Carta)
                tipo: 'producto',
                producto_carta_id: parseInt(p.id), 
                cantidad: p.cantidad, 
                precio_unitario: p.precio
            })),

            // ✅ COMBOS: 'id' siempre es el ID DEL COMBO MAESTRO
            combos: pedido.items.filter(i => i.tipo === 'combo').map(c => ({
                id: parseInt(c.id), // ID Maestro (Combo)
                tipo: 'combo',
                combo_id: parseInt(c.id),
                cantidad: c.cantidad,
                precio_unitario: c.precio,
                pedido_combo_items: c.productos_instancia.map(pi => ({
                    producto_carta_id: parseInt(pi.producto_id),
                    cantidad: 1, 
                    precio_unitario: pi.precio_cobrado 
                }))
            }))
        };

        console.log("📤 Guardando:", payload);
        const res = pedidoExistente 
            ? await menuApi.actualizarPedido(pedidoExistente.id, payload)
            : await menuApi.crearPedido(payload);
        
        onPedidoCreado(res.data || res);
        onVolver && onVolver();

    } catch (e) {
        console.error(e);
        alert("Error al guardar: " + e.message);
    } finally {
        setLoading(false);
    }
  };

  // --- RENDER ---
  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col">
        {/* HEADER */}
        <div className="bg-white border-b p-4 flex justify-between items-center shadow-sm">
            <div className="flex gap-4 items-center">
                <button onClick={onVolver} className="flex gap-2 text-gray-700 font-medium"><ArrowLeft /> Volver</button>
                <div className="h-6 w-px bg-gray-300"></div>
                <h1 className="text-xl font-bold">Pedido: {tipoPedido.toUpperCase()}</h1>
            </div>
            {tipoPedido === 'delivery' && (
                <button onClick={()=>setModalClienteAbierto(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex gap-2 shadow hover:bg-blue-700">
                    <User size={18}/> {cliente.nombre || 'Cliente'}</button>
            )}
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex-1 flex overflow-hidden p-4 gap-4">
            {/* CARRO (35%) */}
            <div className="w-[35%] bg-white rounded-xl shadow border flex flex-col">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center"><h3 className="font-bold flex gap-2 text-gray-700"><ShoppingCart /> Carrito</h3>{tipoPedido === 'mesa' && <button onClick={()=>setMostrarModalMesas(true)} className="text-sm text-blue-600 font-medium">Mesa: {mesaSeleccionada?.nombre || '?'}</button>}</div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {pedido.items.length === 0 && <div className="text-center text-gray-400 mt-10">Carro vacío</div>}
                    {pedido.items.map((item, idx) => (
                        <div key={item.unique_id} className="border rounded-lg p-3 relative hover:shadow-md transition bg-white">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-gray-800">
                                        {item.nombre} 
                                        {item.tipo === 'combo' && <span className="text-xs text-blue-600 bg-blue-50 px-1 rounded ml-1">COMBO</span>}
                                    </p>
                                    <p className="text-sm text-gray-500">${item.precio.toLocaleString('es-CL')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-emerald-600">${item.subtotal.toLocaleString('es-CL')}</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                                    <button onClick={()=>{const n={...pedido};n.items[idx].cantidad--;n.items[idx].subtotal=n.items[idx].precio*n.items[idx].cantidad;if(n.items[idx].cantidad<1)n.items.splice(idx,1);setPedido({...n,total:n.items.reduce((s,i)=>s+i.subtotal,0)})}} className="w-6 h-6 bg-white rounded shadow text-sm font-bold">-</button>
                                    <span className="w-6 text-center text-sm font-bold">{item.cantidad}</span>
                                    <button onClick={()=>{const n={...pedido};n.items[idx].cantidad++;n.items[idx].subtotal=n.items[idx].precio*n.items[idx].cantidad;setPedido({...n,total:n.items.reduce((s,i)=>s+i.subtotal,0)})}} className="w-6 h-6 bg-white rounded shadow text-sm font-bold">+</button>
                                </div>
                                <button onClick={()=>{const n={...pedido};n.items.splice(idx,1);setPedido({...n,total:n.items.reduce((s,i)=>s+i.subtotal,0)})}} className="text-red-500 p-1 hover:bg-red-50 rounded"><Trash2 size={18}/></button>
                            </div>
                            {item.tipo === 'combo' && (
                                <div className="mt-3 pt-2 border-t border-dashed">
                                    <ul className="text-xs text-gray-500 space-y-1 mb-2">
                                        {agruparItems(item.productos_instancia).map((grupo, gIdx) => {
                                            const dif = grupo.precio_cobrado - grupo.precio_base;
                                            return <li key={gIdx} className="flex justify-between"><span>• {grupo.cantidad}x {grupo.nombre}</span>{dif > 0 && <span className="text-red-500 font-bold text-[10px]">(+${dif} c/u)</span>}</li>
                                        })}
                                    </ul>
                                    <button onClick={() => handleEditarCombo(item)} className="w-full py-1 text-xs bg-blue-50 text-blue-700 font-bold rounded hover:bg-blue-100 flex items-center justify-center gap-1 border border-blue-200"><Edit3 size={12}/> Editar Contenido</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <div className="p-4 bg-gray-100 border-t flex justify-between items-center rounded-b-xl"><span className="font-bold text-gray-700">Total</span><span className="text-2xl font-bold text-emerald-600">${pedido.total.toLocaleString('es-CL')}</span></div>
            </div>

            {/* MENU PRINCIPAL */}
            <div className="w-[65%] bg-white rounded-xl shadow border flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    {historialPantallas.length > 0 ? (
                        <button onClick={()=>{const ant = historialPantallas[historialPantallas.length-1]; setHistorialPantallas(p=>p.slice(0,-1)); setPantallaSeleccionada(ant)}} className="text-blue-600 font-bold flex gap-1 items-center"><ArrowLeft size={16}/> Atrás</button>
                    ) : <div></div>}
                    <button onClick={handleAceptar} disabled={loading} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">{loading ? 'Guardando...' : <><CheckCircle size={18}/> Confirmar</>}</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? <div className="text-center mt-10">Cargando...</div> : (
                        <BotonGrid botones={botones} modoTomaPedido={true} onAgregarAlPedido={handleAgregarAlPedido}
                            onNavegacionSubpantalla={(id)=>{
                                setHistorialPantallas([...historialPantallas, pantallaSeleccionada]);
                                setPantallaSeleccionada(id);
                            }}
                        />
                    )}
                </div>
            </div>
        </div>

        {/* MODAL EDICIÓN COMBO */}
        {mostrarModalCombo && comboEnEdicion && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-[95vw] h-[90vh] rounded-xl flex flex-col overflow-hidden shadow-2xl">
                    <div className="bg-blue-600 p-4 text-white flex justify-between items-center"><h3 className="font-bold text-lg">Editando: {comboEnEdicion.nombre}</h3><button onClick={()=>setMostrarModalCombo(false)}><X/></button></div>
                    
                    <div className="flex-1 flex overflow-hidden">
                        {/* LISTA AGRUPADA (30%) */}
                        <div className={`w-[30%] flex flex-col border-r transition-all duration-300 bg-gray-50`}>
                            <div className="p-3 bg-white border-b flex justify-between items-center"><span className="font-medium text-gray-700">Contenido</span><span className="font-bold text-emerald-600 text-lg">Total: ${comboEnEdicion.precio.toLocaleString('es-CL')}</span></div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {agruparItems(comboEnEdicion.productos_instancia).map((grupo, idx) => {
                                    const extra = grupo.precio_cobrado - grupo.precio_base;
                                    const isSelected = mostrarSelector && grupo.indices.includes(indexItemAEditar);
                                    return (
                                        <div key={idx} className={`p-3 border rounded flex justify-between items-center bg-white ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:border-blue-300'}`}>
                                            <div>
                                                <p className="font-bold text-gray-800"><span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-sm mr-2">{grupo.cantidad}x</span>{grupo.nombre}</p>
                                                <p className="text-xs text-gray-500 ml-9">Base: ${grupo.precio_base} {extra > 0 && <span className="text-red-500 font-bold ml-1">(+${extra} c/u)</span>}</p>
                                            </div>
                                            <button onClick={()=>handleIniciarReemplazo(grupo)} className="text-blue-600 text-sm font-bold flex items-center gap-1 hover:bg-blue-100 px-3 py-1.5 rounded transition"><Repeat size={14}/> Cambiar uno</button>
                                        </div>
                                    )
                                })}
                            </div>
                            <div className="p-4 border-t flex justify-end gap-2 bg-white"><button onClick={()=>setMostrarModalCombo(false)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100">Cancelar</button><button onClick={guardarCambiosCombo} className="px-4 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 shadow">Aplicar</button></div>
                        </div>

                        {/* SELECTOR TIPO CARTA (70%) */}
                        {mostrarSelector ? (
                            <div className="flex-1 flex flex-col bg-white animate-in slide-in-from-right duration-300 border-l">
                                <div className="p-3 border-b flex justify-between items-center bg-gray-50">
                                    <div className="flex gap-2 items-center">
                                        {modalHistorial.length > 0 ? (
                                            <button onClick={()=>{const ant = modalHistorial[modalHistorial.length-1]; setModalHistorial(p=>p.slice(0,-1)); setModalPantallaSeleccionada(ant)}} className="text-blue-600 font-bold flex gap-1 items-center bg-white px-3 py-1 rounded border shadow-sm"><ArrowLeft size={16}/> Atrás</button>
                                        ) : <div className="font-bold text-gray-700 px-2">Seleccione producto para reemplazar</div>}
                                    </div>
                                    <button onClick={()=>setMostrarSelector(false)} className="text-sm text-gray-500 hover:text-red-500 underline">Cancelar selección</button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
                                    <BotonGrid 
                                        botones={modalBotones} 
                                        modoTomaPedido={true} 
                                        onAgregarAlPedido={handleBotonModalClick} 
                                        onNavegacionSubpantalla={(id) => {
                                            setModalHistorial([...modalHistorial, modalPantallaSeleccionada]);
                                            setModalPantallaSeleccionada(id);
                                        }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                                <Grid3x3 size={64} className="mb-4 text-gray-300"/>
                                <p className="text-xl font-medium">Seleccione un item de la izquierda para cambiarlo</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* MODALES MESAS Y CLIENTE */}
        {mostrarModalMesas && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"><div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full"><h3 className="font-bold mb-4 text-lg">Seleccionar Mesa</h3><div className="grid grid-cols-3 gap-2">{mesas.map(m => <button key={m.id} onClick={()=>{setMesaSeleccionada(m); setMostrarModalMesas(false)}} className="p-3 border rounded hover:bg-green-50 hover:border-green-500 font-medium">{m.nombre}</button>)}</div><button onClick={()=>setMostrarModalMesas(false)} className="mt-4 text-red-500 w-full text-center">Cancelar</button></div></div>}
        {modalClienteAbierto && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"><div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md"><h3 className="font-bold mb-4 text-lg">Datos Cliente</h3><div className="space-y-3"><input className="w-full border p-2 rounded" placeholder="Teléfono" value={cliente.telefono} onChange={e=>setCliente({...cliente, telefono: e.target.value})}/><input className="w-full border p-2 rounded" placeholder="Nombre" value={cliente.nombre} onChange={e=>setCliente({...cliente, nombre: e.target.value})}/><input className="w-full border p-2 rounded" placeholder="Dirección" value={cliente.direccion} onChange={e=>setCliente({...cliente, direccion: e.target.value})}/></div><div className="mt-6 flex justify-end gap-2"><button onClick={()=>setModalClienteAbierto(false)} className="px-4 py-2 text-gray-500">Cerrar</button><button onClick={()=>setModalClienteAbierto(false)} className="px-4 py-2 bg-blue-600 text-white">Listo</button></div></div></div>}
    </div>
  );
}
