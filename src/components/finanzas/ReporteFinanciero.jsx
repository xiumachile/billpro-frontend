import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { finanzasApi } from '../../api/finanzasApi';
import { 
    ArrowLeft, Calendar, TrendingUp, TrendingDown, DollarSign, 
    AlertCircle, Wallet, CreditCard, Banknote, Gift 
} from 'lucide-react';

export default function ReporteFinanciero() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [datos, setDatos] = useState(null);

  const hoy = new Date();
  const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
  const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().slice(0, 10);

  const [fechaDesde, setFechaDesde] = useState(primerDia);
  const [fechaHasta, setFechaHasta] = useState(ultimoDia);

  useEffect(() => {
    cargarReporte();
  }, [fechaDesde, fechaHasta]);

  const cargarReporte = async () => {
    setLoading(true);
    try {
        const res = await finanzasApi.getBalance(fechaDesde, fechaHasta);
        if (res.success) setDatos(res.data);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  if (!datos) return <div className="p-10 text-center">Cargando reporte...</div>;

  const { resumen_economico, cuentas, pasivos, graficos } = datos;
  const esGanancia = resumen_economico.utilidad_neta >= 0;

  return (
    <div className="min-h-screen bg-slate-100 p-6 font-sans">
        {/* Header */}
        <div className="max-w-6xl mx-auto mb-6 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/')} className="p-2 bg-white border rounded-full hover:bg-gray-100">
                    <ArrowLeft size={20}/>
                </button>
                <h1 className="text-2xl font-bold text-slate-800">Balance Financiero</h1>
            </div>
            <div className="bg-white p-2 rounded-lg shadow-sm border flex items-center gap-2">
                <Calendar size={16} className="text-slate-400"/>
                <input type="date" value={fechaDesde} onChange={e=>setFechaDesde(e.target.value)} className="text-sm outline-none font-bold text-slate-700"/>
                <span className="text-slate-400">➜</span>
                <input type="date" value={fechaHasta} onChange={e=>setFechaHasta(e.target.value)} className="text-sm outline-none font-bold text-slate-700"/>
            </div>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 1. RESULTADO ECONÓMICO (UTILIDAD REAL) */}
            <div className={`lg:col-span-3 p-8 rounded-2xl shadow-lg flex items-center justify-between text-white ${esGanancia ? 'bg-gradient-to-r from-emerald-600 to-teal-700' : 'bg-gradient-to-r from-red-600 to-orange-700'}`}>
                <div>
                    <p className="text-white/80 font-medium mb-1 uppercase tracking-wide">Utilidad Neta (Sin Propinas)</p>
                    <h2 className="text-5xl font-black flex items-center gap-2">
                        {esGanancia ? '+' : ''} ${Math.round(resumen_economico.utilidad_neta).toLocaleString('es-CL')}
                    </h2>
                    <p className="mt-2 text-sm opacity-90">
                        Ventas Netas: ${Math.round(resumen_economico.ventas_netas).toLocaleString()}  |  Gastos: -${Math.round(resumen_economico.egresos_operativos).toLocaleString()}
                    </p>
                </div>
                <div className="opacity-30">
                    {esGanancia ? <TrendingUp size={100}/> : <TrendingDown size={100}/>}
                </div>
            </div>

            {/* 2. CUENTA BANCO (FLUJO REAL) */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><CreditCard size={80} className="text-blue-600"/></div>
                <h3 className="text-blue-800 font-bold uppercase text-xs tracking-wider mb-2 flex items-center gap-2">
                    <CreditCard size={16}/> Cuenta Banco
                </h3>
                <div className="space-y-2 relative z-10">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Ingresos (Transbank)</span>
                        <span className="font-bold text-blue-600">+${Math.round(cuentas.banco.ingresos).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Egresos (Transferencias)</span>
                        <span className="font-bold text-red-500">-${Math.round(cuentas.banco.egresos).toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2 mt-1 flex justify-between items-center">
                        <span className="font-bold text-gray-700">Flujo Neto</span>
                        <span className={`font-black text-lg ${cuentas.banco.saldo >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                            ${Math.round(cuentas.banco.saldo).toLocaleString()}
                        </span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">* Incluye propinas pagadas con tarjeta</p>
                </div>
            </div>

            {/* 3. CUENTA CAJA (FLUJO REAL) */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Banknote size={80} className="text-emerald-600"/></div>
                <h3 className="text-emerald-800 font-bold uppercase text-xs tracking-wider mb-2 flex items-center gap-2">
                    <Banknote size={16}/> Cuenta Efectivo
                </h3>
                <div className="space-y-2 relative z-10">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Ingresos (Caja)</span>
                        <span className="font-bold text-emerald-600">+${Math.round(cuentas.caja.ingresos).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Egresos (Caja)</span>
                        <span className="font-bold text-red-500">-${Math.round(cuentas.caja.egresos).toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2 mt-1 flex justify-between items-center">
                        <span className="font-bold text-gray-700">Flujo Neto</span>
                        <span className={`font-black text-lg ${cuentas.caja.saldo >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                            ${Math.round(cuentas.caja.saldo).toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* 4. PASIVOS (DEUDAS) */}
            <div className="lg:col-span-1 bg-white p-5 rounded-2xl shadow-sm border-l-4 border-orange-500 flex flex-col justify-center">
                <h3 className="text-gray-500 font-bold uppercase text-xs tracking-wider mb-3 flex items-center gap-2">
                    <AlertCircle size={16}/> Pasivos (Deudas)
                </h3>
                
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Proveedores</span>
                    <span className="font-bold text-red-600">${Math.round(pasivos.proveedores_por_pagar).toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-sm text-gray-600 flex items-center gap-1"><Gift size={14}/> Propinas Acum.</span>
                    <span className="font-bold text-purple-600">${Math.round(pasivos.propinas_por_pagar).toLocaleString()}</span>
                </div>
            </div>

            {/* 5. GASTOS DETALLE */}
            <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-lg mb-4 text-slate-700">Desglose de Gastos Operativos</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {graficos.gastos_por_categoria.map((cat, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="block text-xs text-gray-500 mb-1 truncate">{cat.categoria}</span>
                            <span className="block font-bold text-gray-800">${Math.round(cat.total).toLocaleString()}</span>
                        </div>
                    ))}
                    {graficos.gastos_por_categoria.length === 0 && <p className="text-gray-400 text-sm col-span-4 text-center">Sin gastos registrados.</p>}
                </div>
            </div>

        </div>
    </div>
  );
}
