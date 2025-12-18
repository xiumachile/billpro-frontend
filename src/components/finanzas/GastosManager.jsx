import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { finanzasApi } from '../../api/finanzasApi';
import RegistrarGasto from './RegistrarGasto';
import { ArrowLeft, Plus, Trash2, Search, DollarSign } from 'lucide-react';

export default function GastosManager() {
  const navigate = useNavigate();
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Filtros simples
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  useEffect(() => {
    cargarGastos();
  }, [mes]);

  const cargarGastos = async () => {
    setLoading(true);
    try {
        // Calculamos inicio y fin del mes seleccionado
        const fechaDesde = `${mes}-01`;
        const fechaHasta = `${mes}-31`;
        
        const data = await finanzasApi.getGastos({ fecha_desde: fechaDesde, fecha_hasta: fechaHasta });
        setGastos(data);
    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este gasto?")) return;
    try {
        await finanzasApi.eliminarGasto(id);
        cargarGastos();
    } catch (error) {
        alert("Error al eliminar");
    }
  };

  const totalMes = gastos.reduce((sum, g) => sum + parseFloat(g.monto), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 bg-white border rounded-full hover:bg-gray-100">
                <ArrowLeft size={20}/>
            </button>
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Gastos Operativos</h1>
                <p className="text-sm text-gray-500">Control de egresos del negocio</p>
            </div>
        </div>
        <button 
            onClick={() => setShowModal(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow hover:bg-red-700 font-bold"
        >
            <Plus size={18}/> Nuevo Gasto
        </button>
      </div>

      {/* Filtros y Resumen */}
      <div className="max-w-5xl mx-auto bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-600">Filtrar por Mes:</span>
              <input 
                type="month" 
                value={mes} 
                onChange={e => setMes(e.target.value)}
                className="border p-2 rounded-lg text-sm"
              />
          </div>
          <div className="text-right">
              <p className="text-sm text-gray-500">Total Gastos ({mes})</p>
              <p className="text-2xl font-black text-red-600">${Math.round(totalMes).toLocaleString('es-CL')}</p>
          </div>
      </div>

      {/* Tabla */}
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-600 border-b">
                <tr>
                    <th className="p-4">Fecha</th>
                    <th className="p-4">Categoría</th>
                    <th className="p-4">Descripción</th>
                    <th className="p-4">Método</th>
                    <th className="p-4 text-right">Monto</th>
                    <th className="p-4 text-center">Acción</th>
                </tr>
            </thead>
            <tbody>
                {loading ? (
                    <tr><td colSpan="6" className="p-8 text-center">Cargando...</td></tr>
                ) : gastos.length === 0 ? (
                    <tr><td colSpan="6" className="p-8 text-center text-gray-400">No hay gastos registrados este mes.</td></tr>
                ) : (
                    gastos.map(g => (
                        <tr key={g.id} className="border-b hover:bg-gray-50">
                            <td className="p-4 font-mono text-gray-500">{g.fecha_gasto}</td>
                            <td className="p-4 font-bold text-gray-700">
                                <span className="bg-gray-200 px-2 py-1 rounded text-xs">{g.categoria?.nombre}</span>
                            </td>
                            <td className="p-4 text-gray-600">
                                {g.descripcion}
                                {g.referencia && <span className="block text-xs text-blue-600">Ref: {g.referencia}</span>}
                            </td>
                            <td className="p-4 text-gray-500 text-xs">{g.metodo_pago}</td>
                            <td className="p-4 text-right font-bold text-red-600">-${Math.round(g.monto).toLocaleString()}</td>
                            <td className="p-4 text-center">
                                <button onClick={() => handleEliminar(g.id)} className="text-gray-400 hover:text-red-500">
                                    <Trash2 size={16}/>
                                </button>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
      </div>

      {showModal && (
          <RegistrarGasto 
            onClose={() => setShowModal(false)} 
            onGastoGuardado={cargarGastos} 
          />
      )}
    </div>
  );
}
