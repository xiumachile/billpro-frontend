import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { menuApi } from '../api/menuApi';
import printerService from '../services/printerService'; 
import TomarPedidoManager from './pedido/TomarPedidoManager';
import ModalPagoUniversal from './pagos/ModalPagoUniversal';
import ModalPreCuenta from './pedido/ModalPreCuenta'; 
import { useLanguage } from '../context/LanguageContext';
import { 
  ArrowLeft, LogOut, Eraser, X, Utensils, Clock, DollarSign, Printer, Eye, FileText,
  Home, Users, Lock 
} from 'lucide-react';

export default function GestionMesas({ onLogout, usuario }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // --- ESTADOS DATOS ---
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mesas, setMesas] = useState([]);
  const [pedidosActivos, setPedidosActivos] = useState([]); 
  const [todasLasMesasDB, setTodasLasMesasDB] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [idsImpresos, setIdsImpresos] = useState(new Set());
  
  // --- ESTADOS INTERFAZ ---
  const [selectedMesaNum, setSelectedMesaNum] = useState(''); 
  const [nombreCarta, setNombreCarta] = useState('Cargando...');
  
  // --- CONFIGURACIÓN ---
  const modoBuffet = localStorage.getItem('config_modo_buffet') === 'true';
  const limiteMinutos = parseInt(localStorage.getItem('config_tiempo_buffet') || 90);

  // --- INFO USUARIO ---
  const nombreUsuario = usuario?.nombre_completo?.split(' ')[0] || 'Usuario';
  const rolUsuario = usuario?.roles?.[0]?.nombre || 'Sin Rol';
  
  // Lógica de roles
  const esAdmin = usuario?.roles?.some(r => ['admin', 'dueño', 'administrador'].includes((r.name || r.nombre).toLowerCase()));
  const esCajero = usuario?.roles?.some(r => ['cajero'].includes((r.name || r.nombre).toLowerCase()));
  const esMozo = !esAdmin && !esCajero; 

  // --- MODALES ---
  const [showTomarPedido, setShowTomarPedido] = useState(false);
  const [mesaSeleccionadaObj, setMesaSeleccionadaObj] = useState(null);
  const [pedidoExistente, setPedidoExistente] = useState(null);
  const [cargandoPedido, setCargandoPedido] = useState(false);
  const [showModalPagar, setShowModalPagar] = useState(false);
  const [pedidoParaPagar, setPedidoParaPagar] = useState(null);
  const [showModalVer, setShowModalVer] = useState(false);
  const [pedidoParaVer, setPedidoParaVer] = useState(null);
  const [showPreCuenta, setShowPreCuenta] = useState(false);
  const [pedidoParaPreCuenta, setPedidoParaPreCuenta] = useState(null);

  // 1. CARGA INICIAL
  useEffect(() => {
    cargarDatos();
    const timerReloj = setInterval(() => setCurrentTime(new Date()), 1000);
    const timerPolling = setInterval(cargarDatos, 10000); 
    return () => { clearInterval(timerReloj); clearInterval(timerPolling); };
  }, []);

  const cargarDatos = async () => {
    if (pedidosActivos.length === 0 && mesas.length === 0) setLoading(true);
    try {
      const [pedidosRes, cartasRes, mesasRes] = await Promise.all([
        menuApi.getPedidos({ estados: ['pendiente', 'en_preparacion', 'listo', 'entregando', 'pagando'] }),
        menuApi.getCartas(),
        menuApi.getMesas().catch(() => [])
      ]);

      const listaPedidos = Array.isArray(pedidosRes.data) ? pedidosRes.data : (Array.isArray(pedidosRes) ? pedidosRes : []);
      const pedidosConMesa = listaPedidos.filter(p => p.mesa || p.mesa_id);
      setPedidosActivos(pedidosConMesa);

      const mesasData = Array.isArray(mesasRes.data) ? mesasRes.data : (Array.isArray(mesasRes) ? mesasRes : []);
      setTodasLasMesasDB(mesasData);
      
      const mesasOrdenadas = mesasData.sort((a, b) => (parseInt(a.numero) || 0) - (parseInt(b.numero) || 0));
      setMesas(mesasOrdenadas);

      const cartas = Array.isArray(cartasRes.data) ? cartasRes.data : (Array.isArray(cartasRes) ? cartasRes : []);
      const activa = cartas.find(c => c.estado === 'activa');
      setNombreCarta(activa ? activa.nombre : 'SIN CARTA ACTIVA');

    } catch (error) { console.error('Error cargando datos:', error); } finally { setLoading(false); }
  };

  const puedeCobrar = () => {
    if (!usuario || !usuario.roles) return false;
    const rolesUser = usuario.roles.map(r => (r.nombre || r.name || '').toLowerCase());
    return rolesUser.some(r => ['admin', 'administrador', 'dueño', 'cajero'].includes(r));
  };

  const getInfoTiempo = (fechaStr) => {
      if (!fechaStr) return { texto: '--', color: 'text-gray-400', alerta: false, bg: 'bg-black/5' };
      const inicio = new Date(fechaStr);
      const diffMs = new Date() - inicio;
      const minutos = Math.floor(diffMs / 60000);

      if (!modoBuffet) return { texto: `${minutos} min`, color: 'text-gray-600', alerta: false, bg: 'bg-black/5' };

      const restantes = limiteMinutos - minutos;
      if (restantes < 0) return { texto: `EXC +${Math.abs(restantes)}'`, color: 'text-red-600 font-black animate-pulse', alerta: true, bg: 'bg-red-100' };
      if (restantes <= 15) return { texto: `${restantes}' FIN`, color: 'text-orange-600 font-bold', alerta: false, bg: 'bg-orange-50' };
      return { texto: `${minutos}/${limiteMinutos}'`, color: 'text-green-700 font-medium', alerta: false, bg: 'bg-green-50' };
  };

 // ... resto del código existente ...

