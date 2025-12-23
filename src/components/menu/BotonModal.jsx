import React, { useState, lazy, Suspense } from 'react';
import { X, Save, Plus } from 'lucide-react';

// Importación condicional (Lazy Loading)
const CrearComboModal = lazy(() => 
  import('./CrearComboModal').catch(() => ({
    default: () => <div className="p-4 bg-white text-red-500">Error cargando modal</div>
  }))
);

const CrearProductoModal = lazy(() => 
  import('./CrearProductoModal').catch(() => ({
    default: () => <div className="p-4 bg-white text-red-500">Error cargando modal</div>
  }))
);

export default function BotonModal({
  isOpen,
  onClose,
  posicion,
  initialData,
  onSave,
  productos,
  combos,
  subpantallas,
  onCreatePlatillo,
  onCreateCombo,
  productosInventario,
  subpantallasDisponibles = [],
  pantallaId,
  // ✅ 1. RECIBIMOS LA PROP DESDE MENUMANAGER
  tipoPrecioCartaId = 1 
}) {
  const [tipo, setTipo] = useState(initialData?.tipo || 'platillo');
  const [referenciaId, setReferenciaId] = useState(initialData?.referencia_id ? String(initialData.referencia_id) : '');
  const [etiqueta, setEtiqueta] = useState(initialData?.etiqueta || '');
  const [activo, setActivo] = useState(initialData?.activo !== false);
  const [bgColor, setBgColor] = useState(initialData?.bg_color || '#f3f4f6');
  const [textColor, setTextColor] = useState(initialData?.text_color || '#374151');
  const [fontSize, setFontSize] = useState(initialData?.font_size || 'text-sm');
  
  const [showCrearPlatillo, setShowCrearPlatillo] = useState(false);
  const [showCrearCombo, setShowCrearCombo] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activo) {
      if (!tipo) return alert('⚠️ Selecciona un tipo de botón');
      if (!referenciaId) return alert('⚠️ Debes seleccionar una referencia');
    }
    
    onSave({
      pantalla_id: pantallaId,
      posicion,
      tipo: activo ? tipo : null,
      referencia_id: activo ? parseInt(referenciaId) : null,
      etiqueta: (!etiqueta || etiqueta.trim() === '') ? null : etiqueta.trim(),
      activo,
      bg_color: bgColor,
      text_color: textColor,
      font_size: fontSize
    });
    onClose();
  };

  const handleCrearPlatilloCompleto = async (nuevoProducto) => {
    try {
      if (!onCreatePlatillo) throw new Error('Función no definida');
      const productoCreado = await onCreatePlatillo(nuevoProducto);
      
      setReferenciaId(String(productoCreado.id));
      setTipo('platillo');
      setEtiqueta(productoCreado.nombre || '');
      setActivo(true);
      setShowCrearPlatillo(false);
    } catch (error) {
      // El error ya se muestra en el modal hijo o en MenuManager
      console.error(error);
    }
  };

  const handleCrearComboCompleto = async (nuevoCombo) => {
    try {
      if (!onCreateCombo) throw new Error('Función no definida');
      const comboCreado = await onCreateCombo(nuevoCombo);
      
      setReferenciaId(String(comboCreado.id));
      setTipo('combo');
      setEtiqueta(comboCreado.nombre || '');
      setActivo(true);
      setShowCrearCombo(false);
    } catch (error) {
      console.error(error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1100] p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {!showCrearPlatillo && !showCrearCombo ? (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Editar Botón #{posicion}</h3>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 bg-gray-200 rounded-full p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
              
              <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                <input
                  id={`activo-${posicion}`}
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor={`activo-${posicion}`} className="text-sm font-bold text-gray-700 cursor-pointer select-none">
                  Habilitar Botón
                </label>
              </div>

              {activo && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Acción</label>
                    <select
                      value={tipo}
                      onChange={(e) => { setTipo(e.target.value); setReferenciaId(''); }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="platillo">Vender Platillo</option>
                      <option value="combo">Vender Combo</option>
                      <option value="link">Ir a Subpantalla</option>
                    </select>
                  </div>

                  {tipo === 'platillo' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Producto</label>
                      <div className="flex gap-2">
                          <select
                            value={referenciaId}
                            onChange={(e) => {
                                setReferenciaId(e.target.value);
                                if(!etiqueta && e.target.value) {
                                    const prod = productos.find(p => String(p.id) === e.target.value);
                                    if(prod) setEtiqueta(prod.nombre);
                                }
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                          >
                            <option value="">-- Seleccionar --</option>
                            {productos.map((item) => (
                              <option key={item.id} value={String(item.id)}>
                                {item.nombre} (${item.precio_venta})
                              </option>
                            ))}
                          </select>
                          {onCreatePlatillo && (
                            <button type="button" onClick={() => setShowCrearPlatillo(true)} className="bg-green-100 text-green-700 p-2 rounded-lg hover:bg-green-200" title="Crear Nuevo">
                                <Plus size={20}/>
                            </button>
                          )}
                      </div>
                    </div>
                  )}

                  {tipo === 'combo' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Combo</label>
                      <div className="flex gap-2">
                          <select
                            value={referenciaId}
                            onChange={(e) => {
                                setReferenciaId(e.target.value);
                                if(!etiqueta && e.target.value) {
                                    const cmb = combos.find(c => String(c.id) === e.target.value);
                                    if(cmb) setEtiqueta(cmb.nombre);
                                }
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                          >
                            <option value="">-- Seleccionar --</option>
                            {combos.map((item) => (
                              <option key={item.id} value={String(item.id)}>
                                {item.nombre} (${item.precio})
                              </option>
                            ))}
                          </select>
                          {onCreateCombo && (
                            <button type="button" onClick={() => setShowCrearCombo(true)} className="bg-green-100 text-green-700 p-2 rounded-lg hover:bg-green-200" title="Crear Nuevo">
                                <Plus size={20}/>
                            </button>
                          )}
                      </div>
                    </div>
                  )}

                  {tipo === 'link' && (
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subpantalla Destino</label>
                        <select
                        value={referenciaId}
                        onChange={(e) => setReferenciaId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                        >
                        <option value="">-- Seleccionar --</option>
                        {subpantallas.map((item) => {
                            const estaUsada = subpantallasDisponibles.findIndex(p => p.id === item.id) === -1;
                            const esActual = String(item.id) === referenciaId;
                            const esMismaPantalla = String(item.id) === String(pantallaId); 
                            
                            return (
                            <option 
                                key={item.id} 
                                value={String(item.id)}
                                disabled={(estaUsada && !esActual) || esMismaPantalla}
                            >
                                {item.nombre}
                                {esMismaPantalla ? ' (Pantalla Actual)' : (estaUsada && !esActual ? ' (Ya asignada)' : '')}
                            </option>
                            );
                        })}
                        </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Texto del Botón</label>
                    <input
                      type="text"
                      value={etiqueta}
                      onChange={(e) => setEtiqueta(e.target.value)}
                      placeholder="Nombre visible..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fondo</label>
                      <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-full h-10 border border-gray-300 rounded cursor-pointer p-1" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Texto</label>
                      <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-full h-10 border border-gray-300 rounded cursor-pointer p-1" />
                    </div>
                  </div>
                  
                  <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tamaño Fuente</label>
                      <select value={fontSize} onChange={(e) => setFontSize(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                        <option value="text-xs">Pequeño</option>
                        <option value="text-sm">Normal</option>
                        <option value="text-lg">Grande</option>
                        <option value="text-xl">Extra Grande</option>
                      </select>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow active:scale-95 transition-all">
                  Guardar
                </button>
              </div>
            </form>
          </>
        ) : showCrearPlatillo ? (
          <Suspense fallback={<div>Cargando...</div>}>
            <CrearProductoModal 
                isOpen={true} 
                onClose={() => setShowCrearPlatillo(false)} 
                onSave={handleCrearPlatilloCompleto} 
                productosInventario={productosInventario} 
                
                // ✅ 2. PASAMOS LA PROP AL MODAL HIJO (AQUÍ ESTABA EL ERROR)
                tipoPrecioCartaId={tipoPrecioCartaId} 
            />
          </Suspense>
        ) : showCrearCombo ? (
          <Suspense fallback={<div>Cargando...</div>}>
            <CrearComboModal 
                isOpen={true} 
                onClose={() => setShowCrearCombo(false)} 
                onSave={handleCrearComboCompleto} 
                productos={productos}
                
                // ✅ 3. PASAMOS LA PROP TAMBIÉN AQUÍ
                tipoPrecioCartaId={tipoPrecioCartaId} 
            />
          </Suspense>
        ) : null}
      </div>
    </div>
  );
}
