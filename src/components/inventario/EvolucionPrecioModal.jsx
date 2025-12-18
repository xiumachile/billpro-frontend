import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { inventarioApi } from "../../api/inventarioApi";

export default function EvolucionPrecioModal({ isOpen, onClose, producto }) {
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [estadisticas, setEstadisticas] = useState({
    precioMinimo: 0,
    fechaMinimo: '',
    precioMaximo: 0,
    fechaMaximo: '',
    precioPromedio: 0,
  });

  useEffect(() => {
    if (isOpen && producto?.id) {
      // Establecer rango de fechas por defecto (últimos 90 días)
      const hoy = new Date();
      const hace90Dias = new Date();
      hace90Dias.setDate(hoy.getDate() - 90);
      
      const fechaFinStr = hoy.toISOString().split('T')[0];
      const fechaInicioStr = hace90Dias.toISOString().split('T')[0];
      
      setFechaFin(fechaFinStr);
      setFechaInicio(fechaInicioStr);
      
      cargarHistorico(fechaInicioStr, fechaFinStr);
    }
  }, [isOpen, producto]);

  const cargarHistorico = async (inicio, fin) => {
    if (!producto?.id) return;
    
    setLoading(true);
    try {
      const response = await inventarioApi.getHistorialPrecios(producto.id, inicio, fin);
      
      setHistorico(response.historico || []);
      setEstadisticas(response.estadisticas || {
        precioMinimo: 0,
        fechaMinimo: '',
        precioMaximo: 0,
        fechaMaximo: '',
        precioPromedio: 0,
      });
    } catch (error) {
      console.error('Error al cargar histórico:', error);
      setHistorico([]);
      setEstadisticas({
        precioMinimo: 0,
        fechaMinimo: '',
        precioMaximo: 0,
        fechaMaximo: '',
        precioPromedio: 0,
      });
      alert(`Error al cargar el historial: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltrar = () => {
    if (!fechaInicio || !fechaFin) {
      alert('Por favor seleccione ambas fechas');
      return;
    }
    
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    
    if (inicio > fin) {
      alert('La fecha de inicio no puede ser mayor que la fecha de fin');
      return;
    }
    
    cargarHistorico(fechaInicio, fechaFin);
  };

  const formatPrecio = (valor) => {
    if (!valor && valor !== 0) return '-';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">Evolución de Precio</h2>
              <p className="text-blue-100 text-sm">{producto?.nombre || 'Producto'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          {/* Filtro de fechas */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Rango de fechas</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha inicio
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha fin
                </label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleFiltrar}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'Cargando...' : 'Filtrar'}
                </button>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          {historico.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-sm text-gray-600 mb-1">Precio mínimo</p>
                <p className="text-2xl font-bold text-red-600">{formatPrecio(estadisticas.precioMinimo)}</p>
                <p className="text-xs text-gray-500 mt-2">{estadisticas.fechaMinimo}</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600 mb-1">Precio máximo</p>
                <p className="text-2xl font-bold text-green-600">{formatPrecio(estadisticas.precioMaximo)}</p>
                <p className="text-xs text-gray-500 mt-2">{estadisticas.fechaMaximo}</p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600 mb-1">Precio promedio</p>
                <p className="text-2xl font-bold text-blue-600">{formatPrecio(estadisticas.precioPromedio)}</p>
                <p className="text-xs text-gray-500 mt-2">{historico.length} compras</p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="text-sm text-gray-600 mb-1">Variación</p>
                <p className={`text-2xl font-bold ${
                  estadisticas.precioMaximo - estadisticas.precioMinimo > 0
                    ? 'text-purple-600'
                    : 'text-gray-400'
                }`}>
                  {formatPrecio(estadisticas.precioMaximo - estadisticas.precioMinimo)}
                </p>
                <p className="text-xs text-gray-500 mt-2">Máx - Mín</p>
              </div>
            </div>
          )}

          {/* Gráfica */}
          {loading ? (
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-gray-500 mt-2">Cargando datos...</p>
            </div>
          ) : historico.length > 0 ? (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Gráfica de evolución</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historico}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="fechaFormato"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    label={{ value: 'Precio (CLP)', angle: -90, position: 'insideLeft' }}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => 
                      new Intl.NumberFormat('es-CL', {
                        notation: 'compact',
                        compactDisplay: 'short'
                      }).format(value)
                    }
                  />
                  <Tooltip
                    formatter={(value) => formatPrecio(value)}
                    labelFormatter={(label) => `Fecha: ${label}`}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="precio"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Precio unitario"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <p className="text-gray-500">No hay datos de compra en el rango de fechas seleccionado</p>
            </div>
          )}

          {/* Tabla de detalles */}
          {historico.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Historial detallado</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Fecha</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Factura</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Precio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {historico.map((item, idx) => (
                      <tr key={idx} className="bg-white hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">{item.fechaFormato}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{item.numeroFactura}</td>
                        <td className="px-4 py-2 text-sm text-right font-semibold text-gray-900">
                          {formatPrecio(item.precio)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