/**
 * ✅ FUNCIÓN CORREGIDA: VALIDACIÓN TEMPRANA DE MESA
 * Ahora maneja correctamente la edición de pedidos existentes
 * sin bloquear al mozo cuando quiere editar SU propio pedido
 */
const handleProcesarMesa = async (numeroInput) => {
  if (!numeroInput) return alert('Ingrese un número de mesa');
  const numStr = String(numeroInput).trim();
  setCargandoPedido(true);
  
  try {
    // Buscar si hay un pedido existente para esta mesa ANTES de validar
    const pedidoEnMemoria = pedidosActivos.find(p => 
      String(p.mesa?.numero) === numStr
    );
    
    /**
     * ✅ CASO ESPECIAL: Si es un pedido existente del MISMO MOZO,
     * cargar directamente sin pasar por la validación estricta
     */
    if (pedidoEnMemoria) {
      const idMozoPedido = pedidoEnMemoria.id_mozo || pedidoEnMemoria.mozo?.id;
      const esPropietario = Number(idMozoPedido) === Number(usuario.id);
      
      if (esPropietario) {
        // ✅ Es el dueño del pedido - cargar directamente sin validaciones adicionales
        const pedidoFullRes = await menuApi.getPedidoById(pedidoEnMemoria.id);
        const pedidoFull = pedidoFullRes.data || pedidoFullRes;
        
        // Buscar la mesa completa en el estado
        const mesaCompleta = todasLasMesasDB.find(m => 
          String(m.numero) === numStr || String(m.id) === String(pedidoFull.mesa_id)
        );
        
        setMesaSeleccionadaObj(mesaCompleta || pedidoFull.mesa);
        setPedidoExistente(pedidoFull);
        setShowTomarPedido(true);
        setSelectedMesaNum('');
        return; // ✅ Salir temprano - no se necesita más validación
      }
    }
    
    // 🔒 VALIDACION CENTRALIZADA con backend (MesaController@store)
    // Solo para mesas nuevas o cuando no es el dueño del pedido existente
    const resValidacion = await menuApi.crearMesa({ numero: numStr });
    const mesaValidada = resValidacion.data || resValidacion;
    
    // Buscar nuevamente el pedido (podría haber cambiado)
    const pedidoActualizado = pedidosActivos.find(p => 
      String(p.mesa?.numero) === numStr || 
      (mesaValidada.id && String(p.mesa_id) === String(mesaValidada.id))
    );
    
    if (pedidoActualizado) {
      // Cargar el pedido completo con todos sus detalles
      const pedidoFullRes = await menuApi.getPedidoById(pedidoActualizado.id);
      const pedidoFull = pedidoFullRes.data || pedidoFullRes;
      
      setMesaSeleccionadaObj(mesaValidada);
      setPedidoExistente(pedidoFull);
      setShowTomarPedido(true);
    } else {
      // Es una mesa nueva o libre - usar la información validada por el backend
      setMesaSeleccionadaObj(mesaValidada);
      setPedidoExistente(null);
      setShowTomarPedido(true);
    }
    
    setSelectedMesaNum('');
  } catch (error) {
    console.error("Error al validar mesa:", error);
    const status = error.response?.status;
    const data = error.response?.data;
    
    // 🔒 MANEJO DE ERRORES ESPECÍFICOS DEL BACKEND
    if (status === 403 && data?.error_type === 'mesa_ocupada_otro_mozo') {
    const nombreColega = data.pedido_existente?.mozo_nombre || 'otro compañero';
    
    // ✅ MENSAJE SIMPLIFICADO Y EN MAYÚSCULAS
    alert(
      `⛔ LA MESA ESTÁ SIENDO ATENDIDA POR ${nombreColega.toUpperCase()}.\n\n` +
      `NO ES POSIBLE UTILIZAR ESTA MESA`
    );
  } 
    else if (status === 409 && data?.error_type === 'pedido_duplicado') {
      // ✅ CASO ESPECIAL: Si es el mismo mozo y quiere editar, permitir acceso directo
      const idMozoExistente = data.pedido_existente?.id_mozo;
      const esPropietario = Number(idMozoExistente) === Number(usuario.id);
      
      if (esPropietario) {
        // Cargar directamente el pedido existente sin confirmación
        menuApi.getPedidoById(data.pedido_existente.id)
          .then(res => {
            const pedidoFull = res.data || res;
            const mesaPedido = todasLasMesasDB.find(m => String(m.numero) === numStr) || pedidoFull.mesa;
            
            setMesaSeleccionadaObj(mesaPedido);
            setPedidoExistente(pedidoFull);
            setShowTomarPedido(true);
          })
          .catch(e => {
            console.error("Error al cargar pedido existente:", e);
            alert("Error al cargar el pedido existente");
          });
      } else {
        // Es otro mozo - mostrar confirmación como antes
        if (window.confirm(`⚠️ YA TIENES UN PEDIDO ACTIVO\n\nLa Mesa ${numStr} ya tiene tu pedido #${data.pedido_existente?.id}.\n\n¿Deseas continuar con ese pedido?`)) {
          menuApi.getPedidoById(data.pedido_existente.id)
            .then(res => {
              const pedidoFull = res.data || res;
              setMesaSeleccionadaObj(pedidoFull.mesa);
              setPedidoExistente(pedidoFull);
              setShowTomarPedido(true);
            })
            .catch(e => {
              console.error("Error al cargar pedido existente:", e);
              alert("Error al cargar el pedido existente");
            });
        }
      }
    }
    else if (status === 404 && data?.error_type === 'mesa_no_existe') {
      alert(`⛔ MESA NO ENCONTRADA\n\nLa Mesa ${numStr} no existe en el sistema.\n\nSolo administradores pueden crear mesas nuevas.`);
    }
    else {
      const errorMsg = data?.message || error.message || 'Error desconocido';
      alert(`❌ Error al procesar la mesa:\n${errorMsg}`);
    }
  } finally {
    setCargandoPedido(false);
  }
};

