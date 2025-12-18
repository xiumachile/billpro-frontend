import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { menuApi } from '../../api/menuApi';
import { 
  ArrowLeft, Globe, Lock, Save, Utensils, Timer, Bike, ShoppingBag, Printer 
} from 'lucide-react';

export default function ConfiguracionVarios() {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  
  // --- ESTADOS LOCALES (LocalStorage) ---
  const [bloqueoTerminal, setBloqueoTerminal] = useState(false);
  const [modoBuffet, setModoBuffet] = useState(false);
  const [tiempoLimite, setTiempoLimite] = useState(90);
  const [imprimirFinal, setImprimirFinal] = useState(false); // ✅ Nuevo estado

  // --- ESTADOS DE BASE DE DATOS (Secuencias) ---
  const [secuencias, setSecuencias] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Carga Inicial
  useEffect(() => {
    // Cargar config Local
    setBloqueoTerminal(localStorage.getItem('config_bloqueo_terminal') === 'true');
    setModoBuffet(localStorage.getItem('config_modo_buffet') === 'true');
    setTiempoLimite(localStorage.getItem('config_tiempo_buffet') || 90);
    setImprimirFinal(localStorage.getItem('config_imprimir_final') === 'true');

    // Cargar config Backend
    cargarSecuencias();
  }, []);

  const cargarSecuencias = async () => {
      try {
          const res = await menuApi.getSecuencias();
          const data = Array.isArray(res) ? res : (res.data || []);
          setSecuencias(data);
      } catch (error) {
          console.error("Error cargando secuencias", error);
      }
  };

  const handleSecuenciaChange = (id, field, value) => {
      setSecuencias(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleGuardar = async () => {
    setLoading(true);
    try {
        // A. Guardar en Navegador (Configuración por dispositivo)
        localStorage.setItem('config_bloqueo_terminal', bloqueoTerminal);
        localStorage.setItem('config_modo_buffet', modoBuffet);
        localStorage.setItem('config_tiempo_buffet', tiempoLimite);
        localStorage.setItem('config_imprimir_final', imprimirFinal);

        // B. Guardar en Servidor (Configuración global del negocio)
        if (secuencias.length > 0) {
            await menuApi.updateSecuencias(secuencias);
        }
        
        alert("✅ Configuración guardada correctamente.");
    } catch (error) {
        console.error(error);
        alert("Error al guardar la configuración en el servidor.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      {/* HEADER */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/parametros')} className="p-2 bg-white border rounded-full hover:bg-gray-100">
                <ArrowLeft size={20}/>
            </button>
            <h1 className="text-2xl font-bold text-slate-800">Configuración Varios</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* 1. IDIOMA */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2 mb-4">
                <Globe className="text-blue-600"/> {t('language')}
            </h2>
            <div className="grid grid-cols-3 gap-4">
                <button onClick={() => setLanguage('es')} className={`p-4 rounded-xl border-2 text-center transition-all ${language === 'es' ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold' : 'border-gray-200 hover:border-gray-300'}`}>🇪🇸 Español</button>
                <button onClick={() => setLanguage('en')} className={`p-4 rounded-xl border-2 text-center transition-all ${language === 'en' ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold' : 'border-gray-200 hover:border-gray-300'}`}>🇺🇸 English</button>
                <button onClick={() => setLanguage('zh')} className={`p-4 rounded-xl border-2 text-center transition-all ${language === 'zh' ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold' : 'border-gray-200 hover:border-gray-300'}`}>🇨🇳 中文</button>
            </div>
        </div>

        {/* 2. BLOQUEO TERMINAL */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2 mb-4">
                <Lock className="text-red-600"/> {t('screen_lock')}
            </h2>
            <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <input 
                    type="checkbox" 
                    id="checkBloqueo" 
                    className="w-5 h-5 mt-1 cursor-pointer" 
                    checked={bloqueoTerminal} 
                    onChange={(e) => setBloqueoTerminal(e.target.checked)} 
                />
                <label htmlFor="checkBloqueo" className="cursor-pointer">
                    <span className="block font-bold text-slate-800">Activar bloqueo automático tras pedido</span>
                    <span className="block text-sm text-slate-500 mt-1">{t('screen_lock_desc')}</span>
                </label>
            </div>
        </div>

        {/* 3. MODO BUFFET */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2 mb-4">
                <Utensils className="text-orange-500"/> Modo Buffet
            </h2>
            <div className="space-y-4 bg-orange-50 p-4 rounded-lg border border-orange-100">
                <div className="flex items-center gap-3">
                    <input 
                        type="checkbox" 
                        id="checkBuffet" 
                        className="w-5 h-5 cursor-pointer" 
                        checked={modoBuffet} 
                        onChange={(e) => setModoBuffet(e.target.checked)} 
                    />
                    <label htmlFor="checkBuffet" className="cursor-pointer font-medium text-slate-800">
                        Activar Control de Tiempo y Comensales
                    </label>
                </div>
                {modoBuffet && (
                    <div className="flex items-center gap-4 pl-8 animate-in fade-in">
                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <Timer size={16}/> Tiempo Límite (Minutos):
                        </label>
                        <input 
                            type="number" 
                            className="w-24 p-2 border border-gray-300 rounded-lg text-center font-bold" 
                            value={tiempoLimite} 
                            onChange={(e) => setTiempoLimite(e.target.value)} 
                        />
                    </div>
                )}
            </div>
        </div>

        {/* ✅ 4. FLUJO DE IMPRESIÓN (NUEVO) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2 mb-4">
                <Printer className="text-blue-600"/> Flujo de Impresión
            </h2>
            <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <input 
                    type="checkbox" 
                    id="checkPrintFinal"
                    className="w-5 h-5 mt-1 cursor-pointer"
                    checked={imprimirFinal}
                    onChange={(e) => setImprimirFinal(e.target.checked)}
                />
                <label htmlFor="checkPrintFinal" className="cursor-pointer">
                    <span className="block font-bold text-slate-800">Ofrecer imprimir comprobante al finalizar pago</span>
                    <span className="block text-sm text-slate-500 mt-1">
                        Si está activado, el sistema preguntará "¿Desea imprimir comprobante?" después de cobrar correctamente.
                        <br/>Ideal para entregar copia al cliente.
                    </span>
                </label>
            </div>
        </div>

        {/* 5. NUMERACIÓN DE PEDIDOS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2 mb-4">
                <ShoppingBag className="text-green-600"/> Numeración de Pedidos
            </h2>
            
            {loading && secuencias.length === 0 ? (
                <p className="text-center text-gray-500">Cargando configuración...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {secuencias.map(seq => (
                        <div key={seq.id} className="border rounded-xl p-4 bg-gray-50">
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                                {seq.tipo === 'delivery' ? <Bike className="text-blue-600"/> : <ShoppingBag className="text-purple-600"/>}
                                <span className="font-bold uppercase text-gray-700">{seq.tipo === 'takeout' ? 'Para Llevar' : seq.tipo}</span>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Prefijo Ticket</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-2 border rounded font-mono font-bold uppercase"
                                        value={seq.prefijo}
                                        onChange={(e) => handleSecuenciaChange(seq.id, 'prefijo', e.target.value)}
                                        placeholder="Ej: D-"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Número Inicial / Reinicio</label>
                                    <input 
                                        type="number" 
                                        className="w-full p-2 border rounded font-mono font-bold"
                                        value={seq.numero_inicial}
                                        onChange={(e) => handleSecuenciaChange(seq.id, 'numero_inicial', e.target.value)}
                                    />
                                </div>
                                <div className="flex items-start gap-2 pt-2">
                                    <input 
                                        type="checkbox" 
                                        id={`check-${seq.id}`} 
                                        className="w-4 h-4 mt-0.5 cursor-pointer"
                                        checked={seq.reset_al_abrir_caja}
                                        onChange={(e) => handleSecuenciaChange(seq.id, 'reset_al_abrir_caja', e.target.checked)}
                                    />
                                    <label htmlFor={`check-${seq.id}`} className="text-xs text-gray-600 cursor-pointer leading-tight">
                                        Resetear contador al número inicial cada vez que se abra caja.
                                    </label>
                                </div>
                                <div className="text-right text-xs text-gray-400 mt-2">
                                    Actual: <strong>{seq.numero_actual}</strong>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        <button 
            onClick={handleGuardar} 
            disabled={loading} 
            className="w-full py-4 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:bg-gray-400"
        >
            <Save size={20}/> {loading ? 'Guardando...' : t('save')}
        </button>

      </div>
    </div>
  );
}
