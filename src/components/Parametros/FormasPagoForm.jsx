// src/components/Parametros/FormasPagoForm.jsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, CreditCard } from 'lucide-react';
import { inventarioApi } from "../../api/inventarioApi";

export default function FormasPagoForm({ forma, onGuardar, onCancelar, usuario }) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [activo, setActivo] = useState(true);
  const [loading, setLoading] = useState(false);
  const esEdicion = !!forma;

  useEffect(() => {
    if (forma) {
      setNombre(forma.nombre || '');
      setDescripcion(forma.descripcion || '');
      setActivo(forma.activo !== false);
    }
  }, [forma]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nombre.trim()) {
      alert('⚠️ El nombre es obligatorio');
      return;
    }

    setLoading(true);

    try {
      const datos = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        activo: activo
      };

      if (esEdicion) {
        await inventarioApi.actualizarFormaPago(forma.id, datos);
        alert('✅ Forma de pago actualizada correctamente');
      } else {
        await inventarioApi.crearFormaPago(datos);
        alert('✅ Forma de pago creada correctamente');
      }
      onGuardar();
    } catch (error) {
      console.error('Error al guardar:', error);
      alert(`❌ Error al guardar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <button
                onClick={onCancelar}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 font-medium group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span>Volver</span>
              </button>
              <div className="h-8 w-px bg-gray-200" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-md">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {esEdicion ? 'Editar Forma de Pago' : 'Nueva Forma de Pago'}
                  </h1>
                  <p className="text-sm text-gray-500">Gestión de métodos de pago</p>
                </div>
              </div>
            </div>
            {usuario && (
              <div className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-2 rounded-lg border border-purple-100">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
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
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-2xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8">
          {/* Nombre */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Efectivo, Transferencia, Tarjeta de débito"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              required
            />
          </div>

          {/* Descripción */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción detallada del método de pago"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              rows="4"
            />
          </div>

          {/* Estado Activo */}
          <div className="mb-8">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-sm font-semibold text-gray-700">
                Activo
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-7">
              {activo 
                ? 'Esta forma de pago está disponible para usar'
                : 'Esta forma de pago no estará disponible para usar'}
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onCancelar}
              className="flex-1 px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800 text-white font-medium rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{esEdicion ? 'Actualizar' : 'Crear'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
