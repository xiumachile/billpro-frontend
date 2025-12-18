import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductoList from './ProductoList';
import ProductoModal from './ProductoModal';
import { inventarioApi } from "../../api/inventarioApi";
import { 
  ArrowLeft,
  Plus,
  Database,
  TrendingUp,
  AlertTriangle,
  Users,
  ShoppingCart,
  Search,
  X,
  PackagePlus
} from 'lucide-react';

export default function InventarioManager({ usuario, onVolver }) {
  const navigate = useNavigate();
  
  // Estados
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [productoEdit, setProductoEdit] = useState(null);
  
  // Filtros
  const [filtros, setFiltros] = useState({
    search: '',
    categoria: '',
    bajo_stock: false
  });
  const [timeoutId, setTimeoutId] = useState(null);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    setLoading(true);
    try {
      const [proveedoresRes, unidadesRes, categoriasRes] = await Promise.all([
        inventarioApi.getProveedores(),
        inventarioApi.getUnidadesMedida(),
        inventarioApi.getCategorias()
      ]);
      
      setProveedores(Array.isArray(proveedoresRes) ? proveedoresRes : []);
      setUnidadesMedida(Array.isArray(unidadesRes) ? unidadesRes : []);
      setCategorias(Array.isArray(categoriasRes) ? categoriasRes : []);
      
      await cargarProductos();
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
      alert('Error al cargar los datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarProductos = async (nuevosFiltros = filtros) => {
    setLoading(true);
    try {
      const response = await inventarioApi.getProductosInventario(nuevosFiltros);
      setProductos(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      alert('Error al cargar los productos: ' + error.message);
      setProductos([]);
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
      const subcats = await inventarioApi.getSubcategorias(categoria);
      setSubcategorias(Array.isArray(subcats) ? subcats : []);
    } catch (error) {
      console.error('Error al cargar subcategorías:', error);
      setSubcategorias([]);
    }
  };

  const handleGuardarProducto = async (datos) => {
    try {
      if (productoEdit && productoEdit.id) {
        await inventarioApi.actualizarProductoInventario(productoEdit.id, datos);
        alert('✅ Producto actualizado correctamente');
      } else {
        await inventarioApi.crearProductoInventario(datos);
        alert('✅ Producto creado correctamente');
      }
      await cargarProductos(); // Recargar con filtros actuales
      setModalOpen(false);
      setProductoEdit(null);
    } catch (error) {
      console.error('Error al guardar producto:', error);
      alert(`❌ Error al guardar: ${error.message}`);
    }
  };

const handleEliminarProducto = async (id, nombre) => {
    if (!confirm(`⚠️ ¿Eliminar el producto "${nombre}"?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const response = await inventarioApi.eliminarProductoInventario(id);
      
      // Verificar si es una eliminación lógica (marcado como inactivo)
      if (response.warning) {
        alert(`⚠️ ${response.message}`);
      } else {
        alert('✅ Producto eliminado correctamente');
      }
      
      await cargarProductos(); // Recargar lista
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      alert(`❌ Error al eliminar: ${error.message}`);
    }
  };

  const handleBusquedaChange = (value) => {
    const nuevosFiltros = { ...filtros, search: value };
    setFiltros(nuevosFiltros);
    
    if (timeoutId) clearTimeout(timeoutId);
    const newTimeoutId = setTimeout(() => {
      cargarProductos(nuevosFiltros);
    }, 300);
    setTimeoutId(newTimeoutId);
  };

  const handleCategoriaChange = (value) => {
    const nuevosFiltros = { ...filtros, categoria: value };
    setFiltros(nuevosFiltros);
    cargarProductos(nuevosFiltros);
  };

  const handleBajoStockChange = () => {
    const nuevosFiltros = { ...filtros, bajo_stock: !filtros.bajo_stock };
    setFiltros(nuevosFiltros);
    cargarProductos(nuevosFiltros);
  };

  const limpiarFiltros = () => {
    const nuevosFiltros = { search: '', categoria: '', bajo_stock: false };
    setFiltros(nuevosFiltros);
    cargarProductos(nuevosFiltros);
  };

  const productosBajoStock = productos.filter(p => p.stock_actual <= p.stock_minimo).length;
  
  // Funciones para "agregar" nuevas opciones
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
                  <Database className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Gestión de Inventario</h1>
                  <p className="text-sm text-gray-500">Control de productos y stock</p>
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
        {/* Controles superiores */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                setProductoEdit(null);
                setModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Plus className="w-4 h-4" /> <span>Nuevo Producto</span>
            </button>
            
            <button
              onClick={() => navigate('/inventario/proveedores')}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Users className="w-4 h-4" /> <span>Proveedores</span>
            </button>
            
            <button
              onClick={() => navigate('/inventario/compras')}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <ShoppingCart className="w-4 h-4" /> <span>Compras</span>
            </button>
            
            <button
              onClick={handleBajoStockChange}
              className={`flex items-center gap-2 px-4 py-2.5 font-medium rounded-xl transition-all duration-200 ${
                filtros.bajo_stock 
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                  : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>
                {filtros.bajo_stock ? 'Mostrar Todos' : `Bajo Stock (${productosBajoStock})`}
              </span>
            </button>

            {/* ✅ Botón modificado: "Producto Receta" */}
            <button
              onClick={() => navigate('/inventario/recetas-producto-inventario')}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <PackagePlus className="w-4 h-4" /> <span>Producto Receta</span>
            </button>

            {/* ❌ Botón eliminado: "Crear Producto Receta" */}
          </div>

          <div className="text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span>Total productos: {productos.length}</span>
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
            {/* Búsqueda por nombre */}
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
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                  placeholder="Ej: Harina, Lechuga..."
                />
              </div>
            </div>

            {/* Filtro por categoría */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filtrar por categoría
              </label>
              <select
                value={filtros.categoria}
                onChange={(e) => handleCategoriaChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white"
              >
                <option value="">Todas las categorías</option>
                {categorias.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Resumen de resultados */}
            <div>
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <p className="text-sm text-green-700">
                  <span className="font-semibold">{productos.length}</span> productos
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de productos */}
        <ProductoList
          productos={productos}
          proveedores={proveedores}
          onEdit={(producto) => {
            setProductoEdit(producto);
            setModalOpen(true);
          }}
          onDelete={handleEliminarProducto}
          loading={loading}
        />
      </div>

      {/* Modal */}
      {modalOpen && (
        <ProductoModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setProductoEdit(null);
          }}
          producto={productoEdit}
          proveedores={proveedores}
          unidadesMedida={unidadesMedida}
          categorias={categorias}
          subcategorias={subcategorias}
          onSave={handleGuardarProducto}
          onAgregarUnidad={handleAgregarUnidad}
          onAgregarCategoria={handleAgregarCategoria}
          onAgregarSubcategoria={handleAgregarSubcategoria}
          onCategoriaChange={cargarSubcategorias}
        />
      )}
    </div>
  );
}
