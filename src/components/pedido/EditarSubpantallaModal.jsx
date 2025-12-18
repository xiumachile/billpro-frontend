// src/components/pedido/EditarSubpantallaModal.jsx

import React, { useState, useEffect } from 'react';
import { X, Save, Layout, AlertCircle } from 'lucide-react';

export default function EditarSubpantallaModal({
  isOpen,
  onClose,
  subpantalla,
  onSave
}) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [orden, setOrden] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && subpantalla) {
      setNombre(subpantalla.nombre || '');
      setDescripcion(subpantalla.descripcion || '');
      setOrden(subpantalla.orden || 1);
      setError('');
    } else {
      setNombre('');
      setDescripcion('');
      setOrden(1);
    }
  }, [isOpen, subpantalla]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!nombre.trim()) {
      setError('El nombre de la subpantalla es obligatorio');
      return;
    }

    const datos = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || null,
      orden: parseInt(orden) || 1
    };

    try {
      setLoading(true);
      await onSave(subpantalla.id, datos); // Asume que onSave recibe (id, datos)
      onClose();
    } catch (err) {
      console.error('Error al editar subpantalla:', err);
      if (err.messages) {
        const mensajes = Object.entries(err.messages)
          .map(([campo, arr]) => `- ${campo}: ${arr.join(', ')}`)
          .join('\n');
        setError(`Errores de validación:\n${mensajes}`);
      } else {
        setError(err.message || 'Error al editar la subpantalla');
      }
      setLoading(false);
    }
  };

  if (!isOpen || !subpantalla) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="bg-gradient-to-r from-cyan-600 to-teal-600 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <Layout className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Editar Subpantalla
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 p-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <pre className="text-xs whitespace-pre-wrap font-sans">{error}</pre>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Subpantalla *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              placeholder="Ej: Bebidas, Postres, Menú Infantil"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción (opcional)
            </label>
            <textarea
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none"
              placeholder="Describe brevemente el contenido de esta pantalla..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Orden de Visualización
            </label>
            <input
              type="number"
              min="1"
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-medium rounded-lg transition-all flex items-center gap-1 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  <span>Actualizar Subpantalla</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
