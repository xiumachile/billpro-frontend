import React, { useState, useEffect, useRef, useMemo } from 'react';
import { menuApi } from '../../api/menuApi';
import { 
  Package, Plus, X, Calculator, Save, ChevronDown, ChevronUp, Printer, Trash2, DollarSign, Star
} from 'lucide-react';

// Componente interno CategoriaSelector (Se mantiene igual)
const CategoriaSelector = ({ value, onChange, label, placeholder, allCategorias, setAllCategorias }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddOption, setShowAddOption] = useState(false);
  const inputRef = useRef(null);
  const filteredCategorias = allCategorias.filter(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()));
  const handleInputChange = (e) => { const value = e.target.value; onChange(value); setSearchTerm(value); if (value && !allCategorias.some(cat => cat.toLowerCase() === value.toLowerCase())) { setShowAddOption(true); } else { setShowAddOption(false); } };
  const handleSelect = (categoria) => { onChange(categoria); setSearchTerm(''); setShowAddOption(false); setIsOpen(false); };
  const handleAddNew = () => { if (searchTerm && !allCategorias.some(cat => cat.toLowerCase() === searchTerm.toLowerCase())) { setAllCategorias(prev => [...prev, searchTerm]); onChange(searchTerm); setSearchTerm(''); setShowAddOption(false); setIsOpen(false); } };
  const handleClickOutside = (e) => { if (inputRef.current && !inputRef.current.contains(e.target)) { setIsOpen(false); setShowAddOption(false); } };
  useEffect(() => { document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside); }, []);
  return ( <div className="relative" ref={inputRef}> <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label> <div className="relative"> <input type="text" value={value} onChange={handleInputChange} onFocus={() => setIsOpen(true)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder={placeholder} /> <button type="button" onClick={() => setIsOpen(!isOpen)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"> {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />} </button> </div> {isOpen && (searchTerm || filteredCategorias.length > 0) && ( <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto"> {filteredCategorias.map((cat, index) => ( <div key={index} onClick={() => handleSelect(cat)} className="px-4 py-2 hover:bg-blue-100 cursor-pointer border-b border-gray-100 last:border-b-0"> {cat} </div> ))} {showAddOption && ( <div onClick={handleAddNew} className="px-4 py-2 hover:bg-green-100 cursor-pointer text-green-700 font-medium border-t border-gray-200"> + Agregar "{searchTerm}" </div> )} </div> )} </div> );
};

