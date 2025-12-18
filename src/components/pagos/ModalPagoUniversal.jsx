import React, { useState, useEffect, useMemo } from 'react';
import { menuApi } from '../../api/menuApi'; 
import cajaService from '../../services/cajaService'; 
import axios from '../../api/axiosInstance'; // ✅ Importación correcta de Axios
import { 
  X, DollarSign, CreditCard, Wallet, Percent, Gift, Lock, CheckCircle, Delete, Eraser, Inbox, ShieldCheck, HandCoins
} from 'lucide-react';

export default function ModalPagoUniversal({ pedido, onCerrar, onPagoExitoso }) {
  
  // --- ESTADOS DE CARGA Y DATOS ---
  const [loading, setLoading] = useState(false);
  const [formasPago, setFormasPago] = useState([]);
  
  // --- ESTADOS CAJA ---
  const [sesionCaja, setSesionCaja] = useState(null); 
  const [nombreCaja, setNombreCaja] = useState('');
  const [listaSesiones, setListaSesiones] = useState([]); 
  const [sesionSeleccionadaId, setSesionSeleccionadaId] = useState(''); 
  const [esMiCaja, setEsMiCaja] = useState(false); 

  // --- ESTADOS MONTOS ---
  const totalOriginal = Math.round(parseFloat(pedido.total));
  
  // Inicialización inteligente desde Pre-Cuenta
  const descuentoPrevio = parseFloat(pedido.descuento || 0);
  const propinaPrevia = parseFloat(pedido.propina || 0);

  const [descuento, setDescuento] = useState(descuentoPrevio); 
  const [tipoDescuento, setTipoDescuento] = useState('$'); 
  const [showDescuentoInput, setShowDescuentoInput] = useState(descuentoPrevio > 0);
  
  // ESTADOS PROPINA
  const [propina, setPropina] = useState(propinaPrevia); 
  const [aplicaPropina10, setAplicaPropina10] = useState(propinaPrevia === 0);
  
  // Estado: Propina Directa (Mano a Mano)
  const [propinaDirecta, setPropinaDirecta] = useState(false);

  // --- PAGO MÚLTIPLE ---
  const [metodosSeleccionados, setMetodosSeleccionados] = useState([]);
  const [metodoActual, setMetodoActual] = useState(null); 
  const [esEfectivoActual, setEsEfectivoActual] = useState(false); 

  // --- TECLADO ---
  const [activeInput, setActiveInput] = useState('monto'); 
  const [inputValue, setInputValue] = useState(''); 

  // --- MODAL PIN ---
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinAdmin, setPinAdmin] = useState('');

  // 1. CARGA INICIAL
  useEffect(() => {
    async function init() {
      try {
        const [formas, estadoPersonal, sesionesGlobales] = await Promise.all([
           menuApi.getFormasPago ? menuApi.getFormasPago() : Promise.resolve([]),
           cajaService.getEstadoUsuario().catch(() => ({ estado: 'cerrada' })),
           cajaService.getSesionesActivas().catch(() => ({ data: [] }))
        ]);

        // Procesar Formas de Pago
        const listaFormas = Array.isArray(formas) ? formas : (formas.data || []);
        setFormasPago(listaFormas);
        
        // Procesar Sesiones de Caja
        const listaGlobal = Array.isArray(sesionesGlobales) ? sesionesGlobales : (sesionesGlobales.data || []);
        setListaSesiones(listaGlobal); 

        // Lógica de Selección de Caja Automática
        if (estadoPersonal.estado === 'abierta' && estadoPersonal.data) {
             const idCaja = estadoPersonal.data.id || estadoPersonal.data.sesion_id;
             setSesionCaja(idCaja);
             setSesionSeleccionadaId(idCaja);
             setNombreCaja("Mi Caja (Abierta)");
             setEsMiCaja(true); 
        } 
        else if (listaGlobal.length > 0) {
             const primeraCaja = listaGlobal[0];
             setSesionCaja(primeraCaja.id);
             setSesionSeleccionadaId(primeraCaja.id);
             setNombreCaja(`${primeraCaja.nombre_caja} (${primeraCaja.usuario})`);
             setEsMiCaja(false); 
        } else {
             setSesionCaja(null);
             setSesionSeleccionadaId('');
             setEsMiCaja(false);
        }
        
        // Seleccionar Efectivo por defecto
        if (listaFormas.length > 0) {
            const efectivo = listaFormas.find(f => f.nombre.toLowerCase().includes('efectivo'));
            if (efectivo) {
                setMetodoActual(efectivo.id);
                setEsEfectivoActual(true);
            }
        }
      } catch (e) { console.error("Error init modal:", e); }
    }
    init();
  }, []);

  // 2. CÁLCULO DE TOTALES (Memoizado)
  const { montoDescuento, subtotalConDesc, montoPropina, totalFinal } = useMemo(() => {
      let descVal = 0;
      const descInput = parseFloat(descuento) || 0;
      
      if (tipoDescuento === '%') {
          descVal = Math.round(totalOriginal * (descInput / 100));
      } else {
          descVal = descInput;
      }
      
      // Subtotal = Consumo - Descuento
      const sub = Math.max(0, totalOriginal - descVal);

      let propVal = 0;
      
      if (propinaDirecta) {
          propVal = 0; 
      } else if (aplicaPropina10) {
          propVal = Math.round(sub * 0.10);
      } else {
          propVal = parseFloat(propina) || 0;
      }

      return { 
          montoDescuento: descVal, 
          subtotalConDesc: sub,
          montoPropina: propVal,
          totalFinal: sub + propVal 
      };
  }, [totalOriginal, descuento, tipoDescuento, propina, aplicaPropina10, propinaDirecta]);

  // Sincronizar teclado con Input Activo
  useEffect(() => {
      if (activeInput === 'monto') {
          const pagado = metodosSeleccionados.reduce((acc, curr) => acc + curr.monto, 0);
          const restante = Math.max(0, totalFinal - pagado);
          setInputValue(restante > 0 ? String(restante) : '');
      } else if (activeInput === 'descuento') {
          setInputValue(String(descuento === 0 ? '' : descuento));
      } else if (activeInput === 'propina') {
          setInputValue(String(propina === 0 ? '' : propina));
      }
  }, [activeInput, totalFinal, metodosSeleccionados]); 

  // --- Handlers Teclado ---
  const handleDigit = (digit) => { const n = inputValue + digit; setInputValue(n); actualizarEstadoSegunInput(n); };
  const handleBackspace = () => { const n = inputValue.slice(0, -1); setInputValue(n); actualizarEstadoSegunInput(n); };
  const handleClear = () => { setInputValue(''); actualizarEstadoSegunInput(''); };
  
  const actualizarEstadoSegunInput = (val) => {
      const num = parseFloat(val) || 0;
      if (activeInput === 'descuento') setDescuento(num);
      else if (activeInput === 'propina') setPropina(num);
  };

  // --- Handlers Descuento ---
  const handleSolicitarDescuento = () => {
      if (showDescuentoInput) { setShowDescuentoInput(false); setDescuento(0); setActiveInput('monto'); } 
      else { setShowPinModal(true); setPinAdmin(''); }
  };

  const validarPinAdmin = async () => {
      try {
          const response = await axios.post('/auth/validar-admin', { pin: pinAdmin });
          if (response.data.success) {
              setShowPinModal(false); setShowDescuentoInput(true); setActiveInput('descuento'); setInputValue('');
          }
      } catch (error) {
          const msg = error.response?.data?.message || "Error al validar PIN.";
          alert("⛔ " + msg);
      }
  };

  // --- Handlers Propina ---
  const togglePropinaDirecta = (e) => {
      const checked = e.target.checked;
      setPropinaDirecta(checked);
      if (checked) {
          setAplicaPropina10(false);
          setPropina(0);
          setActiveInput('monto');
      } else {
          setAplicaPropina10(true);
      }
  };

  // --- Handlers Métodos Pago ---
  const seleccionarMetodo = (id) => {
      setMetodoActual(id);
      const forma = formasPago.find(f => String(f.id) === String(id));
      setEsEfectivoActual(forma && forma.nombre.toLowerCase().includes('efectivo'));
      setActiveInput('monto');
      // Recalcular restante para input
      const pagado = metodosSeleccionados.reduce((acc, curr) => acc + curr.monto, 0);
      setInputValue(String(Math.max(0, totalFinal - pagado)));
  };

  const agregarMetodoPago = () => {
      if (!metodoActual) return alert("Seleccione forma de pago.");
      const monto = parseFloat(inputValue) || 0;
      if (monto <= 0) return alert("Monto inválido.");

      const formaObj = formasPago.find(f => String(f.id) === String(metodoActual));
      
      setMetodosSeleccionados([...metodosSeleccionados, {
          forma_pago_id: parseInt(metodoActual),
          nombre_forma: formaObj?.nombre || 'Otro',
          monto: monto,
          caja_sesion_id: (formaObj?.nombre.toLowerCase().includes('efectivo')) ? parseInt(sesionSeleccionadaId) : null
      }]);
      
      setActiveInput('monto');
      setInputValue(''); 
  };

  const eliminarMetodo = (idx) => { setMetodosSeleccionados(prev => prev.filter((_, i) => i !== idx)); };

  // --- CONFIRMAR PAGO FINAL ---
  const handleConfirmarPago = () => {
      let pagosFinales = [...metodosSeleccionados];
      
      // Si no hay pagos agregados, usar el input actual como pago único
      if (pagosFinales.length === 0) {
          if (!metodoActual) return alert("Seleccione forma de pago.");
          const monto = parseFloat(inputValue) || totalFinal;
          const formaObj = formasPago.find(f => String(f.id) === String(metodoActual));
          
          if (esEfectivoActual && !sesionSeleccionadaId) return alert("⚠️ Seleccione una caja para el efectivo.");

          pagosFinales.push({ 
              forma_pago_id: parseInt(metodoActual), 
              nombre_forma: formaObj?.nombre, 
              monto,
              caja_sesion_id: esEfectivoActual ? parseInt(sesionSeleccionadaId) : null
          });
      }

      const totalIngresado = pagosFinales.reduce((sum, p) => sum + p.monto, 0);
      const restante = totalFinal - totalIngresado;

      // Tolerancia de $10 pesos
      if (totalIngresado < totalFinal - 10) return alert(`Faltan $${restante.toLocaleString()} por cubrir.`);
      
      const vuelto = Math.abs(Math.min(0, restante));

      const datosPago = {
          total_pagado: totalIngresado - vuelto,
          vuelto: vuelto,
          pagos: pagosFinales,
          descuento: tipoDescuento === '%' ? Math.round(totalOriginal * (descuento/100)) : parseInt(descuento),
          propina: montoPropina, 
          caja_sesion_id: sesionSeleccionadaId ? parseInt(sesionSeleccionadaId) : null 
      };

      onPagoExitoso(datosPago);
  };

  // Cálculos Visuales
  const totalPagadoAcumulado = metodosSeleccionados.reduce((acc, curr) => acc + curr.monto, 0);
  const restanteVisual = totalFinal - totalPagadoAcumulado;
  const vueltoCalculado = restanteVisual < 0 ? Math.abs(restanteVisual) : 0;
  
  // --- COMPONENTE TECLADO ---
  const NumPad = () => (
      <div className="grid grid-cols-3 gap-3 h-full">
          {[7,8,9,4,5,6,1,2,3].map(n => 
            <button key={n} onClick={()=>handleDigit(n.toString())} className="bg-white hover:bg-slate-100 text-slate-700 font-bold text-3xl rounded-xl shadow-md border border-gray-200 active:scale-95 transition-all h-16">{n}</button>
          )}
          <button onClick={handleClear} className="bg-red-50 text-red-600 font-bold text-xl rounded-xl hover:bg-red-100 active:scale-95 shadow-sm border border-red-100"><Eraser/></button>
          <button onClick={()=>handleDigit('0')} className="bg-white text-slate-700 font-bold text-3xl rounded-xl hover:bg-slate-100 active:scale-95 shadow-md border border-gray-200">0</button>
          <button onClick={handleBackspace} className="bg-orange-50 text-orange-600 font-bold text-xl rounded-xl hover:bg-orange-100 active:scale-95 shadow-sm border border-orange-100"><Delete/></button>
      </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 z-[1300] flex items-center justify-center p-2 backdrop-blur-sm">
      <div className="bg-white w-full max-w-7xl h-[95vh] rounded-2xl shadow-2xl flex overflow-hidden">
        
        {/* COL 1: RESUMEN DETALLADO (30%) */}
        <div className="w-[30%] bg-gray-50 border-r border-gray-200 flex flex-col p-6 font-mono relative">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-gray-800 font-sans uppercase tracking-wide">Resumen</h2>
                <button onClick={onCerrar} className="md:hidden bg-gray-200 p-2 rounded-full"><X size={20}/></button>
            </div>
            
            <div className="space-y-4 text-sm flex-1">
                
                {/* 1. TOTAL CONSUMO */}
                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                    <span className="text-gray-500 font-bold uppercase text-xs">Total Consumo</span>
                    <span className="font-bold text-gray-800 text-lg">${totalOriginal.toLocaleString()}</span>
                </div>
                
                {/* 2. DESCUENTO */}
                <div className={`p-3 rounded-lg border transition-all cursor-pointer shadow-sm ${activeInput==='descuento' ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
                     onClick={() => { if(showDescuentoInput) setActiveInput('descuento'); else handleSolicitarDescuento(); }}>
                    <div className="flex justify-between items-center text-red-600">
                        <span className="font-bold flex gap-2 items-center text-xs uppercase">
                            {showDescuentoInput ? <Lock size={14}/> : <Percent size={14}/>} Descuentos
                        </span>
                        <span className="font-bold text-lg">
                            {montoDescuento > 0 ? `-$ ${montoDescuento.toLocaleString()}` : '$ 0'}
                        </span>
                    </div>
                </div>

                {/* 3. SUBTOTAL */}
                <div className="flex justify-between items-center px-2 py-2 border-t border-dashed border-gray-300">
                    <span className="text-gray-400 font-bold text-xs uppercase">Subtotal</span>
                    <span className="font-black text-gray-600 text-lg">${subtotalConDesc.toLocaleString()}</span>
                </div>

                {/* 4. PROPINA */}
                <div className={`p-3 rounded-lg border transition-all cursor-pointer shadow-sm ${activeInput==='propina' && !propinaDirecta ? 'border-green-500 ring-2 ring-green-100 bg-green-50' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
                     onClick={() => { if(!propinaDirecta) { setAplicaPropina10(false); setActiveInput('propina'); setInputValue(''); } }}>
                    
                    <div className="flex justify-between items-center text-green-700">
                        <span className="font-bold flex gap-2 items-center text-xs uppercase"><Gift size={14}/> Propina (10%)</span>
                        <span className={`font-bold text-lg ${propinaDirecta ? 'text-gray-400 line-through' : ''}`}>
                            +$ {montoPropina.toLocaleString()}
                        </span>
                    </div>

                    <div className="flex flex-col gap-2 mt-3 pt-2 border-t border-dashed border-green-200">
                         <div className="flex justify-between items-center">
                             <span className="text-[10px] font-bold text-gray-400 uppercase">Automático</span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); if(!propinaDirecta) { setAplicaPropina10(!aplicaPropina10); if(!aplicaPropina10) setActiveInput('monto'); } }}
                                disabled={propinaDirecta}
                                className={`text-[10px] px-3 py-1 rounded-full font-bold transition-colors ${aplicaPropina10 && !propinaDirecta ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'}`}
                            >
                                {aplicaPropina10 ? 'ACTIVADO' : 'OFF'}
                            </button>
                         </div>

                         {/* CHECKBOX: DIRECTO AL MOZO */}
                         <div className="flex items-center gap-2 justify-between" onClick={(e)=>e.stopPropagation()}>
                             <label className="text-[10px] text-orange-600 font-bold cursor-pointer uppercase flex items-center gap-1" htmlFor="checkDirecto">
                                <HandCoins size={12}/> Mano a Mano
                             </label>
                             <input 
                                type="checkbox" 
                                id="checkDirecto" 
                                checked={propinaDirecta}
                                onChange={togglePropinaDirecta}
                                className="w-5 h-5 accent-orange-500 cursor-pointer"
                             />
                         </div>
                    </div>
                </div>

                {/* 5. TOTAL FINAL */}
                <div className="bg-slate-900 rounded-xl p-4 mt-auto shadow-lg text-white">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Final</span>
                        <span className="text-3xl font-black tracking-tight">${totalFinal.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Selector de Caja */}
            {esEfectivoActual && (
                <div className={`mt-4 p-3 rounded-xl border-2 ${esMiCaja ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                     <label className="text-[10px] font-black text-gray-500 uppercase mb-1 flex items-center gap-1"><Inbox size={12}/> Caja Destino</label>
                     {esMiCaja ? (
                         <div className="font-bold text-green-700 flex items-center gap-2 text-sm"><ShieldCheck size={16}/> {nombreCaja}</div>
                     ) : (
                         <select value={sesionSeleccionadaId} onChange={(e) => setSesionSeleccionadaId(e.target.value)} className="w-full text-xs p-2 rounded border border-orange-300 bg-white font-bold h-10">
                             {listaSesiones.length > 0 ? (
                                 listaSesiones.map(s => <option key={s.id} value={s.id}>{s.nombre_caja} ({s.usuario})</option>)
                             ) : <option value="">⛔ SIN CAJAS ABIERTAS</option>}
                         </select>
                     )}
                </div>
            )}
        </div>

        {/* COL 2: MÉTODOS Y LISTA (40%) */}
        <div className="w-[40%] bg-white p-6 flex flex-col border-r border-gray-100">
            <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest mb-4">Seleccionar Método</h3>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
                {formasPago.map(f => (
                    <button 
                        key={f.id} 
                        onClick={() => seleccionarMetodo(f.id)} 
                        className={`
                            h-20 rounded-xl border-2 flex flex-row items-center justify-center gap-3 transition-all active:scale-95
                            ${metodoActual === f.id 
                                ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md ring-2 ring-blue-100' 
                                : 'border-gray-100 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'}
                        `}
                    >
                        {f.nombre.toLowerCase().includes('efectivo') ? <DollarSign size={24}/> : <CreditCard size={24}/>}
                        <span className="font-bold text-sm uppercase">{f.nombre}</span>
                    </button>
                ))}
            </div>

            <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest mb-2">Pagos Ingresados</h3>
            <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 p-4 mb-4 overflow-y-auto shadow-inner">
                {metodosSeleccionados.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                        <Wallet size={48} strokeWidth={1.5} className="mb-2"/>
                        <p className="text-sm font-medium">Aún no hay pagos</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {metodosSeleccionados.map((m, i) => (
                            <div key={i} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-gray-100 animate-in slide-in-from-right">
                                <span className="font-bold text-gray-700 text-sm uppercase flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    {m.nombre_forma}
                                </span>
                                <div className="flex items-center gap-3">
                                    <span className="font-mono font-bold text-lg text-gray-800">${m.monto.toLocaleString()}</span>
                                    <button onClick={()=>eliminarMetodo(i)} className="bg-red-50 text-red-500 p-1.5 rounded-lg hover:bg-red-100 transition-colors"><X size={16}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="mt-auto bg-gray-900 text-white rounded-xl p-4 shadow-lg">
                <div className="flex justify-between items-end mb-2">
                    <p className="text-xs font-bold text-gray-400 uppercase">Saldo Restante</p>
                    <p className={`text-2xl font-black ${restanteVisual > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                        ${Math.max(0, restanteVisual).toLocaleString()}
                    </p>
                </div>
                <div className="w-full h-px bg-gray-700 my-2"></div>
                <div className="flex justify-between items-end">
                    <p className="text-xs font-bold text-emerald-400 uppercase">Vuelto a Entregar</p>
                    <p className="text-4xl font-black text-emerald-400">${vueltoCalculado.toLocaleString()}</p>
                </div>
            </div>
        </div>

        {/* COL 3: TECLADO Y ACCIONES (30%) */}
        <div className="w-[30%] bg-gray-50 p-6 flex flex-col shadow-inner">
            
            {/* Display Input */}
            <div 
                className={`mb-6 bg-white rounded-2xl border-2 p-4 text-right shadow-sm cursor-text transition-colors h-24 flex flex-col justify-center ${activeInput === 'monto' ? 'border-blue-500 ring-4 ring-blue-50' : 'border-gray-200'}`} 
                onClick={() => setActiveInput('monto')}
            >
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">
                    {activeInput === 'monto' ? `Monto a Pagar` : activeInput === 'descuento' ? 'Monto Descuento' : 'Monto Propina'}
                </p>
                <div className="text-4xl font-black text-slate-800 tracking-tight truncate">
                    {inputValue ? `$ ${parseInt(inputValue).toLocaleString()}` : '$ 0'}
                </div>
            </div>

            {/* Teclado */}
            <div className="flex-1">
                <NumPad />
            </div>

            {/* Botones Acción */}
            <div className="flex flex-col gap-3 mt-6">
                <button 
                    onClick={agregarMetodoPago} 
                    disabled={!metodoActual || restanteVisual <= 0} 
                    className="w-full py-4 bg-white border-2 border-blue-600 text-blue-600 rounded-xl font-black text-sm uppercase shadow-sm hover:bg-blue-50 active:scale-95 disabled:border-gray-300 disabled:text-gray-400 disabled:bg-gray-100 transition-all"
                >
                    + Agregar Pago Parcial
                </button>

                <div className="flex gap-3">
                    <button onClick={onCerrar} className="flex-1 py-4 bg-gray-200 border border-gray-300 text-gray-600 rounded-xl font-bold hover:bg-gray-300 active:scale-95 transition-all text-sm uppercase">
                        Cancelar
                    </button>
                    <button 
                        onClick={handleConfirmarPago} 
                        disabled={restanteVisual > 0} 
                        className={`flex-[2] py-4 rounded-xl font-black text-white shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 text-sm uppercase tracking-wide ${restanteVisual <= 0 ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700' : 'bg-gray-400 cursor-not-allowed shadow-none'}`}
                    >
                        <CheckCircle size={20}/> FINALIZAR
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Modal PIN Admin */}
      {showPinModal && (
        <div className="fixed inset-0 z-[1400] bg-black/80 flex items-center justify-center backdrop-blur-sm p-4">
            <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center animate-in zoom-in-95 border-4 border-red-100">
                <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-4 text-red-600 shadow-inner">
                    <Lock size={32}/>
                </div>
                <h3 className="text-2xl font-black text-gray-800 mb-2">PIN Administrador</h3>
                <p className="text-gray-500 text-sm mb-6">Se requiere autorización para aplicar descuentos.</p>
                
                <input 
                    type="password" 
                    autoFocus 
                    className="w-full text-center text-5xl font-mono border-b-4 border-gray-200 focus:border-red-500 outline-none pb-2 mb-8 tracking-[0.5em] text-gray-800 bg-transparent transition-colors" 
                    maxLength={4} 
                    value={pinAdmin} 
                    onChange={e => setPinAdmin(e.target.value)}
                />
                
                <div className="flex gap-3">
                    <button onClick={()=>setShowPinModal(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl bg-gray-50 border border-gray-200">Cancelar</button>
                    <button onClick={validarPinAdmin} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg active:scale-95 transition-all">Validar</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
