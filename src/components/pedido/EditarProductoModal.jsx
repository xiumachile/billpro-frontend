// src/components/pedido/EditarProductoModal.jsx

import React, { useState, useEffect } from 'react';
import { X, Save, Package, AlertCircle, Edit3, CheckCircle } from 'lucide-react';

export default function EditarProductoModal({
  isOpen,
  onClose,
  producto,
  onSave,
  productosInventario = []
}) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria: '',
    subcategoria: '',
    precio_venta: '',
    zona_impresion: 'cocina',
    es_compuesto: false,
    activo: true,
    producto_inventario_id: null,
    // Campos para compuestos
    receta_detalles: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cargar datos iniciales al abrir
  useEffect(() => {
    if (isOpen && producto) {
      setFormData({
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        categoria: producto.categoria || '',
        subcategoria: producto.subcategoria || '',
        precio_venta: String(producto.precio_venta || ''),
        zona_impresion: producto.zona_impresion || 'cocina',
        es_compuesto: producto.es_compuesto || false,
        activo: producto.activo !== false,
        producto_inventario_id: producto.producto_inventario_id || null,
        // Si es compuesto, cargar la receta
        receta_detalles: producto.receta?.detalles || producto.recetaDetalles || []
      });
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        categoria: '',
        subcategoria: '',
        precio_venta: '',
        zona_impresion: 'cocina',
        es_compuesto: false,
        activo: true,
        producto_inventario_id: null,
        receta_detalles: []
      });
    }
  }, [isOpen, producto]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleGuardar = async () => {
    setError('');

    if (!formData.nombre.trim()) {
      setError('El nombre del producto es obligatorio');
      return;
    }

    const precio = parseFloat(formData.precio_venta);
    if (isNaN(precio) || precio <= 0) {
      setError('El precio de venta debe ser un número válido mayor a 0');
      return;
    }

    const datosAGuardar = {
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim() || null,
      categoria: formData.categoria.trim() || null,
      subcategoria: formData.subcategoria.trim() || null,
      precio_venta: precio,
      zona_impresion: formData.zona_impresion,
      es_compuesto: formData.es_compuesto,
      activo: formData.activo
    };

    if (formData.es_compuesto) {
      // Validar receta_detalles
      if (!Array.isArray(formData.receta_detalles) || formData.receta_detalles.length === 0) {
        setError('Un producto compuesto debe tener al menos un ingrediente');
        return;
      }

      const detallesValidos = formData.receta_detalles.every(det => 
        det.producto_inventario_id && 
        !isNaN(parseFloat(det.cantidad)) && 
        parseFloat(det.cantidad) > 0 && 
        det.unidad_medida_id
      );

      if (!detallesValidos) {
        setError('Todos los ingredientes deben tener producto, cantidad y unidad válidos');
        return;
      }

      datosAGuardar.receta = { detalles: formData.receta_detalles };
    } else {
      if (!formData.producto_inventario_id) {
        setError('Debes seleccionar un insumo directo para un producto simple');
        return;
      }
      datosAGuardar.producto_inventario_id = parseInt(formData.producto_inventario_id);
    }

    setLoading(true);
    try {
      await onSave(producto.id, datosAGuardar);
      onClose();
    } catch (err) {
      console.error('Error al guardar producto editado:', err);
      let mensaje = 'Error al guardar el producto.';
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

  if (!isOpen || !producto) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <Edit3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Editar Producto</h2>
                <p className="text-blue-100 text-sm">ID: {producto.id} • {producto.nombre}</p>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Hamburguesa Clásica"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Detalles del producto..."
                  rows="2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <input
                  type="text"
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Platos Fuertes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subcategoría</label>
                <input
                  type="text"
                  name="subcategoria"
                  value={formData.subcategoria}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Carnes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio de Venta *</label>
                <input
                  type="number"
                  step="0.01"
                  name="precio_venta"
                  value={formData.precio_venta}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zona de Impresión</label>
                <select
                  name="zona_impresion"
                  value={formData.zona_impresion}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="cocina">Cocina</option>
                  <option value="barra">Barra</option>
                  <option value="postres">Postres</option>
                  <option value="otros">Otros</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    name="es_compuesto"
                    checked={formData.es_compuesto}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${formData.es_compuesto ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
                  <div
                    className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform ${formData.es_compuesto ? 'translate-x-4' : ''}`}
                  ></div>
                </div>
                <span className="ml-3 text-sm font-medium text-gray-700">Producto Compuesto</span>
              </label>
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
                <span className="ml-3 text-sm font-medium text-gray-700">Producto Activo</span>
              </label>
            </div>

            {!formData.es_compuesto ? (
              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">Insumo Directo *</label>
                <select
                  name="producto_inventario_id"
                  value={formData.producto_inventario_id || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required={!formData.es_compuesto}
                >
                  <option value="">-- Seleccionar Insumo --</option>
                  {productosInventario.map(item => (
                    <option key={`inv-${item.id}`} value={item.id}>
                      {item.nombre} ({item.unidad_medida}) - ${item.precio_compra}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-md font-semibold text-gray-800 mb-2">Receta (Ingredientes)</h4>
                <p className="text-xs text-gray-500 mb-3">No es editable en este modal. Debes usar el editor de recetas.</p>
                <div className="text-sm text-gray-600">
                  {formData.receta_detalles.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
                      {formData.receta_detalles.map((detalle, index) => (
                        <li key={index}>
                          {detalle.nombre_producto || `Ingrediente ${index + 1}`} - {detalle.cantidad} {detalle.nombre_unidad || 'unidad'}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>Sin ingredientes definidos</p>
                  )}
                </div>
              </div>
            )}
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  <span>Actualizar Producto</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
