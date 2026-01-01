import React, { useState, useEffect } from 'react';
import axios from '../../api/axiosInstance';
import { 
    ShieldCheck, 
    RefreshCw, 
    Monitor, // ✅ CAMBIO: Icono de Monitor en vez de Users
    Smartphone,
    AlertTriangle, 
    CheckCircle, 
    Calendar,
    Clock
} from 'lucide-react';

export default function LicenseScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    const fetchLicenseData = async () => {
        try {
            const res = await axios.get('/config/license');
            setData(res.data);
            setError('');
        } catch (err) {
            console.error(err);
            setError('No se pudo obtener la información de la licencia.');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await axios.post('/config/license/refresh');
            await fetchLicenseData(); 
        } catch (err) {
            alert('Error al conectar con el servidor de licencias.');
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchLicenseData();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return 'Indefinido / Vitalicio';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '--';
        return new Date(dateString).toLocaleString('es-CL');
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64 text-gray-500 gap-2">
            <RefreshCw className="animate-spin" /> Cargando información del plan...
        </div>
    );

    // Cálculos
    const isUnlimited = data?.max_users > 9000;
    const usagePercent = isUnlimited 
        ? 5 
        : data ? Math.min((data.current_users / data.max_users) * 100, 100) : 0;
    
    const isLimitReached = !isUnlimited && data && data.current_users >= data.max_users;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Mi Suscripción</h1>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 border border-red-200 flex items-center gap-2">
                    <AlertTriangle size={20} />
                    {error}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                
                {/* Cabecera */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-700 p-8 text-white flex justify-between items-start relative overflow-hidden">
                    <ShieldCheck size={150} className="absolute -right-6 -bottom-6 text-white/10 rotate-12" />

                    <div className="relative z-10">
                        <p className="text-purple-100 text-xs font-bold uppercase tracking-wider mb-1">Plan Contratado</p>
                        <h2 className="text-4xl font-black mb-3">{data?.plan?.toUpperCase() || 'DESCONOCIDO'}</h2>
                        
                        <div className="flex flex-wrap gap-3">
                            {data?.status === 'active' ? (
                                <span className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm border border-green-400">
                                    <CheckCircle size={14} /> LICENCIA ACTIVA
                                </span>
                            ) : (
                                <span className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm border border-red-400">
                                    <AlertTriangle size={14} /> {data?.status?.toUpperCase() || 'INACTIVA'}
                                </span>
                            )}

                            <div className="bg-white/20 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-white/20">
                                <Calendar size={14} />
                                <span>Vence: {formatDate(data?.expires_at)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cuerpo */}
                <div className="p-8">
                    
                    {/* Sección de TERMINALES (Ya no Usuarios) */}
                    <div className="mb-8">
                        <div className="flex justify-between items-end mb-3">
                            <h3 className="flex items-center gap-2 text-gray-700 font-bold text-lg">
                                {/* ✅ CAMBIO: Icono y Texto */}
                                <Monitor className="text-purple-600" size={22} /> Dispositivos / Terminales
                            </h3>
                            <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
                                <strong className={`text-lg ${isLimitReached ? 'text-red-600' : 'text-gray-800'}`}>
                                    {data?.current_users}
                                </strong> 
                                <span className="mx-1">/</span> 
                                {isUnlimited ? '∞ Ilimitado' : `${data?.max_users} permitidos`}
                            </span>
                        </div>
                        
                        <div className="w-full bg-gray-100 rounded-full h-5 overflow-hidden border border-gray-200 shadow-inner relative">
                            <div 
                                className={`h-full transition-all duration-1000 ease-out flex items-center justify-end pr-2 ${isLimitReached ? 'bg-red-500' : 'bg-gradient-to-r from-purple-400 to-purple-600'}`}
                                style={{ width: `${usagePercent}%` }}
                            >
                            </div>
                        </div>

                        {/* ✅ CAMBIO: Texto de advertencia actualizado */}
                        {isLimitReached && (
                            <div className="mt-3 flex items-start gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm border border-red-100">
                                <AlertTriangle className="flex-shrink-0 mt-0.5" size={16} />
                                <p>
                                    <strong>Límite de dispositivos alcanzado.</strong> No puedes registrar nuevos terminales (Cajas, Tablets o PCs). 
                                    Contacte a su proveedor para ampliar su plan.
                                </p>
                            </div>
                        )}
                        
                        <p className="text-xs text-gray-400 mt-2 ml-1">
                            * Se cuenta cada PC, Tablet o Celular que accede al sistema como un terminal.
                        </p>
                    </div>

                    <hr className="border-gray-100 my-6" />

                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3 text-sm text-gray-500 w-full md:w-auto bg-gray-50 px-4 py-3 rounded-xl border border-gray-100">
                            <Clock className="text-gray-400" size={18} />
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase">Última Sincronización</p>
                                <p className="font-mono text-gray-700">{formatDateTime(data?.last_check)}</p>
                            </div>
                        </div>

                        <button 
                            onClick={handleRefresh} 
                            disabled={refreshing}
                            className={`flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold transition-all w-full md:w-auto shadow-lg shadow-gray-200
                                ${refreshing 
                                    ? 'bg-gray-100 text-gray-400 cursor-wait' 
                                    : 'bg-gray-900 text-white hover:bg-black hover:scale-[1.02] active:scale-95'
                                }
                            `}
                        >
                            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                            {refreshing ? 'Sincronizando...' : 'Actualizar Licencia'}
                        </button>
                    </div>

                </div>
            </div>

            <div className="mt-6 text-center">
                <p className="text-xs text-gray-400">
                    ID de Licencia: <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">...{data?.api_key_ending || '****'}</span>
                </p>
            </div>
        </div>
    );
}
