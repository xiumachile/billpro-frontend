// src/components/menu/BotonModal.jsx
import React, { useState, lazy, Suspense } from 'react';
import { X, Save, Plus, Type, Palette } from 'lucide-react';

// Importación condicional para CrearComboModal
const CrearComboModal = lazy(() => 
  import('./CrearComboModal').catch(() => ({
    default: function FallbackCrearComboModal({ isOpen, onClose, productos = [] }) {
      if (!isOpen) return null;
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">Crear Nuevo Combo</h3>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p>Componente CrearComboModal no encontrado.</p>
              <div className="flex justify-end mt-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }))
);

// Importación condicional para CrearProductoModal
const CrearProductoModal = lazy(() => 
  import('./CrearProductoModal').catch(() => ({
    default: function FallbackCrearProductoModal({ isOpen, onClose, productosInventario = [] }) {
      if (!isOpen) return null;
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">Crear Nuevo Producto</h3>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p>Componente CrearProductoModal no encontrado.</p>
              <div className="flex justify-end mt-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
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
  onCreateCombo, // Nueva prop para crear combos
  productosInventario,
  subpantallasDisponibles = [] // ✅ valor por defecto
}) {
  const [tipo, setTipo] = useState(initialData?.tipo || 'platillo');
  const [referenciaId, setReferenciaId] = useState(initialData?.referencia_id?.toString() || null);
  const [etiqueta, setEtiqueta] = useState(initialData?.etiqueta || '');
  const [activo, setActivo] = useState(initialData?.activo !== false);
  const [bgColor, setBgColor] = useState(initialData?.bg_color || '#f3f4f6');
  const [textColor, setTextColor] = useState(initialData?.text_color || '#374151');
  const [fontSize, setFontSize] = useState(initialData?.font_size || 'text-sm');
  const [showCrearPlatillo, setShowCrearPlatillo] = useState(false);
  const [showCrearCombo, setShowCrearCombo] = useState(false); // Nuevo estado para combo

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // ✅ VALIDACIÓN CRÍTICA: evitar guardar botones activos incompletos
    if (activo) {
      if (!tipo) {
        alert('⚠️ Selecciona un tipo de botón (platillo, combo o subpantalla)');
        return;
      }
      if (!referenciaId) {
        alert('⚠️ Debes seleccionar una referencia para el botón activo');
        return;
      }
      if (tipo === 'platillo' && isNaN(parseInt(referenciaId))) {
        alert('⚠️ El platillo seleccionado no es válido');
        return;
      }
      if (tipo === 'combo' && isNaN(parseInt(referenciaId))) {
        alert('⚠️ El combo seleccionado no es válido');
        return;
      }
    }
    
    onSave({
      posicion,
      tipo: activo ? tipo : null,
      referencia_id: activo ? (referenciaId ? parseInt(referenciaId) : null) : null,
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
      if (!onCreatePlatillo) {
        throw new Error('Función onCreatePlatillo no definida');
      }
      
      // 1. Crear el platillo
      const productoCreado = await onCreatePlatillo(nuevoProducto);
      
      // 2. ✅ ACTUALIZAR ESTADO LOCAL INMEDIATAMENTE
      setReferenciaId(productoCreado.id.toString()); // Convertir a string para el select
      setTipo('platillo');
      setEtiqueta(productoCreado.nombre || '');
      setActivo(true); // Activar el botón automáticamente
      
      // 3. Cerrar modal de creación
      setShowCrearPlatillo(false);
    } catch (error) {
      console.error('Error al crear platillo:', error);
      alert('❌ Error al crear platillo: ' + (error.message || 'Inténtalo de nuevo'));
    }
  };

  const handleCrearComboCompleto = async (nuevoCombo) => {
    try {
      if (!onCreateCombo) {
        throw new Error('Función onCreateCombo no definida');
      }
      
      // 1. Crear el combo
      const comboCreado = await onCreateCombo(nuevoCombo);
      
      // 2. ✅ ACTUALIZAR ESTADO LOCAL INMEDIATAMENTE
      setReferenciaId(comboCreado.id.toString()); // Convertir a string para el select
      setTipo('combo');
      setEtiqueta(comboCreado.nombre || '');
      setActivo(true); // Activar el botón automáticamente
      
      // 3. Cerrar modal de creación
      setShowCrearCombo(false);
    } catch (error) {
      console.error('Error al crear combo:', error);
      alert('❌ Error al crear combo: ' + (error.message || 'Inténtalo de nuevo'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        {!showCrearPlatillo && !showCrearCombo ? (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">Editar Botón #{posicion}</h3>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Activo */}
              <div className="flex items-center gap-3">
                <input
                  id={`activo-${posicion}`}
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor={`activo-${posicion}`} className="text-sm font-medium text-gray-700">
                  Botón activo
                </label>
              </div>

              {/* Tipo */}
              {activo && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                    <select
                      value={tipo}
                      onChange={(e) => {
                        setTipo(e.target.value);
                        setReferenciaId(null);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="platillo">Platillo</option>
                      <option value="combo">Combo</option>
                      <option value="link">Subpantalla</option>
                    </select>
                  </div>

                  {/* Referencia según tipo */}
                  {tipo === 'platillo' && (
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Platillo</label>
                      <select
                        value={referenciaId || ''}
                        onChange={(e) => setReferenciaId(e.target.value ? e.target.value : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">-- Seleccionar --</option>
                        {productos.map((item) => (
                          <option key={item.id} value={item.id.toString()}>
                            {item.nombre} • ${item.precio_venta}
                          </option>
                        ))}
                      </select>
                      {onCreatePlatillo && ( // Mostrar botón solo si la función está disponible
                        <button
                          type="button"
                          onClick={() => setShowCrearPlatillo(true)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 mt-2"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Agregar nuevo platillo
                        </button>
                      )}
                    </div>
                  )}

                  {tipo === 'combo' && (
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Combo</label>
                      <select
                        value={referenciaId || ''}
                        onChange={(e) => setReferenciaId(e.target.value ? e.target.value : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">-- Seleccionar --</option>
                        {combos.map((item) => (
                          <option key={item.id} value={item.id.toString()}>
                            {item.nombre} • ${item.precio}
                          </option>
                        ))}
                      </select>
                      {onCreateCombo && ( // Mostrar botón solo si la función está disponible
                        <button
                          type="button"
                          onClick={() => setShowCrearCombo(true)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 mt-2"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Agregar nuevo combo
                        </button>
                      )}
                    </div>
                  )}

                  {tipo === 'link' && (
  <div>
    <label className="block text-sm font-semibold text-gray-700">Subpantalla</label>
    <select
      value={referenciaId || ''}
      onChange={(e) => setReferenciaId(e.target.value ? e.target.value : null)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      required
    >
      <option value="">-- Seleccionar --</option>
      {subpantallas.map((item) => {
        // ✅ Verificar si está usada (pero permitir la actual)
        const estaUsada = subpantallasDisponibles.findIndex(p => p.id === item.id) === -1;
        const esActual = String(item.id) === referenciaId;
        return (
          <option 
            key={item.id} 
            value={item.id.toString()}
            disabled={estaUsada && !esActual} // deshabilitar solo si usada y no es la actual
          >
            {item.nombre}
            {estaUsada && !esActual && ' (ya asignada)'}
          </option>
        );
      })}
    </select>
  </div>
)}

                  {/* Etiqueta personalizada */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Etiqueta personalizada (opcional)</label>
                    <input
                      type="text"
                      value={etiqueta}
                      onChange={(e) => setEtiqueta(e.target.value)}
                      placeholder="Ej: ¡Nuevo!"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Controles de color y tamaño */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Color de Fondo</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                          className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Color de Texto</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño de Fuente</label>
                    <select
                      value={fontSize}
                      onChange={(e) => setFontSize(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="text-xs">Extra Pequeño</option>
                      <option value="text-sm">Pequeño</option>
                      <option value="text-base">Mediano (por defecto)</option>
                      <option value="text-lg">Grande</option>
                      <option value="text-xl">Extra Grande</option>
                      <option value="text-2xl">XXL</option>
                      <option value="text-3xl">XXXL</option>
                    </select>
                  </div>
                </>
              )}

              {/* Botones */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={activo && (!referenciaId || !tipo)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Guardar
                </button>
              </div>
            </form>
          </>
        ) : showCrearPlatillo ? (
          <Suspense fallback={
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                <div className="p-6 text-center">
                  <p>Cargando...</p>
                </div>
              </div>
            </div>
          }>
            <CrearProductoModal
              isOpen={true}
              onClose={() => setShowCrearPlatillo(false)}
              onSave={handleCrearPlatilloCompleto}
              productosInventario={productosInventario}
            />
          </Suspense>
        ) : showCrearCombo ? (
          <Suspense fallback={
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                <div className="p-6 text-center">
                  <p>Cargando...</p>
                </div>
              </div>
            </div>
          }>
            <CrearComboModal
              isOpen={true}
              onClose={() => setShowCrearCombo(false)}
              onSave={handleCrearComboCompleto}
              productos={productos}
            />
          </Suspense>
        ) : null}
      </div>
    </div>
  );
}
