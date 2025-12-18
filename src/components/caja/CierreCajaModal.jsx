import React, { useState, useEffect } from 'react';
import cajaService from '../../services/cajaService';
import { useCaja } from '../../context/CajaContext';
// ✅ IMPORTACIÓN CORREGIDA: Agregamos X y los demás iconos usados
import { X, Loader2, DollarSign, AlertCircle, Lock } from 'lucide-react'; 

const CierreCajaModal = ({ isOpen, onClose }) => {
    const { notificarCierre } = useCaja();
    
    // Estado
    const [datosSistema, setDatosSistema] = useState(null);
    const [montoContado, setMontoContado] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [loading, setLoading] = useState(true);
    const [procesando, setProcesando] = useState(false);
    const [error, setError] = useState(null);

    // Al abrir el modal, traemos los cálculos del sistema
    useEffect(() => {
        if (isOpen) {
            obtenerPreCierre();
            setMontoContado('');
            setObservaciones('');
            setError(null);
        }
    }, [isOpen]);

    const obtenerPreCierre = async () => {
        try {
            setLoading(true);
            const res = await cajaService.getPreCierre();
            if (res.success) {
                setDatosSistema(res.data);
            }
        } catch (err) {
            setError('Error obteniendo datos del cierre. Intenta nuevamente.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCerrarCaja = async (e) => {
        e.preventDefault();
        if (montoContado === '') return;

        if (!window.confirm('¿Estás seguro de cerrar la caja? Esta acción es irreversible.')) return;

        try {
            setProcesando(true);
            const datos = {
                monto_final: parseFloat(montoContado),
                observaciones: observaciones
            };

            const res = await cajaService.cerrarCaja(datos);

            if (res.success) {
                alert(`✅ Caja Cerrada.\nDiferencia: $${res.data.diferencia}`);
                notificarCierre(); // Actualiza el contexto global
                onClose();
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Error al cerrar caja.');
        } finally {
            setProcesando(false);
        }
    };

    if (!isOpen) return null;

    // Calcular diferencia en tiempo real para mostrarla
    const diferencia = datosSistema 
        ? (parseFloat(montoContado || 0) - datosSistema.total_efectivo_esperado) 
        : 0;

  return (
    <div className="fixed inset-0 bg-black/60 z-[1300] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="bg-slate-800 p-4 flex justify-between items-center text-white shrink-0">
            <h2 className="text-lg font-bold flex gap-2 items-center">🔒 Arqueo y Cierre de Caja</h2>
            <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                <X size={20}/>
            </button>
        </div>

        {/* CONTENIDO SCROLLABLE */}
        <div className="p-6 overflow-y-auto">
            
            {loading ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                    <p className="text-gray-500 font-medium">Calculando totales del sistema...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-center">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2"/>
                    <p className="font-bold">Error de Carga</p>
                    <p className="text-sm">{error}</p>
                </div>
            ) : (
                <form onSubmit={handleCerrarCaja} className="space-y-6">
                    
                    {/* 1. RESUMEN DEL SISTEMA (DESGLOSADO) */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-sm">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2 border-b pb-1">
                            Resumen del Sistema
                        </h3>

                        <div className="flex justify-between text-slate-600">
                            <span>Fondo Inicial</span>
                            <span className="font-mono">${datosSistema.monto_inicial.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex justify-between text-green-600 font-medium">
                            <span>(+) Ventas Efectivo</span>
                            <span className="font-mono">${datosSistema.ventas_efectivo.toLocaleString()}</span>
                        </div>

                        {datosSistema.ingresos_manuales > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>(+) Ingresos Extra</span>
                                <span className="font-mono">${datosSistema.ingresos_manuales.toLocaleString()}</span>
                            </div>
                        )}

                        {/* DESGLOSE DE SALIDAS */}
                        {datosSistema.pagos_proveedores > 0 && (
                            <div className="flex justify-between text-red-600">
                                <span>(-) Pagos a Proveedores</span>
                                <span className="font-mono">-${datosSistema.pagos_proveedores.toLocaleString()}</span>
                            </div>
                        )}

                        {datosSistema.gastos_caja > 0 && (
                            <div className="flex justify-between text-red-600">
                                <span>(-) Gastos Operativos</span>
                                <span className="font-mono">-${datosSistema.gastos_caja.toLocaleString()}</span>
                            </div>
                        )}

                        {/* SECCIÓN ESPECIAL PROPINAS */}
                        {datosSistema.retiros_propinas > 0 && (
                            <div className="flex justify-between text-orange-600 font-bold bg-orange-50 px-1 rounded">
                                <span>(-) Pago de Propinas</span>
                                <span className="font-mono">-${datosSistema.retiros_propinas.toLocaleString()}</span>
                            </div>
                        )}

                        <div className="border-t border-slate-300 pt-2 mt-2 flex justify-between items-center text-base">
                            <span className="font-bold text-slate-800">💰 EFECTIVO ESPERADO</span>
                            <span className="font-black text-slate-900">${datosSistema.total_efectivo_esperado.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* 2. INPUT DE DINERO FÍSICO */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            ¿Cuánto dinero hay físicamente?
                        </label>
                        <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={24}/>
                            <input 
                                type="number" 
                                className="w-full pl-12 pr-4 py-4 text-3xl font-black text-slate-800 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-right placeholder-slate-300"
                                placeholder="0"
                                value={montoContado}
                                onChange={(e) => setMontoContado(e.target.value)}
                                autoFocus
                                required
                                min="0"
                            />
                        </div>
                    </div>

                    {/* 3. VISUALIZACIÓN DE DIFERENCIA */}
                    <div className={`p-4 rounded-xl border-2 text-center transition-colors ${
                        diferencia === 0 
                            ? 'bg-green-50 border-green-200 text-green-700' 
                            : diferencia < 0 
                                ? 'bg-red-50 border-red-200 text-red-700' 
                                : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                    }`}>
                        <p className="text-xs font-bold uppercase mb-1">Diferencia (Sobra/Falta)</p>
                        <p className="text-3xl font-black tracking-tight">
                            {diferencia > 0 ? '+' : ''}${diferencia.toLocaleString()}
                        </p>
                        <p className="text-xs mt-1 font-medium">
                            {diferencia === 0 ? '✨ Caja Cuadrada Perfectamente' : 
                             diferencia < 0 ? '⚠️ Faltante de dinero' : '⚠️ Sobrante de dinero'}
                        </p>
                    </div>

                    {/* 4. OBSERVACIONES */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Observaciones del Cierre</label>
                        <textarea 
                            rows="2"
                            className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:border-blue-500 outline-none resize-none"
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            placeholder="Ej: Billete roto, error en vuelto, propinas pendientes..."
                        />
                    </div>

                    {/* BOTONES */}
                    <div className="flex gap-3 pt-2">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            disabled={procesando}
                            className="flex-1 py-3 bg-white border border-slate-300 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            disabled={procesando || montoContado === ''}
                            className="flex-[2] py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 active:scale-95 transition-all disabled:bg-gray-400 disabled:shadow-none flex items-center justify-center gap-2"
                        >
                            {procesando ? (
                                <>
                                    <Loader2 className="animate-spin w-5 h-5"/> Cerrando...
                                </>
                            ) : (
                                <>
                                    <Lock size={18}/> FINALIZAR TURNO
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}
        </div>
      </div>
    </div>
  );
};

export default CierreCajaModal;
