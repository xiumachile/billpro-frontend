import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CompraList from './CompraList';
import BotonesPago from './BotonesPago';
import PagoMultiplesFacturas from './PagoMultiplesFacturas';
import ReporteCompras from './ReporteCompras';
import DashboardCompras from './DashboardCompras';
import HistorialPagos from './HistorialPagos';
import DetalleFactura from './DetalleFactura';
import { inventarioApi } from "../../api/inventarioApi";
import {
  ArrowLeft,
  Plus,
  ShoppingCart,
  FileText,
  BarChart3,
  Calendar,
  TrendingUp,
  Search,
  X
} from 'lucide-react';

export default function ComprasManager({ usuario, onVolver }) {
  const navigate = useNavigate();
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarPagoMultiple, setMostrarPagoMultiple] = useState(false);
  const [mostrarReporte, setMostrarReporte] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [mostrarDashboard, setMostrarDashboard] = useState(false);
  const [vista, setVista] = useState('lista');

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [timeoutId, setTimeoutId] = useState(null);

  // Estado para detalle de factura
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [compraSeleccionada, setCompraSeleccionada] = useState(null);

  useEffect(() => {
    cargarCompras();
  }, []);

  // Aplicar filtros cuando cambien los parámetros (con debounce para búsqueda)
  useEffect(() => {
    if (timeoutId) clearTimeout(timeoutId);
    
    const newTimeoutId = setTimeout(() => {
      cargarCompras();
    }, 300);
    
    setTimeoutId(newTimeoutId);
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [busqueda, estadoFiltro]);

  const cargarCompras = async () => {
    setLoading(true);
    try {
      const filtros = {};
      
      if (busqueda.trim()) {
        filtros.search = busqueda.trim();
      }
      
      if (estadoFiltro) {
        filtros.estado = estadoFiltro;
      }
      
      const comprasRes = await inventarioApi.getCompras(filtros);
      
      // ✅ CORRECCIÓN: Manejar respuesta paginada de Laravel
      if (comprasRes && comprasRes.data && Array.isArray(comprasRes.data)) {
        setCompras(comprasRes.data);
      } else if (Array.isArray(comprasRes)) {
        setCompras(comprasRes);
      } else {
        console.warn('Formato de respuesta inesperado:', comprasRes);
        setCompras([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar compras:', error);
      alert('Error al cargar las compras: ' + error.message);
      setCompras([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVolver = () => {
    if (onVolver) {
      onVolver();
    } else {
      navigate('/inventario');
    }
  };

  const handleNuevaCompra = () => {
    navigate('/inventario/compras/nueva');
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta compra?')) {
      return;
    }
    try {
      await inventarioApi.eliminarCompra(id);
      alert('✅ Compra eliminada correctamente');
      cargarCompras();
    } catch (error) {
      console.error('Error al eliminar compra:', error);
      alert('❌ Error al eliminar: ' + error.message);
    }
  };

  const handlePagoExitoso = () => {
    cargarCompras();
  };

  const handleEdit = (compra) => {
    navigate(`/inventario/compras/${compra.id}/editar`);
  };

  const handleVerDetalle = (compra) => {
    setCompraSeleccionada(compra);
    setMostrarDetalle(true);
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setEstadoFiltro('');
  };

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
                  <h1 className="text-2xl font-bold text-gray-900">Gestión de Compras</h1>
                  <p className="text-sm text-gray-500">Registro de compras de materia prima</p>
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
        {vista === 'dashboard' && <DashboardCompras />}

        {vista === 'lista' && (
          <>
            {/* Botones de acción */}
            <div className="mb-6 flex gap-3 flex-wrap">
              <button
                onClick={handleNuevaCompra}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Compra</span>
              </button>

              <button
                onClick={() => setMostrarPagoMultiple(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <FileText className="w-4 h-4" />
                <span>Pago Múltiple</span>
              </button>

              <button
                onClick={() => setMostrarReporte(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Reporte</span>
              </button>

              <button
                onClick={() => setMostrarHistorial(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Calendar className="w-4 h-4" />
                <span>Historial Pagos</span>
              </button>

              <button
                onClick={() => setVista(vista === 'lista' ? 'dashboard' : 'lista')}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <TrendingUp className="w-4 h-4" />
                <span>{vista === 'lista' ? 'Ver Dashboard' : 'Ver Lista'}</span>
              </button>
            </div>

            {/* Panel de filtros */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Filtros</h3>
                </div>
                {(busqueda || estadoFiltro) && (
                  <button
                    onClick={limpiarFiltros}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Limpiar filtros
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Búsqueda */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Buscar por factura, ID o proveedor
                  </label>
                  <div className="relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="Ej: F-001, 123, Proveedor A..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                    />
                  </div>
                </div>

                {/* Filtro por estado */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Filtrar por estado
                  </label>
                  <select
                    value={estadoFiltro}
                    onChange={(e) => setEstadoFiltro(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white"
                  >
                    <option value="">Todos los estados</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="parcial">Pago Parcial</option>
                    <option value="pagado">Pagado</option>
                    <option value="anulado">Anulado</option>
                  </select>
                </div>
              </div>

              {/* Resumen de resultados */}
              <div className="mt-4 pt-4 border-t text-sm text-gray-600">
                Mostrando <span className="font-semibold text-gray-900">{compras.length}</span> compras
              </div>
            </div>

            {/* Lista de compras */}
            <CompraList
              compras={compras}
              loading={loading}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onVerDetalle={handleVerDetalle}
              onPagoExitoso={handlePagoExitoso}
            />
          </>
        )}
      </div>

      {/* Modales */}
      {mostrarPagoMultiple && (
        <PagoMultiplesFacturas
          onClose={() => setMostrarPagoMultiple(false)}
          onPagoExitoso={() => {
            setMostrarPagoMultiple(false);
            handlePagoExitoso();
          }}
        />
      )}

      {mostrarReporte && <ReporteCompras onClose={() => setMostrarReporte(false)} />}

      {mostrarHistorial && <HistorialPagos onClose={() => setMostrarHistorial(false)} />}

      {mostrarDetalle && compraSeleccionada && (
        <DetalleFactura
          compra={compraSeleccionada}
          onClose={() => {
            setMostrarDetalle(false);
            setCompraSeleccionada(null);
          }}
        />
      )}
    </div>
  );
}
