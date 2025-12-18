import React, { useState, useEffect, useRef } from 'react';
import { menuApi } from '../../api/menuApi';
import { 
  Package, Plus, X, Calculator, Save, ChevronDown, ChevronUp, Printer 
} from 'lucide-react';

// Componente interno para selección de Categorías
const CategoriaSelector = ({ value, onChange, label, placeholder, allCategorias, setAllCategorias }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddOption, setShowAddOption] = useState(false);
  const inputRef = useRef(null);

  const filteredCategorias = allCategorias.filter(cat =>
    cat.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e) => {
    const value = e.target.value;
    onChange(value);
    setSearchTerm(value);
    if (value && !allCategorias.some(cat => cat.toLowerCase() === value.toLowerCase())) {
      setShowAddOption(true);
    } else {
      setShowAddOption(false);
    }
  };

  const handleSelect = (categoria) => {
    onChange(categoria);
    setSearchTerm('');
    setShowAddOption(false);
    setIsOpen(false);
  };

  const handleAddNew = () => {
    if (searchTerm && !allCategorias.some(cat => cat.toLowerCase() === searchTerm.toLowerCase())) {
      setAllCategorias(prev => [...prev, searchTerm]);
      onChange(searchTerm);
      setSearchTerm('');
      setShowAddOption(false);
      setIsOpen(false);
    }
  };

  const handleClickOutside = (e) => {
    if (inputRef.current && !inputRef.current.contains(e.target)) {
      setIsOpen(false);
      setShowAddOption(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={inputRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        >
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
      {isOpen && (searchTerm || filteredCategorias.length > 0) && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
          {filteredCategorias.map((cat, index) => (
            <div key={index} onClick={() => handleSelect(cat)} className="px-4 py-2 hover:bg-blue-100 cursor-pointer border-b border-gray-100 last:border-b-0">
              {cat}
            </div>
          ))}
          {showAddOption && (
            <div onClick={handleAddNew} className="px-4 py-2 hover:bg-green-100 cursor-pointer text-green-700 font-medium border-t border-gray-200">
              + Agregar "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function EditarProductoModal({ isOpen, onClose, initialData, onSave }) {
  // Estados principales
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [subcategoria, setSubcategoria] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  
  // ✅ ESTADO DE IMPRESORA (Zona)
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
  
  // ✅ LISTA DE IMPRESORAS
  const [impresoras, setImpresoras] = useState([]);

  // Carga
  const [cargandoDatos, setCargandoDatos] = useState(false);

  // 1. CARGAR DATOS AL ABRIR
  useEffect(() => {
    if (isOpen) cargarDatosAuxiliares();
  }, [isOpen]);

  const cargarDatosAuxiliares = async () => {
    setCargandoDatos(true);
    try {
      const [productosRes, unidadesRes, catRes, subcatRes, impresorasRes] = await Promise.allSettled([
        menuApi.getTodosProductosParaRecetas(),
        menuApi.getUnidadesMedida(),
        menuApi.getCategorias(),
        menuApi.getSubcategorias(),
        menuApi.getImpresoras() // ✅ Carga de impresoras
      ]);

      if (productosRes.status === 'fulfilled') setTodosProductosInventario(Array.isArray(productosRes.value) ? productosRes.value : []);
      if (unidadesRes.status === 'fulfilled') setUnidadesMedida(Array.isArray(unidadesRes.value) ? unidadesRes.value : []);
      if (catRes.status === 'fulfilled') setCategorias(Array.isArray(catRes.value) ? catRes.value : []);
      if (subcatRes.status === 'fulfilled') setSubcategorias(Array.isArray(subcatRes.value) ? subcatRes.value : []);
      
      // ✅ Setear impresoras activas
      if (impresorasRes.status === 'fulfilled') {
          const data = impresorasRes.value;
          const lista = Array.isArray(data) ? data : (data.data || []);
          setImpresoras(lista.filter(i => i.estado === 'Activa'));
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
      setPrecioVenta(String(initialData.precio_venta || initialData.precioVenta || ''));
      setZonaImpresion(initialData.zona_impresion || ''); // ✅ Cargar zona guardada
      setEsCompuesto(esCompuestoEdit);
      setActivo(initialData.activo !== false);

      if (esCompuestoEdit) {
        let detallesReceta = null;
        // Diferentes estructuras posibles según el backend
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
  }, [isOpen, initialData]);

  const getUnidadNombre = (id) => {
    const u = unidadesMedida.find(unit => unit.id == id);
    return u ? u.simbolo : '?';
  };

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
    const precio = parseFloat(precioVenta);
    if (isNaN(precio) || precio <= 0) return alert('⚠️ Precio inválido.');

    let datosAGuardar = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        categoria: categoria.trim() || null,
        subcategoria: subcategoria.trim() || null,
        precio_venta: precio,
        zona_impresion: zonaImpresion || null, // ✅ Se guarda el nombre de la impresora
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
            <div><label className="text-sm font-medium">Precio Venta</label><input type="number" className="w-full border p-2 rounded" value={precioVenta} onChange={e=>setPrecioVenta(e.target.value)} /></div>

            {/* ✅ SELECTOR DE ZONA DE IMPRESIÓN DINÁMICO */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Printer size={14}/> Zona de Impresión
              </label>
              <select 
                  value={zonaImpresion} 
                  onChange={(e) => setZonaImpresion(e.target.value)} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
              >
                <option value="">-- Sin Impresión --</option>
                {/* Opciones por defecto si no hay impresoras creadas */}
                {impresoras.length === 0 && <option value="Cocina">Cocina (Default)</option>}
                
                {/* Mapeo de impresoras reales */}
                {impresoras.map(imp => (
                    <option key={imp.id} value={imp.nombre}>{imp.nombre} ({imp.tipo_impresora})</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 flex items-center gap-2"><input type="checkbox" checked={activo} onChange={e=>setActivo(e.target.checked)} className="w-5 h-5"/> <label>Activo</label></div>
          </div>
          
           {!esCompuesto ? (
              <div className="p-4 bg-gray-50 border rounded-xl"><label className="text-sm font-bold">Insumo Directo</label><select className="w-full border p-2 rounded" value={productoInventarioId} onChange={e=>setProductoInventarioId(e.target.value)}><option value="">Seleccionar...</option>{todosProductosInventario.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.unidad_medida})</option>)}</select></div>
           ) : (
              <div className="p-4 bg-gray-50 border rounded-xl"><label className="text-sm font-bold">Receta</label><div className="flex gap-2"><select className="flex-1 border p-2 rounded" value={nuevoIngrediente.id_referencia} onChange={e=>setNuevoIngrediente({...nuevoIngrediente, id_referencia: e.target.value})}><option value="">Ingrediente...</option>{todosProductosInventario.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select><input type="number" className="w-20 border p-2 rounded" value={nuevoIngrediente.cantidad} onChange={e=>setNuevoIngrediente({...nuevoIngrediente, cantidad: e.target.value})}/><select className="w-24 border p-2 rounded" value={nuevoIngrediente.unidad_medida_id} onChange={e=>setNuevoIngrediente({...nuevoIngrediente, unidad_medida_id: e.target.value})}><option value="">U.</option>{unidadesMedida.map(u=><option key={u.id} value={u.id}>{u.simbolo}</option>)}</select><button onClick={handleAddIngrediente} className="bg-blue-600 text-white p-2 rounded">+</button></div><ul className="mt-2">{ingredientes.map((ing,i)=><li key={i} className="flex justify-between text-sm border-b p-1"><span>Item {ing.id_referencia} ({ing.cantidad})</span><button onClick={()=>handleRemoveIngrediente(i)} className="text-red-500">x</button></li>)}</ul></div>
           )}
        </div>
        
        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t rounded-b-2xl">
            <button onClick={onClose} className="px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-200">Cancelar</button>
            <button onClick={handleGuardar} disabled={cargandoDatos} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center gap-2"><Save size={16}/> Actualizar</button>
        </div>
      </div>
    </div>
  );
}
