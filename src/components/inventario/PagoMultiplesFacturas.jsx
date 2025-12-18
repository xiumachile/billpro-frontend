import React, { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { useToast } from '../ui/use-toast';
import { CheckCircle, Loader2, XCircle, AlertCircle, Wallet, Inbox } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { inventarioApi } from "../../api/inventarioApi";
import cajaService from '../../services/cajaService'; // ✅ 1. IMPORTAR CAJA SERVICE

const PagoMultiplesFacturas = ({ onClose, onPagoExitoso }) => {
  const { toast } = useToast();

  // Estados de Datos
  const [proveedores, setProveedores] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [formasPago, setFormasPago] = useState([]);
  
  // Estados de Selección
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState('');
  const [facturasSeleccionadas, setFacturasSeleccionadas] = useState([]);
  const [formaPago, setFormaPago] = useState('');
  
  // Estados de Formulario
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().split('T')[0]);
  const [referencia, setReferencia] = useState('');
  
  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [resumenPago, setResumenPago] = useState({ proveedor: '', total: 0, cantidad: 0, formaPago: '', facturas: [] });

  // ✅ NUEVOS ESTADOS PARA CAJA
  const [listaSesiones, setListaSesiones] = useState([]);
  const [sesionSeleccionadaId, setSesionSeleccionadaId] = useState('');
  const [esEfectivo, setEsEfectivo] = useState(false);

  /* ---------- CARGAR DATOS INICIALES ---------- */
  const cargarDatos = async () => {
    try {
      // Cargamos Proveedores, Formas de Pago y Cajas Abiertas simultáneamente
      const [provRes, formasRes, sesionesRes] = await Promise.all([
        inventarioApi.getProveedores(),
        inventarioApi.getFormasPago(),
        cajaService.getSesionesActivas() // ✅ Obtener todas las cajas abiertas
      ]);

      setProveedores(Array.isArray(provRes) ? provRes : []);
      setFormasPago(Array.isArray(formasRes) ? formasRes : []);
      
      const sesiones = sesionesRes.data || [];
      setListaSesiones(sesiones);

      // Si solo hay una caja abierta, la pre-seleccionamos
      if (sesiones.length === 1) {
          setSesionSeleccionadaId(sesiones[0].id);
      }

    } catch (err) {
      console.error('Error al cargar datos iniciales:', err);
      toast({ title: 'Error', description: 'No se pudieron cargar los datos.', variant: 'destructive' });
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  /* ---------- DETECTAR EFECTIVO ---------- */
  useEffect(() => {
      const f = formasPago.find(item => String(item.id) === String(formaPago));
      const isCash = f && f.nombre.toLowerCase().includes('efectivo');
      setEsEfectivo(isCash);
      
      // Si cambiamos a algo que no es efectivo, limpiamos la selección de caja
      if (!isCash) setSesionSeleccionadaId('');
      // Si volvemos a efectivo y solo hay una caja, la seleccionamos de nuevo
      if (isCash && listaSesiones.length === 1) setSesionSeleccionadaId(listaSesiones[0].id);

  }, [formaPago, formasPago, listaSesiones]);

  /* ---------- CARGAR FACTURAS PENDIENTES ---------- */
  useEffect(() => {
    if (!proveedorSeleccionado) {
      setFacturas([]);
      setFacturasSeleccionadas([]);
      return;
    }
    
    const cargarFacturas = async () => {
      setLoading(true);
      try {
        const facturasRes = await inventarioApi.getComprasPorProveedor(proveedorSeleccionado);
        const todas = Array.isArray(facturasRes) ? facturasRes : [];
        const pendientes = todas.filter(f => {
          const pend = parseFloat(f.saldo_pendiente ?? f.total) || 0;
          return pend > 0;
        });
        setFacturas(pendientes);
        setFacturasSeleccionadas([]);
      } catch (err) {
        toast({ title: 'Error', description: 'Error cargando facturas.', variant: 'destructive' });
        setFacturas([]);
      } finally {
        setLoading(false);
      }
    };
    cargarFacturas();
  }, [proveedorSeleccionado]);

  const toggleSeleccion = (id) => {
    setFacturasSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  /* ---------- VALIDACIÓN Y CONFIRMACIÓN ---------- */
  const handleConfirmacion = () => {
    if (!proveedorSeleccionado || !formaPago || facturasSeleccionadas.length === 0) {
      toast({ title: 'Error', description: 'Faltan datos requeridos.', variant: 'destructive' });
      return;
    }

    // ✅ VALIDACIÓN DE CAJA
    if (esEfectivo) {
        if (listaSesiones.length === 0) {
            toast({ title: 'Error', description: 'No hay cajas abiertas para pagar en efectivo.', variant: 'destructive' });
            return;
        }
        if (!sesionSeleccionadaId) {
            toast({ title: 'Atención', description: 'Selecciona la caja de origen.', variant: 'destructive' });
            return;
        }
    }

    const seleccionadas = facturas.filter((f) => facturasSeleccionadas.includes(f.id));
    const total = seleccionadas.reduce((sum, f) => sum + (parseFloat(f.saldo_pendiente ?? f.total) || 0), 0);
    const proveedor = proveedores.find((p) => String(p.id) === String(proveedorSeleccionado))?.nombre || '';
    const formaPagoNombre = formasPago.find((f) => String(f.id) === String(formaPago))?.nombre || '';
    
    // Buscar nombre de la caja seleccionada para el resumen
    const cajaNombre = listaSesiones.find(s => String(s.id) === String(sesionSeleccionadaId))?.nombre_caja || '';

    setResumenPago({
      proveedor,
      total,
      cantidad: seleccionadas.length,
      formaPago: formaPagoNombre,
      cajaNombre, // Para mostrar en el modal
      facturas: seleccionadas.map(f => ({ numero: f.numero, monto: parseFloat(f.saldo_pendiente ?? f.total) })),
    });
    setShowConfirmModal(true);
  };

  /* ---------- REGISTRAR PAGOS ---------- */
  const handleConfirmarPago = async () => {
    const pagos = facturas
      .filter((f) => facturasSeleccionadas.includes(f.id))
      .map((f) => ({
        compra_id: f.id,
        forma_pago_id: parseInt(formaPago),
        monto: parseFloat(f.saldo_pendiente ?? f.total) || 0,
        fecha_pago: fechaPago,
        referencia: referencia || null,
        // ✅ ENVÍO DE SESIÓN DE CAJA
        caja_sesion_id: esEfectivo ? parseInt(sesionSeleccionadaId) : null
      }));

    setLoading(true);
    setShowConfirmModal(false);

    try {
      await inventarioApi.registrarPagosMultiples({ proveedor_id: parseInt(proveedorSeleccionado), pagos });
      
      toast({ title: 'Pagos registrados', description: 'Operación exitosa.' });
      
      if (onPagoExitoso) onPagoExitoso();
      if (onClose) onClose();
      
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'Error al guardar.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="p-4 shadow-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <h2 className="text-xl font-semibold">Pagos múltiples a facturas</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* FILTROS PRINCIPALES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select className="border rounded p-2" value={proveedorSeleccionado} onChange={(e) => setProveedorSeleccionado(e.target.value)}>
              <option value="">Seleccionar proveedor</option>
              {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>

            <select className="border rounded p-2" value={formaPago} onChange={(e) => setFormaPago(e.target.value)}>
              <option value="">Forma de pago</option>
              {formasPago.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
            </select>

            <Input type="date" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} />
          </div>

          {/* ✅ SELECTOR DE CAJA (Solo aparece si es efectivo) */}
          {esEfectivo && (
              <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg flex flex-col gap-1">
                  <label className="text-xs font-bold text-orange-800 flex items-center gap-1">
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
                                  {s.nombre_caja} ({s.usuario}) - Saldo Inicial: ${parseInt(s.monto_inicial).toLocaleString()}
                              </option>
                          ))}
                      </select>
                  ) : (
                      <div className="flex items-center gap-2 text-red-600 text-sm font-bold">
                          <AlertCircle size={16}/> 
                          <span>No hay cajas abiertas. No se puede pagar en efectivo.</span>
                      </div>
                  )}
              </div>
          )}

          <Input placeholder="Referencia (opcional)" value={referencia} onChange={(e) => setReferencia(e.target.value)} />

          {/* TABLA DE FACTURAS */}
          <div className="overflow-x-auto border rounded-md max-h-60 overflow-y-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="p-2 text-center">✔</th>
                  <th className="p-2 text-left">Factura</th>
                  <th className="p-2 text-left">Fecha</th>
                  <th className="p-2 text-right">Pendiente</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" className="text-center py-4"><Loader2 className="animate-spin inline mr-2"/> Cargando...</td></tr>
                ) : proveedorSeleccionado && facturas.length === 0 ? (
                  <tr><td colSpan="4" className="text-center py-4 text-gray-500">Sin deudas pendientes.</td></tr>
                ) : (
                  facturas.map((factura) => {
                    const pendiente = parseFloat(factura.saldo_pendiente ?? factura.total) || 0;
                    return (
                      <tr key={factura.id} className="hover:bg-gray-50 border-b">
                        <td className="p-2 text-center">
                          <input type="checkbox" checked={facturasSeleccionadas.includes(factura.id)} onChange={() => toggleSeleccion(factura.id)} />
                        </td>
                        <td className="p-2 font-medium">{factura.numero}</td>
                        <td className="p-2 text-gray-500">{factura.fecha.slice(0, 10)}</td>
                        <td className="p-2 text-right text-red-600 font-mono">${pendiente.toFixed(0)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* RESUMEN INFERIOR */}
          {facturasSeleccionadas.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex justify-between items-center">
              <span className="text-sm text-blue-700 font-semibold">{facturasSeleccionadas.length} facturas seleccionadas</span>
              <span className="text-lg font-bold text-blue-800">
                Total: ${facturas.filter(f => facturasSeleccionadas.includes(f.id)).reduce((sum, f) => sum + (parseFloat(f.saldo_pendiente ?? f.total) || 0), 0).toLocaleString()}
              </span>
            </div>
          )}

          {/* BOTONES */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button 
                onClick={handleConfirmacion} 
                disabled={loading || facturasSeleccionadas.length === 0 || (esEfectivo && !sesionSeleccionadaId)}
                className="flex items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <CheckCircle />} Registrar Pago
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* MODAL CONFIRMACIÓN */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Pago Total</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
             <div className="flex justify-between border-b pb-2">
                 <span className="text-gray-500">Proveedor</span>
                 <span className="font-bold">{resumenPago.proveedor}</span>
             </div>
             <div className="flex justify-between border-b pb-2">
                 <span className="text-gray-500">Forma Pago</span>
                 <span className="font-bold">{resumenPago.formaPago}</span>
             </div>
             {esEfectivo && (
                 <div className="flex justify-between border-b pb-2">
                     <span className="text-gray-500">Origen (Caja)</span>
                     <span className="font-bold text-orange-600">{resumenPago.cajaNombre}</span>
                 </div>
             )}
             <div className="flex justify-between pt-2">
                 <span className="text-lg font-bold">Total a Pagar</span>
                 <span className="text-lg font-bold text-green-600">${resumenPago.total.toLocaleString()}</span>
             </div>
             <p className="text-xs text-gray-400 mt-2 text-center">Se actualizarán {resumenPago.cantidad} facturas.</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>Cancelar</Button>
            <Button onClick={handleConfirmarPago} disabled={loading}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PagoMultiplesFacturas;
