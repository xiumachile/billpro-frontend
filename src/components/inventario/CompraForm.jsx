import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { inventarioApi } from "../../api/inventarioApi";
import { 
  ArrowLeft,
  Plus,
  Minus,
  Save,
  Calendar,
  FileText,
  DollarSign,
  Package as PackageIcon,
  ShoppingCart,
  Search,
  X,
  AlertCircle
} from 'lucide-react';

export default function CompraForm({ usuario, onVolver }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const esEdicion = !!id;
  
  // Estado del formulario principal
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [numeroFactura, setNumeroFactura] = useState('');
  const [proveedorId, setProveedorId] = useState('');
  const [formaPagoId, setFormaPagoId] = useState(''); // ✅ Nuevo estado
  const [observaciones, setObservaciones] = useState('');
  const [estado, setEstado] = useState('pendiente');
  
  // Estado de los detalles
  const [detalles, setDetalles] = useState([{
    producto_inventario_id: '',
    cantidad: '',
    precio_unitario: '',
    unidad_medida: ''
  }]);
  
  // Datos para selects
  const [proveedores, setProveedores] = useState([]);
  const [formasPago, setFormasPago] = useState([]); // ✅ Datos de formas de pago
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Estado para búsqueda de productos
  const [busquedaProducto, setBusquedaProducto] = useState({});
  const [productosFiltrados, setProductosFiltrados] = useState({});
  const [mostrarSugerencias, setMostrarSugerencias] = useState({});

  // Modal de confirmación
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [proveedoresRes, formasPagoRes, productosRes] = await Promise.all([
        inventarioApi.getProveedores(),
        inventarioApi.getFormasPago(),
        inventarioApi.getProductosCompra()
      ]);
      
      setProveedores(Array.isArray(proveedoresRes) ? proveedoresRes : []);
      setFormasPago(Array.isArray(formasPagoRes) ? formasPagoRes : []); // ✅
      setProductos(Array.isArray(productosRes) ? productosRes : []);

      if (esEdicion) {
        await cargarCompra();
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar los datos necesarios: ' + error.message);
    } finally {
      setLoadingData(false);
    }
  };

  const cargarCompra = async () => {
    try {
      const compra = await inventarioApi.getCompra(id);
      
      setFecha(compra.fecha);
      setNumeroFactura(compra.numero_factura || '');
      setProveedorId(String(compra.proveedor_id));
      setFormaPagoId(compra.forma_pago_id ? String(compra.forma_pago_id) : ''); // ✅
      setObservaciones(compra.observaciones || '');
      setEstado(compra.estado || 'pendiente');

      if (Array.isArray(compra.detalles) && compra.detalles.length > 0) {
        setDetalles(compra.detalles.map(detalle => {
          let unidadTexto = 'unidad';
          if (detalle.unidad_medida) {
            if (typeof detalle.unidad_medida === 'object') {
              unidadTexto = detalle.unidad_medida.simbolo || detalle.unidad_medida.nombre || 'unidad';
            } else {
              unidadTexto = String(detalle.unidad_medida);
            }
          }

          return {
            id: detalle.id,
            producto_inventario_id: String(detalle.producto_inventario_id),
            cantidad: String(detalle.cantidad),
            precio_unitario: String(detalle.precio_unitario),
            unidad_medida: unidadTexto
          };
        }));
      }
    } catch (error) {
      console.error('Error al cargar compra:', error);
      alert('Error al cargar la compra: ' + error.message);
      navigate('/inventario/compras');
    }
  };

  const handleBusquedaProducto = (index, valor) => {
    setBusquedaProducto(prev => ({ ...prev, [index]: valor }));
    
    if (valor.trim()) {
      const termino = valor.toLowerCase();
      const filtrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(termino) ||
        String(p.id).includes(termino)
      );
      setProductosFiltrados(prev => ({ ...prev, [index]: filtrados }));
      setMostrarSugerencias(prev => ({ ...prev, [index]: true }));
    } else {
      setProductosFiltrados(prev => ({ ...prev, [index]: [] }));
      setMostrarSugerencias(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleSeleccionarProducto = (index, producto) => {
    // ✅ Usar precio_ultima_compra o precio_compra
    const precio = producto.precio_ultima_compra || producto.precio_compra || 0;
    
    let unidadTexto = 'unidad';
    if (producto.unidad_medida_id && producto.unidadMedida) {
      unidadTexto = producto.unidadMedida.simbolo || 'unidad';
    } else if (typeof producto.unidad_medida === 'object') {
      unidadTexto = producto.unidad_medida.simbolo || producto.unidad_medida.nombre || 'unidad';
    } else if (producto.unidad_medida) {
      unidadTexto = String(producto.unidad_medida);
    }

    const nuevosDetalles = [...detalles];
    nuevosDetalles[index] = {
      ...nuevosDetalles[index],
      producto_inventario_id: String(producto.id),
      unidad_medida: unidadTexto,
      precio_unitario: String(precio)
    };
    
    setDetalles(nuevosDetalles);
    setBusquedaProducto(prev => ({ ...prev, [index]: '' }));
    setMostrarSugerencias(prev => ({ ...prev, [index]: false }));
    
    setTimeout(() => {
      const cantidadInput = document.getElementById(`cantidad-${index}`);
      if (cantidadInput) cantidadInput.focus();
    }, 100);
  };

  const handleAddDetalle = () => {
    setDetalles([...detalles, {
      producto_inventario_id: '',
      cantidad: '',
      precio_unitario: '',
      unidad_medida: ''
    }]);
  };

  const handleRemoveDetalle = (index) => {
    if (detalles.length === 1) {
      alert('Debe haber al menos un producto en la compra');
      return;
    }
    const nuevosDetalles = detalles.filter((_, i) => i !== index);
    setDetalles(nuevosDetalles);
    
    setBusquedaProducto(prev => {
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
        const precioInput = document.getElementById(`precio-${index}`);
        if (precioInput) {
          precioInput.focus();
        }
      } else if (field === 'precio_unitario') {
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

  const getProductoNombre = (productoId) => {
    if (!productoId) return 'Seleccionar producto';
    const producto = productos.find(p => p.id === parseInt(productoId));
    if (!producto) return 'Producto no encontrado';
    
    let unidadTexto = 'unidad';
    if (producto.unidad_medida_id && producto.unidadMedida) {
      unidadTexto = producto.unidadMedida.simbolo;
    } else if (typeof producto.unidad_medida === 'object') {
      unidadTexto = producto.unidad_medida.simbolo || producto.unidad_medida.nombre || 'unidad';
    } else if (producto.unidad_medida) {
      unidadTexto = String(producto.unidad_medida);
    }
    return `${producto.nombre} (${unidadTexto})`;
  };

  const calcularTotal = () => {
    return detalles.reduce((total, detalle) => {
      const cantidad = parseFloat(detalle.cantidad) || 0;
      const precio = parseFloat(detalle.precio_unitario) || 0;
      return total + (cantidad * precio);
    }, 0);
  };

  const handleVolver = () => {
    if (onVolver) {
      onVolver();
    } else {
      navigate('/inventario/compras');
    }
  };

  const handleGuardarCompra = async () => {
    setMostrarModalConfirmacion(false);

    if (!proveedorId) {
      alert('Debes seleccionar un proveedor');
      return;
    }
    
    const detallesValidos = detalles.filter(d => {
      const productoOk = d.producto_inventario_id && String(d.producto_inventario_id).trim() !== '';
      const cantidadOk = d.cantidad && parseFloat(d.cantidad) > 0;
      const precioOk = d.precio_unitario && parseFloat(d.precio_unitario) > 0;
      const unidadOk = d.unidad_medida && d.unidad_medida.trim() !== '';
      return productoOk && cantidadOk && precioOk && unidadOk;
    });
    
    if (detallesValidos.length === 0) {
      alert('Debes agregar al menos un producto válido con:\n• Producto seleccionado\n• Cantidad > 0\n• Precio > 0\n• Unidad de medida');
      return;
    }
    
    setLoading(true);
    
    try {
      const compraData = {
        fecha: fecha,
        numero_factura: numeroFactura || null,
        proveedor_id: parseInt(proveedorId),
        forma_pago_id: formaPagoId ? parseInt(formaPagoId) : null, // ✅ Incluir forma_pago_id
        estado: estado,
        observaciones: observaciones || null,
        total: calcularTotal(),
        detalles: detallesValidos.map(detalle => {
          const cantidad = parseFloat(detalle.cantidad);
          const precioUnitario = parseFloat(detalle.precio_unitario);
          const subtotal = cantidad * precioUnitario;
          
          return {
            producto_inventario_id: parseInt(detalle.producto_inventario_id),
            cantidad: cantidad,
            precio_unitario: precioUnitario,
            subtotal: subtotal,
            unidad_medida: detalle.unidad_medida.trim()
          };
        })
      };
      
      if (esEdicion) {
        await inventarioApi.actualizarCompra(id, compraData);
        alert('✅ Compra actualizada correctamente');
      } else {
        await inventarioApi.crearCompra(compraData);
        alert('✅ Compra creada correctamente');
      }
      navigate('/inventario/compras');
    } catch (error) {
      console.error('Error al guardar compra:', error);
      alert(`❌ Error al guardar la compra: ${error.message}`);
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
                  <h1 className="text-2xl font-bold text-gray-900">
                    {esEdicion ? 'Editar Compra' : 'Nueva Compra'}
                  </h1>
                  <p className="text-sm text-gray-500">Registro de compra de materia prima</p>
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
                Fecha de compra <span className="text-red-500">*</span>
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
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Número de factura
              </label>
              <div className="relative">
                <FileText className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={numeroFactura}
                  onChange={(e) => setNumeroFactura(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Ej: F001-2025"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Proveedor <span className="text-red-500">*</span>
              </label>
              <select
                value={proveedorId}
                onChange={(e) => setProveedorId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              >
                <option value="">Seleccionar proveedor</option>
                {proveedores.map(proveedor => (
                  <option key={proveedor.id} value={proveedor.id}>
                    {proveedor.nombre} {proveedor.identificacion ? `(${proveedor.identificacion})` : ''}
                  </option>
                ))}
              </select>
            </div>
            
            {/* ✅ NUEVO: Forma de pago */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Forma de pago
              </label>
              <select
                value={formaPagoId}
                onChange={(e) => setFormaPagoId(e.target.value || '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Sin forma de pago</option>
                {formasPago.map(forma => (
                  <option key={forma.id} value={forma.id}>
                    {forma.nombre}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Estado <span className="text-red-500">*</span>
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              >
                <option value="pendiente">Pendiente</option>
                <option value="parcial">Parcial</option>
                <option value="pagado">Pagado</option>
                <option value="anulado">Anulado</option>
              </select>
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
                placeholder="Notas adicionales sobre la compra"
              />
            </div>
          </div>

          {/* Detalles de la compra */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <PackageIcon className="w-5 h-5 text-purple-600" />
                Productos de la compra
              </h3>
              <button
                type="button"
                onClick={handleAddDetalle}
                className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar producto</span>
              </button>
            </div>

            <div className="space-y-4">
              {detalles.map((detalle, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-12 gap-3 items-end">
                    {/* Búsqueda de producto */}
                    <div className="col-span-12 md:col-span-5 relative">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Buscar producto
                      </label>
                      <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          id={`busqueda-${index}`}
                          type="text"
                          value={detalle.producto_inventario_id ? getProductoNombre(detalle.producto_inventario_id) : busquedaProducto[index] || ''}
                          onChange={(e) => handleBusquedaProducto(index, e.target.value)}
                          onFocus={() => busquedaProducto[index] && setMostrarSugerencias(prev => ({ ...prev, [index]: true }))}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                          placeholder="Buscar por nombre o ID..."
                          readOnly={!!detalle.producto_inventario_id}
                        />
                        {detalle.producto_inventario_id && (
                          <button
                            type="button"
                            onClick={() => {
                              const nuevosDetalles = [...detalles];
                              nuevosDetalles[index] = {
                                ...nuevosDetalles[index],
                                producto_inventario_id: '',
                                unidad_medida: '',
                                precio_unitario: ''
                              };
                              setDetalles(nuevosDetalles);
                              setBusquedaProducto(prev => ({ ...prev, [index]: '' }));
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Sugerencias */}
                      {mostrarSugerencias[index] && productosFiltrados[index]?.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto">
                          {productosFiltrados[index].map(producto => (
                            <button
                              key={producto.id}
                              type="button"
                              onClick={() => handleSeleccionarProducto(index, producto)}
                              className="w-full text-left px-3 py-2 hover:bg-purple-50 border-b last:border-b-0 transition-colors"
                            >
                              <div className="font-medium text-sm text-gray-900">
                                {producto.nombre}
                              </div>
                              <div className="text-xs text-gray-500">
                                {typeof producto.unidad_medida === 'object'
                                  ? `${producto.unidad_medida.nombre} (${producto.unidad_medida.simbolo})`
                                  : producto.unidad_medida
                                } • ${parseFloat(producto.precio_compra || 0).toFixed(2)}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Cantidad */}
                    <div className="col-span-6 md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Cantidad
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
                      />
                    </div>
                    
                    {/* Precio unitario */}
                    <div className="col-span-6 md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Precio unitario
                      </label>
                      <div className="relative">
                        <DollarSign className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 text-xs" />
                        <input
                          id={`precio-${index}`}
                          type="number"
                          step="0.01"
                          value={detalle.precio_unitario}
                          onChange={(e) => handleDetalleChange(index, 'precio_unitario', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, index, 'precio_unitario')}
                          className="w-full pl-8 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                          placeholder="0.00"
                          min="0.01"
                        />
                      </div>
                    </div>
                    
                    {/* Unidad */}
                    <div className="col-span-6 md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Unidad
                      </label>
                      <input
                        type="text"
                        value={detalle.unidad_medida}
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
                      ${((parseFloat(detalle.cantidad) || 0) * (parseFloat(detalle.precio_unitario) || 0)).toFixed(2)}
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
                      <span>{esEdicion ? 'Actualizar Compra' : 'Crear Compra'}</span>
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
              <h2 className="text-xl font-bold text-gray-900">Confirmar guardado</h2>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-2">
                {esEdicion ? 'Deseas actualizar esta compra?' : 'Deseas guardar esta compra?'}
              </p>
              <div className="bg-gray-50 p-3 rounded-lg mt-4">
                <p className="text-sm text-gray-600 font-semibold mb-2">Resumen:</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Proveedor: {proveedores.find(p => p.id === parseInt(proveedorId))?.nombre || 'N/A'}</li>
                  <li>• Forma de pago: {formasPago.find(f => f.id === parseInt(formaPagoId))?.nombre || 'Sin forma de pago'}</li>
                  <li>• Productos: {detalles.filter(d => d.producto_inventario_id).length}</li>
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
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Sí, guardar</span>
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
