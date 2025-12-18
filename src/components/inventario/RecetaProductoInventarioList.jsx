// src/components/inventario/RecetaProductoInventarioList.jsx
import React, { useState } from 'react';
import { 
  Edit2, 
  Trash2, 
  Eye, 
  DollarSign, 
  Package as PackageIcon,
  ChevronLeft, 
  ChevronRight,
  Search,
  Plus,
  AlertCircle,
  X,
  Play // ✅ Agregar icono de Play para producción
} from 'lucide-react';

export default function RecetaProductoInventarioList({ 
  recetas, 
  onEdit, 
  onDelete, 
  loading,
  onVolver,
  unidadesMedida = [], 
  onVerDetalle,
  onProducir // ✅ Nueva prop para producción
}) {
  // Estados de paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(10);
  const [busqueda, setBusqueda] = useState('');

  // Función para obtener la unidad de medida
  const obtenerUnidadMedida = (receta) => {
    // Caso 0: Buscar por unidad_medida_id en el array de unidades
    if (receta.unidad_medida_id && unidadesMedida.length > 0) {
      const unidadEncontrada = unidadesMedida.find(u => u.id === receta.unidad_medida_id);
      if (unidadEncontrada) {
        return `${unidadEncontrada.nombre} (${unidadEncontrada.simbolo})`;
      }
    }
    // Caso 1: Es un objeto con nombre y símbolo
    if (receta.unidadMedida && typeof receta.unidadMedida === 'object') {
      return `${receta.unidadMedida.nombre || ''} (${receta.unidadMedida.simbolo || ''})`;
    }
    
    // Caso 2: Es un objeto con unidad_medida
    if (receta.unidad_medida && typeof receta.unidad_medida === 'object') {
      return `${receta.unidad_medida.nombre || ''} (${receta.unidad_medida.simbolo || ''})`;
    }
    
    // Caso 3: Es un string directo en unidadMedida
    if (receta.unidadMedida && typeof receta.unidadMedida === 'string') {
      return receta.unidadMedida;
    }
    
    // Caso 4: Es un string directo en unidad_medida
    if (receta.unidad_medida && typeof receta.unidad_medida === 'string') {
      return receta.unidad_medida;
    }
    
    // Caso 5: Campo unidad
    if (receta.unidad && typeof receta.unidad === 'string') {
      return receta.unidad;
    }
    
    // Caso 6: Campo unidad como objeto
    if (receta.unidad && typeof receta.unidad === 'object') {
      return `${receta.unidad.nombre || ''} (${receta.unidad.simbolo || ''})`;
    }
    
    return 'Sin unidad';
  };

  // Filtrar recetas por búsqueda
  const recetasFiltradas = recetas.filter(receta =>
    receta.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (receta.descripcion && receta.descripcion.toLowerCase().includes(busqueda.toLowerCase()))
  );

  // Cálculos de paginación
  const totalPaginas = Math.ceil(recetasFiltradas.length / itemsPorPagina);
  const indiceInicio = (paginaActual - 1) * itemsPorPagina;
  const indiceFin = indiceInicio + itemsPorPagina;
  const recetasPaginadas = recetasFiltradas.slice(indiceInicio, indiceFin);

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
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (recetas.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <PackageIcon className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Sin recetas de productos</h3>
        <p className="text-gray-500 mb-6">Aún no hay recetas de productos de inventario registradas</p>
        <button
          onClick={() => onEdit(null)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg mx-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Primera Receta</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Controles de paginación superior */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b px-6 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Mostrar</span>
            <select
              value={itemsPorPagina}
              onChange={(e) => {
                setItemsPorPagina(Number(e.target.value));
                setPaginaActual(1);
              }}
              className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-600">registros</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar recetas..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPaginaActual(1);
                }}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Receta</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Unidad</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Costo Unitario</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Precio Venta</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Estado</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {recetasPaginadas.map((receta) => {
              console.log('🔍 Receta completa:', receta); // Log para debug
              return (
                <tr key={receta.id} className="hover:bg-gray-50 transition-colors">
                  {/* 1 Nombre */}
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{receta.nombre}</div>
                    <div className="text-sm text-gray-500">{receta.descripcion || 'Sin descripción'}</div>
                  </td>

                  {/* 2 Unidad */}
                  <td className="px-6 py-4 text-gray-700">
                    {obtenerUnidadMedida(receta)}
                  </td>

                  {/* 3 Costo Unitario */}
                  <td className="px-6 py-4 text-right font-semibold text-gray-900">
                    ${parseFloat(receta.costo_unitario || 0).toFixed(2)}
                  </td>

                  {/* 4 Precio Venta */}
                  <td className="px-6 py-4 text-right font-semibold text-gray-900">
                    ${parseFloat(receta.precio_venta || 0).toFixed(2)}
                  </td>

                  {/* 5 Estado */}
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      receta.activo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {receta.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>

                  {/* 6 Acciones - ✅ Actualizado con botón de producción */}
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => onVerDetalle(receta)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" 
                        title="Ver detalle de receta"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onProducir(receta)}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors" 
                        title="Producir receta"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onEdit(receta)}
                        className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors" 
                        title="Editar receta"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDelete(receta.id, receta.nombre)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors" 
                        title="Eliminar receta"
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

      {/* Controles de paginación inferior */}
      {totalPaginas > 1 && (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t px-6 py-4">
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
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white'
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

      {/* Resumen */}
      {recetas.length > 0 && (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Total de recetas</p>
              <p className="text-lg font-bold text-gray-900">{recetas.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Costo total</p>
              <p className="text-lg font-bold text-gray-900">
                ${recetas.reduce((sum, r) => sum + parseFloat(r.costo_unitario || 0), 0).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Precio venta total</p>
              <p className="text-lg font-bold text-gray-900">
                ${recetas.reduce((sum, r) => sum + parseFloat(r.precio_venta || 0), 0).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Recetas activas</p>
              <p className="text-lg font-bold text-green-600">
                {recetas.filter(r => r.activo).length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
