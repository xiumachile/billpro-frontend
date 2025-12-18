// src/components/pedido/DetalleProductoModal.jsx

import React from 'react';
import { X, Package, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function DetalleProductoModal({
  isOpen,
  onClose,
  producto
}) {
  if (!isOpen || !producto) return null;

  const {
    id,
    nombre,
    descripcion,
    categoria,
    subcategoria,
    precio_venta,
    activo,
    es_compuesto,
    receta_detalle // Si es compuesto, debería tener este campo
  } = producto;

  const precioFormateado = parseFloat(precio_venta).toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Detalle del Producto</h2>
                <p className="text-blue-100 text-sm">ID: {id}</p>
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

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre</label>
              <p className="text-lg font-bold text-gray-900">{nombre}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Precio de Venta</label>
              <p className="text-xl font-bold text-emerald-600">{precioFormateado}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción</label>
            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border">
              {descripcion || <span className="italic text-gray-500">No especificada</span>}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Categoría</label>
              <p className="text-gray-700">
                {categoria || <span className="italic text-gray-500">No especificada</span>}
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Subcategoría</label>
              <p className="text-gray-700">
                {subcategoria || <span className="italic text-gray-500">No especificada</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              activo ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}>
              {activo ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </div>
            <div>
              <p className="font-semibold text-gray-900">Estado del Producto</p>
              <p className={`text-sm ${activo ? 'text-green-700' : 'text-red-700'}`}>
                {activo ? '✅ Producto Activo' : '❌ Producto Inactivo'}
              </p>
            </div>
          </div>

          {es_compuesto && receta_detalle && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-600" />
                Receta
              </h3>
              <div className="space-y-2">
                {Array.isArray(receta_detalle.detalles) && receta_detalle.detalles.length > 0 ? (
                  receta_detalle.detalles.map((detalle, index) => (
                    <div key={`detalle-${index}`} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                      <span className="font-medium text-gray-800">
                        {detalle.producto_inventario?.nombre || 'Producto desconocido'}
                      </span>
                      <span className="text-gray-600">
                        {detalle.cantidad} {detalle.unidad_medida?.simbolo || ''}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic text-center py-2">No se han definido ingredientes para este producto compuesto.</p>
                )}
              </div>
            </div>
          )}

          {!es_compuesto && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Insumo Directo</h3>
              <p className="text-gray-600">
                Este producto está basado en un insumo directo del inventario.
                {producto.producto_inventario ? ` (${producto.producto_inventario.nombre})` : ' (No especificado)'}
              </p>
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 rounded-b-2xl border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
