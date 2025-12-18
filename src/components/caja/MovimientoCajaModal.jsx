import React, { useState } from 'react';
import cajaService from '../../services/cajaService';
import printerService from '../../services/printerService';
import { X, DollarSign, FileText, ArrowUpCircle, ArrowDownCircle, Gift, Loader2, Printer, AlertTriangle } from 'lucide-react';

const MovimientoCajaModal = ({ isOpen, onClose, onMovimientoGuardado }) => {
    const [tipo, setTipo] = useState('egreso'); 
    const [monto, setMonto] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Estados para Propinas
    const [loadingPropinas, setLoadingPropinas] = useState(false);
    const [showConfirmPropina, setShowConfirmPropina] = useState(false);
    const [propinasData, setPropinasData] = useState(null);
    const [propinasPagadas, setPropinasPagadas] = useState(false);

    if (!isOpen) return null;

    // 1. OBTENER PROPINAS
    const handleCargarPropinas = async () => {
        setLoadingPropinas(true);
        try {
            const res = await cajaService.getPropinasAcumuladas();
            const data = res.data || res; // Asegurar data

            // ✅ CÁLCULO SEGURO: Usamos ?? 0 para evitar undefined
            const montoAPagar = (data.propinas_pendientes ?? data.total_propinas ?? 0);

            if (montoAPagar === 0) {
                // Verificar si es porque ya se pagó todo
                const generado = data.resumen_calculo?.total_generado || 0;
                const pagado = data.resumen_calculo?.total_pagado || 0;

                if (generado > 0 && pagado >= generado) {
                    alert(`✅ Al día: Ya se han pagado todas las propinas generadas.\n\nGenerado: $${generado.toLocaleString()}\nPagado: $${pagado.toLocaleString()}`);
                } else {
                    alert("No hay propinas acumuladas por ventas en esta sesión.");
                }
                setLoadingPropinas(false);
                return;
            }

            // Guardamos en el estado asegurando el monto a pagar
            setPropinasData({ ...data, montoAPagar });
            setShowConfirmPropina(true); 

        } catch (error) {
            console.error("Error propinas:", error);
            alert("Error al obtener información de propinas.");
        } finally {
            setLoadingPropinas(false);
        }
    };

    // 2. CONFIRMAR PAGO
    const handleConfirmarPagoPropinas = async () => {
        if (!propinasData) return;

        setLoading(true);
        try {
            // ✅ Validamos que el monto sea un número válido
            const montoFinal = parseFloat(propinasData.montoAPagar) || 0;

            const datosMovimiento = {
                tipo: 'egreso',
                categoria: 'retiro_propinas',
                monto: montoFinal,
                descripcion: `Pago de Propinas`
            };
            
            await cajaService.registrarMovimiento(datosMovimiento);

            // Imprimir (opcional)
            try {
                 await printerService.imprimirReportePropinas({
                    total: montoFinal,
                    fecha: new Date().toLocaleString(),
                    mozos: propinasData.detalle_mozos || []
                });
            } catch (e) { console.error("Error impresión:", e); }
            
            alert("✅ Propinas pagadas correctamente.");
            setPropinasPagadas(true);
            setShowConfirmPropina(false);
            if (onMovimientoGuardado) onMovimientoGuardado();

        } catch (error) {
            alert("Error: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    // 3. GUARDAR MOVIMIENTO MANUAL
    const handleSubmitManual = async (e) => {
        e.preventDefault();
        if (!monto || parseFloat(monto) <= 0) return alert("Ingrese un monto válido.");
        if (!descripcion.trim()) return alert("La descripción es obligatoria.");

        setLoading(true);
        try {
            const datos = {
                tipo: tipo,
                categoria: tipo === 'egreso' ? 'gasto_menor' : 'ajuste_entrada', 
                monto: parseFloat(monto),
                descripcion: descripcion
            };

            await cajaService.registrarMovimiento(datos);
            
            alert(`✅ Movimiento registrado correctamente.`);
            if (onMovimientoGuardado) onMovimientoGuardado();
            onClose();
            
            setMonto('');
            setDescripcion('');
            setTipo('egreso');

        } catch (error) {
            alert("Error: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1200] backdrop-blur-sm p-4">
            
            {/* --- MODAL PRINCIPAL --- */}
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 relative">
                
                {/* Header */}
                <div className={`p-4 flex justify-between items-center ${tipo === 'egreso' ? 'bg-red-600' : 'bg-green-600'}`}>
                    <h2 className="text-white font-bold text-lg flex items-center gap-2">
                        {tipo === 'egreso' ? <ArrowDownCircle/> : <ArrowUpCircle/>}
                        {tipo === 'egreso' ? 'Registrar Salida' : 'Registrar Entrada'}
                    </h2>
                    <button onClick={onClose} className="text-white hover:bg-white/20 p-1 rounded-full"><X size={20}/></button>
                </div>

                <div className="p-6 space-y-4">
                    
                    {/* Botones de Acceso Rápido */}
                    <div className="flex gap-2 mb-2">
                        <button 
                            type="button"
                            onClick={handleCargarPropinas}
                            disabled={loadingPropinas || propinasPagadas}
                            className={`flex-1 border py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors
                                ${propinasPagadas 
                                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                                    : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                                }
                            `}
                        >
                            {loadingPropinas ? <Loader2 className="animate-spin" size={14}/> : <Gift size={14}/>}
                            {propinasPagadas ? 'PROPINAS PAGADAS' : 'PAGAR PROPINAS'}
                        </button>
                    </div>

                    {/* Formulario Manual */}
                    <form onSubmit={handleSubmitManual} className="space-y-4">
                        
                        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                            <button type="button" onClick={() => setTipo('egreso')} className={`flex-1 py-2 rounded-md font-bold text-sm transition-all ${tipo === 'egreso' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'}`}>SALIDA</button>
                            <button type="button" onClick={() => setTipo('ingreso')} className={`flex-1 py-2 rounded-md font-bold text-sm transition-all ${tipo === 'ingreso' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'}`}>ENTRADA</button>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Monto</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                                <input type="number" autoFocus value={monto} onChange={(e) => setMonto(e.target.value)} className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-xl font-bold text-gray-800 focus:border-blue-500 outline-none" placeholder="0"/>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Motivo / Descripción</label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 text-gray-400" size={18}/>
                                <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-500 outline-none resize-none" rows="3" placeholder="Descripción del movimiento..."></textarea>
                            </div>
                        </div>

                        <div className="pt-2 flex gap-3">
                            <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200">Cancelar</button>
                            <button type="submit" disabled={loading} className={`flex-1 py-3 text-white font-bold rounded-xl shadow-lg transition-colors ${tipo === 'egreso' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
                                {loading ? 'Guardando...' : 'CONFIRMAR'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* --- MODAL CONFIRMACIÓN DE PROPINAS (BLINDADO) --- */}
            {showConfirmPropina && propinasData && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-[1300] backdrop-blur-sm p-6 rounded-xl">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="text-center mb-4">
                            <div className="bg-purple-100 text-purple-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Gift size={24}/>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">Pago de Propinas</h3>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 text-sm">
                            
                            {/* 📊 DESGLOSE MATEMÁTICO SEGURO */}
                            <div className="flex justify-between text-gray-500 mb-1">
                                <span>Total Generado (Ventas):</span>
                                {/* ✅ Usamos || 0 para evitar el crash */}
                                <span>${(propinasData.resumen_calculo?.total_generado || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-red-400 mb-2 pb-2 border-b border-gray-200">
                                <span>(-) Ya Retirado:</span>
                                <span>-${(propinasData.resumen_calculo?.total_pagado || 0).toLocaleString()}</span>
                            </div>

                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-800 font-bold uppercase">A Pagar Ahora:</span>
                                {/* ✅ BLINDAJE PRINCIPAL DEL ERROR */}
                                <span className="text-2xl font-black text-purple-700">
                                    ${(propinasData.montoAPagar || 0).toLocaleString()}
                                </span>
                            </div>
                            
                            {!propinasData.alcanza && (
                                <div className="mt-2 bg-yellow-50 text-yellow-800 text-xs p-2 rounded border border-yellow-200 flex gap-2 items-start">
                                    <AlertTriangle size={16} className="shrink-0 mt-0.5"/>
                                    <span>
                                        Efectivo insuficiente en caja (${(propinasData.efectivo_disponible || 0).toLocaleString()}).
                                    </span>
                                </div>
                            )}

                            {/* Desglose Mozo */}
                            {propinasData.detalle_mozos && propinasData.detalle_mozos.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200 max-h-32 overflow-y-auto">
                                    <p className="text-xs font-bold text-gray-500 mb-1">DESGLOSE DE PAGO:</p>
                                    {propinasData.detalle_mozos.map((m, idx) => (
                                        <div key={idx} className="flex justify-between text-xs text-gray-700">
                                            <span>{m.mozo}</span>
                                            <span>${(m.monto || 0).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setShowConfirmPropina(false)} className="flex-1 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300">
                                Cancelar
                            </button>
                            <button onClick={handleConfirmarPagoPropinas} disabled={loading} className="flex-1 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2">
                                {loading ? <Loader2 className="animate-spin" size={16}/> : <Printer size={16}/>}
                                Pagar
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default MovimientoCajaModal;
