import React, { useState, useEffect } from 'react';
import { X, Search, Calendar, Filter, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { inventarioApi } from "../../api/inventarioApi";

// Función auxiliar para calcular fechas
function getDateAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export default function HistorialPagos({ onClose }) {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [fechaDesde, setFechaDesde] = useState(getDateAgo(30));
  const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().slice(0, 10));
  const [timeoutId, setTimeoutId] = useState(null);

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(10);

  useEffect(() => {
    cargarPagos();
  }, []);

  // Aplicar debounce a la búsqueda
  useEffect(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    const newTimeoutId = setTimeout(() => {
      cargarPagos();
      setPaginaActual(1); // Resetear a página 1 al filtrar
    }, 300);
    
    setTimeoutId(newTimeoutId);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [busqueda, fechaDesde, fechaHasta]);

  const cargarPagos = async () => {
    setLoading(true);
    try {
      const filtros = {
        search: busqueda,
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta
      };
      
      const pagosRes = await inventarioApi.getHistorialPagos(filtros);
      setPagos(Array.isArray(pagosRes) ? pagosRes : []);
    } catch (error) {
      console.error('Error al cargar pagos:', error);
      alert('Error al cargar pagos: ' + (error.message || 'Error desconocido'));
      setPagos([]);
    } finally {
      setLoading(false);
    }
  };

  const calcularTotales = () => {
    return pagos.reduce((acc, p) => ({
      cantidad: acc.cantidad + 1,
      monto: acc.monto + (parseFloat(p.monto) || 0)
    }), { cantidad: 0, monto: 0 });
  };

  // Cálculos de paginación
  const totalPaginas = Math.ceil(pagos.length / itemsPorPagina);
  const indiceInicio = (paginaActual - 1) * itemsPorPagina;
  const indiceFin = indiceInicio + itemsPorPagina;
  const pagosPaginados = pagos.slice(indiceInicio, indiceFin);

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

  const exportarExcel = () => {
    setExporting(true);
    try {
      const headers = ['Fecha', 'Factura', 'Proveedor', 'Monto', 'Forma Pago', 'Referencia'];
      const data = pagos.map(p => [
        new Date(p.fecha_pago).toLocaleDateString('es-ES'),
        p.compra_numero,
        p.proveedor_nombre,
        parseFloat(p.monto || 0).toFixed(2),
        p.forma_pago_nombre || 'N/A',
        p.referencia || '-'
      ]);

      const totales = calcularTotales();
      data.push([]);
      data.push(['TOTALES', '', '', totales.monto.toFixed(2), '', '']);

      const csvContent = headers.join(',') + '\n' +
        data.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `historial-pagos-${new Date().getTime()}.csv`;
      link.click();
      
      alert('✅ Historial exportado correctamente');
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('❌ Error al exportar: ' + (error.message || 'Error desconocido'));
    } finally {
      setExporting(false);
    }
  };

  const totales = calcularTotales();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Historial de Pagos</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          {/* Filtros */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Filtros</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Factura, proveedor o referencia"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Desde
                </label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hasta
                </label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-600 mb-1">Total de Pagos</p>
              <p className="text-2xl font-bold text-blue-900">{totales.cantidad}</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-green-600 mb-1">Monto Total Pagado</p>
              <p className="text-2xl font-bold text-green-900">${totales.monto.toFixed(2)}</p>
            </div>
          </div>

          {/* Controles de paginación superior */}
          {pagos.length > 0 && (
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Mostrar</span>
                <select
                  value={itemsPorPagina}
                  onChange={(e) => {
                    setItemsPorPagina(Number(e.target.value));
                    setPaginaActual(1);
                  }}
                  className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-600">registros</span>
              </div>
              <div className="text-sm text-gray-600">
                Mostrando {indiceInicio + 1} a {Math.min(indiceFin, pagos.length)} de {pagos.length} registros
              </div>
            </div>
          )}

          {/* Tabla */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="p-3 text-left font-semibold text-gray-700">Fecha</th>
                    <th className="p-3 text-left font-semibold text-gray-700">Factura</th>
                    <th className="p-3 text-left font-semibold text-gray-700">Proveedor</th>
                    <th className="p-3 text-right font-semibold text-gray-700">Monto</th>
                    <th className="p-3 text-left font-semibold text-gray-700">Forma de Pago</th>
                    <th className="p-3 text-left font-semibold text-gray-700">Referencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pagos.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-4 text-center text-gray-500">
                        Sin pagos registrados
                      </td>
                    </tr>
                  ) : (
                    pagosPaginados.map((pago, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-3 font-semibold text-gray-900">
                          {new Date(pago.fecha_pago).toLocaleDateString('es-ES')}
                        </td>
                        <td className="p-3 text-gray-700 font-semibold">
                          {pago.compra_numero ? `#${pago.compra_numero}` : `#${pago.compra_id}`}
                        </td>
                        <td className="p-3 text-gray-700">{pago.proveedor_nombre}</td>
                        <td className="p-3 text-right font-bold text-green-600">
                          ${parseFloat(pago.monto || 0).toFixed(2)}
                        </td>
                        <td className="p-3 text-gray-700">
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-semibold">
                            {pago.forma_pago_nombre || 'N/A'}
                          </span>
                        </td>
                        <td className="p-3 text-gray-600 text-xs">
                          {pago.referencia || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Controles de paginación inferior */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={paginaAnterior}
                disabled={paginaActual === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>

              {generarNumerosPagina().map(numeroPagina => (
                <button
                  key={numeroPagina}
                  onClick={() => irAPagina(numeroPagina)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    paginaActual === numeroPagina
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {numeroPagina}
                </button>
              ))}

              <button
                onClick={paginaSiguiente}
                disabled={paginaActual === totalPaginas}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={exportarExcel}
              disabled={exporting || pagos.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Exportando...' : 'Descargar CSV'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
