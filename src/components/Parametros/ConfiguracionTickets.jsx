import React, { useState, useEffect } from 'react';
import { parametrosApi } from '../../api/parametrosApi';
import { Save, Receipt, MapPin, Phone, Building, Hash, FileText, RefreshCw, Eye, CheckSquare } from 'lucide-react';

export default function ConfiguracionTickets() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [config, setConfig] = useState({
    // Datos Fijos
    nombre_fantasia: '',
    rut: '',
    direccion: '',
    telefono: '',
    mensaje_pie: '¡Gracias por su visita!',
    imprimir_logo: true,
    
    // Opciones de Visualización (JSON en backend)
    opciones_impresion: {
        mostrar_mesa: true,     // Mesa o Número Orden
        mostrar_cliente: true,  // Nombre Cliente
        mostrar_direccion: true,// Dirección Delivery
        mostrar_mozo: true,     // Nombre Mozo
        mostrar_fecha: true,
        mostrar_hora: true
    }
  });

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    setLoading(true);
    try {
      const respuesta = await parametrosApi.getConfiguracionTicket();
      const datos = respuesta.data || respuesta;
      
      setConfig({
        nombre_fantasia: datos.nombre_fantasia || '',
        rut: datos.rut || '',
        direccion: datos.direccion || '',
        telefono: datos.telefono || '',
        mensaje_pie: datos.mensaje_pie || '',
        imprimir_logo: datos.imprimir_logo === true || datos.imprimir_logo === 1,
        // Cargar opciones JSON o usar default
        opciones_impresion: {
            mostrar_mesa: true,
            mostrar_cliente: true,
            mostrar_direccion: true,
            mostrar_mozo: true,
            mostrar_fecha: true,
            mostrar_hora: true,
            ...(datos.opciones_impresion || {}) // Sobrescribir con lo que venga de BD
        }
      });
    } catch (error) {
      console.error('Error cargando ticket config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleOptionChange = (e) => {
      const { name, checked } = e.target;
      setConfig(prev => ({
          ...prev,
          opciones_impresion: {
              ...prev.opciones_impresion,
              [name]: checked
          }
      }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await parametrosApi.updateConfiguracionTicket(config);
      alert('✅ Diseño guardado.');
    } catch (error) {
      alert('Error al guardar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // --- VISTA PREVIA ---
  const TicketPreview = () => (
      <div className="bg-white p-4 shadow-xl w-full max-w-[280px] text-center font-mono text-sm leading-tight border-t-4 border-gray-800 mx-auto">
          {/* Header */}
          <div className="mb-4">
              <h2 className="font-bold text-lg mb-1">{config.nombre_fantasia || 'NOMBRE LOCAL'}</h2>
              <p>{config.direccion || 'Dirección #123'}</p>
              <p>Tel: {config.telefono || '555-5555'}</p>
              <p className="mt-1">RUT: {config.rut || '11.111.111-1'}</p>
          </div>

          <div className="border-b border-dashed border-gray-400 my-2"></div>

          {/* Datos Dinámicos */}
          <div className="text-left space-y-1 text-xs mb-2">
              {config.opciones_impresion.mostrar_fecha && <div>Fecha: 12/12/2025</div>}
              {config.opciones_impresion.mostrar_hora && <div>Hora: 14:30</div>}
              
              {config.opciones_impresion.mostrar_mesa && (
                  <div className="font-bold text-base mt-1 text-center border-y border-black py-1 my-2">
                      MESA 5
                  </div>
              )}

              {config.opciones_impresion.mostrar_mozo && <div>Atiende: Juan Pérez</div>}
              
              {(config.opciones_impresion.mostrar_cliente || config.opciones_impresion.mostrar_direccion) && (
                  <div className="mt-2 pt-1 border-t border-dashed">
                      {config.opciones_impresion.mostrar_cliente && <div>Cliente: María Gonzalez</div>}
                      {config.opciones_impresion.mostrar_direccion && <div>Dir: Av. Siempre Viva 742</div>}
                  </div>
              )}
          </div>

          <div className="border-b border-dashed border-gray-400 my-2"></div>

          {/* Cuerpo Ejemplo */}
          <div className="text-left mb-2">
              <div className="flex justify-between font-bold mb-1"><span>CANT</span><span>TOTAL</span></div>
              <div className="flex justify-between"><span>1 x HAMBURGUESA</span><span>$8.000</span></div>
              <div className="flex justify-between"><span>2 x BEBIDA</span><span>$3.000</span></div>
          </div>

          <div className="border-b border-dashed border-gray-400 my-2"></div>

          <div className="flex justify-between font-bold text-base mb-4">
              <span>TOTAL</span><span>$11.000</span>
          </div>

          <div className="text-center text-xs mt-4">
              <p className="whitespace-pre-line">{config.mensaje_pie || 'Gracias por su visita'}</p>
          </div>
      </div>
  );

  if (loading) return <div className="p-10 text-center">Cargando...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden flex flex-col lg:flex-row">
        
        {/* FORMULARIO */}
        <div className="flex-1 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6 border-b pb-4 border-gray-100">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Receipt className="w-6 h-6" /></div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Diseño del Ticket</h2>
              <p className="text-sm text-gray-500">Personaliza la información impresa</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Datos Empresa */}
            <div className="space-y-4">
                <h3 className="font-bold text-gray-700 flex items-center gap-2"><Building size={16}/> Datos del Local</h3>
                <input name="nombre_fantasia" value={config.nombre_fantasia} onChange={handleChange} placeholder="Nombre Fantasía" className="w-full border p-2 rounded-lg" />
                <div className="grid grid-cols-2 gap-4">
                    <input name="rut" value={config.rut} onChange={handleChange} placeholder="RUT" className="w-full border p-2 rounded-lg" />
                    <input name="telefono" value={config.telefono} onChange={handleChange} placeholder="Teléfono" className="w-full border p-2 rounded-lg" />
                </div>
                <input name="direccion" value={config.direccion} onChange={handleChange} placeholder="Dirección" className="w-full border p-2 rounded-lg" />
            </div>

            {/* Opciones Visuales (Checkboxes) */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><CheckSquare size={16}/> Datos Visibles</h3>
                <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" name="mostrar_fecha" checked={config.opciones_impresion.mostrar_fecha} onChange={handleOptionChange} className="w-4 h-4"/>
                        <span className="text-sm">Fecha</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" name="mostrar_hora" checked={config.opciones_impresion.mostrar_hora} onChange={handleOptionChange} className="w-4 h-4"/>
                        <span className="text-sm">Hora</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" name="mostrar_mesa" checked={config.opciones_impresion.mostrar_mesa} onChange={handleOptionChange} className="w-4 h-4"/>
                        <span className="text-sm font-bold">Mesa / N° Orden</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" name="mostrar_mozo" checked={config.opciones_impresion.mostrar_mozo} onChange={handleOptionChange} className="w-4 h-4"/>
                        <span className="text-sm">Nombre Mozo</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" name="mostrar_cliente" checked={config.opciones_impresion.mostrar_cliente} onChange={handleOptionChange} className="w-4 h-4"/>
                        <span className="text-sm">Nombre Cliente</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" name="mostrar_direccion" checked={config.opciones_impresion.mostrar_direccion} onChange={handleOptionChange} className="w-4 h-4"/>
                        <span className="text-sm">Dirección (Delivery)</span>
                    </label>
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Pie de Página</label>
                <textarea name="mensaje_pie" value={config.mensaje_pie} onChange={handleChange} rows="2" className="w-full border p-2 rounded-lg" placeholder="Gracias por su visita"></textarea>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                {saving ? <RefreshCw className="animate-spin"/> : <Save/>} Guardar
              </button>
            </div>
          </form>
        </div>

        {/* VISTA PREVIA */}
        <div className="w-full lg:w-80 bg-gray-100 p-6 border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col items-center">
            <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 flex items-center gap-2"><Eye size={16}/> Vista Previa</h3>
            <TicketPreview />
        </div>

      </div>
    </div>
  );
}
