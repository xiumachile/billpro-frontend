import React, { useState, useEffect } from 'react';
import { X, Plus, Save, Calculator, Printer, DollarSign, Star } from 'lucide-react';
import { menuApi } from '../../api/menuApi'; // ✅ Importar API

export default function CrearComboModal({
  isOpen,
  onClose,
  onSave,
  comboEdicion = null,
  productos = [],
  tipoPrecioCartaId = 1 // ✅ Recibir ID de precio de la carta actual
}) {
  const isEditing = Boolean(comboEdicion);

  // Estados principales
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  
  // ✅ ESTADOS DE PRECIOS
  const [tiposPrecio, setTiposPrecio] = useState([]); 
  const [listaPrecios, setListaPrecios] = useState({}); 
  const [precio, setPrecio] = useState(''); // Precio visual principal

  // ✅ ESTADO PARA ZONA DE IMPRESIÓN
  const [zonaImpresion, setZonaImpresion] = useState('');
  const [impresoras, setImpresoras] = useState([]);

  const [opcionImpresion, setOpcionImpresion] = useState('nombre');
  const [activo, setActivo] = useState(true);

  // Estados para productos del combo
  const [productosCombo, setProductosCombo] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [cantidadProducto, setCantidadProducto] = useState(1);

  const [cargandoDatos, setCargandoDatos] = useState(false);

  // ✅ CARGAR DATOS INICIALES (Impresoras y Precios)
  useEffect(() => {
    if (isOpen) {
      cargarDatosAuxiliares();
    }
  }, [isOpen]);

  const cargarDatosAuxiliares = async () => {
    setCargandoDatos(true);
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
          
          if (!isEditing) {
              const inicial = {};
              data.forEach(t => inicial[t.id] = '');
              setListaPrecios(inicial);
          }
      }
    } catch (error) {
      console.error("Error cargando datos auxiliares", error);
    } finally {
      setCargandoDatos(false);
    }
  };

  // CARGAR EDICIÓN
  useEffect(() => {
    if (isOpen && isEditing && comboEdicion) {
      setNombre(comboEdicion.nombre || '');
      setDescripcion(comboEdicion.descripcion || '');
      setZonaImpresion(comboEdicion.zona_impresion || ''); 
      setOpcionImpresion(comboEdicion.opcion_impresion || 'nombre');
      setActivo(comboEdicion.activo !== false);

      // ✅ CARGAR PRECIOS
      const preciosMap = {};
      preciosMap[1] = comboEdicion.precio; // Precio base siempre ID 1
      
      // Asumimos que el backend envía 'precios' si es que implementaste la relación en Combo.php
      // Si no, solo cargará el precio base, lo cual es seguro.
      if (comboEdicion.precios && Array.isArray(comboEdicion.precios)) {
          comboEdicion.precios.forEach(p => {
              preciosMap[p.tipo_precio_id] = p.precio;
          });
      }
      setListaPrecios(preciosMap);

      // Sincronizar precio visual con la carta actual
      const precioCartaActual = preciosMap[tipoPrecioCartaId] || comboEdicion.precio;
      setPrecio(String(precioCartaActual));

      // Cargar productos del combo
      if (comboEdicion.items && Array.isArray(comboEdicion.items)) {
        setProductosCombo(comboEdicion.items.map(item => ({
          id: item.id,
          producto_carta_id: item.producto_carta_id,
          cantidad: item.cantidad || 1,
          nombre_producto: item.nombre_producto || item.producto_carta?.nombre || 'Producto desconocido'
        })));
      } else if (comboEdicion.combo_items && Array.isArray(comboEdicion.combo_items)) {
        setProductosCombo(comboEdicion.combo_items.map(item => ({
          id: item.id,
          producto_carta_id: item.producto_carta_id,
          cantidad: item.cantidad || 1,
          nombre_producto: item.nombre_producto || item.producto_carta?.nombre || 'Producto desconocido'
        })));
      }
    } else if (isOpen && !isEditing) {
      // Reset
      setNombre(''); setDescripcion(''); setPrecio('');
      setZonaImpresion(''); setOpcionImpresion('nombre');
      setActivo(true); setProductosCombo([]); setProductoSeleccionado(''); setCantidadProducto(1);
      setListaPrecios({});
    }
  }, [isOpen, isEditing, comboEdicion, tipoPrecioCartaId]);

  // ✅ MANEJADOR DE PRECIOS
  const handlePrecioChange = (idTipo, valor) => {
      setListaPrecios(prev => ({ ...prev, [idTipo]: valor }));
      if (Number(idTipo) === Number(tipoPrecioCartaId)) setPrecio(valor);
      if (Number(idTipo) === 1 && !tipoPrecioCartaId) setPrecio(valor);
  };

  const handleAgregarProducto = () => {
    if (!productoSeleccionado) { return alert('⚠️ Selecciona un producto.'); }
    if (cantidadProducto <= 0) { return alert('⚠️ La cantidad debe ser mayor a 0.'); }

    const productoExistente = productosCombo.find(p => p.producto_carta_id == productoSeleccionado);
    if (productoExistente) { return alert('⚠️ Este producto ya está en el combo.'); }

    const producto = productos.find(p => p.id == productoSeleccionado);
    const nuevoProducto = {
      producto_carta_id: parseInt(productoSeleccionado, 10),
      cantidad: parseInt(cantidadProducto, 10),
      nombre_producto: producto?.nombre || 'Producto desconocido'
    };

    setProductosCombo(prev => [...prev, nuevoProducto]);
    setProductoSeleccionado('');
    setCantidadProducto(1);
  };

  const handleEliminarProducto = (index) => {
    setProductosCombo(prev => prev.filter((_, i) => i !== index));
  };

  const calcularPrecioTotal = () => {
    if (productosCombo.length === 0) return 0;
    return productosCombo.reduce((total, item) => {
      const producto = productos.find(p => p.id == item.producto_carta_id);
      const precioProducto = producto?.precio_venta || 0;
      return total + (precioProducto * item.cantidad);
    }, 0);
  };

  const handleGuardar = async () => {
    if (!nombre.trim()) return alert('⚠️ El nombre del combo es obligatorio.');
    
    // Validar precio base o actual
    const precioBase = parseFloat(listaPrecios[1]);
    const precioActual = parseFloat(precio);
    
    if ((isNaN(precioBase) || precioBase < 0) && (isNaN(precioActual) || precioActual < 0)) {
        return alert('⚠️ Ingresa un precio válido (Base o Carta Actual).');
    }

    if (productosCombo.length === 0) return alert('⚠️ Agrega al menos un producto al combo.');

    const datosAGuardar = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || null,
      
      // ✅ Precio base para compatibilidad
      precio: precioBase || precioActual || 0,

      // ✅ Lista de precios para backend
      precios_lista: Object.entries(listaPrecios).map(([id, val]) => ({
          tipo_precio_id: parseInt(id),
          precio: parseFloat(val || 0)
      })),

      zona_impresion: zonaImpresion || null,
      opcion_impresion: opcionImpresion,
      activo: activo,
      items: productosCombo
    };

    try {
      await onSave(datosAGuardar, isEditing ? comboEdicion.id : undefined);
      onClose();
    } catch (error) {
      console.error('Error al guardar combo:', error);
      alert('❌ Error al guardar: ' + (error.message || 'Verifica la consola'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 rounded-t-2xl flex justify-between items-center text-white">
            <h3 className="text-xl font-bold flex items-center gap-2">
              {isEditing ? 'Editar Combo' : '📦 Crear Nuevo Combo'}
            </h3>
            <button onClick={onClose} className="text-white hover:text-gray-200"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          
          {/* CAMPOS GENERALES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" placeholder="Ej: Combo Familiar" autoFocus/>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" rows="2" placeholder="Descripción del combo..."/>
            </div>
            
            {/* ✅ SECCIÓN PRECIOS MÚLTIPLES */}
            <div className="md:col-span-2 bg-purple-50 p-4 rounded-xl border border-purple-200">
                <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <DollarSign size={16} className="text-green-600"/> Precios de Venta
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {tiposPrecio.map(tp => {
                        const esPrecioActivo = Number(tp.id) === Number(tipoPrecioCartaId);
                        return (
                            <div key={tp.id} className={`relative ${esPrecioActivo ? 'order-first sm:order-none' : ''}`}>
                                <label className={`text-xs font-bold uppercase mb-1 block ${esPrecioActivo ? 'text-purple-700' : 'text-gray-500'}`}>{tp.nombre}</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                                    <input type="number" className={`w-full pl-6 pr-3 py-2 border rounded-lg outline-none transition-all ${esPrecioActivo ? 'border-purple-500 ring-2 ring-purple-100 bg-white font-bold text-gray-900' : 'border-gray-300 bg-white text-gray-600 focus:border-purple-400'}`} placeholder="0" value={listaPrecios[tp.id] || ''} onChange={e => handlePrecioChange(tp.id, e.target.value)}/>
                                    {esPrecioActivo && (<div className="absolute -top-8 right-0 bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1"><Star size={10} fill="white"/> Carta Actual</div>)}
                                </div>
                            </div>
                        );
                    })}
                </div>
                {productosCombo.length > 0 && <p className="text-xs text-gray-500 mt-3 text-right">Suma de productos base: ${calcularPrecioTotal().toLocaleString()}</p>}
            </div>

            {/* SELECTOR ZONA IMPRESIÓN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Printer size={14}/> Zona de Impresión
              </label>
              <select value={zonaImpresion} onChange={(e) => setZonaImpresion(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white">
                <option value="">-- Sin Impresión --</option>
                {impresoras.length === 0 && <option value="Cocina">Cocina (Default)</option>}
                {impresoras.map(imp => (
                    <option key={imp.id} value={imp.nombre}>{imp.nombre} ({imp.tipo_impresora})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Opción de Impresión</label>
              <select value={opcionImpresion} onChange={(e) => setOpcionImpresion(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                <option value="nombre">Solo nombre</option>
                <option value="nombre+contenido">Nombre + contenido</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded text-purple-600" checked={activo} onChange={(e) => setActivo(e.target.checked)}/>
                <span className="ml-2 text-sm font-medium text-gray-700">Combo Activo</span>
              </label>
            </div>
          </div>

          {/* LISTA DE PRODUCTOS DEL COMBO */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h4 className="text-md font-semibold text-gray-800 flex items-center"><Calculator className="w-4 h-4 mr-2" /> Productos del Combo</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end p-3 bg-white rounded-lg border border-gray-300">
              <div className="md:col-span-6">
                <label className="text-xs font-medium">Producto *</label>
                <select value={productoSeleccionado} onChange={(e) => setProductoSeleccionado(e.target.value)} className="w-full text-sm border p-2 rounded">
                  <option value="">Seleccionar...</option>
                  {productos.map((producto) => <option key={producto.id} value={producto.id}>{producto.nombre} - ${producto.precio_venta}</option>)}
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="text-xs font-medium">Cant. *</label>
                <input type="number" min="1" value={cantidadProducto} onChange={(e) => setCantidadProducto(parseInt(e.target.value) || 1)} className="w-full text-sm border p-2 rounded"/>
              </div>
              <div className="md:col-span-3">
                <button type="button" onClick={handleAgregarProducto} disabled={!productoSeleccionado || cantidadProducto <= 0} className="w-full px-2 py-2 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 disabled:opacity-50"><Plus className="w-4 h-4 inline mr-1"/> Agregar</button>
              </div>
            </div>

            {productosCombo.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 bg-white">
                  <thead className="bg-gray-100"><tr><th className="p-2 text-left">Producto</th><th className="p-2">Cant.</th><th className="p-2 text-right"></th></tr></thead>
                  <tbody>
                    {productosCombo.map((prod, index) => (
                      <tr key={index} className="border-t hover:bg-gray-50">
                        <td className="p-2 text-sm">{prod.nombre_producto}</td>
                        <td className="p-2 text-sm text-center">{prod.cantidad}</td>
                        <td className="p-2 text-right"><button onClick={() => handleEliminarProducto(index)} className="text-red-500 hover:text-red-700">🗑️</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div className="text-center py-4 text-gray-400 text-sm italic">Sin productos añadidos.</div>}
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-2xl border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-200">Cancelar</button>
          <button type="button" onClick={handleGuardar} disabled={cargandoDatos} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg flex items-center"><Save className="w-4 h-4 mr-2"/> <span>{isEditing ? 'Actualizar' : 'Crear'} Combo</span></button>
        </div>
      </div>
    </div>
  );
}
