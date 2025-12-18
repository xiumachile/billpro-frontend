// src/components/inventario/BotonesPago.jsx
import React, { useState } from 'react';
import { DollarSign, FileText } from 'lucide-react';
import PagoModal from './PagoModal';
import PagoMultiplesFacturas from './PagoMultiplesFacturas';

export default function BotonesPago({ compra, onPagoExitoso }) {
  const [mostrarPagoSingle, setMostrarPagoSingle] = useState(false);
  const [mostrarPagoMultiple, setMostrarPagoMultiple] = useState(false);

  const handleCerrarPago = () => {
    setMostrarPagoSingle(false);
  };

  const handleCerrarPagoMultiple = () => {
    setMostrarPagoMultiple(false);
  };

  const handlePagoExitoso = () => {
    if (onPagoExitoso) {
      onPagoExitoso();
    }
    setMostrarPagoSingle(false);
    setMostrarPagoMultiple(false);
  };

  return (
    <>
      <div className="flex gap-2">
        {/* Botón de Pago Individual (si compra viene como prop) */}
        {compra && (
          <button
            onClick={() => setMostrarPagoSingle(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white rounded-lg font-medium transition-all"
            title="Registrar pago para esta factura"
          >
            <DollarSign className="w-4 h-4" />
            Pagar Factura
          </button>
        )}

        {/* Botón de Pago Múltiple */}
        <button
          onClick={() => setMostrarPagoMultiple(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all"
          title="Pagar múltiples facturas"
        >
          <FileText className="w-4 h-4" />
          Pago Múltiple
        </button>
      </div>

      {/* Modal Pago Individual */}
      {mostrarPagoSingle && compra && (
        <PagoModal
          compra={compra}
          onClose={handleCerrarPago}
        />
      )}

      {/* Modal Pago Múltiple */}
      {mostrarPagoMultiple && (
        <PagoMultiplesFacturas
          onClose={handleCerrarPagoMultiple}
          onPagoExitoso={handlePagoExitoso}
        />
      )}
    </>
  );
}
