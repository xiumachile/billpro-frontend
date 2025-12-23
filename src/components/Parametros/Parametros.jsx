// src/components/Parametros/Parametros.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ✅ IMPORTAR COMPONENTES DE CONFIGURACIÓN
import ConfiguracionCajas from './ConfiguracionCajas'; 
import ConfiguracionImpresoras from './ConfiguracionImpresoras';
import ConfiguracionComandas from './ConfiguracionComandas';
import ConfiguracionTickets from './ConfiguracionTickets';
import ConfiguracionRed from './ConfiguracionRed';
import FormasPagoManager from './FormasPagoManager';
import UnidadesMedidaManager from './UnidadesMedidaManager';
import ConfiguracionVarios from './ConfiguracionVarios';
import ConfiguracionApps from './ConfiguracionApps'; 
import ConfiguracionPrecios from './ConfiguracionPrecios'; // ✅ Importar el nuevo componente

import {
  ArrowLeft,
  Printer,
  FileText,
  Ticket,
  Wifi,
  CreditCard,
  Home,
  Clock,
  Ruler,
  ChevronRight,
  Monitor,
  Settings,
  Smartphone,
  DollarSign // ✅ Nuevo icono para precios
} from 'lucide-react';

export default function Parametros({ usuario }) {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('impresoras'); 
  const [nombreCarta, setNombreCarta] = useState('CARTA NO ACTIVA');
  const [numeroTerminal, setNumeroTerminal] = useState('POS-01');

  // Actualizar reloj cada segundo
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Cargar información del dispositivo
  useEffect(() => {
    const cargarInfoDispositivo = async () => {
      try {
        let hostname = 'unknown';
        if (typeof window !== 'undefined') {
          hostname = window.location.hostname;
        }
        let terminalId;
        if (typeof window !== 'undefined' && window.__TAURI_INTERNALS__) {
          terminalId = `POS-${hostname.replace(/[^a-zA-Z0-9]/g, '-')}`;
        } else {
          terminalId = `WEB-${hostname.replace(/[^a-zA-Z0-9]/g, '-')}`;
        }
        setNumeroTerminal(terminalId);
      } catch (error) {
        console.error('Error al obtener información del dispositivo:', error);
        setNumeroTerminal('POS-01');
      }
    };
    cargarInfoDispositivo();
  }, []);

  // Cargar carta activa
  useEffect(() => {
    const cargarCartaActiva = async () => {
      try {
        setNombreCarta('CARTA ACTIVA'); // (Aquí podrías llamar a una API real)
      } catch (error) {
        console.error('Error al cargar carta activa:', error);
        setNombreCarta('CARTA NO ACTIVA');
      }
    };
    cargarCartaActiva();
  }, []);

  // Configuración de tabs
  const tabs = [
    { 
      id: 'cajas', 
      name: 'Cajas Físicas', 
      icon: Monitor, 
      component: ConfiguracionCajas,
      description: 'Gestiona los terminales y puntos de venta'
    },
    { 
      id: 'precios', // ✅ NUEVA PESTAÑA
      name: 'Listas de Precios', 
      icon: DollarSign, 
      component: ConfiguracionPrecios,
      description: 'Configura listas (Local, Rappi, Uber, etc.)'
    },
    { 
      id: 'apps', 
      name: 'Apps Delivery', 
      icon: Smartphone, 
      component: ConfiguracionApps,
      description: 'Configura plataformas externas'
    },
    { 
      id: 'impresoras', 
      name: 'Impresoras', 
      icon: Printer, 
      component: ConfiguracionImpresoras,
      description: 'Configura las impresoras del sistema'
    },
    { 
      id: 'comandas', 
      name: 'Comandas', 
      icon: FileText, 
      component: ConfiguracionComandas,
      description: 'Configura el formato de las comandas'
    },
    { 
      id: 'tickets', 
      name: 'Tickets', 
      icon: Ticket, 
      component: ConfiguracionTickets,
      description: 'Configura el formato de los tickets'
    },
    { 
      id: 'red', 
      name: 'Red', 
      icon: Wifi, 
      component: ConfiguracionRed,
      description: 'Configura los parámetros de red'
    },
    { 
      id: 'formas-pago', 
      name: 'Formas de Pago', 
      icon: CreditCard, 
      component: FormasPagoManager,
      description: 'Gestiona las formas de pago disponibles'
    },
    { 
      id: 'unidades-medida', 
      name: 'Unidades y Conversiones', 
      icon: Ruler, 
      component: UnidadesMedidaManager,
      description: 'Gestiona unidades de medida y factores'
    },
    { 
      id: 'varios', 
      name: 'Varios / Idioma', 
      icon: Settings, 
      component: ConfiguracionVarios,
      description: 'Idioma, Bloqueo y Modo Buffet'
    },
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);
  const ActiveTabComponent = activeTabData?.component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            {/* Lado izquierdo - Navegación y título */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 font-medium group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span>Volver</span>
              </button>
              <div className="h-8 w-px bg-gray-200" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-md">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Parámetros del Sistema</h1>
                  <p className="text-sm text-gray-500">{numeroTerminal} - {nombreCarta}</p>
                </div>
              </div>
            </div>

            {/* Lado derecho - Usuario */}
            {usuario && (
              <div className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-2 rounded-lg border border-purple-100">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {typeof usuario === 'string'
                    ? usuario.charAt(0).toUpperCase()
                    : (usuario.nombre_completo || usuario.username || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-gray-500">Usuario activo</p>
                  <p className="text-sm font-semibold text-gray-700">
                    {typeof usuario === 'string'
                      ? usuario
                      : usuario.nombre_completo || usuario.username || 'Usuario'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-full mx-auto p-6 h-[calc(100vh-120px)] overflow-x-auto">
        <div className="flex gap-6 h-full min-w-max">
          
          {/* Panel Izquierdo - Sidebar */}
          <div className="w-80 space-y-4 overflow-y-auto flex-shrink-0" style={{ maxHeight: '100%' }}>
            
            {/* Card de Configuración */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <Home className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Configuración</h2>
                </div>
              </div>
              
              <div className="p-6 space-y-5">
                {/* Selector de sección */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Home className="w-4 h-4 text-purple-600" /> Sección
                  </label>
                  <div className="relative">
                    <select
                      value={activeTab}
                      onChange={(e) => setActiveTab(e.target.value)}
                      className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white hover:border-purple-300 cursor-pointer appearance-none font-medium"
                    >
                      {tabs.map(tab => (
                        <option key={tab.id} value={tab.id}>
                          {tab.name}
                        </option>
                      ))}
                    </select>
                    <ChevronRight className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                  </div>
                </div>

                {/* Lista de opciones como botones */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Accesos rápidos</label>
                  <div className="space-y-1">
                    {tabs.map(tab => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                            isActive
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                              : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600'
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-purple-600'}`} />
                          <span className="font-medium text-sm">{tab.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Card de Hora del Sistema */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-semibold text-gray-800">Hora del Sistema</h3>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">
                  {currentTime.toLocaleTimeString('es-CL')}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {currentTime.toLocaleDateString('es-CL', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>

          </div>

          {/* Panel Derecho - Contenido */}
          <div className="flex-1 min-h-0 min-w-0 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 h-full flex flex-col" style={{ minWidth: '32cm' }}>
              
              {/* Header del contenido */}
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-5 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-start gap-3">
                  {activeTabData?.icon && (
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                      {React.createElement(activeTabData.icon, { className: "w-6 h-6 text-white" })}
                    </div>
                  )}
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900">
                      {activeTabData?.name || 'Configuración'}
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                      {activeTabData?.description || 'Configura los parámetros del sistema'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contenido del tab activo */}
              <div className="p-8 overflow-auto flex-1">
                {ActiveTabComponent ? (
                  <div className="flex justify-center min-h-full">
                    <ActiveTabComponent usuario={usuario} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    {/* Mensaje vacío */}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
