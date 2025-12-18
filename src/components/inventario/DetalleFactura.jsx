import React, { useState, useEffect } from 'react';
import { X, Package, DollarSign, Calendar, User, FileText, Loader2, Printer } from 'lucide-react';
import { inventarioApi } from "../../api/inventarioApi";

export default function DetalleFactura({ compra, onClose }) {
  const [compraDetallada, setCompraDetallada] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDetalles();
  }, [compra.id]);

  const cargarDetalles = async () => {
    try {
      const detalles = await inventarioApi.getCompra(compra.id);
      console.log('Detalles cargados:', detalles); // ✅ Debug
      setCompraDetallada(detalles);
    } catch (error) {
      console.error('Error al cargar detalles:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado) => {
    const colores = {
      'pagado': 'bg-green-100 text-green-800',
      'parcial': 'bg-yellow-100 text-yellow-800',
      'pendiente': 'bg-red-100 text-red-800',
      'anulado': 'bg-gray-100 text-gray-800'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  };

  const getEstadoEtiqueta = (estado) => {
    const etiquetas = {
      'pagado': '✓ Pagado',
      'parcial': '⊘ Pago Parcial',
      'pendiente': '◯ Pendiente',
      'anulado': '✕ Anulado'
    };
    return etiquetas[estado] || estado;
  };

  const formatPrecio = (valor) => {
    if (!valor && valor !== 0) return '$0.00';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            <p className="text-gray-600">Cargando detalles de factura...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!compraDetallada) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md w-full">
          <p className="text-gray-600">No se pudieron cargar los detalles de la factura</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  const totalPagado = compraDetallada.pagos?.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0) || 0;
  const totalPendiente = Math.max(0, parseFloat(compraDetallada.total) - totalPagado);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">Detalle de Factura</h2>
              <p className="text-purple-100 text-sm">#{compraDetallada.numero_factura || compraDetallada.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          {/* Información General */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Proveedor */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5 text-purple-600" />
                <p className="text-xs text-gray-500 font-semibold">PROVEEDOR</p>
              </div>
              <p className="text-lg font-semibold text-gray-900">{compraDetallada.proveedor_nombre}</p>
            </div>

            {/* Fecha */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <p className="text-xs text-gray-500 font-semibold">FECHA DE COMPRA</p>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(compraDetallada.fecha).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            {/* Estado */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 font-semibold mb-2">ESTADO</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getEstadoColor(compraDetallada.estado)}`}>
                {getEstadoEtiqueta(compraDetallada.estado)}
              </span>
            </div>

            {/* Forma de Pago */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 font-semibold mb-2">FORMA DE PAGO</p>
              <p className="text-lg font-semibold text-gray-900">
                {compraDetallada.forma_pago_nombre || 'No especificada'}
              </p>
            </div>
          </div>

          {/* Observaciones */}
          {compraDetallada.observaciones && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Observaciones:</strong> {compraDetallada.observaciones}
              </p>
            </div>
          )}

          {/* Detalles de Productos */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-600" />
              Productos
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Producto</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Cantidad</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Unidad</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Precio Unitario</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {compraDetallada.detalles && compraDetallada.detalles.length > 0 ? (
                    compraDetallada.detalles.map((detalle, idx) => {
                      const subtotal = parseFloat(detalle.cantidad) * parseFloat(detalle.precio_unitario);
                      
                      // ✅ Obtener nombre del producto con fallbacks
                      const nombreProducto = detalle.nombre_producto || detalle.producto_nombre || 'Producto sin nombre';
                      
                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold text-gray-900">
                            {nombreProducto}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-700">
                            {parseFloat(detalle.cantidad).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-700">
                            {detalle.unidad_medida}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {formatPrecio(detalle.precio_unitario)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">
                            {formatPrecio(subtotal)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-4 py-3 text-center text-gray-500">
                        Sin productos
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Resumen Financiero */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <p className="text-xs text-gray-500 mb-1">Total de Compra</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPrecio(compraDetallada.total)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Pagado</p>
              <p className="text-2xl font-bold text-green-600">
                {formatPrecio(totalPagado)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Pendiente</p>
              <p className={`text-2xl font-bold ${totalPendiente > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatPrecio(totalPendiente)}
              </p>
            </div>
          </div>

          {/* Historial de Pagos */}
          {compraDetallada.pagos && compraDetallada.pagos.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Historial de Pagos</h3>
              <div className="space-y-2">
                {compraDetallada.pagos.map((pago, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {formatPrecio(pago.monto)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {pago.forma_pago_nombre} • {new Date(pago.fecha_pago).toLocaleDateString('es-ES')}
                      </p>
                      {pago.referencia && (
                        <p className="text-xs text-gray-500">Ref: {pago.referencia}</p>
                      )}
                      {pago.nota && (
                        <p className="text-xs text-gray-500 mt-1">{pago.nota}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}
