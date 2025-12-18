// src/components/Parametros/UnidadesMedidaManager.jsx
import React, { useState, useEffect } from 'react';
import { parametrosApi } from '../../api/parametrosApi';

export default function UnidadesMedidaManager({ usuario }) {
  const [unidades, setUnidades] = useState([]);
  const [factores, setFactores] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showUnidadForm, setShowUnidadForm] = useState(false);
  const [unidadToEdit, setUnidadToEdit] = useState(null);
  const [showFactorForm, setShowFactorForm] = useState(false);
  const [factorToEdit, setFactorToEdit] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [unidadesRes, factoresRes, tiposRes] = await Promise.all([
        parametrosApi.getUnidadesMedida(),
        parametrosApi.getFactoresConversion(),
        parametrosApi.getTiposUnidad()
      ]);
      
      setUnidades(Array.isArray(unidadesRes) ? unidadesRes : []);
      setFactores(Array.isArray(factoresRes) ? factoresRes : []);
      setTipos(Array.isArray(tiposRes) ? tiposRes : []);
    } catch (err) {
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUnidad = () => {
    setUnidadToEdit(null);
    setShowUnidadForm(true);
  };

  const handleEditUnidad = (unidad) => {
    setUnidadToEdit(unidad);
    setShowUnidadForm(true);
  };

  const handleSaveUnidad = async (unidadData) => {
    try {
      let unidad;
      if (unidadToEdit) {
        unidad = await parametrosApi.updateUnidadMedida(unidadToEdit.id, unidadData);
        setUnidades(prev => prev.map(u => u.id === unidad.id ? unidad : u));
      } else {
        unidad = await parametrosApi.createUnidadMedida(unidadData);
        setUnidades(prev => [...prev, unidad]);
      }
      setShowUnidadForm(false);
      setUnidadToEdit(null);
      alert('✅ Unidad guardada');
    } catch (err) {
      alert('❌ Error al guardar: ' + (err.message || 'Inténtalo de nuevo'));
    }
  };

  const handleDeleteUnidad = async (id) => {
    if (!window.confirm('¿Eliminar unidad?')) return;
    try {
      await parametrosApi.deleteUnidadMedida(id);
      setUnidades(prev => prev.filter(u => u.id !== id));
      alert('✅ Unidad eliminada');
    } catch (err) {
      alert('❌ Error al eliminar: ' + (err.message || 'No se puede eliminar si está en uso'));
    }
  };

  const handleCreateFactor = () => {
    setFactorToEdit(null);
    setShowFactorForm(true);
  };

  const handleEditFactor = (factor) => {
    setFactorToEdit(factor);
    setShowFactorForm(true);
  };

  const handleSaveFactor = async (factorData) => {
    try {
      let factor;
      if (factorToEdit) {
        factor = await parametrosApi.updateFactorConversion(factorToEdit.id, factorData);
      } else {
        factor = await parametrosApi.createFactorConversion(factorData);
      }
      
      await loadData();
      
      setShowFactorForm(false);
      setFactorToEdit(null);
      alert('✅ Factor guardado');
    } catch (err) {
      const msg = err?.messages 
        ? Object.values(err.messages).flat().join(', ')
        : (err.message || 'Inténtalo de nuevo');
      alert(`❌ Error al guardar: ${msg}`);
    }
  };

  const handleDeleteFactor = async (id) => {
    if (!window.confirm('¿Eliminar factor de conversión?')) return;
    try {
      await parametrosApi.deleteFactorConversion(id);
      setFactores(prev => prev.filter(f => f.id !== id));
      alert('✅ Factor eliminado');
    } catch (err) {
      alert('❌ Error al eliminar: ' + (err.message || 'Inténtalo de nuevo'));
    }
  };

  if (loading) return <div className="p-6 text-center">Cargando unidades y conversiones...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Unidades de Medida y Conversiones</h2>
        <div className="flex gap-2">
          <button
            onClick={handleCreateUnidad}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Nueva Unidad
          </button>
          <button
            onClick={handleCreateFactor}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Nuevo Factor
          </button>
        </div>
      </div>

      {/* Tabla de Unidades */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Unidades de Medida</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Símbolo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {unidades.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No hay unidades registradas
                  </td>
                </tr>
              ) : (
                unidades.map((unidad) => (
                  <tr key={unidad.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{unidad.nombre}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{unidad.simbolo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {unidad.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{unidad.descripcion || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditUnidad(unidad)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteUnidad(unidad.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabla de Factores */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Factores de Conversión</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Origen</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destino</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Factor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {factores.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No hay factores de conversión registrados
                  </td>
                </tr>
              ) : (
                factores.map((factor) => {
                  const origen = factor.unidad_origen || factor.unidadOrigen;
                  const destino = factor.unidad_destino || factor.unidadDestino;

                  return (
                    <tr key={factor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {origen ? (
                          `${origen.nombre} (${origen.simbolo})`
                        ) : (
                          <span className="text-red-500">Sin datos</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {destino ? (
                          `${destino.nombre} (${destino.simbolo})`
                        ) : (
                          <span className="text-red-500">Sin datos</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{factor.factor}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {origen ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {origen.tipo}
                          </span>
                        ) : (
                          <span className="text-red-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditFactor(factor)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteFactor(factor.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Unidad */}
      {showUnidadForm && (
        <UnidadFormModal
          isOpen={showUnidadForm}
          onClose={() => {
            setShowUnidadForm(false);
            setUnidadToEdit(null);
          }}
          unidadToEdit={unidadToEdit}
          onSave={handleSaveUnidad}
          tipos={tipos}
        />
      )}

      {/* Modal Factor */}
      {showFactorForm && (
        <FactorFormModal
          isOpen={showFactorForm}
          onClose={() => {
            setShowFactorForm(false);
            setFactorToEdit(null);
          }}
          factorToEdit={factorToEdit}
          onSave={handleSaveFactor}
          unidades={unidades}
        />
      )}
    </div>
  );
}

// === Componentes auxiliares ===

function UnidadFormModal({ isOpen, onClose, unidadToEdit, onSave, tipos }) {
  const [formData, setFormData] = useState({
    nombre: '',
    simbolo: '',
    descripcion: '',
    tipo: tipos[0] || 'otro'
  });

  useEffect(() => {
    if (unidadToEdit) {
      setFormData({
        nombre: unidadToEdit.nombre || '',
        simbolo: unidadToEdit.simbolo || '',
        descripcion: unidadToEdit.descripcion || '',
        tipo: unidadToEdit.tipo || tipos[0] || 'otro'
      });
    } else {
      setFormData({
        nombre: '',
        simbolo: '',
        descripcion: '',
        tipo: tipos[0] || 'otro'
      });
    }
  }, [unidadToEdit, tipos]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-lg font-bold mb-4">
          {unidadToEdit ? 'Editar Unidad' : 'Crear Nueva Unidad'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: Kilogramo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Símbolo *</label>
            <input
              type="text"
              name="simbolo"
              value={formData.simbolo}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: Kg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
            <select
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {tipos.map(tipo => (
                <option key={tipo} value={tipo}>
                  {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="2"
              placeholder="Descripción opcional"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FactorFormModal({ isOpen, onClose, factorToEdit, onSave, unidades }) {
  const [formData, setFormData] = useState({
    unidad_origen_id: '',
    unidad_destino_id: '',
    factor: ''
  });

  useEffect(() => {
    if (factorToEdit) {
      setFormData({
        unidad_origen_id: factorToEdit.unidad_origen_id || '',
        unidad_destino_id: factorToEdit.unidad_destino_id || '',
        factor: factorToEdit.factor || ''
      });
    } else {
      setFormData({
        unidad_origen_id: '',
        unidad_destino_id: '',
        factor: ''
      });
    }
  }, [factorToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.unidad_origen_id || !formData.unidad_destino_id) {
      alert('⚠️ Debes seleccionar ambas unidades');
      return;
    }
    if (formData.unidad_origen_id === formData.unidad_destino_id) {
      alert('⚠️ Las unidades de origen y destino deben ser diferentes');
      return;
    }
    if (!formData.factor || isNaN(parseFloat(formData.factor)) || parseFloat(formData.factor) <= 0) {
      alert('⚠️ El factor debe ser un número válido mayor a 0');
      return;
    }
    onSave({
      unidad_origen_id: parseInt(formData.unidad_origen_id),
      unidad_destino_id: parseInt(formData.unidad_destino_id),
      factor: parseFloat(formData.factor)
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-lg font-bold mb-4">
          {factorToEdit ? 'Editar Factor' : 'Crear Nuevo Factor'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unidad Origen *</label>
            <select
              name="unidad_origen_id"
              value={formData.unidad_origen_id}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Seleccionar unidad...</option>
              {unidades.map(u => (
                <option key={`origen-${u.id}`} value={u.id}>
                  {u.nombre} ({u.simbolo}) - {u.tipo}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unidad Destino *</label>
            <select
              name="unidad_destino_id"
              value={formData.unidad_destino_id}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Seleccionar unidad...</option>
              {unidades.map(u => (
                <option key={`destino-${u.id}`} value={u.id}>
                  {u.nombre} ({u.simbolo}) - {u.tipo}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Factor *</label>
            <input
              type="number"
              step="0.0001"
              name="factor"
              value={formData.factor}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Ej: 1000, 0.001"
            />
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-700">
              <strong>Ejemplo:</strong> 1 Kg = 1000 Gr → Factor = 1000
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
