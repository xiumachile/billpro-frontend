// src/components/menu/CrearCartaModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Layers, Save, AlertCircle, DollarSign } from 'lucide-react';
import { menuApi } from '../../api/menuApi'; // ✅ Importar API para cargar listas

export default function CrearCartaModal({ isOpen, onClose, onCrear }) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo_precio_id: 1 // ✅ Por defecto ID 1 (Precio Base/Local)
  });
  
  const [tiposPrecios, setTiposPrecios] = useState([]); // ✅ Estado para guardar las listas disponibles
  const [loading, setLoading] = useState(false);
  const [loadingPrecios, setLoadingPrecios] = useState(false); // Estado de carga de listas
  const [error, setError] = useState('');
  const [detallesError, setDetallesError] = useState(null);

  // ✅ Cargar listas de precios al abrir el modal
  useEffect(() => {
    if (isOpen) {
        const cargarListas = async () => {
            setLoadingPrecios(true);
            try {
                const res = await menuApi.getTiposPrecios();
                const data = Array.isArray(res) ? res : (res.data || []);
                setTiposPrecios(data);
            } catch (e) {
                console.error("Error cargando listas de precios", e);
            } finally {
                setLoadingPrecios(false);
            }
        };
        cargarListas();
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      setError('El nombre de la carta es obligatorio');
      return;
    }

    setLoading(true);
    setError('');
    setDetallesError(null);

    try {
      const datosEnviar = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion?.trim() || null,
        estado: 'inactiva', // Siempre inactiva al crear
        tipo_precio_id: parseInt(formData.tipo_precio_id) // ✅ Enviamos la lista seleccionada
      };

      console.log('📤 Datos que se enviarán:', datosEnviar);
      
      await onCrear(datosEnviar);
      
      // Resetear formulario
      setFormData({
        nombre: '',
        descripcion: '',
        tipo_precio_id: 1
      });
      onClose();
    } catch (err) {
      console.error('Error completo al crear carta:', err);
      
      if (err.messages) {
        const mensajesError = Object.entries(err.messages)
          .map(([campo, errores]) => {
            const listaErrores = Array.isArray(errores) ? errores : [errores];
            return `• ${campo}: ${listaErrores.join(', ')}`;
          })
          .join('\n');
        setError('Errores de validación:');
        setDetallesError(mensajesError);
      } else {
        setError(err.message || 'Error al crear la carta');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1200] p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Crear Nueva Carta</h2>
                <p className="text-green-100 text-sm">Configura tu menú y precios</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Cerrar"
              disabled={loading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            
            {/* Nombre */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre de la Carta <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Menú Rappi, Carta Venta Nocturna"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                disabled={loading}
                required
              />
            </div>

            {/* ✅ SELECTOR DE LISTA DE PRECIOS */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <DollarSign size={16} className="text-green-600"/> Lista de Precios
              </label>
              {loadingPrecios ? (
                  <div className="text-xs text-gray-500">Cargando listas...</div>
              ) : (
                  <div className="relative">
                    <select
                        name="tipo_precio_id"
                        value={formData.tipo_precio_id}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white appearance-none cursor-pointer"
                        disabled={loading}
                    >
                        {tiposPrecios.map(tp => (
                            <option key={tp.id} value={tp.id}>
                                {tp.nombre} {tp.id === 1 ? '(Base)' : ''}
                            </option>
                        ))}
                    </select>
                    {/* Flecha decorativa */}
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
              )}
              <p className="text-xs text-gray-500 mt-1">Define qué precios usará esta carta (Ej: Local vs Apps).</p>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Descripción (opcional)
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Describe brevemente esta carta..."
                rows={2}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
                disabled={loading}
              />
            </div>

            {/* Información sobre el estado */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                ℹ️ La carta se creará <strong>inactiva</strong>. Podrás activarla después.
              </p>
            </div>

            {/* Mensaje de error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-700">{error}</p>
                    {detallesError && (
                      <pre className="text-xs text-red-600 mt-2 whitespace-pre-wrap font-mono bg-red-100 p-2 rounded">
                        {detallesError}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creando...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Crear Carta</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
