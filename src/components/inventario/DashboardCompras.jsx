import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, DollarSign, FileText, AlertCircle } from 'lucide-react';
import { inventarioApi } from '../../api/inventarioApi';

export default function DashboardCompras() {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rango, setRango] = useState('mes-actual'); // mes-actual | mes-pasado | ultimos-30

  /* ---------- HELPERS DE FECHA ---------- */
  const formatYMD = (date) => date.toISOString().slice(0, 10);

  const getRangoFechas = (tipo) => {
    const hoy = new Date();
    let desde, hasta;
    switch (tipo) {
      case 'mes-actual':
        desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        hasta = hoy;
        break;
      case 'mes-pasado':
        desde = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        hasta = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
        break;
      case 'ultimos-30':
        desde = new Date();
        desde.setDate(hoy.getDate() - 30);
        hasta = hoy;
        break;
      default:
        return getRangoFechas('mes-actual');
    }
    return { desde: formatYMD(desde), hasta: formatYMD(hasta) };
  };

  /* ---------- CARGAR COMPRAS ---------- */
  const cargarCompras = async () => {
    setLoading(true);
    const { desde, hasta } = getRangoFechas(rango);
    try {
      const data = await inventarioApi.getCompras({ fecha_desde: desde, fecha_hasta: hasta });
      setCompras(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Error al cargar compras:', error);
      setCompras([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCompras();
  }, [rango]);

  /* ---------- CÁLCULOS ---------- */
  const totales = compras.reduce(
    (acc, c) => {
      const total = parseFloat(c.total) || 0;
      const pendiente = parseFloat(c.saldo_pendiente) || 0;
      const pagado = Math.max(0, total - pendiente);
      return {
        compras: acc.compras + 1,
        total: acc.total + total,
        pagado: acc.pagado + pagado,
        pendiente: acc.pendiente + pendiente,
      };
    },
    { compras: 0, total: 0, pagado: 0, pendiente: 0 }
  );

  const datosPorEstado = compras.reduce(
    (acc, c) => {
      if (c.estado === 'pendiente') acc.pendiente++;
      else if (c.estado === 'parcial') acc.parcial++;
      else if (c.estado === 'pagado') acc.pagado++;
      return acc;
    },
    { pendiente: 0, parcial: 0, pagado: 0 }
  );

  const datosEstado = [
    { name: 'Pendiente', value: datosPorEstado.pendiente, color: '#ef4444' },
    { name: 'Parcial', value: datosPorEstado.parcial, color: '#eab308' },
    { name: 'Pagado', value: datosPorEstado.pagado, color: '#22c55e' },
  ];

  const topProveedores = (() => {
    const map = {};
    compras.forEach((c) => {
      const id = c.proveedor_id;
      if (!map[id])
        map[id] = { nombre: c.proveedor_nombre || `Proveedor ${id}`, total: 0, compras: 0, pagado: 0 };
      const total = parseFloat(c.total) || 0;
      const pendiente = parseFloat(c.saldo_pendiente) || 0;
      const pagado = Math.max(0, total - pendiente);
      map[id].total += total;
      map[id].compras += 1;
      map[id].pagado += pagado;
    });
    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  })();

  const datosPorDia = (() => {
    const dias = {};
    const { desde, hasta } = getRangoFechas(rango);
    const start = new Date(desde);
    const end = new Date(hasta);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = formatYMD(d);
      dias[key] = { fecha: key, compras: 0, monto: 0, pagado: 0 };
    }
    compras.forEach((c) => {
      const key = c.fecha.slice(0, 10);
      if (dias[key]) {
        const total = parseFloat(c.total) || 0;
        const pendiente = parseFloat(c.saldo_pendiente) || 0;
        const pagado = Math.max(0, total - pendiente);
        dias[key].compras += 1;
        dias[key].monto += total;
        dias[key].pagado += pagado;
      }
    });
    return Object.values(dias).map((d) => ({
      ...d,
      label: new Date(d.fecha).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
    }));
  })();

  const porcentajePago = totales.total > 0 ? ((totales.pagado / totales.total) * 100).toFixed(1) : 0;

  /* ---------- RENDER ---------- */
  if (loading)
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!loading && compras.length === 0)
    return (
      <div className="text-center py-12 text-gray-500">
        No hay compras en el período seleccionado.
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Selector de rango */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-purple-600" />
          Dashboard de Compras
        </h2>
        <div className="flex gap-2">
          {['mes-actual', 'mes-pasado', 'ultimos-30'].map((btn) => (
            <button
              key={btn}
              onClick={() => setRango(btn)}
              className={`px-3 py-2 rounded-lg text-sm border transition ${
                rango === btn
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {btn === 'mes-actual' ? 'Mes actual' : btn === 'mes-pasado' ? 'Mes pasado' : 'Últimos 30 días'}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Facturas</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{totales.compras}</p>
            </div>
            <FileText className="w-10 h-10 text-blue-400 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Total Compras</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">${totales.total.toFixed(0)}</p>
            </div>
            <DollarSign className="w-10 h-10 text-purple-400 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Total Pagado</p>
              <p className="text-3xl font-bold text-green-900 mt-2">${totales.pagado.toFixed(0)}</p>
              <p className="text-xs text-green-600 mt-1">{porcentajePago}% pagado</p>
            </div>
            <div className="w-10 h-10 bg-green-300 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-green-700">✓</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Por Pagar</p>
              <p className="text-3xl font-bold text-red-900 mt-2">${totales.pendiente.toFixed(0)}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-red-400 opacity-50" />
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Compras y Pagos por Día</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={datosPorDia}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value) => value.toFixed(0)}
              />
              <Legend />
              <Line type="monotone" dataKey="monto" stroke="#9333ea" strokeWidth={2} name="Monto Compras" />
              <Line type="monotone" dataKey="pagado" stroke="#22c55e" strokeWidth={2} name="Monto Pagado" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Facturas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={datosEstado}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {datosEstado.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {datosEstado.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-gray-600">
                  {item.name}: {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Proveedores */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Proveedores</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-3 text-left font-semibold text-gray-700">Proveedor</th>
                <th className="p-3 text-right font-semibold text-gray-700">Facturas</th>
                <th className="p-3 text-right font-semibold text-gray-700">Total Compras</th>
                <th className="p-3 text-right font-semibold text-gray-700">Total Pagado</th>
                <th className="p-3 text-right font-semibold text-gray-700">Por Pagar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {topProveedores.map((prov, idx) => {
                const pendiente = prov.total - prov.pagado;
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="p-3 font-semibold text-gray-900">{prov.nombre}</td>
                    <td className="p-3 text-right text-gray-700">{prov.compras}</td>
                    <td className="p-3 text-right font-semibold">${prov.total.toFixed(2)}</td>
                    <td className="p-3 text-right text-green-600 font-semibold">${prov.pagado.toFixed(2)}</td>
                    <td
                      className={`p-3 text-right font-semibold ${
                        pendiente > 0 ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      ${pendiente.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gráfico de barras */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Compras por Proveedor (Top 5)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topProveedores}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="nombre" stroke="#6b7280" angle={-45} textAnchor="end" height={80} />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              formatter={(value) => `${value.toFixed(0)}`}
            />
            <Legend />
            <Bar dataKey="total" fill="#9333ea" name="Total Compras" />
            <Bar dataKey="pagado" fill="#22c55e" name="Total Pagado" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
