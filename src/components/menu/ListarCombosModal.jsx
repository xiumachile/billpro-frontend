// src/components/menu/ListarCombosModal.jsx

import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, Package, Eye, Edit, Trash2, Loader } from 'lucide-react';
import { menuApi } from '../../api/menuApi'; // ✅ Importamos la API centralizada

// ✅ Utilidad local para estimar costo si no hay datos del servidor
const estimarCostoLocal = (producto) => {
  if (!producto) return 0;

  const inv = producto.producto_inventario;
  return parseFloat(
    // 1. Desde producto_inventario
    inv?.precio_ultima_compra ??
    inv?.precio_compra ??
    
    // 2. Desde campos directos
    producto.costo_unitario ??
    producto.costo ??
    producto.precio_costo ??
    
    // 3. Estimación (fallback)
    (producto.precio_venta ? producto.precio_venta * 0.7 : 0) ??
    0
  );
};

export default function ListarCombosModal({
  isOpen,
  onClose,
  combos = [],
  onVerDetalle,
  onEditar,
  onEliminar
}) {
  const [filtro, setFiltro] = useState('');
  const [cargandoCostos, setCargandoCostos] = useState(false);
  const [combosConCosto, setCombosConCosto] = useState({});

  // Calcular costos de combos (suma de costos de productos)
  useEffect(() => {
    if (!isOpen || combos.length === 0) return;

    const calcularCostos = async () => {
      setCargandoCostos(true);
      const nuevosCostos = { ...combosConCosto };

      for (const combo of combos) {
        // Si ya lo calculamos, saltar
        if (nuevosCostos[combo.id] !== undefined) continue;

        let costoTotal = 0;

        try {
          // Calcular costo de cada producto en el combo
          for (const item of combo.items || []) {
            const producto = item.producto_carta;
            if (!producto) continue;

            let costoProducto = 0;
            
            if (producto.es_compuesto) {
              try {
                // ✅ CAMBIO: Usamos menuApi (Axios) en lugar de fetch manual
                const data = await menuApi.calcularCostoProducto(producto.id);
                costoProducto = parseFloat(data.costo_unitario || 0);
              } catch (err) {
                // Fallback si falla la API: calcular con datos locales de la receta
                if (producto.receta?.detalles) {
                  costoProducto = producto.receta.detalles.reduce((sum, d) => {
                    const precio = parseFloat(
                      d.producto_inventario?.precio_ultima_compra ??
                      d.producto_inventario?.precio_compra ??
                      0
                    );
                    return sum + (precio * parseFloat(d.cantidad || 1));
                  }, 0);
                }
              }
            } else {
              // Producto simple: usar función local
              costoProducto = estimarCostoLocal(producto);
            }

            costoTotal += (costoProducto * (item.cantidad || 1));
          }

          nuevosCostos[combo.id] = costoTotal;
          
        } catch (e) {
          console.warn(`Error calculando costo para combo ${combo.nombre}`, e);
        }
      }
      
      setCombosConCosto(nuevosCostos);
      setCargandoCostos(false);
    };

    calcularCostos();
  }, [isOpen, combos]); // Quitamos dependencia de combos.length para evitar loops innecesarios

  // Filtrar combos
  const combosFiltrados = useMemo(() => {
    if (!filtro) return combos;
    const textoLower = filtro.toLowerCase();
    return combos.filter(combo =>
      combo.nombre?.toLowerCase().includes(textoLower) ||
      combo.descripcion?.toLowerCase().includes(textoLower)
    );
  }, [combos, filtro]);

  // Agregar cálculos para la tabla
  const combosConCalculos = useMemo(() => {
    return combosFiltrados.map(combo => {
      let precioVentaTotal = 0;
      let costoTotal = combosConCosto[combo.id] || 0;

      if (combo.items && Array.isArray(combo.items)) {
        combo.items.forEach(item => {
          const producto = item.producto_carta;
          if (!producto) return;
          const precioProducto = parseFloat(producto.precio_venta || 0);
          precioVentaTotal += precioProducto * (item.cantidad || 1);
        });
      }

      const precioCombo = parseFloat(combo.precio || 0);
      const gananciaValor = precioCombo - costoTotal;
      const gananciaPorcentaje = precioCombo > 0 
        ? ((gananciaValor / precioCombo) * 100).toFixed(1)
        : '0.0';

      return {
        ...combo,
        precio_combo: precioCombo,
        precio_venta_total: precioVentaTotal,
        costo_total: costoTotal,
        ganancia_valor: gananciaValor,
        ganancia_porcentaje: gananciaPorcentaje
      };
    });
  }, [combosFiltrados, combosConCosto]);

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este combo?')) {
      try {
        await onEliminar(id);
      } catch (error) {
        console.error('Error al eliminar combo:', error);
        alert('Error al eliminar el combo');
      }
    }
  };

  const formatCLP = (value) => 
    new Intl.NumberFormat('es-CL', { 
      style: 'currency', 
      currency: 'CLP',
      minimumFractionDigits: 0 
    }).format(value);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[85vh] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Listado de Combos</h2>
                <p className="text-purple-100 text-sm">
                  {combosConCalculos.length} de {combos.length} combos
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Búsqueda */}
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="relative max-w-md mx-auto">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar combos..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            {cargandoCostos && (
              <Loader className="w-4 h-4 animate-spin absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            )}
          </div>
        </div>

        {/* Tabla */}
        <div className="flex-1 overflow-auto">
          {combosConCalculos.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {filtro 
                  ? 'No se encontraron combos que coincidan con la búsqueda' 
                  : 'No hay combos disponibles'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Combo</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Precio Combo</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Precio Normal</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Costo Total</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Ganancia</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Margen</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {combosConCalculos.map((combo) => {
                    const precioCombo = combo.precio_combo;
                    const precioNormal = combo.precio_venta_total;
                    const costoTotal = combo.costo_total;
                    const gananciaValor = combo.ganancia_valor;
                    const margenPorcentaje = parseFloat(combo.ganancia_porcentaje);

                    return (
                      <tr key={combo.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">{combo.nombre}</div>
                          <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {combo.descripcion || 'Sin descripción'}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {combo.items?.length || 0} producto{combo.items?.length !== 1 ? 's' : ''}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              combo.activo 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {combo.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-bold text-blue-700">
                            {formatCLP(precioCombo)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-gray-600">
                            {formatCLP(precioNormal)}
                          </span>
                          {precioNormal > precioCombo && (
                            <div className="text-xs text-amber-600 mt-1">
                              Ahorro: {((precioNormal - precioCombo) / precioNormal * 100).toFixed(1)}%
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-semibold text-red-600">
                            {formatCLP(costoTotal)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-semibold ${
                            gananciaValor >= 0 ? 'text-emerald-700' : 'text-red-700'
                          }`}>
                            {formatCLP(gananciaValor)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-semibold text-gray-800">{margenPorcentaje}%</span>
                            <div className="w-20 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${
                                  margenPorcentaje >= 50 ? 'bg-emerald-500' :
                                  margenPorcentaje >= 30 ? 'bg-green-500' :
                                  margenPorcentaje >= 15 ? 'bg-yellow-500' :
                                  margenPorcentaje >= 5 ? 'bg-orange-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(Math.max(margenPorcentaje, 0), 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => onVerDetalle(combo)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Ver detalle"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onEditar(combo)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Editar combo"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEliminar(combo.id)}
                              className="p-2 text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Eliminar combo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 rounded-b-2xl border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
