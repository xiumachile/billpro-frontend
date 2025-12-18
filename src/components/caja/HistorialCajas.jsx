import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import cajaService from '../../services/cajaService';
import ReporteCajaTicket from './ReporteCajaTicket'; // Lo creamos en el paso 5
import { ArrowLeft, Printer, Eye } from 'lucide-react';

const HistorialCajas = () => {
    const navigate = useNavigate();
    const [sesiones, setSesiones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sesionSeleccionada, setSesionSeleccionada] = useState(null); // Para el modal de reporte

    useEffect(() => {
        cargarHistorial();
    }, []);

    const cargarHistorial = async () => {
        try {
            const res = await cajaService.getHistorialCierres();
            if (res.success) setSesiones(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/reportes')} className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">📜 Historial de Cierres de Caja</h1>
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Apertura</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cierre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Responsable</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Caja</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sistema</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Real</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Diferencia</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {sesiones.map((sesion) => (
                            <tr key={sesion.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">#{sesion.id}</td>
                                <td className="px-6 py-4 text-sm">{new Date(sesion.fecha_apertura).toLocaleString()}</td>
                                <td className="px-6 py-4 text-sm">{new Date(sesion.fecha_cierre).toLocaleString()}</td>
                                <td className="px-6 py-4 text-sm">
                                    {sesion.usuario_apertura?.nombre_completo || 'Usuario'}
                                </td>
                                <td className="px-6 py-4 text-sm">{sesion.caja?.nombre}</td>
                                <td className="px-6 py-4 text-right text-sm font-semibold">${parseFloat(sesion.monto_sistema).toLocaleString()}</td>
                                <td className="px-6 py-4 text-right text-sm font-semibold">${parseFloat(sesion.monto_final).toLocaleString()}</td>
                                <td className={`px-6 py-4 text-right text-sm font-bold ${
                                    sesion.diferencia < 0 ? 'text-red-600' : sesion.diferencia > 0 ? 'text-yellow-600' : 'text-green-600'
                                }`}>
                                    ${parseFloat(sesion.diferencia).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button 
                                        onClick={() => setSesionSeleccionada(sesion.id)}
                                        className="text-blue-600 hover:text-blue-900"
                                        title="Ver Reporte"
                                    >
                                        <Printer size={20} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal de Ticket/Reporte */}
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
