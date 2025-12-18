import React, { useState, useEffect } from 'react';
import ProveedorList from './ProveedorList';
import ProveedorModal from './ProveedorModal';
import { inventarioApi } from '../../api/inventarioApi';
import {
  ArrowLeft,
  Plus,
  Users
} from 'lucide-react';

export default function ProveedoresManager({ usuario, onVolver }) {
  // Estados
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [proveedorEdit, setProveedorEdit] = useState(null);
  const [busqueda, setBusqueda] = useState(''); // Inicializado como cadena vacía

  // === useEffect para carga inicial ===
  useEffect(() => {
    cargarProveedores(); // Carga inicial sin filtro
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo se ejecuta una vez al montar

  // === useEffect para búsqueda con debounce ===
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      cargarProveedores(busqueda);
    }, 300);

    // ✅ Función de limpieza: cancela el timeout si busqueda cambia o el componente se desmonta
    return () => {
      clearTimeout(timeoutId);
    };
  }, [busqueda]); // Dependencia: se ejecuta cuando `busqueda` cambia.

  /**
   * Carga la lista de proveedores desde la API
   * @param {string} search Término de búsqueda opcional
   */
  const cargarProveedores = async (search = '') => {
    setLoading(true);
    try {
      const response = await inventarioApi.getProveedores(search);
      
      // ✅ Asegurarse de que se maneje la respuesta correctamente
      // Si inventarioApi.getProveedores devuelve directamente el array:
      const datos = Array.isArray(response) ? response : [];

      // Si inventarioApi.getProveedores devuelve {  [...] }, usa:
      // const datos = Array.isArray(response?.data) ? response.data : [];

      setProveedores(datos);
    } catch (error) {
      setProveedores([]); // En caso de error, asegura un array vacío
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarProveedor = async (datos) => {
    try {
      if (proveedorEdit) {
        await inventarioApi.actualizarProveedor(proveedorEdit.id, datos);
        alert('✅ Proveedor actualizado correctamente');
      } else {
        await inventarioApi.crearProveedor(datos);
        alert('✅ Proveedor creado correctamente');
      }
      // Recargar con el término de búsqueda actual
      await cargarProveedores(busqueda);
      setModalOpen(false);
      setProveedorEdit(null);
    } catch (error) {
      alert(`❌ Error al guardar: ${error.message}`);
    }
  };

  const handleEliminarProveedor = async (id, nombre) => {
    if (!confirm(`⚠️ ¿Eliminar el proveedor "${nombre}"?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await inventarioApi.eliminarProveedor(id);
      alert('✅ Proveedor eliminado correctamente');
      // Recargar con el término de búsqueda actual
      await cargarProveedores(busqueda);
    } catch (error) {
      alert(`❌ Error al eliminar: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <button
                onClick={onVolver || (() => window.history.back())}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span>Volver</span>
              </button>
              <div className="h-8 w-px bg-gray-200" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Gestión de Proveedores</h1>
                  <p className="text-sm text-gray-500">Administración de proveedores de inventario</p>
                </div>
              </div>
            </div>
            {usuario && (
              <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-lg border border-blue-100">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
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
      <div className="max-w-7xl mx-auto p-6">
        {/* Barra de búsqueda + botón */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Barra de búsqueda */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar por nombre o RUT..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 absolute right-3 top-3 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
          </div>

          {/* Botón nuevo proveedor */}
          <button
            onClick={() => {
              setProveedorEdit(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" /> <span>Nuevo Proveedor</span>
          </button>
        </div>

        {/* Renderizado condicional principal */}
        {proveedores.length > 0 ? (
          <ProveedorList
            proveedores={proveedores}
            onEdit={(proveedor) => {
              setProveedorEdit(proveedor);
              setModalOpen(true);
            }}
            onDelete={handleEliminarProveedor}
            loading={loading}
          />
        ) : (
          <div className="text-center py-10 text-gray-500 bg-white border rounded-xl shadow-sm">
            {loading ? (
              <p>Cargando proveedores...</p>
            ) : busqueda ? (
              <p>No se encontraron proveedores que coincidan con "<strong>{busqueda}</strong>".</p>
            ) : (
              <p>No hay proveedores registrados todavía.</p>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <ProveedorModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setProveedorEdit(null);
          }}
          proveedor={proveedorEdit}
          onSave={handleGuardarProveedor}
        />
      )}
    </div>
  );
}

