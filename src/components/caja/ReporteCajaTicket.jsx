import React, { useEffect, useState } from 'react';
import cajaService from '../../services/cajaService'; // Ajusta la ruta
import { Loader, X, Printer } from 'lucide-react';
import './ReporteCajaTicket.css';

const ReporteCajaTicket = ({ sesionId, onClose }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const cargarDetalle = async () => {
            if (!sesionId) return;
            setLoading(true);
            try {
                // ✅ Usamos el nombre correcto del método del servicio
                const res = await cajaService.getReporteCaja(sesionId);
                // Soporte para respuesta directa o { success: true, data: ... }
                const reporte = res.data || res;
                setData(reporte);
            } catch (error) {
                console.error("Error cargando reporte:", error);
                // No cerramos automáticamente para que el usuario vea el error si quiere
            } finally {
                setLoading(false);
            }
        };
        cargarDetalle();
    }, [sesionId]);

    const handlePrint = () => {
        window.print();
    };

    // Renderizado de carga
    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/60 z-[1300] flex items-center justify-center backdrop-blur-sm">
                <div className="bg-white p-6 rounded-xl flex flex-col items-center shadow-2xl">
                    <Loader className="animate-spin text-blue-600 mb-2" size={32}/>
                    <span className="font-bold text-gray-700">Generando reporte...</span>
                </div>
            </div>
        );
    }

    if (!data || !data.sesion) return null;

    const { sesion, desglose_ventas = [], movimientos = [] } = data;

   return (
    <div className="fixed inset-0 bg-black/60 z-[1300] flex items-center justify-center p-4 backdrop-blur-sm modal-overlay">
      
      {/* Contenedor con scroll para ver en pantalla */}
      <div className="bg-white p-4 shadow-2xl rounded-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Botones de Acción (No se imprimen) */}
        <div className="flex justify-between items-center mb-4 no-print border-b pb-3">
            <h3 className="font-bold text-gray-700">Vista Previa</h3>
            <div className="flex gap-2">
                <button 
                    onClick={handlePrint} 
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2 transition-colors"
                >
                    <Printer size={16}/> Imprimir
                </button>
                <button 
                    onClick={onClose} 
                    className="bg-gray-100 text-gray-600 p-1.5 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors"
                >
                    <X size={20}/>
                </button>
            </div>
        </div>

        {/* ÁREA SCROLLABLE PARA EL TICKET */}
        <div className="overflow-y-auto custom-scrollbar p-2 bg-gray-50 rounded border border-gray-200">
            
            {/* ID necesario para el CSS de impresión */}
            <div id="printable-area" className="ticket-container">
                
                {/* Header */}
                <div className="text-center bold large">REPORTE DE CIERRE</div>
                <div className="text-center bold uppercase">{sesion.caja?.nombre || 'Caja General'}</div>
                <div className="divider">================================</div>

                {/* Metadata */}
                <div className="row"><span>Sesión ID:</span><span className="bold">#{sesion.id}</span></div>
                <div className="row"><span>Apertura:</span><span>{new Date(sesion.fecha_apertura).toLocaleString()}</span></div>
                <div className="row"><span>Cierre:</span><span>{sesion.fecha_cierre ? new Date(sesion.fecha_cierre).toLocaleString() : 'EN CURSO'}</span></div>
                <div className="row"><span>Cajero:</span><span className="uppercase">{sesion.usuario_apertura?.nombre_completo?.split(' ')[0]}</span></div>

                <div className="divider">--------------------------------</div>

                {/* BALANCE */}
                <div className="text-center bold" style={{marginBottom:'5px'}}>BALANCE DE CAJA</div>
                
                <div className="row">
                    <span>Fondo Inicial:</span>
                    <span>${parseFloat(sesion.monto_inicial).toLocaleString()}</span>
                </div>
                
                <div className="row bold">
                    <span>(+) Ventas Efectivo:</span>
                    <span>${(desglose_ventas.find(v => v.nombre.toLowerCase().includes('efectivo'))?.total || 0).toLocaleString()}</span>
                </div>

                {/* Cálculos dinámicos de movimientos */}
                {(() => {
                    const ingresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + parseFloat(m.monto), 0);
                    const gastos = movimientos.filter(m => m.tipo === 'egreso' && m.categoria !== 'retiro_propinas').reduce((s, m) => s + parseFloat(m.monto), 0);
                    const propinas = movimientos.filter(m => m.categoria === 'retiro_propinas').reduce((s, m) => s + parseFloat(m.monto), 0);
                    
                    return (
                        <>
                            {ingresos > 0 && (
                                <div className="row"><span>(+) Ingresos Extra:</span><span>${ingresos.toLocaleString()}</span></div>
                            )}
                            {gastos > 0 && (
                                <div className="row"><span>(-) Gastos Caja:</span><span>-${gastos.toLocaleString()}</span></div>
                            )}
                            {propinas > 0 && (
                                <div className="row italic"><span>(-) Retiro Propinas:</span><span>-${propinas.toLocaleString()}</span></div>
                            )}
                        </>
                    );
                })()}

                <div className="divider">================================</div>

                {/* RESULTADOS FINALES */}
                <div className="row bold">
                    <span>ESPERADO SISTEMA:</span>
                    <span>${parseFloat(sesion.monto_sistema).toLocaleString()}</span>
                </div>
                <div className="row bold large" style={{marginTop:'5px'}}>
                    <span>REAL CONTADO:</span>
                    <span>${parseFloat(sesion.monto_final).toLocaleString()}</span>
                </div>
                
                <div className="row bold" style={{marginTop:'5px', borderTop: '1px dashed black', paddingTop:'2px'}}>
                    <span>DIFERENCIA:</span>
                    <span>
                        {parseFloat(sesion.diferencia) > 0 ? '+' : ''}${parseFloat(sesion.diferencia).toLocaleString()}
                    </span>
                </div>

                <div className="divider">--------------------------------</div>

                {/* DESGLOSE VENTAS TOTALES */}
                <div className="text-center bold small">VENTAS POR MEDIO</div>
                <div style={{marginTop:'5px'}}>
                    {desglose_ventas.map((item, idx) => (
                        <div key={idx} className="row small">
                            <span className="uppercase">{item.nombre}:</span>
                            <span>${parseFloat(item.total).toLocaleString()}</span>
                        </div>
                    ))}
                </div>

                {/* DETALLE MOVIMIENTOS */}
                {movimientos.length > 0 && (
                    <>
                        <div className="divider">--------------------------------</div>
                        <div className="text-center bold small">MOVIMIENTOS</div>
                        <div style={{marginTop:'5px'}}>
                            {movimientos.map(m => (
                                <div key={m.id} style={{marginBottom: '4px'}}>
                                    <div className="row small bold">
                                        <span>{m.tipo === 'ingreso' ? '(+)' : '(-)'} {m.categoria.replace('_', ' ').toUpperCase()}</span>
                                        <span>${parseFloat(m.monto).toLocaleString()}</span>
                                    </div>
                                    <div className="small italic" style={{paddingLeft: '10px'}}>- {m.descripcion}</div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
                
                <div style={{marginTop: '40px', textAlign: 'center'}} className="small">
                    <p>__________________________</p>
                    <p className="bold uppercase" style={{marginTop: '5px'}}>Firma Responsable</p>
                </div>
                <div className="text-center small" style={{marginTop:'10px'}}>{new Date().toLocaleString()}</div>

            </div>
        </div>
      </div>
    </div>
  );
};

export default ReporteCajaTicket;
