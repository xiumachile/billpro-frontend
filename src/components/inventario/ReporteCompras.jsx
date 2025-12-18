import React, { useState, useEffect } from 'react';
import { Download, X, Filter, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { inventarioApi } from "../../api/inventarioApi";

// Función auxiliar para calcular fechas
function getDateAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export default function ReporteCompras({ onClose }) {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filtros
  const [fechaDesde, setFechaDesde] = useState(getDateAgo(30));
  const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().slice(0, 10));
  const [proveedorId, setProveedorId] = useState('');
  const [estado, setEstado] = useState('');

  const [proveedores, setProveedores] = useState([]);

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(10);

  useEffect(() => {
    cargarProveedores();
  }, []);

  useEffect(() => {
    cargarCompras();
    // Resetear a página 1 cuando cambian los filtros
    setPaginaActual(1);
  }, [fechaDesde, fechaHasta, proveedorId, estado]);

  const cargarProveedores = async () => {
    try {
      const response = await inventarioApi.getProveedores();
      console.log('Proveedores cargados:', response);
      
      // ✅ El backend puede retornar { data: [...] } o directamente [...]
      if (response && Array.isArray(response.data)) {
        setProveedores(response.data);
      } else if (Array.isArray(response)) {
        setProveedores(response);
      } else {
        console.error('Formato de proveedores inesperado:', response);
        setProveedores([]);
      }
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
      setProveedores([]);
    }
  };

  const cargarCompras = async () => {
    setLoading(true);
    try {
      const filtros = {
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        proveedor_id: proveedorId,
        estado: estado
      };

      console.log('Cargando compras con filtros:', filtros);
      const response = await inventarioApi.getCompras(filtros);
      console.log('Respuesta de compras:', response);
      
      // ✅ El backend retorna { data: [...], current_page, last_page, etc }
      if (response && Array.isArray(response.data)) {
        setCompras(response.data);
      } else if (Array.isArray(response)) {
        setCompras(response);
      } else {
        console.error('Formato de respuesta inesperado:', response);
        setCompras([]);
      }
    } catch (error) {
      console.error('Error al cargar compras:', error);
      alert('Error al cargar datos: ' + error.message);
      setCompras([]);
    } finally {
      setLoading(false);
    }
  };

  const calcularTotales = () => {
    return compras.reduce((acc, c) => {
      const total = parseFloat(c.total) || 0;
      const pendiente = parseFloat(c.saldo_pendiente) || 0;
      const pagado = Math.max(0, total - pendiente);
      
      return {
        cantidad: acc.cantidad + 1,
        total: acc.total + total,
        pagado: acc.pagado + pagado,
        pendiente: acc.pendiente + pendiente
      };
    }, { cantidad: 0, total: 0, pagado: 0, pendiente: 0 });
  };

  const formatPrecio = (valor) => {
    if (!valor && valor !== 0) return '$0';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor);
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

  const exportarExcel = () => {
    setExporting(true);
    try {
      const headers = ['Factura', 'Proveedor', 'Fecha', 'Total', 'Pagado', 'Pendiente', 'Estado'];
      const data = compras.map(c => {
        const total = parseFloat(c.total) || 0;
        const pendiente = parseFloat(c.saldo_pendiente) || 0;
        const pagado = Math.max(0, total - pendiente);
        
        return [
          c.numero_factura || c.id,
          c.proveedor_nombre || 'N/A',
          new Date(c.fecha).toLocaleDateString('es-ES'),
          total.toFixed(0),
          pagado.toFixed(0),
          pendiente.toFixed(0),
          c.estado
        ];
      });

      const totales = calcularTotales();
      data.push([]);
      data.push(['TOTALES', '', '', totales.total.toFixed(0), totales.pagado.toFixed(0), totales.pendiente.toFixed(0), '']);

      exportarCSV(headers, data, `reporte-compras-${new Date().getTime()}.csv`);
      alert('✅ Reporte exportado correctamente');
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('❌ Error al exportar: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  const exportarCSV = (headers, data, filename) => {
    let csvContent = headers.join(',') + '\n';
    data.forEach(row => {
      csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const totales = calcularTotales();
  const porcentajePago = totales.total > 0 ? ((totales.pagado / totales.total) * 100).toFixed(1) : 0;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600">Cargando reporte...</p>
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
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Reporte de Compras</h2>
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
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Desde
                </label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Proveedor ({proveedores.length})
                </label>
                <select
                  value={proveedorId}
                  onChange={(e) => setProveedorId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="">Todos los proveedores</option>
                  {proveedores.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="">Todos</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="parcial">Pago Parcial</option>
                  <option value="pagado">Pagado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tarjetas de Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-600 mb-1">Facturas</p>
              <p className="text-2xl font-bold text-blue-900">{totales.cantidad}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-600 mb-1">Total Compras</p>
              <p className="text-2xl font-bold text-purple-900">{formatPrecio(totales.total)}</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-green-600 mb-1">Total Pagado</p>
              <p className="text-2xl font-bold text-green-900">{formatPrecio(totales.pagado)}</p>
              <p className="text-xs text-green-600 mt-1">{porcentajePago}% pagado</p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
              <p className="text-sm text-red-600 mb-1">Total Pendiente</p>
              <p className="text-2xl font-bold text-red-900">{formatPrecio(totales.pendiente)}</p>
            </div>
          </div>

          {/* Controles de paginación superior */}
          {compras.length > 0 && (
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Mostrar</span>
                <select
                  value={itemsPorPagina}
                  onChange={(e) => {
                    setItemsPorPagina(Number(e.target.value));
                    setPaginaActual(1);
                  }}
                  className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-600">registros</span>
              </div>
              <div className="text-sm text-gray-600">
                Mostrando {indiceInicio + 1} a {Math.min(indiceFin, compras.length)} de {compras.length} registros
              </div>
            </div>
          )}

          {/* Tabla */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="p-3 text-left font-semibold text-gray-700">Factura</th>
                    <th className="p-3 text-left font-semibold text-gray-700">Proveedor</th>
                    <th className="p-3 text-left font-semibold text-gray-700">Fecha</th>
                    <th className="p-3 text-right font-semibold text-gray-700">Total</th>
                    <th className="p-3 text-right font-semibold text-gray-700">Pagado</th>
                    <th className="p-3 text-right font-semibold text-gray-700">Pendiente</th>
                    <th className="p-3 text-center font-semibold text-gray-700">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {compras.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-4 text-center text-gray-500">
                        Sin datos para mostrar
                      </td>
                    </tr>
                  ) : (
                    comprasPaginadas.map(c => {
                      const total = parseFloat(c.total) || 0;
                      const pendiente = parseFloat(c.saldo_pendiente) || 0;
                      const pagado = Math.max(0, total - pendiente);
                      
                      return (
                        <tr key={c.id} className="hover:bg-gray-50">
                          <td className="p-3 font-semibold text-gray-900">#{c.numero_factura || c.id}</td>
                          <td className="p-3 text-gray-700">{c.proveedor_nombre || 'N/A'}</td>
                          <td className="p-3 text-gray-600">
                            {new Date(c.fecha).toLocaleDateString('es-ES')}
                          </td>
                          <td className="p-3 text-right font-semibold">{formatPrecio(total)}</td>
                          <td className="p-3 text-right text-green-600 font-semibold">
                            {formatPrecio(pagado)}
                          </td>
                          <td className="p-3 text-right font-semibold" 
                              style={{ color: pendiente > 0 ? '#dc2626' : '#16a34a' }}>
                            {formatPrecio(pendiente)}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              c.estado === 'pagado' ? 'bg-green-100 text-green-800' :
                              c.estado === 'parcial' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {c.estado}
                            </span>
                          </td>
                        </tr>
                      );
                    })
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
                      ? 'bg-gradient-to-r from-amber-600 to-orange-700 text-white'
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
              disabled={exporting || compras.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 text-white rounded-lg font-medium transition-all disabled:opacity-50"
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
