import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import cajaService from '../../services/cajaService';
import ReporteCajaTicket from './ReporteCajaTicket'; 
import { ArrowLeft, Printer, AlertCircle } from 'lucide-react';

const HistorialCajas = () => {
    const navigate = useNavigate();
    const [sesiones, setSesiones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sesionSeleccionada, setSesionSeleccionada] = useState(null); 

    useEffect(() => {
        cargarHistorial();
    }, []);

    const cargarHistorial = async () => {
        try {
            const res = await cajaService.getHistorialCierres();
            // Soporte para respuestas directas o envueltas en .data
            const lista = Array.isArray(res) ? res : (res.data || []);
            setSesiones(lista);
        } catch (error) {
            console.error("Error cargando historial:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/reportes')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <ArrowLeft size={24} className="text-gray-600" />
                        </button>
                        <h1 className="text-2xl font-black text-gray-800">📜 Historial de Cierres</h1>
                    </div>
                </div>

                {/* Tabla */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-bold border-b">
                                <tr>
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4">Apertura</th>
                                    <th className="px-6 py-4">Cierre</th>
                                    <th className="px-6 py-4">Cajero</th>
                                    <th className="px-6 py-4">Caja</th>
                                    <th className="px-6 py-4 text-right">Sistema</th>
                                    <th className="px-6 py-4 text-right">Real</th>
                                    <th className="px-6 py-4 text-right">Diferencia</th>
                                    <th className="px-6 py-4 text-center">Ticket</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan="9" className="p-8 text-center text-gray-400">Cargando historial...</td></tr>
                                ) : sesiones.length === 0 ? (
                                    <tr><td colSpan="9" className="p-8 text-center text-gray-400 flex flex-col items-center gap-2"><AlertCircle/> No hay cierres registrados.</td></tr>
                                ) : (
                                    sesiones.map((sesion) => (
                                        <tr key={sesion.id} className="hover:bg-blue-50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-gray-700">#{sesion.id}</td>
                                            <td className="px-6 py-4 text-gray-600">{new Date(sesion.fecha_apertura).toLocaleString([], {month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit'})}</td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {sesion.fecha_cierre 
                                                    ? new Date(sesion.fecha_cierre).toLocaleString([], {month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit'}) 
                                                    : <span className="text-green-600 font-bold bg-green-100 px-2 py-1 rounded text-xs">ABIERTA</span>
                                                }
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-800 capitalize">
                                                {sesion.usuario_apertura?.nombre_completo || 'Desconocido'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{sesion.caja?.nombre || 'General'}</td>
                                            <td className="px-6 py-4 text-right font-mono">${parseFloat(sesion.monto_sistema).toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right font-mono font-bold">${parseFloat(sesion.monto_final).toLocaleString()}</td>
                                            <td className={`px-6 py-4 text-right font-mono font-bold ${
                                                sesion.diferencia < 0 ? 'text-red-600' : sesion.diferencia > 0 ? 'text-blue-600' : 'text-gray-400'
                                            }`}>
                                                {parseFloat(sesion.diferencia) > 0 ? '+' : ''}{parseFloat(sesion.diferencia).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button 
                                                    onClick={() => setSesionSeleccionada(sesion.id)}
                                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors tooltip"
                                                    title="Ver Ticket"
                                                >
                                                    <Printer size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal de Ticket */}
            {sesionSeleccionada && (
                <ReporteCajaTicket 
                    sesionId={sesionSeleccionada} 
                    onClose={() => setSesionSeleccionada(null)} 
                />
            )}
        </div>
    );
};

export default HistorialCajas;
