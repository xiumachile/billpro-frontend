// src/components/inventario/ResumenTransacciones.jsx
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { inventarioApi } from './api/inventarioApi';

export default function ResumenTransacciones() {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarCompras();
  }, []);

  const cargarCompras = async () => {
    try {
      const data = await inventarioApi.getCompras();
      setCompras(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar compras:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular totales
  const totales = compras.reduce((acc, c) => ({
    compras: acc.compras + 1,
    total: acc.total + (parseFloat(c.total) || 0),
    pagado: acc.pagado + (parseFloat(c.total_pagado) || 0),
    pendiente: acc.pendiente + Math.max(0, (parseFloat(c.total) || 0) - (parseFloat(c.total_pagado) || 0)),
    pagadas: acc.pagadas + (c.estado === 'pagado' ? 1 : 0),
    parciales: acc.parciales + (c.estado === 'parcial' ? 1 : 0),
    pendientes: acc.pendientes + (c.estado === 'pendiente' ? 1 : 0)
  }), { compras: 0, total: 0, pagado: 0, pendiente: 0, pagadas: 0, parciales: 0, pendientes: 0 });

  const porcentajePago = totales.total > 0 ? ((totales.pagado / totales.total) * 100).toFixed(1) : 0;

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tarjetas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Compras */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-blue-600 font-medium">Total Compras</p>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-blue-900">${totales.total.toFixed(0)}</p>
          <p className="text-xs text-blue-600 mt-1">{totales.compras} facturas</p>
        </div>

        {/* Total Pagado */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-green-600 font-medium">Total Pagado</p>
            <CheckCircle className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-900">${totales.pagado.toFixed(0)}</p>
          <p className="text-xs text-green-600 mt-1">{porcentajePago}% pagado</p>
        </div>

        {/* Por Pagar */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-red-600 font-medium">Por Pagar</p>
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-900">${totales.pendiente.toFixed(0)}</p>
          <p className="text-xs text-red-600 mt-1">{totales.pendientes} facturas pendientes</p>
        </div>

        {/* Promedio por Compra */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-purple-600 font-medium">Promedio por Compra</p>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-purple-900">
            ${totales.compras > 0 ? (totales.total / totales.compras).toFixed(0) : 0}
          </p>
          <p className="text-xs text-purple-600 mt-1">por factura</p>
        </div>
      </div>

      {/* Desglose de Estados */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Desglose por Estado</h3>
        <div className="grid grid-cols-3 gap-3">
          {/* Pagadas */}
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <p className="text-xs text-green-600 font-medium mb-1">Pagadas</p>
            <p className="text-xl font-bold text-green-900">{totales.pagadas}</p>
            <div className="w-full bg-green-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${totales.compras > 0 ? (totales.pagadas / totales.compras) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Parciales */}
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-600 font-medium mb-1">Parciales</p>
            <p className="text-xl font-bold text-yellow-900">{totales.parciales}</p>
            <div className="w-full bg-yellow-200 rounded-full h-2 mt-2">
              <div 
                className="bg-yellow-600 h-2 rounded-full" 
                style={{ width: `${totales.compras > 0 ? (totales.parciales / totales.compras) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Pendientes */}
          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
            <p className="text-xs text-red-600 font-medium mb-1">Pendientes</p>
            <p className="text-xl font-bold text-red-900">{totales.pendientes}</p>
            <div className="w-full bg-red-200 rounded-full h-2 mt-2">
              <div 
                className="bg-red-600 h-2 rounded-full" 
                style={{ width: `${totales.compras > 0 ? (totales.pendientes / totales.compras) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Últimas Compras */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Últimas 5 Compras</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {compras.slice(0, 5).map(c => {
            const deuda = (parseFloat(c.total) || 0) - (parseFloat(c.total_pagado) || 0);
            return (
              <div key={c.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">#{c.numero_factura || c.id}</p>
                  <p className="text-xs text-gray-500">{c.proveedor_nombre}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">${deuda.toFixed(2)}</p>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    c.estado === 'pagado' ? 'bg-green-100 text-green-800' :
                    c.estado === 'parcial' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {c.estado}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
