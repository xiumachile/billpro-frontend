// src/components/pedido/ListarProductosModal.jsx

import React, { useState, useEffect } from 'react';
import { X, Package, Edit3, Trash2, Eye, Search } from 'lucide-react';

export default function ListarProductosModal({
  isOpen,
  onClose,
  productos = [], // Recibe la lista desde el padre
  onVerDetalle = () => {},
  onEditar = () => {},
  onEliminar = () => {}
}) {
  const [filtro, setFiltro] = useState('');
  const [productosFiltrados, setProductosFiltrados] = useState([]);

  // Efecto para filtrar productos cuando cambia el texto o la lista
  useEffect(() => {
    if (Array.isArray(productos) && productos.length > 0) {
      const texto = filtro.toLowerCase();
      
      const filtrados = productos.filter(p => 
        (p.nombre || '').toLowerCase().includes(texto) ||
        (p.descripcion || '').toLowerCase().includes(texto) ||
        (p.categoria?.nombre || p.categoria || '').toLowerCase().includes(texto) || 
        (p.codigo || '').toLowerCase().includes(texto)
      );
      setProductosFiltrados(filtrados);
    } else {
      setProductosFiltrados([]);
    }
  }, [productos, filtro]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Listado de Productos</h2>
                <p className="text-blue-100 text-sm font-medium">
                  Mostrando {productosFiltrados.length} de {productos.length} registros
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Barra de Búsqueda */}
        <div className="p-4 border-b bg-gray-50 flex-shrink-0">
          <div className="relative max-w-lg mx-auto">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, código o categoría..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all"
              autoFocus
            />
          </div>
        </div>

        {/* Lista de Productos (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-100/50">
          {productosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <Package className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {filtro ? 'No se encontraron coincidencias' : 'No hay productos disponibles'}
              </h3>
              <p className="text-gray-500 max-w-sm">
                {filtro
                  ? 'Intenta buscar con otro término o revisa la ortografía.'
                  : 'Asegúrate de que la carta tenga productos asignados.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {productosFiltrados.map((producto) => (
                <div 
                  key={producto.id} 
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md hover:border-blue-300 transition-all duration-200 group"
                >
                  <div className="p-4 flex flex-col h-full">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 truncate text-lg" title={producto.nombre}>
                          {producto.nombre}
                        </h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {producto.codigo && (
                                <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border">
                                    {producto.codigo}
                                </span>
                            )}
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                {producto.categoria?.nombre || producto.categoria || 'Sin Categoría'}
                            </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                         <span className="block font-bold text-xl text-emerald-600 tracking-tight">
                          ${parseFloat(producto.precio_venta || 0).toLocaleString('es-CL')}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-grow">
                      {producto.descripcion || 'Sin descripción detallada.'}
                    </p>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-2">
                             <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold ${
                                producto.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {producto.activo ? 'Activo' : 'Inactivo'}
                              </span>
                        </div>

                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => onVerDetalle(producto)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Ver detalle"
                            >
                                <Eye className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => onEditar(producto)}
                                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Editar"
                            >
                                <Edit3 className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => {
                                    if(window.confirm('¿Eliminar este producto?')) onEliminar(producto.id);
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 rounded-b-2xl border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold rounded-lg transition-colors shadow-sm"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
}
