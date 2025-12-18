import React, { useState } from 'react';
import { Package, AlertTriangle, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import EvolucionPrecioModal from './EvolucionPrecioModal';

// Función para formatear números a 2 decimales
const formatStock = (value) => {
  if (value === null || value === undefined) return '0.00';
  return parseFloat(value).toFixed(2);
};

// Función para formatear moneda
const formatPrecio = (value) => {
  if (value === null || value === undefined || value === 0) return '-';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function ProductoList({ productos, proveedores = [], onEdit, onDelete, loading }) {
  const [modalEvolucionOpen, setModalEvolucionOpen] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  
  // Estados de paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(30);

  const handleAbrirEvolucion = (producto) => {
    setProductoSeleccionado(producto);
    setModalEvolucionOpen(true);
  };

  // ✅ Corregido: Comparar IDs como números
  const getProveedorNombre = (producto) => {
    if (producto.proveedor && producto.proveedor.nombre) {
      return producto.proveedor.nombre;
    }

    if (Array.isArray(proveedores)) {
      const prov = proveedores.find(p => Number(p.id) === Number(producto.proveedor_id));
      if (prov) return prov.nombre;
    }

    return 'Sin proveedor';
  };

  // Cálculos de paginación
  const totalPaginas = Math.ceil(productos.length / itemsPorPagina);
  const indiceInicio = (paginaActual - 1) * itemsPorPagina;
  const indiceFin = indiceInicio + itemsPorPagina;
  const productosPaginados = productos.slice(indiceInicio, indiceFin);

  const irAPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  const paginaAnterior = () => {
    if (paginaActual > 1) {
      setPaginaActual(paginaActual - 1);
    }
  };

  const paginaSiguiente = () => {
    if (paginaActual < totalPaginas) {
      setPaginaActual(paginaActual + 1);
    }
  };

  const generarNumerosPagina = () => {
    const paginas = [];
    const maxPaginasVisibles = 5;
    
    let inicio = Math.max(1, paginaActual - Math.floor(maxPaginasVisibles / 2));
    let fin = Math.min(totalPaginas, inicio + maxPaginasVisibles - 1);
    
    if (fin - inicio < maxPaginasVisibles - 1) {
      inicio = Math.max(1, fin - maxPaginasVisibles + 1);
    }

    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }

    return paginas;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (productos.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-1">Sin productos</h3>
        <p className="text-gray-500">No hay productos en el inventario</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Controles de paginación superior */}
        <div className="bg-gray-50 border-b px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Mostrar</span>
              <select
                value={itemsPorPagina}
                onChange={(e) => {
                  setItemsPorPagina(Number(e.target.value));
                  setPaginaActual(1);
                }}
                className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-600">productos</span>
            </div>
            <div className="text-sm text-gray-600">
              Mostrando {indiceInicio + 1} a {Math.min(indiceFin, productos.length)} de {productos.length} productos
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Compra</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rendimiento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productosPaginados.map((producto) => {
                const bajoStock = producto.stock_actual <= producto.stock_minimo;
                // ✅ Calcular stock real considerando el rendimiento
                const rendimiento = parseFloat(producto.rendimiento) || 1;
                const stockReal = producto.stock_actual * rendimiento;
                
                return (
                  <tr key={producto.id} className={bajoStock ? 'bg-yellow-50' : 'hover:bg-gray-50 transition-colors'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {bajoStock && (
                          <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{producto.nombre}</div>
                          <div className="text-sm text-gray-500">{producto.descripcion || 'Sin descripción'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {producto.unidad_medida}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-sm font-semibold ${
                          bajoStock ? 'text-yellow-700' : 'text-gray-900'
                        }`}>
                          {formatStock(producto.stock_actual)} {producto.unidad_medida}
                        </span>
                        {bajoStock && (
                          <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                            Bajo stock
                          </span>
                        )}
                      </div>
                      {/* ✅ Stock Real = Stock Actual × Rendimiento */}
                      <div className="text-xs text-gray-500">
                        Stock Real: {formatStock(stockReal)} {producto.unidad_medida}
                        {rendimiento !== 1 && (
                          <span className="ml-1 text-amber-600">
                            ({Math.round(rendimiento * 100)}%)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatPrecio(producto.precio_compra)}
                      </div>
                      {producto.fecha_ultima_compra && (
                        <div className="text-xs text-gray-500">
                          {new Date(producto.fecha_ultima_compra).toLocaleDateString('es-CL')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {producto.rendimiento !== 1.0 ? (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                          {Math.round(producto.rendimiento * 100)}%
                        </span>
                      ) : (
                        <span className="text-gray-400">100%</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getProveedorNombre(producto)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleAbrirEvolucion(producto)}
                          className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                          title="Ver evolución de precio"
                        >
                          <TrendingUp className="w-4 h-4 inline mr-1" />
                          <span>Evolución</span>
                        </button>
                        <button
                          onClick={() => onEdit(producto)}
                          className="text-green-600 hover:text-green-900 hover:bg-green-50 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => onDelete(producto.id, producto.nombre)}
                          className="text-red-600 hover:text-red-900 hover:bg-red-50 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Controles de paginación inferior */}
        {totalPaginas > 1 && (
          <div className="bg-gray-50 border-t px-6 py-4">
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={paginaAnterior}
                disabled={paginaActual === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>

              {generarNumerosPagina().map(numeroPagina => (
                <button
                  key={numeroPagina}
                  onClick={() => irAPagina(numeroPagina)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    paginaActual === numeroPagina
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                      : 'border border-gray-300 hover:bg-white text-gray-700'
                  }`}
                >
                  {numeroPagina}
                </button>
              ))}

              <button
                onClick={paginaSiguiente}
                disabled={paginaActual === totalPaginas}
                className="p-2 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Evolución de Precio */}
      {productoSeleccionado && (
        <EvolucionPrecioModal
          isOpen={modalEvolucionOpen}
          onClose={() => {
            setModalEvolucionOpen(false);
            setProductoSeleccionado(null);
          }}
          producto={productoSeleccionado}
        />
      )}
    </>
  );
}