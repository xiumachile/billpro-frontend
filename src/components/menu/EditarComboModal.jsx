import React, { useState, useEffect } from 'react';
import { X, Save, Package, AlertCircle, Plus, Trash2, Printer, DollarSign, Star } from 'lucide-react';
import { menuApi } from '../../api/menuApi';

export default function EditarComboModal({
  isOpen,
  onClose,
  combo,
  productos = [],
  onSave,
  tipoPrecioCartaId = 1 // ✅ Recibimos el ID de la lista de precios de la carta
}) {
  // Estados principales
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [activo, setActivo] = useState(true);
  const [items, setItems] = useState([]);
  
  // ✅ ESTADOS DE PRECIOS
  const [tiposPrecio, setTiposPrecio] = useState([]); 
  const [listaPrecios, setListaPrecios] = useState({}); 
  const [precio, setPrecio] = useState(''); // Precio visual principal (Base o Carta Actual)

  // Estados impresión
  const [zonaImpresion, setZonaImpresion] = useState('');
  const [opcionImpresion, setOpcionImpresion] = useState('nombre');
  const [impresoras, setImpresoras] = useState([]); 

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. CARGAR DATOS AUXILIARES (Precios e Impresoras)
  useEffect(() => {
    if (isOpen) {
      cargarDatosAuxiliares();
    }
  }, [isOpen]);

  const cargarDatosAuxiliares = async () => {
    try {
      const [impresorasRes, preciosRes] = await Promise.allSettled([
          menuApi.getImpresoras(),
          menuApi.getTiposPrecios()
      ]);

      if (impresorasRes.status === 'fulfilled') {
          const data = Array.isArray(impresorasRes.value) ? impresorasRes.value : (impresorasRes.value?.data || []);
          setImpresoras(data.filter(i => i.estado === 'Activa'));
      }

      if (preciosRes.status === 'fulfilled') {
          const data = Array.isArray(preciosRes.value) ? preciosRes.value : (preciosRes.value?.data || []);
          setTiposPrecio(data);
      }
    } catch (error) {
      console.error("Error cargando datos auxiliares", error);
    }
  };

  // 2. CARGAR DATOS DEL COMBO A EDITAR
  useEffect(() => {
    if (combo && isOpen) {
      setNombre(combo.nombre || '');
      setDescripcion(combo.descripcion || '');
      setActivo(combo.activo !== false);
      
      setZonaImpresion(combo.zona_impresion || ''); 
      setOpcionImpresion(combo.opcion_impresion || 'nombre');

      // ✅ CARGAR PRECIOS
      const preciosMap = {};
      preciosMap[1] = combo.precio; // Precio base siempre es ID 1 por defecto
      
      // Si el combo ya tiene precios guardados en la tabla pivote
      if (combo.precios && Array.isArray(combo.precios)) {
          combo.precios.forEach(p => {
              preciosMap[p.tipo_precio_id] = p.precio;
          });
      }
      setListaPrecios(preciosMap);

      // ✅ SINCRONIZAR PRECIO VISUAL
      // Si existe precio para la carta actual, lo mostramos. Si no, mostramos el base.
      const precioCartaActual = preciosMap[Number(tipoPrecioCartaId)] || combo.precio;
      setPrecio(String(precioCartaActual));

      // Cargar Items del Combo
      const itemsCargados = (combo.items || []).map(item => ({
        id: item.id || Math.random(),
        producto_carta_id: item.producto_carta_id || item.producto_carta?.id || null,
        cantidad: item.cantidad || 1
      }));
      setItems(itemsCargados);
    }
  }, [combo, isOpen, tipoPrecioCartaId]);

  // ✅ MANEJADOR DE CAMBIO DE PRECIOS
  const handlePrecioChange = (idTipo, valor) => {
      setListaPrecios(prev => ({ ...prev, [idTipo]: valor }));
      
      // Si estamos editando el precio de la carta actual, actualizamos la variable local también
      if (Number(idTipo) === Number(tipoPrecioCartaId)) {
          setPrecio(valor);
      }
      // Si editamos el precio base (1) y no hay carta específica seleccionada
      if (Number(idTipo) === 1 && (!tipoPrecioCartaId || Number(tipoPrecioCartaId) === 1)) {
          setPrecio(valor);
      }
  };

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), producto_carta_id: null, cantidad: 1 }]);
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleProductoChange = (id, productoId) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, producto_carta_id: productoId || null } : item
    ));
  };

  const handleCantidadChange = (id, cantidad) => {
    const num = parseInt(cantidad);
    setItems(items.map(item =>
      item.id === id ? { ...item, cantidad: isNaN(num) ? 1 : Math.max(1, num) } : item
    ));
  };

  const calcularPrecioTotal = () => {
    if (items.length === 0) return 0;
    return items.reduce((total, item) => {
      const producto = productos.find(p => p.id == item.producto_carta_id);
      const precioProducto = producto?.precio_venta || 0;
      return total + (precioProducto * item.cantidad);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!nombre.trim()) { setError('El nombre es obligatorio'); return; }
    if (items.length === 0) { setError('El combo debe tener al menos un producto'); return; }
    if (items.some(item => !item.producto_carta_id)) { setError('Todos los productos deben estar seleccionados'); return; }

    // Validar precios
    const precioBase = parseFloat(listaPrecios[1]);
    const precioActual = parseFloat(precio);
    
    if ((isNaN(precioBase) || precioBase < 0) && (isNaN(precioActual) || precioActual < 0)) {
        setError('Debes definir al menos el Precio Base.');
        return;
    }

    const datos = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || null,
      
      // Precio base para compatibilidad
      precio: precioBase || precioActual || 0,
      
      // ✅ LISTA DE PRECIOS COMPLETA
      precios_lista: Object.entries(listaPrecios).map(([id, val]) => ({
          tipo_precio_id: parseInt(id),
          precio: parseFloat(val || 0)
      })),
      
      zona_impresion: zonaImpresion || null,
      opcion_impresion: opcionImpresion,
      activo,
      items: items.map(item => ({
        producto_carta_id: parseInt(item.producto_carta_id),
        cantidad: parseInt(item.cantidad)
      }))
    };

    try {
      setLoading(true);
      await onSave(combo.id, datos);
      onClose();
    } catch (err) {
      console.error('❌ Error completo al editar combo:', err);
      if (err.messages) {
        const mensajesDetallados = Object.entries(err.messages)
          .map(([campo, errores]) => `${campo}: ${errores.join(', ')}`)
          .join('\n');
        setError(`Errores de validación:\n${mensajesDetallados}`);
      } else {
        setError(err.message || 'Error al actualizar el combo');
      }
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000] p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl flex flex-col">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 rounded-t-2xl flex justify-between items-center text-white">
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold">Editar Combo</h3>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* BODY SCROLLABLE */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* MENSAJES DE ERROR */}
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-start gap-2 border border-red-200">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <pre className="text-xs whitespace-pre-wrap font-sans">{error}</pre>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* NOMBRE */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  required
                />
              </div>

              {/* ✅ SECCIÓN PRECIOS MÚLTIPLES */}
              <div className="md:col-span-2 bg-purple-50 p-4 rounded-xl border border-purple-200">
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <DollarSign size={16} className="text-purple-600"/> Precios de Venta
                  </label>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {tiposPrecio.map(tp => {
                          // Verificar si es el precio de la carta activa
                          const esPrecioActivo = Number(tp.id) === Number(tipoPrecioCartaId);
                          
                          return (
                              <div key={tp.id} className={`relative ${esPrecioActivo ? 'order-first sm:order-none' : ''}`}>
                                  <label className={`text-xs font-bold uppercase mb-1 block ${esPrecioActivo ? 'text-purple-700' : 'text-gray-500'}`}>
                                      {tp.nombre}
                                  </label>
                                  <div className="relative">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                                      <input 
                                          type="number" 
                                          className={`w-full pl-6 pr-3 py-2 border rounded-lg outline-none transition-all 
                                            ${esPrecioActivo 
                                                ? 'border-purple-500 ring-2 ring-purple-100 bg-white font-bold text-gray-900' 
                                                : 'border-gray-300 bg-white text-gray-600 focus:border-purple-400'
                                            }`} 
                                          placeholder="0" 
                                          value={listaPrecios[tp.id] || ''} 
                                          onChange={e => handlePrecioChange(tp.id, e.target.value)}
                                      />
                                      {esPrecioActivo && (
                                          <div className="absolute -top-3 right-0 bg-purple-600 text-white text-[9px] px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 z-10">
                                              <Star size={8} fill="white"/> Carta Actual
                                          </div>
                                      )}
                                  </div>
                              </div>
                          );
                      })}
                  </div>
                  
                  {/* Suma de referencia */}
                  {items.length > 0 && (
                      <p className="text-xs text-gray-500 mt-3 text-right font-medium">
                          Suma precios base de productos: <span className="text-gray-800 font-bold">${calcularPrecioTotal().toLocaleString()}</span>
                      </p>
                  )}
              </div>

              {/* SELECTOR ZONA IMPRESIÓN */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
                    <Printer size={14}/> Zona de Impresión
                </label>
                <select 
                    value={zonaImpresion} 
                    onChange={(e) => setZonaImpresion(e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white outline-none"
                >
                  <option value="">-- Sin Impresión --</option>
                  {impresoras.length === 0 && <option value="Cocina">Cocina (Default)</option>}
                  {impresoras.map(imp => (
                      <option key={imp.id} value={imp.nombre}>{imp.nombre} ({imp.tipo_impresora})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Opción de Impresión</label>
                <select 
                    value={opcionImpresion} 
                    onChange={(e) => setOpcionImpresion(e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                >
                  <option value="nombre">Solo nombre</option>
                  <option value="nombre+contenido">Nombre + contenido</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
              <textarea
                rows={2}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none"
                placeholder="Ej: Incluye 2 hamburguesas, papas y bebida"
              />
            </div>

            {/* LISTA DE PRODUCTOS DEL COMBO */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-bold text-gray-700">Productos incluidos</label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-sm text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 bg-white px-3 py-1 rounded border border-blue-200 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Agregar Producto
                </button>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-6 text-gray-400 bg-white rounded-lg border border-dashed border-gray-300 text-sm">
                  Este combo aún no tiene productos.
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <select
                        value={item.producto_carta_id || ''}
                        onChange={(e) => handleProductoChange(item.id, e.target.value)}
                        className="flex-1 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm outline-none"
                      >
                        <option value="">-- Seleccionar producto --</option>
                        {productos.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.nombre} • ${p.precio_venta}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        value={item.cantidad}
                        onChange={(e) => handleCantidadChange(item.id, e.target.value)}
                        className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center text-sm font-bold"
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar del combo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CHECKBOX ACTIVO */}
            <div className="flex items-center gap-3 pt-2">
              <input
                id="activo-combo-edit"
                type="checkbox"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
              />
              <label htmlFor="activo-combo-edit" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                Combo habilitado para venta
              </label>
            </div>

            {/* FOOTER BOTONES */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Guardando...' : 'Actualizar Combo'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
