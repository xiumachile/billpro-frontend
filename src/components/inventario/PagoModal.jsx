import React, { useState, useEffect } from 'react';
import { X, DollarSign, CreditCard, Calendar, Inbox } from 'lucide-react';
import { inventarioApi } from "../../api/inventarioApi";
import cajaService from '../../services/cajaService';

export default function PagoModal({ compra, onClose, onPagoExitoso }) {
  // ... (tus estados existentes: monto, formasPago, etc.) ...
  const [monto, setMonto] = useState('');
  const [formasPago, setFormasPago] = useState([]);
  const [formaPagoId, setFormaPagoId] = useState('');
  const [referencia, setReferencia] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // ✅ NUEVOS ESTADOS PARA SELECCIÓN DE CAJA
  const [listaSesiones, setListaSesiones] = useState([]); // Todas las cajas abiertas
  const [sesionSeleccionadaId, setSesionSeleccionadaId] = useState(''); // Cuál eligió el admin
  const [esEfectivo, setEsEfectivo] = useState(false);

  // ... (cálculos de deuda se mantienen igual) ...
  const totalFactura = parseFloat(compra.total) || 0;
  const deudaPendiente = parseFloat(compra.saldo_pendiente) || 0;

  useEffect(() => { setMonto(deudaPendiente.toFixed(2)); }, [deudaPendiente]);

  // ✅ CARGA DE DATOS (MODIFICADA)
  useEffect(() => {
    const init = async () => {
        try {
            setLoadingData(true);
            const [formasRes, sesionesRes] = await Promise.all([
                inventarioApi.getFormasPago(),
                cajaService.getSesionesActivas() // Traemos TODAS las cajas abiertas
            ]);

            setFormasPago(Array.isArray(formasRes) ? formasRes : []);
            
            const sesiones = sesionesRes.data || [];
            setListaSesiones(sesiones);

            // Si solo hay una caja abierta, la seleccionamos automáticamente
            if (sesiones.length === 1) {
                setSesionSeleccionadaId(sesiones[0].id);
            }

        } catch (e) {
            console.error(e);
            alert("Error cargando datos de pago");
        } finally {
            setLoadingData(false);
        }
    };
    init();
  }, []);

  // Detectar efectivo
  useEffect(() => {
      const f = formasPago.find(item => String(item.id) === String(formaPagoId));
      setEsEfectivo(f && f.nombre.toLowerCase().includes('efectivo'));
  }, [formaPagoId, formasPago]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!monto || parseFloat(monto) <= 0) return alert('Monto inválido.');
    if (!formaPagoId) return alert('Selecciona forma de pago.');

    // ✅ VALIDACIÓN: Si es efectivo, OBLIGATORIO seleccionar caja
    if (esEfectivo) {
        if (listaSesiones.length === 0) {
            return alert("⛔ No hay ninguna caja abierta en el local para sacar dinero.");
        }
        if (!sesionSeleccionadaId) {
            return alert("⚠️ Selecciona de qué caja saldrá el dinero.");
        }
    }

    setLoading(true);
    try {
      const pagoData = {
        compra_id: compra.id,
        forma_pago_id: parseInt(formaPagoId),
        monto: parseFloat(monto),
        fecha_pago: fechaPago,
        referencia: referencia || null,
        observaciones: observaciones || null,
        // ✅ ENVIAMOS LA SESIÓN SELECCIONADA
        caja_sesion_id: esEfectivo ? parseInt(sesionSeleccionadaId) : null 
      };

      await inventarioApi.registrarCompraPago(pagoData);
      alert('Pago registrado correctamente');
      if (onPagoExitoso) onPagoExitoso();
      onClose();
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) return <div className="p-10 text-center">Cargando...</div>;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Registrar Pago</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* ... Inputs de Monto y Forma de Pago ... */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Monto a pagar</label>
            <input type="number" value={monto} onChange={e=>setMonto(e.target.value)} className="w-full border p-2 rounded"/>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Forma de pago</label>
            <select value={formaPagoId} onChange={e=>setFormaPagoId(e.target.value)} className="w-full border p-2 rounded">
                <option value="">Seleccionar...</option>
                {formasPago.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
            </select>
          </div>

          {/* ✅ SELECCIÓN DE CAJA (Solo si es efectivo) */}
          {esEfectivo && (
              <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                  <label className="block text-xs font-bold text-orange-800 mb-1 flex items-center gap-1">
                      <Inbox size={14}/> Origen del Dinero (Caja Abierta)
                  </label>
                  
                  {listaSesiones.length > 0 ? (
                      <select 
                        value={sesionSeleccionadaId} 
                        onChange={e => setSesionSeleccionadaId(e.target.value)}
                        className="w-full border p-2 rounded text-sm bg-white"
                      >
                          <option value="">-- Seleccionar Caja --</option>
                          {listaSesiones.map(s => (
                              <option key={s.id} value={s.id}>
                                  {s.nombre_caja} ({s.usuario}) - Inicio: ${parseInt(s.monto_inicial).toLocaleString()}
                              </option>
                          ))}
                      </select>
                  ) : (
                      <p className="text-xs text-red-600 font-bold">⛔ No hay cajas abiertas. No puedes pagar en efectivo.</p>
                  )}
              </div>
          )}

          {/* ... Resto de campos (Fecha, Referencia, Botones) ... */}
          <div className="flex gap-2">
              <input type="date" value={fechaPago} onChange={e=>setFechaPago(e.target.value)} className="border p-2 rounded flex-1 text-sm"/>
              <input type="text" placeholder="Ref." value={referencia} onChange={e=>setReferencia(e.target.value)} className="border p-2 rounded flex-1 text-sm"/>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded">Cancelar</button>
            <button 
                type="submit" 
                disabled={loading || (esEfectivo && !sesionSeleccionadaId)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded font-bold disabled:bg-gray-400"
            >
                {loading ? '...' : 'Pagar'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
