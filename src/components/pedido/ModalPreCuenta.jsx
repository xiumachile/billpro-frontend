import React, { useState, useMemo } from 'react';
import { X, Printer, Lock, Percent, Gift } from 'lucide-react';
import { menuApi } from '../../api/menuApi';
import axios from '@/api/axiosInstance';
import printerService from '../../services/printerService';

export default function ModalPreCuenta({ pedido, onCerrar, onImpreso }) {
  const [loading, setLoading] = useState(false);
  const totalBase = Math.round(parseFloat(pedido.total));

  // Estados
  const [aplicaPropina, setAplicaPropina] = useState(true);
  const [propinaManual, setPropinaManual] = useState(0);
  
  const [descuentoInput, setDescuentoInput] = useState(0);
  const [tipoDescuento, setTipoDescuento] = useState('%'); // '%' o '$'
  const [showDescuentoInput, setShowDescuentoInput] = useState(false);
  
  // Modal PIN
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinAdmin, setPinAdmin] = useState('');

  // ✅ CÁLCULOS EN TIEMPO REAL
  const { montoDescuentoCalculado, montoPropinaCalculado, totalFinalCalculado } = useMemo(() => {
      let descVal = 0;
      const inputVal = parseFloat(descuentoInput) || 0;

      // Convertir input a dinero real
      if (tipoDescuento === '%') {
          descVal = Math.round(totalBase * (inputVal / 100));
      } else {
          descVal = Math.round(inputVal);
      }

      const subtotal = Math.max(0, totalBase - descVal);
      
      let propVal = 0;
      if (aplicaPropina) {
          propVal = Math.round(subtotal * 0.10);
      } else {
          propVal = parseInt(propinaManual) || 0;
      }

      return {
          montoDescuentoCalculado: descVal,
          montoPropinaCalculado: propVal,
          totalFinalCalculado: subtotal + propVal
      };
  }, [totalBase, descuentoInput, tipoDescuento, aplicaPropina, propinaManual]);

  // ✅ VALIDAR PIN (LÓGICA CORREGIDA)
  const validarPinAdmin = async () => {
      if (!pinAdmin) return;
      
      try {
          // Llamamos al endpoint que solo valida (sin login)
          const response = await axios.post('/auth/validar-admin', { pin: pinAdmin });
          
          if (response.data.success) {
              setShowPinModal(false);
              setShowDescuentoInput(true);
              setPinAdmin(''); // Limpiar
          }
      } catch (error) {
          console.error(error);
          const msg = error.response?.data?.message || "PIN Incorrecto o sin permisos.";
          alert("⛔ " + msg);
          setPinAdmin('');
      }
  };

  const handleConfirmarEImprimir = async () => {
      setLoading(true);
      try {
          // 1. Payload limpio (solo lo que cambia)
          const payload = {
              estado: 'pagando',
              tipo_pedido: pedido.tipo_pedido,
              descuento: montoDescuentoCalculado, // Guardamos $
              propina: montoPropinaCalculado      // Guardamos $
          };

          // 2. Actualizar BD
          const res = await menuApi.actualizarPedido(pedido.id, payload);
          const pedidoActualizado = res.data || res;

          // 3. Imprimir
          // Pasamos los valores calculados explícitamente para asegurar que el ticket coincida
          printerService.imprimirTicket({
              ...pedidoActualizado,
              descuento: montoDescuentoCalculado,
              propina: montoPropinaCalculado,
              total: totalBase
          });

          onImpreso(pedidoActualizado.id);
          onCerrar();
          
      } catch (error) {
          console.error(error);
          alert("Error al procesar pre-cuenta: " + (error.message || 'Desconocido'));
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[1300] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gray-800 p-4 flex justify-between items-center text-white">
            <h2 className="text-lg font-bold flex gap-2"><Printer/> Pre-Cuenta Mesa {pedido.mesa?.numero}</h2>
            <button onClick={onCerrar} className="hover:bg-white/20 p-1 rounded"><X/></button>
        </div>

        <div className="p-6 space-y-6">
            
            {/* Total Base */}
            <div className="flex justify-between items-center text-lg">
                <span className="text-gray-600">Consumo</span>
                <span className="font-bold">${totalBase.toLocaleString()}</span>
            </div>

            {/* Descuento */}
            <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-red-700 font-bold text-sm flex gap-1"><Lock size={14}/> Descuento</span>
                    {!showDescuentoInput && (
                        <button onClick={() => setShowPinModal(true)} className="text-xs bg-white border border-red-200 px-3 py-1 rounded text-red-600 font-bold hover:bg-red-50">Autorizar</button>
                    )}
                    {showDescuentoInput && (
                        <button onClick={() => { setShowDescuentoInput(false); setDescuentoInput(0); }} className="text-xs text-gray-400"><X size={12}/></button>
                    )}
                </div>
                
                {showDescuentoInput ? (
                    <div className="flex gap-2">
                        <input 
                            type="number" 
                            className="w-full p-2 border rounded font-bold text-red-600 text-right outline-none focus:ring-2 focus:ring-red-200"
                            value={descuentoInput}
                            onChange={e => setDescuentoInput(e.target.value)}
                            placeholder="0"
                            autoFocus
                        />
                        <div className="flex bg-white rounded border overflow-hidden">
                            <button onClick={()=>setTipoDescuento('%')} className={`px-3 font-bold ${tipoDescuento==='%' ? 'bg-red-600 text-white' : 'text-gray-500'}`}>%</button>
                            <button onClick={()=>setTipoDescuento('$')} className={`px-3 font-bold ${tipoDescuento==='$' ? 'bg-red-600 text-white' : 'text-gray-500'}`}>$</button>
                        </div>
                    </div>
                ) : (
                    <div className="text-right text-gray-400 text-sm italic">Sin descuento</div>
                )}
                
                {montoDescuentoCalculado > 0 && (
                    <div className="text-right text-red-600 font-bold mt-1">- ${montoDescuentoCalculado.toLocaleString()}</div>
                )}
            </div>

            {/* Propina */}
            <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-green-700 font-bold text-sm flex gap-1"><Gift size={14}/> Propina Sugerida</span>
                    <input type="checkbox" checked={aplicaPropina} onChange={e => setAplicaPropina(e.target.checked)} className="w-5 h-5 cursor-pointer accent-green-600"/>
                </div>
                {aplicaPropina ? (
                     <div className="flex justify-between items-center">
                         <span className="text-xs text-green-600">10% Sugerido</span>
                         <span className="font-bold text-green-700">+ ${montoPropinaCalculado.toLocaleString()}</span>
                     </div>
                ) : (
                    <input 
                        type="number" 
                        placeholder="Monto Manual"
                        className="w-full p-2 border rounded text-right text-sm outline-none focus:ring-2 focus:ring-green-200"
                        value={propinaManual}
                        onChange={e => setPropinaManual(e.target.value)}
                    />
                )}
            </div>

            <hr/>

            <div className="flex justify-between items-center text-xl">
                <span className="font-black text-gray-800">TOTAL A COBRAR</span>
                <span className="font-black text-blue-700">${totalFinalCalculado.toLocaleString()}</span>
            </div>

            <button 
                onClick={handleConfirmarEImprimir}
                disabled={loading}
                className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold shadow-lg hover:bg-black transition-all flex justify-center gap-2"
            >
                <Printer/> {loading ? 'Imprimiendo...' : 'Guardar e Imprimir'}
            </button>
        </div>
      </div>

      {/* Modal PIN */}
      {showPinModal && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-[1400]">
              <div className="bg-white p-6 rounded-xl w-72 text-center animate-in zoom-in-95">
                  <h3 className="font-bold mb-4 text-gray-800">PIN Administrador</h3>
                  <input 
                    type="password" 
                    autoFocus 
                    className="w-full border-2 p-3 rounded-lg mb-4 text-center text-3xl tracking-widest outline-none focus:border-red-500 font-mono" 
                    value={pinAdmin} 
                    onChange={e=>setPinAdmin(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && validarPinAdmin()}
                    maxLength={4}
                  />
                  <div className="flex gap-2">
                      <button onClick={()=>setShowPinModal(false)} className="flex-1 py-2 border rounded hover:bg-gray-100 font-bold text-gray-600">Cancelar</button>
                      <button onClick={validarPinAdmin} className="flex-1 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700">Validar</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
