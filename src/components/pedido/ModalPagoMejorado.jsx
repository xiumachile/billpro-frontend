import React, { useState, useEffect } from 'react';
import { menuApi } from '../../api/menuApi'; // ✅ Importamos la API centralizada
import { 
  DollarSign, 
  CreditCard, 
  Smartphone, 
  Wallet,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';

export default function ModalPagoMejorado({ 
  pedido, 
  onCerrar, 
  onPagar,
  loading = false 
}) {
  const [formasPago, setFormasPago] = useState([]);
  const [pagos, setPagos] = useState([{ forma_pago_id: '', monto: '', nombre_forma: '' }]);
  const [loadingFormas, setLoadingFormas] = useState(true);
  const [montoEfectivo, setMontoEfectivo] = useState('');
  const [vuelto, setVuelto] = useState(0);

  useEffect(() => {
    cargarFormasPago();
  }, []);

  const cargarFormasPago = async () => {
    try {
      // ✅ CORRECCIÓN: Usamos menuApi en lugar de fetch manual
      const data = await menuApi.getFormasPago();
      
      // Manejo seguro de la respuesta (array directo o envuelto en data)
      const lista = Array.isArray(data) ? data : (data?.data || []);
      setFormasPago(lista);
    } catch (error) {
      console.error('Error al cargar formas de pago:', error);
      // Fallback visual si falla la API (opcional, pero útil)
      setFormasPago([
        { id: 1, nombre: 'Efectivo', activo: true },
        { id: 2, nombre: 'Tarjeta Débito', activo: true },
        { id: 3, nombre: 'Tarjeta Crédito', activo: true },
        { id: 4, nombre: 'Transferencia', activo: true }
      ]);
    } finally {
      setLoadingFormas(false);
    }
  };

  const getIconoFormaPago = (nombre) => {
    const nombreLower = nombre?.toLowerCase() || '';
    if (nombreLower.includes('efectivo')) return <DollarSign className="w-5 h-5" />;
    if (nombreLower.includes('tarjeta') || nombreLower.includes('débito') || nombreLower.includes('crédito')) 
      return <CreditCard className="w-5 h-5" />;
    if (nombreLower.includes('transfer')) return <Smartphone className="w-5 h-5" />;
    return <Wallet className="w-5 h-5" />;
  };

  const agregarPago = () => {
    setPagos([...pagos, { forma_pago_id: '', monto: '', nombre_forma: '' }]);
  };

  const eliminarPago = (index) => {
    if (pagos.length > 1) {
      setPagos(pagos.filter((_, i) => i !== index));
    }
  };

  const actualizarPago = (index, campo, valor) => {
    const nuevosPagos = [...pagos];
    nuevosPagos[index][campo] = valor;
    
    // Si cambió la forma de pago, buscar el nombre
    if (campo === 'forma_pago_id') {
      const forma = formasPago.find(f => f.id === parseInt(valor));
      nuevosPagos[index].nombre_forma = forma?.nombre || '';
    }
    
    setPagos(nuevosPagos);
  };

  const calcularTotalPagado = () => {
    return pagos.reduce((sum, pago) => {
      const monto = parseFloat(pago.monto) || 0;
      return sum + monto;
    }, 0);
  };

  const calcularVuelto = () => {
    // const totalPedido = parseFloat(pedido.total) || 0; // No se usa en el cálculo directo del vuelto
    const efectivoEntregado = parseFloat(montoEfectivo) || 0;
    
    // Solo calcular vuelto si hay pago en efectivo
    const pagoEfectivo = pagos.find(p => {
      const forma = formasPago.find(f => f.id === parseInt(p.forma_pago_id));
      return forma?.nombre?.toLowerCase().includes('efectivo');
    });
    
    if (pagoEfectivo && efectivoEntregado > 0) {
      const montoEfectivoPago = parseFloat(pagoEfectivo.monto) || 0;
      const vueltoCalculado = efectivoEntregado - montoEfectivoPago;
      setVuelto(vueltoCalculado >= 0 ? vueltoCalculado : 0);
    } else {
      setVuelto(0);
    }
  };

  useEffect(() => {
    calcularVuelto();
  }, [pagos, montoEfectivo, formasPago]);

  const validarPago = () => {
    const totalPedido = parseFloat(pedido.total) || 0;
    const totalPagado = calcularTotalPagado();
    
    // Validar que haya al menos un pago
    if (pagos.length === 0 || !pagos[0].forma_pago_id) {
      return { valido: false, mensaje: 'Debes seleccionar al menos una forma de pago' };
    }
    
    // Validar que todos los pagos tengan forma y monto
    for (let pago of pagos) {
      if (!pago.forma_pago_id || !pago.monto || parseFloat(pago.monto) <= 0) {
        return { valido: false, mensaje: 'Todos los pagos deben tener forma de pago y monto válido' };
      }
    }
    
    // Validar que el total pagado coincida con el total del pedido
    // Usamos una pequeña tolerancia para flotantes
    if (Math.abs(totalPagado - totalPedido) > 1) { // Tolerancia de $1 peso
      return { 
        valido: false, 
        mensaje: `El total pagado ($${totalPagado.toLocaleString('es-CL')}) debe ser igual al total del pedido ($${totalPedido.toLocaleString('es-CL')})` 
      };
    }
    
    // Validar efectivo entregado si hay pago en efectivo
    const pagoEfectivo = pagos.find(p => {
      const forma = formasPago.find(f => f.id === parseInt(p.forma_pago_id));
      return forma?.nombre?.toLowerCase().includes('efectivo');
    });
    
    if (pagoEfectivo) {
      const efectivo = parseFloat(montoEfectivo) || 0;
      const montoPagoEfectivo = parseFloat(pagoEfectivo.monto) || 0;
      if (efectivo < montoPagoEfectivo) {
        return { valido: false, mensaje: 'El efectivo entregado debe ser mayor o igual al monto a pagar en efectivo' };
      }
    }
    
    return { valido: true };
  };

  const handlePagar = () => {
    const validacion = validarPago();
    if (!validacion.valido) {
      alert(`⚠️ ${validacion.mensaje}`);
      return;
    }
    
    // Preparar datos del pago
    const datosPago = {
      total_pagado: calcularTotalPagado(),
      pagos: pagos.map(p => ({
        forma_pago_id: parseInt(p.forma_pago_id),
        monto: parseFloat(p.monto),
        nombre_forma: p.nombre_forma
      })),
      vuelto: vuelto,
      efectivo_entregado: parseFloat(montoEfectivo) || 0
    };
    
    onPagar(datosPago);
  };

  const totalPedido = parseFloat(pedido.total) || 0;
  const totalPagado = calcularTotalPagado();
  const diferencia = totalPedido - totalPagado;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Procesar Pago</h3>
              <p className="text-sm text-white/80">Pedido #{pedido.id} • {pedido.tipo_pedido?.toUpperCase()}</p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {/* Información del pedido */}
          <div className="bg-white p-4 rounded-xl mb-6 border border-gray-200 shadow-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Cliente</p>
                <p className="font-semibold text-gray-900 truncate">
                  {pedido.cliente?.nombre || pedido.cliente_datos?.nombre || 'Cliente General'}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Teléfono</p>
                <p className="font-semibold text-gray-900">
                  {pedido.cliente?.movil || pedido.telefono_contacto || '-'}
                </p>
              </div>
              <div className="col-span-2 border-t pt-2 mt-1">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Dirección / Referencia</p>
                <p className="text-sm text-gray-700">
                  {pedido.direccion_entrega || pedido.cliente?.direccion || 'Retiro en Local'}
                </p>
              </div>
            </div>
          </div>

          {/* Total a pagar */}
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-xl mb-6 border border-emerald-100 shadow-inner flex flex-col items-center">
            <span className="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-1">Total a Pagar</span>
            <span className="text-4xl font-black text-emerald-600 tracking-tight">
              ${Math.round(totalPedido).toLocaleString('es-CL')}
            </span>
          </div>

          {/* Formas de pago */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                <Wallet className="w-4 h-4"/> Métodos de Pago
              </label>
              <button
                onClick={agregarPago}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm font-bold rounded-lg transition-colors border border-blue-200"
              >
                <Plus className="w-4 h-4" />
                Agregar Método
              </button>
            </div>

            {loadingFormas ? (
              <div className="text-center py-8 text-gray-400 animate-pulse">Cargando formas de pago...</div>
            ) : (
              <div className="space-y-3">
                {pagos.map((pago, index) => (
                  <div key={index} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 mb-1">
                          Método {pagos.length > 1 ? `#${index + 1}` : ''}
                        </label>
                        <div className="relative">
                          <select
                            value={pago.forma_pago_id}
                            onChange={(e) => actualizarPago(index, 'forma_pago_id', e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 cursor-pointer"
                          >
                            <option value="">Seleccionar...</option>
                            {formasPago.filter(f => f.activo).map(forma => (
                              <option key={forma.id} value={forma.id}>
                                {forma.nombre}
                              </option>
                            ))}
                          </select>
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            {pago.nombre_forma ? getIconoFormaPago(pago.nombre_forma) : <Wallet className="w-5 h-5" />}
                          </div>
                        </div>
                      </div>
                      <div className="w-40">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Monto</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                            <input
                            type="number"
                            value={pago.monto}
                            onChange={(e) => actualizarPago(index, 'monto', e.target.value)}
                            className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-bold text-right"
                            placeholder="0"
                            min="0"
                            />
                        </div>
                      </div>
                      {pagos.length > 1 && (
                        <button
                          onClick={() => eliminarPago(index)}
                          className="self-end p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                          title="Eliminar línea"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    {/* Campo especial para efectivo */}
                    {pago.forma_pago_id && pago.nombre_forma?.toLowerCase().includes('efectivo') && (
                      <div className="mt-3 pt-3 border-t border-gray-100 bg-amber-50/50 -mx-4 px-4 pb-2 rounded-b-xl">
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-amber-700 mb-1">
                                Efectivo Recibido
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 font-bold">$</span>
                                    <input
                                    type="number"
                                    value={montoEfectivo}
                                    onChange={(e) => setMontoEfectivo(e.target.value)}
                                    className="w-full pl-7 pr-3 py-2 border-2 border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white font-bold text-lg"
                                    placeholder="0"
                                    min="0"
                                    />
                                </div>
                            </div>
                            
                            {vuelto > 0 && (
                            <div className="flex-1 text-right">
                                <span className="block text-xs font-bold text-amber-600 uppercase">Vuelto a Entregar</span>
                                <span className="text-2xl font-black text-amber-600">
                                    ${vuelto.toLocaleString('es-CL')}
                                </span>
                            </div>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resumen Final */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-2 shadow-sm">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Total Pedido</span>
              <span className="font-bold text-gray-900">
                ${totalPedido.toLocaleString('es-CL')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Pagado</span>
              <span className={`font-bold ${Math.abs(diferencia) <= 1 ? 'text-green-600' : 'text-gray-900'}`}>
                ${totalPagado.toLocaleString('es-CL')}
              </span>
            </div>
            
            {Math.abs(diferencia) > 1 && (
              <div className={`flex justify-between items-center pt-2 border-t border-gray-100 ${diferencia > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                <span className="font-bold flex items-center gap-2">
                    <AlertCircle size={16}/> {diferencia > 0 ? 'Falta por pagar:' : 'Exceso de pago:'}
                </span>
                <span className="font-black text-lg">
                  ${Math.abs(diferencia).toLocaleString('es-CL')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-white px-6 py-4 flex justify-end gap-3 shadow-lg z-10">
          <button
            onClick={onCerrar}
            className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition-colors border border-gray-200"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handlePagar}
            disabled={loading || Math.abs(diferencia) > 1}
            className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Confirmar Pago</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
