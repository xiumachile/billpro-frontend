import React, { useState, useEffect } from 'react';
import { menuApi } from '../../api/menuApi';
import { Save, Trash2, Smartphone, RefreshCw, AlertCircle } from 'lucide-react';

export default function ConfiguracionApps() {
  const [apps, setApps] = useState([]);
  const [cartas, setCartas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({ 
    nombre: '', 
    carta_id: '', 
    color: '#000000' 
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    setError('');
    try {
      console.log("🔄 Cargando Apps y Cartas...");
      
      const [appsRes, cartasRes] = await Promise.all([
          menuApi.getAppsDelivery(),
          menuApi.getCartas()
      ]);

      // 1. Procesar Apps
      const listaApps = Array.isArray(appsRes) ? appsRes : (appsRes.data || []);
      setApps(listaApps);

      // 2. Procesar Cartas (Aquí estaba el posible fallo)
      // Intentamos extraer el array de varias formas comunes de respuesta Laravel
      const listaCartas = Array.isArray(cartasRes) ? cartasRes : (cartasRes.data || []);
      
      console.log("📋 Cartas cargadas:", listaCartas);
      setCartas(listaCartas);

    } catch (err) {
      console.error("❌ Error cargando datos:", err);
      setError('No se pudo cargar la lista de cartas o apps.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuardar = async () => {
    if (!form.nombre.trim()) return alert("El nombre es obligatorio");
    if (!form.carta_id) return alert("Debe seleccionar una carta del menú");

    try {
        await menuApi.crearAppDelivery(form);
        alert("✅ App configurada correctamente");
        setForm({ nombre: '', carta_id: '', color: '#000000' });
        cargarDatos();
    } catch (e) {
        console.error(e);
        alert("Error al guardar: " + (e.response?.data?.message || e.message));
    }
  };

  const handleEliminar = async (id) => {
    if(window.confirm("¿Estás seguro de eliminar esta configuración?")) {
        try {
            await menuApi.deleteAppDelivery(id);
            cargarDatos();
        } catch (e) {
            alert("Error al eliminar.");
        }
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Cargando configuración...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto font-sans">
      <div className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Smartphone className="text-purple-600"/> Configuración Apps Delivery
        </h1>
        <p className="text-sm text-gray-500">Vincular aplicaciones externas (Uber, Rappi) a cartas específicas.</p>
      </div>
      
      {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 flex items-center gap-2 border border-red-200">
              <AlertCircle size={18}/> {error}
              <button onClick={cargarDatos} className="ml-auto text-sm font-bold underline">Reintentar</button>
          </div>
      )}
      
      {/* FORMULARIO DE CREACIÓN */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-8">
        <h3 className="font-bold text-gray-700 mb-4">Nueva Integración</h3>
        <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre App</label>
                <input 
                    className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-purple-500" 
                    value={form.nombre} 
                    onChange={e=>setForm({...form, nombre: e.target.value})} 
                    placeholder="Ej: UberEats"
                />
            </div>
            
            <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Carta Asociada (Menú)</label>
                <select 
                    className="w-full border p-2 rounded-lg bg-white outline-none focus:ring-2 focus:ring-purple-500" 
                    value={form.carta_id} 
                    onChange={e=>setForm({...form, carta_id: e.target.value})}
                >
                    <option value="">-- Seleccionar Carta --</option>
                    {cartas.map(c => (
                        <option key={c.id} value={c.id}>
                            {c.nombre} {c.estado === 'activa' ? '(Activa)' : ''}
                        </option>
                    ))}
                </select>
                {cartas.length === 0 && <p className="text-xs text-red-500 mt-1">No se encontraron cartas creadas.</p>}
            </div>
            
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Color Botón</label>
                <div className="flex items-center gap-2 border p-1 rounded-lg">
                    <input 
                        type="color" 
                        className="h-9 w-12 border-none cursor-pointer rounded" 
                        value={form.color} 
                        onChange={e=>setForm({...form, color: e.target.value})}
                    />
                </div>
            </div>
            
            <button 
                onClick={handleGuardar} 
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow transition-all active:scale-95"
            >
                <Save size={18}/> Guardar
            </button>
        </div>
      </div>

      {/* LISTADO DE APPS */}
      <h3 className="font-bold text-gray-700 mb-3">Apps Configuradas</h3>
      {apps.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-400">
              No hay aplicaciones configuradas.
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {apps.map(app => (
                <div key={app.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 border-l-8 flex justify-between items-center transition-shadow hover:shadow-md" style={{ borderLeftColor: app.color }}>
                    <div>
                        <h3 className="font-bold text-lg text-gray-800">{app.nombre}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                            Carta: <span className="font-medium text-gray-700">{app.carta?.nombre || 'Sin Carta'}</span>
                        </p>
                    </div>
                    <button 
                        onClick={()=>handleEliminar(app.id)} 
                        className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                        title="Eliminar Configuración"
                    >
                        <Trash2 size={18}/>
                    </button>
                </div>
            ))}
          </div>
      )}
    </div>
  );
}
