// src/components/pedido/EditarComboModal.jsx

import React, { useState, useEffect } from 'react';
import { X, Save, Package, AlertCircle, Edit3 } from 'lucide-react';

export default function EditarComboModal({
  isOpen,
  onClose,
  combo,
  productos = [], // Productos de la carta
  onSave
}) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    activo: true,
    items: [] // [{ producto_carta_id, cantidad }]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && combo) {
      setFormData({
        nombre: combo.nombre || '',
        descripcion: combo.descripcion || '',
        precio: String(combo.precio || ''),
        activo: combo.activo !== false,
        items: combo.items?.map(item => ({
          producto_carta_id: item.producto_carta_id || item.producto_carta?.id || item.referencia_id,
          cantidad: item.cantidad || item.cantidad_uso || 1
        })) || []
      });
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        precio: '',
        activo: true,
        items: []
      });
    }
  }, [isOpen, combo]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAgregarItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { producto_carta_id: '', cantidad: 1 }]
    }));
  };

  const handleEliminarItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleActualizarItem = (index, campo, valor) => {
    setFormData(prev => {
      const nuevosItems = [...prev.items];
      nuevosItems[index] = { ...nuevosItems[index], [campo]: valor };
      return { ...prev, items: nuevosItems };
    });
  };

  const handleGuardar = async () => {
    setError('');

    if (!formData.nombre.trim()) {
      setError('El nombre del combo es obligatorio');
      return;
    }

    const precio = parseFloat(formData.precio);
    if (isNaN(precio) || precio <= 0) {
      setError('El precio del combo debe ser un número válido mayor a 0');
      return;
    }

    if (formData.items.length === 0) {
      setError('El combo debe tener al menos un producto');
      return;
    }

    const itemsValidos = formData.items.every(item => 
      item.producto_carta_id && 
      Number.isInteger(item.cantidad) && 
      item.cantidad > 0
    );

    if (!itemsValidos) {
      setError('Todos los productos deben estar seleccionados y tener una cantidad válida');
      return;
    }

    const datosAGuardar = {
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim() || null,
      precio: precio,
      activo: formData.activo,
      items: formData.items.map(item => ({
        producto_carta_id: parseInt(item.producto_carta_id),
        cantidad: parseInt(item.cantidad)
      }))
    };

    setLoading(true);
    try {
      await onSave(combo.id, datosAGuardar);
      onClose();
    } catch (err) {
      console.error('Error al guardar combo editado:', err);
      let mensaje = 'Error al guardar el combo.';
      if (err.messages) {
        mensaje = Object.entries(err.messages)
          .map(([campo, arr]) => `- ${campo}: ${arr.join(', ')}`)
          .join('\n');
      } else if (err.message) {
        mensaje = err.message;
      }
      setError(mensaje);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !combo) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <Edit3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Editar Combo</h2>
                <p className="text-purple-100 text-sm">ID: {combo.id} • {combo.nombre}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 p-3 rounded-lg flex items-start gap-2 mb-4">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <pre className="text-xs whitespace-pre-wrap">{error}</pre>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Ej: Combo Familiar"
                  required
                  autoFocus
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Ej: Incluye 2 hamburguesas, papas y bebida"
                  rows="2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio *</label>
                <input
                  type="number"
                  step="0.01"
                  name="precio"
                  value={formData.precio}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="flex items-center pt-6">
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="activo"
                      checked={formData.activo}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${formData.activo ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                    <div
                      className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform ${formData.activo ? 'translate-x-4' : ''}`}
                    ></div>
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-700">Combo Activo</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-md font-semibold text-gray-800">Productos del Combo</h4>
                <button
                  type="button"
                  onClick={handleAgregarItem}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Agregar
                </button>
              </div>

              {formData.items.length === 0 ? (
                <p className="text-gray-500 text-sm italic">Aún no se han agregado productos al combo.</p>
              ) : (
                <div className="space-y-2">
                  {formData.items.map((item, index) => {
                    const producto = productos.find(p => p.id == item.producto_carta_id);
                    return (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border">
                        <select
                          value={item.producto_carta_id}
                          onChange={(e) => handleActualizarItem(index, 'producto_carta_id', e.target.value)}
                          className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">-- Seleccionar producto --</option>
                          {productos.map(prod => (
                            <option key={`prod-${prod.id}`} value={prod.id}>
                              {prod.nombre} - ${prod.precio_venta}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="1"
                          value={item.cantidad}
                          onChange={(e) => handleActualizarItem(index, 'cantidad', parseInt(e.target.value) || 1)}
                          className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded text-center"
                        />
                        <button
                          type="button"
                          onClick={() => handleEliminarItem(index)}
                          className="w-8 h-8 text-red-600 hover:bg-red-100 rounded-full flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleGuardar}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  <span>Actualizar Combo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
