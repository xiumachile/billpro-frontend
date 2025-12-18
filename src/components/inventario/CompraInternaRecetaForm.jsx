// src/components/inventario/CompraInternaRecetaForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { inventarioApi } from "../../api/inventarioApi";
import { 
  ArrowLeft,
  Plus,
  Minus,
  Save,
  Calendar,
  Package as PackageIcon,
  ShoppingCart,
  Search,
  X,
  AlertCircle
} from 'lucide-react';

export default function CompraInternaRecetaForm({ usuario, onVolver }) {
  const navigate = useNavigate();
  
  // Estados del formulario principal
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [observaciones, setObservaciones] = useState('');
  
  // Estados de los detalles
  const [detalles, setDetalles] = useState([{
    receta_producto_inventario_id: '',
    cantidad: '',
  }]);
  
  // Datos para selects
  const [recetas, setRecetas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Estados para búsqueda de recetas
  const [busquedaReceta, setBusquedaReceta] = useState({});
  const [recetasFiltradas, setRecetasFiltradas] = useState({});
  const [mostrarSugerencias, setMostrarSugerencias] = useState({});

  // Modal de confirmación
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const recetasRes = await inventarioApi.getRecetasProductoInventario();
      
      setRecetas(Array.isArray(recetasRes.data) ? recetasRes.data : []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar los datos necesarios: ' + error.message);
    } finally {
      setLoadingData(false);
    }
  };

  const handleBusquedaReceta = (index, valor) => {
    setBusquedaReceta(prev => ({ ...prev, [index]: valor }));
    
    if (valor.trim()) {
      const termino = valor.toLowerCase();
      const filtrados = recetas.filter(r =>
        r.nombre.toLowerCase().includes(termino) ||
        String(r.id).includes(termino)
      );
      setRecetasFiltradas(prev => ({ ...prev, [index]: filtrados }));
      setMostrarSugerencias(prev => ({ ...prev, [index]: true }));
    } else {
      setRecetasFiltradas(prev => ({ ...prev, [index]: [] }));
      setMostrarSugerencias(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleSeleccionarReceta = (index, receta) => {
    const nuevosDetalles = [...detalles];
    nuevosDetalles[index] = {
      ...nuevosDetalles[index],
      receta_producto_inventario_id: String(receta.id),
    };
    
    setDetalles(nuevosDetalles);
    setBusquedaReceta(prev => ({ ...prev, [index]: '' }));
    setMostrarSugerencias(prev => ({ ...prev, [index]: false }));
    
    setTimeout(() => {
      const cantidadInput = document.getElementById(`cantidad-${index}`);
      if (cantidadInput) cantidadInput.focus();
    }, 100);
  };

  const handleAddDetalle = () => {
    setDetalles([...detalles, {
      receta_producto_inventario_id: '',
      cantidad: '',
    }]);
  };

  const handleRemoveDetalle = (index) => {
    if (detalles.length === 1) {
      alert('Debe haber al menos un producto en la compra');
      return;
    }
    const nuevosDetalles = detalles.filter((_, i) => i !== index);
    setDetalles(nuevosDetalles);
    
    setBusquedaReceta(prev => {
      const newSearch = { ...prev };
      delete newSearch[index];
      return newSearch;
    });
  };

  const handleDetalleChange = (index, field, value) => {
    const nuevosDetalles = [...detalles];
    nuevosDetalles[index][field] = value;
    setDetalles(nuevosDetalles);
  };

  const handleKeyDown = (e, index, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      if (field === 'cantidad') {
        if (index === detalles.length - 1) {
          handleAddDetalle();
          setTimeout(() => {
            const nextSearch = document.getElementById(`busqueda-${index + 1}`);
            if (nextSearch) nextSearch.focus();
          }, 0);
        } else {
          const nextCantidad = document.getElementById(`cantidad-${index + 1}`);
          if (nextCantidad) nextCantidad.focus();
        }
      }
    }
  };

  const getRecetaNombre = (recetaId) => {
    if (!recetaId) return 'Seleccionar receta';
    const receta = recetas.find(r => r.id === parseInt(recetaId));
    if (!receta) return 'Receta no encontrada';
    
    return `${receta.nombre} (${receta.unidadMedida?.simbolo || 'unidad'})`;
  };

  const calcularTotal = () => {
    return detalles.reduce((total, detalle) => {
      const cantidad = parseFloat(detalle.cantidad) || 0;
      const receta = recetas.find(r => r.id === parseInt(detalle.receta_producto_inventario_id));
      const costoUnitario = receta ? parseFloat(receta.costo_unitario || 0) : 0;
      return total + (cantidad * costoUnitario);
    }, 0);
  };

  const handleVolver = () => {
    if (onVolver) {
      onVolver();
    } else {
      navigate('/inventario/recetas-producto-inventario');
    }
  };

  const handleGuardarCompra = async () => {
    setMostrarModalConfirmacion(false);

    const detallesValidos = detalles.filter(d => {
      const recetaOk = d.receta_producto_inventario_id && String(d.receta_producto_inventario_id).trim() !== '';
      const cantidadOk = d.cantidad && parseFloat(d.cantidad) > 0;
      return recetaOk && cantidadOk;
    });
    
    if (detallesValidos.length === 0) {
      alert('Debes agregar al menos un producto válido con:\n• Receta seleccionada\n• Cantidad mayor a 0');
      return;
    }
    
    setLoading(true);
    
    try {
      const compraData = {
        fecha: fecha,
        observaciones: observaciones || null,
        total: calcularTotal(),
        detalles: detallesValidos.map(detalle => {
          const cantidad = parseFloat(detalle.cantidad);
          const receta = recetas.find(r => r.id === parseInt(detalle.receta_producto_inventario_id));
          const costoUnitario = receta ? parseFloat(receta.costo_unitario || 0) : 0;
          const subtotal = cantidad * costoUnitario;
          
          return {
            receta_producto_inventario_id: parseInt(detalle.receta_producto_inventario_id),
            cantidad: cantidad,
            costo_unitario: costoUnitario,
            subtotal: subtotal,
          };
        })
      };
      
      await inventarioApi.crearCompraInternaReceta(compraData);
      alert('✅ Compra interna registrada correctamente');
      navigate('/inventario/recetas-producto-inventario');
    } catch (error) {
      console.error('Error al guardar compra interna:', error);
      alert(`❌ Error al guardar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMostrarModalConfirmacion(true);
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-600">Cargando datos...</p>
          </div>
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
                onClick={handleVolver}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 font-medium group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span>Volver</span>
              </button>
              <div className="h-8 w-px bg-gray-200" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-md">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Compra Interna de Recetas</h1>
                  <p className="text-sm text-gray-500">Registro de producción interna de recetas</p>
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
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6">
          {/* Información general */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Fecha de producción <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Observaciones
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                rows="2"
                placeholder="Notas adicionales sobre la producción"
              />
            </div>
          </div>

          {/* Detalles de la compra interna */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <PackageIcon className="w-5 h-5 text-purple-600" />
                Recetas producidas
              </h3>
              <button
                type="button"
                onClick={handleAddDetalle}
                className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar receta</span>
              </button>
            </div>

            <div className="space-y-4">
              {detalles.map((detalle, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-12 gap-3 items-end">
                    {/* Búsqueda de receta */}
                    <div className="col-span-12 md:col-span-6 relative">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Buscar receta
                      </label>
                      <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          id={`busqueda-${index}`}
                          type="text"
                          value={detalle.receta_producto_inventario_id ? getRecetaNombre(detalle.receta_producto_inventario_id) : busquedaReceta[index] || ''}
                          onChange={(e) => handleBusquedaReceta(index, e.target.value)}
                          onFocus={() => busquedaReceta[index] && setMostrarSugerencias(prev => ({ ...prev, [index]: true }))}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                          placeholder="Buscar por nombre o ID..."
                          readOnly={!!detalle.receta_producto_inventario_id}
                        />
                        {detalle.receta_producto_inventario_id && (
                          <button
                            type="button"
                            onClick={() => {
                              const nuevosDetalles = [...detalles];
                              nuevosDetalles[index] = {
                                ...nuevosDetalles[index],
                                receta_producto_inventario_id: '',
                              };
                              setDetalles(nuevosDetalles);
                              setBusquedaReceta(prev => ({ ...prev, [index]: '' }));
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Sugerencias */}
                      {mostrarSugerencias[index] && recetasFiltradas[index]?.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto">
                          {recetasFiltradas[index].map(receta => (
                            <button
                              key={receta.id}
                              type="button"
                              onClick={() => handleSeleccionarReceta(index, receta)}
                              className="w-full text-left px-3 py-2 hover:bg-purple-50 border-b last:border-b-0 transition-colors"
                            >
                              <div className="font-medium text-sm text-gray-900">
                                {receta.nombre}
                              </div>
                              <div className="text-xs text-gray-500">
                                {receta.unidadMedida 
                                  ? `${receta.unidadMedida.nombre} (${receta.unidadMedida.simbolo})`
                                  : 'Sin unidad'}
                                • ${parseFloat(receta.costo_unitario || 0).toFixed(2)}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Cantidad */}
                    <div className="col-span-6 md:col-span-3">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Cantidad <span className="text-red-500">*</span>
                      </label>
                      <input
                        id={`cantidad-${index}`}
                        type="number"
                        step="0.01"
                        value={detalle.cantidad}
                        onChange={(e) => handleDetalleChange(index, 'cantidad', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index, 'cantidad')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                        placeholder="0.00"
                        min="0.01"
                        required
                      />
                    </div>
                    
                    {/* Unidad */}
                    <div className="col-span-6 md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Unidad
                      </label>
                      <input
                        type="text"
                        value={
                          detalle.receta_producto_inventario_id 
                            ? recetas.find(r => r.id === parseInt(detalle.receta_producto_inventario_id))?.unidadMedida?.simbolo || 'unidad'
                            : 'unidad'
                        }
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-sm text-gray-600"
                      />
                    </div>
                    
                    {/* Botón eliminar */}
                    <div className="col-span-6 md:col-span-1 flex items-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveDetalle(index)}
                        className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <Minus className="w-4 h-4 mx-auto" />
                      </button>
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="mt-3 pt-3 border-t text-right">
                    <span className="text-sm text-gray-600">Subtotal: </span>
                    <span className="font-semibold text-gray-900">
                      ${(
                        (parseFloat(detalle.cantidad) || 0) * 
                        (recetas.find(r => r.id === parseInt(detalle.receta_producto_inventario_id))?.costo_unitario || 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen y acciones */}
          <div className="border-t pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-lg font-bold text-gray-900">
                Total: ${calcularTotal().toFixed(2)}
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleVolver}
                  className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800 text-white font-medium rounded-xl transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Registrar Producción</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Modal de confirmación */}
      {mostrarModalConfirmacion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="flex items-center gap-3 p-6 border-b">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Confirmar registro</h2>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-2">
                ¿Deseas registrar esta producción interna?
              </p>
              <div className="bg-gray-50 p-3 rounded-lg mt-4">
                <p className="text-sm text-gray-600 font-semibold mb-2">Resumen:</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Fecha: {fecha}</li>
                  <li>• Recetas: {detalles.filter(d => d.receta_producto_inventario_id).length}</li>
                  <li>• Total: ${calcularTotal().toFixed(2)}</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t justify-end">
              <button
                type="button"
                onClick={() => setMostrarModalConfirmacion(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                No, cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarCompra}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800 text-white rounded-lg font-medium transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Registrando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Sí, registrar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
