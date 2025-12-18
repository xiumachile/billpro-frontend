import React, { useState, useEffect } from 'react';
import { finanzasApi } from '../../api/finanzasApi';
import cajaService from '../../services/cajaService';
import { X, Save, DollarSign, Calendar, AlignLeft, Inbox, CreditCard } from 'lucide-react';

export default function RegistrarGasto({ onClose, onGastoGuardado }) {
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState([]);
  
  // Estados del formulario
  const [form, setForm] = useState({
    monto: '',
    fecha_gasto: new Date().toISOString().slice(0, 10),
    descripcion: '',
    gasto_categoria_id: '',
    metodo_pago: 'Transferencia', // Default
    referencia: '',
    caja_sesion_id: ''
  });

  // Estados para lógica de caja
  const [sesionesAbiertas, setSesionesAbiertas] = useState([]);
  const [esCaja, setEsCaja] = useState(false);

  // Carga inicial
  useEffect(() => {
    const init = async () => {
      try {
        const [catRes, sesionesRes] = await Promise.all([
          finanzasApi.getCategorias(),
          cajaService.getSesionesActivas()
        ]);
        setCategorias(catRes);
        setSesionesAbiertas(sesionesRes.data || []);
      } catch (error) {
        console.error("Error cargando datos:", error);
      }
    };
    init();
  }, []);

  // Detectar cambio de método de pago
  useEffect(() => {
    setEsCaja(form.metodo_pago === 'Efectivo Caja');
    // Si cambia a caja y hay solo una abierta, pre-seleccionar
    if (form.metodo_pago === 'Efectivo Caja' && sesionesAbiertas.length === 1) {
      setForm(prev => ({ ...prev, caja_sesion_id: sesionesAbiertas[0].id }));
    }
  }, [form.metodo_pago, sesionesAbiertas]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.monto || form.monto <= 0) return alert("Monto inválido");
    if (!form.gasto_categoria_id) return alert("Seleccione una categoría");
    if (!form.descripcion) return alert("La descripción es obligatoria");

    // Validación específica de caja
    if (esCaja && !form.caja_sesion_id) {
      return alert("⚠️ Para pagar con Caja Chica, debe seleccionar una caja abierta.");
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        // Si no es caja, mandamos null en la sesión
        caja_sesion_id: esCaja ? form.caja_sesion_id : null,
        // Si es caja, la referencia se genera auto en backend, pero podemos mandar algo
        referencia: esCaja ? 'Retiro Automático' : form.referencia
      };

      await finanzasApi.crearGasto(payload);
      alert("✅ Gasto registrado correctamente");
      onGastoGuardado();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Error al guardar: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-red-600 p-4 flex justify-between items-center text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <DollarSign className="w-5 h-5"/> Registrar Gasto Operativo
          </h2>
          <button onClick={onClose}><X/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Fila 1: Monto y Fecha */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Monto</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                <input 
                  type="number" 
                  className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none font-bold text-lg"
                  placeholder="0"
                  value={form.monto}
                  onChange={e => setForm({...form, monto: e.target.value})}
                  autoFocus
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Fecha</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                <input 
                  type="date" 
                  className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  value={form.fecha_gasto}
                  onChange={e => setForm({...form, fecha_gasto: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Categoría</label>
            <select 
              className="w-full p-2 border rounded-lg bg-white"
              value={form.gasto_categoria_id}
              onChange={e => setForm({...form, gasto_categoria_id: e.target.value})}
            >
              <option value="">-- Seleccionar --</option>
              {categorias.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-3 text-gray-400" size={16}/>
              <textarea 
                className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                rows="2"
                placeholder="Ej: Pago de factura de luz..."
                value={form.descripcion}
                onChange={e => setForm({...form, descripcion: e.target.value})}
              />
            </div>
          </div>

          {/* Método de Pago */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Método de Pago</label>
            <select 
              className="w-full p-2 border rounded-lg bg-white"
              value={form.metodo_pago}
              onChange={e => setForm({...form, metodo_pago: e.target.value})}
            >
              <option value="Transferencia">Transferencia Bancaria</option>
              <option value="Efectivo Caja">Efectivo (Caja Chica)</option>
              <option value="Cheque">Cheque</option>
              <option value="Tarjeta Crédito">Tarjeta Crédito Empresa</option>
            </select>
          </div>

          {/* LÓGICA CONDICIONAL */}
          {esCaja ? (
             <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg animate-in fade-in">
                <label className="block text-xs font-bold text-orange-800 mb-1 flex items-center gap-1">
                    <Inbox size={14}/> Seleccionar Caja de Origen
                </label>
                {sesionesAbiertas.length > 0 ? (
                  <select 
                    className="w-full p-2 border rounded text-sm"
                    value={form.caja_sesion_id}
                    onChange={e => setForm({...form, caja_sesion_id: e.target.value})}
                  >
                    <option value="">-- Seleccionar Caja --</option>
                    {sesionesAbiertas.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.nombre_caja} ({s.usuario})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-red-600 text-sm font-bold">⛔ No hay cajas abiertas para retirar efectivo.</p>
                )}
             </div>
          ) : (
             <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Referencia / N° Comprobante</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                  <input 
                    type="text" 
                    className="w-full pl-9 pr-3 py-2 border rounded-lg"
                    placeholder="Ej: TR-123456"
                    value={form.referencia}
                    onChange={e => setForm({...form, referencia: e.target.value})}
                  />
                </div>
             </div>
          )}

          {/* Footer */}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button 
              type="submit" 
              disabled={loading || (esCaja && sesionesAbiertas.length === 0)}
              className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:bg-gray-400"
            >
              {loading ? 'Guardando...' : 'Registrar Gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
