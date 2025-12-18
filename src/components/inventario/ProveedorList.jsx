import React, { useState } from 'react';
import { Building, Phone, Mail, ChevronLeft, ChevronRight } from 'lucide-react';


export default function ProveedorList({ proveedores, onEdit, onDelete, loading }) {
  // ✅ Validación defensiva
  const proveedoresSeguros = Array.isArray(proveedores) ? proveedores : [];

  // Estados de paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(10);

  // Cálculos de paginación
  const totalPaginas = Math.ceil(proveedoresSeguros.length / itemsPorPagina);
  const indiceInicio = (paginaActual - 1) * itemsPorPagina;
  const indiceFin = indiceInicio + itemsPorPagina;
  const proveedoresPaginados = proveedoresSeguros.slice(indiceInicio, indiceFin);

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
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (proveedoresSeguros.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Building className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Sin proveedores</h3>
        <p className="text-gray-500 mb-6">No hay proveedores registrados</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Controles de paginación superior */}
      {proveedoresSeguros.length > 0 && (
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
                className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-600">proveedores</span>
            </div>
            <div className="text-sm text-gray-600">
              Mostrando {indiceInicio + 1} a {Math.min(indiceFin, proveedoresSeguros.length)} de {proveedoresSeguros.length} proveedores
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Identificación</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {proveedoresPaginados.map((proveedor) => (
              <tr key={proveedor.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Building className="w-4 h-4 text-blue-600 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{proveedor.nombre}</div>
                      <div className="text-sm text-gray-500">{proveedor.direccion || 'Sin dirección'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {proveedor.identificacion || 'Sin identificación'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col space-y-1">
                    {proveedor.telefono && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-3 h-3 mr-1" />
                        {proveedor.telefono}
                      </div>
                    )}
                    {proveedor.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-3 h-3 mr-1" />
                        {proveedor.email}
                      </div>
                    )}
                    {proveedor.contacto && (
                      <div className="text-sm text-gray-500">
                        Contacto: {proveedor.contacto}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(proveedor)}
                      className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 px-3 py-1 rounded transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => onDelete(proveedor.id, proveedor.nombre)}
                      className="text-red-600 hover:text-red-900 hover:bg-red-50 px-3 py-1 rounded transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
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
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
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
  );
}
