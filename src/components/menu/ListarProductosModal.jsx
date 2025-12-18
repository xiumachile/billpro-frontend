// src/components/menu/ListarProductosModal.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, Package, Eye, Edit, Trash2, Filter, Loader, RefreshCw, AlertTriangle } from 'lucide-react';
import { menuApi } from '../../api/menuApi'; // ✅ Importamos API centralizada

// ✅ Función local para estimar costos de productos simples sin llamar a la API
// Esto reduce drásticamente las peticiones al servidor
const estimarCostoLocal = (producto) => {
  if (!producto || producto.es_compuesto) return null; // Retorna null si es compuesto (requiere API)

  const inv = producto.producto_inventario;
  return parseFloat(
    inv?.precio_ultima_compra ??
    inv?.precio_compra ??
    producto.costo_unitario ??
    producto.costo ??
    producto.precio_costo ??
    0
  );
};

export default function ListarProductosModal({
  isOpen,
  onClose,
  productos = [],
  onVerDetalle,
  onEditar,
  onEliminar
}) {
  const [filtro, setFiltro] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [subcategoriaFiltro, setSubcategoriaFiltro] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Estado para guardar costos calculados: { id_producto: costo }
  const [costos, setCostos] = useState({}); 
  const [loadingCostos, setLoadingCostos] = useState(false);

  // 1. Cargar costos (Lógica optimizada)
  useEffect(() => {
    if (!isOpen || productos.length === 0) return;

    const procesarCostos = async () => {
      // Identificar productos que faltan por calcular
      const pendientes = productos.filter(p => costos[p.id] === undefined);

      if (pendientes.length === 0) return;

      setLoadingCostos(true);

      // Lote pequeño para no bloquear la UI ni saturar la red (5 por ciclo)
      const lote = pendientes.slice(0, 5);
      const nuevosCostos = {};

      await Promise.all(lote.map(async (prod) => {
        try {
          // A. Si es simple, calculamos localmente (instantáneo)
          const costoSimple = estimarCostoLocal(prod);
          if (costoSimple !== null) {
            nuevosCostos[prod.id] = costoSimple;
            return;
          }

          // B. Si es compuesto, preguntamos a la API (Axios)
          if (prod.es_compuesto) {
            const data = await menuApi.calcularCostoProducto(prod.id);
            nuevosCostos[prod.id] = parseFloat(data.costo_unitario || 0);
          } else {
            nuevosCostos[prod.id] = 0;
          }
        } catch (error) {
          console.warn(`Error costo ID ${prod.id}:`, error);
          nuevosCostos[prod.id] = 0; // Fallback a 0 si falla
        }
      }));

      // Actualizar estado y provocar el siguiente ciclo del useEffect
      setCostos(prev => ({ ...prev, ...nuevosCostos }));
      
      // Si quedan menos de 5, terminamos la carga visual
      if (pendientes.length <= 5) setLoadingCostos(false);
    };

    procesarCostos();
  }, [isOpen, productos, costos]); // Dependencia 'costos' hace el bucle recursivo seguro

  // 2. Filtros y Categorías
  const categorias = useMemo(() => 
    [...new Set(productos.map(p => p.categoria).filter(Boolean))].sort(),
    [productos]
  );

  const subcategorias = useMemo(() => {
    if (!categoriaFiltro) return [];
    return [...new Set(
      productos
        .filter(p => p.categoria === categoriaFiltro)
        .map(p => p.subcategoria)
        .filter(Boolean)
    )].sort();
  }, [productos, categoriaFiltro]);

  // 3. Unificar datos con cálculos
  const productosConCalculos = useMemo(() => {
    return productos.map(producto => {
      const costoUnitario = costos[producto.id] ?? 0;
      const precioVenta = parseFloat(producto.precio_venta || 0);
      const ganancia = precioVenta - costoUnitario;
      const margen = precioVenta > 0 ? ((ganancia / precioVenta) * 100).toFixed(1) : '0.0';

      return {
        ...producto,
        costo_calculado: costoUnitario,
        ganancia_valor: ganancia,
        ganancia_porcentaje: margen,
        cargando_costo: costos[producto.id] === undefined // Flag para mostrar spinner
      };
    });
  }, [productos, costos]);

  // 4. Filtrado Final
  const productosFiltrados = useMemo(() => {
    return productosConCalculos.filter(prod => {
      const textoLower = filtro.toLowerCase();
      const coincideTexto = !filtro || 
        prod.nombre?.toLowerCase().includes(textoLower) ||
        prod.descripcion?.toLowerCase().includes(textoLower);
      
      const coincideCategoria = !categoriaFiltro || prod.categoria === categoriaFiltro;
      const coincideSubcategoria = !subcategoriaFiltro || prod.subcategoria === subcategoriaFiltro;
      
      return coincideTexto && coincideCategoria && coincideSubcategoria;
    });
  }, [productosConCalculos, filtro, categoriaFiltro, subcategoriaFiltro]);

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      try {
        await onEliminar(id);
      } catch (error) {
        console.error('Error al eliminar:', error);
        alert('Error al eliminar el producto');
      }
    }
  };

  const formatCLP = (value) => 
    new Intl.NumberFormat('es-CL', { 
      style: 'currency', 
      currency: 'CLP',
      minimumFractionDigits: 0 
    }).format(value);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[85vh] shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Listado de Productos</h2>
                <div className="flex items-center gap-2 text-blue-100 text-sm">
                  <span>{productosFiltrados.length} de {productos.length} productos</span>
                  {loadingCostos && <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin"/> Calculando costos...</span>}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-white/10"
              aria-label="Cerrar"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o descripción..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-300 hover:bg-gray-100'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filtros</span>
            </button>
          </div>

          {showFilters && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-in slide-in-from-top-2 duration-200">
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las categorías</option>
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={subcategoriaFiltro}
                onChange={(e) => setSubcategoriaFiltro(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                disabled={!categoriaFiltro}
              >
                <option value="">Todas las subcategorías</option>
                {subcategorias.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  setCategoriaFiltro('');
                  setSubcategoriaFiltro('');
                  setFiltro('');
                }}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 font-medium transition-colors"
              >
                Limpiar Filtros
              </button>
            </div>
          )}
        </div>

        {/* Tabla */}
        <div className="flex-1 overflow-auto">
          {productosFiltrados.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">No se encontraron productos</h3>
              <p className="text-gray-500 text-sm">
                Intenta ajustar los filtros de búsqueda.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Producto</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Precio Venta</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Costo Unit.</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Ganancia</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Margen</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {productosFiltrados.map((producto) => {
                    const esCompuesto = producto.es_compuesto;
                    const cargando = producto.cargando_costo;

                    return (
                      <tr key={producto.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">{producto.nombre}</div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {producto.categoria && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                {producto.categoria}
                              </span>
                            )}
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                              esCompuesto 
                                ? 'bg-purple-50 text-purple-700 border-purple-200' 
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                              {esCompuesto ? 'Receta' : 'Simple'}
                            </span>
                          </div>
                        </td>
                        
                        <td className="px-4 py-3 text-right">
                          <span className="font-bold text-emerald-700">
                            {formatCLP(producto.precio_venta)}
                          </span>
                        </td>
                        
                        <td className="px-4 py-3 text-right">
                          {cargando ? (
                            <span className="inline-flex items-center text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                              <Loader className="w-3 h-3 mr-1 animate-spin" /> ...
                            </span>
                          ) : (
                            <span className="font-semibold text-red-600">
                              {formatCLP(producto.costo_calculado)}
                            </span>
                          )}
                        </td>
                        
                        <td className="px-4 py-3 text-right">
                          <span className={`font-semibold ${
                            producto.ganancia_valor >= 0 ? 'text-emerald-700' : 'text-red-700'
                          }`}>
                            {formatCLP(producto.ganancia_valor)}
                          </span>
                        </td>
                        
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-semibold text-gray-800">{producto.ganancia_porcentaje}%</span>
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  producto.ganancia_porcentaje >= 50 ? 'bg-emerald-500' :
                                  producto.ganancia_porcentaje >= 30 ? 'bg-green-500' :
                                  producto.ganancia_porcentaje >= 15 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(Math.max(parseFloat(producto.ganancia_porcentaje), 0), 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                            producto.activo 
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {producto.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => onVerDetalle(producto)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                              title="Ver detalle"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onEditar(producto)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-100"
                              title="Editar producto"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEliminar(producto.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                              title="Eliminar producto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
}
