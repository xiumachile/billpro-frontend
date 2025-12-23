import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, Layout } from 'lucide-react';
import { menuApi } from '../../api/menuApi';

export default function EditarCartaModal({ isOpen, onClose, carta, onUpdate }) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo_precio_id: 1
  });
  const [tiposPrecios, setTiposPrecios] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && carta) {
      setFormData({
        nombre: carta.nombre,
        descripcion: carta.descripcion || '',
        tipo_precio_id: carta.tipo_precio_id || 1
      });
      cargarListas();
    }
  }, [isOpen, carta]);

  const cargarListas = async () => {
    try {
      const res = await menuApi.getTiposPrecios();
      setTiposPrecios(Array.isArray(res) ? res : (res.data || []));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return alert("Nombre obligatorio");

    setLoading(true);
    try {
      // ✅ Enviamos el ID de la lista de precios al actualizar
      await onUpdate(carta.id, {
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          tipo_precio_id: parseInt(formData.tipo_precio_id)
      });
      onClose();
    } catch (e) {
      alert("Error al actualizar");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1300] p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-blue-600 px-6 py-4 flex justify-between items-center text-white">
            <h3 className="text-lg font-bold flex items-center gap-2"><Layout size={20}/> Editar Carta</h3>
            <button onClick={onClose}><X size={20}/></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre</label>
                <input className="w-full border p-2 rounded" value={formData.nombre} onChange={e=>setFormData({...formData, nombre: e.target.value})} autoFocus/>
            </div>
            
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
                    <DollarSign size={14} className="text-green-600"/> Lista de Precios
                </label>
                <select 
                    className="w-full border p-2 rounded bg-white"
                    value={formData.tipo_precio_id}
                    onChange={e=>setFormData({...formData, tipo_precio_id: e.target.value})}
                >
                    {tiposPrecios.map(tp => (
                        <option key={tp.id} value={tp.id}>{tp.nombre} {tp.id===1?'(Base)':''}</option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Define qué precios usará esta carta.</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea className="w-full border p-2 rounded" rows="2" value={formData.descripcion} onChange={e=>setFormData({...formData, descripcion: e.target.value})} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded font-bold shadow hover:bg-blue-700">
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}
