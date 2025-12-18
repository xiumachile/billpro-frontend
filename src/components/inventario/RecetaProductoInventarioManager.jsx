// src/components/inventario/RecetaProductoInventarioManager.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RecetaProductoInventarioList from './RecetaProductoInventarioList';
import RecetaProductoInventarioForm from './RecetaProductoInventarioForm';
import { inventarioApi } from "../../api/inventarioApi";
import { produccionApi } from "../../api/produccionApi";
import { 
  ArrowLeft,
  Plus,
  Database,
  TrendingUp,
  AlertTriangle,
  Search,
  X,
  Package as PackageIcon,
  Play,
  Eye,
  Calendar
} from 'lucide-react';

export default function RecetaProductoInventarioManager({ usuario, onVolver }) {
  const navigate = useNavigate();
  // Estados principales
  const [recetas, setRecetas] = useState([]);
  const [recetasProducidas, setRecetasProducidas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  // Estados del modal de receta
  const [modalOpen, setModalOpen] = useState(false);
  const [recetaEdit, setRecetaEdit] = useState(null);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [recetaDetalle, setRecetaDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  // Estados del modal de producción
  const [modalProduccionOpen, setModalProduccionOpen] = useState(false);
  const [recetaProduccion, setRecetaProduccion] = useState(null);
  const [cantidadProduccion, setCantidadProduccion] = useState('');
  const [fechaProduccion, setFechaProduccion] = useState(new Date().toISOString().split('T')[0]);
  const [observacionesProduccion, setObservacionesProduccion] = useState('');
  const [stockDisponible, setStockDisponible] = useState(null);
  const [verificandoStock, setVerificandoStock] = useState(false);
  const [loadingProduccion, setLoadingProduccion] = useState(false);
  // Estados del modal de recetas producidas
  const [modalRecetasProducidasOpen, setModalRecetasProducidasOpen] = useState(false);
  // Estados de filtros
  const [filtros, setFiltros] = useState({
    search: '',
    categoria: '',
    bajo_stock: false
  });
  const [timeoutId, setTimeoutId] = useState(null);
  // Datos para selects
  const [proveedores, setProveedores] = useState([]);
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  // Función auxiliar para normalizar respuestas del API
  const normalizarRespuesta = (respuesta, nombreCampo = 'data') => {
    if (!respuesta) return [];
    if (Array.isArray(respuesta)) return respuesta;
    if (respuesta[nombreCampo] && Array.isArray(respuesta[nombreCampo])) {
      return respuesta[nombreCampo];
    }
    if (respuesta.data && Array.isArray(respuesta.data)) {
      return respuesta.data;
    }
    console.warn(`⚠️ Respuesta no esperada para ${nombreCampo}:`, respuesta);
    return [];
  };

  const cargarDatosIniciales = async () => {
    setLoadingData(true);
    try {
      console.log('🔄 Cargando datos iniciales...');
      const responses = await Promise.all([
        inventarioApi.getProveedores().catch(err => {
          console.error('Error en getProveedores:', err);
          return [];
        }),
        inventarioApi.getUnidadesMedida().catch(err => {
          console.error('Error en getUnidadesMedida:', err);
          return [];
        }),
        inventarioApi.getCategorias().catch(err => {
          console.error('Error en getCategorias:', err);
          return [];
        }),
        inventarioApi.getProductosCompra().catch(err => {
          console.error('Error en getProductosCompra:', err);
          return [];
        }),
        inventarioApi.getRecetasProductoInventario().catch(err => {
          console.error('Error en getRecetasProductoInventario:', err);
          return { data: [] };
        })
      ]);

      const proveedoresNormalizados = normalizarRespuesta(responses[0], 'proveedores');
      const unidadesNormalizadas = normalizarRespuesta(responses[1], 'unidades');
      const categoriasNormalizadas = normalizarRespuesta(responses[2], 'categorias');
      const productosNormalizados = normalizarRespuesta(responses[3], 'productos');
      const recetasNormalizadas = normalizarRespuesta(responses[4], 'data');

      setProveedores(proveedoresNormalizados);
      setUnidadesMedida(unidadesNormalizadas);
      setCategorias(categoriasNormalizadas);
      setProductos(productosNormalizados);
      setRecetas(recetasNormalizadas);

      const producidas = recetasNormalizadas.filter(r => 
        r.stock_actual !== undefined && 
        r.stock_actual !== null && 
        parseFloat(r.stock_actual) > 0
      );
      setRecetasProducidas(producidas);
    } catch (error) {
      console.error('❌ Error al cargar datos iniciales:', error);
      alert('Error al cargar los datos necesarios: ' + error.message);
      setProveedores([]);
      setUnidadesMedida([]);
      setCategorias([]);
      setProductos([]);
      setRecetas([]);
      setRecetasProducidas([]);
    } finally {
      setLoadingData(false);
    }
  };

  const cargarRecetas = async (nuevosFiltros = filtros) => {
    setLoading(true);
    try {
      const response = await inventarioApi.getRecetasProductoInventario(nuevosFiltros);
      const recetasNormalizadas = normalizarRespuesta(response, 'data');
      setRecetas(recetasNormalizadas);

      const producidas = recetasNormalizadas.filter(r => 
        r.stock_actual !== undefined && 
        r.stock_actual !== null && 
        parseFloat(r.stock_actual) > 0
      );
      setRecetasProducidas(producidas);
    } catch (error) {
      console.error('❌ Error al cargar recetas:', error);
      alert('Error al cargar las recetas: ' + error.message);
      setRecetas([]);
      setRecetasProducidas([]);
    } finally {
      setLoading(false);
    }
  };

  const cargarSubcategorias = async (categoria) => {
    if (!categoria) {
      setSubcategorias([]);
      return;
    }
    try {
      const response = await inventarioApi.getSubcategorias(categoria);
      const subcatsNormalizadas = normalizarRespuesta(response, 'subcategorias');
      setSubcategorias(subcatsNormalizadas);
    } catch (error) {
      console.error('❌ Error al cargar subcategorías:', error);
      setSubcategorias([]);
    }
  };

  const verificarStockProduccion = async () => {
    if (!recetaProduccion || !cantidadProduccion) return;
    setVerificandoStock(true);
    try {
      const resultado = await produccionApi.verificarStock(recetaProduccion.id, cantidadProduccion);
      setStockDisponible(resultado);
    } catch (error) {
      console.error('Error al verificar stock:', error);
      setStockDisponible({ disponible: false, mensaje: 'Error al verificar stock' });
    } finally {
      setVerificandoStock(false);
    }
  };

  useEffect(() => {
    if (recetaProduccion && cantidadProduccion) {
      const timer = setTimeout(() => {
        verificarStockProduccion();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [recetaProduccion, cantidadProduccion]);

  const handleEjecutarProduccion = async () => {
    if (!recetaProduccion || !cantidadProduccion || !fechaProduccion) {
      alert('Completa todos los campos requeridos');
      return;
    }
    if (stockDisponible && !stockDisponible.disponible) {
      if (!window.confirm('Hay ingredientes con stock insuficiente. ¿Deseas continuar?')) {
        return;
      }
    }
    setLoadingProduccion(true);
    try {
      const resultado = await produccionApi.producirReceta({
        receta_producto_inventario_id: recetaProduccion.id,
        cantidad: parseFloat(cantidadProduccion),
        fecha: fechaProduccion,
        observaciones: observacionesProduccion || null
      });
      if (resultado.success) {
        alert('✅ Producción ejecutada correctamente');
        await cargarRecetas();
        setModalProduccionOpen(false);
        setRecetaProduccion(null);
        setCantidadProduccion('');
        setObservacionesProduccion('');
        setStockDisponible(null);
      } else {
        alert(`❌ Error al ejecutar producción: ${resultado.message || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error al ejecutar producción:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoadingProduccion(false);
    }
  };

  const handleProducirReceta = (receta) => {
    setRecetaProduccion(receta);
    setCantidadProduccion('');
    setFechaProduccion(new Date().toISOString().split('T')[0]);
    setObservacionesProduccion('');
    setStockDisponible(null);
    setModalProduccionOpen(true);
  };

  const handleGuardarReceta = async (datos) => {
    try {
      if (recetaEdit && recetaEdit.id) {
        await inventarioApi.actualizarRecetaProductoInventario(recetaEdit.id, datos);
        alert('✅ Receta actualizada correctamente');
      } else {
        await inventarioApi.crearRecetaProductoInventario(datos);
        alert('✅ Receta creada correctamente');
      }
      await cargarRecetas();
      setModalOpen(false);
      setRecetaEdit(null);
    } catch (error) {
      console.error('❌ Error al guardar receta:', error);
      alert(`❌ Error al guardar: ${error.message}`);
    }
  };

  const handleEliminarReceta = async (id, nombre) => {
    if (!confirm(`⚠️ ¿Eliminar la receta "${nombre}"?\nEsta acción no se puede deshacer.`)) return;
    try {
      await inventarioApi.eliminarRecetaProductoInventario(id);
      alert('✅ Receta eliminada correctamente');
      await cargarRecetas();
    } catch (error) {
      console.error('❌ Error al eliminar receta:', error);
      alert(`❌ Error al eliminar: ${error.message}`);
    }
  };

  // ✅ AGREGAR AQUÍ LA NUEVA FUNCIÓN
  const handleEditarReceta = async (receta) => {
    console.log('✏️ [MANAGER] Editando receta:', receta);
    
    setLoading(true);
    try {
      console.log('📡 Cargando receta completa desde API...');
      const recetaCompleta = await inventarioApi.obtenerRecetaProductoInventario(receta.id);
      
      console.log('✅ Receta completa obtenida:', recetaCompleta);
      console.log('📋 Detalles encontrados:', recetaCompleta.detalles?.length || 0);
      console.log('📦 Detalles:', recetaCompleta.detalles);
      
      setRecetaEdit(recetaCompleta);
      setModalOpen(true);
    } catch (error) {
      console.error('❌ Error al cargar receta completa:', error);
      alert('Error al cargar los datos de la receta: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBusquedaChange = (value) => {
    const nuevosFiltros = { ...filtros, search: value };
    setFiltros(nuevosFiltros);
    if (timeoutId) clearTimeout(timeoutId);
    const newTimeoutId = setTimeout(() => {
      cargarRecetas(nuevosFiltros);
    }, 300);
    setTimeoutId(newTimeoutId);
  };

  const handleCategoriaChange = (value) => {
    const nuevosFiltros = { ...filtros, categoria: value };
    setFiltros(nuevosFiltros);
    cargarRecetas(nuevosFiltros);
  };

  const handleBajoStockChange = () => {
    const nuevosFiltros = { ...filtros, bajo_stock: !filtros.bajo_stock };
    setFiltros(nuevosFiltros);
    cargarRecetas(nuevosFiltros);
  };

  const limpiarFiltros = () => {
    const nuevosFiltros = { search: '', categoria: '', bajo_stock: false };
    setFiltros(nuevosFiltros);
    cargarRecetas(nuevosFiltros);
  };

  const recetasBajoStock = recetas.filter(r => 
    r && r.stock_actual !== undefined && r.stock_minimo !== undefined && 
    r.stock_actual <= r.stock_minimo
  ).length;

  const handleAgregarUnidad = (nuevaUnidad) => {
    if (!unidadesMedida.includes(nuevaUnidad)) {
      setUnidadesMedida(prev => [...prev, nuevaUnidad]);
    }
    return nuevaUnidad;
  };

  const handleAgregarCategoria = (nuevaCategoria) => {
    if (!categorias.includes(nuevaCategoria)) {
      setCategorias(prev => [...prev, nuevaCategoria]);
    }
    return nuevaCategoria;
  };

  const handleAgregarSubcategoria = (nuevaSubcategoria) => {
    if (!subcategorias.includes(nuevaSubcategoria)) {
      setSubcategorias(prev => [...prev, nuevaSubcategoria]);
    }
    return nuevaSubcategoria;
  };

  const handleVerDetalle = async (receta) => {
    setLoadingDetalle(true);
    setModalDetalleOpen(true);
    try {
      const response = await inventarioApi.obtenerRecetaProductoInventario(receta.id);
      setRecetaDetalle(response);
    } catch (error) {
      console.error('❌ Error al cargar detalle:', error);
      alert('Error al cargar el detalle de la receta: ' + error.message);
      setModalDetalleOpen(false);
    } finally {
      setLoadingDetalle(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <button
                onClick={onVolver || (() => window.history.back())}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 font-medium group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span>Volver</span>
              </button>
              <div className="h-8 w-px bg-gray-200" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-md">
                  <PackageIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Gestión de Recetas de Producto</h1>
                  <p className="text-sm text-gray-500">Creación y administración de productos compuestos</p>
                </div>
              </div>
            </div>
            {usuario && (
              <div className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-2 rounded-lg border border-purple-100">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
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
        {/* Controles superiores */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setRecetaEdit(null);
                setModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-700 hover:from-purple-600 hover:to-pink-800 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Plus className="w-4 h-4" /> <span>Nueva Receta</span>
            </button>
            {/* ✅ Botón de Recetas Producidas */}
            <button
              onClick={() => setModalRecetasProducidasOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <PackageIcon className="w-4 h-4" /> <span>Recetas Producidas</span>
            </button>
            {/* ✅ NUEVO: Botón de Reportes de Producción */}
            <button
              onClick={() => navigate('/reportes/produccion')}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Database className="w-4 h-4" /> <span>Reportes de Producción</span>
            </button>
          </div>
          <div className="text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span>Total recetas: {recetas.length}</span>
            </div>
          </div>
        </div>

        {/* Panel de filtros y búsqueda */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Filtros de búsqueda</h3>
            </div>
            {(filtros.search || filtros.categoria || filtros.bajo_stock) && (
              <button
                onClick={limpiarFiltros}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Limpiar filtros
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Buscar por nombre
              </label>
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={filtros.search}
                  onChange={(e) => handleBusquedaChange(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  placeholder="Ej: Salsa Bolognesa..."
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filtrar por categoría
              </label>
              <select
                value={filtros.categoria}
                onChange={(e) => handleCategoriaChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white"
              >
                <option value="">Todas las categorías</option>
                {categorias.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Resumen
              </label>
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-700">
                  <span className="font-semibold">{recetas.length}</span> recetas
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de recetas */}
        <RecetaProductoInventarioList
           recetas={recetas}
  onEdit={handleEditarReceta}
  onDelete={handleEliminarReceta}
  loading={loading}
  unidadesMedida={unidadesMedida}
  onVerDetalle={handleVerDetalle}
  onProducir={handleProducirReceta}
        />
      </div>

      {/* Modales (edición, detalle, producción, recetas producidas) */}
      {/* ... (el resto del código de modales permanece igual) ... */}
      
      {/* Modal de edición/creación */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <RecetaProductoInventarioForm
              isOpen={modalOpen}
              onClose={() => {
                setModalOpen(false);
                setRecetaEdit(null);
              }}
              receta={recetaEdit}
              proveedores={proveedores}
              unidadesMedida={unidadesMedida}
              categorias={categorias}
              subcategorias={subcategorias}
              productos={productos}
              onSave={handleGuardarReceta}
              onAgregarUnidad={handleAgregarUnidad}
              onAgregarCategoria={handleAgregarCategoria}
              onAgregarSubcategoria={handleAgregarSubcategoria}
              onCategoriaChange={cargarSubcategorias}
            />
          </div>
        </div>
      )}

      {/* Modal de detalle */}
      {modalDetalleOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            {loadingDetalle ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando detalle...</p>
              </div>
            ) : recetaDetalle ? (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6 pb-4 border-b">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{recetaDetalle.nombre}</h2>
                    <p className="text-gray-500">{recetaDetalle.descripcion || 'Sin descripción'}</p>
                  </div>
                  <button
                    onClick={() => {
                      setModalDetalleOpen(false);
                      setRecetaDetalle(null);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-500" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <p className="text-xs text-purple-600 mb-1">Unidad de Medida</p>
                    <p className="text-lg font-bold text-purple-900">
                      {recetaDetalle.unidad_medida && typeof recetaDetalle.unidad_medida === 'object'
                        ? `${recetaDetalle.unidad_medida.nombre} (${recetaDetalle.unidad_medida.simbolo})`
                        : recetaDetalle.unidad_medida_simbolo || 'N/A'}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-600 mb-1">Costo Unitario</p>
                    <p className="text-lg font-bold text-blue-900">
                      ${parseFloat(recetaDetalle.costo_unitario || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-xs text-green-600 mb-1">Precio Venta</p>
                    <p className="text-lg font-bold text-green-900">
                      ${parseFloat(recetaDetalle.precio_venta || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <p className="text-xs text-orange-600 mb-1">Margen</p>
                    <p className="text-lg font-bold text-orange-900">
                      {recetaDetalle.costo_unitario > 0
                        ? `${(((recetaDetalle.precio_venta - recetaDetalle.costo_unitario) / recetaDetalle.costo_unitario) * 100).toFixed(1)}%`
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {(recetaDetalle.categoria || recetaDetalle.subcategoria) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {recetaDetalle.categoria && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Categoría</p>
                        <p className="text-sm font-semibold text-gray-900">{recetaDetalle.categoria}</p>
                      </div>
                    )}
                    {recetaDetalle.subcategoria && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Subcategoría</p>
                        <p className="text-sm font-semibold text-gray-900">{recetaDetalle.subcategoria}</p>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Ingredientes ({recetaDetalle.detalles?.length || 0})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Producto</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Cantidad</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Precio Unit.</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {recetaDetalle.detalles && recetaDetalle.detalles.length > 0 ? (
                          recetaDetalle.detalles.map((detalle, index) => (
                            <tr key={detalle.id || index} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="font-semibold text-gray-900">{detalle.nombre_producto}</div>
                                {detalle.unidad_medida && typeof detalle.unidad_medida === 'object' && (
                                  <div className="text-xs text-gray-500">
                                    {detalle.unidad_medida.nombre} ({detalle.unidad_medida.simbolo})
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-900">
                                {parseFloat(detalle.cantidad || 0).toFixed(3)}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-900">
                                ${parseFloat(detalle.precio_unitario || 0).toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-gray-900">
                                ${parseFloat(detalle.subtotal || 0).toFixed(2)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                              No hay ingredientes registrados
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                        <tr>
                          <td colSpan="3" className="px-4 py-3 text-right font-bold text-gray-900">
                            Total:
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900">
                            ${parseFloat(recetaDetalle.costo_unitario || 0).toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setModalDetalleOpen(false);
                      setRecetaDetalle(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={() => {
                      setModalDetalleOpen(false);
                      setRecetaDetalle(null);
                      setRecetaEdit(recetaDetalle);
                      setModalOpen(true);
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    Editar Receta
                  </button>
                  <button
                    onClick={() => {
                      setModalDetalleOpen(false);
                      handleProducirReceta(recetaDetalle);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span>Producir</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="text-gray-600">No se pudo cargar el detalle</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de producción */}
      {modalProduccionOpen && recetaProduccion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-slate-50">
              <div className="bg-white border-b shadow-sm sticky top-0 z-10">
                <div className="px-6 py-4 max-w-4xl mx-auto">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setModalProduccionOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                      >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Volver</span>
                      </button>
                      <div className="h-8 w-px bg-gray-200" />
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                          <PackageIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h1 className="text-2xl font-bold text-gray-900">Producción de Receta</h1>
                          <p className="text-sm text-gray-500">
                            Produciendo: {recetaProduccion.nombre}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setModalProduccionOpen(false)}
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
                        Receta
                      </label>
                      <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                        <span className="font-medium">{recetaProduccion.nombre}</span>
                        <span className="text-gray-500 ml-2">
                          ({recetaProduccion.unidadMedida?.simbolo || recetaProduccion.unidad_medida_simbolo || 'unidad'})
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Cantidad a producir <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={cantidadProduccion}
                        onChange={(e) => setCantidadProduccion(e.target.value)}
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
                          value={fechaProduccion}
                          onChange={(e) => setFechaProduccion(e.target.value)}
                          className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Costo estimado
                      </label>
                      <div className="px-3 py-2 border border-gray-300 rounded-lg bg-blue-50">
                        <span className="font-semibold text-blue-900">
                          ${((parseFloat(recetaProduccion.costo_unitario || 0)) * (parseFloat(cantidadProduccion) || 0)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Observaciones
                      </label>
                      <textarea
                        value={observacionesProduccion}
                        onChange={(e) => setObservacionesProduccion(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        rows="2"
                        placeholder="Notas adicionales..."
                      />
                    </div>
                  </div>

                  {verificandoStock && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-700">
                        <div className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
                        <span>Verificando disponibilidad de ingredientes...</span>
                      </div>
                    </div>
                  )}
                  {stockDisponible && !verificandoStock && (
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
                      onClick={() => setModalProduccionOpen(false)}
                      className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleEjecutarProduccion}
                      disabled={loadingProduccion || verificandoStock || !cantidadProduccion}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-medium rounded-xl transition-all disabled:opacity-50"
                    >
                      {loadingProduccion ? (
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

      {/* Modal de Recetas Producidas */}
      {modalRecetasProducidasOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-slate-50">
              <div className="bg-white border-b shadow-sm sticky top-0 z-10">
                <div className="px-6 py-4 max-w-4xl mx-auto">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setModalRecetasProducidasOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                      >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Volver</span>
                      </button>
                      <div className="h-8 w-px bg-gray-200" />
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                          <PackageIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h1 className="text-2xl font-bold text-gray-900">Recetas Producidas</h1>
                          <p className="text-sm text-gray-500">Recetas con stock disponible</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setModalRecetasProducidasOpen(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="max-w-4xl mx-auto p-6">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Receta</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Unidad</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Stock Actual</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Costo Unitario</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {recetasProducidas.length > 0 ? (
                          recetasProducidas.map((receta) => (
                            <tr key={receta.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-semibold text-gray-900">{receta.nombre}</td>
                              <td className="px-4 py-3 text-gray-700">
                                {receta.unidadMedida?.simbolo || receta.unidad_medida_simbolo || 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-gray-900">
                                {parseFloat(receta.stock_actual).toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-900">
                                ${parseFloat(receta.costo_unitario || 0).toFixed(2)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                              No hay recetas con stock disponible
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-6 pt-4 border-t flex justify-end">
                    <button
                      onClick={() => setModalRecetasProducidasOpen(false)}
                      className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium"
                    >
                      Cerrar
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
