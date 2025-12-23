import React, { useState, useEffect } from 'react';
import { menuApi } from '../../api/menuApi';
import { 
    Plus, 
    Trash2, 
    DollarSign, 
    Save, 
    AlertCircle, 
    Tag,
    Loader
} from 'lucide-react';

export default function ConfiguracionPrecios() {
    const [listas, setListas] = useState([]);
    const [nombre, setNombre] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [guardando, setGuardando] = useState(false);

    // Cargar listas al montar
    useEffect(() => {
        cargarListas();
    }, []);

    const cargarListas = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await menuApi.getTiposPrecios();
            // Aseguramos que sea un array
            const data = Array.isArray(res) ? res : (res.data || []);
            setListas(data);
        } catch (e) {
            console.error(e);
            setError('No se pudieron cargar las listas de precios.');
        } finally {
            setLoading(false);
        }
    };

    const handleGuardar = async (e) => {
        e.preventDefault();
        if (!nombre.trim()) return;

        setGuardando(true);
        setError('');
        try {
            await menuApi.crearTipoPrecio({ nombre: nombre.trim() });
            setNombre('');
            await cargarListas(); // Recargar la lista
        } catch (e) {
            console.error(e);
            const msg = e.response?.data?.message || e.message || 'Error al guardar';
            setError('Error al crear la lista: ' + msg);
        } finally {
            setGuardando(false);
        }
    };

    const handleEliminar = async (id) => {
        if (id === 1) {
            alert('⛔ No se puede eliminar la Lista Base. Es necesaria para el sistema.');
            return;
        }

        if (!window.confirm('¿Estás seguro de eliminar esta lista de precios? Los productos volverán a usar el precio base.')) {
            return;
        }

        try {
            await menuApi.eliminarTipoPrecio(id);
            cargarListas();
        } catch (e) {
            console.error(e);
            alert('Error al eliminar la lista.');
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden font-sans">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm text-white">
                    <DollarSign size={20} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white">Listas de Precios</h2>
                    <p className="text-green-100 text-xs">Gestiona precios diferenciados (Local, Apps, Vip)</p>
                </div>
            </div>

            <div className="p-6">
                
                {/* Mensajes de Error */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm border border-red-200">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                {/* Formulario de Creación */}
                <form onSubmit={handleGuardar} className="flex gap-3 mb-8 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nueva Lista</label>
                        <input
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                            placeholder="Ej: Precio Rappi, Precio Noche..."
                            disabled={guardando}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!nombre.trim() || guardando}
                        className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-sm active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 h-[42px]"
                    >
                        {guardando ? <Loader size={18} className="animate-spin"/> : <Plus size={18} />}
                        Crear
                    </button>
                </form>

                {/* Listado */}
                {loading ? (
                    <div className="text-center py-8 text-slate-400 flex flex-col items-center gap-2">
                        <Loader className="animate-spin" size={24}/>
                        <span>Cargando listas...</span>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">Listas Activas</h3>
                        
                        {listas.length === 0 && (
                            <p className="text-slate-400 text-sm italic text-center py-4">No hay listas creadas.</p>
                        )}

                        <div className="grid grid-cols-1 gap-3">
                            {listas.map((lista) => (
                                <div 
                                    key={lista.id} 
                                    className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:shadow-sm transition-shadow group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${lista.id === 1 ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                            <Tag size={16} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">{lista.nombre}</p>
                                            {lista.id === 1 && (
                                                <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full inline-block mt-1">
                                                    PRECIO BASE
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Botón Eliminar (Protegido para ID 1) */}
                                    {lista.id !== 1 && (
                                        <button
                                            onClick={() => handleEliminar(lista.id)}
                                            className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                            title="Eliminar Lista"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
