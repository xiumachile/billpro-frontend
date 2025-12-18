// src/components/pedido/MesaManager.jsx

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package, Layout, Users, User, CheckCircle2 } from 'lucide-react';
import TomarPedidoManager from './TomarPedidoManager';

export default function MesaManager({ usuario, onVolver }) {
  const [showTomarPedido, setShowTomarPedido] = useState(false);

  const [pedidoActual, setPedidoActual] = useState(null);
  const [numeroMesa, setNumeroMesa] = useState('');
  const [numeroPersonas, setNumeroPersonas] = useState(1);

  const handleVolver = () => {
    if (showTomarPedido) {
      setShowTomarPedido(false);
    } else {
      if (typeof onVolver === 'function') {
        onVolver();
      } else {
        window.history.back();
      }
    }
  };

  const handleCrearPedido = () => {
    if (!numeroMesa.trim()) {
      alert('⚠️ Ingresa el número de mesa.');
      return;
    }
    if (numeroPersonas < 1) {
      alert('⚠️ El número de personas debe ser al menos 1.');
      return;
    }
    setShowTomarPedido(true);
  };

  const handlePedidoCreado = (pedido) => {
    setPedidoActual(pedido);
    setShowTomarPedido(false);
    alert(`✅ Pedido para la mesa ${numeroMesa} creado correctamente.`);
  };

  const handleCancelarPedido = () => {
    setShowTomarPedido(false);
  };

  if (showTomarPedido) {
    return (
      <TomarPedidoManager
        usuario={usuario}
        tipoPedido="mesa"
        mesa={{ nombre: `Mesa ${numeroMesa}`, id: numeroMesa }}
        numeroPersonas={numeroPersonas}
        onVolver={handleCancelarPedido}
        onPedidoCreado={handlePedidoCreado}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <button
                onClick={handleVolver}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span>Volver</span>
              </button>
              <div className="h-8 w-px bg-gray-200" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                  <Layout className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Módulo Mesa</h1>
                  <p className="text-sm text-gray-500">Toma de pedidos en mesa</p>
                </div>
              </div>
            </div>
            
            {usuario && (
              <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-lg border border-blue-100">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {usuario.nombre_completo?.charAt(0).toUpperCase() || usuario.username?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-xs text-blue-700">Usuario activo</p>
                  <p className="text-sm font-semibold text-gray-700">
                    {usuario.nombre_completo || usuario.username || 'Usuario'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layout className="w-5 h-5" />
              Panel de Control Mesa
            </h2>
          </div>
          <div className="p-8 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Layout className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Comienza a tomar pedidos</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              Ingresa el número de mesa y el número de personas para comenzar a tomar el pedido.
            </p>
            <div className="max-w-sm mx-auto space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Número de Mesa *</label>
                <input
                  type="text"
                  value={numeroMesa}
                  onChange={(e) => setNumeroMesa(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg font-bold"
                  placeholder="Ej: 5, A1, VIP2"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Número de Personas</label>
                <input
                  type="number"
                  min="1"
                  value={numeroPersonas}
                  onChange={(e) => setNumeroPersonas(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                />
              </div>
            </div>
            <button
              onClick={handleCrearPedido}
              disabled={!numeroMesa.trim()}
              className="mt-6 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-3 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Package className="w-6 h-6" />
              <span>Crear Pedido para Mesa {numeroMesa || 'X'}</span>
            </button>
          </div>
        </div>

        {/* Historial (opcional) */}
        {/* <div className="mt-6 bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 border-b">
            <h3 className="text-lg font-bold text-gray-900">Historial de Pedidos</h3>
          </div>
          <div className="p-6">
            {pedidoActual ? (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">Pedido #{pedidoActual.id} creado</p>
                  <p className="text-sm text-green-700 mt-1">Mesa: {pedidoActual.mesa?.nombre || 'Desconocida'}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Aún no has creado ningún pedido.</p>
            )}
          </div>
        </div> */}
      </div>
    </div>
  );
}
