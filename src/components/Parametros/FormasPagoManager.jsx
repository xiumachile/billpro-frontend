// src/components/Parametros/FormasPagoManager.jsx
import React, { useState, useEffect } from 'react';
import FormasPagoList from './FormasPagoList';
import FormasPagoForm from './FormasPagoForm';
import { inventarioApi } from "../../api/inventarioApi";

export default function FormasPagoManager({ usuario, onVolver }) {
  const [formasPago, setFormasPago] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formEditando, setFormEditando] = useState(null);

  useEffect(() => {
    cargarFormasPago();
  }, []);

  const cargarFormasPago = async () => {
    try {
      const formas = await inventarioApi.getFormasPago();
      setFormasPago(Array.isArray(formas) ? formas : []);
    } catch (error) {
      console.error('Error al cargar formas de pago:', error);
      alert('Error al cargar las formas de pago: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNueva = () => {
    setFormEditando(null);
    setShowForm(true);
  };

  const handleEditar = (forma) => {
    setFormEditando(forma);
    setShowForm(true);
  };

  const handleGuardar = () => {
    setShowForm(false);
    setFormEditando(null);
    cargarFormasPago();
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta forma de pago?')) {
      return;
    }
    try {
      await inventarioApi.eliminarFormaPago(id);
      alert('✅ Forma de pago eliminada correctamente');
      cargarFormasPago();
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('❌ Error al eliminar: ' + error.message);
    }
  };

  if (showForm) {
    return (
      <FormasPagoForm
        forma={formEditando}
        onGuardar={handleGuardar}
        onCancelar={() => {
          setShowForm(false);
          setFormEditando(null);
        }}
        usuario={usuario}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Botón de nueva forma de pago */}
      <div className="mb-6">
        <button
          onClick={handleNueva}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <span>Nueva Forma de Pago</span>
        </button>
      </div>

      {/* Lista de formas de pago */}
      <FormasPagoList
        formasPago={formasPago}
        onEdit={handleEditar}
        onDelete={handleEliminar}
        loading={loading}
      />
    </div>
  );
}
