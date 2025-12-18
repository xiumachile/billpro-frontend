// src/components/parametros/UnidadesMedida/UnidadMedidaList.jsx
import React, { useEffect, useState } from 'react';
import { parametrosApi } from '../../../api/parametrosApi';

export default function UnidadMedidaList({ onEdit, onDelete }) {
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await parametrosApi.getUnidadesMedida();
        setUnidades(data);
      } catch (err) {
        console.error("Error al cargar unidades:", err);
        setError(err.message || "Error al cargar las unidades.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Cargando unidades...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Unidades de Medida</h2>
      <ul className="space-y-2">
        {unidades.map((unidad) => (
          <li key={unidad.id} className="flex justify-between items-center p-2 border rounded">
            <span>
              {unidad.nombre} ({unidad.simbolo}) - {unidad.tipo}
            </span>
            <div>
              <button
                onClick={() => onEdit(unidad)}
                className="mr-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Editar
              </button>
              <button
                onClick={() => onDelete(unidad.id)}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
