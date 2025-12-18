// src/components/inventario/ReporteProduccion.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Database, 
  Calendar, 
  FileText,
  TrendingUp,
  Download
} from 'lucide-react';
import { produccionApi } from '../../api/produccionApi'; // ✅ Importamos la API

export default function ReporteProduccion({ usuario, onVolver }) {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [producciones, setProducciones] = useState([]);
  const [resumen, setResumen] = useState([]);
  const [activeTab, setActiveTab] = useState('detalle');
  
  const [filtros, setFiltros] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    receta_id: '',
    usuario_id: ''
  });

  useEffect(() => {
    cargarDatos();
  }, [filtros, activeTab]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Limpiar filtros vacíos
      const filtrosLimpios = Object.fromEntries(
        Object.entries(filtros).filter(([_, v]) => v !== '' && v !== null)
      );
      
      if (activeTab === 'detalle') {
        // ✅ Usamos la API centralizada (Axios)
        const data = await produccionApi.getReporteProducciones(filtrosLimpios);
        // La API devuelve { success: true, data: [...] } o directo [...] según tu backend
        const lista = Array.isArray(data) ? data : (data.data || []);
        setProducciones(lista);
      } else {
        // ✅ Usamos la API centralizada (Axios)
        const data = await produccionApi.getResumenProduccion(filtrosLimpios);
        const lista = Array.isArray(data) ? data : (data.data || []);
        setResumen(lista);
      }
    } catch (error) {
      console.error('Error al cargar reportes:', error);
      // alert('Error al cargar los reportes: ' + error.message); // Opcional
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const limpiarFiltros = () => {
    setFiltros({ fecha_inicio: '', fecha_fin: '', receta_id: '', usuario_id: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onVolver || (() => navigate(-1))}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Volver</span>
              </button>
              <div className="h-8 w-px bg-gray-200" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                  <Database className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Reportes de Producción</h1>
                  <p className="text-sm text-gray-500">Análisis histórico de recetas producidas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha inicio</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={filtros.fecha_inicio}
                  onChange={(e) => handleFiltroChange('fecha_inicio', e.target.value)}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha fin</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={filtros.fecha_fin}
                  onChange={(e) => handleFiltroChange('fecha_fin', e.target.value)}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Receta (opcional)</label>
              <input
                type="text"
                placeholder="ID o nombre"
                value={filtros.receta_id}
                onChange={(e) => handleFiltroChange('receta_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={limpiarFiltros}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium w-full"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b mb-6">
          <button
            onClick={() => setActiveTab('detalle')}
            className={`px-4 py-2 font-medium ${activeTab === 'detalle' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Detalle de Producciones
          </button>
          <button
            onClick={() => setActiveTab('resumen')}
            className={`px-4 py-2 font-medium ${activeTab === 'resumen' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Resumen por Receta
          </button>
        </div>

        {/* Contenido */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Cargando reportes...</p>
          </div>
        ) : activeTab === 'detalle' ? (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Receta</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Cantidad</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Costo Unit.</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Costo Total</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Usuario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {producciones.length > 0 ? (
                    producciones.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900">
                          {new Date(p.fecha_produccion).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{p.receta_nombre}</td>
                        <td className="px-4 py-3 text-right text-gray-900">
                          {parseFloat(p.cantidad || 0).toFixed(2)} <span className="text-gray-500 text-xs ml-1">{p.unidad_medida}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900">${parseFloat(p.costo_unitario || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">${parseFloat(p.costo_total || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-gray-700">{p.usuario}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                        No hay producciones registradas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Receta</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Producciones</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Total Cantidad</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Costo Promedio</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Costo Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {resumen.length > 0 ? (
                    resumen.map((r, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-gray-900">{r.receta_nombre}</td>
                        <td className="px-4 py-3 text-right text-gray-900">{r.total_producciones}</td>
                        <td className="px-4 py-3 text-right text-gray-900">
                          {parseFloat(r.total_cantidad || 0).toFixed(2)} <span className="text-gray-500 text-xs ml-1">{r.unidad_medida}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900">${parseFloat(r.costo_promedio || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">${parseFloat(r.costo_total || 0).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                        No hay datos para mostrar
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="mt-6 flex justify-end">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-medium shadow-md hover:shadow-lg">
            <Download className="w-4 h-4" />
            <span>Exportar a Excel</span>
          </button>
        </div>
      </div>
    </div>
  );
}
