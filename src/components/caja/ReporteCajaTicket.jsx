import React, { useEffect, useState } from 'react';
import cajaService from '../../services/cajaService';
import './ReporteCajaTicket.css'; // Estilos tipo ticket

const ReporteCajaTicket = ({ sesionId, onClose }) => {
    const [data, setData] = useState(null);

    useEffect(() => {
        const cargarDetalle = async () => {
            try {
                const res = await cajaService.getReporteCierre(sesionId);
                if (res.success) setData(res.data);
            } catch (error) {
                alert('Error cargando reporte');
                onClose();
            }
        };
        cargarDetalle();
    }, [sesionId]);

    const handlePrint = () => {
        window.print();
    };

    if (!data) return <div className="modal-overlay">Cargando reporte...</div>;

    const { sesion, desglose_ventas, movimientos } = data;

   return (
    <div className="fixed inset-0 bg-black/60 z-[1300] flex items-center justify-center p-4 backdrop-blur-sm">
      {/* Contenedor simulando papel térmico */}
      <div className="bg-white p-6 shadow-2xl overflow-y-auto max-h-[90vh]" style={{ width: '350px', fontFamily: "'Courier New', Courier, monospace", color: '#000' }}>
        
        {/* Botones de Acción (No se imprimen) */}
        <div className="flex justify-between mb-6 no-print border-b pb-4">
            <button 
                onClick={handlePrint} 
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
                🖨️ Imprimir
            </button>
            <button 
                onClick={onClose} 
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm font-bold hover:bg-gray-300 transition-colors"
            >
                Cerrar
            </button>
        </div>

        {/* ÁREA IMPRIMIBLE */}
        <div id="printable-area">
            
            {/* Header */}
            <div className="text-center mb-3">
                <h2 className="text-xl font-black uppercase">Reporte de Cierre</h2>
                <p className="text-sm font-bold uppercase">{sesion.caja?.nombre || 'Caja General'}</p>
            </div>

            <div className="border-b border-dashed border-black my-2"></div>

            {/* Metadata */}
            <div className="text-xs space-y-1">
                <div className="flex justify-between"><span>Sesión ID:</span><span className="font-bold">#{sesion.id}</span></div>
                <div className="flex justify-between"><span>Apertura:</span><span>{new Date(sesion.fecha_apertura).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Cierre:</span><span>{new Date(sesion.fecha_cierre).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Cajero:</span><span className="uppercase">{sesion.usuario_apertura?.nombre_completo?.split(' ')[0]}</span></div>
            </div>

            <div className="border-b border-dashed border-black my-2"></div>

            {/* BALANCE EFECTIVO */}
            <h3 className="text-center font-bold mb-2 uppercase">Balance Efectivo</h3>
            
            <div className="text-sm space-y-1">
                <div className="flex justify-between">
                    <span>Fondo Inicial:</span>
                    <span>${parseFloat(sesion.monto_inicial).toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between font-bold">
                    <span>(+) Ventas Efectivo:</span>
                    <span>${(desglose_ventas.find(v => v.nombre.toLowerCase().includes('efectivo'))?.total || 0).toLocaleString()}</span>
                </div>

                {/* Cálculos dinámicos de movimientos */}
                {(() => {
                    const ingresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + parseFloat(m.monto), 0);
                    const gastos = movimientos.filter(m => m.tipo === 'egreso' && m.categoria !== 'retiro_propinas').reduce((s, m) => s + parseFloat(m.monto), 0);
                    const propinas = movimientos.filter(m => m.categoria === 'retiro_propinas').reduce((s, m) => s + parseFloat(m.monto), 0);
                    
                    // Calculamos Pagos Proveedores por diferencia si no vienen explícitos en el objeto sesión
                    // (MontoSistema - Fondo - VentasEfectivo - Ingresos + Gastos + Propinas) * -1
                    // Pero para este ejemplo visual, solo mostramos si tenemos los datos de movimientos.
                    
                    return (
                        <>
                            {ingresos > 0 && (
                                <div className="flex justify-between">
                                    <span>(+) Ingresos Extra:</span>
                                    <span>${ingresos.toLocaleString()}</span>
                                </div>
                            )}
                            {gastos > 0 && (
                                <div className="flex justify-between">
                                    <span>(-) Gastos Caja:</span>
                                    <span>-${gastos.toLocaleString()}</span>
                                </div>
                            )}
                            {propinas > 0 && (
                                <div className="flex justify-between italic">
                                    <span>(-) Retiro Propinas:</span>
                                    <span>-${propinas.toLocaleString()}</span>
                                </div>
                            )}
                        </>
                    );
                })()}
            </div>

            <div className="border-b border-dashed border-black my-2"></div>

            {/* RESULTADOS FINALES */}
            <div className="text-sm font-bold space-y-2">
                <div className="flex justify-between">
                    <span>ESPERADO SISTEMA:</span>
                    <span>${parseFloat(sesion.monto_sistema).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg">
                    <span>REAL CONTADO:</span>
                    <span>${parseFloat(sesion.monto_final).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-black pt-1">
                    <span>DIFERENCIA:</span>
                    <span>
                        {parseFloat(sesion.diferencia) > 0 ? '+' : ''}${parseFloat(sesion.diferencia).toLocaleString()}
                    </span>
                </div>
            </div>

            <div className="border-b border-dashed border-black my-3"></div>

            {/* DESGLOSE VENTAS TOTALES */}
            <h3 className="text-center font-bold mb-1 uppercase">Ventas por Medio</h3>
            <div className="text-xs space-y-1">
                {desglose_ventas.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                        <span className="uppercase">{item.nombre}:</span>
                        <span>${parseFloat(item.total).toLocaleString()}</span>
                    </div>
                ))}
            </div>

            {/* DETALLE MOVIMIENTOS */}
            {movimientos.length > 0 && (
                <>
                    <div className="border-b border-dashed border-black my-2"></div>
                    <h3 className="text-center font-bold mb-1 uppercase">Detalle Movimientos</h3>
                    <div className="text-xs space-y-2">
                        {movimientos.map(m => (
                            <div key={m.id}>
                                <div className="flex justify-between font-bold">
                                    <span>{m.tipo === 'ingreso' ? '(+)' : '(-)'} {m.categoria.replace('_', ' ').toUpperCase()}</span>
                                    <span>${parseFloat(m.monto).toLocaleString()}</span>
                                </div>
                                <div className="pl-2">- {m.descripcion}</div>
                            </div>
                        ))}
                    </div>
                </>
            )}
            
            <div className="mt-10 text-center text-xs">
                <p>__________________________</p>
                <p className="mt-1 uppercase font-bold">Firma Responsable</p>
            </div>

        </div>
      </div>
    </div>
  );
};

export default ReporteCajaTicket;
