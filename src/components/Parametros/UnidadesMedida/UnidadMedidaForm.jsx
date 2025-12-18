// src/components/parametros/UnidadesMedida/UnidadMedidaForm.jsx
import React, { useEffect, useState } from 'react';
import { parametrosApi } from '../../../api/parametrosApi';

export default function UnidadMedidaForm({ unidadToEdit, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    nombre: '',
    simbolo: '',
    descripcion: '',
    tipo: 'otro', // valor temporal hasta que carguen los tipos
  });
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ✅ Cargar tipos una sola vez, al montar el componente
  useEffect(() => {
    console.log('🔄 Componente montado - Iniciando carga de tipos...');
    
    const fetchTipos = async () => {
      try {
        console.log('🔍 Llamando a parametrosApi.getTiposUnidad()...');
        console.log('📍 Token actual:', localStorage.getItem('token') ? 'Existe ✅' : 'NO EXISTE ❌');
        
        const tiposData = await parametrosApi.getTiposUnidad();
        
        console.log('✅ Tipos recibidos:', tiposData);
        console.log('📊 Cantidad de tipos:', tiposData?.length || 0);
        
        setTipos(tiposData);
        
        // Si es creación, establecer el primer tipo como predeterminado
        if (!unidadToEdit && tiposData.length > 0) {
          console.log('🎯 Estableciendo tipo por defecto:', tiposData[0]);
          setFormData(prev => ({ ...prev, tipo: tiposData[0] }));
        }
      } catch (err) {
        console.error("❌ Error al cargar tipos:", err);
        console.error("📝 Detalle del error:", err.message);
        console.error("🔍 Stack trace:", err.stack);
        setError("No se pudieron cargar los tipos de unidad.");
      }
    };
    
    fetchTipos();
  }, []); // 👈 ¡Sin dependencia de unidadToEdit!

  // ✅ Rellenar formulario solo si hay una unidad para editar
  useEffect(() => {
    if (unidadToEdit) {
      console.log('📝 Modo edición - Cargando datos:', unidadToEdit);
      setFormData({
        nombre: unidadToEdit.nombre || '',
        simbolo: unidadToEdit.simbolo || '',
        descripcion: unidadToEdit.descripcion || '',
        tipo: unidadToEdit.tipo || 'otro',
      });
    } else {
      console.log('➕ Modo creación');
    }
  }, [unidadToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`📝 Campo actualizado: ${name} = ${value}`);
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('💾 Intentando guardar unidad:', formData);
    setLoading(true);
    setError('');
    
    try {
      let result;
      if (unidadToEdit) {
        console.log('🔄 Actualizando unidad ID:', unidadToEdit.id);
        result = await parametrosApi.updateUnidadMedida(unidadToEdit.id, formData);
      } else {
        console.log('➕ Creando nueva unidad');
        result = await parametrosApi.createUnidadMedida(formData);
      }
      console.log('✅ Unidad guardada:', result);
      onSave(result);
    } catch (err) {
      console.error("❌ Error al guardar unidad:", err);
      console.error("📝 Mensaje:", err.message);
      setError(err.message || "Error al guardar la unidad.");
    } finally {
      setLoading(false);
    }
  };

  // 🐛 Debug: Mostrar estado actual
  useEffect(() => {
    console.log('🔍 Estado actual del componente:', {
      tipos,
      cantidadTipos: tipos.length,
      formData,
      loading,
      error,
      unidadToEdit: unidadToEdit ? 'Existe' : 'null'
    });
  }, [tipos, formData, loading, error, unidadToEdit]);

  return (
    <div className="p-4 border rounded bg-gray-50">
      <h3 className="text-lg font-bold mb-2">
        {unidadToEdit ? 'Editar Unidad' : 'Crear Nueva Unidad'}
      </h3>
      
      {error && <p className="text-red-500 mb-2">{error}</p>}
      
      {/* 🐛 Panel de debug (puedes quitarlo después) */}
      <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
        <strong>🐛 Debug Info:</strong>
        <div>Tipos cargados: {tipos.length}</div>
        <div>Tipos: {JSON.stringify(tipos)}</div>
        <div>Tipo seleccionado: {formData.tipo}</div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium">Nombre *</label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
            placeholder="Ej: Kilogramo"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Símbolo *</label>
          <input
            type="text"
            name="simbolo"
            value={formData.simbolo}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
            placeholder="Ej: kg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Descripción</label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            rows="3"
            placeholder="Descripción opcional"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Tipo *</label>
          <select
            name="tipo"
            value={formData.tipo}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
            disabled={tipos.length === 0}
          >
            {tipos.length > 0 ? (
              tipos.map(tipo => (
                <option key={tipo} value={tipo}>
                  {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </option>
              ))
            ) : (
              <option value="">Cargando tipos...</option>
            )}
          </select>
          {tipos.length === 0 && (
            <p className="text-xs text-gray-500 mt-1">
              ⏳ Esperando tipos desde el servidor...
            </p>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            disabled={loading || tipos.length === 0}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