export default function EditarProductoModal({ 
  isOpen, 
  onClose, 
  initialData, 
  onSave,
  tipoPrecioCartaId = 1 // ✅ Recibimos el ID de la lista de precios
}) {
  // Estados principales
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [subcategoria, setSubcategoria] = useState('');
  
  // ✅ ESTADOS DE PRECIOS
  const [tiposPrecio, setTiposPrecio] = useState([]); 
  const [listaPrecios, setListaPrecios] = useState({}); 
  const [precioVenta, setPrecioVenta] = useState('');

  const [zonaImpresion, setZonaImpresion] = useState(''); 
  const [esCompuesto, setEsCompuesto] = useState(false);
  const [activo, setActivo] = useState(true);

  // Estados específicos
  const [productoInventarioId, setProductoInventarioId] = useState('');
  const [ingredientes, setIngredientes] = useState([]);
  const [nuevoIngrediente, setNuevoIngrediente] = useState({ id_referencia: '', cantidad: 1, unidad_medida_id: '' });

  // Listas de datos
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [todosProductosInventario, setTodosProductosInventario] = useState([]);
  const [unidadesMedida, setUnidadesMedida] = useState([]);
  const [impresoras, setImpresoras] = useState([]);
  const [factoresConversion, setFactoresConversion] = useState([]);

  const [cargandoDatos, setCargandoDatos] = useState(false);

  // 1. CARGAR DATOS AL ABRIR
  useEffect(() => {
    if (isOpen) cargarDatosAuxiliares();
  }, [isOpen]);

  const cargarDatosAuxiliares = async () => {
    setCargandoDatos(true);
    try {
      const [productosRes, unidadesRes, catRes, subcatRes, impresorasRes, preciosRes, factoresRes] = await Promise.allSettled([
        menuApi.getTodosProductosParaRecetas(),
        menuApi.getUnidadesMedida(),
        menuApi.getCategorias(),
        menuApi.getSubcategorias(),
        menuApi.getImpresoras(),
        menuApi.getTiposPrecios(),
        menuApi.getFactoresConversion ? menuApi.getFactoresConversion() : Promise.resolve([])
      ]);

      if (productosRes.status === 'fulfilled') setTodosProductosInventario(Array.isArray(productosRes.value) ? productosRes.value : []);
      if (unidadesRes.status === 'fulfilled') setUnidadesMedida(Array.isArray(unidadesRes.value) ? unidadesRes.value : []);
      if (catRes.status === 'fulfilled') setCategorias(Array.isArray(catRes.value) ? catRes.value : []);
      if (subcatRes.status === 'fulfilled') setSubcategorias(Array.isArray(subcatRes.value) ? subcatRes.value : []);
      
      if (impresorasRes.status === 'fulfilled') {
          const data = impresorasRes.value;
          const lista = Array.isArray(data) ? data : (data.data || []);
          setImpresoras(lista.filter(i => i.estado === 'Activa'));
      }

      // ✅ Cargar tipos de precios
      if (preciosRes.status === 'fulfilled') {
          const data = Array.isArray(preciosRes.value) ? preciosRes.value : (preciosRes.value?.data || []);
          setTiposPrecio(data);
      }

      if (factoresRes.status === 'fulfilled') {
          const data = Array.isArray(factoresRes.value) ? factoresRes.value : (factoresRes.value?.data || []);
          setFactoresConversion(data);
      }

    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setCargandoDatos(false);
    }
  };

  // 2. CARGAR EDICIÓN
  useEffect(() => {
    if (!isOpen || !initialData) return;

    try {
      const esCompuestoEdit = Boolean(initialData.es_compuesto);

      setNombre(initialData.nombre || '');
      setDescripcion(initialData.descripcion || '');
      setCategoria(initialData.categoria || '');
      setSubcategoria(initialData.subcategoria || '');
      setZonaImpresion(initialData.zona_impresion || ''); 
      setEsCompuesto(esCompuestoEdit);
      setActivo(initialData.activo !== false);

      // ✅ CARGAR PRECIOS MULTIPLES
      const preciosMap = {};
      preciosMap[1] = initialData.precio_venta; // Base
      
      if (initialData.precios && Array.isArray(initialData.precios)) {
          initialData.precios.forEach(p => {
              preciosMap[p.tipo_precio_id] = p.precio;
          });
      }
      setListaPrecios(preciosMap);

      // Sincronizar precio visual con la carta actual
      const precioCartaActual = preciosMap[tipoPrecioCartaId] || initialData.precio_venta;
      setPrecioVenta(String(precioCartaActual));

      if (esCompuestoEdit) {
        let detallesReceta = null;
        if (initialData.receta_detalle?.detalles) detallesReceta = initialData.receta_detalle.detalles;
        else if (initialData.receta?.detalles) detallesReceta = initialData.receta.detalles;

        if (detallesReceta && Array.isArray(detallesReceta)) {
          const ingredientesMapeados = detallesReceta.map(item => ({
              id_referencia: String(item.producto_inventario_id || item.receta_producto_inventario_id),
              cantidad: parseFloat(item.cantidad) || 1,
              unidad_medida_id: String(item.unidad_medida_id || item.unidadMedida?.id || '')
          }));
          setIngredientes(ingredientesMapeados);
          setProductoInventarioId('');
        }
      } else {
        let invId = '';
        if (initialData.producto_inventario_detalle?.id) invId = String(initialData.producto_inventario_detalle.id);
        else if (initialData.producto_inventario_id) invId = String(initialData.producto_inventario_id);
        
        setProductoInventarioId(invId);
        setIngredientes([]);
      }

    } catch (err) {
      console.error('❌ Error cargando producto para editar:', err);
    }
  }, [isOpen, initialData, tipoPrecioCartaId]);

  // ✅ MANEJADOR DE PRECIOS
  const handlePrecioChange = (idTipo, valor) => {
      setListaPrecios(prev => ({ ...prev, [idTipo]: valor }));
      if (Number(idTipo) === Number(tipoPrecioCartaId)) setPrecioVenta(valor);
      if (Number(idTipo) === 1 && !tipoPrecioCartaId) setPrecioVenta(valor);
  };

  const getUnidadNombre = (id) => {
    const u = unidadesMedida.find(unit => unit.id == id);
    return u ? u.simbolo : '?';
  };

  const getInsumoData = (id) => {
    return todosProductosInventario.find(p => String(p.id) === String(id)) || {};
  };

  // ✅ LOGICA DE CONVERSIÓN DE UNIDADES
  const convertirCantidad = (cantidadReceta, idUnidadReceta, idUnidadInsumo) => {
      const cant = parseFloat(cantidadReceta) || 0;
      if (!idUnidadReceta || !idUnidadInsumo || String(idUnidadReceta) === String(idUnidadInsumo)) return cant;

      const factorDirecto = factoresConversion.find(f => String(f.unidad_origen_id) === String(idUnidadReceta) && String(f.unidad_destino_id) === String(idUnidadInsumo));
      if (factorDirecto) return cant * parseFloat(factorDirecto.factor);

      const factorInverso = factoresConversion.find(f => String(f.unidad_origen_id) === String(idUnidadInsumo) && String(f.unidad_destino_id) === String(idUnidadReceta));
      if (factorInverso) return cant / parseFloat(factorInverso.factor);

      const uReceta = unidadesMedida.find(u => String(u.id) === String(idUnidadReceta));
      const uInsumo = unidadesMedida.find(u => String(u.id) === String(idUnidadInsumo));

      if (uReceta && uInsumo) {
          const sRec = (uReceta.simbolo || '').toLowerCase().trim();
          const sIns = (uInsumo.simbolo || '').toLowerCase().trim();
          if (['g', 'gr'].some(x => x === sRec) && ['kg', 'kilo'].some(x => x === sIns)) return cant / 1000;
          if (['kg', 'kilo'].some(x => x === sRec) && ['g', 'gr'].some(x => x === sIns)) return cant * 1000;
          if (['ml', 'cc'].some(x => x === sRec) && ['l', 'lt'].some(x => x === sIns)) return cant / 1000;
          if (['l', 'lt'].some(x => x === sRec) && ['ml', 'cc'].some(x => x === sIns)) return cant * 1000;
      }
      return cant;
  };

  const resumenCostos = useMemo(() => {
      let costoTotal = 0;
      ingredientes.forEach(ing => {
          const insumo = getInsumoData(ing.id_referencia);
          const precioCompra = parseFloat(insumo.precio_compra || insumo.precio_ultima_compra || 0);
          const cantidadReceta = parseFloat(ing.cantidad || 0);
          const cantidadNormalizada = convertirCantidad(cantidadReceta, ing.unidad_medida_id, insumo.unidad_medida_id);
          costoTotal += (precioCompra * cantidadNormalizada);
      });

      const precioVentaNum = parseFloat(precioVenta) || 0;
      const utilidad = precioVentaNum - costoTotal;
      const margen = precioVentaNum > 0 ? ((utilidad / precioVentaNum) * 100) : 0;

      return { costoTotal, utilidad, margen };
  }, [ingredientes, precioVenta, todosProductosInventario, factoresConversion, unidadesMedida]);

  const handleAddIngrediente = () => {
    if (!nuevoIngrediente.id_referencia || parseFloat(nuevoIngrediente.cantidad) <= 0 || !nuevoIngrediente.unidad_medida_id) {
      return alert('⚠️ Completa todos los campos del ingrediente.');
    }
    setIngredientes(prev => [...prev, { ...nuevoIngrediente }]);
    setNuevoIngrediente({ id_referencia: '', cantidad: 1, unidad_medida_id: '' });
  };

  const handleRemoveIngrediente = (index) => {
    setIngredientes(prev => prev.filter((_, i) => i !== index));
  };

  const handleGuardar = async () => {
    if (!nombre.trim()) return alert('⚠️ El nombre es obligatorio.');
    
    const precioBase = parseFloat(listaPrecios[1]);
    const precioActual = parseFloat(precioVenta);
    
    if ((isNaN(precioBase) || precioBase < 0) && (isNaN(precioActual) || precioActual < 0)) {
        return alert('⚠️ Debes definir al menos el Precio Base.');
    }

    let datosAGuardar = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        categoria: categoria.trim() || null,
        subcategoria: subcategoria.trim() || null,
        
        precio_venta: precioBase || precioActual || 0,
        
        // ✅ ENVIAR LISTA DE PRECIOS
        precios_lista: Object.entries(listaPrecios).map(([id, val]) => ({
            tipo_precio_id: parseInt(id),
            precio: parseFloat(val || 0)
        })),

        zona_impresion: zonaImpresion || null,
        tipo: 'platillo',
        es_compuesto: esCompuesto,
        activo: activo,
    };

    if (esCompuesto) {
      if (ingredientes.length === 0) return alert('⚠️ Agrega ingredientes.');
      datosAGuardar.receta = {
          detalles: ingredientes.map(ing => ({
            producto_inventario_id: parseInt(ing.id_referencia, 10),
            cantidad: parseFloat(ing.cantidad),
            unidad_medida_id: parseInt(ing.unidad_medida_id, 10)
          }))
      };
    } else {
      if (!productoInventarioId) return alert('⚠️ Selecciona insumo directo.');
      datosAGuardar.producto_inventario_id = parseInt(productoInventarioId, 10);
    }

    try {
      if (initialData && initialData.id) {
        await onSave(initialData.id, datosAGuardar);
        onClose();
      } else {
        throw new Error('No se puede editar un producto sin ID');
      }
    } catch (error) {
      alert('❌ Error al guardar: ' + (error.message || 'Verifica la consola'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-2xl flex justify-between items-center text-white">
            <h3 className="text-xl font-bold flex items-center gap-2">
              {esCompuesto ? '🧩 Editar Producto Compuesto' : '📦 Editar Producto Simple'}
            </h3>
            <button onClick={onClose} className="text-white hover:text-gray-200"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Toggle tipo (Deshabilitado en edición) */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
            <label className="flex items-center cursor-not-allowed opacity-90">
              <span className="mr-3 text-sm font-medium text-gray-700">Producto Simple</span>
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={esCompuesto} disabled />
                <div className={`block w-14 h-7 rounded-full transition-colors ${esCompuesto ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform transform ${esCompuesto ? 'translate-x-7' : ''}`}></div>
              </div>
              <span className="ml-3 text-sm font-medium text-gray-700">Producto Compuesto</span>
            </label>
            <p className="mt-2 text-xs text-red-600 font-medium">⚠️ No puedes cambiar el tipo de producto al editar.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><label className="text-sm font-medium">Nombre *</label><input className="w-full border p-2 rounded" value={nombre} onChange={e=>setNombre(e.target.value)} autoFocus /></div>
            <div className="md:col-span-2"><label className="text-sm font-medium">Descripción</label><textarea className="w-full border p-2 rounded" value={descripcion} onChange={e=>setDescripcion(e.target.value)} /></div>
            <div><CategoriaSelector value={categoria} onChange={setCategoria} label="Categoría" placeholder="Ej: Bebidas" allCategorias={categorias} setAllCategorias={setCategorias}/></div>
            <div><CategoriaSelector value={subcategoria} onChange={setSubcategoria} label="Subcategoría" placeholder="Ej: Gaseosas" allCategorias={subcategorias} setAllCategorias={setSubcategorias}/></div>
            
            {/* ✅ SECCIÓN PRECIOS MÚLTIPLES */}
            <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <DollarSign size={16} className="text-green-600"/> Precios de Venta
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {tiposPrecio.map(tp => {
                        const esPrecioActivo = Number(tp.id) === Number(tipoPrecioCartaId);
                        return (
                            <div key={tp.id} className={`relative ${esPrecioActivo ? 'order-first sm:order-none' : ''}`}>
                                <label className={`text-xs font-bold uppercase mb-1 block ${esPrecioActivo ? 'text-blue-700' : 'text-gray-500'}`}>{tp.nombre}</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                                    <input type="number" className={`w-full pl-6 pr-3 py-2 border rounded-lg outline-none transition-all ${esPrecioActivo ? 'border-blue-500 ring-2 ring-blue-100 bg-white font-bold text-gray-900' : 'border-gray-300 bg-gray-50 text-gray-600 focus:bg-white focus:border-blue-400'}`} placeholder="0" value={listaPrecios[tp.id] || ''} onChange={e => handlePrecioChange(tp.id, e.target.value)}/>
                                    {esPrecioActivo && (<div className="absolute -top-8 right-0 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1"><Star size={10} fill="white"/> Carta Actual</div>)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Printer size={16} className="text-gray-500"/> Zona de Impresión</label>
              <select value={zonaImpresion} onChange={(e) => setZonaImpresion(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white">
                <option value="">-- Sin Impresión --</option>
                {impresoras.length === 0 && <option value="Cocina">Cocina (Default)</option>}
                {impresoras.map(imp => (<option key={imp.id} value={imp.nombre}>{imp.nombre} ({imp.tipo_impresora})</option>))}
              </select>
            </div>

            <div className="md:col-span-2 flex items-center gap-2"><input type="checkbox" checked={activo} onChange={e=>setActivo(e.target.checked)} className="w-5 h-5"/> <label>Activo</label></div>
          </div>
          
           {!esCompuesto ? (
              <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl">
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><Package size={18}/> Insumo de Inventario (Descuento Directo)</label>
                  <select className="w-full border border-gray-300 p-3 rounded-lg bg-white" value={productoInventarioId} onChange={e=>setProductoInventarioId(e.target.value)}>
                      <option value="">-- Seleccionar Insumo --</option>
                      {todosProductosInventario.map(p => (<option key={p.id} value={p.id}>{p.nombre} (Stock: {parseFloat(p.stock_actual)})</option>))}
                  </select>
              </div>
           ) : (
              <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl">
                  <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><Calculator size={18}/> Receta / Ingredientes</label>
                  
                  <div className="flex flex-col md:flex-row gap-2 items-end mb-4">
                      <div className="flex-1 w-full">
                          <label className="text-xs font-bold text-gray-500 uppercase">Insumo</label>
                          <select className="w-full border p-2 rounded-lg text-sm bg-white" value={nuevoIngrediente.id_referencia} onChange={e=>setNuevoIngrediente({...nuevoIngrediente, id_referencia: e.target.value})}>
                              <option value="">Buscar Insumo...</option>
                              {todosProductosInventario.map(p => (<option key={p.id} value={p.id}>{p.nombre}</option>))}
                          </select>
                      </div>
                      <div className="w-24">
                          <label className="text-xs font-bold text-gray-500 uppercase">Cant.</label>
                          <input type="number" className="w-full border p-2 rounded-lg text-sm text-center" placeholder="0" value={nuevoIngrediente.cantidad} onChange={e=>setNuevoIngrediente({...nuevoIngrediente, cantidad: e.target.value})}/>
                      </div>
                      <div className="w-28">
                          <label className="text-xs font-bold text-gray-500 uppercase">Unidad</label>
                          <select className="w-full border p-2 rounded-lg text-sm bg-white" value={nuevoIngrediente.unidad_medida_id} onChange={e=>setNuevoIngrediente({...nuevoIngrediente, unidad_medida_id: e.target.value})}>
                              <option value="">--</option>
                              {unidadesMedida.map(u=><option key={u.id} value={u.id}>{u.simbolo}</option>)}
                          </select>
                      </div>
                      <button onClick={handleAddIngrediente} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg shadow"><Plus size={20}/></button>
                  </div>
                  
                  {/* TABLA DE INGREDIENTES */}
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                      <table className="w-full text-sm">
                          <thead className="bg-gray-100 text-gray-600 border-b">
                              <tr>
                                  <th className="p-3 text-left font-semibold">Insumo</th>
                                  <th className="p-3 text-center font-semibold">Cant.</th>
                                  <th className="p-3 text-right font-semibold">Costo Unit.</th>
                                  <th className="p-3 text-right font-semibold">Subtotal</th>
                                  <th className="p-3 text-center font-semibold"></th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {ingredientes.map((ing, i) => {
                                  const insumo = getInsumoData(ing.id_referencia);
                                  const precioCompra = parseFloat(insumo.precio_compra || insumo.precio_ultima_compra || 0); 
                                  const cantidadReceta = parseFloat(ing.cantidad);
                                  const cantidadNormalizada = convertirCantidad(cantidadReceta, ing.unidad_medida_id, insumo.unidad_medida_id);
                                  const subtotal = precioCompra * cantidadNormalizada;
                                  
                                  return (
                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-3 font-medium text-gray-800">{insumo.nombre}</td>
                                        <td className="p-3 text-center text-gray-600">{cantidadReceta} <span className="text-xs text-gray-400">{getUnidadNombre(ing.unidad_medida_id)}</span></td>
                                        <td className="p-3 text-right text-gray-500 font-mono">${Math.round(precioCompra).toLocaleString('es-CL')}</td>
                                        <td className="p-3 text-right font-bold text-gray-800 font-mono">${Math.round(subtotal).toLocaleString('es-CL')}</td>
                                        <td className="p-3 text-center"><button onClick={()=>handleRemoveIngrediente(i)} className="text-gray-400 hover:text-red-600"><Trash2 size={16}/></button></td>
                                    </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                  </div>

                  {/* RESUMEN FINANCIERO */}
                  <div className="mt-4 flex flex-col sm:flex-row justify-between items-center bg-blue-50 p-4 rounded-lg border border-blue-100 gap-4">
                        <div className="text-sm text-gray-600 w-full sm:w-auto">
                            <div className="flex justify-between sm:justify-start gap-4">
                                <span>Utilidad Est.: <strong>${Math.round(resumenCostos.utilidad).toLocaleString('es-CL')}</strong></span>
                                <span>Margen: <span className={`${resumenCostos.margen >= 30 ? 'text-green-600' : 'text-red-500'} font-bold`}>{resumenCostos.margen.toFixed(1)}%</span></span>
                            </div>
                        </div>
                        <div className="text-right w-full sm:w-auto border-t sm:border-t-0 border-blue-200 pt-2 sm:pt-0">
                            <p className="text-xs text-blue-600 uppercase font-bold tracking-wide">Costo Total Receta</p>
                            <p className="text-2xl font-black text-gray-800">${Math.round(resumenCostos.costoTotal).toLocaleString('es-CL')}</p>
                        </div>
                  </div>

              </div>
           )}
        </div>
        
        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t rounded-b-2xl">
            <button onClick={onClose} className="px-5 py-2.5 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">Cancelar</button>
            <button onClick={handleGuardar} disabled={cargandoDatos} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2"><Save size={18}/> Actualizar Producto</button>
        </div>
      </div>
    </div>
  );
}