// ... resto del código existente ...

  // --- ACCIONES DE BOTONES DE TARJETA ---
  const handleImprimirCuenta = async (e, pedido) => {
      e.stopPropagation();
      setPedidoParaPreCuenta(pedido);
      setShowPreCuenta(true);
  };
  
  const handlePreCuentaFinalizada = (pedidoId) => {
      setIdsImpresos(prev => new Set(prev).add(pedidoId));
      cargarDatos();
  };

  const handleReimprimir = (e, pedido) => {
      e.stopPropagation();
      if(window.confirm(`¿Reimprimir ticket Mesa ${pedido.mesa?.numero}?`)) printerService.imprimirTicket(pedido);
  };

  const handleAbrirPagar = async (e, pedidoSimple) => {
      e.stopPropagation();
      if (!puedeCobrar()) return alert("⛔ PERMISO DENEGADO\nSolo Cajeros/Admins pueden cobrar.");
      setCargandoPedido(true);
      try {
          const res = await menuApi.getPedidoById(pedidoSimple.id);
          const pedidoFull = res.data || res;
          if (pedidoFull.estado !== 'pagando' && !idsImpresos.has(pedidoFull.id)) {
              if (window.confirm(`⚠️ Cuenta no impresa. ¿Imprimir pre-cuenta?`)) {
                  setPedidoParaPreCuenta(pedidoFull); setShowPreCuenta(true); return;
              }
          }
          setPedidoParaPagar(pedidoFull); setShowModalPagar(true);
      } catch (e) { console.error(e); } finally { setCargandoPedido(false); }
  };

  const handleVerPedido = async (e, pedidoSimple) => {
      e.stopPropagation(); setCargandoPedido(true);
      try { const res = await menuApi.getPedidoById(pedidoSimple.id); setPedidoParaVer(res.data || res); setShowModalVer(true); } 
      catch (e) { console.error(e); } finally { setCargandoPedido(false); }
  };

  const handlePagoExitoso = async (datosPago) => {
      try {
          await menuApi.pagarPedido(pedidoParaPagar.id, datosPago);
          if (window.confirm("✅ Pago exitoso. ¿Imprimir comprobante?")) printerService.imprimirTicket({ ...pedidoParaPagar, estado: 'pagado' });
          setShowModalPagar(false); setPedidoParaPagar(null); cargarDatos(); 
      } catch (e) { alert("Error al registrar pago."); }
  };

  const handleClosePedido = () => { setShowTomarPedido(false); setMesaSeleccionadaObj(null); setPedidoExistente(null); cargarDatos(); };
  
  // --- TECLADO Y SALIDA ---
  const handleDigit = (d) => { if (selectedMesaNum.length < 4) setSelectedMesaNum(p => p + d); };
  const handleBackspace = () => setSelectedMesaNum(p => p.slice(0, -1));
  const handleClear = () => setSelectedMesaNum('');
  const handleOk = () => handleProcesarMesa(selectedMesaNum);
  const handleClicMesaGrid = (mesa) => handleProcesarMesa(mesa.numero);
  
  const handleIrAlDashboard = () => navigate('/');
  const handleSalirApp = () => { if(onLogout) onLogout(); navigate('/login'); };

  const BotonMenu = ({ icon, label, onClick, color = "text-gray-600", className }) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-white border rounded-xl hover:bg-gray-50 shadow-sm active:scale-95 transition-all ${className}`}>
        <span className={`text-xl md:text-2xl mb-1 ${color}`}>{icon}</span>
        <span className={`text-[9px] md:text-[10px] font-bold uppercase ${color}`}>{label}</span>
    </button>
  );

  const BotonTeclado = ({ label, onClick, className }) => (<button onClick={onClick} className={`text-2xl font-bold rounded-xl shadow-sm flex items-center justify-center h-14 md:h-16 active:scale-95 transition-all ${className || 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-200'}`}>{label}</button>);
  
  const getColorFondo = (estado) => { if(estado === 'pagando') return '#fff3e0'; return '#e8f5e9'; };
  const getColorBorde = (estado) => { if(estado === 'pagando') return '#ffb74d'; return '#ef5350'; };

  const mesasGrid = pedidosActivos.sort((a, b) => {
      if (a.estado === 'pagando' && b.estado !== 'pagando') return -1;
      if (a.estado !== 'pagando' && b.estado === 'pagando') return 1;
      return (parseInt(a.mesa?.numero) || 0) - (parseInt(b.mesa?.numero) || 0);
  });

  return (
    <div className="flex flex-col h-screen bg-slate-100 p-2 font-sans">
      
      {/* HEADER */}
      <div className="flex justify-between gap-2 mb-2">
        <div className="flex gap-2 items-center">
            
            <div className="md:hidden">
                 <BotonMenu icon={<LogOut/>} label="Salir" onClick={handleSalirApp} color="text-red-600" />
            </div>

            <div className="hidden md:block">
                 {(esAdmin || esCajero) && (
                     <BotonMenu icon={<Home/>} label="Inicio" onClick={handleIrAlDashboard} color="text-blue-600" />
                 )}
            </div>

            <BotonMenu icon={<Eraser/>} label="Limpiar" onClick={handleClear} />
            
            <div className="flex flex-col justify-center px-4 bg-white rounded-xl shadow-sm border border-gray-200 min-w-[100px] md:min-w-[120px]">
                <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase">Usuario</span>
                <span className="font-bold text-sm md:text-base text-blue-900 truncate max-w-[80px] md:max-w-none">{nombreUsuario}</span>
                <span className="text-[9px] md:text-[10px] text-gray-400 truncate">{rolUsuario}</span>
            </div>
        </div>

        {/* INFO SALÓN */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-blue-200 flex flex-col md:flex-row items-center justify-center md:justify-between px-2 md:px-6">
            <div className="text-center md:text-left">
                <h2 className="text-sm md:text-lg font-black text-gray-800">SALÓN</h2>
                <p className="text-[10px] md:text-xs text-gray-500 font-bold flex items-center justify-center md:justify-start gap-1">
                    <Utensils size={10} className="hidden md:block"/> {nombreCarta}
                </p>
            </div>
            <div className="hidden md:block text-right">
                <p className="text-2xl font-light text-gray-700">{currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1 gap-2 overflow-hidden">
        
        {/* PANEL IZQUIERDO: GRID MESAS */}
        <div className="flex-1 md:flex-[3] bg-white rounded-xl shadow-sm p-2 md:p-3 flex flex-col overflow-hidden border border-gray-200 relative">
          <div className="mb-2 flex justify-between items-center border-b pb-1">
             <h3 className="font-bold text-gray-500 uppercase text-xs tracking-wider">Activas ({mesasGrid.length})</h3>
             <div className="flex gap-2 text-[9px] md:text-[10px] font-bold uppercase">
                 <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Ocupada</span>
                 <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400"></span> Pagando</span>
             </div>
          </div>

          {mesasGrid.length === 0 ? (
             <div className="flex-1 flex flex-col items-center justify-center text-gray-300"><Utensils size={48} className="mb-2"/><p className="text-sm">Todo libre</p></div>
          ) : (
             <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 content-start">
                    {mesasGrid.map(p => {
                        const esPagando = p.estado === 'pagando';
                        const colorFondo = getColorFondo(p.estado);
                        const colorBorde = getColorBorde(p.estado);
                        
                        let totalNum = parseFloat(p.total);
                        if (isNaN(totalNum) || (totalNum === 0 && (p.items?.length > 0 || p.combos?.length > 0))) {
                             const sumaItems = p.items?.reduce((acc, it) => acc + (parseFloat(it.precio_unitario) * parseFloat(it.cantidad)), 0) || 0;
                             const sumaCombos = p.combos?.reduce((acc, cb) => acc + (parseFloat(cb.precio_unitario) * parseFloat(cb.cantidad)), 0) || 0;
                             totalNum = sumaItems + sumaCombos;
                        }
                        totalNum = totalNum || 0;
                        const totalFmt = Math.round(totalNum).toLocaleString('es-CL');
                        const infoTiempo = getInfoTiempo(p.fecha_hora || p.horaPedido);

                        // ✅ VERIFICAR SI LA MESA ES AJENA (solo para el grid visual, la validación real se hace al clickear)
                        const idMozoPedido = p.id_mozo || p.mozo?.id;
                        const esMesaAjena = esMozo && Number(idMozoPedido) !== Number(usuario.id);

                        return (
                        <div 
                            key={p.id}
                            onClick={() => handleClicMesaGrid(p.mesa)}
                            className={`aspect-[4/5] rounded-lg border flex flex-col relative shadow-sm cursor-pointer hover:shadow-md transition-all overflow-hidden group ${infoTiempo.alerta ? 'ring-4 ring-red-400' : ''} ${esMesaAjena ? 'opacity-80' : ''}`}
                            style={{ backgroundColor: colorFondo, borderColor: colorBorde, borderWidth: '2px' }}
                        >
                            {/* ✅ INDICADOR VISUAL DE BLOQUEO */}
                            {esMesaAjena && (
                                <div className="absolute top-1 right-1 z-10 text-red-500 bg-white/80 rounded-full p-0.5">
                                    <Lock size={14} />
                                </div>
                            )}

                            <div className={`flex justify-between items-center p-1 ${infoTiempo.bg}`}>
                                <span className={`text-[10px] font-bold flex items-center gap-0.5 ${infoTiempo.color}`}>
                                    <Clock size={10}/> {infoTiempo.texto}
                                </span>
                                {p.cantidad_comensales > 0 && (
                                    <span className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5"><Users size={10}/> {p.cantidad_comensales}</span>
                                )}
                                <button onClick={(e)=>handleVerPedido(e, p)} className="text-gray-500 hover:text-blue-600"><Eye size={12}/></button>
                            </div>
                            
                            <div className="flex-1 flex items-center justify-center bg-white/30">
                                <span className={`text-3xl font-black ${esPagando ? 'text-orange-600' : 'text-red-700'}`}>{p.mesa?.numero || '?'}</span>
                            </div>
                            
                            <div className="flex flex-col text-center pb-1 px-1 gap-0.5">
                                <span className="text-[9px] font-bold text-gray-600 uppercase truncate">{p.mozo?.nombre_completo?.split(' ')[0] || 'Mozo'}</span>
                                <div className="text-xs font-black text-gray-800 bg-white/50 rounded py-0.5">${totalFmt}</div>
                            </div>

                            <div className="flex border-t border-gray-300 h-8">
                                {esPagando ? (
                                    <>
                                        <button onClick={(e)=>handleReimprimir(e, p)} className="w-1/3 bg-orange-100 hover:bg-orange-200 text-orange-700 flex justify-center items-center border-r border-orange-200"><Printer size={14}/></button>
                                        <button onClick={(e)=>handleAbrirPagar(e, p)} className="w-2/3 bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] flex justify-center items-center gap-1"><DollarSign size={12}/> COBRAR</button>
                                    </>
                                ) : (
                                    <button onClick={(e)=>handleImprimirCuenta(e, p)} className="w-full bg-white hover:bg-gray-50 text-gray-700 font-bold text-[10px] flex justify-center items-center gap-1 uppercase tracking-wide"><Printer size={14}/> CUENTA</button>
                                )}
                            </div>
                        </div>
                    )})}
                </div>
             </div>
          )}
        </div>

        {/* PANEL DERECHO: TECLADO */}
        <div className="flex flex-col bg-white rounded-xl shadow-sm p-3 border border-gray-200 min-w-[280px] w-full md:w-auto h-auto md:h-auto md:flex-1 overflow-y-auto flex-shrink-0">
            <div className="mb-2 relative">
                <input type="text" value={selectedMesaNum} readOnly className="w-full h-14 text-4xl text-center border-2 rounded-xl font-mono font-bold bg-blue-50 text-blue-900 outline-none" placeholder="#" />
                {selectedMesaNum && <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 p-2"><X size={24}/></button>}
            </div>
            <div className="grid grid-cols-3 gap-2 flex-1 min-h-[250px]">
                {[7,8,9,4,5,6,1,2,3].map(n => <BotonTeclado key={n} label={n} onClick={() => handleDigit(n)} />)}
                <BotonTeclado label={<Eraser size={24}/>} onClick={handleBackspace} className="bg-orange-50 text-orange-600 border-orange-200" />
                <BotonTeclado label="0" onClick={() => handleDigit(0)} />
                <BotonTeclado label={cargandoPedido ? "..." : "ABRIR MESA"} onClick={handleOk} className="col-span-3 bg-blue-600 text-white hover:bg-blue-700 shadow-md rounded-xl font-bold text-xl active:scale-95 transition-all flex items-center justify-center h-16" />
            </div>
        </div>
      </div>

      {/* RENDERIZADO DE MODALES */}
      {showTomarPedido && (
        <div className="fixed inset-0 z-[1000] bg-black/60 flex items-center justify-center p-0 md:p-4 backdrop-blur-sm">
            <div className="bg-white w-full h-full md:rounded-2xl overflow-hidden shadow-2xl">
                <TomarPedidoManager
                    key={pedidoExistente?.id || mesaSeleccionadaObj?.numero || 'new'} 
                    usuario={usuario}
                    onVolver={handleClosePedido}
                    tipoPedido="mesa"
                    mesa={mesaSeleccionadaObj} 
                    pedidoExistente={pedidoExistente} 
                    onPedidoCreado={handleClosePedido}
                />
            </div>
        </div>
      )}
      {showModalPagar && pedidoParaPagar && (
        <ModalPagoUniversal pedido={pedidoParaPagar} onCerrar={() => { setShowModalPagar(false); setPedidoParaPagar(null); }} onPagoExitoso={handlePagoExitoso}/>
      )}
      {showPreCuenta && pedidoParaPreCuenta && (
          <ModalPreCuenta pedido={pedidoParaPreCuenta} onCerrar={() => { setShowPreCuenta(false); setPedidoParaPreCuenta(null); }} onImpreso={handlePreCuentaFinalizada}/>
      )}
      {showModalVer && pedidoParaVer && (
          <div className="fixed inset-0 bg-black/60 z-[1100] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                  <div className="bg-gray-100 p-3 border-b flex justify-between items-center"><h3 className="font-bold text-lg flex items-center gap-2"><FileText size={18}/> Pedido #{pedidoParaVer.id}</h3><button onClick={()=>setShowModalVer(false)} className="p-1 rounded hover:bg-gray-200"><X size={20}/></button></div>
                  <div className="p-4 flex-1 overflow-y-auto bg-white">
                      <div className="mb-4 text-center"><p className="text-3xl font-black text-gray-800">Mesa {pedidoParaVer.mesa?.numero}</p><p className="text-xs text-gray-500 uppercase">{pedidoParaVer.mozo?.nombre_completo}</p></div>
                      <div className="space-y-1">{pedidoParaVer.items?.map((it, i) => (<div key={i} className="flex justify-between text-xs border-b border-dashed pb-1"><span>{it.cantidad}x {it.producto?.nombre}</span><span className="font-mono font-bold">${Math.round(it.precio_unitario * it.cantidad).toLocaleString('es-CL')}</span></div>))}</div>
                  </div>
                  <div className="p-4 bg-gray-50 border-t flex justify-between items-center"><span className="font-bold text-gray-600">Total</span><span className="text-2xl font-bold text-emerald-600">${Math.round(pedidoParaVer.total).toLocaleString('es-CL')}</span></div>
              </div>
          </div>
      )}
    </div>
  );
}
