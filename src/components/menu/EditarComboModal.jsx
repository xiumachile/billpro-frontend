import React, { useState, useEffect } from 'react';
import { X, Save, Package, AlertCircle, Plus, Trash2, Printer } from 'lucide-react';
import { menuApi } from '../../api/menuApi'; // ✅ Importar API

export default function EditarComboModal({
  isOpen,
  onClose,
  combo,
  productos = [],
  onSave
}) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [activo, setActivo] = useState(true);
  const [items, setItems] = useState([]);
  
  // ✅ ESTADOS PARA IMPRESIÓN
  const [zonaImpresion, setZonaImpresion] = useState('');
  const [opcionImpresion, setOpcionImpresion] = useState('nombre');
  const [impresoras, setImpresoras] = useState([]); // Lista cargada de la BD

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ✅ CARGAR IMPRESORAS AL ABRIR
  useEffect(() => {
    if (isOpen) {
      cargarImpresoras();
    }
  }, [isOpen]);

  const cargarImpresoras = async () => {
    try {
      const res = await menuApi.getImpresoras();
      const data = Array.isArray(res) ? res : (res.data || []);
      setImpresoras(data);
    } catch (error) {
      console.error("Error cargando impresoras", error);
    }
  };

  // ✅ Cargar datos iniciales (incluyendo zona de impresión)
  useEffect(() => {
    if (combo && isOpen) {
      console.log('🔍 Combo para edición:', combo);
      
      setNombre(combo.nombre || '');
      setDescripcion(combo.descripcion || '');
      setPrecio(combo.precio || '');
      setActivo(combo.activo !== false);
      
      // Cargar configuración de impresión existente
      setZonaImpresion(combo.zona_impresion || ''); 
      setOpcionImpresion(combo.opcion_impresion || 'nombre');

      const itemsCargados = (combo.items || []).map(item => ({
        id: item.id || Math.random(),
        producto_carta_id: item.producto_carta_id || item.producto_carta?.id || null,
        cantidad: item.cantidad || 1
      }));
      
      setItems(itemsCargados);
    }
  }, [combo, isOpen]);

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), producto_carta_id: null, cantidad: 1 }]);
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleProductoChange = (id, productoId) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, producto_carta_id: productoId || null } : item
    ));
  };

  const handleCantidadChange = (id, cantidad) => {
    const num = parseInt(cantidad);
    setItems(items.map(item =>
      item.id === id ? { ...item, cantidad: isNaN(num) ? 1 : Math.max(1, num) } : item
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    if (items.length === 0) {
      setError('El combo debe tener al menos un producto');
      return;
    }
    if (items.some(item => !item.producto_carta_id)) {
      setError('Todos los productos deben estar seleccionados');
      return;
    }

    const datos = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || null,
      precio: parseFloat(precio) || 0,
      
      // ✅ Enviar datos de impresión
      zona_impresion: zonaImpresion || null,
      opcion_impresion: opcionImpresion,
      
      activo,
      items: items.map(item => ({
        producto_carta_id: parseInt(item.producto_carta_id),
        cantidad: parseInt(item.cantidad)
      }))
    };

    console.log('📤 Datos a enviar para actualizar combo:', JSON.stringify(datos, null, 2));

    try {
      setLoading(true);
      await onSave(combo.id, datos);
      console.log('✅ Combo actualizado exitosamente');
      onClose();
    } catch (err) {
      console.error('❌ Error completo al editar combo:', err);
      if (err.messages) {
        const mensajesDetallados = Object.entries(err.messages)
          .map(([campo, errores]) => `${campo}: ${errores.join(', ')}`)
          .join('\n');
        setError(`Errores de validación:\n${mensajesDetallados}`);
      } else {
        setError(err.message || 'Error al actualizar el combo');
      }
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl flex flex-col">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 rounded-t-2xl flex justify-between items-center">
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold">Editar Combo</h3>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <pre className="text-xs whitespace-pre-wrap">{error}</pre>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Ej: Combo Familiar"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio del Combo ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-bold"
                />
              </div>

              {/* ✅ SELECTOR DE ZONA DE IMPRESIÓN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Printer size={14}/> Zona de Impresión
                </label>
                <select 
                    value={zonaImpresion} 
                    onChange={(e) => setZonaImpresion(e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="">-- Sin Impresión --</option>
                  <option value="cocina">Cocina (Default)</option>
                  <option value="barra">Barra</option>
                  {impresoras.map(imp => (
                      <option key={imp.id} value={imp.nombre}>{imp.nombre} ({imp.tipo_impresora})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opción de Impresión</label>
                <select value={opcionImpresion} onChange={(e) => setOpcionImpresion(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="nombre">Solo nombre</option>
                  <option value="nombre+contenido">Nombre + contenido</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                rows={2}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Ej: Incluye 2 hamburguesas, papas y bebida"
              />
            </div>

            {/* Productos del combo */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-bold text-gray-700">Productos incluidos</label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Agregar
                </button>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-4 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                  Aún no hay productos en este combo.
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <select
                        value={item.producto_carta_id || ''}
                        onChange={(e) => handleProductoChange(item.id, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">-- Seleccionar producto --</option>
                        {productos.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.nombre} • ${p.precio_venta}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        value={item.cantidad}
                        onChange={(e) => handleCantidadChange(item.id, e.target.value)}
                        className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-center"
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="w-8 h-8 text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                id="activo-combo-edit"
                type="checkbox"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
              />
              <label htmlFor="activo-combo-edit" className="text-sm font-medium text-gray-700">
                Combo activo
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center gap-1 disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Guardando...' : 'Actualizar Combo'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
