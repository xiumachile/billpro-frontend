// src/components/menu/DetalleComboModal.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Package, CheckCircle, XCircle, DollarSign, Calculator, List, RefreshCw 
} from 'lucide-react';
import { menuApi } from '../../api/menuApi'; // ✅ Importamos API centralizada

// ✅ Función local de respaldo para estimar costo
const estimarCostoLocal = (producto) => {
  if (!producto) return 0;
  const inv = producto.producto_inventario;
  return parseFloat(
    inv?.precio_ultima_compra ??
    inv?.precio_compra ??
    producto.costo_unitario ??
    producto.costo ??
    producto.precio_costo ??
    (producto.precio_venta ? producto.precio_venta * 0.7 : 0) ??
    0
  );
};

export default function DetalleComboModal({
  isOpen,
  onClose,
  combo
}) {
  const [productosConCosto, setProductosConCosto] = useState({});
  const [cargando, setCargando] = useState(false);

  // Calcular costos de productos en el combo
  useEffect(() => {
    if (!isOpen || !combo?.items?.length) return;

    const calcularCostos = async () => {
      setCargando(true);
      const costos = {};

      for (const item of combo.items) {
        const producto = item.producto_carta;
        if (!producto) continue;

        if (costos[producto.id]) continue;

        try {
          if (producto.es_compuesto) {
            // ✅ CAMBIO: Usamos menuApi (Axios)
            const data = await menuApi.calcularCostoProducto(producto.id);
            costos[producto.id] = {
              costo_unitario: parseFloat(data.costo_unitario || 0),
              desglose: data.desglose || []
            };
          } else {
            // Producto simple: usar función local
            costos[producto.id] = {
              costo_unitario: estimarCostoLocal(producto)
            };
          }
        } catch (e) {
          console.warn(`Error calculando costo para ${producto.nombre}`, e);
          costos[producto.id] = {
            costo_unitario: 0
          };
        }
      }

      setProductosConCosto(costos);
      setCargando(false);
    };

    calcularCostos();
  }, [isOpen, combo]); // Quitamos dependencia de combo.id para simplificar

  // Calcular totales
  const [precioCombo, precioNormal, costoTotal] = useMemo(() => {
    if (!combo) return [0, 0, 0];

    let pCombo = parseFloat(combo.precio || 0);
    let pNormal = 0;
    let cTotal = 0;

    if (combo.items && Array.isArray(combo.items)) {
      combo.items.forEach(item => {
        const producto = item.producto_carta;
        if (!producto) return;

        const precioProducto = parseFloat(producto.precio_venta || 0);
        const cantidad = parseFloat(item.cantidad || 1);
        pNormal += precioProducto * cantidad;

        const costo = productosConCosto[producto.id]?.costo_unitario || 0;
        cTotal += costo * cantidad;
      });
    }

    return [pCombo, pNormal, cTotal];
  }, [combo, productosConCosto]);

  const gananciaValor = precioCombo - costoTotal;
  const gananciaPorcentaje = precioCombo > 0 
    ? ((gananciaValor / precioCombo) * 100).toFixed(1)
    : '0.0';
  const ahorroValor = precioNormal - precioCombo;
  const ahorroPorcentaje = precioNormal > 0 
    ? ((ahorroValor / precioNormal) * 100).toFixed(1)
    : 0;

  const formatCLP = (value) => 
    new Intl.NumberFormat('es-CL', { 
      style: 'currency', 
      currency: 'CLP',
      minimumFractionDigits: 0 
    }).format(value);

  if (!isOpen || !combo) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Detalle del Combo</h2>
                <p className="text-blue-100 text-sm truncate max-w-xs">{combo.nombre}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-100 transition-colors p-1 rounded-full hover:bg-white/10"
              aria-label="Cerrar"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
          {/* Info general */}
          <div className="mb-6 bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-xl">{combo.nombre}</h3>
                <p className="text-gray-600 mt-2 whitespace-pre-line leading-relaxed">
                  {combo.descripcion || 'Sin descripción'}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                  combo.activo 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-red-100 text-red-700 border border-red-200'
                }`}>
                  {combo.activo ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1.5" /> Activo
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-1.5" /> Inactivo
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Resumen financiero */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-800">Precios</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Precio normal (suma)</span>
                  <span className="font-medium text-gray-900">{formatCLP(precioNormal)}</span>
                </div>
                <div className="flex justify-between items-center bg-blue-50 p-2 rounded-lg">
                  <span className="text-blue-800 font-bold">Precio Combo</span>
                  <span className="font-black text-blue-700 text-xl">{formatCLP(precioCombo)}</span>
                </div>
                {ahorroValor > 0 && (
                  <div className="flex justify-between items-center pt-1">
                    <span className="font-medium text-amber-600 text-sm">Ahorro Cliente</span>
                    <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-sm">
                      {formatCLP(ahorroValor)} ({ahorroPorcentaje}%)
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                <Calculator className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-gray-800">Rentabilidad</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Costo Ingredientes</span>
                  <span className="font-medium text-red-600">{formatCLP(costoTotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Ganancia Bruta</span>
                  <span className={`font-bold text-lg ${
                    gananciaValor >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {formatCLP(gananciaValor)}
                  </span>
                </div>
                <div className="pt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-gray-500 uppercase">Margen</span>
                    <span className={`text-sm font-black ${parseFloat(gananciaPorcentaje) > 0 ? 'text-gray-800' : 'text-red-500'}`}>{gananciaPorcentaje}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        parseFloat(gananciaPorcentaje) >= 50 ? 'bg-emerald-500' :
                        parseFloat(gananciaPorcentaje) >= 30 ? 'bg-green-500' :
                        parseFloat(gananciaPorcentaje) >= 15 ? 'bg-yellow-500' :
                        parseFloat(gananciaPorcentaje) >= 5 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(Math.max(parseFloat(gananciaPorcentaje), 0), 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Productos del combo */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <List className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-gray-800 text-lg">
                Productos incluidos <span className="text-gray-400 text-sm font-normal ml-1">({combo.items?.length || 0})</span>
              </h3>
              {cargando && <RefreshCw className="w-4 h-4 animate-spin text-blue-600 ml-2" />}
            </div>

            {(!combo.items || combo.items.length === 0) ? (
              <div className="text-center py-8 text-gray-500 bg-white border border-dashed border-gray-300 rounded-xl">
                No hay productos asociados a este combo.
              </div>
            ) : (
              <div className="space-y-3">
                {combo.items.map((item, index) => {
                  const producto = item.producto_carta;
                  if (!producto) return null;

                  const costoUnitario = productosConCosto[producto.id]?.costo_unitario || 0;
                  const costoTotalProducto = costoUnitario * (item.cantidad || 1);
                  const precioProducto = parseFloat(producto.precio_venta || 0) * (item.cantidad || 1);
                  const gananciaProducto = precioProducto - costoTotalProducto;
                  const margenProducto = precioProducto > 0 
                    ? ((gananciaProducto / precioProducto) * 100).toFixed(1)
                    : '0.0';

                  return (
                    <div key={item.id || index} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-gray-800 text-sm md:text-base">
                            <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 mr-2">x{item.cantidad || 1}</span>
                            {producto.nombre}
                          </h4>
                          <div className="flex gap-3 mt-1 text-xs text-gray-500">
                            <span>Venta: {formatCLP(precioProducto)}</span>
                            <span className="text-gray-300">|</span>
                            <span className="text-red-500">Costo: {formatCLP(costoTotalProducto)}</span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                            <div className="text-xs font-bold text-gray-400 uppercase">Margen Individual</div>
                            <div className={`font-bold ${parseFloat(margenProducto) > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {margenProducto}%
                            </div>
                        </div>
                      </div>

                      {/* Desglose si está disponible */}
                      {productosConCosto[producto.id]?.desglose && (
                        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs">
                          <span className="font-bold text-gray-500 block mb-1">Ingredientes:</span>
                          <ul className="space-y-1 pl-2 border-l-2 border-gray-200">
                            {productosConCosto[producto.id].desglose.map((ing, i) => (
                              <li key={i} className="flex justify-between text-gray-600">
                                <span>{ing.producto}</span>
                                <span>{formatCLP(ing.costo)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Totales finales */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-blue-800 mb-3 border-b border-blue-200 pb-2">Resumen Final</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-blue-700">Precio combo:</span>
                  <span className="font-bold text-gray-800">{formatCLP(precioCombo)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">Costo total:</span>
                  <span className="font-bold text-red-600">{formatCLP(costoTotal)}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-blue-700">Ganancia Neta:</span>
                  <span className={`font-bold ${gananciaValor >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCLP(gananciaValor)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">Margen Real:</span>
                  <span className="font-black text-blue-800">{gananciaPorcentaje}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-xl transition-all shadow-md active:scale-95"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
}
