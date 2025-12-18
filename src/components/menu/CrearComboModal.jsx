import React, { useState, useEffect } from 'react';
import { X, Plus, Save, Calculator, Printer } from 'lucide-react';
import { menuApi } from '../../api/menuApi'; // ✅ Importar API

export default function CrearComboModal({
  isOpen,
  onClose,
  onSave,
  comboEdicion = null,
  productos = []
}) {
  const isEditing = Boolean(comboEdicion);

  // Estados principales
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  
  // ✅ ESTADO PARA ZONA DE IMPRESIÓN
  const [zonaImpresion, setZonaImpresion] = useState('');
  const [impresoras, setImpresoras] = useState([]); // Lista cargada de la BD

  const [opcionImpresion, setOpcionImpresion] = useState('nombre');
  const [activo, setActivo] = useState(true);

  // Estados para productos del combo
  const [productosCombo, setProductosCombo] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [cantidadProducto, setCantidadProducto] = useState(1);

  // ✅ CARGAR IMPRESORAS AL ABRIR
  useEffect(() => {
    if (isOpen) {
      cargarImpresoras();
    }
  }, [isOpen]);

  const cargarImpresoras = async () => {
    try {
      const res = await menuApi.getImpresoras();
      const data = Array.isArray(res) ? res : (res.data || []);
      // Filtramos solo las activas
      setImpresoras(data.filter(i => i.estado === 'Activa'));
    } catch (error) {
      console.error("Error cargando impresoras", error);
    }
  };

  // Cargar datos de edición
  useEffect(() => {
    if (isOpen && isEditing && comboEdicion) {
      setNombre(comboEdicion.nombre || '');
      setDescripcion(comboEdicion.descripcion || '');
      setPrecio(String(comboEdicion.precio || ''));
      setZonaImpresion(comboEdicion.zona_impresion || ''); // ✅ Cargar zona guardada
      setOpcionImpresion(comboEdicion.opcion_impresion || 'nombre');
      setActivo(comboEdicion.activo !== false);

      // Cargar productos del combo si existen
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
      // Reset para nuevo combo
      setNombre('');
      setDescripcion('');
      setPrecio('');
      setZonaImpresion('');
      setOpcionImpresion('nombre');
      setActivo(true);
      setProductosCombo([]);
      setProductoSeleccionado('');
      setCantidadProducto(1);
    }
  }, [isOpen, isEditing, comboEdicion]);

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
    
    const precioTotal = parseFloat(precio);
    if (isNaN(precioTotal) || precioTotal <= 0) return alert('⚠️ Ingresa un precio válido mayor a 0.');

    if (productosCombo.length === 0) return alert('⚠️ Agrega al menos un producto al combo.');

    const datosAGuardar = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || null,
      precio: precioTotal,
      zona_impresion: zonaImpresion || null, // ✅ Guardar impresora seleccionada
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio *</label>
              <input type="number" step="0.01" value={precio} onChange={(e) => setPrecio(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-bold" placeholder="0.00"/>
              {productosCombo.length > 0 && <p className="text-xs text-gray-500 mt-1">Suma productos: ${calcularPrecioTotal().toFixed(2)}</p>}
            </div>

            {/* ✅ SELECTOR DE ZONA DE IMPRESIÓN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Printer size={14}/> Zona de Impresión
              </label>
              <select value={zonaImpresion} onChange={(e) => setZonaImpresion(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white">
                <option value="">-- Sin Impresión --</option>
                {/* Opciones por defecto */}
                <option value="cocina">Cocina (Default)</option>
                <option value="barra">Barra</option>
                {/* Opciones dinámicas de la BD */}
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
          <button type="button" onClick={handleGuardar} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg flex items-center"><Save className="w-4 h-4 mr-2"/> <span>{isEditing ? 'Actualizar' : 'Crear'} Combo</span></button>
        </div>
      </div>
    </div>
  );
}
