// src/components/pedido/ListarCombosModal.jsx

import React, { useState, useEffect } from 'react';
import { X, Edit3, Trash2, Eye, Search, Layers } from 'lucide-react';

export default function ListarCombosModal({
  isOpen,
  onClose,
  combos = [],
  productos = [], // Para resolver nombres de productos dentro del combo
  onVerDetalle = () => {},
  onEditar = () => {},
  onEliminar = () => {}
}) {
  const [filtro, setFiltro] = useState('');
  const [combosFiltrados, setCombosFiltrados] = useState([]);

  useEffect(() => {
    if (Array.isArray(combos)) {
      const texto = filtro.toLowerCase();
      
      const filtrados = combos.filter(c => 
        (c.nombre || '').toLowerCase().includes(texto) ||
        (c.descripcion || '').toLowerCase().includes(texto) ||
        // Buscar también dentro de los items del combo
        (c.items && c.items.some(item => {
            const prodNombre = item.producto_carta?.nombre || 
                               productos.find(p => p.id === item.producto_carta_id)?.nombre || 
                               '';
            return prodNombre.toLowerCase().includes(texto);
        }))
      );
      setCombosFiltrados(filtrados);
    } else {
      setCombosFiltrados([]);
    }
  }, [combos, filtro, productos]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header con Gradiente Diferente (Morado/Rosa para Combos) */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Listado de Combos</h2>
                <p className="text-purple-100 text-sm font-medium">
                  {combosFiltrados.length} de {combos.length} registros
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
              placeholder="Buscar por nombre o contenido del combo..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white shadow-sm transition-all"
              autoFocus
            />
          </div>
        </div>

        {/* Lista de Combos */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-100/50">
          {combosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <Layers className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {filtro ? 'No se encontraron coincidencias' : 'No hay combos disponibles'}
              </h3>
              <p className="text-gray-500 max-w-sm">
                {filtro
                  ? 'Intenta buscar con otro término.'
                  : 'Crea promociones agrupando productos.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {combosFiltrados.map((combo) => {
                // Generar resumen de productos
                const resumenProductos = combo.items?.map(item => {
                  const prod = productos.find(p => p.id === item.producto_carta_id) || item.producto_carta;
                  return prod ? prod.nombre : 'Producto ...';
                }).slice(0, 3).join(', ') + (combo.items?.length > 3 ? '...' : '');

                return (
                  <div key={combo.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md hover:border-purple-300 transition-all duration-200 group">
                    <div className="p-4 flex flex-col h-full">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <h4 className="font-bold text-gray-900 truncate text-lg" title={combo.nombre}>
                            {combo.nombre}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2 min-h-[2.5em]">
                            {combo.descripcion || 'Sin descripción'}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="block font-bold text-xl text-emerald-600 tracking-tight">
                            ${parseFloat(combo.precio || 0).toLocaleString('es-CL')}
                          </span>
                        </div>
                      </div>

                      {/* Sección de contenido del combo */}
                      <div className="bg-purple-50 p-2 rounded-lg text-xs text-purple-700 mb-4 flex items-start gap-2">
                         <Layers size={14} className="mt-0.5 flex-shrink-0"/>
                         <span className="line-clamp-2">
                            {resumenProductos || 'Sin productos definidos'}
                         </span>
                      </div>

                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold ${
                            combo.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {combo.activo ? 'Activo' : 'Inactivo'}
                          </span>
                          <span className="text-xs text-gray-400 font-medium">
                            {combo.items?.length || 0} ítems
                          </span>
                        </div>

                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onVerDetalle(combo)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver detalle"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => onEditar(combo)}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit3 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                                if(window.confirm('¿Eliminar este combo?')) onEliminar(combo.id);
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
                );
              })}
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
