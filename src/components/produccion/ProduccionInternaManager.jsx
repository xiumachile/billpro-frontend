// src/components/produccion/ProduccionInternaManager.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { produccionApi } from "../../api/produccionApi";
import { inventarioApi } from "../../api/inventarioApi";
import { 
  ArrowLeft,
  Plus,
  Package,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Search,
  X,
  Play
} from 'lucide-react';

export default function ProduccionInternaManager({ usuario, onVolver }) {
  const navigate = useNavigate();
  
  const [recetas, setRecetas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Datos del formulario
  const [recetaId, setRecetaId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [observaciones, setObservaciones] = useState('');
  const [stockDisponible, setStockDisponible] = useState(null);
  const [verificando, setVerificando] = useState(false);

  useEffect(() => {
    cargarRecetas();
  }, []);

  const cargarRecetas = async () => {
    setLoadingData(true);
    try {
      const recetasData = await inventarioApi.getRecetasProductoInventario();
      // Filtrar solo recetas que tienen ingredientes
      const recetasConIngredientes = recetasData.filter(r => r.detalles && r.detalles.length > 0);
      setRecetas(recetasConIngredientes);
    } catch (error) {
      console.error('Error al cargar recetas:', error);
      alert('Error al cargar las recetas: ' + error.message);
    } finally {
      setLoadingData(false);
    }
  };

  const verificarStock = async () => {
    if (!recetaId || !cantidad) return;
    
    setVerificando(true);
    try {
      const resultado = await produccionApi.verificarStock(recetaId, cantidad);
      setStockDisponible(resultado);
    } catch (error) {
      console.error('Error al verificar stock:', error);
      setStockDisponible({ disponible: false, mensaje: 'Error al verificar stock' });
    } finally {
      setVerificando(false);
    }
  };

  useEffect(() => {
    if (recetaId && cantidad) {
      const timer = setTimeout(() => {
        verificarStock();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [recetaId, cantidad]);

  const handleCrearProduccion = () => {
    setModalOpen(true);
  };

  const handleGuardarProduccion = async () => {
    if (!recetaId || !cantidad || !fecha) {
      alert('Completa todos los campos requeridos');
      return;
    }

    if (stockDisponible && !stockDisponible.disponible) {
      if (!window.confirm('Hay ingredientes con stock insuficiente. ¿Deseas continuar?')) {
        return;
      }
    }

    setLoading(true);
    try {
      const resultado = await produccionApi.producirReceta({
        receta_producto_inventario_id: parseInt(recetaId),
        cantidad: parseFloat(cantidad),
        fecha: fecha,
        observaciones: observaciones || null
      });

      if (resultado.success) {
        alert('✅ Producción ejecutada correctamente');
        // Resetear formulario
        setRecetaId('');
        setCantidad('');
        setObservaciones('');
        setStockDisponible(null);
        cargarRecetas(); // Recargar para actualizar stock
      } else {
        alert(`❌ Error al ejecutar producción: ${resultado.message || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error al ejecutar producción:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getRecetaNombre = (recetaId) => {
    const receta = recetas.find(r => r.id === recetaId);
    return receta ? receta.nombre : 'Receta no encontrada';
  };

  const getRecetaUnidad = (recetaId) => {
    const receta = recetas.find(r => r.id === recetaId);
    if (!receta) return '';
    return receta.unidadMedida?.simbolo || receta.unidad_medida_simbolo || 'unidad';
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando recetas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-slate-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <button
                onClick={onVolver || (() => window.history.back())}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 font-medium group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span>Volver</span>
              </button>
              <div className="h-8 w-px bg-gray-200" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Producción Interna</h1>
                  <p className="text-sm text-gray-500">Ejecutar producción de recetas definidas</p>
                </div>
              </div>
            </div>
            {usuario && (
              <div className="flex items-center gap-3 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-lg border border-green-100">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {typeof usuario === 'string' 
                    ? usuario.charAt(0).toUpperCase()
                    : (usuario.nombre_completo || usuario.username || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-gray-500">Usuario activo</p>
                  <p className="text-sm font-semibold text-gray-700">
                    {typeof usuario === 'string' 
                      ? usuario 
                      : usuario.nombre_completo || usuario.username || 'Usuario'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Botón de nueva producción */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={handleCrearProduccion}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" /> <span>Nueva Producción</span>
          </button>
        </div>

        {/* Lista de recetas disponibles para producción */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Recetas disponibles para producción</h2>
            <p className="text-sm text-gray-500">Selecciona una receta para producir</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receta</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidad</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Costo Unitario</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ingredientes</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recetas.map(receta => (
                  <tr key={receta.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{receta.nombre}</div>
                      <div className="text-sm text-gray-500">{receta.descripcion || 'Sin descripción'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {receta.unidadMedida?.simbolo || receta.unidad_medida_simbolo || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-gray-900">
                      ${parseFloat(receta.costo_unitario || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700">
                      {receta.detalles?.length || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => {
                          setRecetaId(String(receta.id));
                          setModalOpen(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                      >
                        <Play className="w-4 h-4" />
                        <span>Producir</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {recetas.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay recetas con ingredientes definidos</p>
              <button
                onClick={() => navigate('/inventario/recetas-producto-inventario')}
                className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
              >
                Crear receta primero
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de producción */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-slate-50">
              <div className="bg-white border-b shadow-sm sticky top-0 z-10">
                <div className="px-6 py-4 max-w-4xl mx-auto">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setModalOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                      >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Volver</span>
                      </button>
                      <div className="h-8 w-px bg-gray-200" />
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                          <Package className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h1 className="text-2xl font-bold text-gray-900">Nueva Producción</h1>
                          <p className="text-sm text-gray-500">
                            {recetaId ? `Produciendo: ${getRecetaNombre(parseInt(recetaId))}` : 'Selecciona una receta'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setModalOpen(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="max-w-4xl mx-auto p-6">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Receta seleccionada
                      </label>
                      <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                        <span className="font-medium">{getRecetaNombre(parseInt(recetaId))}</span>
                        <span className="text-gray-500 ml-2">({getRecetaUnidad(parseInt(recetaId))})</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Cantidad a producir <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={cantidad}
                        onChange={(e) => setCantidad(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="0.00"
                        min="0.01"
                        required
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Fecha de producción <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="date"
                          value={fecha}
                          onChange={(e) => setFecha(e.target.value)}
                          className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Observaciones
                      </label>
                      <textarea
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        rows="2"
                        placeholder="Notas adicionales..."
                      />
                    </div>
                  </div>

                  {/* Verificación de stock */}
                  {verificando && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-700">
                        <div className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
                        <span>Verificando disponibilidad de ingredientes...</span>
                      </div>
                    </div>
                  )}

                  {stockDisponible && !verificando && (
                    <div className={`mb-4 p-3 rounded-lg ${stockDisponible.disponible ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className={`w-4 h-4 ${stockDisponible.disponible ? 'text-green-700' : 'text-red-700'}`} />
                        <span className={`font-semibold ${stockDisponible.disponible ? 'text-green-700' : 'text-red-700'}`}>
                          {stockDisponible.disponible ? '✅ Stock suficiente' : '❌ Stock insuficiente'}
                        </span>
                      </div>
                      {!stockDisponible.disponible && stockDisponible.faltantes && (
                        <div className="text-sm text-red-700">
                          <p className="font-medium mb-1">Ingredientes faltantes:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {stockDisponible.faltantes.map((faltante, idx) => (
                              <li key={idx}>
                                {faltante.producto}: Necesario {faltante.necesario.toFixed(2)} {faltante.unidad}, 
                                Disponible {faltante.disponible.toFixed(2)} {faltante.unidad}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="border-t pt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleGuardarProduccion}
                      disabled={loading || verificando || !recetaId || !cantidad}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-medium rounded-xl transition-all disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Ejecutando...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>Ejecutar Producción</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
