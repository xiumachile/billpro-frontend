import React, { useState } from 'react';
import { Edit2, Trash2, Eye, DollarSign, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import PagoModal from './PagoModal';

export default function CompraList({ compras, onEdit, onDelete, loading, onPagoExitoso, onVerDetalle }) {
  const [compraSeleccionada, setCompraSeleccionada] = useState(null);
  const [mostrarPago, setMostrarPago] = useState(false);

  // Estados de paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(10);

  const handleAbrirPago = (compra) => {
    setCompraSeleccionada(compra);
    setMostrarPago(true);
  };

  const handleCerrarPago = () => {
    setMostrarPago(false);
    setCompraSeleccionada(null);
    if (onPagoExitoso) {
      onPagoExitoso();
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pagado':
        return 'bg-green-100 text-green-800';
      case 'parcial':
        return 'bg-yellow-100 text-yellow-800';
      case 'pendiente':
        return 'bg-red-100 text-red-800';
      case 'anulado':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoEtiqueta = (estado) => {
    switch (estado) {
      case 'pagado':
        return '✓ Pagado';
      case 'parcial':
        return '⊘ Pago Parcial';
      case 'pendiente':
        return '◯ Pendiente';
      case 'anulado':
        return '✕ Anulado';
      default:
        return estado;
    }
  };

  // Cálculos de paginación
  const totalPaginas = Math.ceil(compras.length / itemsPorPagina);
  const indiceInicio = (paginaActual - 1) * itemsPorPagina;
  const indiceFin = indiceInicio + itemsPorPagina;
  const comprasPaginadas = compras.slice(indiceInicio, indiceFin);

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
      <div className="flex justify-center items-center py-12">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (compras.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Eye className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Sin compras registradas</h3>
        <p className="text-gray-500">Aún no hay compras. Crea una nueva compra para comenzar.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Controles de paginación superior */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b px-6 py-3">
          <div className="flex items-center justify-between">
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
            <div className="text-sm text-gray-600">
              Mostrando {indiceInicio + 1} a {Math.min(indiceFin, compras.length)} de {compras.length} compras
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Factura</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Proveedor</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Fecha</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Total</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Pagado</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Pendiente</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Estado</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {comprasPaginadas.map((compra) => {
                const total = parseFloat(compra.total || 0);
                const pendiente = parseFloat(compra.saldo_pendiente || 0);
                const pagado = Math.max(0, total - pendiente);
                const puedeRealizarPago = compra.estado !== 'pagado' && compra.estado !== 'anulado';

                return (
                  <tr key={compra.id} className="hover:bg-gray-50 transition-colors">
                    {/* 1 Factura */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">#{compra.numero_factura || compra.id}</div>
                    </td>

                    {/* 2 Proveedor */}
                    <td className="px-6 py-4 text-gray-700">{compra.proveedor_nombre}</td>

                    {/* 3 Fecha */}
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {new Date(compra.fecha).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>

                    {/* 4 Total */}
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">${total.toFixed(2)}</td>

                    {/* 5 Pagado = total - saldo_pendiente */}
                    <td className="px-6 py-4 text-right text-green-600 font-semibold">
                      ${pagado.toFixed(2)}
                    </td>

                    {/* 6 Pendiente = saldo_pendiente */}
                    <td className="px-6 py-4 text-right font-semibold" style={{ color: pendiente > 0 ? '#dc2626' : '#16a34a' }}>
                      ${pendiente.toFixed(2)}
                    </td>

                    {/* 7 Estado */}
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getEstadoColor(compra.estado)}`}>
                        {getEstadoEtiqueta(compra.estado)}
                      </span>
                    </td>

                    {/* 8 Acciones */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => onVerDetalle(compra)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Ver detalle de factura">
                          <FileText className="w-4 h-4" />
                        </button>
                        {puedeRealizarPago && (
                          <button onClick={() => handleAbrirPago(compra)} className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors" title="Registrar pago">
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => onEdit(compra)} className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors" title="Editar compra">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDelete(compra.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Eliminar compra">
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
                      ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
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

        {/* Resumen - Calculado sobre TODAS las compras, no solo la página actual */}
        {compras.length > 0 && (
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Total de facturas</p>
                <p className="text-lg font-bold text-gray-900">{compras.length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Total compras</p>
                <p className="text-lg font-bold text-gray-900">
                  ${compras.reduce((sum, c) => sum + parseFloat(c.total || 0), 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Total pagado</p>
                <p className="text-lg font-bold text-green-600">
                  ${compras.reduce((sum, c) => sum + (parseFloat(c.total || 0) - parseFloat(c.saldo_pendiente || 0)), 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Total pendiente</p>
                <p className="text-lg font-bold text-red-600">
                  ${compras.reduce((sum, c) => sum + parseFloat(c.saldo_pendiente || 0), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Pago */}
      {mostrarPago && compraSeleccionada && (
        <PagoModal
          compra={compraSeleccionada}
          onClose={handleCerrarPago}
          onPagoExitoso={onPagoExitoso}
        />
      )}
    </>
  );
}
