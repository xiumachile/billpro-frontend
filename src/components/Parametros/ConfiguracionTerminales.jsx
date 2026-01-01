import React, { useState, useEffect } from 'react';
import axios from '../../api/axiosInstance';
import { Monitor, Smartphone, Trash2, RefreshCw, AlertCircle, Laptop } from 'lucide-react';
import { getTerminalId } from '../../utils/terminalId';

export default function ConfiguracionTerminales() {
  const [terminals, setTerminals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUUID, setCurrentUUID] = useState('');

  useEffect(() => {
    setCurrentUUID(getTerminalId());
    fetchTerminals();
  }, []);

  const fetchTerminals = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/terminals');
      setTerminals(res.data);
    } catch (error) {
      console.error("Error cargando terminales", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, uuid) => {
    if (uuid === currentUUID) {
      alert("No puedes eliminar el terminal que estás usando actualmente.");
      return;
    }

    if (!window.confirm("¿Seguro que quieres desconectar este dispositivo? Dejará de tener acceso hasta que se registre nuevamente.")) {
      return;
    }

    try {
      await axios.delete(`/terminals/${id}`);
      fetchTerminals(); // Recargar lista
    } catch (error) {
      alert("Error al eliminar terminal");
    }
  };

  const getIcon = (type) => {
    if (type === 'mobile') return <Smartphone className="text-blue-500" />;
    return <Monitor className="text-purple-600" />;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Dispositivos Vinculados</h2>
            <p className="text-gray-500 text-sm">Gestiona los equipos que tienen acceso al sistema</p>
        </div>
        <button 
            onClick={fetchTerminals} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Dispositivo</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Tipo</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Última Conexión</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {terminals.map((term) => (
              <tr key={term.id} className={term.uuid === currentUUID ? "bg-purple-50" : "hover:bg-gray-50"}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                        {getIcon(term.type)}
                    </div>
                    <div>
                        <p className="font-bold text-gray-800">{term.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{term.uuid.substring(0, 8)}...</p>
                    </div>
                    {term.uuid === currentUUID && (
                        <span className="bg-purple-200 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            ESTE EQUIPO
                        </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                    <span className="capitalize text-sm text-gray-600">{term.type === 'desktop' ? 'PC / Caja' : 'Móvil / Tablet'}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(term.last_seen_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right">
                    {term.uuid !== currentUUID && (
                        <button 
                            onClick={() => handleDelete(term.id, term.uuid)}
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                            title="Desconectar y liberar cupo"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {terminals.length === 0 && !loading && (
            <div className="p-8 text-center text-gray-400">
                No hay terminales registradas.
            </div>
        )}
      </div>

      <div className="mt-4 flex items-start gap-2 text-sm text-gray-500 bg-blue-50 p-4 rounded-xl border border-blue-100">
        <AlertCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={18} />
        <p>
            Si eliminas un dispositivo, se liberará un cupo en tu licencia. 
            El dispositivo eliminado perderá el acceso inmediatamente y tendrá que ser registrado nuevamente.
        </p>
      </div>
    </div>
  );
}
