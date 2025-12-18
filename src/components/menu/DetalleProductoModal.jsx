// src/components/menu/DetalleProductoModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  X, Package, Layers, 
  CheckCircle, XCircle, Calculator, List, RefreshCw, AlertTriangle 
} from 'lucide-react';
import { menuApi } from '../../api/menuApi'; // ✅ Importamos API centralizada

export default function DetalleProductoModal({ isOpen, onClose, producto }) {
  const [costoCalculado, setCostoCalculado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Calcular costo real al abrir el detalle
  useEffect(() => {
    if (!isOpen || !producto?.id) return;

    const calcularCostoReal = async () => {
      setCargando(true);
      setError(null);
      
      try {
        console.log('🔍 Calculando costo para producto:', producto.id, producto.es_compuesto ? 'COMPUESTO' : 'SIMPLE');
        
        // ✅ SIEMPRE usar la API centralizada (Axios)
        const data = await menuApi.calcularCostoProducto(producto.id);
        
        console.log('✅ Costo calculado desde API:', data);
        setCostoCalculado(data);
        
      } catch (e) {
        console.error('❌ Error al calcular costo desde API:', e);
        setError(e.message);
        
        // Fallback: calcular en frontend sin conversión (solo para mostrar algo)
        let costoUnitario = 0;
        let desglose = [];

        if (producto.es_compuesto) {
          const recetaDetalles = producto.receta?.detalles || producto.receta_detalle?.detalles || [];
          
          if (recetaDetalles.length > 0) {
            costoUnitario = recetaDetalles.reduce((sum, detalle) => {
              const precio = parseFloat(
                detalle.producto_inventario?.precio_ultima_compra ??
                detalle.producto_inventario?.precio_compra ??
                0
              );
              const cantidad = parseFloat(detalle.cantidad || 0);
              return sum + (precio * cantidad);
            }, 0);
            
            desglose = recetaDetalles.map(detalle => {
              const precio = parseFloat(
                detalle.producto_inventario?.precio_ultima_compra ??
                detalle.producto_inventario?.precio_compra ??
                0
              );
              const cantidad = parseFloat(detalle.cantidad || 0);
              
              return {
                producto: detalle.producto_inventario?.nombre || 'Desconocido',
                cantidad: cantidad,
                unidad_receta: detalle.unidad_medida?.simbolo || 'unidad',
                unidad_inventario: detalle.producto_inventario?.unidad_medida?.simbolo || 'unidad',
                precio_unitario: precio,
                costo: precio * cantidad,
                advertencia: '⚠️ Sin conversión de unidades (modo offline)'
              };
            });
          }
        } else {
          // Producto simple
          const insumo = producto.productoInventario || producto.producto_inventario_detalle;
          
          if (insumo) {
            costoUnitario = parseFloat(
              insumo.precio_ultima_compra ??
              insumo.precio_compra ??
              0
            );
            
            desglose = [{
              producto: insumo.nombre,
              cantidad: 1,
              unidad_receta: insumo.unidad_medida?.simbolo || 'unidad',
              unidad_inventario: insumo.unidad_medida?.simbolo || 'unidad',
              precio_unitario: costoUnitario,
              costo: costoUnitario
            }];
          }
        }
        
        setCostoCalculado({
          costo_total: costoUnitario,
          costo_unitario: costoUnitario,
          cantidad: 1,
          desglose: desglose
        });
      } finally {
        setCargando(false);
      }
    };

    calcularCostoReal();
  }, [isOpen, producto]); // Dependencia simplificada

  const precioVenta = parseFloat(producto?.precio_venta || 0);
  const costoUnitario = parseFloat(costoCalculado?.costo_unitario || 0);
  const valorNeto = precioVenta - costoUnitario;
  const margenPorcentaje = precioVenta > 0 
    ? ((valorNeto / precioVenta) * 100).toFixed(1)
    : '0.0';

  const formatCLP = (value) => 
    new Intl.NumberFormat('es-CL', { 
      style: 'currency', 
      currency: 'CLP',
      minimumFractionDigits: 0 
    }).format(value);

  if (!isOpen || !producto) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Detalle del Producto</h2>
                <p className="text-blue-100 text-sm">{producto.nombre}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-white/10"
              aria-label="Cerrar"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50/30">
          <div className="space-y-6">
            {/* Estado y tipo */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{producto.nombre}</h3>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                  producto.activo 
                    ? 'bg-green-100 text-green-800 border-green-200' 
                    : 'bg-red-100 text-red-800 border-red-200'
                }`}>
                  {producto.activo ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Activo
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> Inactivo
                    </span>
                  )}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  producto.es_compuesto ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {producto.es_compuesto ? '🧩 Producto Compuesto' : '📦 Producto Simple'}
                </span>
                {cargando && (
                  <span className="flex items-center gap-1 text-blue-600 bg-white px-2 py-1 rounded border border-blue-100 shadow-sm">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Calculando...
                  </span>
                )}
                {error && (
                  <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200 text-xs">
                    <AlertTriangle className="w-3 h-3" /> Offline
                  </span>
                )}
              </div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {producto.descripcion || 'Sin descripción disponible'}
              </p>
            </div>

            {/* Rentabilidad */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                <Calculator className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-gray-800">Rentabilidad</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <p className="text-xs text-emerald-700 mb-1 font-bold uppercase tracking-wider">Precio Venta</p>
                  <p className="text-2xl font-black text-emerald-800 tracking-tight">
                    {formatCLP(precioVenta)}
                  </p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                  <p className="text-xs text-red-700 mb-1 font-bold uppercase tracking-wider">Costo Unitario</p>
                  <p className="text-2xl font-black text-red-800 tracking-tight">
                    {formatCLP(costoUnitario)}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-xs text-blue-700 mb-1 font-bold uppercase tracking-wider">Ganancia Neta</p>
                  <p className={`text-2xl font-black tracking-tight ${
                    valorNeto >= 0 ? 'text-blue-800' : 'text-red-800'
                  }`}>
                    {formatCLP(valorNeto)}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Margen de Ganancia</span>
                  <span className="text-lg font-black text-gray-900">{margenPorcentaje}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-3 rounded-full transition-all duration-1000 ${
                      parseFloat(margenPorcentaje) >= 50 ? 'bg-emerald-500' :
                      parseFloat(margenPorcentaje) >= 30 ? 'bg-green-500' :
                      parseFloat(margenPorcentaje) >= 15 ? 'bg-yellow-500' :
                      parseFloat(margenPorcentaje) >= 5 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(Math.max(parseFloat(margenPorcentaje), 0), 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Categorización */}
            {(producto.categoria || producto.subcategoria || producto.tipo) && (
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                  <Layers className="w-5 h-5 text-purple-600" />
                  <h4 className="font-bold text-gray-800">Categorización</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {producto.categoria && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1 font-medium uppercase">Categoría</p>
                      <p className="font-medium text-gray-900 bg-gray-100 px-3 py-2 rounded-lg border border-gray-200">
                        {producto.categoria}
                      </p>
                    </div>
                  )}
                  {producto.subcategoria && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1 font-medium uppercase">Subcategoría</p>
                      <p className="font-medium text-gray-900 bg-gray-100 px-3 py-2 rounded-lg border border-gray-200">
                        {producto.subcategoria}
                      </p>
                    </div>
                  )}
                  {producto.tipo && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1 font-medium uppercase">Tipo</p>
                      <p className="font-medium text-gray-900 bg-gray-100 px-3 py-2 rounded-lg border border-gray-200">
                        {producto.tipo}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Receta / Ingredientes */}
            {costoCalculado?.desglose && costoCalculado.desglose.length > 0 && (
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                  <List className="w-5 h-5 text-orange-600" />
                  <h4 className="font-bold text-gray-800">
                    {producto.es_compuesto ? 'Receta' : 'Insumo'} 
                    <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {costoCalculado.desglose.length} ingrediente{costoCalculado.desglose.length !== 1 ? 's' : ''}
                    </span>
                  </h4>
                </div>
                
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Ingrediente</th>
                        <th className="px-4 py-3 text-center font-semibold">Cant.</th>
                        <th className="px-4 py-3 text-center font-semibold">Unidad</th>
                        <th className="px-4 py-3 text-right font-semibold">Costo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {costoCalculado.desglose.map((ing, index) => (
                        <tr key={index} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{ing.producto}</div>
                            {ing.advertencia && (
                              <div className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                                  <AlertTriangle size={10}/> {ing.advertencia}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-700 font-mono">
                            {parseFloat(ing.cantidad_convertida || ing.cantidad).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-medium border border-blue-100">
                                {ing.unidad_receta}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-800">
                            {formatCLP(ing.costo)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
                      <tr>
                        <td colSpan="3" className="px-4 py-3 text-right text-gray-600">Costo total:</td>
                        <td className="px-4 py-3 text-right text-red-700 bg-red-50">
                          {formatCLP(costoCalculado.costo_total)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Sin costo definido */}
            {(!costoCalculado || costoUnitario === 0) && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <h4 className="font-bold text-amber-800">Costo no definido</h4>
                </div>
                <p className="text-amber-700 text-sm">
                  {producto.es_compuesto 
                    ? 'Este producto compuesto no tiene una receta con ingredientes y precios definidos.'
                    : 'Este producto simple no está asociado a un producto de inventario con precio definido.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-gray-200 flex justify-end">
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
