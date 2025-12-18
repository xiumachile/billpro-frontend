// src/components/inventario/RecetaProductoInventarioForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { inventarioApi } from "../../api/inventarioApi";
import { conversionApi } from "../../api/conversionApi";
import { 
  ArrowLeft, Plus, Minus, Save, Calendar, FileText,
  DollarSign, Package as PackageIcon, ShoppingCart,
  Search, X, AlertCircle
} from 'lucide-react';

export default function RecetaProductoInventarioForm({ 
  isOpen, onClose, receta: recetaProp, unidadesMedida = [],
  productos = [], onSave, usuario, onVolver
}) {
  const navigate = useNavigate();
  const esEdicion = !!recetaProp && recetaProp.id;
  
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [unidadMedidaId, setUnidadMedidaId] = useState('');
  const [categoria, setCategoria] = useState('');
  const [subcategoria, setSubcategoria] = useState('');
  
  const [detalles, setDetalles] = useState([{
    producto_inventario_id: '',
    cantidad: '',
    precio_unitario: '',
    unidad_medida_id: '',
    unidad_medida: '',
    subtotal: 0
  }]);
  
  const [unidadesCompatibles, setUnidadesCompatibles] = useState({});
  const [busquedaProducto, setBusquedaProducto] = useState({});
  const [productosFiltrados, setProductosFiltrados] = useState({});
  const [mostrarSugerencias, setMostrarSugerencias] = useState({});
  const [loading, setLoading] = useState(false);
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);
  const [cargandoDetalles, setCargandoDetalles] = useState(false);

  // ✅ Log inicial para debug
  useEffect(() => {
    console.log('🎯 [FORM] Componente montado/actualizado:', {
      recetaProp,
      esEdicion,
      productos_disponibles: productos.length,
      unidades_disponibles: unidadesMedida.length
    });
  }, [recetaProp, productos.length, unidadesMedida.length]);

  // ✅ NUEVO: Cargar datos de la receta cuando se está editando
  useEffect(() => {
    const cargarDatosReceta = async () => {
      if (!recetaProp || !recetaProp.id) {
        // Si no hay receta, inicializar con valores vacíos
        setNombre('');
        setDescripcion('');
        setUnidadMedidaId('');
        setCategoria('');
        setSubcategoria('');
        setDetalles([{
          producto_inventario_id: '',
          cantidad: '',
          precio_unitario: '',
          unidad_medida_id: '',
          unidad_medida: '',
          subtotal: 0
        }]);
        return;
      }

      setCargandoDetalles(true);
      
      try {
        console.log('🔍 [DEBUG] recetaProp recibida:', recetaProp);
        
        // ✅ Si no tiene detalles cargados, hacer fetch completo desde el API
        let recetaCompleta = recetaProp;
        if (!recetaProp.detalles || recetaProp.detalles.length === 0) {
          console.log('📡 Cargando detalles desde el API...');
          try {
            recetaCompleta = await inventarioApi.obtenerRecetaProductoInventario(recetaProp.id);
            console.log('✅ Receta completa obtenida:', recetaCompleta);
          } catch (error) {
            console.error('❌ Error al obtener receta completa:', error);
            // Continuar con los datos que tenemos
          }
        }
        
        // Cargar datos generales
        setNombre(recetaCompleta.nombre || '');
        setDescripcion(recetaCompleta.descripcion || '');
        setUnidadMedidaId(recetaCompleta.unidad_medida_id ? String(recetaCompleta.unidad_medida_id) : '');
        setCategoria(recetaCompleta.categoria || '');
        setSubcategoria(recetaCompleta.subcategoria || '');

        console.log('📋 Detalles encontrados:', recetaCompleta.detalles);

        // ✅ Si la receta tiene detalles, cargarlos
        if (recetaCompleta.detalles && recetaCompleta.detalles.length > 0) {
          console.log(`📦 Procesando ${recetaCompleta.detalles.length} detalles...`);
          
          const detallesCargados = await Promise.all(
            recetaCompleta.detalles.map(async (detalle, index) => {
              console.log(`🔄 Procesando detalle ${index + 1}:`, detalle);
              
              const producto = productos.find(p => p.id === detalle.producto_inventario_id);
              
              if (!producto) {
                console.warn(`⚠️ Producto ${detalle.producto_inventario_id} no encontrado en la lista de productos`);
                console.log('📋 Productos disponibles:', productos.map(p => ({ id: p.id, nombre: p.nombre })));
                return null;
              }

              console.log(`✅ Producto encontrado: ${producto.nombre}`);

              // Cargar unidades compatibles
              const unidadesDisponibles = await cargarUnidadesCompatibles(index, producto.id);
              console.log(`📏 Unidades compatibles cargadas para ${producto.nombre}:`, unidadesDisponibles);
              
              // Obtener unidad del detalle
              let unidadTexto = 'unidad';
              let unidadId = detalle.unidad_medida_id;
              
              if (detalle.unidad_medida && typeof detalle.unidad_medida === 'object') {
                unidadTexto = detalle.unidad_medida.simbolo || detalle.unidad_medida.nombre || 'unidad';
                unidadId = detalle.unidad_medida.id || detalle.unidad_medida_id;
              } else if (detalle.unidad_medida_id) {
                const unidadEncontrada = unidadesMedida.find(u => u.id === detalle.unidad_medida_id);
                if (unidadEncontrada) {
                  unidadTexto = unidadEncontrada.simbolo || unidadEncontrada.nombre || 'unidad';
                }
              } else if (producto.unidadMedida) {
                unidadTexto = producto.unidadMedida.simbolo || producto.unidadMedida.nombre || 'unidad';
                unidadId = producto.unidad_medida_id;
              }

              // Calcular subtotal inicial
              const cantidad = parseFloat(detalle.cantidad) || 0;
              const precioUnitario = parseFloat(detalle.precio_unitario) || parseFloat(producto.precio_ultima_compra || producto.precio_compra || 0);
              
              const detalleFormateado = {
                producto_inventario_id: String(producto.id),
                cantidad: String(cantidad),
                precio_unitario: String(precioUnitario),
                unidad_medida_id: String(unidadId),
                unidad_medida: unidadTexto,
                subtotal: cantidad * precioUnitario
              };
              
              console.log(`✅ Detalle ${index + 1} formateado:`, detalleFormateado);
              return detalleFormateado;
            })
          );

          // Filtrar detalles nulos (productos no encontrados)
          const detallesValidos = detallesCargados.filter(d => d !== null);
          
          console.log(`📊 Resultado: ${detallesValidos.length} detalles válidos de ${detallesCargados.length} totales`);
          
          if (detallesValidos.length > 0) {
            setDetalles(detallesValidos);
            console.log('✅ Detalles cargados exitosamente:', detallesValidos);
          } else {
            console.warn('⚠️ No hay detalles válidos, manteniendo formulario vacío');
            // Si no hay detalles válidos, mantener uno vacío
            setDetalles([{
              producto_inventario_id: '',
              cantidad: '',
              precio_unitario: '',
              unidad_medida_id: '',
              unidad_medida: '',
              subtotal: 0
            }]);
          }
        } else {
          console.log('ℹ️ No se encontraron detalles en la receta');
          // Si no hay detalles, inicializar con uno vacío
          setDetalles([{
            producto_inventario_id: '',
            cantidad: '',
            precio_unitario: '',
            unidad_medida_id: '',
            unidad_medida: '',
            subtotal: 0
          }]);
        }
      } catch (error) {
        console.error('❌ Error al cargar datos de receta:', error);
        console.error('Stack trace:', error.stack);
        alert('Error al cargar los datos de la receta: ' + error.message);
      } finally {
        setCargandoDetalles(false);
      }
    };

    cargarDatosReceta();
  }, [recetaProp?.id, productos.length, unidadesMedida.length]); // Ejecutar cuando cambie el ID, productos o unidades

  // ✅ Cargar unidades compatibles
  const cargarUnidadesCompatibles = useCallback(async (index, productoId) => {
    if (!productoId) {
      setUnidadesCompatibles(prev => ({ ...prev, [index]: [] }));
      return [];
    }

    try {
      const unidades = await conversionApi.getUnidadesCompatibles(productoId);
      setUnidadesCompatibles(prev => ({ ...prev, [index]: unidades || [] }));
      return unidades || [];
    } catch (error) {
      console.error('Error al cargar unidades:', error);
      const producto = productos.find(p => p.id === productoId);
      if (producto?.unidad_medida_id) {
        const unidadFallback = unidadesMedida.find(u => u.id === producto.unidad_medida_id);
        if (unidadFallback) {
          const fallback = [{
            unidad_destino_id: unidadFallback.id,
            unidad_destino_nombre: unidadFallback.nombre,
            unidad_destino_simbolo: unidadFallback.simbolo,
            tiene_factor: true,
            es_original: true
          }];
          setUnidadesCompatibles(prev => ({ ...prev, [index]: fallback }));
          return fallback;
        }
      }
      return [];
    }
  }, [productos, unidadesMedida]);

  // ✅ Calcular subtotal con conversión en tiempo real
  const calcularSubtotalConConversion = useCallback(async (index, detalleActual) => {
    const cantidad = parseFloat(detalleActual.cantidad) || 0;
    const precioUnitario = parseFloat(detalleActual.precio_unitario) || 0;
    
    if (cantidad === 0 || precioUnitario === 0) return 0;

    const producto = productos.find(p => p.id === parseInt(detalleActual.producto_inventario_id));
    if (!producto) return cantidad * precioUnitario;

    const unidadIngresada = parseInt(detalleActual.unidad_medida_id);
    const unidadOriginal = producto.unidad_medida_id;

    // Si es la misma unidad, cálculo directo
    if (unidadIngresada === unidadOriginal) {
      return cantidad * precioUnitario;
    }

    // Intentar conversión
    try {
      const resultado = await conversionApi.convertirCantidad({
        cantidad: cantidad,
        unidad_origen_id: unidadIngresada,
        unidad_destino_id: unidadOriginal
      });

      const cantidadConvertida = resultado.cantidad_convertida;
      const subtotal = cantidadConvertida * precioUnitario;
      
      console.log(`💰 Subtotal: ${cantidad} ${detalleActual.unidad_medida} → ${cantidadConvertida.toFixed(4)} × $${precioUnitario} = $${subtotal.toFixed(2)}`);
      
      return subtotal;
    } catch (error) {
      console.warn('⚠️ Sin conversión, usando cálculo directo');
      return cantidad * precioUnitario;
    }
  }, [productos]);

  // ✅ Seleccionar producto
  const handleSeleccionarProducto = useCallback(async (index, producto) => {
    console.log(`🎯 Seleccionando producto:`, producto);
    
    const precio = producto.precio_ultima_compra || producto.precio_compra || 0;
    let unidadTexto = 'unidad';
    
    if (producto.unidadMedida) {
      unidadTexto = producto.unidadMedida.simbolo || producto.unidadMedida.nombre || 'unidad';
    }

    const unidadesDisponibles = await cargarUnidadesCompatibles(index, producto.id);
    
    const nuevoDetalle = {
      producto_inventario_id: String(producto.id),
      unidad_medida_id: String(producto.unidad_medida_id),
      precio_unitario: String(precio),
      unidad_medida: unidadTexto,
      cantidad: '',
      subtotal: 0
    };

    setDetalles(prev => {
      const nuevos = [...prev];
      nuevos[index] = nuevoDetalle;
      return nuevos;
    });
    
    setBusquedaProducto(prev => ({ ...prev, [index]: '' }));
    setMostrarSugerencias(prev => ({ ...prev, [index]: false }));
    
    setTimeout(() => {
      const cantidadInput = document.getElementById(`cantidad-${index}`);
      if (cantidadInput) {
        cantidadInput.focus();
        cantidadInput.select();
      }
    }, 100);
  }, [cargarUnidadesCompatibles]);

  // ✅ Actualizar detalle con cálculo en tiempo real
  const handleDetalleChange = useCallback(async (index, field, value) => {
    setDetalles(prev => {
      const nuevos = [...prev];
      nuevos[index] = { ...nuevos[index], [field]: value };
      
      if (field === 'cantidad' || field === 'precio_unitario') {
        const detalleActualizado = nuevos[index];
        
        calcularSubtotalConConversion(index, detalleActualizado).then(subtotal => {
          setDetalles(prevDetalles => {
            const actualizados = [...prevDetalles];
            if (actualizados[index]) {
              actualizados[index].subtotal = subtotal;
            }
            return actualizados;
          });
        });
      }
      
      return nuevos;
    });
  }, [calcularSubtotalConConversion]);

  // ✅ Actualizar unidad y recalcular subtotal
  const handleUnidadChange = useCallback(async (index, nuevaUnidadId) => {
    const detalle = detalles[index];
    const nuevaUnidad = unidadesMedida.find(u => u.id === parseInt(nuevaUnidadId));
    
    const unidadSeleccionada = unidadesCompatibles[index]?.find(
      u => u.unidad_destino_id === parseInt(nuevaUnidadId)
    );

    if (unidadSeleccionada && !unidadSeleccionada.tiene_factor) {
      alert(
        `⚠️ No existe factor de conversión entre estas unidades.\n\n` +
        `El costo se calculará correctamente al guardar la receta.`
      );
    }

    const detalleActualizado = {
      ...detalle,
      unidad_medida_id: nuevaUnidadId,
      unidad_medida: nuevaUnidad?.simbolo || 'unidad'
    };

    const subtotal = await calcularSubtotalConConversion(index, detalleActualizado);
    
    setDetalles(prev => {
      const nuevos = [...prev];
      nuevos[index] = { ...detalleActualizado, subtotal };
      return nuevos;
    });
  }, [detalles, unidadesMedida, unidadesCompatibles, calcularSubtotalConConversion]);

  const handleBusquedaProducto = (index, valor) => {
    setBusquedaProducto(prev => ({ ...prev, [index]: valor }));
    
    if (valor.trim()) {
      const termino = valor.toLowerCase();
      const filtrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(termino) ||
        String(p.id).includes(termino)
      ).slice(0, 10);
      setProductosFiltrados(prev => ({ ...prev, [index]: filtrados }));
      setMostrarSugerencias(prev => ({ ...prev, [index]: true }));
    } else {
      setProductosFiltrados(prev => ({ ...prev, [index]: [] }));
      setMostrarSugerencias(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleAddDetalle = () => {
    setDetalles(prev => [...prev, {
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
    setDetalles(prev => prev.filter((_, i) => i !== index));
    setBusquedaProducto(prev => {
      const { [index]: _, ...rest } = prev;
      return rest;
    });
    setMostrarSugerencias(prev => {
      const { [index]: _, ...rest } = prev;
      return rest;
    });
    setUnidadesCompatibles(prev => {
      const { [index]: _, ...rest } = prev;
      return rest;
    });
  };

  const getProductoNombre = (productoId) => {
    if (!productoId) return 'Seleccionar ingrediente';
    const producto = productos.find(p => p.id === parseInt(productoId));
    if (!producto) return 'Ingrediente no encontrado';
    
    const unidadTexto = producto.unidadMedida?.simbolo || producto.unidadMedida?.nombre || 'unidad';
    return `${producto.nombre} (${unidadTexto})`;
  };

  const handleKeyDown = (e, index, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'cantidad') {
        const unidadSelect = document.getElementById(`unidad-${index}`);
        if (unidadSelect) unidadSelect.focus();
      } else if (field === 'unidad') {
        if (index === detalles.length - 1) {
          handleAddDetalle();
          setTimeout(() => {
            const nextSearch = document.getElementById(`busqueda-${index + 1}`);
            if (nextSearch) nextSearch.focus();
          }, 100);
        } else {
          const nextSearch = document.getElementById(`busqueda-${index + 1}`);
          if (nextSearch) nextSearch.focus();
        }
      }
    }
  };

  const handleVolver = () => {
    if (onVolver) onVolver();
    else if (onClose) onClose();
    else navigate('/inventario/recetas-producto-inventario');
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
    
    const detallesValidos = detalles.filter(d => 
      d.producto_inventario_id && 
      parseFloat(d.cantidad) > 0 && 
      parseFloat(d.precio_unitario) > 0 &&
      d.unidad_medida_id
    );
    
    if (detallesValidos.length === 0) {
      alert('⚠️ Debes agregar al menos un ingrediente válido');
      return;
    }
    
    setLoading(true);
    
    try {
      let costoTotalCalculado = 0;
      const detallesConvertidos = [];

      for (const detalle of detallesValidos) {
        const producto = productos.find(p => p.id === parseInt(detalle.producto_inventario_id));
        const cantidadIngresada = parseFloat(detalle.cantidad);
        const precioUnitarioProducto = parseFloat(detalle.precio_unitario);
        const unidadIngresada = parseInt(detalle.unidad_medida_id);
        const unidadOriginal = producto.unidad_medida_id;

        let cantidadConvertida = cantidadIngresada;
        
        if (unidadIngresada !== unidadOriginal) {
          try {
            const resultado = await conversionApi.convertirCantidad({
              cantidad: cantidadIngresada,
              unidad_origen_id: unidadIngresada,
              unidad_destino_id: unidadOriginal
            });
            cantidadConvertida = resultado.cantidad_convertida;
          } catch (error) {
            console.warn('⚠️ No se pudo convertir, usando cantidad original:', error);
          }
        }

        const subtotal = cantidadConvertida * precioUnitarioProducto;
        costoTotalCalculado += subtotal;

        detallesConvertidos.push({
          producto_inventario_id: parseInt(detalle.producto_inventario_id),
          cantidad: cantidadIngresada,
          precio_unitario: precioUnitarioProducto,
          subtotal: subtotal,
          unidad_medida_id: parseInt(detalle.unidad_medida_id),
          unidad_medida: detalle.unidad_medida.trim()
        });
      }

      const recetaData = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        unidad_medida_id: parseInt(unidadMedidaId),
        categoria: categoria || null,
        subcategoria: subcategoria || null,
        costo_unitario: costoTotalCalculado,
        precio_venta: 0,
        activo: true,
        detalles: detallesConvertidos
      };

      console.log('📤 Guardando receta:', recetaData);
      
      if (onSave) {
        await onSave(recetaData);
      } else if (esEdicion) {
        await inventarioApi.actualizarRecetaProductoInventario(recetaProp.id, recetaData);
        alert('✅ Receta actualizada correctamente');
      } else {
        await inventarioApi.crearRecetaProductoInventario(recetaData);
        alert('✅ Receta creada correctamente');
      }
      
      handleVolver();
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

  // ✅ Mostrar indicador de carga mientras se cargan los detalles
  if (cargandoDetalles) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando datos de la receta...</p>
        </div>
      </div>
    );
  }

  const costoTotal = detalles.reduce((sum, d) => sum + (d.subtotal || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-slate-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <button
                onClick={handleVolver}
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
                  <h1 className="text-2xl font-bold text-gray-900">
                    {esEdicion ? 'Editar Receta' : 'Nueva Receta de Producto'}
                  </h1>
                  <p className="text-sm text-gray-500">Productos compuestos para inventario</p>
                </div>
              </div>
            </div>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Ej: Salsa Bolognesa"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Categoría</label>
              <input
                type="text"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Ej: Salsas"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Subcategoría</label>
              <input
                type="text"
                value={subcategoria}
                onChange={(e) => setSubcategoria(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Ej: Caseras"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                rows="2"
                placeholder="Descripción opcional"
              />
            </div>
          </div>

          {/* Ingredientes */}
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
                Agregar
              </button>
            </div>

            <div className="space-y-4">
              {detalles.map((detalle, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-12 gap-3 items-end">
                    {/* Búsqueda */}
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
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                          placeholder="Buscar por nombre..."
                          readOnly={!!detalle.producto_inventario_id}
                        />
                        {detalle.producto_inventario_id && (
                          <button
                            type="button"
                            onClick={() => {
                              setDetalles(prev => {
                                const nuevos = [...prev];
                                nuevos[index] = {
                                  producto_inventario_id: '',
                                  cantidad: '',
                                  precio_unitario: '',
                                  unidad_medida_id: '',
                                  unidad_medida: '',
                                  subtotal: 0
                                };
                                return nuevos;
                              });
                              setBusquedaProducto(prev => ({ ...prev, [index]: '' }));
                              setUnidadesCompatibles(prev => {
                                const { [index]: _, ...rest } = prev;
                                return rest;
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
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                          {productosFiltrados[index].map(producto => (
                            <button
                              key={producto.id}
                              type="button"
                              onClick={() => handleSeleccionarProducto(index, producto)}
                              className="w-full text-left px-3 py-2 hover:bg-green-50 border-b last:border-b-0"
                            >
                              <div className="font-semibold text-sm">{producto.nombre}</div>
                              <div className="text-xs text-gray-500">
                                {producto.unidadMedida?.simbolo || 'unidad'} - ${producto.precio_ultima_compra || 0}
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                        placeholder="0.00"
                        min="0.01"
                        required
                      />
                    </div>
                    
                    {/* Unidad */}
                    <div className="col-span-6 md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Unidad <span className="text-red-500">*</span>
                      </label>
                      {unidadesCompatibles[index] && unidadesCompatibles[index].length > 0 ? (
                        <select
                          id={`unidad-${index}`}
                          value={detalle.unidad_medida_id || ''}
                          onChange={(e) => handleUnidadChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, index, 'unidad')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                          required
                        >
                          <option value="">Seleccionar</option>
                          {unidadesCompatibles[index].map(unidad => (
                            <option key={unidad.unidad_destino_id} value={unidad.unidad_destino_id}>
                              {unidad.es_original && '★ '}
                              {unidad.unidad_destino_simbolo}
                              {!unidad.tiene_factor && !unidad.es_original && ' ⚠️'}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-yellow-50 text-sm text-yellow-700 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          <span>Seleccione producto</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Precio (readonly) */}
                    <div className="col-span-6 md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Precio
                      </label>
                      <div className="relative">
                        <DollarSign className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={detalle.precio_unitario ? `${parseFloat(detalle.precio_unitario).toFixed(2)}` : '$0.00'}
                          className="w-full pl-8 px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-sm text-gray-600"
                          readOnly
                          title="Precio unitario del producto en su unidad original"
                        />
                      </div>
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

                  {/* Subtotal con conversión en tiempo real */}
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        {detalle.cantidad && detalle.unidad_medida && (
                          <span>
                            {parseFloat(detalle.cantidad).toFixed(2)} {detalle.unidad_medida}
                            {detalle.unidad_medida_id && productos.find(p => p.id === parseInt(detalle.producto_inventario_id))?.unidad_medida_id !== parseInt(detalle.unidad_medida_id) && (
                              <span className="text-green-600 ml-2">
                                ✓ Con conversión
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-500">Subtotal: </span>
                        <span className="font-semibold text-gray-900 text-lg">
                          ${(detalle.subtotal || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen */}
          <div className="border-t pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  Costo total: ${costoTotal.toFixed(2)}
                </div>
                <div className="text-xs text-green-600 font-normal mt-1 flex items-center gap-1">
                  <span>✓</span>
                  <span>Calculado con conversiones en tiempo real</span>
                </div>
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
                      <span>{esEdicion ? 'Actualizar' : 'Crear Receta'}</span>
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
                  <li>• Costo total: ${costoTotal.toFixed(2)}</li>
                </ul>
                <p className="text-xs text-amber-600 mt-2">
                  * Las conversiones de unidades se han calculado automáticamente
                </p>
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
