// src/components/inventario/RecetaProductoInventarioForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { inventarioApi } from "../../api/inventarioApi";
import { conversionApi } from "../../api/conversionApi";
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

export default function RecetaProductoInventarioForm({ 
  isOpen, 
  onClose, 
  receta: recetaProp,
  unidadesMedida = [],
  productos = [],
  onSave,
  usuario,
  onVolver
}) {
  const navigate = useNavigate();
  const esEdicion = !!recetaProp && recetaProp.id;
  
  // Estados del formulario principal
  const [nombre, setNombre] = useState(recetaProp?.nombre || '');
  const [descripcion, setDescripcion] = useState(recetaProp?.descripcion || '');
  const [unidadMedidaId, setUnidadMedidaId] = useState(recetaProp?.unidad_medida_id ? String(recetaProp.unidad_medida_id) : '');
  const [categoria, setCategoria] = useState(recetaProp?.categoria || '');
  const [subcategoria, setSubcategoria] = useState(recetaProp?.subcategoria || '');
  
  // Estados de los detalles
  const [detalles, setDetalles] = useState(recetaProp?.detalles && Array.isArray(recetaProp.detalles) 
    ? recetaProp.detalles.map(detalle => ({
        id: detalle.id,
        producto_inventario_id: String(detalle.producto_inventario_id),
        cantidad: String(detalle.cantidad),
        precio_unitario: String(detalle.precio_unitario),
        unidad_medida_id: String(detalle.unidad_medida_id),
        unidad_medida: detalle.unidad_medida || 'unidad',
        subtotal: detalle.subtotal || 0
      }))
    : [{
        producto_inventario_id: '',
        cantidad: '',
        precio_unitario: '',
        unidad_medida_id: '',
        unidad_medida: '',
        subtotal: 0
      }]
  );
  
  // ✅ Estados para unidades compatibles y conversión
  const [unidadesCompatibles, setUnidadesCompatibles] = useState({});
  const [convirtiendo, setConvirtiendo] = useState({});
  
  // Estados para búsqueda de productos
  const [busquedaProducto, setBusquedaProducto] = useState({});
  const [productosFiltrados, setProductosFiltrados] = useState({});
  const [mostrarSugerencias, setMostrarSugerencias] = useState({});
  
  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);

  useEffect(() => {
    if (esEdicion && recetaProp) {
      setNombre(recetaProp.nombre || '');
      setDescripcion(recetaProp.descripcion || '');
      setUnidadMedidaId(recetaProp.unidad_medida_id ? String(recetaProp.unidad_medida_id) : '');
      setCategoria(recetaProp.categoria || '');
      setSubcategoria(recetaProp.subcategoria || '');
      
      if (Array.isArray(recetaProp.detalles) && recetaProp.detalles.length > 0) {
        const detallesConUnidades = recetaProp.detalles.map((detalle, index) => {
          // ✅ Cargar unidades compatibles para cada detalle en edición
          if (detalle.producto_inventario_id) {
            cargarUnidadesCompatibles(index, parseInt(detalle.producto_inventario_id));
          }
          return {
            id: detalle.id,
            producto_inventario_id: String(detalle.producto_inventario_id),
            cantidad: String(detalle.cantidad),
            precio_unitario: String(detalle.precio_unitario),
            unidad_medida_id: String(detalle.unidad_medida_id),
            unidad_medida: detalle.unidad_medida || 'unidad',
            subtotal: detalle.subtotal || 0
          };
        });
        setDetalles(detallesConUnidades);
      }
    }
  }, [recetaProp, esEdicion]);

  // ✅ Función corregida para cargar unidades compatibles
  const cargarUnidadesCompatibles = async (index, productoId) => {
    if (!productoId) {
      console.log(`No hay productoId para index ${index}`);
      setUnidadesCompatibles(prev => ({ ...prev, [index]: [] }));
      return;
    }

    const productoIdNum = parseInt(productoId);
    if (isNaN(productoIdNum) || productoIdNum <= 0) {
      console.warn(`⚠️ ID de producto inválido: ${productoId}`);
      setUnidadesCompatibles(prev => ({ ...prev, [index]: [] }));
      return;
    }

    console.log(`🔄 Cargando unidades compatibles para producto ${productoIdNum} en index ${index}`);

    try {
      // ✅ PASAR SOLO EL ID NUMÉRICO (corrección clave)
      const unidades = await conversionApi.getUnidadesCompatibles(productoIdNum);
      console.log(`✅ Unidades recibidas para producto ${productoIdNum}:`, unidades);
      
      // Guardar unidades compatibles
      setUnidadesCompatibles(prev => ({ ...prev, [index]: unidades || [] }));
      
      // Buscar el producto para obtener su unidad original
      const producto = productos.find(p => p.id === productoIdNum);
      
      if (producto && producto.unidad_medida_id) {
        console.log(`📦 Producto encontrado:`, producto);
        console.log(`📏 Unidad original del producto: ${producto.unidad_medida_id}`);
        
        // Actualizar el detalle con la unidad original
        const nuevosDetalles = [...detalles];
        if (!nuevosDetalles[index].unidad_medida_id) {
          nuevosDetalles[index] = {
            ...nuevosDetalles[index],
            unidad_medida_id: String(producto.unidad_medida_id),
            unidad_medida: producto.unidadMedida?.simbolo || 'unidad'
          };
          setDetalles(nuevosDetalles);
          console.log(`✅ Unidad establecida automáticamente: ${producto.unidad_medida_id}`);
        }
      } else {
        console.warn(`⚠️ No se encontró producto o no tiene unidad_medida_id`);
      }
    } catch (error) {
      console.error(`❌ Error al cargar unidades compatibles para producto ${productoIdNum}:`, error);
      setUnidadesCompatibles(prev => ({ ...prev, [index]: [] }));
      
      // Fallback: usar la unidad del producto directamente
      const producto = productos.find(p => p.id === productoIdNum);
      if (producto && producto.unidad_medida_id) {
        const unidadFallback = unidadesMedida.find(u => u.id === producto.unidad_medida_id);
        if (unidadFallback) {
          console.log(`🔧 Usando unidad fallback:`, unidadFallback);
          setUnidadesCompatibles(prev => ({ 
            ...prev, 
            [index]: [{
              unidad_destino_id: unidadFallback.id,
              unidad_destino_nombre: unidadFallback.nombre,
              unidad_destino_simbolo: unidadFallback.simbolo,
              descripcion: 'Unidad original del producto'
            }]
          }));
        }
      }
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

  const handleSeleccionarProducto = async (index, producto) => {
    console.log(`🎯 Producto seleccionado:`, producto);
    
    // ✅ Extraer precio (último o base)
    const precio = producto.precio_ultima_compra || producto.precio_compra || 0;
    
    // ✅ Extraer unidad_medida como string
    let unidadTexto = 'unidad';
    if (producto.unidad_medida_id && producto.unidadMedida) {
      unidadTexto = producto.unidadMedida.simbolo || producto.unidadMedida.nombre || 'unidad';
    } else if (typeof producto.unidad_medida === 'object') {
      unidadTexto = producto.unidad_medida.simbolo || producto.unidad_medida.nombre || 'unidad';
    } else if (producto.unidad_medida) {
      unidadTexto = String(producto.unidad_medida);
    }

    const nuevosDetalles = [...detalles];
    nuevosDetalles[index] = {
      ...nuevosDetalles[index],
      producto_inventario_id: String(producto.id),
      unidad_medida_id: String(producto.unidad_medida_id),
      precio_unitario: String(precio),
      unidad_medida: unidadTexto,
      subtotal: 0
    };
    
    setDetalles(nuevosDetalles);
    setBusquedaProducto(prev => ({ ...prev, [index]: '' }));
    setMostrarSugerencias(prev => ({ ...prev, [index]: false }));
    
    // ✅ Cargar unidades compatibles DESPUÉS de actualizar el estado
    await cargarUnidadesCompatibles(index, producto.id);
    
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
      unidad_medida_id: '',
      unidad_medida: '',
      subtotal: 0
    }]);
  };

  const handleRemoveDetalle = (index) => {
    if (detalles.length === 1) {
      alert('Debe haber al menos un ingrediente en la receta');
      return;
    }
    const nuevosDetalles = detalles.filter((_, i) => i !== index);
    setDetalles(nuevosDetalles);
    
    setBusquedaProducto(prev => {
      const newSearch = { ...prev };
      delete newSearch[index];
      return newSearch;
    });
    
    setUnidadesCompatibles(prev => {
      const newUnidades = { ...prev };
      delete newUnidades[index];
      return newUnidades;
    });
  };

  // ✅ Función corregida para manejar cambio de unidad con conversión
  const handleUnidadChange = async (index, nuevaUnidadId) => {
    const detalle = detalles[index];
    const producto = productos.find(p => p.id === parseInt(detalle.producto_inventario_id));
    
    if (!producto || !nuevaUnidadId) return;

    const unidadOriginalId = producto.unidad_medida_id;
    const nuevaUnidadIdNum = parseInt(nuevaUnidadId);

    // Si es la misma unidad, solo actualizar el estado
    if (nuevaUnidadIdNum === unidadOriginalId) {
      const nuevosDetalles = [...detalles];
      const nuevaUnidad = unidadesMedida.find(u => u.id === nuevaUnidadIdNum);
      nuevosDetalles[index] = {
        ...nuevosDetalles[index],
        unidad_medida_id: nuevaUnidadId,
        unidad_medida: nuevaUnidad?.simbolo || 'unidad'
      };
      setDetalles(nuevosDetalles);
      return;
    }

    // Verificar si la unidad seleccionada tiene factor de conversión
    const unidadSeleccionada = unidadesCompatibles[index]?.find(
      u => u.unidad_destino_id === nuevaUnidadIdNum
    );

    if (unidadSeleccionada && !unidadSeleccionada.tiene_factor) {
      // ✅ Permitir seleccionar pero advertir que no hay conversión automática
      const confirmar = window.confirm(
        `⚠️ No existe factor de conversión entre estas unidades.\n\n` +
        `Si continúas, deberás ingresar manualmente el precio en la nueva unidad.\n\n` +
        `¿Deseas cambiar la unidad de medida?`
      );

      if (!confirmar) return;

      const nuevosDetalles = [...detalles];
      const nuevaUnidad = unidadesMedida.find(u => u.id === nuevaUnidadIdNum);
      nuevosDetalles[index] = {
        ...nuevosDetalles[index],
        unidad_medida_id: nuevaUnidadId,
        unidad_medida: nuevaUnidad?.simbolo || 'unidad',
        // NO convertir el precio, mantenerlo para que el usuario lo ajuste
      };
      setDetalles(nuevosDetalles);
      
      // Mostrar alerta informativa
      setTimeout(() => {
        alert('⚠️ Por favor, ajusta manualmente el precio unitario para la nueva unidad de medida.');
      }, 100);
      
      return;
    }

    // Convertir precio unitario con factor de conversión
    setConvirtiendo(prev => ({ ...prev, [index]: true }));
    try {
      const resultado = await conversionApi.convertirCantidad({
        cantidad: parseFloat(detalle.precio_unitario) || 0,
        unidad_origen_id: unidadOriginalId,
        unidad_destino_id: nuevaUnidadIdNum
      });

      const nuevaUnidad = unidadesMedida.find(u => u.id === nuevaUnidadIdNum);
      const nuevosDetalles = [...detalles];
      nuevosDetalles[index] = {
        ...nuevosDetalles[index],
        unidad_medida_id: nuevaUnidadId,
        unidad_medida: nuevaUnidad?.simbolo || 'unidad',
        precio_unitario: String(resultado.cantidad_convertida)
      };
      setDetalles(nuevosDetalles);
    } catch (error) {
      alert(`❌ Error al convertir precio: ${error.message}\n\nPuedes cambiar la unidad pero deberás ajustar el precio manualmente.`);
      
      // Permitir el cambio pero sin conversión
      const nuevosDetalles = [...detalles];
      const nuevaUnidad = unidadesMedida.find(u => u.id === nuevaUnidadIdNum);
      nuevosDetalles[index] = {
        ...nuevosDetalles[index],
        unidad_medida_id: nuevaUnidadId,
        unidad_medida: nuevaUnidad?.simbolo || 'unidad'
      };
      setDetalles(nuevosDetalles);
    } finally {
      setConvirtiendo(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleDetalleChange = (index, field, value) => {
    const nuevosDetalles = [...detalles];
    nuevosDetalles[index][field] = value;
    
    if (field === 'cantidad' || field === 'precio_unitario') {
      const cantidad = parseFloat(nuevosDetalles[index].cantidad) || 0;
      const precio = parseFloat(nuevosDetalles[index].precio_unitario) || 0;
      nuevosDetalles[index].subtotal = cantidad * precio;
    }
    
    setDetalles(nuevosDetalles);
  };

  const handleKeyDown = (e, index, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      if (field === 'cantidad') {
        const precioInput = document.getElementById(`precio-${index}`);
        if (precioInput) precioInput.focus();
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
    if (!productoId) return 'Seleccionar ingrediente';
    const producto = productos.find(p => p.id === parseInt(productoId));
    if (!producto) return 'Ingrediente no encontrado';
    
    let unidadTexto = 'unidad';
    if (producto.unidad_medida_id && producto.unidadMedida) {
      unidadTexto = producto.unidadMedida.simbolo || producto.unidadMedida.nombre || 'unidad';
    } else if (typeof producto.unidad_medida === 'object') {
      unidadTexto = producto.unidad_medida.simbolo || producto.unidad_medida.nombre || 'unidad';
    } else if (producto.unidad_medida) {
      unidadTexto = String(producto.unidad_medida);
    }
    return `${producto.nombre} (${unidadTexto})`;
  };

  const calcularCostoTotal = () => {
    return detalles.reduce((total, detalle) => {
      const cantidad = parseFloat(detalle.cantidad) || 0;
      const precio = parseFloat(detalle.precio_unitario) || 0;
      return total + (cantidad * precio);
    }, 0);
  };

  const handleVolver = () => {
    if (onVolver) {
      onVolver();
    } else if (onClose) {
      onClose(); // ✅ Cerrar modal
    } else {
      navigate('/inventario/recetas-producto-inventario');
    }
  };

  const handleGuardarReceta = async () => {
    setMostrarModalConfirmacion(false);

    if (!nombre.trim()) {
      alert('⚠️ Debes ingresar un nombre para la receta');
      return;
    }
    
    if (!unidadMedidaId) {
      alert('⚠️ Debes seleccionar una unidad de medida');
      return;
    }
    
    const detallesValidos = detalles.filter(d => {
      const productoOk = d.producto_inventario_id && String(d.producto_inventario_id).trim() !== '';
      const cantidadOk = d.cantidad && parseFloat(d.cantidad) > 0;
      const precioOk = d.precio_unitario && parseFloat(d.precio_unitario) > 0;
      const unidadOk = d.unidad_medida_id && String(d.unidad_medida_id).trim() !== '';
      return productoOk && cantidadOk && precioOk && unidadOk;
    });
    
    if (detallesValidos.length === 0) {
      alert('⚠️ Debes agregar al menos un ingrediente válido con:\n• Ingrediente seleccionado\n• Cantidad mayor a 0\n• Precio unitario mayor a 0\n• Unidad de medida');
      return;
    }
    
    if (detallesValidos.length !== detalles.filter(d => d.producto_inventario_id).length) {
      alert('⚠️ Algunos ingredientes están incompletos\n\nVerifica que cada ingrediente tenga:\n• Cantidad mayor a 0\n• Precio unitario mayor a 0\n• Unidad de medida');
      return;
    }
    
    setLoading(true);
    
    try {
      const recetaData = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        unidad_medida_id: parseInt(unidadMedidaId),
        categoria: categoria || null,
        subcategoria: subcategoria || null,
        costo_unitario: calcularCostoTotal(),
        precio_venta: 0, // Se puede calcular después
        activo: true,
        detalles: detallesValidos.map(detalle => {
          const cantidad = parseFloat(detalle.cantidad);
          const precioUnitario = parseFloat(detalle.precio_unitario);
          const subtotal = cantidad * precioUnitario;
          
          return {
            producto_inventario_id: parseInt(detalle.producto_inventario_id),
            cantidad: cantidad,
            precio_unitario: precioUnitario,
            subtotal: subtotal,
            unidad_medida_id: parseInt(detalle.unidad_medida_id),
            unidad_medida: detalle.unidad_medida.trim()
          };
        })
      };
      
      if (onSave) {
        await onSave(recetaData);
      } else if (esEdicion) {
        await inventarioApi.actualizarRecetaProductoInventario(recetaProp.id, recetaData);
        alert('✅ Receta actualizada correctamente');
      } else {
        await inventarioApi.crearRecetaProductoInventario(recetaData);
        alert('✅ Receta creada correctamente');
      }
      
      handleVolver(); // ✅ Cerrar modal
    } catch (error) {
      console.error('Error al guardar receta:', error);
      alert(`❌ Error al guardar la receta: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMostrarModalConfirmacion(true);
  };

  if (!isOpen) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-slate-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <button
                onClick={handleVolver}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 font-medium group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span>Volver</span>
              </button>
              <div className="h-8 w-px bg-gray-200" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                  <PackageIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {esEdicion ? 'Editar Receta de Producto' : 'Nueva Receta de Producto'}
                  </h1>
                  <p className="text-sm text-gray-500">Creación de productos compuestos para inventario</p>
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
            
            {/* ✅ Botón de cerrar modal */}
            <button
              onClick={handleVolver}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
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
                Nombre de la receta <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Ej: Salsa Bolognesa"
                autoFocus
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Unidad de medida <span className="text-red-500">*</span>
              </label>
              <select
                value={unidadMedidaId}
                onChange={(e) => setUnidadMedidaId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value="">Seleccionar unidad</option>
                {unidadesMedida.map(unidad => (
                  <option key={unidad.id} value={unidad.id}>
                    {unidad.nombre} ({unidad.simbolo})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Categoría
              </label>
              <input
                type="text"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Ej: Salsas"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Subcategoría
              </label>
              <input
                type="text"
                value={subcategoria}
                onChange={(e) => setSubcategoria(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Ej: Caseras"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                rows="2"
                placeholder="Descripción opcional"
              />
            </div>
          </div>

          {/* Detalles de la receta */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <PackageIcon className="w-5 h-5 text-green-600" />
                Ingredientes
              </h3>
              <button
                type="button"
                onClick={handleAddDetalle}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar</span>
              </button>
            </div>

            <div className="space-y-4">
              {detalles.map((detalle, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-12 gap-3 items-end">
                    {/* Búsqueda de producto */}
                    <div className="col-span-12 md:col-span-5 relative">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Buscar ingrediente
                      </label>
                      <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          id={`busqueda-${index}`}
                          type="text"
                          value={detalle.producto_inventario_id ? getProductoNombre(detalle.producto_inventario_id) : busquedaProducto[index] || ''}
                          onChange={(e) => handleBusquedaProducto(index, e.target.value)}
                          onFocus={() => busquedaProducto[index] && setMostrarSugerencias(prev => ({ ...prev, [index]: true }))}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
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
                                unidad_medida_id: '',
                                precio_unitario: '',
                                unidad_medida: '',
                                subtotal: 0
                              };
                              setDetalles(nuevosDetalles);
                              setBusquedaProducto(prev => ({ ...prev, [index]: '' }));
                              setMostrarSugerencias(prev => ({ ...prev, [index]: false }));
                              
                              // ✅ Limpiar unidades compatibles
                              setUnidadesCompatibles(prev => {
                                const newUnidades = { ...prev };
                                delete newUnidades[index];
                                return newUnidades;
                              });
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
                              className="w-full text-left px-3 py-2 hover:bg-green-50 border-b last:border-b-0 transition-colors"
                            >
                              <div className="font-semibold text-sm text-gray-900">{producto.nombre}</div>
                              <div className="text-xs text-gray-500">
                                {typeof producto.unidad_medida === 'object'
                                  ? `${producto.unidad_medida.nombre} (${producto.unidad_medida.simbolo})`
                                  : producto.unidad_medida
                                }
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Cantidad */}
                    <div className="col-span-6 md:col-span-2">
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                        placeholder="0.00"
                        min="0.01"
                        required
                      />
                    </div>
                    
                    {/* Precio unitario */}
                    <div className="col-span-6 md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Precio unitario <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <DollarSign className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          id={`precio-${index}`}
                          type="number"
                          step="0.01"
                          value={detalle.precio_unitario}
                          onChange={(e) => handleDetalleChange(index, 'precio_unitario', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, index, 'precio_unitario')}
                          className="w-full pl-8 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                          placeholder="0.00"
                          min="0.01"
                          required
                        />
                      </div>
                    </div>
                    
                    {/* Unidad - ✅ Select con unidades compatibles */}
                    <div className="col-span-6 md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Unidad <span className="text-red-500">*</span>
                      </label>
                      {convirtiendo[index] ? (
                        <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 flex items-center">
                          <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                          <span className="text-sm text-gray-600">Convirtiendo...</span>
                        </div>
                      ) : unidadesCompatibles[index] && unidadesCompatibles[index].length > 0 ? (
                        <select
                          value={detalle.unidad_medida_id || ''}
                          onChange={(e) => handleUnidadChange(index, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                          required
                        >
                          <option value="">Seleccionar</option>
                          {unidadesCompatibles[index].map(unidad => {
                            const esOriginal = unidad.unidad_destino_id === parseInt(detalle.unidad_medida_id);
                            const tieneFactor = unidad.tiene_factor;
                            const sinFactor = !tieneFactor && !esOriginal;
                            
                            return (
                              <option 
                                key={unidad.unidad_destino_id} 
                                value={unidad.unidad_destino_id}
                                className={sinFactor ? 'text-amber-600' : ''}
                              >
                                {esOriginal && '★ '}
                                {unidad.unidad_destino_nombre} ({unidad.unidad_destino_simbolo})
                                {sinFactor && ' ⚠️'}
                                {unidad.descripcion && tieneFactor && ` - ${unidad.descripcion}`}
                              </option>
                            );
                          })}
                        </select>
                      ) : (
                        <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-yellow-50 text-sm text-yellow-700 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          <span>Seleccione producto</span>
                        </div>
                      )}
                      {detalle.unidad_medida_id && unidadesCompatibles[index] && (
                        <div className="mt-1 text-xs text-gray-500">
                          {(() => {
                            const unidadSel = unidadesCompatibles[index].find(
                              u => u.unidad_destino_id === parseInt(detalle.unidad_medida_id)
                            );
                            if (unidadSel?.es_original) {
                              return '★ Unidad original del producto';
                            } else if (unidadSel?.tiene_factor) {
                              return `✓ ${unidadSel.descripcion || 'Con factor de conversión'}`;
                            } else if (unidadSel) {
                              return '⚠️ Sin factor - ajuste manual requerido';
                            }
                            return '';
                          })()}
                        </div>
                      )}
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

          {/* Resumen */}
          <div className="border-t pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-lg font-bold text-gray-900">
                Costo total: ${calcularCostoTotal().toFixed(2)}
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
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-medium rounded-xl transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{esEdicion ? 'Actualizar Receta' : 'Crear Receta'}</span>
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
                {esEdicion ? '¿Deseas actualizar esta receta?' : '¿Deseas guardar esta receta?'}
              </p>
              <div className="bg-gray-50 p-3 rounded-lg mt-4">
                <p className="text-sm text-gray-600 font-semibold mb-2">Resumen:</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Nombre: {nombre}</li>
                  <li>• Unidad: {unidadesMedida.find(u => u.id === parseInt(unidadMedidaId))?.nombre || 'N/A'}</li>
                  <li>• Ingredientes: {detalles.filter(d => d.producto_inventario_id).length}</li>
                  <li>• Costo total: ${calcularCostoTotal().toFixed(2)}</li>
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
                onClick={handleGuardarReceta}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white rounded-lg font-medium transition-all disabled:opacity-50"
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
