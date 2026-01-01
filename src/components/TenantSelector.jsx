import React, { useState } from 'react';
import axios from 'axios'; // Usamos axios puro para no tener los interceptores del tenant aún
import { Building2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export default function TenantSelector({ onTenantSelected }) {
  const [tenantId, setTenantId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tenantId.trim()) return;

    setLoading(true);
    setError('');

    try {
      // 1. Obtener la variable de entorno o fallback
      let rawUrl = import.meta.env.VITE_API_URL || 'http://192.168.4.126:8000/api';
      
      // 2. CORRECCIÓN: Limpiar y asegurar que termine en /api
      // Quitamos barra final si existe
      rawUrl = rawUrl.replace(/\/$/, ""); 
      
      // Si no termina en /api, se lo agregamos
      const baseUrl = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;
      
      // 3. Hacemos la petición (Ahora sí será: http://...:8000/api/central/...)
      const res = await axios.get(`${baseUrl}/central/check-tenant/${tenantId}`);

      if (res.data.exists) {
        // Guardamos en LocalStorage
        localStorage.setItem('tenant_id', tenantId);
        // Notificamos a App.jsx
        onTenantSelected(); 
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('El ID de restaurante no existe.');
      } else {
        setError('Error de conexión con el servidor central.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <Building2 className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-800">Bienvenido a BillPro</h1>
          <p className="text-slate-500 text-sm mt-2">Ingresa el ID de tu comercio para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">ID de Restaurante</label>
            <input 
              type="text" 
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value.toLowerCase().replace(/\s/g, ''))}
              placeholder="ej: restaurante1"
              className="w-full p-4 border-2 border-slate-200 rounded-xl text-lg font-bold text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || !tenantId}
            className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Continuar <ArrowRight size={20} /></>}
          </button>
        </form>
        
        <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <p className="text-xs text-slate-400">¿No tienes un ID? Contacta a soporte.</p>
        </div>
      </div>
    </div>
  );
}
