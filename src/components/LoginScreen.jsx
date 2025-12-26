import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axiosInstance';
import { Lock, Loader2, Delete, LogIn, Power, MonitorX } from 'lucide-react'; 
import { useLanguage } from '../context/LanguageContext';

// Importar función para cerrar app en Tauri
import { exit } from '@tauri-apps/plugin-process';

export default function LoginScreen({ onLoginSuccess }) {
  const navigate = useNavigate();
  const { t } = useLanguage(); 
  
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const checkEnvironment = () => {
      // 1. Detectar si es Tauri (App de Escritorio)
      const isTauri = window.__TAURI__ || window.__TAURI_INTERNALS__ || window.navigator.userAgent.includes('Tauri');

      if (isTauri) return; 

      // 2. Si NO es Tauri, verificar si es móvil/tablet
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobile = /android|ipad|iphone|ipod|windows phone/i.test(userAgent);
      const isIpad = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;

      // 3. Si es PC Web (No móvil y no Tauri) -> Bloquear
      if (!isMobile && !isIpad) {
        setAccessDenied(true);
      }
    };

    checkEnvironment();
  }, []);

  useEffect(() => {
    if (accessDenied) return; 

    const handleKeyDown = (e) => {
      if (loading) return;
      if (e.key >= '0' && e.key <= '9') handleDigit(e.key);
      if (e.key === 'Backspace') handleBackspace();
      if (e.key === 'Enter') handleOk();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, loading, accessDenied]);

  const handleDigit = (digit) => {
    if (code.length < 4) {
        setCode(prev => prev + digit);
        setError('');
    }
  };

  const handleBackspace = () => {
      setCode(prev => prev.slice(0, -1));
      setError('');
  };

  const handleOk = async () => {
    if (code.length !== 4) {
      setError(t('login_error_len')); 
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/auth/login', { pin: code });
      const data = response.data;
      
      localStorage.setItem('token', data.access_token);
      onLoginSuccess(data);

      const bloqueoActivo = localStorage.getItem('config_bloqueo_terminal') === 'true';
      const userRoles = data.usuario?.roles || [];
      const roles = userRoles.map(r => (typeof r === 'string' ? r : r.name || r.nombre).toLowerCase());
      const esOperativo = roles.includes('mozo') || roles.includes('cajero');
      const esAdmin = roles.includes('admin') || roles.includes('administrador') || roles.includes('dueño');

      if (esOperativo) {
          navigate('/gestion-mesas');
      } else if (bloqueoActivo && !esAdmin) {
          navigate('/gestion-mesas');
      } else {
          navigate('/');
      }

    } catch (err) {
      console.error('[Login] Error:', err);
      const mensajeServer = err.response?.data?.message || err.response?.data?.error;
      if (mensajeServer) {
         setError(mensajeServer);
      } else {
         setError(t('login_error_pin') || 'Error de conexión o PIN incorrecto'); 
      }
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleExit = async () => {
    if (window.confirm(t('login_exit') + '?')) {
      try {
        await exit(0); 
      } catch (e) {
        console.warn("Fallback web exit");
        localStorage.clear();
        window.close();
        window.location.href = 'about:blank';
      }
    }
  };

  // -----------------------------------------------------
  // RENDERIZADO PANTALLA BLOQUEADA (PC WEB)
  // -----------------------------------------------------
  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 font-sans text-center">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 border border-slate-700">
           <div className="mx-auto w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
              <MonitorX size={40} />
           </div>
           
           <h2 className="text-2xl font-black text-slate-800 mb-4">Acceso Restringido</h2>
           
           <p className="text-slate-600 mb-6 leading-relaxed">
             La versión web de <strong>BillPro</strong> está optimizada exclusivamente para Tablets y Celulares.
           </p>
           
           <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mb-6">
             <p className="text-slate-500 text-sm mb-2">
               Para usar el sistema en esta computadora, es necesario utilizar la <strong>Aplicación de Escritorio</strong>.
             </p>
           </div>

           {/* MENSAJE SOLICITADO */}
           <div className="border-t border-slate-100 pt-6">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">
                Favor contacte a su proveedor de esta app
              </p>
           </div>

        </div>
      </div>
    );
  }

  // -----------------------------------------------------
  // RENDERIZADO LOGIN NORMAL
  // -----------------------------------------------------
  const baseBtn = "h-20 w-full text-3xl font-bold rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center";
  const numBtn = `${baseBtn} bg-white text-slate-700 border-b-4 border-slate-200 hover:bg-blue-50 active:border-b-0 active:translate-y-1`;
  const actionBtn = `${baseBtn} text-white active:border-b-0 active:translate-y-1`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm border border-slate-700 overflow-hidden">
        
        <div className="bg-slate-50 p-6 text-center border-b border-slate-100">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-2 text-blue-600">
            <Lock size={24} />
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
             {t('dashboard_logo')}
          </h1>
          <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">
             {t('login_title')}
          </p>
        </div>

        <div className="p-6">
          <div className="mb-6 text-center relative">
             <div className={`h-16 bg-slate-100 rounded-xl border-2 flex items-center justify-center text-4xl font-mono tracking-[0.5em] mb-2 transition-colors ${error ? 'border-red-300 bg-red-50 text-red-500' : 'border-blue-100 text-slate-800'}`}>
                {code.padEnd(4, '•').split('').map((char, i) => (
                    <span key={i} className={i < code.length ? 'text-slate-800' : 'text-slate-300 scale-75'}>
                        {i < code.length ? '●' : '○'}
                    </span>
                ))}
             </div>
             <p className="text-xs font-bold text-red-500 h-4">{error}</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {[7,8,9,4,5,6,1,2,3].map(num => (
              <button key={num} onClick={() => handleDigit(num.toString())} disabled={loading} className={numBtn}>
                {num}
              </button>
            ))}
            
            <button onClick={handleBackspace} disabled={loading} className={`${numBtn} bg-red-50 text-red-500 border-red-100 hover:bg-red-100`}>
              <Delete />
            </button>
            
            <button onClick={() => handleDigit('0')} disabled={loading} className={numBtn}>0</button>
            
            <button onClick={handleOk} disabled={loading || code.length < 4} className={`${actionBtn} ${code.length === 4 ? 'bg-green-600 border-green-800 hover:bg-green-500' : 'bg-gray-300 border-gray-400 cursor-not-allowed'}`}>
              {loading ? <Loader2 className="animate-spin"/> : <LogIn />}
              <span className="text-sm ml-2">{loading ? t('login_validating') : t('login_btn')}</span>
            </button>
          </div>

          <button onClick={handleExit} className="w-full py-3 text-gray-400 text-sm font-bold hover:text-red-500 transition-colors flex items-center justify-center gap-2">
            <Power size={16} /> {t('login_exit')}
          </button>
        </div>
        
        <div className="bg-gray-50 py-2 text-center border-t border-gray-100">
            <span className="text-[10px] text-gray-400 font-mono">
                {t('login_secure')}
            </span>
        </div>
      </div>
    </div>
  );
}
