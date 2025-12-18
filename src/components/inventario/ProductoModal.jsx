import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Plus } from 'lucide-react';

export default function ProductoModal({
  isOpen,
  onClose,
  producto,
  proveedores = [],
  unidadesMedida = [],
  categorias = [],
  subcategorias = [],
  onSave,
  onAgregarUnidad = (unidad) => unidad,
  onAgregarCategoria = (categoria) => categoria,
  onAgregarSubcategoria = (subcategoria) => subcategoria,
  onCategoriaChange = () => {}
}) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    unidad_medida_id: '',
    categoria: '',
    subcategoria: '',
    precio_compra: '',
    rendimiento: '1.0',
    stock_actual: '',
    stock_reservado: '0',
    stock_minimo: '',
    proveedor_id: '',
    activo: true
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (producto && producto.id) {
      const unidadId = producto.unidad_medida_id || producto.unidadMedida?.id || '';
      setFormData({
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        unidad_medida_id: String(unidadId),
        categoria: producto.categoria || '',
        subcategoria: producto.subcategoria || '',
        precio_compra: producto.precio_compra || '',
        rendimiento: producto.rendimiento || '1.0',
        stock_actual: producto.stock_actual || '',
        stock_reservado: producto.stock_reservado || '0',
        stock_minimo: producto.stock_minimo || '',
        proveedor_id: producto.proveedor_id || '',
        activo: producto.activo !== false
      });
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        unidad_medida_id: '',
        categoria: '',
        subcategoria: '',
        precio_compra: '',
        rendimiento: '1.0',
        stock_actual: '',
        stock_reservado: '0',
        stock_minimo: '',
        proveedor_id: '',
        activo: true
      });
    }
    setErrors({});
  }, [producto, isOpen]);

  const validarFormulario = () => {
    const newErrors = {};
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
    if (!formData.unidad_medida_id) newErrors.unidad_medida_id = 'La unidad de medida es obligatoria';
    if (!formData.categoria.trim()) newErrors.categoria = 'La categoría es obligatoria';

    const rendimiento = parseFloat(formData.rendimiento);
    if (isNaN(rendimiento) || rendimiento <= 0 || rendimiento > 1) {
      newErrors.rendimiento = 'El rendimiento debe estar entre 0.01 y 1.0';
    }

    if (formData.precio_compra && isNaN(parseFloat(formData.precio_compra))) newErrors.precio_compra = 'El precio debe ser un número válido';
    if (formData.stock_actual && isNaN(parseFloat(formData.stock_actual))) newErrors.stock_actual = 'El stock actual debe ser un número válido';
    if (formData.stock_minimo && isNaN(parseFloat(formData.stock_minimo))) newErrors.stock_minimo = 'El stock mínimo debe ser un número válido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({ ...prev, [name]: newValue }));

    if (name === 'categoria' && onCategoriaChange) onCategoriaChange(newValue);
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    setLoading(true);
    try {
      const datos = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || null,
        unidad_medida_id: parseInt(formData.unidad_medida_id) || null,
        categoria: formData.categoria.trim(),
        subcategoria: formData.subcategoria.trim() || null,
        precio_compra: formData.precio_compra ? parseFloat(formData.precio_compra) : null,
        rendimiento: parseFloat(formData.rendimiento) || 1.0,
        stock_actual: formData.stock_actual ? parseFloat(formData.stock_actual) : 0,
        stock_reservado: formData.stock_reservado ? parseFloat(formData.stock_reservado) : 0,
        stock_minimo: formData.stock_minimo ? parseFloat(formData.stock_minimo) : 0,
        proveedor_id: formData.proveedor_id ? parseInt(formData.proveedor_id) : null,
        activo: formData.activo
      };
      await onSave(datos);
    } catch (error) {
      console.error('Error al guardar:', error);
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{producto?.id ? 'Editar Producto' : 'Nuevo Producto'}</h2>
          <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{errors.submit}</p>
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Harina de trigo"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm ${errors.nombre ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Describe el producto..."
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
            />
          </div>

          {/* Categoría y subcategoría */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Categoría <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm ${errors.categoria ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Seleccionar categoría</option>
                  {Array.isArray(categorias) && categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const nueva = prompt('Nueva categoría:');
                    if (nueva?.trim()) {
                      const valor = onAgregarCategoria(nueva.trim());
                      setFormData(prev => ({ ...prev, categoria: valor }));
                    }
                  }}
                  className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {errors.categoria && <p className="text-red-500 text-xs mt-1">{errors.categoria}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Subcategoría</label>
              <div className="flex gap-2">
                <select
                  name="subcategoria"
                  value={formData.subcategoria}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                >
                  <option value="">Seleccionar subcategoría</option>
                  {Array.isArray(subcategorias) && subcategorias.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const nueva = prompt('Nueva subcategoría:');
                    if (nueva?.trim()) {
                      const valor = onAgregarSubcategoria(nueva.trim());
                      setFormData(prev => ({ ...prev, subcategoria: valor }));
                    }
                  }}
                  className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Unidad de medida */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Unidad de medida <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              <select
                name="unidad_medida_id"
                value={formData.unidad_medida_id}
                onChange={handleChange}
                className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm ${errors.unidad_medida_id ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Seleccionar unidad</option>
                {Array.isArray(unidadesMedida) && unidadesMedida.map((u, idx) => (
                  <option key={idx} value={u.id || u}>{u.nombre || u}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  const nueva = prompt('Nueva unidad de medida:');
                  if (nueva?.trim()) {
                    const valor = onAgregarUnidad(nueva.trim());
                    setFormData(prev => ({ ...prev, unidad_medida_id: valor }));
                  }
                }}
                className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-1 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {errors.unidad_medida_id && <p className="text-red-500 text-xs mt-1">{errors.unidad_medida_id}</p>}
          </div>

          {/* Precio, Stock y Rendimiento */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Precio compra</label>
              <input
                type="number"
                name="precio_compra"
                value={formData.precio_compra}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm ${errors.precio_compra ? 'border-red-500' : 'border-gray-300'}`}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Stock actual</label>
              <input
                type="number"
                name="stock_actual"
                value={formData.stock_actual}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm ${errors.stock_actual ? 'border-red-500' : 'border-gray-300'}`}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Stock mínimo</label>
              <input
                type="number"
                name="stock_minimo"
                value={formData.stock_minimo}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm ${errors.stock_minimo ? 'border-red-500' : 'border-gray-300'}`}
              />
            </div>
          </div>

          {/* ✅ Rendimiento */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Rendimiento <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                name="rendimiento"
                value={formData.rendimiento}
                onChange={handleChange}
                step="0.01"
                min="0.01"
                max="1.00"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.rendimiento ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="1.0"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                {Math.round((parseFloat(formData.rendimiento) || 1) * 100)}%
              </div>
            </div>
            {errors.rendimiento && (
              <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.rendimiento}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Valor entre 0.01 y 1.0. Ejemplo: 0.85 = 85% de rendimiento
            </p>
          </div>

          {/* Proveedor */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Proveedor</label>
            <select
              name="proveedor_id"
              value={formData.proveedor_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
            >
              <option value="">Seleccionar proveedor</option>
              {Array.isArray(proveedores) && proveedores.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          {/* Activo */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="activo"
              checked={formData.activo}
              onChange={handleChange}
              className="h-4 w-4"
            />
            <label className="text-sm text-gray-700">Activo</label>
          </div>

          <div className="flex justify-end mt-4 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" /> Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
