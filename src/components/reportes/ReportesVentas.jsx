import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { menuApi } from '../../api/menuApi';
import { 
  ArrowLeft, Calendar, DollarSign, CreditCard, Printer, Filter, PieChart, Package, Bike, Loader,
  Archive, User, Tag, Gift, Smartphone 
} from 'lucide-react';
import './ReportesVentas.css'; // ✅ 1. IMPORTAR CSS

export default function ReportesVentas({ usuario, onVolver }) {
  // ... (Toda la lógica de estados, efectos y cálculos se mantiene IGUAL) ...
  const navigate = useNavigate();
  // ... copiar lógica ...
  // (Omito la lógica repetida para no hacer spam, solo muestro el RETURN modificado)
  
  // Helper Fecha Local
  const formatearFechaLocal = (fecha) => {
    const d = new Date(fecha);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [fechaDesde, setFechaDesde] = useState(formatearFechaLocal(new Date()));
  const [fechaHasta, setFechaHasta] = useState(formatearFechaLocal(new Date()));
  
  const [pedidos, setPedidos] = useState([]);
  const [factoresConversion, setFactoresConversion] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [appsDelivery, setAppsDelivery] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tabActiva, setTabActiva] = useState('general'); 
  const [filtroVendedor, setFiltroVendedor] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');

  useEffect(() => {
    const cargarMaestros = async () => {
        try {
            const [factoresRes, catRes, appsRes] = await Promise.all([
                menuApi.getFactoresConversion ? menuApi.getFactoresConversion() : Promise.resolve([]),
                menuApi.getCategorias(),
                menuApi.getAppsDelivery() 
            ]); 
            setFactoresConversion(Array.isArray(factoresRes) ? factoresRes : (factoresRes.data || []));
            setCategorias(Array.isArray(catRes) ? catRes : (catRes.data || []));
            setAppsDelivery(Array.isArray(appsRes) ? appsRes : (appsRes.data || []));
        } catch (e) { console.error(e); }
    };
    cargarMaestros();
  }, []);

  useEffect(() => {
    cargarReporte();
  }, [fechaDesde, fechaHasta]);

  const cargarReporte = async () => {
    setLoading(true);
    try {
      const params = {
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        estados: ['pagado', 'entregado'] 
      };
      const respuesta = await menuApi.getReporteVentas(params); 
      const data = Array.isArray(respuesta) ? respuesta : (respuesta.data || []);
      setPedidos(data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const vendedoresDisponibles = useMemo(() => {
      const map = new Map();
      pedidos.forEach(p => { if (p.mozo) map.set(p.mozo.id, p.mozo.nombre_completo || p.mozo.username); });
      return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [pedidos]);

  const convertirCantidad = (cantidad, unidadOrigen, unidadDestino) => { /* ... lógica igual ... */ 
      const cant = parseFloat(cantidad);
      if (isNaN(cant) || !unidadOrigen || !unidadDestino) return cant || 0;
      const idOr = parseInt(unidadOrigen.id);
      const idDes = parseInt(unidadDestino.id);
      if (idOr === idDes) return cant;
      const factorDirecto = factoresConversion.find(f => parseInt(f.unidad_origen_id) === idOr && parseInt(f.unidad_destino_id) === idDes);
      if (factorDirecto) return cant * parseFloat(factorDirecto.factor);
      const factorInverso = factoresConversion.find(f => parseInt(f.unidad_origen_id) === idDes && parseInt(f.unidad_destino_id) === idOr);
      if (factorInverso) return cant / parseFloat(factorInverso.factor);
      return cant; 
  };
  
  const calcularCostoProducto = (producto) => { /* ... lógica igual ... */ 
      if (!producto) return 0;
      if (producto.receta?.detalles && producto.receta.detalles.length > 0) {
        return producto.receta.detalles.reduce((acumulado, detalle) => {
          const insumo = detalle.productoInventario || detalle.producto_inventario;
          if (!insumo) return acumulado;
          const precioInsumo = parseFloat(insumo.precio_ultima_compra || insumo.precio_compra || 0);
          const cantidadReceta = parseFloat(detalle.cantidad || 0);
          const uReceta = detalle.unidadMedida || detalle.unidad_medida;   
          const uInsumo = insumo.unidadMedida || insumo.unidad_medida;     
          const cantidadNormalizada = convertirCantidad(cantidadReceta, uReceta, uInsumo);
          return acumulado + (cantidadNormalizada * precioInsumo);
        }, 0);
      }
      const insumoDirecto = producto.productoInventario || producto.producto_inventario;
      if (insumoDirecto) {
          return parseFloat(insumoDirecto.precio_ultima_compra || insumoDirecto.precio_compra || 0);
      }
      return 0;
  };

  const metricas = useMemo(() => {
    let totalVentasNetas = 0; let totalPropinas = 0; let totalCostoGlobal = 0; let totalFlujoCaja = 0;   
    const mapaUsuarios = {}; const mapaProductosCantidad = {}; const metodosPago = {}; const canalesVenta = {};
    let cantidadPedidosFiltrados = 0;

    pedidos.forEach((pedido) => {
        if (filtroVendedor && String(pedido.id_mozo) !== String(filtroVendedor)) return;
        const consumo = parseFloat(pedido.total || 0);
        const descuento = parseFloat(pedido.descuento || 0);
        const propina = parseFloat(pedido.propina || 0);
        const ventaNetaPedido = consumo - descuento;
        const pagadoReal = parseFloat(pedido.total_pagado) > 0 ? parseFloat(pedido.total_pagado) : (ventaNetaPedido + propina);

        let ventaFiltrada = 0; let costoFiltrado = 0; let tieneItemsValidos = false;

        if (!filtroCategoria) {
            tieneItemsValidos = true; ventaFiltrada = ventaNetaPedido;
            totalVentasNetas += ventaNetaPedido; totalPropinas += propina; totalFlujoCaja += pagadoReal;
            const metodo = pedido.forma_pago || (pedido.tipo_pedido === 'app' ? 'Plataforma App' : 'Sin Definir');
            metodosPago[metodo] = (metodosPago[metodo] || 0) + pagadoReal;
            
            const tipoRaw = pedido.tipo_pedido || 'local';
            let labelCanal = 'Local';
            if (tipoRaw === 'mesa' || tipoRaw === 'local') labelCanal = 'Mesa / Salón';
            else if (tipoRaw === 'takeout') labelCanal = 'Para Llevar';
            else if (tipoRaw === 'delivery') labelCanal = 'Delivery Propio';
            else if (tipoRaw === 'app') {
                const app = appsDelivery.find(a => a.id === pedido.app_delivery_id);
                labelCanal = app ? app.nombre : 'App (Desconocida)';
            }
            canalesVenta[labelCanal] = (canalesVenta[labelCanal] || 0) + ventaNetaPedido;

            const nombreMozo = pedido.mozo?.nombre_completo || pedido.mozo?.username || 'Sin Asignar';
            if (!mapaUsuarios[nombreMozo]) mapaUsuarios[nombreMozo] = { nombre: nombreMozo, total: 0, pedidos: 0 };
            mapaUsuarios[nombreMozo].total += ventaNetaPedido; mapaUsuarios[nombreMozo].pedidos += 1;
        }

        if (pedido.items) {
            pedido.items.forEach((item) => {
                const prod = item.producto;
                if (!prod) return;
                const catId = prod.categoria_id || prod.categoria?.id;
                if (filtroCategoria && String(catId) !== String(filtroCategoria)) return;
                tieneItemsValidos = true;
                const cantidad = parseFloat(item.cantidad || 0);
                const costoUnitario = calcularCostoProducto(prod); 
                const costoTotalItem = costoUnitario * cantidad;
                if (filtroCategoria) {
                     const precioVentaItem = parseFloat(item.precio_unitario || 0) * cantidad;
                     ventaFiltrada += precioVentaItem; costoFiltrado += costoTotalItem;
                } else {
                     totalCostoGlobal += costoTotalItem;
                }
                const nombre = prod.nombre;
                if (!mapaProductosCantidad[nombre]) mapaProductosCantidad[nombre] = { nombre, cantidad: 0 };
                mapaProductosCantidad[nombre].cantidad += cantidad;
            });
        }
        if (pedido.combos) {
            pedido.combos.forEach((comboPed) => {
                const combo = comboPed.combo;
                const catId = combo?.categoria_id; 
                if (filtroCategoria && String(catId) !== String(filtroCategoria)) return;
                tieneItemsValidos = true;
                const cantidadCombos = parseFloat(comboPed.cantidad || 0);
                let costoTotalComboUnitario = 0;
                let itemsDelCombo = comboPed.items || combo?.items || [];
                itemsDelCombo.forEach((rowItem) => {
                    const prodCarta = rowItem.producto; if (!prodCarta) return;
                    const cantidadPorCombo = parseFloat(rowItem.cantidad || 1);
                    const costoUnitarioProd = calcularCostoProducto(prodCarta);
                    costoTotalComboUnitario += (costoUnitarioProd * cantidadPorCombo);
                });
                const costoTotalBloque = costoTotalComboUnitario * cantidadCombos;
                if (filtroCategoria) {
                     const ventaCombo = parseFloat(comboPed.precio_unitario || 0) * cantidadCombos;
                     ventaFiltrada += ventaCombo; costoFiltrado += costoTotalBloque;
                } else {
                     totalCostoGlobal += costoTotalBloque;
                }
            });
        }
        if (filtroCategoria && tieneItemsValidos) {
            cantidadPedidosFiltrados++; totalVentasNetas += ventaFiltrada; totalCostoGlobal += costoFiltrado;
        } else if (!filtroCategoria) {
            cantidadPedidosFiltrados++;
        }
    });

    const gananciaGlobal = totalVentasNetas - totalCostoGlobal;
    const margenGlobal = totalVentasNetas > 0 ? (gananciaGlobal / totalVentasNetas) * 100 : 0;
    const rankingUsuarios = Object.values(mapaUsuarios).sort((a, b) => b.total - a.total);
    const rankingProductos = Object.values(mapaProductosCantidad).sort((a, b) => b.cantidad - a.cantidad);

    return { totalVentasNetas, totalPropinas, totalCostoGlobal, totalFlujoCaja, gananciaGlobal, margenGlobal, metodosPago, canalesVenta, cantidadPedidos: cantidadPedidosFiltrados, rankingUsuarios, rankingProductos };
  }, [pedidos, factoresConversion, filtroVendedor, filtroCategoria, appsDelivery]);

  const setRango = (tipo) => {
    const hoy = new Date(); 
    let fInicio, fFin;
    if (tipo === 'hoy') { fInicio = formatearFechaLocal(hoy); fFin = formatearFechaLocal(hoy); } 
    else if (tipo === 'ayer') { const ayer = new Date(hoy); ayer.setDate(ayer.getDate() - 1); fInicio = formatearFechaLocal(ayer); fFin = formatearFechaLocal(ayer); } 
    else if (tipo === 'semana') { const semana = new Date(hoy); semana.setDate(semana.getDate() - 7); fInicio = formatearFechaLocal(semana); fFin = formatearFechaLocal(hoy); } 
    else if (tipo === 'mes') { const mes = new Date(hoy); mes.setDate(1); fInicio = formatearFechaLocal(mes); fFin = formatearFechaLocal(hoy); }
    setFechaDesde(fInicio); setFechaHasta(fFin);
  };

  const formatMoney = (val) => `$ ${Math.round(val || 0).toLocaleString('es-CL')}`;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* 2. AGREGAR CLASE no-print AL HEADER */}
      <div className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm no-print">
           <div className="flex items-center gap-4">
               <button onClick={onVolver} className="p-2 hover:bg-slate-100 rounded-full"><ArrowLeft size={24}/></button>
               <h1 className="text-2xl font-bold">Reportes de Ventas</h1>
           </div>
           <div className="flex gap-3">
               <button onClick={() => navigate('/caja/historial')} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg font-bold"><Archive size={16}/> Cierres de Caja</button>
               <button className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-slate-50" onClick={()=>window.print()}><Printer size={16}/> Imprimir</button>
           </div>
      </div>

      {/* 3. AGREGAR ID PARA EL AREA IMPRIMIBLE */}
      <div id="dashboard-printable" className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        
        {/* HEADER SOLO PARA IMPRESIÓN (Opcional, para que sepa qué fechas son) */}
        <div className="hidden print:block mb-4 text-center">
            <h2 className="text-2xl font-bold">Reporte de Ventas</h2>
            <p>Desde: {fechaDesde} - Hasta: {fechaHasta}</p>
        </div>

        {/* AGREGAR CLASE no-print A LOS FILTROS */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center justify-between no-print">
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg border">
                    <Calendar size={18} className="text-slate-500"/>
                    <input type="date" value={fechaDesde} onChange={e=>setFechaDesde(e.target.value)} className="bg-transparent outline-none text-sm font-medium"/>
                    <span className="text-slate-400">➜</span>
                    <input type="date" value={fechaHasta} onChange={e=>setFechaHasta(e.target.value)} className="bg-transparent outline-none text-sm font-medium"/>
                </div>
                <div className="flex gap-1">
                    <button onClick={()=>setRango('hoy')} className="px-3 py-2 text-xs font-bold bg-blue-50 text-blue-700 rounded-lg">Hoy</button>
                    <button onClick={()=>setRango('ayer')} className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Ayer</button>
                </div>
                <button onClick={cargarReporte} className="p-2 bg-blue-600 text-white rounded-lg ml-2"><Filter size={18}/></button>
            </div>
            {/* ...Selects de filtros... */}
            <div className="flex gap-3 flex-wrap">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><User size={16} /></div>
                    <select value={filtroVendedor} onChange={(e) => setFiltroVendedor(e.target.value)} className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium cursor-pointer">
                        <option value="">Todos los Vendedores</option>
                        {vendedoresDisponibles.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
                    </select>
                </div>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Tag size={16} /></div>
                    <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium cursor-pointer">
                        <option value="">Todas las Categorías</option>
                        {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                </div>
            </div>
        </div>

        {/* AGREGAR CLASE no-print A LOS TABS */}
        <div className="flex border-b border-slate-200 gap-6 no-print">
            <button onClick={()=>setTabActiva('general')} className={`pb-3 text-sm font-bold border-b-2 ${tabActiva==='general' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>Resumen General</button>
            <button onClick={()=>setTabActiva('ranking')} className={`pb-3 text-sm font-bold border-b-2 ${tabActiva==='ranking' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>Rankings</button>
        </div>

        {loading ? <div className="text-center py-20 text-slate-400"><Loader className="animate-spin inline mr-2"/> Cargando datos...</div> : (
            <div className="animate-in fade-in duration-300">
                {/* 
                    Como queremos imprimir TODO el reporte (resumen + ranking) aunque estén en tabs separadas en pantalla,
                    un truco es renderizar ambas pero ocultar una u otra según la pantalla, y mostrarlas todas al imprimir.
                    
                    Por ahora, para mantenerlo simple, imprimiremos LO QUE SE VE.
                */}
                {tabActiva === 'general' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <KPI_Card title="Ventas Netas" value={formatMoney(metricas.totalVentasNetas)} icon={<DollarSign/>} color="green" subtitle="Ingreso Real (Sin Propinas)"/>
                            <KPI_Card title="Propinas" value={formatMoney(metricas.totalPropinas)} icon={<Gift/>} color="purple" subtitle="Recaudado para Personal"/>
                            <KPI_Card title="Costo Insumos" value={formatMoney(metricas.totalCostoGlobal)} icon={<Package/>} color="red" subtitle="Calculado según Receta"/>
                            <KPI_Card title="Utilidad Bruta" value={formatMoney(metricas.gananciaGlobal)} icon={<PieChart/>} color="blue" subtitle={`Margen: ${Math.round(metricas.margenGlobal)}%`}/>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-700"><CreditCard size={20}/> Flujo de Caja (Total Recibido)</h3>
                                <div className="space-y-3">
                                    {Object.entries(metricas.metodosPago).map(([k, v], i) => (
                                        <BarraProgreso key={i} label={k} value={v} total={metricas.totalFlujoCaja} color="bg-blue-600" />
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-700"><Smartphone size={20}/> Ventas por Canal</h3>
                                <div className="space-y-3">
                                    {Object.entries(metricas.canalesVenta).map(([k, v], i) => (
                                        <BarraProgreso 
                                            key={i} 
                                            label={k} 
                                            value={v} 
                                            total={metricas.totalVentasNetas} 
                                            color={k.includes('App') || k === 'Uber' || k === 'Rappi' ? 'bg-purple-500' : 'bg-orange-500'} 
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {tabActiva === 'ranking' && (
                    <div className="grid grid-cols-1 gap-6">
                        <div className="bg-white rounded-xl shadow border overflow-hidden">
                            <div className="p-4 bg-slate-50 border-b font-bold text-slate-700">🏆 Ventas por Usuario (Neto)</div>
                            <TableResponsive headers={['Usuario', 'Pedidos', 'Total Neto']} data={metricas.rankingUsuarios} renderRow={(u) => <><td className="p-3 font-medium">{u.nombre}</td><td className="p-3 text-center">{u.pedidos}</td><td className="p-3 text-right font-bold">{formatMoney(u.total)}</td></>} />
                        </div>
                        <div className="bg-white rounded-xl shadow border overflow-hidden">
                            <div className="p-4 bg-slate-50 border-b font-bold text-slate-700">🍕 Productos más vendidos</div>
                            <div className="max-h-96 overflow-y-auto">
                                <TableResponsive headers={['Producto', 'Cantidad']} data={metricas.rankingProductos} renderRow={(p) => <><td className="p-3 font-medium">{p.nombre}</td><td className="p-3 text-center font-bold text-blue-600">{p.cantidad}</td></>} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
}

// ... (KPI_Card, BarraProgreso, TableResponsive se mantienen igual)
const KPI_Card = ({ title, value, icon, color, subtitle }) => {
    const colors = { green: 'bg-green-100 text-green-600', purple: 'bg-purple-100 text-purple-600', red: 'bg-red-100 text-red-600', blue: 'bg-blue-100 text-blue-600', orange: 'bg-orange-100 text-orange-600' };
    return <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"><div className="flex justify-between items-start mb-2"><div><p className="text-sm font-medium text-slate-500 mb-1">{title}</p><h3 className="text-2xl font-bold text-slate-800">{value}</h3></div><div className={`p-3 rounded-lg ${colors[color]}`}>{icon}</div></div>{subtitle && <div className="text-xs text-slate-400 font-medium">{subtitle}</div>}</div>;
};

const BarraProgreso = ({ label, value, total, color }) => {
    const porcentaje = total > 0 ? (value / total) * 100 : 0;
    const formatMoney = (amount) => `$ ${Math.round(amount).toLocaleString('es-CL')}`;
    return <div className="relative"><div className="flex justify-between text-sm mb-1"><span className="font-medium text-slate-700 capitalize">{label}</span><span className="font-bold text-slate-900">{formatMoney(value)}</span></div><div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden"><div className={`${color} h-2.5 rounded-full`} style={{ width: `${porcentaje}%` }}></div></div><p className="text-xs text-right text-slate-400 mt-0.5">{porcentaje.toFixed(1)}%</p></div>;
};

const TableResponsive = ({ headers, data, renderRow }) => (
    <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-500 sticky top-0 z-10"><tr>{headers.map((h, i) => <th key={i} className={`p-3 ${i > 0 ? 'text-right' : 'text-left'}`}>{h}</th>)}</tr></thead><tbody className="divide-y">{data.map((item, i) => <tr key={i} className="hover:bg-slate-50">{renderRow(item)}</tr>)}</tbody></table>{data.length === 0 && <p className="text-center py-4 text-slate-400">No hay datos.</p>}</div>
);
