import React, { useState, useEffect } from 'react';
import { parametrosApi } from '../../api/parametrosApi';
import { Save, FileText, CheckSquare, Eye, RefreshCw } from 'lucide-react';

export default function ConfiguracionComandas() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estado de configuración visual
  const [config, setConfig] = useState({
    mostrar_mesa: true,     // Mesa o Número de Orden
    mostrar_mozo: true,     // Nombre del que atendió
    mostrar_fecha: true,
    mostrar_hora: true,
    mostrar_notas: true,    // Notas especiales del producto
    agrupar_items: true,    // Si piden 2 veces Coca Cola, sale "2 x Coca Cola"
    tamanio_letra: 'normal' // normal, grande
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const res = await parametrosApi.getConfiguracionComanda();
      const data = res.data || res || {};
      
      // Fusionar con defaults para evitar errores
      setConfig(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error('Error cargando config comandas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, checked, type, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await parametrosApi.updateConfiguracionComanda(config);
      alert('✅ Configuración guardada.');
    } catch (error) {
      alert('Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  // --- VISTA PREVIA DEL TICKET (HTML Simulado) ---
  const TicketPreview = () => (
    <div className={`border-2 border-gray-800 p-4 bg-white shadow-xl w-64 mx-auto font-mono text-black ${config.tamanio_letra === 'grande' ? 'text-lg' : 'text-xs'}`}>
        <div className="text-center font-bold border-b border-black pb-2 mb-2">
            COMANDA COCINA
        </div>

        {/* HEADER DINÁMICO */}
        <div className="space-y-1 mb-2">
            {config.mostrar_mesa && (
                <div className="text-center font-black text-xl border-b border-black pb-1">
                    MESA 5
                </div>
            )}
            
            <div className="flex justify-between">
                {config.mostrar_mozo && <span>Mozo: Juan</span>}
                {config.mostrar_hora && <span>20:30</span>}
            </div>
            
            {config.mostrar_fecha && (
                <div className="text-right text-[10px] text-gray-500">
                    12/12/2025
                </div>
            )}
        </div>

        {/* BODY (ITEMS) */}
        <div className="space-y-2 border-t border-dashed border-black pt-2">
            <div>
                <div className="flex justify-between font-bold">
                    <span>2 x</span>
                    <span>Hamburguesa XL</span>
                </div>
                {config.mostrar_notas && (
                    <div className="text-[10px] bg-black text-white px-1 inline-block ml-4">
                        * SIN CEBOLLA *
                    </div>
                )}
            </div>

            <div>
                <div className="flex justify-between font-bold">
                    <span>1 x</span>
                    <span>Papas Fritas</span>
                </div>
            </div>
        </div>

        <div className="mt-4 border-t border-black pt-2 text-center text-[10px]">
            --- Fin Comanda ---
        </div>
    </div>
  );

  if (loading) return <div className="p-10 text-center">Cargando...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-blue-600 px-6 py-4 flex items-center gap-3">
                <FileText className="text-white"/>
                <h2 className="text-xl font-bold text-white">Formato de Comanda</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                
                {/* Cabecera */}
                <div>
                    <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <CheckSquare size={18}/> Datos de Cabecera
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="checkbox" name="mostrar_mesa" checked={config.mostrar_mesa} onChange={handleChange} className="w-5 h-5"/>
                            <span className="text-sm font-medium">Número Mesa / Orden</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="checkbox" name="mostrar_mozo" checked={config.mostrar_mozo} onChange={handleChange} className="w-5 h-5"/>
                            <span className="text-sm font-medium">Nombre Mozo / Cajero</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="checkbox" name="mostrar_fecha" checked={config.mostrar_fecha} onChange={handleChange} className="w-5 h-5"/>
                            <span className="text-sm font-medium">Fecha</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="checkbox" name="mostrar_hora" checked={config.mostrar_hora} onChange={handleChange} className="w-5 h-5"/>
                            <span className="text-sm font-medium">Hora</span>
                        </label>
                    </div>
                </div>

                {/* Cuerpo */}
                <div>
                    <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <FileText size={18}/> Contenido
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="checkbox" name="mostrar_notas" checked={config.mostrar_notas} onChange={handleChange} className="w-5 h-5"/>
                            <span className="text-sm font-medium">Notas / Observaciones</span>
                        </label>
                        <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="checkbox" name="agrupar_items" checked={config.agrupar_items} onChange={handleChange} className="w-5 h-5"/>
                            <span className="text-sm font-medium">Agrupar Items Iguales</span>
                        </label>
                    </div>
                </div>

                {/* Estilo */}
                <div>
                    <h3 className="font-bold text-gray-700 mb-2">Tamaño de Fuente</h3>
                    <select name="tamanio_letra" value={config.tamanio_letra} onChange={handleChange} className="w-full p-2 border rounded-lg">
                        <option value="normal">Normal (Estándar)</option>
                        <option value="grande">Grande (Cocinas ruidosas)</option>
                    </select>
                </div>

                <div className="flex justify-end pt-4">
                    <button type="submit" disabled={saving} className="px-6 py-3 bg-green-600 text-white font-bold rounded-xl shadow hover:bg-green-700 flex items-center gap-2">
                        {saving ? <RefreshCw className="animate-spin"/> : <Save/>}
                        Guardar Cambios
                    </button>
                </div>
            </form>
        </div>

        {/* COLUMNA DERECHA: VISTA PREVIA */}
        <div className="flex flex-col items-center">
            <h3 className="text-lg font-bold text-gray-600 mb-4 flex items-center gap-2">
                <Eye/> Vista Previa (Simulación)
            </h3>
            <div className="bg-gray-200 p-8 rounded-xl shadow-inner w-full flex justify-center">
                <TicketPreview />
            </div>
            <p className="text-xs text-gray-400 mt-4 text-center">
                * La vista previa es aproximada. El resultado final depende de la impresora física.
            </p>
        </div>

      </div>
    </div>
  );
}
